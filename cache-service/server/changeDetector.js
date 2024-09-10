const fs = require('fs');
const crypto = require('crypto');
const cheerio = require('cheerio');
const {getSelectors, selectorsChanged} = require('./database');
const {createTransport} = require("nodemailer");
require('dotenv').config();

function createHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

async function checkForChanges(html, name) {
    if (!html) {
        console.log("No HTML content provided, skipping change detection.");
        return;
    }

    const selectors = await getSelectors(name);

    const $ = cheerio.load(html);

    const arrivaAlertPresent = $('div.alert.alert-danger').length > 0;
    const noPrevoziAlert = html.includes('Noben prevoz ne ustreza iskalnim pogojem');
    const noVlakAlert = html.includes('Za relacijo na izbrani dan ni povezave.');
    if (arrivaAlertPresent || noPrevoziAlert || noVlakAlert) {
        console.log("No schedule found.");
        return;
    }

    const allSelectorsValid = selectors.every(selector => {
        const elementContent = $(selector).html() || '';
        if (!elementContent) {
            console.log(`No content found for selector: ${selector}`);
        }
        return elementContent;
    });

    if (!allSelectorsValid) {
        console.log("Not all selectors returned valid content, skipping change detection.");

        await sendEmailNotification(name);
        await selectorsChanged(name);
    }

    // const currentHash = createHash(selectedContent);
    //
    // const previousHash = fs.existsSync('html_structure_hash.txt') ? fs.readFileSync('html_structure_hash.txt', 'utf8') : null;
    //
    // if (previousHash && currentHash !== previousHash) {
    //     console.log("Selected structure changed, sending notification...");
    //     const payload = JSON.stringify({title: 'Site Change Detected', body: 'The HTML structure has changed.'});
    //     await sendPushNotification(subscription, payload);
    // } else {
    //     console.log("No changes detected in the selected structure.");
    // }
    //
    // if (fs.existsSync('html_structure_hash.txt')) {
    //     fs.unlinkSync('html_structure_hash.txt');
    // }
    //
    // fs.writeFileSync('html_structure_hash.txt', currentHash);
}

async function sendEmailNotification(name) {
    const transporter = createTransport({
        service: 'outlook',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.EMAIL,
        to: process.env.NOTIFICATION_EMAIL,
        subject: 'VlakAvtoBus Alert: HTML Structure Change Detected',
        text: `The HTML structure of the page has changed, please review your ${name} scraper.`
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully.");
}


module.exports = {
    checkForChanges,
};