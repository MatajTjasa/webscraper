const fs = require('fs');
const crypto = require('crypto');
const cheerio = require('cheerio');
const {sendPushNotification} = require('./pushNotifications');
require('dotenv').config();

function createHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

async function checkForChanges(html, selectors, subscription) {
    if (!html) {
        console.log("No HTML content provided, skipping change detection.");
        return;
    }

    const $ = cheerio.load(html);

    let selectedContent = '';
    selectors.forEach(selector => {
        selectedContent += $(selector).html() || ''; // safeguard against null selectors
    });

    const currentHash = createHash(selectedContent);

    const previousHash = fs.existsSync('html_structure_hash.txt') ? fs.readFileSync('html_structure_hash.txt', 'utf8') : null;

    if (previousHash && currentHash !== previousHash) {
        console.log("Selected structure changed, sending notification...");
        const payload = JSON.stringify({title: 'Site Change Detected', body: 'The HTML structure has changed.'});
        await sendPushNotification(subscription, payload);
    } else {
        console.log("No changes detected in the selected structure.");
    }

    if (fs.existsSync('html_structure_hash.txt')) {
        fs.unlinkSync('html_structure_hash.txt');
    }

    fs.writeFileSync('html_structure_hash.txt', currentHash);
}

module.exports = {
    checkForChanges,
};