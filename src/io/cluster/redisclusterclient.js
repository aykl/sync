// @flow

import Promise from 'bluebird';

const ONE_SECOND = 1000;
const ERR_TIMEOUT = 'Timed out when retrieving server information';

class RedisClusterClient {
    frontendPool: any;

    constructor(frontendPool: any) {
        this.frontendPool = frontendPool;
    }

    getSocketConfig(channel: any): any {
        return this.frontendPool.getFrontends(channel).then(result => {
            if (!Array.isArray(result)) {
                result = [];
            }

            return { servers: result };
        }).timeout(ONE_SECOND, ERR_TIMEOUT);
    }
}

export { RedisClusterClient };
