// @flow
import type { ProxyListenerConfig } from './backendconfiguration';
import type { SocketEmitter } from './proxiedsocket';

import Server from 'cytube-common/lib/proxy/server';
import ProxyInterceptor from './proxyinterceptor';
import uuid from 'uuid';
import PoolEntryUpdater from 'cytube-common/lib/redis/poolentryupdater';
import JSONProtocol from 'cytube-common/lib/proxy/protocol';
import { formatProxyAddress } from 'cytube-common/lib/util/addressutil';

const BACKEND_POOL = 'backend-hosts';



export default class IOBackend {
    proxyListenerConfig: ProxyListenerConfig;
    socketEmitter: SocketEmitter;
    poolRedisClient: mixed;
    protocol: mixed;
    proxyInterceptor: ProxyInterceptor;
    proxyListener: mixed;
    poolEntryUpdater: mixed;

    constructor(proxyListenerConfig: ProxyListenerConfig,
                socketEmitter: SocketEmitter, poolRedisClient: mixed) {
        this.proxyListenerConfig = proxyListenerConfig;
        this.socketEmitter = socketEmitter;
        this.poolRedisClient = poolRedisClient;
        this.protocol = new JSONProtocol();
        this.initProxyInterceptor();
        this.initProxyListener();
        this.initBackendPoolUpdater();
    }

    initProxyInterceptor(): void {
        this.proxyInterceptor = new ProxyInterceptor(this.socketEmitter);
    }

    initProxyListener(): void {
        this.proxyListener = new Server(this.proxyListenerConfig, this.protocol);
        this.proxyListener.on('connection',
                this.proxyInterceptor.onConnection.bind(this.proxyInterceptor));
    }

    initBackendPoolUpdater(): void {
        const hostname = this.proxyListenerConfig.getHost();
        const port = this.proxyListenerConfig.getPort();
        const entry = {
            address: formatProxyAddress(hostname, port)
        }
        this.poolEntryUpdater = new PoolEntryUpdater(
                this.poolRedisClient,
                BACKEND_POOL,
                uuid.v4(),
                entry
        );
        this.poolEntryUpdater.start();
    }
}
