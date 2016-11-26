// @flow

import Logger from './logger';
import Server from './server';
import util from './utilities';
import db from './database';
import InfoGetter from './get-info';
import Config from './config';
import ACP from './acp';
import Account from './account';
import Flags from './flags';
import events from 'events';
const EventEmitter = events.EventEmitter;

class User extends EventEmitter {
    flags: any;
    socket: any;
    realip: any;
    displayip: any;
    hostmask: any;
    channel: any;
    queueLimiter: any;
    chatLimiter: any;
    reqPlaylistLimiter: any;
    awaytimer: any;
    account: Account.Account;
    registrationTime: Date;
    __evHandlers: any;
    dead: bool;

    constructor(socket: any) {
        super();
        this.flags = 0;
        this.socket = socket;
        this.realip = socket._realip;
        this.displayip = socket._displayip;
        this.hostmask = socket._hostmask;
        this.channel = null;
        this.queueLimiter = util.newRateLimiter();
        this.chatLimiter = util.newRateLimiter();
        this.reqPlaylistLimiter = util.newRateLimiter();
        this.awaytimer = false;
        if (socket.user) {
            this.account = new Account.Account(this.realip, socket.user, socket.aliases);
            this.registrationTime = new Date(this.account.user.time);
        } else {
            this.account = new Account.Account(this.realip, null, socket.aliases);
        }

        var announcement = Server.getServer().announcement;
        if (announcement != null) {
            this.socket.emit("announcement", announcement);
        }
        var self = this;

        this.socket.once("joinChannel", function (data) {
            if (typeof data !== "object" || typeof data.name !== "string") {
                return;
            }

            if (self.inChannel()) {
                return;
            }

            if (!util.isValidChannelName(data.name)) {
                self.socket.emit("errorMsg", {
                    msg: "Invalid channel name.  Channel names may consist of 1-30 " +
                         "characters in the set a-z, A-Z, 0-9, -, and _"
                });
                self.kick("Invalid channel name");
                return;
            }

            data.name = data.name.toLowerCase();
            if (data.name in Config.get("channel-blacklist")) {
                self.kick("This channel is blacklisted.");
                return;
            }

            self.waitFlag(Flags.U_READY, function () {
                var chan;
                try {
                    chan = Server.getServer().getChannel(data.name);
                } catch (error) {
                    if (error.code !== 'EWRONGPART') {
                        throw error;
                    }

                    self.socket.emit("errorMsg", {
                        msg: "Channel '" + data.name + "' is hosted on another server.  " +
                             "Try refreshing the page to update the connection URL."
                    });
                    return;
                }

                if (!chan.is(Flags.C_READY)) {
                    chan.once("loadFail", reason => {
                        self.socket.emit("errorMsg", {
                            msg: reason,
                            alert: true
                        });
                        self.kick(`Channel could not be loaded: ${reason}`);
                    });
                }
                chan.joinUser(self, data);
            });
        });

        this.socket.once("initACP", function () {
            self.waitFlag(Flags.U_LOGGED_IN, function () {
                if (self.account.globalRank >= 255) {
                    ACP.init(self);
                } else {
                    self.kick("Attempted initACP from non privileged user.  This incident " +
                              "will be reported.");
                    Logger.eventlog.log("[acp] Attempted initACP from socket client " +
                                        self.getName() + "@" + self.realip);
                }
            });
        });

        this.socket.on("login", function (data) {
            data = (typeof data === "object") ? data : {};

            var name = data.name;
            if (typeof name !== "string") {
                return;
            }

            var pw = data.pw || "";
            if (typeof pw !== "string") {
                pw = "";
            }

            if (self.is(Flags.U_LOGGING_IN) || self.is(Flags.U_LOGGED_IN)) {
                return;
            }

            if (!pw) {
                self.guestLogin(name);
            } else {
                self.login(name, pw);
            }
        });

        this.on("login", function (account) {
            if (account.globalRank >= 255) {
                self.initAdminCallbacks();
            }
        });
    }

