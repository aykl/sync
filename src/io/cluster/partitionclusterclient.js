// @flow weak

import Promise from 'bluebird';

class PartitionClusterClient {
    partitionDecider: any;
    
    constructor(partitionDecider) {
        this.partitionDecider = partitionDecider;
    }

    getSocketConfig(channel) {
        return Promise.resolve(
                this.partitionDecider.getPartitionForChannel(channel));
    }
}

export { PartitionClusterClient };
