// @flow

import mysql from 'mysql';
import bcrypt from 'bcrypt';
import $util from './utilities';
import Logger from './logger';
import Config from './config';
import tables from './database/tables';
import net from 'net';
import util from './utilities';
import * as Metrics from 'cytube-common/lib/metrics/metrics';
import databaseUpdate from './database/update';
import accounts from './database/accounts';
import channels from './database/channels';


var pool = null;
var global_ipbans = {};

function init() {
    pool = mysql.createPool({
        host: Config.get("mysql.server"),
        port: Config.get("mysql.port"),
        user: Config.get("mysql.user"),
        password: Config.get("mysql.password"),
        database: Config.get("mysql.database"),
        multipleStatements: true,
        charset: "UTF8MB4_GENERAL_CI" // Needed for emoji and other non-BMP unicode
    });

    // Test the connection
    pool.getConnection(function (err, conn) {
        if (err) {
            Logger.errlog.log("Initial database connection failed: " + err.stack);
            process.exit(1);
        } else {
            tables.init(runQuery, function (err) {
                if (err) {
                    return;
                }
                databaseUpdate.checkVersion();
                loadAnnouncement();
            });
            // Refresh global IP bans
            listGlobalBans();
        }
    });

    global_ipbans = {};
};

/**
 * Execute a database query
 */
function runQuery(query: string, sub: any, callback: any): void {
    const timer = Metrics.startTimer('db:queryTime');
    // 2nd argument is optional
    if (typeof sub === "function") {
        callback = sub;
        sub = false;
    }

    if (typeof callback !== "function") {
        callback = blackHole;
    }

    //  $FlowIgnore
    pool.getConnection(function (err, conn) {
        if (err) {
            Logger.errlog.log("! DB connection failed: " + err);
            callback("Database failure", null);
        } else {
            function cback(err, res) {
                if (err) {
                    Logger.errlog.log("! DB query failed: " + query);
                    if (sub) {
                        Logger.errlog.log("Substitutions: " + sub);
                    }
                    Logger.errlog.log(err);
                    callback("Database failure", null);
                } else {
                    callback(null, res);
                }
                conn.release();
                Metrics.stopTimer(timer);
            }

            if (process.env.SHOW_SQL) {
                console.log(query);
            }

            if (sub) {
                conn.query(query, sub, cback);
            } else {
                conn.query(query, cback);
            }
        }
    });
};

/**
 * Dummy function to be used as a callback when none is provided
 */
function blackHole() {

}

/* REGION global bans */

/**
 * Check if an IP address is globally banned
 */
function isGlobalIPBanned(ip: string, callback: any): bool {
    var range = util.getIPRange(ip);
    var wrange = util.getWideIPRange(ip);
    var banned = ip in global_ipbans ||
    range in global_ipbans ||
    wrange in global_ipbans;

    if (callback) {
        callback(null, banned);
    }
    return banned;
};

/**
 * Retrieve all global bans from the database.
 * Cache locally in global_bans
 */
function listGlobalBans(callback: (mixed) => mixed = blackHole): void {
    if (typeof callback !== "function") {
        callback = blackHole;
    }

    runQuery("SELECT * FROM global_bans WHERE 1", function (err, res) {
        if (err) {
            callback(err, null);
            return;
        }

        global_ipbans = {};
        for (var i = 0; i < res.length; i++) {
            global_ipbans[res[i].ip] = res[i];
        }

        callback(null, global_ipbans);
    });
};

/**
 * Globally ban by IP
 */
function globalBanIP(ip: string, reason: string, callback: (mixed) => mixed = blackHole): void {
    if (typeof callback !== "function") {
        callback = blackHole;
    }

    var query = "INSERT INTO global_bans (ip, reason) VALUES (?, ?)" +
                " ON DUPLICATE KEY UPDATE reason=?";
    runQuery(query, [ip, reason, reason], function (err, res) {
        if(err) {
            callback(err, null);
            return;
        }

        listGlobalBans();
        callback(null, res);
    });
};

