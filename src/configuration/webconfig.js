// @flow

import clone from 'clone';

const DEFAULT_TRUSTED_PROXIES = Object.freeze([
    '127.0.0.1',
    '::1'
]);

export default class WebConfiguration {
    config: any;

    constructor(config: any) {
        this.config = config;
    }

    getEmailContacts(): any {
        return clone(this.config.contacts);
    }

    getTrustedProxies(): any {
        return DEFAULT_TRUSTED_PROXIES;
    }

    getCookieSecret(): any {
        return this.config.authCookie.cookieSecret;
    }

    getCookieDomain(): any {
        return this.config.authCookie.cookieDomain;
    }

    getEnableGzip() {
        return this.config.gzip.enabled;
    }

    getGzipThreshold(): any {
        return this.config.gzip.threshold;
    }

    getEnableMinification(): any {
        return this.config.enableMinification;
    }

    getCacheTTL(): any {
        return this.config.cacheTTL;
    }

    getMaxIndexEntries(): any {
        return this.config.maxIndexEntries;
    }

    static fromOldConfig(oldConfig: any): WebConfiguration {
        const config = {};
        config.contacts = [];

        oldConfig.get('contacts').forEach(contact => {
            config.contacts.push({
                name: contact.name,
                email: contact.email,
                title: contact.title
            });
        });

        config.gzip = {
            enabled: oldConfig.get('http.gzip'),
            threshold: oldConfig.get('http.gzip-threshold')
        };

        config.authCookie = {
            cookieSecret: oldConfig.get('http.cookie-secret'),
            cookieDomain: oldConfig.get('http.root-domain-dotted')
        };

        config.enableMinification = oldConfig.get('http.minify');

        config.cacheTTL = oldConfig.get('http.max-age');

        config.maxIndexEntries = oldConfig.get('http.index.max-entries');

        return new WebConfiguration(config);
    }
};
