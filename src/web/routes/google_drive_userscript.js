// @flow

import { sendPug } from '../pug';

export default function initialize(app: any): void {
    app.get('/google_drive_userscript', (req, res) => {
        return sendPug(res, 'google_drive_userscript')
    });
}
