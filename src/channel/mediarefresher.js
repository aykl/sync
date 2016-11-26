// @flow

import Vimeo from 'cytube-mediaquery/lib/provider/vimeo';
import ChannelModule from './module';
import Config from '../config';
import InfoGetter from '../get-info';
import Logger from '../logger';
import Channel from './channel';

class MediaRefresherModule extends ChannelModule {
    _interval: any;
    _media: any;
    _playlist: any;

    constructor(channel: Channel) {
        super(channel);
        this._interval = false;
        this._media = null;
        this._playlist = channel.modules.playlist;
    }

    onPreMediaChange(data: any, cb: any): void {
        if (this._interval) clearInterval(this._interval);

        this._media = data;
        var pl = this._playlist;

        switch (data.type) {
            case "gd":
                pl._refreshing = true;
                return this.initGoogleDocs(data, function () {

                    pl._refreshing = false;
                    cb(null, ChannelModule.PASSTHROUGH);
                });
            case "gp":
                pl._refreshing = true;
                return this.initGooglePlus(data, function () {
                    pl._refreshing = false;
                    cb(null, ChannelModule.PASSTHROUGH);
                });
            case "vi":
                pl._refreshing = true;
                return this.initVimeo(data, function () {
                    pl._refreshing = false;
                    cb(null, ChannelModule.PASSTHROUGH);
                });
            case "vm":
                pl._refreshing = true;
                return this.initVidme(data, function () {
                    pl._refreshing = false;
                    cb(null, ChannelModule.PASSTHROUGH);
                });
            default:
                return cb(null, ChannelModule.PASSTHROUGH);
        }
    }

    unload(): void {
        try {
            clearInterval(this._interval);
            this._interval = null;
        } catch (error) {
            Logger.errlog.log(error.stack);
        }
    }

    initGoogleDocs(data: any, cb: any): void {
        var self = this;
        self.refreshGoogleDocs(data, cb);

        /*
         * Refresh every 55 minutes.
         * The expiration is 1 hour, but refresh 5 minutes early to be safe
         */
        self._interval = setInterval(function () {
            self.refreshGoogleDocs(data);
        }, 55 * 60 * 1000);
    }

    initVimeo(data: any, cb: any): void {
        if (!Config.get("vimeo-workaround")) {
            if (cb) cb();
            return;
        }

        const self = this;
        self.channel.refCounter.ref("MediaRefresherModule::initVimeo");
        Vimeo.extract(data.id).then(function (direct) {
            if (self.dead || self.channel.dead) {
                self.unload();
                return;
            }

            if (self._media === data) {
                data.meta.direct = direct;
                self.channel.logger.log("[mediarefresher] Refreshed vimeo video with ID " +
                    data.id);
            }

            if (cb) cb();
        }).catch(function (err) {
            Logger.errlog.log("Unexpected vimeo::extract() fail: " + err.stack);
            if (cb) cb();
        }).finally(() => {
            self.channel.refCounter.unref("MediaRefresherModule::initVimeo");
        });
    }

    refreshGoogleDocs(media: any, cb: any): void {
        var self = this;

        if (self.dead || self.channel.dead) {
            self.unload();
            return;
        }

        self.channel.refCounter.ref("MediaRefresherModule::refreshGoogleDocs");
        InfoGetter.getMedia(media.id, "gd", function (err, data) {
            if (self.dead || self.channel.dead) {
                return;
            }

            if (typeof err === "string") {
                err = err.replace(/Google Drive lookup failed for [\w-]+: /, "");
                err = err.replace(/Forbidden/, "Access Denied");
                err = err.replace(/You don't have permission to access this video\./,
                        "Access Denied");
            }

            switch (err) {
                case "Moved Temporarily":
                    self.channel.logger.log("[mediarefresher] Google Docs refresh failed " +
                            "(likely redirect to login page-- make sure it is shared " +
                            "correctly)");
                    self.channel.refCounter.unref("MediaRefresherModule::refreshGoogleDocs");
                    if (cb) cb();
                    return;
                case "Access Denied":
                case "Not Found":
                case "Internal Server Error":
                case "Service Unavailable":
                case "Google Drive does not permit videos longer than 1 hour to be played":
                case "Google Drive videos must be shared publicly":
                    self.channel.logger.log("[mediarefresher] Google Docs refresh failed: " +
                        err);
                    self.channel.refCounter.unref("MediaRefresherModule::refreshGoogleDocs");
                    if (cb) cb();
                    return;
                default:
                    if (err) {
                        self.channel.logger.log("[mediarefresher] Google Docs refresh failed: " +
                            err);
                        Logger.errlog.log("Google Docs refresh failed for ID " + media.id +
                            ": " + err);
                        self.channel.refCounter.unref("MediaRefresherModule::refreshGoogleDocs");
                        if (cb) cb();
                        return;
                    }
            }

            if (media !== self._media) {
                self.channel.refCounter.unref("MediaRefresherModule::refreshGoogleDocs");
                if (cb) cb();
                return;
            }

            self.channel.logger.log("[mediarefresher] Refreshed Google Docs video with ID " +
                media.id);
            media.meta = data.meta;
            self.channel.refCounter.unref("MediaRefresherModule::refreshGoogleDocs");
            if (cb) cb();
        });
    }

