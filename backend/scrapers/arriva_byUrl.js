const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const path = require('path');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
const {safeGoto, delay} = require('../server/helpers');
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

function formatLocation(location) {
    return location.replace(/\s+/g, '+');
}

async function extractId(page, selector) {
    await page.waitForSelector(selector);
    return await page.evaluate((selector) => document.querySelector(selector).value, selector);
}

async function scrapeArrivaByUrl(departure, destination, date) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: puppeteer.executablePath()
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36');

        console.log("Navigating to the Arriva website...");
        await safeGoto(page, 'https://arriva.si/vozni-redi/');
        await delay(3000);

        try {
            await page.waitForSelector("#CybotCookiebotDialogBodyLevelButtonAccept", {timeout: 10000});
            console.log("Clicking on the accept button...");

            const acceptButton = await page.$("#CybotCookiebotDialogBodyLevelButtonAccept");
            if (acceptButton) {
                await acceptButton.click();
            } else {
                console.log("Accept button not found or already removed.");
            }
        } catch (error) {
            console.log("Accept button not found within the timeout period. Proceeding with the script...");
        }

        const formattedDeparture = formatLocation(departure);
        const formattedDestination = formatLocation(destination);

        // Extract departure ID
        await page.type('.input-departure', departure);
        await page.waitForSelector('.departure-input-wrapper ul.typeahead.dropdown-menu li:first-child a.dropdown-item', {visible: true});
        await page.click('.departure-input-wrapper ul.typeahead.dropdown-menu li:first-child a.dropdown-item');
        await delay(1000);
        const departureId = await extractId(page, '#departure_id');
        console.log('DepartureID: ', departureId);

        // Extract destination ID
        console.log("Typing destination");
        await page.type('.input-destination', destination);
        console.log("Waiting for selector dropdown destination");
        await page.waitForSelector('.destination-input-wrapper ul.typeahead.dropdown-menu li:first-child a.dropdown-item', {visible: true});
        console.log("Clicking selector dropdown destination");
        await page.click('.destination-input-wrapper ul.typeahead.dropdown-menu li:first-child a.dropdown-item');
        await delay(1000);
        console.log("Extracting destination id....");
        const destinationId = await extractId(page, '#destination_id');
        await delay(1000);
        console.log('DestinationID: ', destinationId);

        console.log(`Extracted IDs - Departure ID: ${departureId}, Destination ID: ${destinationId}`);

        const url = `https://arriva.si/vozni-redi/?departure-123=${formattedDeparture}&departure_id=${departureId}&departure=${formattedDeparture}&destination=${formattedDestination}&destination_id=${destinationId}&trip_date=${date}`;
        console.log("Navigating to the URL:", url);
        await safeGoto(page, url);
        console.log("Current page URL:", page.url());

        const noDirectConnection = await page.evaluate(() => {
            const alertElement = document.querySelector('.alert.alert-danger');
            return alertElement ? alertElement.textContent.trim() : null;
        });

        if (noDirectConnection) {
            console.log("No direct connections found.");
            await browser.close();
            return [];
        }

        const connectionData = await fetchConnection(page.url());
        await browser.close();
        return connectionData;
    } catch (error) {
        if (browser) {
            await browser.close();
        }
        console.error('Error in scrapeArrivaByUrl:', error);
        throw error;  // Ensure the error is thrown to trigger retries
    }
}

const fetchConnection = async (url) => {
    try {
        if (!url) {
            console.log("URL is missing.");
            return [];
        }

        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);
        const connectionData = [];

        $('div.connection:not(.connection-header) .connection-inner').each((index, el) => {
            const connection = $(el);

            // Extract departure and arrival details
            const departureTimeElement = connection.find('.departure-arrival .departure td span');
            const departureTime = departureTimeElement.eq(0).text().trim();
            const departure = departureTimeElement.parent().next().find('span').text().trim();

            const arrivalTimeElement = connection.find('.departure-arrival .arrival td span');
            const arrivalTime = arrivalTimeElement.eq(0).text().trim();
            const arrival = arrivalTimeElement.parent().next().find('span').text().trim();

            // Extract duration details
            const travelDuration = connection.find('.duration .travel-duration span').text().trim();
            const prevoznik = connection.find('.duration .prevoznik span').eq(1).text().trim();
            const peron = connection.find('.duration .peron span').eq(1).text().trim();

            // Extract length and price
            const length = connection.find('.length').text().trim();
            const price = connection.find('.price').text().trim();

            // Push all data into connectionData array
            connectionData.push({
                departure,
                departureTime,
                arrival,
                arrivalTime,
                travelDuration,
                prevoznik,
                peron,
                length,
                price
            });
        });

        // Check if connectionData is empty
        if (connectionData.length === 0) {
            console.log("No connections found.");
        } else {
            // Process connection data
            console.log(connectionData);

            // Write data to a file
            const jsonData = JSON.stringify(connectionData, null, 2); // Convert data to JSON string with indentation
            const directory = path.resolve(__dirname, "../data/timetable");
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory, {recursive: true});
            }

            fs.writeFileSync(path.resolve(directory, "arriva_byUrl.json"), jsonData, 'utf8');
            console.log('Data has been saved to arriva_byUrl.json');
            return connectionData;
        }
    } catch (err) {
        console.error(err);
        return [];
    }
};

module.exports = {scrapeArrivaByUrl};