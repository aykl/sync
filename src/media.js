// @flow

import util from './utilities';


type Meta = { [key: mixed]: mixed };

class Media {
    id: mixed;
    seconds: mixed;
    duration: mixed;
    type: any;
    meta: Meta;
    currentTime: mixed;
    paused: bool;
    title: string;
    thumb: mixed;

    constructor(id: mixed, title: string, seconds: mixed, type: mixed, meta: Meta = {}) {
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

    pack(): { [key: mixed]: mixed } {
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

    getTimeUpdate(): mixed {
        return {
            currentTime: this.currentTime,
            paused: this.paused
        };
    }

    getFullUpdate(): mixed {
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
