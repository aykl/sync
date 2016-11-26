// @flow

import http from 'http';
import https from 'https';
import cheerio from 'cheerio';
import Logger from './logger.js';
import Media from './media';
import customEmbed from './customembed';
import Server from './server';
import Config from './config';
import ffmpeg from './ffmpeg';
import mediaquery from 'cytube-mediaquery';
import YouTube from 'cytube-mediaquery/lib/provider/youtube';
import Vimeo from 'cytube-mediaquery/lib/provider/vimeo';
import Vidme from 'cytube-mediaquery/lib/provider/vidme';
import Streamable from 'cytube-mediaquery/lib/provider/streamable';
import GoogleDrive from 'cytube-mediaquery/lib/provider/googledrive';
import TwitchVOD from 'cytube-mediaquery/lib/provider/twitch-vod';

const CustomEmbedFilter = customEmbed.filter;

/*
 * Preference map of quality => youtube formats.
 * see https://en.wikipedia.org/wiki/Youtube#Quality_and_codecs
 *
 * Prefer WebM over MP4, ignore other codecs (e.g. FLV)
 */
const GOOGLE_PREFERENCE = {
    "hd1080": [37, 46],
    "hd720": [22, 45],
    "large": [59, 44],
    "medium": [18, 43, 34] // 34 is 360p FLV as a last-ditch
};

const CONTENT_TYPES = {
    [43]: "webm",
    [44]: "webm",
    [45]: "webm",
    [46]: "webm",
    [18]: "mp4",
    [22]: "mp4",
    [37]: "mp4",
    [59]: "mp4",
    [34]: "flv"
};

var urlRetrieve = function (transport, options, callback) {
    var req = transport.request(options, function (res) {
        res.on("error", function (err) {
            Logger.errlog.log("HTTP response " + options.host + options.path + " failed: "+
                err);
            callback(503, "");
        });

        var buffer = "";
        res.setEncoding("utf-8");
        res.on("data", function (chunk) {
            buffer += chunk;
        });
        res.on("end", function () {
            callback(res.statusCode, buffer);
        });
    });

    req.on("error", function (err) {
        Logger.errlog.log("HTTP request " + options.host + options.path + " failed: " +
            err);
        callback(503, "");
    });

    req.end();
};

var mediaTypeMap = {
    "youtube": "yt",
    "googledrive": "gd",
    "google+": "gp"
};

function convertMedia(media) {
    return new Media(media.id, media.title, media.duration, mediaTypeMap[media.type],
            media.meta);
}

