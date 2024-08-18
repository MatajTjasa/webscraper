const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
const fs = require('fs');
const path = require("path");
require('dotenv').config();

/*// Hiding puppeteer usage
puppeteer.use(StealthPlugin());

puppeteer.use(
    RecaptchaPlugin({
        provider: {
            id: '2captcha',
            token: process.env.CAPTCHA_APIKEY
        },
        visualFeedback: true
    })
);*/

function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    fs.mkdirSync(dirname, {recursive: true});
}

async function scrapeSlovenskeZelezniceByUrl(departureStationCode, destinationStationCode, date) {
    //console.log('Chromium path:', puppeteer.executablePath());
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: process.env.PUPPETEER_CACHE_DIR
    });

    const page = await browser.newPage();

    const url = `https://potniski.sz.si/vozni-redi-results/?action=timetables_search&current-language=sl&departure-date=${date}&entry-station=${departureStationCode}&exit-station=${destinationStationCode}`;

    await page.goto(url, {waitUntil: 'networkidle0'});
    console.log(url);
    console.log('Page should be fully loaded (vlak)');

    // Check for any errors in the page
    const pageErrors = [];
    page.on('pageerror', error => {
        console.error('Page error:', error);
        pageErrors.push(error);
    });

    // Captcha check
    const isCaptchaPresent = await page.evaluate(() => {
        return document.querySelector('.g-recaptcha') !== null;
    });

    if (isCaptchaPresent) {
        console.log('Captcha detected, attempting to solve...');
        const {solved, error} = await page.solveRecaptchas();
        if (solved) {
            console.log('Captcha solved.');
        } else {
            console.error('Captcha solving failed:', error);
            await browser.close();
            throw new Error('Failed to solve captcha');
        }
    }

    const noConnectionsMessage = await page.evaluate(() => {
        const alertElement = document.querySelector('.alert.alert-danger');
        const connectionElements = document.querySelectorAll('.connection');
        return alertElement ? alertElement.innerText.includes('Za relacijo na izbrani dan ni povezave.') : connectionElements.length === 0;
    });

    if (noConnectionsMessage) {
        console.log('No connections found for the selected date and route.');
        await browser.close();
        return [];
    }

    try {
        await page.waitForSelector('.connection.connection-active', {visible: true}); //.connection
        console.log('.connection.connection-active selector found');
    } catch (error) {
        console.error('Error: .connection.connection-active selector not found:', error);
        const content = await page.content();
        console.log('Page content at error:', content);
        await browser.close();
        throw error;
    }

    const trainSchedules = await page.evaluate(() => {
        const getTextContent = (element, selector) => {
            const foundElement = element.querySelector(selector);
            return foundElement ? foundElement.innerText.trim() : '';
        };

        const splitInfo = (info) => {
            const regex = /(.+?)(?:\sob\s|\nob\s)(\d{2}:\d{2})/;
            const match = info.match(regex);
            if (match) {
                return {
                    station: match[1].trim(),
                    time: match[2].trim()
                };
            }
            return {
                station: info.trim(),
                time: ''
            };
        };

        const connections = Array.from(document.querySelectorAll('.connection ')); // Space after .connection added
        return connections.map(connection => {
            const isActive = connection.classList.contains('connection-active');
            const departureInfo = splitInfo(getTextContent(connection, '.item.has-issues .text-wrapper .fw-medium'));
            const arrivalInfo = splitInfo(getTextContent(connection, '.item.train-exit-station .fw-medium'));
            const travelTime = getTextContent(connection, '.d-flex.me-md-3.mt-2.mt-md-0.flex-column.flex-md-row .value.has-white-bg.fs-5.fit-content');
            const trainType = getTextContent(connection, '.train-list-item .train-trigger').trim();
            return {
                departureStation: departureInfo.station,
                departureTime: departureInfo.time,
                arrivalStation: arrivalInfo.station,
                arrivalTime: arrivalInfo.time,
                travelTime,
                trainType,
                isActive
            };
        });
    });

    console.log(trainSchedules);

    const filePath = path.join(__dirname, '../data/timetable/slovenske_zeleznice_byUrl.json');
    ensureDirectoryExistence(filePath);

    fs.writeFile(filePath, JSON.stringify(trainSchedules, null, 2), err => {
        if (err) {
            console.error('Error writing file slovenske_zeleznice_byUrl.json:', err);
        } else {
            console.log('Successfully written to slovenske_zeleznice_byUrl.json.');
        }
    });

    await browser.close();
    return trainSchedules;
}

module.exports = {scrapeSlovenskeZelezniceByUrl};

// Example usage with station codes
//scrapeSlovenskeZelezniceByUrl('42300', '43400', '08.08.2024').catch(err => console.error('Error executing scrapeSlovenskeZelezniceByUrl:', err));