// @flow

import fs from 'fs';
import net from 'net';

type Handler = (mixed) => mixed;

export default class ServiceSocket {
    connections: { [key: mixed]: { write: (mixed) => mixed, end: (mixed) => mixed } };
    handler: Handler;
    socket: string;
    server: { close: () => mixed };

    constructor() {
        this.connections = {};
    }

    init(handler: Handler, socket: string): void {
        this.handler = handler;
        this.socket = socket;

        fs.stat(this.socket, (err, stats) => {
            if (err) {
                return this.openServiceSocket();
            }
            fs.unlink(this.socket, (err) => {
                if(err){
                    console.error(err); process.exit(0);
                }
                return this.openServiceSocket();
            });
        });
    }

    openServiceSocket(){
        // $FlowIgnore
        this.server = net.createServer((stream) => {
            let id = Date.now();
            this.connections[id] = stream;
            stream.on('end', () => {
                delete this.connections[id];
            });
            stream.on('data', (msg) => {
                this.handler(msg.toString());
            });
        }).listen(this.socket);
        process.on('exit', this.closeServiceSocket.bind(this));
    }

    closeServiceSocket() {
        if(Object.keys(this.connections).length){
            let clients = Object.keys(this.connections);
            while(clients.length){
                let client = clients.pop();
                this.connections[client].write('__disconnect');
                this.connections[client].end();
            }
        }
        this.server.close();
    }

}
