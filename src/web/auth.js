/**
 * web/auth.js - Webserver functions for user authentication and registration
 *
 * @author Calvin Montgomery <cyzon@cyzon.us>
 */

var pug = require("pug");
var path = require("path");
var webserver = require("./webserver");
var cookieall = webserver.cookieall;
var sendPage = require("../react-template").sendPage;
var SynctubePage = require('../../ps/Synctube.Client.Page/index.js');
var SynctubeLoginPage =
  require('../ps/Synctube.Client.Page.Login/index.js');
var SynctubeRegisterPage =
  require('../ps/Synctube.Client.Page.Register/index.js');
var Maybe = require('../ps/Data.Maybe/index.js');
var Logger = require("../logger");
var $util = require("../utilities");
var db = require("../database");
var Config = require("../config");
var url = require("url");
var session = require("../session");
var csrf = require("./csrf");

/**
 * Processes a login request.  Sets a cookie upon successful authentication
 */
function handleLogin(req, res) {
    csrf.verify(req);

    var name = req.body.name;
    var password = req.body.password;
    var rememberMe = req.body.remember;
    var dest = req.body.dest || req.header("referer") || null;
    dest = dest && dest.match(/login|logout/) ? null : dest;

    if (typeof name !== "string" || typeof password !== "string") {
        res.sendStatus(400);
        return;
    }

    var host = req.hostname;
    if (host.indexOf(Config.get("http.root-domain")) === -1 &&
            Config.get("http.alt-domains").indexOf(host) === -1) {
        Logger.syslog.log("WARNING: Attempted login from non-approved domain " + host);
        return res.sendStatus(403);
    }

    var expiration;
    if (rememberMe) {
        expiration = new Date("Fri, 31 Dec 9999 23:59:59 GMT");
    } else {
        expiration = new Date(Date.now() + 7*24*60*60*1000);
    }

    password = password.substring(0, 100);

    db.users.verifyLogin(name, password, function (err, user) {
        if (err) {
            if (err === "Invalid username/password combination") {
                Logger.eventlog.log("[loginfail] Login failed (bad password): " + name
                                  + "@" + req.realIP);
            }

            var signInStatus = SynctubeLoginPage
              .NotLoggedIn.create(Maybe.Just(err));
            var redirect = Maybe.Nothing.create();
            var csrfToken = typeof res.req.csrfToken === 'function'
              ? res.req.csrfToken() : '';
            var page = SynctubePage.Login.create({
              signInStatus, redirect, csrfToken
            });

            return sendPage(res, page);
        }

        session.genSession(user, expiration, function (err, auth) {
            if (err) {
                var signInStatus = SynctubeLoginPage
                  .NotLoggedIn.create(Maybe.Just(err));
                var redirect = Maybe.Nothing.create();
                var csrfToken = typeof res.req.csrfToken === 'function'
                  ? res.req.csrfToken() : '';
                var page = SynctubePage.Login.create({
                  signInStatus, redirect, csrfToken
                });

                return sendPage(res, page);
            }

            if (req.hostname.indexOf(Config.get("http.root-domain")) >= 0) {
                // Prevent non-root cookie from screwing things up
                res.clearCookie("auth");
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

            if (dest) {
                res.redirect(dest);
            } else {
                res.user = user;
                var signInStatus = SynctubeLoginPage
                  .LoggedIn.create(user);
                var redirect = Maybe.Nothing.create();
                var csrfToken = typeof res.req.csrfToken === 'function'
                  ? res.req.csrfToken() : '';
                var page = SynctubePage.Login.create({
                  signInStatus, redirect, csrfToken
                });

                return sendPage(res, page);
            }
        });
    });
}

/**
 * Handles a GET request for /login
 */
function handleLoginPage(req, res) {
    if (webserver.redirectHttps(req, res)) {
        return;
    }

    if (req.user) {
        var signInStatus = SynctubeLoginPage
          .WasAlreadyLoggedIn.create(req.user);
        var redirect = Maybe.Nothing.create();
        var csrfToken = typeof res.req.csrfToken === 'function'
          ? res.req.csrfToken() : '';
        var page = SynctubePage.Login.create({
          signInStatus, redirect, csrfToken
        });

        return sendPage(res, page);
    }

    var redirect = req.query.dest || req.header("referer");
    var redirectValue = Maybe.Nothing.create();
    if (!/\/register/.test(redirect)) {
        redirectValue = Maybe.Just.create(redirect);
    }

    var signInStatus = SynctubeLoginPage
      .NotLoggedIn.create(Maybe.Nothing.create());
    var csrfToken = typeof res.req.csrfToken === 'function'
      ? res.req.csrfToken() : '';
    var page = SynctubePage.Login.create({
      signInStatus, redirect: redirectValue, csrfToken
    });

    return sendPage(res, page);
}

/**
 * Handles a request for /logout.  Clears auth cookie
 */
function handleLogout(req, res) {
    csrf.verify(req);

    res.clearCookie("auth");
    req.user = res.user = null;
    // Try to find an appropriate redirect
    var dest = req.body.dest || req.header("referer");
    dest = dest && dest.match(/login|logout|account/) ? null : dest;

    var host = req.hostname;
    if (host.indexOf(Config.get("http.root-domain")) !== -1) {
        res.clearCookie("auth", { domain: Config.get("http.root-domain-dotted") });
    }

    if (dest) {
        res.redirect(dest);
    } else {
        var page = SynctubePage.Logout.create({
            redirect: Maybe.Nothing.create()
        });

        return sendPage(res, page);
    }
}

/**
 * Handles a GET request for /register
 */
function handleRegisterPage(req, res) {
    if (webserver.redirectHttps(req, res)) {
        return;
    }

    if (req.user) {
        var csrfToken = typeof res.req.csrfToken === 'function'
          ? res.req.csrfToken() : '';
        var registrationStatus = SynctubeRegisterPage.LoggedIn.create();
        var page = SynctubePage.Logout.create({
            registrationStatus, csrfToken
        });

        return sendPage(res, page);
    }

    var csrfToken = typeof res.req.csrfToken === 'function'
      ? res.req.csrfToken() : '';
    var registrationStatus = SynctubeRegisterPage
      .NotRegistered.create(Maybe.Nothing.create());
    var page = SynctubePage.Logout.create({
        registrationStatus, csrfToken
    });

    return sendPage(res, page);
}

/**
 * Processes a registration request.
 */
function handleRegister(req, res) {
    csrf.verify(req);

    var name = req.body.name;
    var password = req.body.password;
    var email = req.body.email;
    if (typeof email !== "string") {
        email = "";
    }
    var ip = req.realIP;

    if (typeof name !== "string" || typeof password !== "string") {
        res.sendStatus(400);
        return;
    }

    if (name.length === 0) {
        var csrfToken = typeof res.req.csrfToken === 'function'
          ? res.req.csrfToken() : '';
        var registrationStatus = SynctubeRegisterPage
          .NotRegistered.create(Maybe.Just.create("Username must not be empty"));
        var page = SynctubePage.Logout.create({
            registrationStatus, csrfToken
        });

        return sendPage(res, page);
    }

    if (name.match(Config.get("reserved-names.usernames"))) {
        var csrfToken = typeof res.req.csrfToken === 'function'
          ? res.req.csrfToken() : '';
        var registrationStatus = SynctubeRegisterPage
          .NotRegistered.create(Maybe.Just.create("That username is reserved"));
        var page = SynctubePage.Logout.create({
            registrationStatus, csrfToken
        });

        return sendPage(res, page);
    }

    if (password.length === 0) {
        var csrfToken = typeof res.req.csrfToken === 'function'
          ? res.req.csrfToken() : '';
        var registrationStatus = SynctubeRegisterPage
          .NotRegistered.create(Maybe.Just.create("Password must not be empty"));
        var page = SynctubePage.Logout.create({
            registrationStatus, csrfToken
        });

        return sendPage(res, page);
    }

    password = password.substring(0, 100);

    if (email.length > 0 && !$util.isValidEmail(email)) {
        var csrfToken = typeof res.req.csrfToken === 'function'
          ? res.req.csrfToken() : '';
        var registrationStatus = SynctubeRegisterPage
          .NotRegistered.create(Maybe.Just.create("Invalid email address"));
        var page = SynctubePage.Logout.create({
            registrationStatus, csrfToken
        });

        return sendPage(res, page);
    }

    db.users.register(name, password, email, ip, function (err) {
        if (err) {
            var csrfToken = typeof res.req.csrfToken === 'function'
              ? res.req.csrfToken() : '';
            var registrationStatus = SynctubeRegisterPage
              .NotRegistered.create(Maybe.Just.create(err));
            var page = SynctubePage.Logout.create({
                registrationStatus, csrfToken
            });

            return sendPage(res, page);
        } else {
            Logger.eventlog.log("[register] " + ip + " registered account: " + name +
                             (email.length > 0 ? " <" + email + ">" : ""));

            var csrfToken = typeof res.req.csrfToken === 'function'
              ? res.req.csrfToken() : '';
            var registrationStatus = SynctubeRegisterPage
              .RegistrationSuccess.create(name);
            var page = SynctubePage.Logout.create({
                registrationStatus, csrfToken
            });

            return sendPage(res, page);
        }
    });
}

module.exports = {
    /**
     * Initializes auth callbacks
     */
    init: function (app) {
        app.get("/login", handleLoginPage);
        app.post("/login", handleLogin);
        app.post("/logout", handleLogout);
        app.get("/register", handleRegisterPage);
        app.post("/register", handleRegister);
    }
};
