// @flow

import ChannelModule from './module';
import db from '../database';
import Flags from '../flags';
import util from '../utilities';
import Account from '../account';
import Q from 'q';
import User from '../user';

const TYPE_UNBAN = {
    id: "number",
    name: "string"
};

function checkIPBan(cname, ip, cb) {
    db.channels.isIPBanned(cname, ip, function (err, banned) {
        if (err) {
            cb(false);
        } else {
            cb(banned);
        }
    });
}

function checkNameBan(cname, name, cb) {
    db.channels.isNameBanned(cname, name, function (err, banned) {
        if (err) {
            cb(false);
        } else {
            cb(banned);
        }
    });
}

class KickBanModule extends ChannelModule {
    constructor(channel: any) {
        super(channel);

        if (this.channel.modules.chat) {
            this.channel.modules.chat.registerCommand("/kick", this.handleCmdKick.bind(this));
            this.channel.modules.chat.registerCommand("/kickanons", this.handleCmdKickAnons.bind(this));
            this.channel.modules.chat.registerCommand("/ban", this.handleCmdBan.bind(this));
            this.channel.modules.chat.registerCommand("/ipban", this.handleCmdIPBan.bind(this));
            this.channel.modules.chat.registerCommand("/banip", this.handleCmdIPBan.bind(this));
        }
    }

    onUserPreJoin(user: User, data: any, cb: any): void {
        if (!this.channel.is(Flags.C_REGISTERED)) {
            return cb(null, ChannelModule.PASSTHROUGH);
        }

        var cname = this.channel.name;
        checkIPBan(cname, user.realip, function (banned) {
            if (banned) {
                cb(null, ChannelModule.DENY);
                user.kick("Your IP address is banned from this channel.");
            } else {
                checkNameBan(cname, user.getName(), function (banned) {
                    if (banned) {
                        cb(null, ChannelModule.DENY);
                        user.kick("Your username is banned from this channel.");
                    } else {
                        cb(null, ChannelModule.PASSTHROUGH);
                    }
                });
            }
        });
    }

    onUserPostJoin(user: User): void {
        if (!this.channel.is(Flags.C_REGISTERED)) {
            return;
        }

        const chan = this.channel;
        const refCaller = "KickBanModule::onUserPostJoin";
        user.waitFlag(Flags.U_LOGGED_IN, function () {
            chan.refCounter.ref(refCaller);
            db.channels.isNameBanned(chan.name, user.getName(), function (err, banned) {
                if (!err && banned) {
                    user.kick("You are banned from this channel.");
                    if (chan.modules.chat) {
                        chan.modules.chat.sendModMessage(user.getName() + " was kicked (" +
                                                         "name is banned)");
                    }
                }
                chan.refCounter.unref(refCaller);
            });
        });

        var self = this;
        user.socket.on("requestBanlist", function () { self.sendBanlist([user]); });
        user.socket.typecheckedOn("unban", TYPE_UNBAN, this.handleUnban.bind(this, user));
    }

    sendBanlist(users: User[]): void {
        if (!this.channel.is(Flags.C_REGISTERED)) {
            return;
        }

        var perms = this.channel.modules.permissions;

        var bans = [];
        var unmaskedbans = [];
        db.channels.listBans(this.channel.name, function (err, banlist) {
            if (err) {
                return;
            }

            for (var i = 0; i < banlist.length; i++) {
                bans.push({
                    id: banlist[i].id,
                    ip: banlist[i].ip === "*" ? "*" : util.cloakIP(banlist[i].ip),
                    name: banlist[i].name,
                    reason: banlist[i].reason,
                    bannedby: banlist[i].bannedby
                });
                unmaskedbans.push({
                    id: banlist[i].id,
                    ip: banlist[i].ip,
                    name: banlist[i].name,
                    reason: banlist[i].reason,
                    bannedby: banlist[i].bannedby
                });
            }

            users.forEach(function (u) {
                if (!perms.canBan(u)) {
                    return;
                }

                if (u.account.effectiveRank >= 255) {
                    u.socket.emit("banlist", unmaskedbans);
                } else {
                    u.socket.emit("banlist", bans);
                }
            });
        });
    }

    sendUnban(users: User[], data: any): void {
        var perms = this.channel.modules.permissions;
        users.forEach(function (u) {
            if (perms.canBan(u)) {
                u.socket.emit("banlistRemove", data);
            }
        });
    }

