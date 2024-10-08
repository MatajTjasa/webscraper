const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
const {safeGoto} = require('../server/helpers');
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

async function scrapePrevoziByUrl(departure, destination, date) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: puppeteer.executablePath()
    });
    const page = await browser.newPage();

    const url = `https://prevoz.org/prevoz/list/?fc=SI&f=${encodeURIComponent(departure)}&tc=SI&t=${encodeURIComponent(destination)}&d=${date}`;
    console.log('Prevozi URL: ' + url);

    try {
        await safeGoto(page, url);

        const error404 = await page.$eval('h1.fw-bolden.mb-4', element => element.innerText.includes('Napaka 404'));
        if (error404) {
            console.error('Error 404: Page not found');
            await browser.close();
            return [];
        }
        const cardExists = await page.$('.card');
        if (!cardExists) {
            console.log('No cards found');
            await browser.close();
            return [];
        }

        const rideShares = await page.evaluate(() => {
            const data = [];
            const cards = document.querySelectorAll('.card');

            cards.forEach(card => {
                const cardBody = card.querySelector('.card-body');
                if (cardBody && cardBody.innerText.includes('Noben prevoz ne ustreza iskalnim pogojem')) {
                    data.push(null);
                    return [];
                }

                const routeElement = card.querySelector('.d-flex.fw-bolden.h4.m-0');
                if (!routeElement) {
                    return [];
                }
                const fromElement = routeElement.querySelector('span:first-child');
                const toElement = routeElement.querySelector('span:last-child');
                if (!fromElement || !toElement) {
                    return [];
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
        await browser.close();

        console.log(rideShares);
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
