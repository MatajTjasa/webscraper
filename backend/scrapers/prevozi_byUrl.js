const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    fs.mkdirSync(dirname, {recursive: true});
}

async function scrapePrevoziByUrl(departure, destination, date) {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();

    const url = `https://prevoz.org/prevoz/list/?fc=SI&f=${encodeURIComponent(departure)}&tc=SI&t=${encodeURIComponent(destination)}&d=${date}`;

    try {
        await page.goto(url, {waitUntil: 'networkidle0'});

        // Check for 404 error
        const error404 = await page.$eval('h1.fw-bolden.mb-4', element => element.innerText.includes('Napaka 404'));
        if (error404) {
            console.error('Error 404: Page not found');
            await browser.close();
            return [];
        }

        // Check if the card element exists
        const cardExists = await page.$('.card');
        if (!cardExists) {
            console.log('No cards found');
            await browser.close();
            return [];
        }

        // Scrape the ride share data
        const rideShares = await page.evaluate(() => {
            const data = [];
            const cards = document.querySelectorAll('.card');

            cards.forEach(card => {
                const cardBody = card.querySelector('.card-body');
                if (cardBody && cardBody.innerText.includes('Noben prevoz ne ustreza iskalnim pogojem')) {
                    // No rides available
                    data.push(null);
                    return;
                }

                const routeElement = card.querySelector('.d-flex.fw-bolden.h4.m-0');
                if (!routeElement) {
                    return; // Skip if route element is not found
                }
                const fromElement = routeElement.querySelector('span:first-child');
                const toElement = routeElement.querySelector('span:last-child');
                if (!fromElement || !toElement) {
                    return; // Skip if from or to elements are not found
                }
                const from = fromElement.innerText.trim();
                const to = toElement.innerText.trim();
                const countElement = card.querySelector('.card-header .count');
                const count = countElement ? countElement.innerText.trim() : '0';
                const trips = [];

                const tripItems = card.querySelectorAll('.list-group-item.carshare-overview');
                tripItems.forEach(item => {
                    const timeElement = item.querySelector('.link-body');
                    const descriptionElement = item.querySelector('.description.small');
                    const priceElement = item.querySelector('.options .item span.h5.fw-bold.m-0');

                    const time = timeElement ? timeElement.innerText.trim() : '';
                    const description = descriptionElement ? descriptionElement.innerText.trim() : '';
                    const price = priceElement ? priceElement.innerText.trim() : '';

                    trips.push({time, description, price});
                });

                data.push({from, to, count, trips});
            });

            return data.filter(item => item !== null);
        });

        // Log extracted data
        console.log(rideShares);

        const filePath = path.join(__dirname, '../data/timetable/prevozi_byUrl.json');
        // Ensure the directory exists
        ensureDirectoryExistence(filePath);

        // Save data to JSON file
        fs.writeFile(filePath, JSON.stringify(rideShares, null, 2), err => {
            if (err) {
                console.error('Error writing file:', err);
            } else {
                console.log('Successfully written to prevozi_byUrl.json');
            }
        });

        await browser.close();
        return rideShares;
    } catch (error) {
        console.error('Error executing scrapePrevozi:', error);
        await browser.close();
        return [];
    }
}

// Example usage
//scrapePrevozi_byUrl('Ljubljana', 'Maribor', '2024-08-04').catch(err => console.error('Error executing scrapePrevozi:', err));

module.exports = {scrapePrevoziByUrl};