var Getters = {
    /* youtube.com */
    yt(id: mixed, callback: (mixed) => mixed): mixed {
        if (!Config.get("youtube-v3-key")) {
            return callback("The YouTube API now requires an API key.  Please see the " +
                            "documentation for youtube-v3-key in config.template.yaml");
        }


        YouTube.lookup(id).then(function (video) {
            var meta = {};
            if (video.meta.blocked) {
                meta.restricted = video.meta.blocked;
            }

            var media = new Media(video.id, video.title, video.duration, "yt", meta);
            callback(false, media);
        }).catch(function (err) {
            callback(err.message || err, null);
        });
    },

    /* youtube.com playlists */
    yp(id: mixed, callback: (mixed) => mixed): mixed {
        if (!Config.get("youtube-v3-key")) {
            return callback("The YouTube API now requires an API key.  Please see the " +
                            "documentation for youtube-v3-key in config.template.yaml");
        }

        YouTube.lookupPlaylist(id).then(function (videos) {
            videos = videos.map(function (video) {
                var meta = {};
                if (video.meta.blocked) {
                    meta.restricted = video.meta.blocked;
                }

                return new Media(video.id, video.title, video.duration, "yt", meta);
            });

            callback(null, videos);
        }).catch(function (err) {
            callback(err.message || err, null);
        });
    },

    /* youtube.com search */
    ytSearch(query: mixed, callback: (mixed) => mixed): mixed {
        if (!Config.get("youtube-v3-key")) {
            return callback("The YouTube API now requires an API key.  Please see the " +
                            "documentation for youtube-v3-key in config.template.yaml");
        }

        YouTube.search(query).then(function (res) {
            var videos = res.results;
            videos = videos.map(function (video) {
                var meta = {};
                if (video.meta.blocked) {
                    meta.restricted = video.meta.blocked;
                }

                var media = new Media(video.id, video.title, video.duration, "yt", meta);
                media.thumb = { url: video.meta.thumbnail };
                return media;
            });

            callback(null, videos);
        }).catch(function (err) {
            callback(err.message || err, null);
        });
    },

    /* vimeo.com */
    vi(id: string, callback: (mixed) => mixed): void {
        var m = id.match(/([\w-]+)/);
        if (m) {
            id = m[1];
        } else {
            callback("Invalid ID", null);
            return;
        }

        if (Config.get("vimeo-oauth.enabled")) {
            return Getters.vi_oauth(id, callback);
        }

        Vimeo.lookup(id).then(video => {
            video = new Media(video.id, video.title, video.duration, "vi");
            callback(null, video);
        }).catch(error => {
            callback(error.message);
        });
    },

    vi_oauth(id: any, callback: any): void {
        var OAuth = require("oauth");
        var oa = new OAuth.OAuth(
            "https://vimeo.com/oauth/request_token",
            "https://vimeo.com/oauth/access_token",
            Config.get("vimeo-oauth.consumer-key"),
            Config.get("vimeo-oauth.secret"),
            "1.0",
            null,
            "HMAC-SHA1"
        );

        oa.get("https://vimeo.com/api/rest/v2?format=json" +
               "&method=vimeo.videos.getInfo&video_id=" + id,
            null,
            null,
        function (err, data, res) {
            if (err) {
                return callback(err, null);
            }

            try {
                data = JSON.parse(data);

                if (data.stat !== "ok") {
                    return callback(data.err.msg, null);
                }

                var video = data.video[0];

                if (video.embed_privacy !== "anywhere") {
                    return callback("Embedding disabled", null);
                }

                var id = video.id;
                var seconds = parseInt(video.duration);
                var title = video.title;
                callback(null, new Media(id, title, seconds, "vi"));
            } catch (e) {
                callback("Error handling Vimeo response", null);
            }
        });
    },

    /* dailymotion.com */
    dm(id: any, callback: any): void {
        var m = id.match(/([\w-]+)/);
        if (m) {
            id = m[1].split("_")[0];
        } else {
            callback("Invalid ID", null);
            return;
        }
        var options = {
            host: "api.dailymotion.com",
            port: 443,
            path: "/video/" + id + "?fields=duration,title",
            method: "GET",
            dataType: "jsonp",
            timeout: 1000
        };

        urlRetrieve(https, options, function (status, data) {
            switch (status) {
                case 200:
                    break; /* Request is OK, skip to handling data */
                case 400:
                    return callback("Invalid request", null);
                case 403:
                    return callback("Private video", null);
                case 404:
                    return callback("Video not found", null);
                case 500:
                case 503:
                    return callback("Service unavailable", null);
                default:
                    return callback("HTTP " + status, null);
            }

            try {
                data = JSON.parse(data);
                var title = data.title;
                var seconds = data.duration;
                /**
                 * This is a rather hacky way to indicate that a video has
                 * been deleted...
                 */
                if (title === "Deleted video" && seconds === 10) {
                    callback("Video not found", null);
                    return;
                }
                var media = new Media(id, title, seconds, "dm");
                callback(false, media);
            } catch(e) {
                callback(e, null);
            }
        });
    },

    /* soundcloud.com */
    sc(id: any, callback: any): void {
        /* TODO: require server owners to register their own API key, put in config */
        const SC_CLIENT = "2e0c82ab5a020f3a7509318146128abd";

        var m = id.match(/([\w-\/\.:]+)/);
        if (m) {
            id = m[1];
        } else {
            callback("Invalid ID", null);
            return;
        }

        var options = {
            host: "api.soundcloud.com",
            port: 443,
            path: "/resolve.json?url=" + id + "&client_id=" + SC_CLIENT,
            method: "GET",
            dataType: "jsonp",
            timeout: 1000
        };

        urlRetrieve(https, options, function (status, data) {
            switch (status) {
                case 200:
                case 302:
                    break; /* Request is OK, skip to handling data */
                case 400:
                    return callback("Invalid request", null);
                case 403:
                    return callback("Private sound", null);
                case 404:
                    return callback("Sound not found", null);
                case 500:
                case 503:
                    return callback("Service unavailable", null);
                default:
                    return callback("HTTP " + status, null);
            }

            var track = null;
            try {
                data = JSON.parse(data);
                track = data.location;
            } catch(e) {
                callback(e, null);
                return;
            }

            var options2 = {
                host: "api.soundcloud.com",
                port: 443,
                path: track,
                method: "GET",
                dataType: "jsonp",
                timeout: 1000
            };

            /**
             * There has got to be a way to directly get the data I want without
             * making two requests to Soundcloud...right?
             * ...right?
             */
            urlRetrieve(https, options2, function (status, data) {
                switch (status) {
                    case 200:
                        break; /* Request is OK, skip to handling data */
                    case 400:
                        return callback("Invalid request", null);
                    case 403:
                        return callback("Private sound", null);
                    case 404:
                        return callback("Sound not found", null);
                    case 500:
                    case 503:
                        return callback("Service unavailable", null);
                    default:
                        return callback("HTTP " + status, null);
                }

                try {
                    data = JSON.parse(data);
                    var seconds = data.duration / 1000;
                    var title = data.title;
                    var meta = {};
                    if (data.sharing === "private" && data.embeddable_by === "all") {
                        meta.scuri = data.uri;
                    }
                    var media = new Media(id, title, seconds, "sc", meta);
                    callback(false, media);
                } catch(e) {
                    callback(e, null);
                }
            });

        });
    },

    /* livestream.com */
    li(id: any, callback: any): void {
        var m = id.match(/([\w-]+)/);
        if (m) {
            id = m[1];
        } else {
            callback("Invalid ID", null);
            return;
        }
        var title = "Livestream.com - " + id;
        var media = new Media(id, title, "--:--", "li");
        callback(false, media);
    },

    /* twitch.tv */
    tw(id: any, callback: any): void {
        var m = id.match(/([\w-]+)/);
        if (m) {
            id = m[1];
        } else {
            callback("Invalid ID", null);
            return;
        }
        var title = "Twitch.tv - " + id;
        var media = new Media(id, title, "--:--", "tw");
        callback(false, media);
    },

    /* twitch VOD */
    tv(id: any, callback: any): void {
        var m = id.match(/([cv]\d+)/);
        if (m) {
            id = m[1];
        } else {
            process.nextTick(callback, "Invalid Twitch VOD ID");
            return;
        }

        TwitchVOD.lookup(id).then(video => {
            const media = new Media(video.id, video.title, video.duration,
                                    "tv", video.meta);
            process.nextTick(callback, false, media);
        }).catch(function (err) {
            callback(err.message || err, null);
        });
    },

    /* ustream.tv */
    us(id: any, callback: any): void {
        /**
         *2013-09-17
         * They couldn't fucking decide whether channels should
         * be at http://www.ustream.tv/channel/foo or just
         * http://www.ustream.tv/foo so they do both.
         * [](/cleese)
         */
        var m = id.match(/([^\?&#]+)|(channel\/[^\?&#]+)/);
        if (m) {
            id = m[1];
        } else {
            callback("Invalid ID", null);
            return;
        }

        var options = {
            host: "www.ustream.tv",
            port: 80,
            path: "/" + id,
            method: "GET",
            timeout: 1000
        };

        urlRetrieve(http, options, function (status, data) {
            if(status !== 200) {
                callback("Ustream HTTP " + status, null);
                return;
            }

            /**
             * Regexing the ID out of the HTML because
             * Ustream's API is so horribly documented
             * I literally could not figure out how to retrieve
             * this information.
             *
             * [](/eatadick)
             */
            var m = data.match(/https:\/\/www\.ustream\.tv\/embed\/(\d+)/);
            if (m) {
                var title = "Ustream.tv - " + id;
                var media = new Media(m[1], title, "--:--", "us");
                callback(false, media);
            } else {
                callback("Channel ID not found", null);
            }
        });
    },

    /* JWPlayer */
    jw(id: any, callback: any): void {
        var title = "JWPlayer - " + id;
        var media = new Media(id, title, "--:--", "jw");
        callback(false, media);
    },

    /* rtmp stream */
    rt(id: any, callback: any): void {
        var title = "Livestream";
        var media = new Media(id, title, "--:--", "rt");
        callback(false, media);
    },

    /* HLS stream */
    hl(id: any, callback: any): void {
        var title = "Livestream";
        var media = new Media(id, title, "--:--", "hl");
        callback(false, media);
    },

    /* imgur.com albums */
    im(id: any, callback: any): void {
        /**
         * TODO: Consider deprecating this in favor of custom embeds
         */
        var m = id.match(/([\w-]+)/);
        if (m) {
            id = m[1];
        } else {
            callback("Invalid ID", null);
            return;
        }
        var title = "Imgur Album - " + id;
        var media = new Media(id, title, "--:--", "im");
        callback(false, media);
    },

    /* custom embed */
    cu(id: any, callback: any): void {
        var media;
        try {
            media = CustomEmbedFilter(id);
        } catch (e) {
            if (/invalid embed/i.test(e.message)) {
                return callback(e.message);
            } else {
                Logger.errlog.log(e.stack);
                return callback("Unknown error processing embed");
            }
        }
        callback(false, media);
    },

    /* google docs */
    gd(id: any, callback: any): void {
        GoogleDrive.setHTML5HackEnabled(Config.get("google-drive.html5-hack-enabled"));
        var data = {
            type: "googledrive",
            kind: "single",
            id: id
        };

        mediaquery.lookup(data).then(function (video) {
            callback(null, convertMedia(video));
        }).catch(function (err) {
            callback(err.message || err);
        });
    },

    /* Google+ videos */
    gp(id: any, callback: any): void {
        var data = {
            type: "google+",
            kind: "single",
            id: id
        };

        mediaquery.lookup(data).then(function (video) {
            callback(null, convertMedia(video));
        }).catch(function (err) {
            callback(err.message || err);
        });
    },

    /* ffmpeg for raw files */
    fi(id: any, cb: any): void {
        ffmpeg.query(id, function (err, data) {
            if (err) {
                return cb(err);
            }

            var m = new Media(id, data.title, data.duration, "fi", {
                bitrate: data.bitrate,
                codec: data.codec
            });
            cb(null, m);
        });
    },

    /* hitbox.tv */
    hb(id: any, callback: any): void {
        var m = id.match(/([\w-]+)/);
        if (m) {
            id = m[1];
        } else {
            callback("Invalid ID", null);
            return;
        }
        var title = "Hitbox.tv - " + id;
        var media = new Media(id, title, "--:--", "hb");
        callback(false, media);
    },

    /* vid.me */
    vm(id: any, callback: any): void {
        if (!/^[\w-]+$/.test(id)) {
            process.nextTick(callback, "Invalid vid.me ID");
            return;
        }

        Vidme.lookup(id).then(video => {
            const media = new Media(video.id, video.title, video.duration,
                                    "vm", video.meta);
            process.nextTick(callback, false, media);
        }).catch(function (err) {
            callback(err.message || err, null);
        });
    },

    /* streamable */
    sb(id: any, callback: any): void {
        if (!/^[\w-]+$/.test(id)) {
            process.nextTick(callback, "Invalid streamable.com ID");
            return;
        }

        Streamable.lookup(id).then(video => {
            const media = new Media(video.id, video.title, video.duration,
                                    "sb", video.meta);
            process.nextTick(callback, false, media);
        }).catch(function (err) {
            callback(err.message || err, null);
        });
    }
};

export default {
    Getters: Getters,
    getMedia: function (id: any, type: any, callback: any): void {
        if(type in this.Getters) {
            this.Getters[type](id, callback);
        } else {
            callback("Unknown media type '" + type + "'", null);
        }
    }
};
