var fs = require("fs");
var path = require("path");
var Config = require("../config");

var HtmlDocument =
  require('../ps/Synctube.Client.Html.Document/index.js');
var Page =
  require('../ps/Synctube.Client.Page/index.js');


function getBaseUrl(res) {
    var req = res.req;
    return req.realProtocol + "://" + req.header("host");
}

/**
 * Renders and serves a react template
 */
function sendPage(res, page) {
  var loginDomain = Config.get("https.enabled")
    ? Config.get("https.full-address")
    : Config.get("http.full-address");
  var csrfToken = typeof res.req.csrfToken === 'function'
    ? res.req.csrfToken() : '';
  var baseUrl = getBaseUrl(res);
  var locals = {};
  locals.loggedIn = locals.loggedIn || !!res.user;
  locals.loginName = locals.loginName || res.user ? res.user.name : false;
  locals.superadmin = locals.superadmin || res.user ? res.user.global_rank >= 255 : false;

  var navData = {
    baseUrl, csrfToken, loginDomain
    , loggedIn: locals.loggedIn, loginName: locals.loginName
    , superAdmin: locals.superadmin
  }
  var documentData = {
    head: {
      title: Config.get("html-template.title"),
      description: Config.get("html-template.description"),
      author: "Calvin 'calzoneman' 'cyzon' Montgomery",
      page: page
    },
    body: {
      page
      , nav: navData
    }
  }
  var html = HtmlDocument.renderDocument(documentData);
  res.send(html);
}

module.exports = {
    sendPage: sendPage
};
