/**
 * web/account.js - Webserver details for account management
 *
 * @author Calvin Montgomery <cyzon@cyzon.us>
 */

var webserver = require("./webserver");
var sendPage = require("./react-template").sendPage;
var Logger = require("../logger");
var db = require("../database");
var $util = require("../utilities");
var Config = require("../config");
var Server = require("../server");
var session = require("../session");
var csrf = require("./csrf");
var Maybe = require('../ps/Data.Maybe/index.js');
var Either = require('../ps/Data.Either/index.js');
var SynctubePage = require('../ps/Synctube.Client.Page/index.js');
var SynctubeAccountChannelsPage =
  require('../ps/Synctube.Client.Page.AccountChannels/index.js');
var SynctubeAccountEditPage =
  require('../ps/Synctube.Client.Page.AccountEdit/index.js');
var SynctubeAccountPasswordResetPage =
  require('../ps/Synctube.Client.Page.AccountPasswordReset/index.js');

/**
 * Handles a GET request for /account/edit
 */
function handleAccountEditPage(req, res) {
    if (webserver.redirectHttps(req, res)) {
        return;
    }

    var loginName = Maybe.Nothing.create();
    var editResult = Maybe.Nothing.create();
    var csrfToken = typeof res.req.csrfToken === 'function'
      ? res.req.csrfToken() : '';
    var page = SynctubePage.AccountEdit.create({
      csrfToken, loginName, editResult
    });
    sendPage(res, page);
}

/**
 * Handles a POST request to edit a user"s account
 */
function handleAccountEdit(req, res) {
    csrf.verify(req);

    var action = req.body.action;
    switch(action) {
        case "change_password":
            handleChangePassword(req, res);
            break;
        case "change_email":
            handleChangeEmail(req, res);
            break;
        default:
            res.send(400);
            break;
    }
}

/**
 * Handles a request to change the user"s password
 */
function handleChangePassword(req, res) {
    var name = req.body.name;
    var oldpassword = req.body.oldpassword;
    var newpassword = req.body.newpassword;

    if (typeof name !== "string" ||
        typeof oldpassword !== "string" ||
        typeof newpassword !== "string") {
        res.send(400);
        return;
    }

    if (newpassword.length === 0) {
      var editResult = Maybe.Just
        .create(Either.Left.create("New password must not be empty"));
      loginName = Maybe.Nothing.create();
      var csrfToken = typeof res.req.csrfToken === 'function'
        ? res.req.csrfToken() : '';
      var page = SynctubePage.AccountEdit.create({
        csrfToken, loginName, editResult
      });
      sendPage(res, page);
      return;
    }

    if (!req.user) {
      var editResult = Maybe.Just
        .create(Either.Left.create("You must be logged in to change your password"));
      loginName = Maybe.Nothing.create();
      var csrfToken = typeof res.req.csrfToken === 'function'
        ? res.req.csrfToken() : '';
      var page = SynctubePage.AccountEdit.create({
        csrfToken, loginName, editResult
      });
      sendPage(res, page);
      return;
    }

    newpassword = newpassword.substring(0, 100);

    db.users.verifyLogin(name, oldpassword, function (err, user) {
        if (err) {
            var editResult = Maybe.Just
              .create(Either.Left.create(err));
            loginName = Maybe.Nothing.create();
            var csrfToken = typeof res.req.csrfToken === 'function'
              ? res.req.csrfToken() : '';
            var page = SynctubePage.AccountEdit.create({
              csrfToken, loginName, editResult
            });
            sendPage(res, page);
            return;
        }

        db.users.setPassword(name, newpassword, function (err, dbres) {
            if (err) {
                var editResult = Maybe.Just
                  .create(Either.Left.create(err));
                loginName = Maybe.Nothing.create();
                var csrfToken = typeof res.req.csrfToken === 'function'
                  ? res.req.csrfToken() : '';
                var page = SynctubePage.AccountEdit.create({
                  csrfToken, loginName, editResult
                });
                sendPage(res, page);
                return;
            }

            Logger.eventlog.log("[account] " + req.realIP +
                                " changed password for " + name);

            db.users.getUser(name, function (err, user) {
                if (err) {
                    var editResult = Maybe.Just
                      .create(Either.Left.create(err));
                    loginName = Maybe.Nothing.create();
                    var csrfToken = typeof res.req.csrfToken === 'function'
                      ? res.req.csrfToken() : '';
                    var page = SynctubePage.AccountEdit.create({
                      csrfToken, loginName, editResult
                    });
                    sendPage(res, page);
                    return;
                }

                res.user = user;
                var expiration = new Date(parseInt(req.signedCookies.auth.split(":")[1]));
                session.genSession(user, expiration, function (err, auth) {
                    if (err) {
                        var editResult = Maybe.Just
                          .create(Either.Left.create(err));
                        loginName = Maybe.Nothing.create();
                        var csrfToken = typeof res.req.csrfToken === 'function'
                          ? res.req.csrfToken() : '';
                        var page = SynctubePage.AccountEdit.create({
                          csrfToken, loginName, editResult
                        });
                        sendPage(res, page);
                        return;
                    }

                    if (req.hostname.indexOf(Config.get("http.root-domain")) >= 0) {
                        res.cookie("auth", auth, {
                            domain: Config.get("http.root-domain-dotted"),
                            expires: expiration,
                            httpOnly: true,
                            signed: true
                        });
                    } else {
                        res.cookie("auth", auth, {
                            expires: expiration,
                            httpOnly: true,
                            signed: true
                        });
                    }

                    var editResult = Maybe.Just
                      .create(Either.Right.create("Password changed."));
                    loginName = Maybe.Nothing.create();
                    var csrfToken = typeof res.req.csrfToken === 'function'
                      ? res.req.csrfToken() : '';
                    var page = SynctubePage.AccountEdit.create({
                      csrfToken, loginName, editResult
                    });
                    sendPage(res, page);
                    return;
                });
            });
        });
    });
}