    initGooglePlus(media: any, cb: any): void {
        var self = this;

        if (self.dead || self.channel.dead) {
            self.unload();
            return;
        }

        self.channel.refCounter.ref("MediaRefresherModule::initGooglePlus");
        InfoGetter.getMedia(media.id, "gp", function (err, data) {
            if (self.dead || self.channel.dead) {
                return;
            }

            if (typeof err === "string") {
                err = err.replace(/Forbidden/, "Access Denied");
            }

            switch (err) {
                case "Access Denied":
                case "Not Found":
                case "Internal Server Error":
                case "Service Unavailable":
                case "The video is still being processed":
                case "A processing error has occured":
                case "The video has been processed but is not yet accessible":
                case ("Unable to retreive video information.  Check that the video exists " +
                        "and is shared publicly"):
                    self.channel.logger.log("[mediarefresher] Google+ refresh failed: " +
                        err);
                    self.channel.refCounter.unref("MediaRefresherModule::initGooglePlus");
                    if (cb) cb();
                    return;
                default:
                    if (err) {
                        self.channel.logger.log("[mediarefresher] Google+ refresh failed: " +
                            err);
                        Logger.errlog.log("Google+ refresh failed for ID " + media.id +
                            ": " + err);
                        self.channel.refCounter.unref("MediaRefresherModule::initGooglePlus");
                        if (cb) cb();
                        return;
                    }
            }

            if (media !== self._media) {
                self.channel.refCounter.unref("MediaRefresherModule::initGooglePlus");
                if (cb) cb();
                return;
            }

            self.channel.logger.log("[mediarefresher] Refreshed Google+ video with ID " +
                media.id);
            media.meta = data.meta;
            self.channel.refCounter.unref("MediaRefresherModule::initGooglePlus");
            if (cb) cb();
        });
    }

    initVidme(data: any, cb: any): void {
        var self = this;
        self.refreshVidme(data, cb);

        /*
         * Refresh every 55 minutes.
         * The expiration is 1 hour, but refresh 5 minutes early to be safe
         */
        self._interval = setInterval(function () {
            self.refreshVidme(data);
        }, 55 * 60 * 1000);
    }

    refreshVidme(media: any, cb: any): void {
        var self = this;

        if (self.dead || self.channel.dead) {
            self.unload();
            return;
        }

        self.channel.refCounter.ref("MediaRefresherModule::refreshVidme");
        InfoGetter.getMedia(media.id, "vm", function (err, data) {
            if (self.dead || self.channel.dead) {
                return;
            }

            if (err) {
                self.channel.logger.log("[mediarefresher] Vidme refresh failed: " + err);
                self.channel.refCounter.unref("MediaRefresherModule::refreshVidme");
                if (cb) {
                    process.nextTick(cb);
                }
                return;
            }

            if (media !== self._media) {
                self.channel.refCounter.unref("MediaRefresherModule::refreshVidme");
                if (cb) {
                    process.nextTick(cb);
                }
                return;
            }

            self.channel.logger.log("[mediarefresher] Refreshed Vidme video with ID " +
                media.id);
            media.meta = data.meta;
            self.channel.refCounter.unref("MediaRefresherModule::refreshVidme");
            if (cb) {
                process.nextTick(cb);
            }
        });
    }
}

export default MediaRefresherModule;
