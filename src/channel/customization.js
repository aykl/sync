// @flow

import ChannelModule from './module';
import XSS from '../xss';
import User from '../user';

const TYPE_SETCSS = {
    css: "string"
};

const TYPE_SETJS = {
    js: "string"
};

const TYPE_SETMOTD = {
    motd: "string"
};

class CustomizationModule extends ChannelModule {
    css: string;
    js: string;
    motd: string;

    constructor(channel: any) {
        super(channel);
        this.css = "";
        this.js = "";
        this.motd = "";
    }

    load(data: any): void {
        if ("css" in data) {
            this.css = data.css;
        }

        if ("js" in data) {
            this.js = data.js;
        }

        if ("motd" in data) {
            if (typeof data.motd === "object" && data.motd.motd) {
                // Old style MOTD, convert to new
                this.motd = XSS.sanitizeHTML(data.motd.motd).replace(
                    /\n/g, "<br>\n");
            } else if (typeof data.motd === "string") {
                // The MOTD is filtered before it is saved, however it is also
                // re-filtered on load in case the filtering rules change
                this.motd = XSS.sanitizeHTML(data.motd);
            }
        }
    }

    save(data: any): void {
        data.css = this.css;
        data.js = this.js;
        data.motd = this.motd;
    }

    setMotd(motd: string): void {
        this.motd = XSS.sanitizeHTML(motd);
        this.sendMotd(this.channel.users);
    }

    onUserPostJoin(user: User): void {
        this.sendCSSJS([user]);
        this.sendMotd([user]);
        user.socket.typecheckedOn("setChannelCSS", TYPE_SETCSS, this.handleSetCSS.bind(this, user));
        user.socket.typecheckedOn("setChannelJS", TYPE_SETJS, this.handleSetJS.bind(this, user));
        user.socket.typecheckedOn("setMotd", TYPE_SETMOTD, this.handleSetMotd.bind(this, user));
    }

    sendCSSJS(users: User[]): void {
        var data = {
            css: this.css,
            js: this.js
        };
        users.forEach(function (u) {
            u.socket.emit("channelCSSJS", data);
        });
    }

    sendMotd(users: User[]): void {
        var data = this.motd;
        users.forEach(function (u) {
            u.socket.emit("setMotd", data);
        });
    }

    handleSetCSS(user: User, data: any): void {
        if (!this.channel.modules.permissions.canSetCSS(user)) {
            user.kick("Attempted setChannelCSS as non-admin");
            return;
        }

        this.css = data.css.substring(0, 20000);
        this.sendCSSJS(this.channel.users);

        this.channel.logger.log("[mod] " + user.getName() + " updated the channel CSS");
    }

    handleSetJS(user: User, data: any): void {
        if (!this.channel.modules.permissions.canSetJS(user)) {
            user.kick("Attempted setChannelJS as non-admin");
            return;
        }

        this.js = data.js.substring(0, 20000);
        this.sendCSSJS(this.channel.users);

        this.channel.logger.log("[mod] " + user.getName() + " updated the channel JS");
    }

    handleSetMotd(user: User, data: any): void {
        if (!this.channel.modules.permissions.canEditMotd(user)) {
            user.kick("Attempted setMotd with insufficient permission");
            return;
        }

        var motd = data.motd.substring(0, 20000);

        this.setMotd(motd);
        this.channel.logger.log("[mod] " + user.getName() + " updated the MOTD");
    }
}

export default CustomizationModule;
