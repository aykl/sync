// @flow

import Promise from 'bluebird';
import Server from '../server';

var SERVER = null;

export default class LocalChannelIndex {
    listPublicChannels() {
        if (SERVER === null) {
            SERVER = Server.getServer();
        }

        return Promise.resolve(SERVER.packChannelList(true, false));
    }
}
