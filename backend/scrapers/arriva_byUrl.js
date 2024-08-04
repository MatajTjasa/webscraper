const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const puppeteer = require('puppeteer');
const path = require('path');

function formatLocation(location) {
    return location.replace(/\s+/g, '+');
}

async function extractId(page, selector) {
    await page.waitForSelector(selector);
    return await page.evaluate((selector) => document.querySelector(selector).value, selector);
}

async function scrapeArrivaByUrl(departure, destination, date) {
    try {
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();

        // Preprocess departure and destination to replace spaces with '+'
        const formattedDeparture = formatLocation(departure);
        const formattedDestination = formatLocation(destination);

        // Navigate to the Arriva website
        console.log("Navigating to the Arriva website...");
        await page.goto('https://arriva.si/vozni-redi/', {waitUntil: 'networkidle0'});

        await delay(3000);

        // Enter departure and select the first suggestion to get the departure ID
        await page.type('.input-departure', departure);
        await page.waitForSelector('.departure-input-wrapper ul.typeahead.dropdown-menu li:first-child a.dropdown-item', {visible: true});
        await page.click('.departure-input-wrapper ul.typeahead.dropdown-menu li:first-child a.dropdown-item');
        await delay(1000);

        // Extract departure ID
        const departureId = await extractId(page, '#departure_id');

        // Enter destination and select the first suggestion to get the destination ID
        await page.type('.input-destination', destination);
        await page.waitForSelector('.destination-input-wrapper ul.typeahead.dropdown-menu li:first-child a.dropdown-item', {visible: true});
        await page.click('.destination-input-wrapper ul.typeahead.dropdown-menu li:first-child a.dropdown-item');
        await delay(1000);

        // Extract destination ID
        const destinationId = await extractId(page, '#destination_id');

        console.log(`Extracted IDs - Departure ID: ${departureId}, Destination ID: ${destinationId}`);

        const url = `https://arriva.si/vozni-redi/?departure-123=${formattedDeparture}&departure_id=${departureId}&departure=${formattedDeparture}&destination=${formattedDestination}&destination_id=${destinationId}&trip_date=${date}`;
        console.log("Navigating to the URL:", url);
        await page.goto(url, {waitUntil: 'networkidle0'});
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
        console.error(error);
        return [];
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

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {scrapeArrivaByUrl};

// Example usage
scrapeArrivaByUrl('Ljubljana AP', 'Maribor AP', '08.08.2024').catch(err => console.error('Error executing scrapeArrivaByUrl:', err));