    handleCmdKick(user: User, msg: any, meta: any): void {
        if (!this.channel.modules.permissions.canKick(user)) {
            return;
        }

        var args = msg.split(" ");
        args.shift(); /* shift off /kick */
        if (args.length === 0 || args[0].trim() === "") {
            return user.socket.emit("errorMsg", {
                msg: "No kick target specified.  If you're trying to kick " +
                     "anonymous users, use /kickanons"
            });
        }
        var name = args.shift().toLowerCase();
        var reason = args.join(" ");
        var target = null;

        for (var i = 0; i < this.channel.users.length; i++) {
            if (this.channel.users[i].getLowerName() === name) {
                target = this.channel.users[i];
                break;
            }
        }

        if (target === null) {
            return;
        }

        if (target.account.effectiveRank >= user.account.effectiveRank
            || target.account.globalRank > user.account.globalRank) {
            return user.socket.emit("errorMsg", {
                msg: "You do not have permission to kick " + target.getName()
            });
        }

        target.kick(reason);
        this.channel.logger.log("[mod] " + user.getName() + " kicked " + target.getName() +
                                " (" + reason + ")");
        if (this.channel.modules.chat) {
            this.channel.modules.chat.sendModMessage(user.getName() + " kicked " +
                                                     target.getName());
        }
    }

    handleCmdKickAnons(user: User, msg: any, meta: any): void {
        if (!this.channel.modules.permissions.canKick(user)) {
            return;
        }

        var users = Array.prototype.slice.call(this.channel.users);
        users.forEach(function (u) {
            if (!u.is(Flags.U_LOGGED_IN)) {
                u.kick("anonymous user");
            }
        });

        this.channel.logger.log("[mod] " + user.getName() + " kicked anonymous users.");
        if (this.channel.modules.chat) {
            this.channel.modules.chat.sendModMessage(user.getName() + " kicked anonymous " +
                                                     "users");
        }
    }

    /* /ban - name bans */
    handleCmdBan(user: User, msg: any, meta: any): void {
        var args = msg.split(" ");
        args.shift(); /* shift off /ban */
        if (args.length === 0 || args[0].trim() === "") {
            return user.socket.emit("errorMsg", {
                msg: "No ban target specified."
            });
        }
        var name = args.shift().toLowerCase();
        var reason = args.join(" ");

        const chan = this.channel;
        chan.refCounter.ref("KickBanModule::handleCmdBan");
        this.banName(user, name, reason, function (err) {
            chan.refCounter.unref("KickBanModule::handleCmdBan");
        });
    }

    /* /ipban - bans name and IP addresses associated with it */
    handleCmdIPBan(user: User, msg: any, meta: any): void {
        var args = msg.split(" ");
        args.shift(); /* shift off /ipban */
        if (args.length === 0 || args[0].trim() === "") {
            return user.socket.emit("errorMsg", {
                msg: "No ban target specified."
            });
        }
        var name = args.shift().toLowerCase();
        var range = false;
        if (args[0] === "range") {
            range = "range";
            args.shift();
        } else if (args[0] === "wrange") {
            range = "wrange";
            args.shift();
        }
        var reason = args.join(" ");

        const chan = this.channel;
        chan.refCounter.ref("KickBanModule::handleCmdIPBan");
        this.banAll(user, name, range, reason, function (err) {
            chan.refCounter.unref("KickBanModule::handleCmdIPBan");
        });
    }

    banName(actor: any, name: string, reason: string, cb: any): void {
        var self = this;
        reason = reason.substring(0, 255);

        var chan = this.channel;
        var error = function (what) {
            actor.socket.emit("errorMsg", { msg: what });
            cb(what);
        };

        if (!chan.modules.permissions.canBan(actor)) {
            return error("You do not have ban permissions on this channel");
        }

        name = name.toLowerCase();
        if (name === actor.getLowerName()) {
            actor.socket.emit("costanza", {
                msg: "You can't ban yourself"
            });
            return cb("Attempted to ban self");
        }

        Q.nfcall(Account.rankForName, name, { channel: chan.name })
        .then(function (rank) {
            if (rank >= actor.account.effectiveRank) {
                throw "You don't have permission to ban " + name;
            }

            return Q.nfcall(db.channels.isNameBanned, chan.name, name);
        }).then(function (banned) {
            if (banned) {
                throw name + " is already banned";
            }

            if (chan.dead) { throw null; }

            return Q.nfcall(db.channels.ban, chan.name, "*", name, reason, actor.getName());
        }).then(function () {
            chan.logger.log("[mod] " + actor.getName() + " namebanned " + name);
            if (chan.modules.chat) {
                chan.modules.chat.sendModMessage(actor.getName() + " namebanned " + name,
                                                 chan.modules.permissions.permissions.ban);
            }
            return true;
        }).then(function () {
            self.kickBanTarget(name, null);
            setImmediate(function () {
                cb(null);
            });
        }).catch(error).done();
    }