/**
 * Handles a request to change the user"s email
 */
function handleChangeEmail(req, res) {
    var name = req.body.name;
    var password = req.body.password;
    var email = req.body.email;
    var csrfToken = typeof res.req.csrfToken === 'function'
      ? res.req.csrfToken() : '';

    if (typeof name !== "string" ||
        typeof password !== "string" ||
        typeof email !== "string") {
        res.send(400);
        return;
    }

    if (!$util.isValidEmail(email) && email !== "") {
      var editResult = Maybe.Just
        .create(Either.Left.create("Invalid email address"));
      var loginName = Maybe.Nothing.create();
      var page = SynctubePage.AccountEdit.create({
        csrfToken, loginName, editResult
      });
      sendPage(res, page);
      return;
    }

    db.users.verifyLogin(name, password, function (err, user) {
        if (err) {
            var editResult = Maybe.Just
              .create(Either.Left.create(err));
            var loginName = Maybe.Nothing.create();
            var page = SynctubePage.AccountEdit.create({
              csrfToken, loginName, editResult
            });
            sendPage(res, page);
            return;
        }

        db.users.setEmail(name, email, function (err, dbres) {
            if (err) {
                var editResult = Maybe.Just
                  .create(Either.Left.create(err));
                var loginName = Maybe.Nothing.create();
                var page = SynctubePage.AccountEdit.create({
                  csrfToken, loginName, editResult
                });
                sendPage(res, page);
                return;
            }
            Logger.eventlog.log("[account] " + req.realIP +
                                " changed email for " + name +
                                " to " + email);

            var editResult = Maybe.Just
              .create(Either.Right.create("Email address changed."));
            var loginName = Maybe.Just.create(name);
            var page = SynctubePage.AccountEdit.create({
              csrfToken, loginName, editResult
            });
            sendPage(res, page);
        });
    });
}

/**
 * Handles a GET request for /account/channels
 */
function handleAccountChannelPage(req, res) {
    if (webserver.redirectHttps(req, res)) {
        return;
    }

    if (!req.user) {
      var loggedIn = !!res.user;
      var channels = [];
      var csrfToken = typeof res.req.csrfToken === 'function'
        ? res.req.csrfToken() : '';
      var newChannelError = Maybe.Nothing.create();
      var deleteChannelError = Maybe.Nothing.create();
      var page = SynctubePage.AccountChannels.create({
        csrfToken, loggedIn, channels
        , newChannelError, deleteChannelError
      });

      return sendPage(res, page);
    }

    db.channels.listUserChannels(req.user.name, function (err, channels) {
        var loggedIn = !!res.user;
        var csrfToken = typeof res.req.csrfToken === 'function'
          ? res.req.csrfToken() : '';
        var newChannelError = Maybe.Nothing.create();
        var deleteChannelError = Maybe.Nothing.create();
        var page = SynctubePage.AccountChannels.create({
          csrfToken, loggedIn, channels
          , newChannelError, deleteChannelError
        });

        return sendPage(res, page);
    });
}

