// @flow
import type { Flags } from '../flags';

import Logger from '../logger';
import ChannelModule from './module';
import Flag from '../flags';
import Account from '../account';
import util from '../utilities';
import fs from 'graceful-fs';
import path from 'path';
import sio from 'socket.io';
import db from '../database';
import * as ChannelStore from '../channel-storage/channelstore';
import { ChannelStateSizeError } from '../errors';
import Promise from 'bluebird';
import events from 'events';
const EventEmitter = events.EventEmitter;
import { throttle } from '../util/throttle';
import User from '../user';

const USERCOUNT_THROTTLE = 10000;

class ReferenceCounter {
    channel: Channel;
    channelName: string;
    refCount: number;
    references: { [key: mixed]: number };

    constructor(channel: Channel) {
        this.channel = channel;
        this.channelName = channel.name;
        this.refCount = 0;
        this.references = {};
    }

    ref(caller) {
        if (caller) {
            if (this.references.hasOwnProperty(caller)) {
                this.references[caller]++;
            } else {
                this.references[caller] = 1;
            }
        }

        this.refCount++;
    }

    unref(caller) {
        if (caller) {
            if (this.references.hasOwnProperty(caller)) {
                this.references[caller]--;
                if (this.references[caller] === 0) {
                    delete this.references[caller];
                }
            } else {
                Logger.errlog.log("ReferenceCounter::unref() called by caller [" +
                        caller + "] but this caller had no active references! " +
                        `(channel: ${this.channelName})`);
            }
        }

        this.refCount--;
        this.checkRefCount();
    }

    checkRefCount() {
        if (this.refCount === 0) {
            if (Object.keys(this.references).length > 0) {
                Logger.errlog.log("ReferenceCounter::refCount reached 0 but still had " +
                        "active references: " +
                        JSON.stringify(Object.keys(this.references)) +
                        ` (channel: ${this.channelName})`);
                for (var caller in this.references) {
                    this.refCount += this.references[caller];
                }
            } else if (this.channel.users.length > 0) {
                Logger.errlog.log("ReferenceCounter::refCount reached 0 but still had " +
                        this.channel.users.length + " active users" +
                        ` (channel: ${this.channelName})`);
                this.refCount = this.channel.users.length;
            } else {
                this.channel.emit("empty");
            }
        }
    }
}

class Channel extends EventEmitter {
    name: string;
    uniqueName: string;
    modules: any;
    logger: Logger.Logger;
    users: User[];
    refCounter: ReferenceCounter;
    flags: Flags;
    id: mixed;
    broadcastUsercount: () => mixed;
    _getDiskSizeTimeout: number;
    _cachedDiskSize: mixed;
    leader: any;

    constructor(name: string) {
        super();
        this.name = name;
        this.uniqueName = name.toLowerCase();
        this.modules = {};
        this.logger = new Logger.Logger(path.join(__dirname, "..", "..", "chanlogs",
                                                  this.uniqueName + ".log"));
        this.users = [];
        this.refCounter = new ReferenceCounter(this);
        this.flags = 0;
        this.id = 0;
        this.broadcastUsercount = throttle(() => {
            this.broadcastAll("usercount", this.users.length);
        }, USERCOUNT_THROTTLE);
        var self = this;
        db.channels.load(this, function (err) {
            if (err && err !== "Channel is not registered") {
                self.emit("loadFail", "Failed to load channel data from the database");
                // Force channel to be unloaded, so that it will load properly when
                // the database connection comes back
                self.emit("empty");
                return;
            } else {
                self.initModules();
                self.loadState();
            }
        });
    }

    is(flag: Flags): bool {
        return Boolean(this.flags & flag);
    }

    setFlag(flag: Flags): void {
        this.flags |= flag;
        this.emit("setFlag", flag);
    }

    clearFlag(flag: Flags): void {
        this.flags &= ~flag;
        this.emit("clearFlag", flag);
    }

