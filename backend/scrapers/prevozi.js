const puppeteer = require('puppeteer');

async function scrapePrevozi(departure, destination, date) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: process.env.PUPPETEER_CACHE_DIR
    });

    const page = await browser.newPage();

    const url = `https://prevoz.org/prevoz/list/?fc=SI&f=${encodeURIComponent(departure)}&tc=SI&t=${encodeURIComponent(destination)}&d=${encodeURIComponent(date)}`;
    console.log('Navigating to URL:', url);

    await page.goto(url, {waitUntil: 'networkidle2'});

    const prevozi = await page.evaluate(() => {
        const data = [];
        const cards = document.querySelectorAll('.card');

        cards.forEach(card => {
            const routeElement = card.querySelector('.d-flex.fw-bolden.h4.m-0');
            const from = routeElement.querySelector('span:first-child').innerText.trim();
            const to = routeElement.querySelector('span:last-child').innerText.trim();
            const trips = [];

            const tripItems = card.querySelectorAll('.list-group-item.carshare-overview');
            tripItems.forEach(item => {
                const time = item.querySelector('.link-body').innerText.trim();
                const description = item.querySelector('.description.small').innerText.trim();
                const price = item.querySelector('.options .item span.h5.fw-bold.m-0').innerText.trim();

                trips.push({time, description, price});
            });

            data.push({routeElement, from, to, trips});
        });

        return data;
    });

    // Log extracted dynamic data
    console.log(prevozi);

    await browser.close();
}

//scrapePrevozi('Ljubljana', 'Maribor', '2025-01-14').catch(err => console.error('Error executing prevozi:', err));

module.exports = {scrapePrevozi};