// @flow

import ChannelModule from './module';
import { Poll } from '../poll';
import User from '../user';

const TYPE_NEW_POLL = {
    title: "string",
    timeout: "number,optional",
    obscured: "boolean",
    opts: "array"
};

const TYPE_VOTE = {
    option: "number"
};

const ROOM_VIEW_HIDDEN = ":viewHidden";
const ROOM_NO_VIEW_HIDDEN = ":noViewHidden";

class PollModule extends ChannelModule {
    poll: any;
    roomViewHidden: any;
    roomNoViewHidden: any;

    constructor(channel: any) {
        super(channel);

        this.poll = null;
        this.roomViewHidden = this.channel.uniqueName + ROOM_VIEW_HIDDEN;
        this.roomNoViewHidden = this.channel.uniqueName + ROOM_NO_VIEW_HIDDEN;
        if (this.channel.modules.chat) {
            this.channel.modules.chat.registerCommand("poll", this.handlePollCmd.bind(this, false));
            this.channel.modules.chat.registerCommand("hpoll", this.handlePollCmd.bind(this, true));
        }
    }

    unload(): void {
        if (this.poll && this.poll.timer) {
            clearTimeout(this.poll.timer);
        }
    }

    load(data: any): void {
        if ("poll" in data) {
            if (data.poll !== null) {
                this.poll = new Poll(data.poll.initiator, "", [], data.poll.obscured);
                this.poll.title = data.poll.title;
                this.poll.options = data.poll.options;
                this.poll.counts = data.poll.counts;
                this.poll.votes = data.poll.votes;
                this.poll.timestamp = data.poll.timestamp;
            }
        }
    }

    save(data: any): void {
        if (this.poll === null) {
            data.poll = null;
            return;
        }

        data.poll = {
            title: this.poll.title,
            initiator: this.poll.initiator,
            options: this.poll.options,
            counts: this.poll.counts,
            votes: this.poll.votes,
            obscured: this.poll.obscured,
            timestamp: this.poll.timestamp
        };
    }

    onUserPostJoin(user: User): void {
        this.sendPoll(user);
        user.socket.typecheckedOn("newPoll", TYPE_NEW_POLL, this.handleNewPoll.bind(this, user));
        user.socket.typecheckedOn("vote", TYPE_VOTE, this.handleVote.bind(this, user));
        user.socket.on("closePoll", this.handleClosePoll.bind(this, user));
        this.addUserToPollRoom(user);
        const self = this;
        user.on("effectiveRankChange", () => {
            self.addUserToPollRoom(user);
        });
    }

    addUserToPollRoom(user: User): void {
        const perms = this.channel.modules.permissions;
        if (perms.canViewHiddenPoll(user)) {
            user.socket.leave(this.roomNoViewHidden);
            user.socket.join(this.roomViewHidden);
        } else {
            user.socket.leave(this.roomViewHidden);
            user.socket.join(this.roomNoViewHidden);
        }
    }

    onUserPart(user: User): void {
        if (this.poll) {
            this.poll.unvote(user.realip);
            this.broadcastPoll(false);
        }
    }

    sendPoll(user: User): void {
        if (!this.poll) {
            return;
        }

        var perms = this.channel.modules.permissions;

        user.socket.emit("closePoll");
        if (perms.canViewHiddenPoll(user)) {
            var unobscured = this.poll.packUpdate(true);
            user.socket.emit("newPoll", unobscured);
        } else {
            var obscured = this.poll.packUpdate(false);
            user.socket.emit("newPoll", obscured);
        }
    }

    broadcastPoll(isNewPoll: bool): void {
        if (!this.poll) {
            return;
        }

        var obscured = this.poll.packUpdate(false);
        var unobscured = this.poll.packUpdate(true);
        var perms = this.channel.modules.permissions;

        const event = isNewPoll ? "newPoll" : "updatePoll";
        if (isNewPoll) {
            this.channel.broadcastAll("closePoll");
        }

        this.channel.broadcastToRoom(event, unobscured, this.roomViewHidden);
        this.channel.broadcastToRoom(event, obscured, this.roomNoViewHidden);
    }

    handleNewPoll(user: User, data: any): void {
        if (!this.channel.modules.permissions.canControlPoll(user)) {
            return;
        }

        var title = data.title.substring(0, 255);
        var opts = data.opts.map(function (x) { return (""+x).substring(0, 255); });
        var obscured = data.obscured;

        var poll = new Poll(user.getName(), title, opts, obscured);
        var self = this;
        if (data.hasOwnProperty("timeout") && !isNaN(data.timeout) && data.timeout > 0) {
            poll.timer = setTimeout(function () {
                if (self.poll === poll) {
                    self.handleClosePoll({
                        getName: function () { return "[poll timer]" },
                        effectiveRank: 255
                    });
                }
            }, data.timeout * 1000);
        }

        this.poll = poll;
        this.broadcastPoll(true);
        this.channel.logger.log("[poll] " + user.getName() + " opened poll: '" + poll.title + "'");
    }

    handleVote(user: User, data: any): void {
        if (!this.channel.modules.permissions.canVote(user)) {
            return;
        }

        if (this.poll) {
            this.poll.vote(user.realip, data.option);
            this.broadcastPoll(false);
        }
    }

    handleClosePoll(user: { getName(): string }): void {
        if (!this.channel.modules.permissions.canControlPoll(user)) {
            return;
        }

        if (this.poll) {
            if (this.poll.obscured) {
                this.poll.obscured = false;
                this.channel.broadcastAll("updatePoll", this.poll.packUpdate(true));
            }

            if (this.poll.timer) {
                clearTimeout(this.poll.timer);
            }

            this.channel.broadcastAll("closePoll");
            this.channel.logger.log("[poll] " + user.getName() + " closed the active poll");
            this.poll = null;
        }
    }

    handlePollCmd(obscured: any, user: User, msg: any, meta: any): void {
        if (!this.channel.modules.permissions.canControlPoll(user)) {
            return;
        }

        msg = msg.replace(/^\/h?poll/, "");

        var args = msg.split(",");
        var title = args.shift();
        var poll = new Poll(user.getName(), title, args, obscured);
        this.poll = poll;
        this.broadcastPoll(true);
        this.channel.logger.log("[poll] " + user.getName() + " opened poll: '" + poll.title + "'");
    }
}

export default PollModule;
