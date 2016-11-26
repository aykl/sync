// @flow

export type ProxyListenerConfig = {
  getHost(): mixed,
  getPort(): mixed,
};

type BackendConfig = {
  redis: mixed,
  proxy: { listeners: { host: mixed, port: mixed }[] }
};

class BackendConfiguration {
    config: BackendConfig;

    constructor(config: BackendConfig) {
        this.config = config;
    }

    getRedisConfig(): mixed {
        return this.config.redis;
    }

    getListenerConfig(): ProxyListenerConfig[] {
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
