// @flow

import NullClusterClient from './io/cluster/nullclusterclient';
import Config from './config';
import IOConfiguration from './configuration/ioconfig';

class LegacyModule {
    ioConfig: IOConfiguration;

    getIOConfig(): IOConfiguration {
        if (!this.ioConfig) {
            this.ioConfig = IOConfiguration.fromOldConfig(Config);
        }

        return this.ioConfig;
    }

    getClusterClient(): NullClusterClient {
        return new NullClusterClient(this.getIOConfig());
    }

    onReady(): void {

    }

    getRedisClientProvider() {
        throw new Error('Not implemented');
    }
}

export { LegacyModule };
