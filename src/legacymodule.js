// @flow

import NullClusterClient from './io/cluster/nullclusterclient';
import Config from './config';
import IOConfiguration from './configuration/ioconfig';

class LegacyModule {
    ioConfig: any;

    getIOConfig() {
        if (!this.ioConfig) {
            this.ioConfig = IOConfiguration.fromOldConfig(Config);
        }

        return this.ioConfig;
    }

    getClusterClient() {
        return new NullClusterClient(this.getIOConfig());
    }

    onReady() {

    }

    getRedisClientProvider() {
        throw new Error('Not implemented');
    }
}

export { LegacyModule };
