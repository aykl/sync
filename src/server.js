// @flow

import  { version as VERSION } from '../package.json';
import Config from './config';
import Promise from 'bluebird';
import * as ChannelStore from './channel-storage/channelstore';
import events from 'events';
const EventEmitter = events.EventEmitter;


import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import express from 'express';
import Logger from './logger';
import Channel from './channel/channel';
import User from './user';
import $util from './utilities';
import db from './database';
import Flags from './flags';
import sio from 'socket.io';
import LocalChannelIndex from './web/localchannelindex';
import { PartitionChannelIndex } from './partition/partitionchannelindex';
import IOConfiguration from './configuration/ioconfig';
import WebConfiguration from './configuration/webconfig';
import NullClusterClient from './io/cluster/nullclusterclient';
import session from './session';
import { LegacyModule } from './legacymodule';
import { PartitionModule } from './partition/partitionmodule';
import * as Switches from './switches';
import Database from './database';
import { BackendModule } from './backend/backendmodule';
import webServer from './web/webserver';
import ioServer from './io/ioserver';
import bgTask from './bgtask';
import setUid from './setuid';


var singleton: null|Server = null;

export default {
    init: function (): Server {
        Logger.syslog.log("Starting CyTube v" + VERSION);
        var chanlogpath = path.join(__dirname, "../chanlogs");
        fs.exists(chanlogpath, function (exists) {
            exists || fs.mkdirSync(chanlogpath);
        });

        var chandumppath = path.join(__dirname, "../chandump");
        fs.exists(chandumppath, function (exists) {
            exists || fs.mkdirSync(chandumppath);
        });

        var gdvttpath = path.join(__dirname, "../google-drive-subtitles");
        fs.exists(gdvttpath, function (exists) {
            exists || fs.mkdirSync(gdvttpath);
        });
        singleton = new Server();
        return singleton;
    },

    getServer: function (): Server {
        if (singleton === null) {
            console.error('Server is not initiated!');
            process.exit(1);
            // $FlowIgnore
            return;
        }
        return singleton;
    }
};

class Server extends EventEmitter {
    channels: any;
    express: any;
    db: any;
    api: any;
    announcement: any;
    infogetter: any;
    servers: any;
    initModule: any;
    partitionDecider: any;

    constructor() {
        super();
        this.channels = [],
        this.express = null;
        this.db = null;
        this.api = null;
        this.announcement = null;
        this.infogetter = null;
        this.servers = {};

        var self = this;

        // backend init
        var initModule;
        if (Config.get("new-backend")) {
            if (Config.get("dual-backend")) {
                Switches.setActive(Switches.DUAL_BACKEND, true);
            }
            initModule = this.initModule = new BackendModule();
        } else if (Config.get('enable-partition')) {
            initModule = this.initModule = new PartitionModule();
            this.partitionDecider = initModule.getPartitionDecider();
        } else {
            initModule = this.initModule = new LegacyModule();
        }

        // database init ------------------------------------------------------
        this.db = Database;
        this.db.init();
        ChannelStore.init();

        // webserver init -----------------------------------------------------
        const ioConfig = IOConfiguration.fromOldConfig(Config);
        const webConfig = WebConfiguration.fromOldConfig(Config);
        const clusterClient = initModule.getClusterClient();
        var channelIndex;
        if (Config.get("enable-partition")) {
            channelIndex = new PartitionChannelIndex(
                    initModule.getRedisClientProvider().get()
            );
        } else {
            channelIndex = new LocalChannelIndex();
        }
        this.express = express();
        webServer.init(this.express,
                webConfig,
                ioConfig,
                clusterClient,
                channelIndex,
                session);

        // http/https/sio server init -----------------------------------------
        var key = "", cert = "", ca = undefined;
        if (Config.get("https.enabled")) {
            key = fs.readFileSync(path.resolve(__dirname, "..",
                                                   Config.get("https.keyfile")));
            cert = fs.readFileSync(path.resolve(__dirname, "..",
                                                    Config.get("https.certfile")));
            if (Config.get("https.cafile")) {
                ca = fs.readFileSync(path.resolve(__dirname, "..",
                                                  Config.get("https.cafile")));
            }
        }

        var opts = {
            key: key,
            cert: cert,
            passphrase: Config.get("https.passphrase"),
            ca: ca,
            ciphers: Config.get("https.ciphers"),
            honorCipherOrder: true
        };

        Config.get("listen").forEach(function (bind) {
            var id = bind.ip + ":" + bind.port;
            if (id in self.servers) {
                Logger.syslog.log("[WARN] Ignoring duplicate listen address " + id);
                return;
            }

            if (bind.https && Config.get("https.enabled")) {
                self.servers[id] = https.createServer(opts, self.express)
                                        .listen(bind.port, bind.ip);
                self.servers[id].on("clientError", function (err, socket) {
                    try {
                        socket.destroy();
                    } catch (e) {
                    }
                });
            } else if (bind.http) {
                self.servers[id] = self.express.listen(bind.port, bind.ip);
                self.servers[id].on("clientError", function (err, socket) {
                    try {
                        socket.destroy();
                    } catch (e) {
                    }
                });
            }
        });

        ioServer.init(self, webConfig);

        // background tasks init ----------------------------------------------
        bgTask(self);

        // setuid
        setUid();

        initModule.onReady();
    }

    getHTTPIP(req: any): string {
        var ip = req.ip;
        if (ip === "127.0.0.1" || ip === "::1") {
            var fwd = req.header("x-forwarded-for");
            if (fwd && typeof fwd === "string") {
                return fwd;
            }
        }
        return ip;
    }

