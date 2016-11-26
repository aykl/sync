// @flow

type BackendConfig = {
  redis: any,
  proxy: { listeners: { host: mixed, port: mixed }[] }
};

class BackendConfiguration {
    config: BackendConfig;

    constructor(config: BackendConfig) {
        this.config = config;
    }

    getRedisConfig(): void {
        return this.config.redis;
    }

    getListenerConfig(): mixed[] {
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
