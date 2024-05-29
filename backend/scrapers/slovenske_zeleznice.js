const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeDestinations() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Navigate to the train schedule page
    await page.goto('https://potniski.sz.si/');
    await page.goto('https://potniski.sz.si/', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#entry-station-selectized', { visible: true });

    // date
    await page.waitForSelector('#departure-date', { visible: true });
    await page.evaluate(() => {
        document.querySelector('#departure-date').value = '';
    });
    await page.type('#departure-date', '30.5.2024')
    await delay(1000);


    // Click on the input field to display the dropdown
    await page.click('#entry-station-selectized');
    await page.waitForSelector('.selectize-dropdown-content', { visible: true });

    // Select the option with the text "Maribor"
    await page.evaluate(() => {
        const departures = Array.from(document.querySelectorAll('.selectize-dropdown-content .option'));
        const departure = departures.find(option => option.textContent.trim() === 'Maribor');
        if (departure) {
            departure.click();
        }
    });

    await delay(2000);

    await page.waitForSelector('#exit-station-selectized', { visible: true });

    // Click on the input field to display the dropdown
    await page.click('#exit-station-selectized');

    await page.evaluate(() => {
        const arrivals = Array.from(document.querySelectorAll('.v-izstop .selectize-dropdown-content .option'));
        const arrival = arrivals.find(option => option.textContent.trim() === 'Ljubljana');
        if (arrival) {
            arrival.click();
        }
    });

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

    await page.click('button.btn.btn-primary[type="submit"]');

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
scrapeDestinations().catch(err => console.error('Error executing scrapeDestinations:', err));