/**
 * Handles a POST request to modify a user"s channels
 */
function handleAccountChannel(req, res) {
    csrf.verify(req);

    var action = req.body.action;
    switch(action) {
        case "new_channel":
            handleNewChannel(req, res);
            break;
        case "delete_channel":
            handleDeleteChannel(req, res);
            break;
        default:
            res.send(400);
            break;
    }
}

/**
 * Handles a request to register a new channel
 */
function handleNewChannel(req, res) {

    var name = req.body.name;
    if (typeof name !== "string") {
        res.send(400);
        return;
    }

    if (!req.user) {
        var loggedIn = !!res.user;
        var channels = [];
        var csrfToken = typeof res.req.csrfToken === 'function'
          ? res.req.csrfToken() : '';
        var newChannelError = Maybe.Nothing.create();
        var deleteChannelError = Maybe.Nothing.create();
        var page = SynctubePage.AccountChannels.create({
          csrfToken, loggedIn, channels
          , newChannelError, deleteChannelError
        });

        return sendPage(res, page);
    }

    db.channels.listUserChannels(req.user.name, function (err, channels) {
        if (err) {
            var loggedIn = !!res.user;
            var csrfToken = typeof res.req.csrfToken === 'function'
              ? res.req.csrfToken() : '';
            var newChannelError = Maybe.Just.create(err);
            var deleteChannelError = Maybe.Nothing.create();
            var page = SynctubePage.AccountChannels.create({
              csrfToken, loggedIn, channels: []
              , newChannelError, deleteChannelError
            });

            return sendPage(res, page);
        }

        if (name.match(Config.get("reserved-names.channels"))) {
            var loggedIn = !!res.user;
            var channels = [];
            var csrfToken = typeof res.req.csrfToken === 'function'
              ? res.req.csrfToken() : '';
            var newChannelError = Maybe.Just.create("That channel name is reserved");
            var deleteChannelError = Maybe.Nothing.create();
            var page = SynctubePage.AccountChannels.create({
              csrfToken, loggedIn, channels
              , newChannelError, deleteChannelError
            });

            return sendPage(res, page);
        }

        if (channels.length >= Config.get("max-channels-per-user") &&
                req.user.global_rank < 255) {
            var loggedIn = !!res.user;
            var channels = [];
            var csrfToken = typeof res.req.csrfToken === 'function'
              ? res.req.csrfToken() : '';
            var newChannelErrorMessage = "You are not allowed to register more than " +
                             Config.get("max-channels-per-user") + " channels.";
            var newChannelError = Maybe.Just.create(newChannelErrorMessage);
            var deleteChannelError = Maybe.Nothing.create();
            var page = SynctubePage.AccountChannels.create({
              csrfToken, loggedIn, channels
              , newChannelError, deleteChannelError
            });

            return sendPage(res, page);
        }

        db.channels.register(name, req.user.name, function (err, channel) {
            if (!err) {
                Logger.eventlog.log("[channel] " + req.user.name + "@" +
                                    req.realIP +
                                    " registered channel " + name);
                var sv = Server.getServer();
                if (sv.isChannelLoaded(name)) {
                    var chan = sv.getChannel(name);
                    var users = Array.prototype.slice.call(chan.users);
                    users.forEach(function (u) {
                        u.kick("Channel reloading");
                    });

                    if (!chan.dead) {
                        chan.emit("empty");
                    }
                }
                channels.push({
                    name: name
                });
            }

            var loggedIn = !!res.user;
            var channels = [];
            var csrfToken = typeof res.req.csrfToken === 'function'
              ? res.req.csrfToken() : '';
            var newChannelError = err ? Maybe.Just.create(err) : Maybe.Nothing.create();
            var deleteChannelError = Maybe.Nothing.create();
            var page = SynctubePage.AccountChannels.create({
              csrfToken, loggedIn, channels
              , newChannelError, deleteChannelError
            });

            return sendPage(res, page);
        });
    });
}

/**
 * Handles a request to delete a new channel
 */