    waitFlag(flag: Flags, cb: any): void {
        var self = this;
        if (self.is(flag)) {
            cb();
        } else {
            var wait = function (f) {
                if (f === flag) {
                    self.removeListener("setFlag", wait);
                    cb();
                }
            };
            self.on("setFlag", wait);
        }
    }

    moderators(): User[] {
        return this.users.filter(function (u) {
            return u.account.effectiveRank >= 2;
        });
    }

    initModules(): void {
        const modules = {
            "./permissions"   : "permissions",
            "./emotes"        : "emotes",
            "./chat"          : "chat",
            "./drink"         : "drink",
            "./filters"       : "filters",
            "./customization" : "customization",
            "./opts"          : "options",
            "./library"       : "library",
            "./playlist"      : "playlist",
            "./mediarefresher": "mediarefresher",
            "./voteskip"      : "voteskip",
            "./poll"          : "poll",
            "./kickban"       : "kickban",
            "./ranks"         : "rank",
            "./accesscontrol" : "password"
        };

        var self = this;
        var inited = [];
        Object.keys(modules).forEach(function (m) {
            // $FlowIgnore
            var ctor = require(m);
            var module = new ctor(self);
            self.modules[modules[m]] = module;
            inited.push(modules[m]);
        });

        self.logger.log("[init] Loaded modules: " + inited.join(", "));
    }

    getDiskSize(cb: any): void {
        if (this._getDiskSizeTimeout > Date.now()) {
            return cb(null, this._cachedDiskSize);
        }

        var self = this;
        var file = path.join(__dirname, "..", "..", "chandump", self.uniqueName);
        fs.stat(file, function (err, stats) {
            if (err) {
                return cb(err);
            }

            self._cachedDiskSize = stats.size;
            cb(null, self._cachedDiskSize);
        });
    }

    loadState(): void {
        /* Don't load from disk if not registered */
        if (!this.is(Flag.C_REGISTERED)) {
            this.modules.permissions.loadUnregistered();
            this.setFlag(Flag.C_READY);
            return;
        }

        const self = this;
        function errorLoad(msg) {
            if (self.modules.customization) {
                self.modules.customization.load({
                    motd: msg
                });
            }

            self.setFlag(Flag.C_READY | Flag.C_ERROR);
        }

        ChannelStore.load(this.id, this.uniqueName).then(data => {
            Object.keys(this.modules).forEach(m => {
                try {
                    this.modules[m].load(data);
                } catch (e) {
                    Logger.errlog.log("Failed to load module " + m + " for channel " +
                            this.uniqueName);
                }
            });

            this.setFlag(Flag.C_READY);
        }).catch(ChannelStateSizeError, err => {
            const message = "This channel's state size has exceeded the memory limit " +
                    "enforced by this server.  Please contact an administrator " +
                    "for assistance.";

            Logger.errlog.log(err.stack);
            errorLoad(message);
        }).catch(err => {
            if (err.code === 'ENOENT') {
                Object.keys(this.modules).forEach(m => {
                    this.modules[m].load({});
                });
                this.setFlag(Flag.C_READY);
                return;
            } else {
                const message = "An error occurred when loading this channel's data from " +
                        "disk.  Please contact an administrator for assistance.  " +
                        `The error was: ${err}`;

                Logger.errlog.log(err.stack);
                errorLoad(message);
            }
        });
    }

    saveState(): void {
        if (!this.is(Flag.C_REGISTERED)) {
            return Promise.resolve();
        } else if (!this.is(Flag.C_READY)) {
            return Promise.reject(new Error(`Attempted to save channel ${this.name} ` +
                    `but it wasn't finished loading yet!`));
        }

        if (this.is(Flag.C_ERROR)) {
            return Promise.reject(new Error(`Channel is in error state`));
        }

        this.logger.log("[init] Saving channel state to disk");
        const data = {};
        Object.keys(this.modules).forEach(m => {
            this.modules[m].save(data);
        });

        return ChannelStore.save(this.id, this.uniqueName, data)
                .catch(ChannelStateSizeError, err => {
            this.users.forEach(u => {
                if (u.account.effectiveRank >= 2) {
                    u.socket.emit("warnLargeChandump", {
                        limit: err.limit,
                        actual: err.actual
                    });
                }
            });

            throw err;
        });
    }

