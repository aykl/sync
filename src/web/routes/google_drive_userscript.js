var sendPage = require("../react-template").sendPage;
var SynctubePage = require('../../ps/Synctube.Client.Page/index.js');

export default function initialize(app) {
    app.get('/google_drive_userscript', (req, res) => {
        var page = SynctubePage.GoogleDriveUserscript.create({});

        return sendPage(res, page);
    });
}