function handleDeleteChannel(req, res) {
    var name = req.body.name;
    if (typeof name !== "string") {
        res.send(400);
        return;
    }

    if (!req.user) {
        var loggedIn = !!res.user;
        var channels = [];
        var csrfToken = typeof res.req.csrfToken === 'function'
          ? res.req.csrfToken() : '';
        var newChannelError = Maybe.Nothing.create();
        var deleteChannelError = Maybe.Nothing.create();
        var page = SynctubePage.AccountChannels.create({
          csrfToken, loggedIn, channels
          , newChannelError, deleteChannelError
        });

        return sendPage(res, page);
    }


    db.channels.lookup(name, function (err, channel) {
        if (err) {
            var loggedIn = !!res.user;
            var channels = [];
            var csrfToken = typeof res.req.csrfToken === 'function'
              ? res.req.csrfToken() : '';
            var newChannelError = Maybe.Nothing.create();
            var deleteChannelError = Maybe.Just.create(err);
            var page = SynctubePage.AccountChannels.create({
              csrfToken, loggedIn, channels
              , newChannelError, deleteChannelError
            });

            return sendPage(res, page);
        }

        if (channel.owner !== req.user.name && req.user.global_rank < 255) {
            db.channels.listUserChannels(req.user.name, function (err2, channels) {
                var loggedIn = !!res.user;
                if (err2) {
                  channels = [];
                }
                var csrfToken = typeof res.req.csrfToken === 'function'
                  ? res.req.csrfToken() : '';
                var newChannelError = Maybe.Nothing.create();
                var deleteChannelError = Maybe.Just.create("You do not have permission to delete this channel");
                var page = SynctubePage.AccountChannels.create({
                  csrfToken, loggedIn, channels
                  , newChannelError, deleteChannelError
                });

                return sendPage(res, page);
            });
            return;
        }

        db.channels.drop(name, function (err) {
            if (!err) {
                Logger.eventlog.log("[channel] " + req.user.name + "@" +
                                    req.realIP + " deleted channel " +
                                    name);
            }
            var sv = Server.getServer();
            if (sv.isChannelLoaded(name)) {
                var chan = sv.getChannel(name);
                chan.clearFlag(require("../flags").C_REGISTERED);
                var users = Array.prototype.slice.call(chan.users);
                users.forEach(function (u) {
                    u.kick("Channel reloading");
                });

                if (!chan.dead) {
                    chan.emit("empty");
                }
            }
            db.channels.listUserChannels(req.user.name, function (err2, channels) {
                var loggedIn = !!res.user;
                if (err2) {
                  channels = [];
                }
                var csrfToken = typeof res.req.csrfToken === 'function'
                  ? res.req.csrfToken() : '';
                var newChannelError = Maybe.Nothing.create();
                var deleteChannelError = Maybe.Nothing.create();
                if (err) {
                  deleteChannelError = Maybe.Just.create(err);
                }
                var page = SynctubePage.AccountChannels.create({
                  csrfToken, loggedIn, channels
                  , newChannelError, deleteChannelError
                });

                return sendPage(res, page);
            });
        });
    });
}

/**
 * Handles a GET request for /account/profile
 */
function handleAccountProfilePage(req, res) {
    if (webserver.redirectHttps(req, res)) {
        return;
    }

    if (!req.user) {
      var error = Maybe.Nothing.create();
      var profile = Maybe.Nothing.create();
      var csrfToken = typeof res.req.csrfToken === 'function'
        ? res.req.csrfToken() : '';
      var page = SynctubePage.AccountProfile.create({
        csrfToken, profile, error
      });
      return sendPage(res, page);
    }

    db.users.getProfile(req.user.name, function (err, profile) {
        if (err) {
            var error = Maybe.Just.create(err);
            var profile = Maybe.Nothing.create();
            var csrfToken = typeof res.req.csrfToken === 'function'
              ? res.req.csrfToken() : '';
            var page = SynctubePage.AccountProfile.create({
              csrfToken, profile, error
            });
            return sendPage(res, page);
        }

        var error = Maybe.Nothing.create();
        var profile = Maybe.Just.create({
          image: profile.image,
          text: profile.text,
          login: req.user.name
        });
        var csrfToken = typeof res.req.csrfToken === 'function'
          ? res.req.csrfToken() : '';
        var page = SynctubePage.AccountProfile.create({
          csrfToken, profile, error
        });
        return sendPage(res, page);
    });
}

/**
 * Handles a POST request to edit a profile
 */
