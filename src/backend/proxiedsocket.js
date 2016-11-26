// @flow

import logger from 'cytube-common/lib/logger';
import events from 'events';
const EventEmitter = events.EventEmitter;

export default class ProxiedSocket extends EventEmitter {
    id: mixed;
    ip: mixed;
    _realip: mixed;
    user: mixed;
    socketEmitter: any;
    frontendConnection: any;

    constructor(socketID: mixed, socketIP: mixed,
                socketUser: { name: mixed, globalRank: mixed },
                socketEmitter: mixed, frontendConnection: any) {
        super();
        this.id = socketID;
        this.ip = socketIP;
        this._realip = socketIP;
        if (socketUser) {
            this.user = {
                name: socketUser.name,
                global_rank: socketUser.globalRank
            };
        }
        this.socketEmitter = socketEmitter;
        this.frontendConnection = frontendConnection;
    }

    emit(): bool {
        const target = this.socketEmitter.to(this.id);
        return target.emit.apply(target, arguments);
    }

    onProxiedEventReceived() {
        try {
            EventEmitter.prototype.emit.apply(this, arguments);
        } catch (error) {
            logger.error(`Emit failed: ${error.stack}`);
        }
    }

    join(channel: mixed): void {
        this.frontendConnection.write(
                this.frontendConnection.protocol.newSocketJoinRoomsEvent(
                        this.id, [channel]
                )
        );
    }

    leave(room: mixed): void {
        this.frontendConnection.write(
                this.frontendConnection.protocol.newSocketLeaveRoomsEvent(
                        this.id, [room]
                )
        );
    }

    disconnect() {
        this.frontendConnection.write(
                this.frontendConnection.protocol.newSocketKickEvent(this.id)
        );
    }
}
