// @flow weak
/*
 * Adapted from https://github.com/expressjs/csurf
 */

import { CSRFError } from '../errors';

import csrf from 'csrf';

var tokens = csrf();

function init(domain) {
    return function (req, res, next) {
        var secret = req.signedCookies._csrf;
        if (!secret) {
            secret = tokens.secretSync();
            res.cookie("_csrf", secret,  {
                domain: domain,
                signed: true,
                httpOnly: true
            });
        }

        var token;

        req.csrfToken = function csrfToken() {
            if (token) {
                return token;
            }

            token = tokens.create(secret);
            return token;
        };

        next();
    };
};

function verify(req) {
    var secret = req.signedCookies._csrf;
    var token = req.body._csrf || req.query._csrf;

    if (!tokens.verify(secret, token)) {
        throw new CSRFError('Invalid CSRF token');
    }
};

export default { init, verify };
