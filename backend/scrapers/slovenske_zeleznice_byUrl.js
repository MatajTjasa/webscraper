const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
const fs = require('fs');
const path = require("path");
const {safeGoto} = require('../server/helpers');
require('dotenv').config();

// Hiding puppeteer usage
puppeteer.use(StealthPlugin());

puppeteer.use(
    RecaptchaPlugin({
        provider: {
            id: '2captcha',
            token: process.env.CAPTCHA_APIKEY
        },
        visualFeedback: true
    })
);

async function extractTrainData(page) {
    return await page.evaluate(() => {
        const getTextContent = (element, selector) => {
            const foundElement = element.querySelector(selector);
            return foundElement ? foundElement.innerText.trim() : '';
        };

        const cleanText = (text) => {
            if (!text) return '';
            return text.replace(/^Vlak:\s*/, '').replace(/\s+/g, ' ').trim();
        };

        const connections = Array.from(document.querySelectorAll('.connection'));
        return connections.map((connection) => {
            const isActive = connection.classList.contains('connection-active');

            const timeAndStations = connection.querySelector('.d-flex.align-items-center.gap-1.fs-5.fw-medium');
            const departureTime = timeAndStations?.children[0]?.innerText.trim() || '';
            const departureStation = timeAndStations?.children[1]?.innerText.trim() || '';
            const arrivalStation = timeAndStations?.children[5]?.innerText.trim() || '';
            const arrivalTime = timeAndStations?.children[6]?.innerText.trim() || '';

            const detailsContainer = connection.querySelector('.accordion-header.d-flex.flex-column.flex-md-row.justify-content-between.rounded-2.p-2');
            const detailParagraphs = detailsContainer ? Array.from(detailsContainer.querySelectorAll('p')) : [];
            let transfers = detailParagraphs[0]?.querySelector('.value')?.innerText.trim();
            transfers = !transfers || transfers === '0' ? '/' : transfers;
            const travelTime = detailParagraphs[1]?.querySelector('.value')?.innerText.trim() || '';

            const rawTrainType = getTextContent(connection, '.graphic-transit .fw-medium.fs-3.fs-4.fit-content');
            const trainType = cleanText(rawTrainType);

            const warnings = Array.from(
                connection.querySelectorAll('.notice-wrapper .text-wrap.lh-normal')
            ).map((warning) => warning.innerText.trim());

            return {
                isActive,
                departureTime,
                departureStation,
                arrivalTime,
                arrivalStation,
                travelTime,
                trainType,
                transfers,
                warnings,
            };
        });
    });
}

async function scrapeSlovenskeZelezniceByUrl(departureStationCode, destinationStationCode, date) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: process.env.PUPPETEER_CACHE_DIR
    });

    const page = await browser.newPage();

    const url = `https://potniski.sz.si/vozni-redi-results/?action=timetables_search&current-language=sl&departure-date=${date}&entry-station=${departureStationCode}&exit-station=${destinationStationCode}`;
    console.log('Navigating to URL:', url);

    await page.goto(url, {waitUntil: 'networkidle2'});

    const trainSchedules = await extractTrainData(page);

    console.log('Extracted train schedules:', trainSchedules);

    await browser.close();
    return trainSchedules;
}

module.exports = {scrapeSlovenskeZelezniceByUrl};

// Example usage:
//scrapeSlovenskeZelezniceByUrl('42300', '43400', '2025-01-04').then(data => console.log(JSON.stringify(data, null, 2))).catch(err => console.error('Error:', err));
