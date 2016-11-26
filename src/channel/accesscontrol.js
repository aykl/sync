// @flow

import Account from '../account';
import ChannelModule from './module';
import Flags from '../flags';
import User from '../user';
import Channel from './channel';

class AccessControlModule extends ChannelModule {

    constructor(channel: Channel) {
      super(channel);
    }

    onUserPreJoin(user: User, data: any, cb: any): void {
        var chan = this.channel,
            opts = this.channel.modules.options;
        var self = this;
        if (user.socket.disconnected) {
            return cb("User disconnected", ChannelModule.DENY);
        }

        if (opts.get("password") !== false && data.pw !== opts.get("password")) {
            user.socket.on("disconnect", function () {
                if (!user.is(Flags.U_IN_CHANNEL)) {
                    cb("User disconnected", ChannelModule.DENY);
                }
            });

            if (user.is(Flags.U_LOGGED_IN) && user.account.effectiveRank >= 2) {
                cb(null, ChannelModule.PASSTHROUGH);
                user.socket.emit("cancelNeedPassword");
            } else {
                user.socket.emit("needPassword", typeof data.pw !== "undefined");
                /* Option 1: log in as a moderator */
                user.waitFlag(Flags.U_HAS_CHANNEL_RANK, function () {
                    if (user.is(Flags.U_IN_CHANNEL)) {
                        return;
                    }

                    if (user.account.effectiveRank >= 2) {
                        cb(null, ChannelModule.PASSTHROUGH);
                        user.socket.emit("cancelNeedPassword");
                    }
                });

                /* Option 2: Enter correct password */
                var pwListener = function (pw) {
                    if (chan.dead || user.is(Flags.U_IN_CHANNEL)) {
                        return;
                    }

                    if (pw !== opts.get("password")) {
                        user.socket.emit("needPassword", true);
                        return;
                    }

                    user.socket.emit("cancelNeedPassword");
                    cb(null, ChannelModule.PASSTHROUGH);
                };

                user.socket.on("channelPassword", pwListener);
            }
        } else {
            cb(null, ChannelModule.PASSTHROUGH);
        }
    }
}

export default AccessControlModule;
