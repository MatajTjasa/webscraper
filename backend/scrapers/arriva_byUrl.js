const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
const {safeGoto, delay} = require('../server/helpers');
const {getCodeArriva} = require('../server/database.js');
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
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--incognito'],
            executablePath: puppeteer.executablePath()
        });

        const context = browser.defaultBrowserContext();
        const page = (await context.pages())[0]

        console.log("Navigating to the Arriva website...");
        await safeGoto(page, 'https://arriva.si/vozni-redi/');
        await delay(3000);

        // Handle accept button
        try {
            await page.waitForSelector("#CybotCookiebotDialogBodyLevelButtonAccept", {timeout: 10000});
            console.log("Accepting cookies...");

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

        const departureId = await getCodeArriva(departure);
        const destinationId = await getCodeArriva(destination);

        if (!departureId || !destinationId) {
            console.log("One or both station codes could not be found in the database.");
            await browser.close();
            return [];
        }

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
        throw error;
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

            const departureTimeElement = connection.find('.departure-arrival .departure td span');
            const departureTime = departureTimeElement.eq(0).text().trim();
            const departure = departureTimeElement.parent().next().find('span').text().trim();

            const arrivalTimeElement = connection.find('.departure-arrival .arrival td span');
            const arrivalTime = arrivalTimeElement.eq(0).text().trim();
            const arrival = arrivalTimeElement.parent().next().find('span').text().trim();

            const travelDuration = connection.find('.duration .travel-duration span').text().trim();
            const prevoznik = connection.find('.duration .prevoznik span').eq(1).text().trim();
            const peron = connection.find('.duration .peron span').eq(1).text().trim();

            const length = connection.find('.length').text().trim();
            const price = connection.find('.price').text().trim();

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
            return [];
        } else {
            console.log(connectionData);
            return connectionData;
        }
    } catch (err) {
        console.error(err);
        return [];
    }
};

module.exports = {scrapeArrivaByUrl};