    checkModules(fn: string, args: mixed[], cb: any): void {
        const self = this;
        const refCaller = `Channel::checkModules/${fn}`;
        this.waitFlag(Flag.C_READY, function () {
            self.refCounter.ref(refCaller);
            var keys = Object.keys(self.modules);
            var next = function (err, result) {
                if (result !== ChannelModule.PASSTHROUGH) {
                    /* Either an error occured, or the module denied the user access */
                    cb(err, result);
                    self.refCounter.unref(refCaller);
                    return;
                }

                var m = keys.shift();
                if (m === undefined) {
                    /* No more modules to check */
                    cb(null, ChannelModule.PASSTHROUGH);
                    self.refCounter.unref(refCaller);
                    return;
                }

                var module = self.modules[m];
                module[fn].apply(module, args);
            };

            args.push(next);
            next(null, ChannelModule.PASSTHROUGH);
        });
    }

    notifyModules(fn: mixed, args: mixed): void {
        var self = this;
        this.waitFlag(Flag.C_READY, function () {
            var keys = Object.keys(self.modules);
            keys.forEach(function (k) {
                self.modules[k][fn].apply(self.modules[k], args);
            });
        });
    }

    joinUser(user: User, data: mixed): void {
        const self = this;

        self.refCounter.ref("Channel::user");
        self.waitFlag(Flag.C_READY, function () {
            /* User closed the connection before the channel finished loading */
            if (user.socket.disconnected) {
                self.refCounter.unref("Channel::user");
                return;
            }

            user.channel = self;
            user.waitFlag(Flag.U_LOGGED_IN, () => {
                if (user.is(Flag.U_REGISTERED)) {
                    db.channels.getRank(self.name, user.getName(), (error, rank) => {
                        if (!error) {
                            user.setChannelRank(rank);
                            user.setFlag(Flag.U_HAS_CHANNEL_RANK);
                            if (user.inChannel()) {
                                self.broadcastAll("setUserRank", {
                                    name: user.getName(),
                                    rank: rank
                                });
                            }
                        }
                    });
                }
            });

            if (user.socket.disconnected) {
                self.refCounter.unref("Channel::user");
                return;
            } else if (self.dead) {
                return;
            }

            self.checkModules("onUserPreJoin", [user, data], function (err, result) {
                if (result === ChannelModule.PASSTHROUGH) {
                    user.channel = self;
                    self.acceptUser(user);
                } else {
                    user.channel = null;
                    user.account.channelRank = 0;
                    user.account.effectiveRank = user.account.globalRank;
                    self.refCounter.unref("Channel::user");
                }
            });
        });
    }

    acceptUser(user: User): void {
        user.setFlag(Flag.U_IN_CHANNEL);
        user.socket.join(this.name);
        user.autoAFK();
        user.socket.on("readChanLog", this.handleReadLog.bind(this, user));

        Logger.syslog.log(user.realip + " joined " + this.name);
        if (user.socket._isUsingTor) {
            if (this.modules.options && this.modules.options.get("torbanned")) {
                user.kick("This channel has banned connections from Tor.");
                this.logger.log("[login] Blocked connection from Tor exit at " +
                                user.displayip);
                return;
            }

            this.logger.log("[login] Accepted connection from Tor exit at " +
                            user.displayip);
        } else {
            this.logger.log("[login] Accepted connection from " + user.displayip);
        }

        var self = this;
        user.waitFlag(Flag.U_LOGGED_IN, function () {
            for (var i = 0; i < self.users.length; i++) {
                if (self.users[i] !== user &&
                    self.users[i].getLowerName() === user.getLowerName()) {
                    self.users[i].kick("Duplicate login");
                }
            }

            var loginStr = "[login] " + user.displayip + " logged in as " + user.getName();
            if (user.account.globalRank === 0) loginStr += " (guest)";
            loginStr += " (aliases: " + user.account.aliases.join(",") + ")";
            self.logger.log(loginStr);
            self.sendUserJoin(self.users, user);
        });

        this.users.push(user);

        user.socket.on("disconnect", this.partUser.bind(this, user));
        Object.keys(this.modules).forEach(function (m) {
            if (user.dead) return;
            self.modules[m].onUserPostJoin(user);
        });

        this.sendUserlist([user]);
        this.broadcastUsercount();
        if (!this.is(Flag.C_REGISTERED)) {
            user.socket.emit("channelNotRegistered");
        }
    };

