// @flow

import fs from 'graceful-fs';
import path from 'path';

function getTimeString() {
    var d = new Date();
    return d.toDateString() + " " + d.toTimeString().split(" ")[0];
}

class Logger {
    filename: string;
    writer: { write(): mixed, end(): mixed };
    _log: mixed;

    constructor(filename: string) {
        this.filename = filename;
        this.writer = fs.createWriteStream(filename, {
            flags: "a",
            encoding: "utf-8"
        });
    }

    log(): void {
        var msg = "";
        for(var i in arguments)
            msg += arguments[i];

        if(this.dead) {
            return;
        }

        var str = "[" + getTimeString() + "] " + msg + "\n";
        try {
            this.writer.write(str);
        } catch(e) {
            errlog.log("WARNING: Attempted logwrite failed: " + this.filename);
            errlog.log("Message was: " + msg);
            errlog.log(e);
        }
    }

    close(): void {
        try {
            this.writer.end();
        } catch(e) {
            errlog.log("Log close failed: " + this.filename);
        }
    }
}

function makeConsoleLogger(filename: string): any & { log(): void } {
    var log = new Logger(filename);
    log._log = log.log;
    // $FlowIgnore
    log.log = function (): void {
        console.log.apply(console, arguments);
        this._log.apply(this, arguments);
    }
    return log;
}

var errlog = makeConsoleLogger(path.join(__dirname, "..", "error.log"));
var syslog = makeConsoleLogger(path.join(__dirname, "..", "sys.log"));
var eventlog = makeConsoleLogger(path.join(__dirname, "..", "events.log"));

export default {
  Logger,
  errlog,
  syslog,
  eventlog
};
