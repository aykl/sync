// @flow

export default class IOConfiguration {
    config: any;

    constructor(config: any) {
        this.config = config;
    }

    getSocketEndpoints(): any {
        return this.config.endpoints.slice();
    }

    static fromOldConfig(oldConfig: any): IOConfiguration {
        const config = {
            endpoints: []
        };

        if (oldConfig.get('io.ipv4-ssl')) {
            config.endpoints.push({
                url: oldConfig.get('io.ipv4-ssl'),
                secure: true
            });
        }

        if (oldConfig.get('io.ipv4-nossl')) {
            config.endpoints.push({
                url: oldConfig.get('io.ipv4-nossl'),
                secure: false
            });
        }

        if (oldConfig.get('io.ipv6-ssl')) {
            config.endpoints.push({
                url: oldConfig.get('io.ipv4-ssl'),
                secure: true,
                ipv6: true
            });
        }

        if (oldConfig.get('io.ipv6-nossl')) {
            config.endpoints.push({
                url: oldConfig.get('io.ipv4-nossl'),
                secure: false,
                ipv6: true
            });
        }

        return new IOConfiguration(config);
    }
};