    getSocketIP(socket: any): any {
        var raw = socket.handshake.address.address;
        if (raw === "127.0.0.1" || raw === "::1") {
            var fwd = socket.handshake.headers["x-forwarded-for"];
            if (fwd && typeof fwd === "string") {
                return fwd;
            }
        }
        return raw;
    }

    isChannelLoaded(name: string): bool {
        name = name.toLowerCase();
        for (var i = 0; i < this.channels.length; i++) {
            if (this.channels[i].uniqueName == name)
                return true;
        }
        return false;
    }

    getChannel(name: string): any {
        var cname = name.toLowerCase();
        if (this.partitionDecider &&
                !this.partitionDecider.isChannelOnThisPartition(cname)) {
            const error = new Error(`Channel '${cname}' is mapped to a different partition`);
            // $FlowIgnore
            error.code = 'EWRONGPART';
            throw error;
        }

        var self = this;
        for (var i = 0; i < self.channels.length; i++) {
            if (self.channels[i].uniqueName === cname)
                return self.channels[i];
        }

        var c = new Channel(name);
        c.on("empty", function () {
            self.unloadChannel(c);
        });
        self.channels.push(c);
        return c;
    }

    unloadChannel(chan: any, options: any): void {
        if (chan.dead) {
            return;
        }

        if (!options) {
            options = {};
        }

        if (!options.skipSave) {
            chan.saveState().catch(error => {
                Logger.errlog.log(`Failed to save /r/${chan.name} for unload: ${error.stack}`);
            });
        }

        chan.logger.log("[init] Channel shutting down");
        chan.logger.close();

        chan.notifyModules("unload", []);
        Object.keys(chan.modules).forEach(function (k) {
            chan.modules[k].dead = true;
            /*
             * Automatically clean up any timeouts/intervals assigned
             * to properties of channel modules.  Prevents a memory leak
             * in case of forgetting to clear the timer on the "unload"
             * module event.
             */
            Object.keys(chan.modules[k]).forEach(function (prop) {
                if (chan.modules[k][prop] && chan.modules[k][prop]._onTimeout) {
                    Logger.errlog.log("Warning: detected non-null timer when unloading " +
                            "module " + k + ": " + prop);
                    try {
                        clearTimeout(chan.modules[k][prop]);
                        clearInterval(chan.modules[k][prop]);
                    } catch (error) {
                        Logger.errlog.log(error.stack);
                    }
                }
            });
        });

        for (let i = 0; i < this.channels.length; i++) {
            if (this.channels[i].uniqueName === chan.uniqueName) {
                this.channels.splice(i, 1);
                i--;
            }
        }

        Logger.syslog.log("Unloaded channel " + chan.name);
        chan.broadcastUsercount.cancel();
        // Empty all outward references from the channel
        var keys = Object.keys(chan);
        keys.forEach(k => {
          if (k !== 'refCounter') {
            delete chan[k];
          }
        });
        chan.dead = true;
    }

    packChannelList(publicOnly: bool, isAdmin: bool): any[] {
        var channels = this.channels.filter(function (c) {
            if (!publicOnly) {
                return true;
            }

            return c.modules.options && c.modules.options.get("show_public");
        });

        var self = this;
        return channels.map(function (c) {
            return c.packInfo(isAdmin);
        });
    }

    announce(data: any): void {
        this.setAnnouncement(data);

        if (data == null) {
            db.clearAnnouncement();
        } else {
            db.setAnnouncement(data);
        }

        this.emit("announcement", data);
    }

    setAnnouncement(data: any): void {
        if (data == null) {
            this.announcement = null;
        } else {
            this.announcement = data;
            sio.instance.emit("announcement", data);
        }
    }

    shutdown(): void {
        Logger.syslog.log("Unloading channels");
        Promise.map(this.channels, channel => {
            return channel.saveState().tap(() => {
                Logger.syslog.log(`Saved /r/${channel.name}`);
            }).catch(err => {
                Logger.errlog.log(`Failed to save /r/${channel.name}: ${err.stack}`);
            });
        }, { concurrency: 5 }).then(() => {
            Logger.syslog.log("Goodbye");
            process.exit(0);
        }).catch(err => {
            Logger.errlog.log(`Caught error while saving channels: ${err.stack}`);
            process.exit(1);
        });
    }

    handlePartitionMapChange(): void {
        const channels = Array.prototype.slice.call(this.channels);
        Promise.map(channels, channel => {
            if (channel.dead) {
                return;
            }

            if (!this.partitionDecider.isChannelOnThisPartition(channel.uniqueName)) {
                Logger.syslog.log("Partition changed for " + channel.uniqueName);
                return channel.saveState().then(() => {
                    channel.broadcastAll("partitionChange",
                            this.partitionDecider.getPartitionForChannel(channel.uniqueName));
                    const users = Array.prototype.slice.call(channel.users);
                    users.forEach(u => {
                        try {
                            u.socket.disconnect();
                        } catch (error) {
                        }
                    });
                    this.unloadChannel(channel, { skipSave: true });
                }).catch(error => {
                    Logger.errlog.log(`Failed to unload /r/${channel.name} for ` +
                                      `partition map flip: ${error.stack}`);
                });
            }
        }, { concurrency: 5 }).then(() => {
            Logger.syslog.log("Partition reload complete");
        });
    }

    reloadPartitionMap(): void {
        if (!Config.get("enable-partition")) {
            return;
        }

        this.initModule.getPartitionMapReloader().reload();
    }
}
