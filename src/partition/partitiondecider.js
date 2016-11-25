// @flow

import { murmurHash1 } from '../util/murmur';

class PartitionDecider {
    config: any;
    partitionMap: any;

    constructor(config: any, partitionMap: any) {
        this.config = config;
        this.partitionMap = partitionMap;
    }

    getPartitionForChannel(channel: any): any {
        return this.partitionMap.getPartitions()[this.getPartitionIdentityForChannel(channel)];
    }

    getPartitionIdentityForChannel(channel: any): any {
        channel = channel.toLowerCase();
        const overrideMap = this.partitionMap.getOverrides();
        if (overrideMap.hasOwnProperty(channel)) {
            return overrideMap[channel];
        } else if (this.partitionMap.getPool().length > 0) {
            const pool = this.partitionMap.getPool();
            const i = murmurHash1(channel) % pool.length;
            return pool[i];
        } else {
            return { servers: [] };
        }
    }

    isChannelOnThisPartition(channel: any): any {
        return this.getPartitionIdentityForChannel(channel) ===
                this.config.getIdentity();
    }

    setPartitionMap(newMap: any): void {
        this.partitionMap = newMap;
    }
}

export { PartitionDecider };
