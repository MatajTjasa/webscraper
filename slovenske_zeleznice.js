const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeDestinations() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Navigate to the train schedule page
    await page.goto('https://potniski.sz.si/');
    await page.goto('https://potniski.sz.si/', { waitUntil: 'networkidle2' });    // Click to make the entry dropdown options visible
    await page.waitForSelector('#entry-station-selectized', { visible: true });
    await page.click('#entry-station-selectized');
    //await page.waitForSelector('.selectize-dropdown-content', { visible: true });

    await page.waitForSelector('.selectize-dropdown-content', { visible: true });

    // Extract entry station options
    const destinations = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.selectize-dropdown-content .option')).map(option => ({
            value: option.getAttribute('data-value'),
            text: option.textContent.trim()
        }));
    });

    // Log extracted destinations
    console.log(destinations);

    // Save destinations to JSON file
    fs.writeFile('slovenske_zeleznice_destinations.json', JSON.stringify(destinations, null, 2), err => {
        if (err) console.log('Error writing file:', err);
        else console.log('Successfully written to slovenske_zeleznice_destinations.json');
    });

    await browser.close();
}

scrapeDestinations().catch(err => console.error('Error executing scrapeDestinations:', err));