    banIP(actor: any, ip: any, name: string, reason: any, cb: any): void {
        var self = this;
        reason = reason.substring(0, 255);
        var masked = util.cloakIP(ip);

        var chan = this.channel;
        var error = function (what) {
            actor.socket.emit("errorMsg", { msg: what });
            cb(what);
        };

        if (!chan.modules.permissions.canBan(actor)) {
            return error("You do not have ban permissions on this channel");
        }

        Q.nfcall(Account.rankForIP, ip, { channel: chan.name }).then(function (rank) {
            if (rank >= actor.account.effectiveRank) {
                throw "You don't have permission to ban IP " + masked;
            }

            return Q.nfcall(db.channels.isIPBanned, chan.name, ip);
        }).then(function (banned) {
            if (banned) {
                throw masked + " is already banned";
            }

            if (chan.dead) { throw null; }

            return Q.nfcall(db.channels.ban, chan.name, ip, name, reason, actor.getName());
        }).then(function () {
            var cloaked = util.cloakIP(ip);
            chan.logger.log("[mod] " + actor.getName() + " banned " + cloaked + " (" + name + ")");
            if (chan.modules.chat) {
                chan.modules.chat.sendModMessage(actor.getName() + " banned " +
                                                 cloaked + " (" + name + ")",
                                                 chan.modules.permissions.permissions.ban);
            }
        }).then(function () {
            self.kickBanTarget(name, ip);
            setImmediate(function () {
                cb(null);
            });
        }).catch(error).done();
    }

    banAll(actor: any, name: string, range: any, reason: any, cb: any): void {
        var self = this;
        reason = reason.substring(0, 255);

        var chan = self.channel;
        var error = function (what) {
            cb(what);
        };

        if (!chan.modules.permissions.canBan(actor)) {
            return error("You do not have ban permissions on this channel");
        }

        self.banName(actor, name, reason, function (err) {
            if (err && err.indexOf("is already banned") === -1) {
                cb(err);
            } else {
                db.getIPs(name, function (err, ips) {
                    if (err) {
                        return error(err);
                    }

                    var seenIPs = {};
                    var all = ips.map(function (ip) {
                        if (range === "range") {
                            ip = util.getIPRange(ip);
                        } else if (range === "wrange") {
                            ip = util.getWideIPRange(ip);
                        }

                        if (seenIPs.hasOwnProperty(ip)) {
                            return;
                        } else {
                            seenIPs[ip] = true;
                        }

                        return Q.nfcall(self.banIP.bind(self), actor, ip, name, reason);
                    });

                    Q.all(all).then(function () {
                        setImmediate(cb);
                    }).catch(error).done();
                });
            }
        });
    }

    kickBanTarget(name: string, ip: any): void {
        name = name.toLowerCase();
        for (var i = 0; i < this.channel.users.length; i++) {
            if (this.channel.users[i].getLowerName() === name ||
                this.channel.users[i].realip === ip) {
                this.channel.users[i].kick("You're banned!");
            }
        }
    }

    handleUnban(user: User, data: any): void {
        if (!this.channel.modules.permissions.canBan(user)) {
            return;
        }

        var self = this;
        this.channel.refCounter.ref("KickBanModule::handleUnban");
        db.channels.unbanId(this.channel.name, data.id, function (err) {
            if (err) {
                self.channel.refCounter.unref("KickBanModule::handleUnban");
                return user.socket.emit("errorMsg", {
                    msg: err
                });
            }

            self.sendUnban(self.channel.users, data);
            self.channel.logger.log("[mod] " + user.getName() + " unbanned " + data.name);
            if (self.channel.modules.chat) {
                var banperm = self.channel.modules.permissions.permissions.ban;
                self.channel.modules.chat.sendModMessage(user.getName() + " unbanned " +
                                                         data.name, banperm);
            }
            self.channel.refCounter.unref("KickBanModule::handleUnban");
        });
    }
}

export default KickBanModule;
