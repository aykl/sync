// @flow weak

class BackendConfiguration {
    config: any;

    constructor(config) {
        this.config = config;
    }

    getRedisConfig() {
        return this.config.redis;
    }

    getListenerConfig() {
        return this.config.proxy.listeners.map(listener => ({
            getHost() {
                return listener.host;
            },

            getPort() {
                return listener.port;
            }
        }));
    }
}

export { BackendConfiguration };
