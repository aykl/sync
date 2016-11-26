// @flow

import ChannelModule from './module';
import User from '../user';
import Channel from './channel';

class DrinkModule extends ChannelModule {
    drinks: number;

    constructor(channel: Channel) {
        super(channel);
        this.drinks = 0;
    }

    onUserPostJoin(user: User): void {
        user.socket.emit("drinkCount", this.drinks);
    };

    onUserPreChat(user: User, data: any, cb: any): void {
        var msg = data.msg;
        var perms = this.channel.modules.permissions;
        if (msg.match(/^\/d-?[0-9]*/) && perms.canCallDrink(user)) {
            msg = msg.substring(2);
            var m = msg.match(/^(-?[0-9]+)/);
            var count;
            if (m) {
                count = parseInt(m[1]);
                if (isNaN(count) || count < -10000 || count > 10000) {
                    return;
                }

                msg = msg.replace(m[1], "").trim();
                if (msg || count > 0) {
                    msg += " drink! (x" + count + ")";
                } else {
                    this.drinks += count;
                    this.channel.broadcastAll("drinkCount", this.drinks);
                    return cb(null, ChannelModule.DENY);
                }
            } else {
                msg = msg.trim() + " drink!";
                count = 1;
            }

            this.drinks += count;
            this.channel.broadcastAll("drinkCount", this.drinks);
            data.msg = msg;
            data.meta.addClass = "drink";
            data.meta.forceShowName = true;
            cb(null, ChannelModule.PASSTHROUGH);
        } else {
            cb(null, ChannelModule.PASSTHROUGH);
        }
    }

    onMediaChange(): void {
        this.drinks = 0;
        this.channel.broadcastAll("drinkCount", 0);
    }
}

export default DrinkModule;
