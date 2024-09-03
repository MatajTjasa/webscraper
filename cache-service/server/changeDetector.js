const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const cheerio = require('cheerio');
require('dotenv').config();

function createHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

async function checkForChanges(html, selectors) {
    const $ = cheerio.load(html);

    let selectedContent = '';
    selectors.forEach(selector => {
        selectedContent += $(selector).html();
    });

    const currentHash = createHash(selectedContent);

    const previousHash = fs.existsSync('html_structure_hash.txt') ? fs.readFileSync('html_structure_hash.txt', 'utf8') : null;

    if (previousHash && currentHash !== previousHash) {
        console.log("Selected structure changed, sending email notification...");
        await sendEmailNotification();
    } else {
        console.log("No changes detected in the selected structure.");
    }

    if (fs.existsSync('html_structure_hash.txt')) {
        fs.unlinkSync('html_structure_hash.txt');
    }

    fs.writeFileSync('html_structure_hash.txt', currentHash);
}

async function sendEmailNotification() {
    const transporter = nodemailer.createTransport({
        service: 'outlook',
        auth: {
            user: "mail",
            pass: "pass"
        }
    });

    const mailOptions = {
        from: "mail",
        to: "mail",
        subject: 'VlakAvtoBus Alert: HTML Structure Change Detected',
        text: 'The HTML structure of the page has changed, please review your scraper.'
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully.");
}

module.exports = {
    checkForChanges,
};