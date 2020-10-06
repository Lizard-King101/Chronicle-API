const db = require('./database');
const OneSignal = require('onesignal-node');
const client = new OneSignal.Client('41ee7a86-cd4f-49f1-9b73-3f3482650bf8','N2QyOGY4NjYtZGEwNi00YmRmLTljYTEtNDkyNjdkZDBmM2Ux');

function SendNotifications(options) {
    return new Promise(async (res) => {
        let notification_id = options.notification ? options.notification : false;
        let test = options.test ? options.test : false;
        if(notification_id) {
            let notification_data = await db.getRow(`SELECT * FROM notifications WHERE id = '${notification_id}'`);
            let andTest = test ? ' AND test_account = 1' : ''
            let users = await db.query(`SELECT uuid FROM accounts WHERE push_token IS NOT NULL AND uuid IS NOT NULL ${andTest}`);
            users = users.map(m => m.uuid);
            if(users.length > 0) {
                let notification = {
                    contents: {
                        "en": notification_data.message
                    },
                    headings: {
                        "en": notification_data.title
                    },
                    include_player_ids: users
                }
                switch (notification_data.action) {
                    case 'raffle':
                        notification.data = {
                            raffle: notification_data.action_data
                        }
                        break;
                    case 'url':
                        notification.url = notification_data.action_data;
                        break;
                }
                client.createNotification(notification).then((response) => {
                    res({notification, response});
                }).catch(e => {
                    res({error: e, notification});
                })
            } else {
                res({error: 'no users for this notification'})
            }
        } else {
            res({error: 'notification id undefined'});
        }
    })
}

module.exports.sendNotifications = SendNotifications;