/**
 * Remove a global IP ban
 */
function globalUnbanIP(ip: string, callback: (mixed) => mixed = blackHole): void {
    if (typeof callback !== "function") {
        callback = blackHole;
    }


    var query = "DELETE FROM global_bans WHERE ip=?";
    runQuery(query, [ip], function (err, res) {
        if(err) {
            callback(err, null);
            return;
        }

        listGlobalBans();
        callback(null, res);
    });
};

/* END REGION */

/* password recovery */

/**
 * Deletes recovery rows older than the given time
 */
function cleanOldPasswordResets(callback: any): void {
    if (typeof callback === "undefined") {
        callback = blackHole;
    }

    var query = "DELETE FROM aliases WHERE time < ?";
    runQuery(query, [Date.now() - 24*60*60*1000], callback);
};

function addPasswordReset(data: { ip?: string, name: string, email: string,
                                  hash: mixed, expire: mixed
                                }, cb: (mixed) => mixed = blackHole): void {
    if (typeof cb !== "function") {
        cb = blackHole;
    }

    var ip = data.ip || "";
    var name = data.name;
    var email = data.email;
    var hash = data.hash;
    var expire = data.expire;

    if (!name || !hash) {
        cb("Internal error: Must provide name and hash to insert a new password reset", null);
        return;
    }

    runQuery("INSERT INTO `password_reset` (`ip`, `name`, `email`, `hash`, `expire`) " +
                         "VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE ip=?, hash=?, email=?, expire=?",
                         [ip, name, email, hash, expire, ip, hash, email, expire], cb);
};

function lookupPasswordReset(hash: mixed, cb: any): void {
    if (typeof cb !== "function") {
        return;
    }

    runQuery("SELECT * FROM `password_reset` WHERE hash=?", [hash],
                         function (err, rows) {
        if (err) {
            cb(err, null);
        } else if (rows.length === 0) {
            cb("Invalid password reset link", null);
        } else {
            cb(null, rows[0]);
        }
    });
};

function deletePasswordReset(hash: mixed): void {
    runQuery("DELETE FROM `password_reset` WHERE hash=?", [hash]);
};

/*
function genPasswordReset(ip, name, email, callback) {
    if(typeof callback !== "function")
        callback = blackHole;

    var query = "SELECT email FROM registrations WHERE uname=?";
    runQuery(query, [name], function (err, res) {
        if(err) {
            callback(err, null);
            return;
        }

        if(res.length == 0) {
            callback("Provided username does not exist", null);
            return;
        }

        if(res[0].email != email) {
            callback("Provided email does not match user's email", null);
            return;
        }

        var hash = hashlib.sha256($util.randomSalt(32) + name);
        var expire = Date.now() + 24*60*60*1000;
        query = "INSERT INTO password_reset " +
                "(ip, name, hash, email, expire) VALUES (?, ?, ?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE hash=?, expire=?";
        runQuery(query, [ip, name, hash, email, expire, hash, expire],
                   function (err, res) {
            if(err) {
                callback(err, null);
                return;
            }

            callback(null, hash);
        });
    });
};

function recoverUserPassword(hash, callback) {
    if(typeof callback !== "function")
        callback = blackHole;

    var query = "SELECT * FROM password_reset WHERE hash=?";
    runQuery(query, [hash], function (err, res) {
        if(err) {
            callback(err, null);
            return;
        }

        if(res.length == 0) {
            callback("Invalid password reset link", null);
            return;
        }

        if(Date.now() > res[0].expire) {
            runQuery("DELETE FROM password_reset WHERE hash=?", [hash]);
            callback("Link expired.  Password resets are valid for 24hr",
                     null);
            return;
        }

        var name = res[0].name;

        resetUserPassword(res[0].name, function (err, pw) {
            if(err) {
                callback(err, null);
                return;
            }

            runQuery("DELETE FROM password_reset WHERE hash=?", [hash]);
            callback(null, {
                name: name,
                pw: pw
            });
        });
    });
};

function resetUserPassword(name, callback) {
    if(typeof callback !== "function")
        callback = blackHole;

    var pwChars = "abcdefghijkmnopqrstuvwxyz023456789";
    var pw = "";
    for(var i = 0; i < 10; i++)
        pw += pwChars[parseInt(Math.random() * 33)];

    bcrypt.hash(pw, 10, function (err, data) {
        if(err) {
            Logger.errlog.log("bcrypt error: " + err);
            callback("Password reset failure", null);
            return;
        }

        var query = "UPDATE registrations SET pw=? WHERE uname=?";
        runQuery(query, [data, name], function (err, res) {
            if(err) {
                callback(err, null);
                return;
            }

            callback(null, pw);
        });
    });
};
*/