    partUser(user: User): void {
        if (!this.logger) {
            Logger.errlog.log("partUser called on dead channel");
            return;
        }

        this.logger.log("[login] " + user.displayip + " (" + user.getName() + ") " +
                        "disconnected.");
        user.channel = null;
        /* Should be unnecessary because partUser only occurs if the socket dies */
        user.clearFlag(Flag.U_IN_CHANNEL);

        if (user.is(Flag.U_LOGGED_IN)) {
            this.broadcastAll("userLeave", { name: user.getName() });
        }

        var idx = this.users.indexOf(user);
        if (idx >= 0) {
            this.users.splice(idx, 1);
        }

        var self = this;
        Object.keys(this.modules).forEach(function (m) {
            self.modules[m].onUserPart(user);
        });
        this.broadcastUsercount();

        this.refCounter.unref("Channel::user");
        user.die();
    }

    packUserData(user: User): { base: { meta: mixed },
                                mod: { meta: mixed },
                                sadmin: { meta: mixed } } {
        var base = {
            name: user.getName(),
            rank: user.account.effectiveRank,
            profile: user.account.profile,
            meta: {
                afk: user.is(Flag.U_AFK),
                muted: user.is(Flag.U_MUTED) && !user.is(Flag.U_SMUTED)
            }
        };

        var mod = {
            name: user.getName(),
            rank: user.account.effectiveRank,
            profile: user.account.profile,
            meta: {
                afk: user.is(Flag.U_AFK),
                muted: user.is(Flag.U_MUTED),
                smuted: user.is(Flag.U_SMUTED),
                aliases: user.account.aliases,
                ip: user.displayip
            }
        };

        var sadmin = {
            name: user.getName(),
            rank: user.account.effectiveRank,
            profile: user.account.profile,
            meta: {
                afk: user.is(Flag.U_AFK),
                muted: user.is(Flag.U_MUTED),
                smuted: user.is(Flag.U_SMUTED),
                aliases: user.account.aliases,
                ip: user.realip
            }
        };

        return {
            base: base,
            mod: mod,
            sadmin: sadmin
        };
    }

    sendUserMeta(users: User[], user: User, minrank: mixed): void {
        var self = this;
        var userdata = self.packUserData(user);
        users.filter(function (u) {
            return typeof minrank !== "number" || u.account.effectiveRank > minrank
        }).forEach(function (u) {
            if (u.account.globalRank >= 255)  {
                u.socket.emit("setUserMeta", {
                    name: user.getName(),
                    meta: userdata.sadmin.meta
                });
            } else if (u.account.effectiveRank >= 2) {
                u.socket.emit("setUserMeta", {
                    name: user.getName(),
                    meta: userdata.mod.meta
                });
            } else {
                u.socket.emit("setUserMeta", {
                    name: user.getName(),
                    meta: userdata.base.meta
                });
            }
        });
    }

    sendUserProfile(users: User[], user: User): void {
        var packet = {
            name: user.getName(),
            profile: user.account.profile
        };

        users.forEach(function (u) {
            u.socket.emit("setUserProfile", packet);
        });
    }