function handleAccountProfile(req, res) {
    csrf.verify(req);

    if (!req.user) {
      var error = Maybe.Just.create("You must be logged in to edit your profile");
      var profile = Maybe.Nothing.create();
      var csrfToken = typeof res.req.csrfToken === 'function'
        ? res.req.csrfToken() : '';
      var page = SynctubePage.AccountProfile.create({
        csrfToken, profile, error
      });
      return sendPage(res, page);
    }

    var image = req.body.image;
    var text = req.body.text;

    db.users.setProfile(req.user.name, { image: image, text: text }, function (err) {
        if (err) {
            var error = Maybe.Just.create(err);
            var profile = Maybe.Nothing.create();
            var csrfToken = typeof res.req.csrfToken === 'function'
              ? res.req.csrfToken() : '';
            var page = SynctubePage.AccountProfile.create({
              csrfToken, profile, error
            });
            return sendPage(res, page);
        }


        var error = Maybe.Nothing.create();
        var profile = Maybe.Just.create({
          image, text, login: req.user.name
        });
        var csrfToken = typeof res.req.csrfToken === 'function'
          ? res.req.csrfToken() : '';
        var page = SynctubePage.AccountProfile.create({
          csrfToken, profile, error
        });
        return sendPage(res, page);
    });
}

/**
 * Handles a GET request for /account/passwordreset
 */
function handlePasswordResetPage(req, res) {
    if (webserver.redirectHttps(req, res)) {
        return;
    }

    var reset = SynctubeAccountPasswordResetPage.NoReset.create();
    var csrfToken = typeof res.req.csrfToken === 'function'
      ? res.req.csrfToken() : '';
    var page = SynctubePage.AccountPasswordReset.create({ csrfToken, reset });
    return sendPage(res, page);
}

/**
 * Handles a POST request to reset a user's password
 */
function handlePasswordReset(req, res) {
    csrf.verify(req);

    var name = req.body.name,
        email = req.body.email;

    if (typeof name !== "string" || typeof email !== "string") {
        res.send(400);
        return;
    }

    if (!$util.isValidUserName(name)) {
      var reset = SynctubeAccountPasswordResetPage
        .ResetError.create("Invalid username '" + name + "'");
      var csrfToken = typeof res.req.csrfToken === 'function'
        ? res.req.csrfToken() : '';
      var page = SynctubePage.AccountPasswordReset.create({ csrfToken, reset });
      return sendPage(res, page);
    }

    db.users.getEmail(name, function (err, actualEmail) {
        if (err) {
            var reset = SynctubeAccountPasswordResetPage.ResetError.create(err);
            var csrfToken = typeof res.req.csrfToken === 'function'
              ? res.req.csrfToken() : '';
            var page = SynctubePage.AccountPasswordReset.create({ csrfToken, reset });
            return sendPage(res, page);
        }

        if (actualEmail !== email.trim()) {
            var reset = SynctubeAccountPasswordResetPage
              .ResetError.create(name + " doesn't have an email address on record.  Please contact an " +
                        "administrator to manually reset your password.");
            var csrfToken = typeof res.req.csrfToken === 'function'
              ? res.req.csrfToken() : '';
            var page = SynctubePage.AccountPasswordReset.create({ csrfToken, reset });
            return sendPage(res, page);
        } else if (actualEmail === "") {
            var reset = SynctubeAccountPasswordResetPage
              .ResetError.create("Provided email does not match the email address on record for " + name);
            var csrfToken = typeof res.req.csrfToken === 'function'
              ? res.req.csrfToken() : '';
            var page = SynctubePage.AccountPasswordReset.create({ csrfToken, reset });
            return sendPage(res, page);
        }

        var hash = $util.sha1($util.randomSalt(64));
        // 24-hour expiration
        var expire = Date.now() + 86400000;
        var ip = req.realIP;

        db.addPasswordReset({
            ip: ip,
            name: name,
            email: email,
            hash: hash,
            expire: expire
        }, function (err, dbres) {
            if (err) {
                var reset = SynctubeAccountPasswordResetPage
                  .ResetError.create(err);
                var csrfToken = typeof res.req.csrfToken === 'function'
                  ? res.req.csrfToken() : '';
                var page = SynctubePage.AccountPasswordReset.create({ csrfToken, reset });
                return sendPage(res, page);
            }

            Logger.eventlog.log("[account] " + ip + " requested password recovery for " +
                                name + " <" + email + ">");

            if (!Config.get("mail.enabled")) {
                var reset = SynctubeAccountPasswordResetPage
                  .ResetError.create("This server does not have mail support enabled.  Please " +
                            "contact an administrator for assistance.");
                var csrfToken = typeof res.req.csrfToken === 'function'
                  ? res.req.csrfToken() : '';
                var page = SynctubePage.AccountPasswordReset.create({ csrfToken, reset });
                return sendPage(res, page);
            }

            var msg = "A password reset request was issued for your " +
                      "account `"+ name + "` on " + Config.get("http.domain") +
                      ".  This request is valid for 24 hours.  If you did "+
                      "not initiate this, there is no need to take action."+
                      "  To reset your password, copy and paste the " +
                      "following link into your browser: " +
                      Config.get("http.domain") + "/account/passwordrecover/"+hash;

            var mail = {
                from: Config.get("mail.from-name") + " <" + Config.get("mail.from-address") + ">",
                to: email,
                subject: "Password reset request",
                text: msg
            };

            Config.get("mail.nodemailer").sendMail(mail, function (err, response) {
                if (err) {
                    Logger.errlog.log("mail fail: " + err);
                    var reset = SynctubeAccountPasswordResetPage
                      .ResetError.create("Sending reset email failed.  Please contact an " +
                                "administrator for assistance.");
                    var csrfToken = typeof res.req.csrfToken === 'function'
                      ? res.req.csrfToken() : '';
                    var page = SynctubePage.AccountPasswordReset.create({ csrfToken, reset });
                    return sendPage(res, page);
                } else {
                    var reset = SynctubeAccountPasswordResetPage
                      .ResetSent.create(email);
                    var csrfToken = typeof res.req.csrfToken === 'function'
                      ? res.req.csrfToken() : '';
                    var page = SynctubePage.AccountPasswordReset.create({ csrfToken, reset });
                    return sendPage(res, page);
                }
            });
        });
    });
}

