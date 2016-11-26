// @flow

import User from '../user';
import Channel from './channel';


class ChannelModule {
    channel: Channel;

    constructor(channel: Channel) {
      this.channel = channel;
    }

    /**
     * Called when the channel is loading its data from a JSON object.
     */
    load(data: any): void {
    }

    /**
     * Called when the channel is saving its state to a JSON object.
     */
    save(data: any): void {
    }

    /**
     * Called when the channel is being unloaded
     */
    unload(): void {
    }

    /**
     * Called to pack info, e.g. for channel detail view
     */
    packInfo(data: any, isAdmin: bool): void {
    }

    /**
     * Called when a user is attempting to join a channel.
     *
     * data is the data sent by the client with the joinChannel
     * packet.
     */
    onUserPreJoin(user: User, data: any, cb: any): void {
        cb(null, ChannelModule.PASSTHROUGH);
    }

    /**
     * Called after a user has been accepted to the channel.
     */
    onUserPostJoin(user: User): void {
    }

    /**
     * Called after a user has been disconnected from the channel.
     */
    onUserPart(user: User): void {
    }

    /**
     * Called when a chatMsg event is received
     */
    onUserPreChat(user: User, data: any, cb: any): void {
        cb(null, ChannelModule.PASSTHROUGH);
    }

    /**
     * Called before a new video begins playing
     */
    onPreMediaChange(data: any, cb: any): void {
        cb(null, ChannelModule.PASSTHROUGH);
    }

    /**
     * Called when a new video begins playing
     */
    onMediaChange(data: any): void {
    }

    /* Channel module callback return codes */
    static ERROR = -1;
    static PASSTHROUGH = 0;
    static DENY = 1;
};

export default ChannelModule;
