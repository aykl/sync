// @flow

import Promise from 'bluebird';

class PartitionClusterClient {
    partitionDecider: any;

    constructor(partitionDecider: any) {
        this.partitionDecider = partitionDecider;
    }

    getSocketConfig(channel: any): Promise<any> {
        return Promise.resolve(
                this.partitionDecider.getPartitionForChannel(channel));
    }
}

export { PartitionClusterClient };
