const webpush = require('web-push');
require('dotenv').config();

const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY
};

webpush.setVapidDetails(
    'mailto:' + process.env.EMAIL,
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

async function sendPushNotification(subscription, payload) {
    try {
        await webpush.sendNotification(subscription, payload);
        console.log('Push Notification sent successfully.');
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}

module.exports = {
    sendPushNotification,
};
