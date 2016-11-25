// @flow

import Promise from 'bluebird';

export default class NullClusterClient {
    ioConfig: any;

    constructor(ioConfig: any) {
        this.ioConfig = ioConfig;
    }

    getSocketConfig(channel: any): Promise<any> {
        const servers = this.ioConfig.getSocketEndpoints();
        return Promise.resolve({
            servers: servers
        });
    }
}
