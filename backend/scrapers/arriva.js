const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const puppeteer = require('puppeteer')

async function scrapeArriva(departure, destination, date) {
    try {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        // Navigate to the website
        console.log("Navigating to the website...");
        await page.goto('https://arriva.si/vozni-redi/');

        await delay(1000);

        console.log("Waiting for the accept button to appear...");
        try {
            await page.waitForSelector("#CybotCookiebotDialogBodyLevelButtonAccept", {timeout: 10000});
            console.log("Clicking on the accept button...");
            await page.click("#CybotCookiebotDialogBodyLevelButtonAccept");
        } catch (error) {
            console.log("Accept button not found within the timeout period. Proceeding with the script...");
        }

        // Departure field
        console.log("Clicking input for departure...");
        await page.type('.input-departure', departure);

        await delay(1000);

        console.log("Waiting for departure dropdown menu...");
        await page.waitForSelector('.departure-input-wrapper ul.typeahead.dropdown-menu li:first-child a.dropdown-item', {visible: true});

        // Get the value of the first item in the dropdown
        const [firstDropdownItem] = await Promise.all([page.evaluate(() => {
            const firstItem = document.querySelector('.departure-input-wrapper ul.typeahead.dropdown-menu li:first-child a.dropdown-item');
            return firstItem ? firstItem.textContent.trim() : null;
        })]);

        if (!firstDropdownItem) {
            console.log('Departure dropdown menu is empty. Continuing without clicking.');
        } else {
            console.log('Checking if departure dropdown item matches input:', firstDropdownItem);

            // Check if the input in the departure field matches the first item in the dropdown
            if (departure.toLowerCase() === firstDropdownItem.toLowerCase()) {
                console.log('Departure dropdown item matches input. Clicking...');
                await page.click('.departure-input-wrapper ul.typeahead.dropdown-menu li:first-child a.dropdown-item');
            } else {
                console.log('Departure dropdown item does not match input. Continuing without clicking.');
            }
        }


        // Arrival field
        console.log("Clicking input for arrival...");
        await page.type('.input-destination', destination);

        await delay(1000);

        console.log("Waiting for arrival dropdown menu...");
        await page.waitForSelector('.destination-input-wrapper ul.typeahead.dropdown-menu li:first-child a.dropdown-item', { visible: true , timeout: 40000});

        // Get the value of the first item in the dropdown
        const firstArrivalDropdownItem = await page.evaluate(() => {
            const firstItem = document.querySelector('.destination-input-wrapper ul.typeahead.dropdown-menu li:first-child a.dropdown-item');
            return firstItem ? firstItem.textContent.trim() : null;
        });

        if (!firstArrivalDropdownItem) {
            console.log('Arrival dropdown menu is empty. Continuing without clicking.');
        } else {
            console.log('Checking if arrival dropdown item matches input:', firstArrivalDropdownItem);

            // Check if the input in the arrival field matches the first item in the dropdown
            if (destination.toLowerCase() === firstArrivalDropdownItem.toLowerCase()) {
                console.log('Arrival dropdown item matches input. Clicking...');
                await page.click('.destination-input-wrapper ul.typeahead.dropdown-menu li:first-child a.dropdown-item');
            } else {
                console.log('Arrival dropdown item does not match input. Continuing without clicking.');
            }
        }


        console.log('Arrival done. Continuing...');


        // Date
        await page.evaluate(() => {
            document.querySelector('#trip-date').value = '';
        });

        //await page.type('#trip-date', '31.05.2024');
        await page.type('#trip-date', date);
        await page.click('#trip-date');

        // Submit
        console.log("Submitting the form...");
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
            page.click('.submit')
        ]);

        console.log("Sleep timer for 5 seconds.")
        await delay(5000); // Wait for 5 seconds

        console.log("Getting url...")
        const currentUrl = page.url();
        console.log("Current page URL:", currentUrl);

        // Check for the error message indicating no direct connections
        const noDirectConnection = await page.evaluate(() => {
            const alertElement = document.querySelector('.alert.alert-danger');
            return alertElement ? alertElement.textContent.trim() : null;
        });

        if (noDirectConnection) {
            console.log("No direct connections found.");
            await browser.close();
            return [];
        }

        // Return the URL
        return await fetchConnection(currentUrl);
    } catch (error) {
        console.error(error);
        return [];
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

            // Write data to a file (example)
            const jsonData = JSON.stringify(connectionData, null, 2); // Convert data to JSON string with indentation
            fs.writeFile('../data/timetable/arriva.json', jsonData, 'utf8', (err) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log('Data has been saved to arriva.json');
                }
            });
            return connectionData;
        }
    } catch (err) {
        console.error(err);
    }
};

module.exports = {scrapeArriva};

//scrapeArriva('Ljubljana AP', 'Maribor AP', '08.08.2024').catch(err => console.error('Error executing scrapeArriva:', err));
