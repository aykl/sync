// @flow

import Config from './config';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

var needPermissionsFixed = [
    path.join(__dirname, "..", "chanlogs"),
    path.join(__dirname, "..", "chandump"),
    path.join(__dirname, "..", "google-drive-subtitles")
];

function fixPermissions(user: any, group: any): void {
    var uid = resolveUid(user);
    var gid = resolveGid(group);
    needPermissionsFixed.forEach(function (dir) {
        if (fs.existsSync(dir)) {
            fs.chownSync(dir, uid, gid);
        }
    });
}

function resolveUid(user) {
    return parseInt(execSync('id -u ' + user), 10);
}

function resolveGid(group) {
    return parseInt(execSync('id -g ' + group), 10);
}

if (Config.get("setuid.enabled")) {
    setTimeout(function() {
        try {
            // $FlowIgnore
            let uid : string = process.getuid();
            // $FlowIgnore
            let gid : string = process.getgid();
            fixPermissions(Config.get("setuid.user"), Config.get("setuid.group"));
            console.log(`Old User ID: ${uid}, Old Group ID: ${gid}`);

            gid = Config.get("setuid.group");
            // $FlowIgnore
            process.setgid(gid);
            uid = Config.get("setuid.user");
            // $FlowIgnore
            process.setuid(uid);
            
            console.log(`New User ID: ${uid}, New Group ID: ${gid}`);
        } catch (err) {
            console.log("Error setting uid: " + err.stack);
            process.exit(1);
        }
    }, (Config.get("setuid.timeout")));
};