    die(): void {
        for (var key in this.socket._events) {
            delete this.socket._events[key];
        }

        delete this.socket.typecheckedOn;
        delete this.socket.typecheckedOnce;

        for (var key in this.__evHandlers) {
            delete this.__evHandlers[key];
        }

        if (this.awaytimer) {
            clearTimeout(this.awaytimer);
        }

        this.dead = true;
    }

    is(flag: any): bool {
        return Boolean(this.flags & flag);
    }

    setFlag(flag: any): void {
        this.flags |= flag;
        this.emit("setFlag", flag);
    }

    clearFlag(flag: any): void {
        this.flags &= ~flag;
        this.emit("clearFlag", flag);
    }

    waitFlag(flag: any, cb: any): void {
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

    getName(): string {
        return this.account.name;
    }

    getLowerName(): string {
        return this.account.lowername;
    }

    inChannel(): bool {
        return this.channel != null && !this.channel.dead;
    }

    inRegisteredChannel(): bool {
        return this.inChannel() && this.channel.is(Flags.C_REGISTERED);
    }

    /* Called when a user's AFK status changes */
    setAFK(afk: any): void {
        if (!this.inChannel()) {
            return;
        }

        /* No change in AFK status, don't need to change anything */
        if (this.is(Flags.U_AFK) === afk) {
            this.autoAFK();
            return;
        }

        if (afk) {
            this.setFlag(Flags.U_AFK);
            if (this.channel.modules.voteskip) {
                this.channel.modules.voteskip.unvote(this.realip);
            }
        } else {
            this.clearFlag(Flags.U_AFK);
            this.autoAFK();
        }

        /* Number of AFK users changed, voteskip state changes */
        if (this.channel.modules.voteskip) {
            this.channel.modules.voteskip.update();
        }

        this.channel.broadcastAll("setAFK", {
            name: this.getName(),
            afk: afk
        });
    }

    /* Automatically tag a user as AFK after a period of inactivity */
    autoAFK(): void {
        var self = this;
        if (self.awaytimer) {
            clearTimeout(self.awaytimer);
        }

        if (!self.inChannel() || !self.channel.modules.options) {
            return;
        }

        /* Don't set a timer if the duration is invalid */
        var timeout = parseFloat(self.channel.modules.options.get("afk_timeout"));
        if (isNaN(timeout) || timeout <= 0) {
            return;
        }

        self.awaytimer = setTimeout(function () {
            self.setAFK(true);
        }, timeout * 1000);
    }

    kick(reason: string|void): void {
        this.socket.emit("kick", { reason: reason });
        this.socket.disconnect();
    }

    initAdminCallbacks(): void {
        var self = this;
        self.socket.on("borrow-rank", function (rank) {
            if (self.inChannel()) {
                if (typeof rank !== "number") {
                    return;
                }

                if (rank > self.account.globalRank) {
                    return;
                }

                if (rank === 255 && self.account.globalRank > 255) {
                    rank = self.account.globalRank;
                }

                self.account.channelRank = rank;
                self.account.effectiveRank = rank;
                self.socket.emit("rank", rank);
                self.channel.broadcastAll("setUserRank", {
                    name: self.getName(),
                    rank: rank
                });
            }
        });
    }

    login(name: string, pw: string): void {
        var self = this;
        self.setFlag(Flags.U_LOGGING_IN);

        db.users.verifyLogin(name, pw, function (err, user) {
            if (err) {
                if (err === "Invalid username/password combination") {
                    Logger.eventlog.log("[loginfail] Login failed (bad password): " + name
                                      + "@" + self.realip);
                }

                self.socket.emit("login", {
                    success: false,
                    error: err
                });
                self.clearFlag(Flags.U_LOGGING_IN);
                return;
            }

            self.account.user = user;
            self.account.update();
            self.socket.emit("rank", self.account.effectiveRank);
            self.emit("effectiveRankChange", self.account.effectiveRank);
            self.registrationTime = new Date(user.time);
            self.setFlag(Flags.U_REGISTERED);
            self.socket.emit("login", {
                success: true,
                name: user.name
            });
            db.recordVisit(self.realip, self.getName());
            Logger.syslog.log(self.realip + " logged in as " + user.name);
            self.setFlag(Flags.U_LOGGED_IN);
            self.clearFlag(Flags.U_LOGGING_IN);
            self.emit("login", self.account);
        });
    }

    guestLogin(name: string): void {
        var self = this;

        if (self.realip in lastguestlogin) {
            var diff = (Date.now() - lastguestlogin[self.realip]) / 1000;
            if (diff < Config.get("guest-login-delay")) {
                self.socket.emit("login", {
                    success: false,
                    error: "Guest logins are restricted to one per IP address per " +
                           Config.get("guest-login-delay") + " seconds."
                });
                return;
            }
        }

        if (!util.isValidUserName(name)) {
            self.socket.emit("login", {
                success: false,
                error: "Invalid username.  Usernames must be 1-20 characters long and " +
                       "consist only of characters a-z, A-Z, 0-9, -, or _."
            });
            return;
        }

        // Prevent duplicate logins
        self.setFlag(Flags.U_LOGGING_IN);
        db.users.isUsernameTaken(name, function (err, taken) {
            self.clearFlag(Flags.U_LOGGING_IN);
            if (err) {
                self.socket.emit("login", {
                    success: false,
                    error: err
                });
                return;
            }

            if (taken) {
                self.socket.emit("login", {
                    success: false,
                    error: "That username is registered."
                });
                return;
            }

            if (self.inChannel()) {
                var nameLower = name.toLowerCase();
                for (var i = 0; i < self.channel.users.length; i++) {
                    if (self.channel.users[i].getLowerName() === nameLower) {
                        self.socket.emit("login", {
                            success: false,
                            error: "That name is already in use on this channel."
                        });
                        return;
                    }
                }
            }

            // Login succeeded
            lastguestlogin[self.realip] = Date.now();

            self.account.guestName = name;
            self.account.update();
            self.socket.emit("rank", self.account.effectiveRank);
            self.emit("effectiveRankChange", self.account.effectiveRank);
            self.socket.emit("login", {
                success: true,
                name: name,
                guest: true
            });
            db.recordVisit(self.realip, self.getName());
            Logger.syslog.log(self.realip + " signed in as " + name);
            self.setFlag(Flags.U_LOGGED_IN);
            self.emit("login", self.account);
        });
    }

    getFirstSeenTime(): number {
        if (this.registrationTime && this.socket.ipSessionFirstSeen) {
            return Math.min(this.registrationTime.getTime(), this.socket.ipSessionFirstSeen.getTime());
        } else if (this.registrationTime) {
            return this.registrationTime.getTime();
        } else if (this.socket.ipSessionFirstSeen) {
            return this.socket.ipSessionFirstSeen.getTime();
        } else {
            Logger.errlog.log(`User "${this.getName()}" (IP: ${this.realip}) has neither ` +
                    "an IP sesion first seen time nor a registered account.");
            return Date.now();
        }
    }

    setChannelRank(rank: number): void {
        const changed = this.account.effectiveRank !== rank;
        this.account.channelRank = rank;
        this.account.update();
        this.socket.emit("rank", this.account.effectiveRank);
        if (changed) {
            this.emit("effectiveRankChange", this.account.effectiveRank);
        }
    }
}

var lastguestlogin = {};

/* Clean out old login throttlers to save memory */
setInterval(function () {
    var delay = Config.get("guest-login-delay");
    for (var ip in lastguestlogin) {
        var diff = (Date.now() - lastguestlogin[ip]) / 1000;
        if (diff > delay) {
            delete lastguestlogin[ip];
        }
    }

    if (Config.get("aggressive-gc") && global && global.gc) {
        global.gc();
    }
}, 5 * 60 * 1000);

export default User;
