import { sendPage } from '../react-template';

var SynctubePage = require('../../ps/Synctube.Client.Page/index.js');

export default function initialize(app, channelIndex, maxEntries) {
    app.get('/', (req, res) => {
        channelIndex.listPublicChannels().then((channels) => {
            channels.sort((a, b) => {
                if (a.usercount === b.usercount) {
                    return a.uniqueName > b.uniqueName ? -1 : 1;
                }

                return b.usercount - a.usercount;
            });

            channels = channels.slice(0, maxEntries);

            var page = SynctubePage.Index.create({ channels });
            sendPage(res, page);
        });
    });
}