/* user playlists */

/**
 * Retrieve all of a user's playlists
 */
function listUserPlaylists(name: string, callback: any): void {
    if (typeof callback !== "function") {
        return;
    }

    var query = "SELECT name, count, duration FROM user_playlists WHERE user=?";
    runQuery(query, [name], callback);
};

/**
 * Retrieve a user playlist by (user, name) pair
 */
function getUserPlaylist(username: string, plname: string, callback: any): void {
    if (typeof callback !== "function") {
        return;
    }

    var query = "SELECT contents FROM user_playlists WHERE " +
                "user=? AND name=?";

    runQuery(query, [username, plname], function (err, res) {
        if (err) {
            callback(err, null);
            return;
        }

        if (res.length == 0) {
            callback("Playlist does not exist", null);
            return;
        }

        var pl = null;
        try {
            pl = JSON.parse(res[0].contents);
        } catch(e) {
            callback("Malformed playlist JSON", null);
            return;
        }
        callback(null, pl);
    });
};

/**
 * Saves a user playlist.  Overwrites if the playlist keyed by
 * (user, name) already exists
 */
function saveUserPlaylist(pl: any, username: string, plname: string, callback: any): void {
    if (typeof callback !== "function") {
        callback = blackHole;
    }

    var tmp = [], time = 0;
    for(var i in pl) {
        var e = {
            id: pl[i].media.id,
            title: pl[i].media.title,
            seconds: pl[i].media.seconds || 0,
            type: pl[i].media.type,
            meta: {
                codec: pl[i].media.meta.codec,
                bitrate: pl[i].media.meta.bitrate,
                scuri: pl[i].media.meta.scuri,
                embed: pl[i].media.meta.embed
            }
        };
        time += pl[i].media.seconds || 0;
        tmp.push(e);
    }
    var count = tmp.length;
    var plText = JSON.stringify(tmp);

    var query = "INSERT INTO user_playlists VALUES (?, ?, ?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE contents=?, count=?, duration=?";

    var params = [username, plname, plText, count, time,
                  plText, count, time];

    runQuery(query, params, callback);
};

/**
 * Deletes a user playlist
 */
function deleteUserPlaylist(username: string, plname: string, callback: any): void {
    if (typeof callback !== "function") {
        callback = blackHole;
    }

    var query = "DELETE FROM user_playlists WHERE user=? AND name=?";
    runQuery(query, [username, plname], callback);
};

/* aliases */

/**
 * Records a user or guest login in the aliases table
 */
function recordVisit(ip: any, name: string, callback: any): void {
    if (typeof callback !== "function") {
        callback = blackHole;
    }

    var time = Date.now();
    var query = "DELETE FROM aliases WHERE ip=? AND name=?;" +
                "INSERT INTO aliases VALUES (NULL, ?, ?, ?)";

    runQuery(query, [ip, name, ip, name, time], callback);
};

/**
 * Deletes alias rows older than the given time
 */
function cleanOldAliases(expiration: any, callback: any): void {
    if (typeof callback === "undefined") {
        callback = blackHole;
    }

    var query = "DELETE FROM aliases WHERE time < ?";
    runQuery(query, [Date.now() - expiration], callback);
};

/**
 * Retrieves a list of aliases for an IP address
 */