    sendUserlist(toUsers: User[]): void {
        var self = this;
        var base = [];
        var mod = [];
        var sadmin = [];

        for (var i = 0; i < self.users.length; i++) {
            var u = self.users[i];
            if (u.getName() === "") {
                continue;
            }

            var data = self.packUserData(self.users[i]);
            base.push(data.base);
            mod.push(data.mod);
            sadmin.push(data.sadmin);
        }

        toUsers.forEach(function (u) {
            if (u.account.globalRank >= 255) {
                u.socket.emit("userlist", sadmin);
            } else if (u.account.effectiveRank >= 2) {
                u.socket.emit("userlist", mod);
            } else {
                u.socket.emit("userlist", base);
            }

            if (self.leader != null) {
                u.socket.emit("setLeader", self.leader.name);
            }
        });
    }

    sendUsercount(users: User[]): void {
        var self = this;
        if (users === self.users) {
            self.broadcastAll("usercount", self.users.length);
        } else {
            users.forEach(function (u) {
                u.socket.emit("usercount", self.users.length);
            });
        }
    }

    sendUserJoin(users: User[], user: User): void {
        var self = this;
        if (user.account.aliases.length === 0) {
            user.account.aliases.push(user.getName());
        }

        var data = self.packUserData(user);

        users.forEach(function (u) {
            if (u.account.globalRank >= 255) {
                u.socket.emit("addUser", data.sadmin);
            } else if (u.account.effectiveRank >= 2) {
                u.socket.emit("addUser", data.mod);
            } else {
                u.socket.emit("addUser", data.base);
            }
        });

        self.modules.chat.sendModMessage(user.getName() + " joined (aliases: " +
                                         user.account.aliases.join(",") + ")", 2);
    }

    readLog(cb: any): void {
        const maxLen = 102400;
        const file = this.logger.filename;
        this.refCounter.ref("Channel::readLog");
        const self = this;
        fs.stat(file, function (err, data) {
            if (err) {
                self.refCounter.unref("Channel::readLog");
                return cb(err, null);
            }

            const start = Math.max(data.size - maxLen, 0);
            const end = data.size - 1;

            const read = fs.createReadStream(file, {
                start: start,
                end: end
            });

            var buffer = "";
            read.on("data", function (data) {
                buffer += data;
            });
            read.on("end", function () {
                cb(null, buffer);
                self.refCounter.unref("Channel::readLog");
            });
        });
    }

    handleReadLog(user: User): void {
        if (user.account.effectiveRank < 3) {
            user.kick("Attempted readChanLog with insufficient permission");
            return;
        }

        if (!this.is(Flag.C_REGISTERED)) {
            user.socket.emit("readChanLog", {
                success: false,
                data: "Channel log is only available to registered channels."
            });
            return;
        }

        var shouldMaskIP = user.account.globalRank < 255;
        this.readLog(function (err, data) {
            if (err) {
                user.socket.emit("readChanLog", {
                    success: false,
                    data: "Error reading channel log"
                });
            } else {
                user.socket.emit("readChanLog", {
                    success: true,
                    data: data
                });
            }
        });
    }

    broadcastToRoom(msg: mixed, data: mixed, ns: mixed): void {
        sio.instance.in(ns).emit(msg, data);
    }

    broadcastAll(msg: mixed, data: mixed): void {
        this.broadcastToRoom(msg, data, this.name);
    }

    packInfo(isAdmin: bool): mixed {
        var data = {};
        data.name = this.name;
        data.usercount = this.users.length;
        data.users = [];
        data.registered = this.is(Flag.C_REGISTERED);

        for (var i = 0; i < this.users.length; i++) {
            if (this.users[i].getName() !== "") {
                var name = this.users[i].getName();
                var rank = this.users[i].account.effectiveRank;
                if (rank >= 255) {
                    name = "!" + name;
                } else if (rank >= 4) {
                    name = "~" + name;
                } else if (rank >= 3) {
                    name = "&" + name;
                } else if (rank >= 2) {
                    name = "@" + name;
                }
                data.users.push(name);
            }
        }

        if (isAdmin) {
            data.activeLockCount = this.refCounter.refCount;
        }

        var self = this;
        var keys = Object.keys(this.modules);
        keys.forEach(function (k) {
            self.modules[k].packInfo(data, isAdmin);
        });

        return data;
    }
}

export default Channel;