/**
 * Handles a request for /account/passwordrecover/<hash>
 */
function handlePasswordRecover(req, res) {
    var hash = req.params.hash;
    if (typeof hash !== "string") {
        res.send(400);
        return;
    }

    var ip = req.realIP;

    db.lookupPasswordReset(hash, function (err, row) {
        if (err) {
            var recoveredPassword = Either.Left.create(err);
            var page = SynctubePage
              .AccountPasswordRecover.create({ recoveredPassword });
            return sendPage(res, page);
        }

        if (Date.now() >= row.expire) {
            var errorMessage = "This password recovery link has expired.  Password " +
              "recovery links are valid only for 24 hours after " +
              "submission.";
            var recoveredPassword = Either.Left.create(errorMessage);
            var page = SynctubePage
              .AccountPasswordRecover.create({ recoveredPassword });
            return sendPage(res, page);
        }

        var newpw = "";
        const avail = "abcdefgihkmnpqrstuvwxyz0123456789";
        for (var i = 0; i < 10; i++) {
            newpw += avail[Math.floor(Math.random() * avail.length)];
        }
        db.users.setPassword(row.name, newpw, function (err) {
            if (err) {
                var errorMessage = "Database error.  Please contact an administrator if " +
                  "this persists.";
                var recoveredPassword = Either.Left.create(errorMessage);
                var page = SynctubePage
                  .AccountPasswordRecover.create({ recoveredPassword });
                return sendPage(res, page);
            }

            db.deletePasswordReset(hash);
            Logger.eventlog.log("[account] " + ip + " recovered password for " + row.name);

            var recoveredPassword = Either.Right.create(newpw);
            var page = SynctubePage
              .AccountPasswordRecover.create({ recoveredPassword });
            return sendPage(res, page);
        });
    });
}

module.exports = {
    /**
     * Initialize the module
     */
    init: function (app) {
        app.get("/account/edit", handleAccountEditPage);
        app.post("/account/edit", handleAccountEdit);
        app.get("/account/channels", handleAccountChannelPage);
        app.post("/account/channels", handleAccountChannel);
        app.get("/account/profile", handleAccountProfilePage);
        app.post("/account/profile", handleAccountProfile);
        app.get("/account/passwordreset", handlePasswordResetPage);
        app.post("/account/passwordreset", handlePasswordReset);
        app.get("/account/passwordrecover/:hash", handlePasswordRecover);
        app.get("/account", function (req, res) {
            res.redirect("/login");
        });
    }
};
