const puppeteer = require('puppeteer');
const fs = require('fs');

// TODO

async function scrapeSlovenskeZeleznice(departure, destination, date) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Navigate to the train schedule page
    await page.goto('https://potniski.sz.si/', { waitUntil: 'networkidle2' });

    // Accept cookies if the banner is present
    const acceptCookiesSelector = '#cn-accept-cookie';
    if (await page.$(acceptCookiesSelector) !== null) {
        await page.click(acceptCookiesSelector);
        await delay(1000); // Wait for the cookies banner to disappear
    }

    // Set the travel date
    await page.waitForSelector('#departure-date', { visible: true });
    await page.evaluate(() => {
        document.querySelector('#departure-date').value = '';
    });
    await page.type('#departure-date', date);
    await delay(1000);

    // Select departure station
    await selectStation(page, '#entry-station-selectized', departure);

    await delay(2000);

    // Select destination station
    await selectStation(page, '#exit-station-selectized', destination);

    // Get the list of destinations after selection
    const destinations = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.selectize-dropdown-content .option')).map(option => ({
            value: option.getAttribute('data-value'),
            text: option.textContent.trim()
        }));
    });

    console.log(destinations);

    // Save destinations to JSON file
    fs.writeFile('../data/destinations/slovenske_zeleznice_destinations.json', JSON.stringify(destinations, null, 2), err => {
        if (err) console.log('Error writing file:', err);
        else console.log('Successfully written to slovenske_zeleznice_destinations.json');
    });

    // Ensure the submit button is visible and clickable
    const buttonVisible = await page.evaluate(() => {
        const button = document.querySelector('button[type="submit"]');
        if (button) {
            button.scrollIntoView({behavior: 'smooth', block: 'center'});
            console.log('Submit button is scrolled into view.');
            return true;
        } else {
            console.log('Submit button not found.');
            return false;
        }
    });

    if (buttonVisible) {
        await delay(1000); // Additional delay to ensure the element is scrolled into view
        await page.waitForSelector('button[type="submit"]', {visible: true});

        try {
            await page.click('button[type="submit"]', {delay: 100, clickCount: 3});
            console.log('Submit button has been clicked.');
        } catch (error) {
            console.log('Failed to click the submit button with Puppeteer:', error);
            try {
                // Try clicking the button using JavaScript if Puppeteer's click method fails
                await page.evaluate(() => {
                    document.querySelector('button[type="submit"]').click();
                });
                console.log('Submit button has been clicked using JavaScript.');
            } catch (jsError) {
                console.log('Failed to click the submit button with JavaScript:', jsError);
            }
        }

        await page.waitForSelector('.connection', {visible: true});

        // Scrape the train schedule data
        const trainSchedules = await page.evaluate(() => {
            const connections = Array.from(document.querySelectorAll('.connection'));
            return connections.map(connection => {
                const departureStation = connection.querySelector('.item.has-issues div:first-child strong').innerText;
                const departureTime = connection.querySelector('.item.has-issues div:first-child strong:nth-child(2)').innerText;
                const arrivalStation = connection.querySelector('.item:last-child strong').innerText;
                const arrivalTime = connection.querySelector('.item:last-child strong:nth-child(2)').innerText;
                const travelTime = connection.querySelector('.item.between div:first-child strong').innerText;
                const trainType = connection.querySelector('.train-list-item .train-trigger').innerText;
                return {
                    departureStation,
                    departureTime,
                    arrivalStation,
                    arrivalTime,
                    travelTime,
                    trainType
                };
            });
        });

        console.log(trainSchedules);

        // Save the scraped data to a JSON file
        fs.writeFile('../data/timetable/slovenske_zeleznice.json', JSON.stringify(trainSchedules, null, 2), err => {
            if (err) console.log('Error writing file:', err);
            else console.log('Successfully written to slovenske_zeleznice.json');
        });
    } else {
        console.log('Submit button was not visible or not found.');
    }

    await browser.close();
}

async function selectStation(page, selector, station) {
    await page.click(selector);
    await page.type(selector, station);
    await delay(2000);  // Wait for dropdown options to appear
    await page.keyboard.press('Enter');
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Example usage
//scrapeSlovenskeZeleznice('Ljubljana', 'Maribor', '30.06.2024').catch(err => console.error('Error executing scrapeDestinations:', err));

module.exports = {scrapeSlovenskeZeleznice};
