// @flow

import logger from 'cytube-common/lib/logger';
import * as Switches from '../../switches';

class DualClusterClient {
    authoritativeClient: any;
    altClient: any;

    constructor(authoritativeClient: any, altClient: any) {
        this.authoritativeClient = authoritativeClient;
        this.altClient = altClient;
    }

    getSocketConfig(channel: any): any {
        return this.authoritativeClient.getSocketConfig(channel).then(result => {
            if (!Switches.isActive(Switches.DUAL_BACKEND)) {
                return result;
            }

            return this.altClient.getSocketConfig(channel).then(altResult => {
                result.alt = altResult.servers;
                return result;
            }).catch(error => {
                logger.warn(`Error loading alt servers: ${error}`);
                return result;
            });
        })
    }
}

export { DualClusterClient };
