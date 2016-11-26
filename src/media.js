// @flow

import util from './utilities';

class Media {
    id: any;
    seconds: any;
    duration: any;
    type: any;
    meta: any;
    currentTime: any;
    paused: bool;
    title: string;
    thumb: any;

    constructor(id: any, title: string, seconds: any, type: any, meta: any = {}) {
        this.id = id;
        this.setTitle(title);

        this.seconds = seconds === "--:--" ? 0 : parseInt(seconds);
        this.duration = util.formatTime(seconds);
        this.type = type;
        this.meta = meta;
        this.currentTime = 0;
        this.paused = false;
    }

    setTitle(title: string): void {
        this.title = title;
        if (this.title.length > 100) {
            this.title = this.title.substring(0, 97) + "...";
        }
    }

    pack(): any {
        return {
            id: this.id,
            title: this.title,
            seconds: this.seconds,
            duration: this.duration,
            type: this.type,
            meta: {
                direct: this.meta.direct,
                restricted: this.meta.restricted,
                codec: this.meta.codec,
                bitrate: this.meta.bitrate,
                scuri: this.meta.scuri,
                embed: this.meta.embed,
                gdrive_subtitles: this.meta.gdrive_subtitles,
                html5hack: this.meta.html5hack
            }
        };
    }

    getTimeUpdate(): any {
        return {
            currentTime: this.currentTime,
            paused: this.paused
        };
    }

    getFullUpdate(): any {
        var packed = this.pack();
        packed.currentTime = this.currentTime;
        packed.paused = this.paused;
        return packed;
    }

    reset(): void {
        this.currentTime = 0;
        this.paused = false;
    }
}

export default Media;
