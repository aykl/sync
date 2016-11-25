// @flow

type BackendConfig = {
  redis: any,
  proxy: any
};

class BackendConfiguration {
    config: BackendConfig;

    constructor(config: BackendConfig) {
        this.config = config;
    }

    getRedisConfig(): void {
        return this.config.redis;
    }

    getListenerConfig(): any[] {
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