function getAliases(ip: string, callback: any): void {
    if (typeof callback !== "function") {
        return;
    }

    var query = "SELECT name,time FROM aliases WHERE ip";
    // if the ip parameter is a /24 range, we want to match accordingly
    if (ip.match(/^\d+\.\d+\.\d+$/) || ip.match(/^\d+\.\d+$/)) {
        query += " LIKE ?";
        ip += ".%";
    } else if (ip.match(/^(?:[0-9a-f]{4}:){3}[0-9a-f]{4}$/) ||
               ip.match(/^(?:[0-9a-f]{4}:){2}[0-9a-f]{4}$/)) {
        query += " LIKE ?";
        ip += ":%";
    } else {
        query += "=?";
    }

    query += " ORDER BY time DESC LIMIT 5";

    runQuery(query, [ip], function (err, res) {
        var names = null;
        if(!err) {
            names = res.map(function (row) { return row.name; });
        }

        callback(err, names);
    });
};

/**
 * Retrieves a list of IPs that a name as logged in from
 */
function getIPs(name: string, callback: any): void {
    if (typeof callback !== "function") {
        return;
    }

    var query = "SELECT ip FROM aliases WHERE name=?";
    runQuery(query, [name], function (err, res) {
        var ips = null;
        if(!err) {
            ips = res.map(function (row) { return row.ip; });
        }
        callback(err, ips);
    });
};

/* END REGION */

/* REGION stats */

function addStatPoint(time: mixed, ucount: mixed, ccount: mixed, mem: mixed, callback: any): void {
    if (typeof callback !== "function") {
        callback = blackHole;
    }

    var query = "INSERT INTO stats VALUES (?, ?, ?, ?)";
    runQuery(query, [time, ucount, ccount, mem], callback);
};

function pruneStats(before: mixed, callback: any): void {
    if (typeof callback !== "function") {
        callback = blackHole;
    }

    var query = "DELETE FROM stats WHERE time < ?";
    runQuery(query, [before], callback);
};

function listStats(callback: any): void {
    if (typeof callback !== "function") {
        return;
    }

    var query = "SELECT * FROM stats ORDER BY time ASC";
    runQuery(query, callback);
};

/* END REGION */

/* Misc */
function loadAnnouncement() {
    var query = "SELECT * FROM `meta` WHERE `key`='announcement'";
    runQuery(query, function (err, rows) {
        if (err) {
            return;
        }

        if (rows.length === 0) {
            return;
        }

        var announcement = rows[0].value;
        try {
            announcement = JSON.parse(announcement);
        } catch (e) {
            Logger.errlog.log("Invalid announcement data in database: " +
                              announcement.value);
            clearAnnouncement();
            return;
        }

        var Server = require("./server");
        if (!Server.getServer || !Server.getServer()) {
            return;
        }

        var sv = Server.getServer();
        sv.announcement = announcement;
        for (var id in sv.ioServers) {
            sv.ioServers[id].emit("announcement", announcement);
        }
    });
};

function setAnnouncement(data: any): void {
    var query = "INSERT INTO `meta` (`key`, `value`) VALUES ('announcement', ?) " +
                "ON DUPLICATE KEY UPDATE `value`=?";
    var repl = JSON.stringify(data);
    runQuery(query, [repl, repl]);
};

function clearAnnouncement() {
    runQuery("DELETE FROM `meta` WHERE `key`='announcement'");
};

export default {
  init,
  isGlobalIPBanned,
  listGlobalBans,
  globalBanIP,
  globalUnbanIP,
  cleanOldPasswordResets,
  addPasswordReset,
  lookupPasswordReset,
  deletePasswordReset,
  listUserPlaylists,
  getUserPlaylist,
  saveUserPlaylist,
  deleteUserPlaylist,
  recordVisit,
  cleanOldAliases,
  getAliases,
  getIPs,
  addStatPoint,
  pruneStats,
  listStats,
  loadAnnouncement,
  setAnnouncement,
  clearAnnouncement,
  channels,
  users: accounts,
  query: runQuery,
};
