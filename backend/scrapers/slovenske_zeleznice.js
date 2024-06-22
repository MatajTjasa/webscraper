const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeSlovenskeZeleznice(departure, destination, date) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Navigate to the train schedule page
    await page.goto('https://potniski.sz.si/');
    await page.goto('https://potniski.sz.si/', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#entry-station-selectized', { visible: true });

    // Set the travel date
    await page.waitForSelector('#departure-date', { visible: true });
    await page.evaluate(() => {
        document.querySelector('#departure-date').value = '';
    });
    await page.type('#departure-date', date);
    await delay(1000);

    // Select departure station
    await page.evaluate(() => {
        document.querySelector('#entry-station-selectized').scrollIntoView();
    });
    await page.click('#entry-station-selectized');
    await page.waitForSelector('.selectize-dropdown-content', { visible: true });
    await page.evaluate((departure) => {
        const departures = Array.from(document.querySelectorAll('.selectize-dropdown-content .option'));
        const departureOption = departures.find(option => option.textContent.trim() === departure);
        if (departureOption) {
            departureOption.click();
        }
    }, departure);

    await delay(2000);

    // Select destination station
    await page.evaluate(() => {
        document.querySelector('#exit-station-selectized').scrollIntoView();
    });
    await page.click('#exit-station-selectized');
    await page.waitForSelector('.selectize-dropdown-content', {visible: true});
    await page.evaluate((destination) => {
        const arrivals = Array.from(document.querySelectorAll('.selectize-dropdown-content .option'));
        const arrivalOption = arrivals.find(option => option.textContent.trim() === destination);
        if (arrivalOption) {
            arrivalOption.click();
        }
    }, destination);

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

    // Click the submit button
    await page.evaluate(() => {
        document.querySelector('button[type="submit"]').scrollIntoView();
    });
    await page.click('button[type="submit"]');

    await page.waitForSelector('.connection', { visible: true });

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
    await browser.close();
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Example usage
scrapeSlovenskeZeleznice('Ljubljana', 'Maribor', '30.06.2024').catch(err => console.error('Error executing scrapeDestinations:', err));

module.exports = {scrapeSlovenskeZeleznice};
