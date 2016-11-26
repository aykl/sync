// @flow

import ChannelModule from './module';
import XSS from '../xss';
import User from '../user';

function EmoteList(defaults) {
    if (!defaults) {
        defaults = [];
    }

    this.emotes = defaults.map(validateEmote).filter(function (f) {
        return f !== false;
    });
}

EmoteList.prototype = {
    pack: function () {
        return Array.prototype.slice.call(this.emotes);
    },

    importList: function (emotes) {
        this.emotes = Array.prototype.slice.call(emotes);
    },

    updateEmote: function (emote) {
        var found = false;
        for (var i = 0; i < this.emotes.length; i++) {
            if (this.emotes[i].name === emote.name) {
                found = true;
                this.emotes[i] = emote;
                break;
            }
        }

        /* If no emote was updated, add a new one */
        if (!found) {
            this.emotes.push(emote);
        }
    },

    removeEmote: function (emote) {
        var found = false;
        for (var i = 0; i < this.emotes.length; i++) {
            if (this.emotes[i].name === emote.name) {
                this.emotes.splice(i, 1);
                break;
            }
        }
    },

    moveEmote: function (from, to) {
        if (from < 0 || to < 0 ||
            from >= this.emotes.length || to >= this.emotes.length) {
            return false;
        }

        var f = this.emotes[from];
        /* Offset from/to indexes to account for the fact that removing
           an element changes the position of one of them.

           I could have just done a swap, but it's already implemented this way
           and it works. */
        to = to > from ? to + 1 : to;
        from = to > from ? from : from + 1;

        this.emotes.splice(to, 0, f);
        this.emotes.splice(from, 1);
        return true;
    },
};

function validateEmote(f) {
    if (typeof f.name !== "string" || typeof f.image !== "string") {
        return false;
    }

    f.image = f.image.substring(0, 1000);
    f.image = XSS.sanitizeText(f.image);

    var s = XSS.sanitizeText(f.name).replace(/([\\\.\?\+\*\$\^\|\(\)\[\]\{\}])/g, "\\$1");
    s = "(^|\\s)" + s + "(?!\\S)";
    f.source = s;

    if (!f.image || !f.name) {
        return false;
    }

    try {
        new RegExp(f.source, "gi");
    } catch (e) {
        return false;
    }

    return f;
};

class EmoteModule extends ChannelModule {
    emotes: any;

    constructor(channel: any) {
        super(channel);
        this.emotes = new EmoteList();
    }

    load(data: any): void {
        if ("emotes" in data) {
            for (var i = 0; i < data.emotes.length; i++) {
                this.emotes.updateEmote(data.emotes[i]);
            }
        }
    }

    save(data: any): void {
        data.emotes = this.emotes.pack();
    }

    packInfo(data: any, isAdmin: bool): void {
        if (isAdmin) {
            data.emoteCount = this.emotes.emotes.length;
        }
    }

    onUserPostJoin(user: User): void {
        user.socket.on("updateEmote", this.handleUpdateEmote.bind(this, user));
        user.socket.on("importEmotes", this.handleImportEmotes.bind(this, user));
        user.socket.on("moveEmote", this.handleMoveEmote.bind(this, user));
        user.socket.on("removeEmote", this.handleRemoveEmote.bind(this, user));
        this.sendEmotes([user]);
    }

    sendEmotes(users: User[]): void {
        var f = this.emotes.pack();
        var chan = this.channel;
        users.forEach(function (u) {
            u.socket.emit("emoteList", f);
        });
    }

    handleUpdateEmote(user: User, data: any): void {
        if (typeof data !== "object") {
            return;
        }

        if (!this.channel.modules.permissions.canEditEmotes(user)) {
            return;
        }

        var f = validateEmote(data);
        if (!f) {
            var message = "Unable to update emote '" + JSON.stringify(data) + "'.  " +
                    "Please contact an administrator for assistance.";
            if (!data.image || !data.name) {
                message = "Emote names and images must not be blank.";
            }

            user.socket.emit("errorMsg", {
                msg: message,
                alert: true
            });
            return;
        }

        this.emotes.updateEmote(f);
        var chan = this.channel;
        chan.broadcastAll("updateEmote", f);

        chan.logger.log("[mod] " + user.getName() + " updated emote: " + f.name + " -> " +
                        f.image);
    }

    handleImportEmotes(user: User, data: any): void {
        if (!(data instanceof Array)) {
            return;
        }

        /* Note: importing requires a different permission node than simply
           updating/removing */
        if (!this.channel.modules.permissions.canImportEmotes(user)) {
            return;
        }

        this.emotes.importList(data.map(validateEmote).filter(function (f) {
            return f !== false;
        }));
        this.sendEmotes(this.channel.users);
    }

    handleRemoveEmote(user: User, data: any): void {
        if (typeof data !== "object") {
            return;
        }

        if (!this.channel.modules.permissions.canEditEmotes(user)) {
            return;
        }

        if (typeof data.name !== "string") {
            return;
        }

        this.emotes.removeEmote(data);
        this.channel.logger.log("[mod] " + user.getName() + " removed emote: " + data.name);
        this.channel.broadcastAll("removeEmote", data);
    }

    handleMoveEmote(user: User, data: any): void {
        if (typeof data !== "object") {
            return;
        }

        if (!this.channel.modules.permissions.canEditEmotes(user)) {
            return;
        }

        if (typeof data.to !== "number" || typeof data.from !== "number") {
            return;
        }

        this.emotes.moveEmote(data.from, data.to);
    }
}

export default EmoteModule;
