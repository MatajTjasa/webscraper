const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const path = require("path");
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
const {safeGoto, delay} = require('../server/helpers');
require('dotenv').config();

// Hiding puppeteer usage
puppeteer.use(StealthPlugin());

/*puppeteer.use(
    RecaptchaPlugin({
        provider: {
            id: '2captcha',
            token: process.env.CAPTCHA_APIKEY
        },
        visualFeedback: true
    })
);*/

async function scrapeAPMS(departure, destination, date) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: puppeteer.executablePath()
    });

    const page = await browser.newPage();
    await safeGoto(page, 'https://apms.si/');
    await page.waitForSelector('#odhod');
    await page.waitForSelector('#prihod');
    await page.waitForSelector('#datum');
    await delay(1000);

    await page.focus('#odhod');
    await page.keyboard.type(departure);
    await delay(1000);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await page.focus('#prihod');
    await page.keyboard.type(destination);
    await delay(1000);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await page.click('#datum', {clickCount: 3});
    await page.keyboard.press('Backspace');
    await page.type('#datum', date);
    await delay(1000);

    await page.click("#iskanje", {clickCount: 3});
    await delay(2000);

    // Check if results are found
    const noResults = await page.evaluate(() => {
        const resultContainer = document.querySelector('#rezultati');
        return !resultContainer || resultContainer.children.length === 0;
    });

    if (noResults) {
        console.log("No schedules found.");
        await browser.close();
        return [];
    }

    try {
        await page.waitForSelector('.latest-item.bts.grid-template-content', {timeout: 30000});

        const scheduleData = await page.evaluate((dep, dest) => {
            const rows = Array.from(document.querySelectorAll('.latest-item.bts.grid-template-content'));

            return rows.map((row, index) => {
                const details = Array.from(row.querySelectorAll('.single-latest-fl p'));
                const departureTime = details[0] ? details[0].textContent.trim() : "undefined";
                const arrivalTime = details[1] ? details[1].textContent.trim() : "undefined";

                // Filtering out rows with "undefined" data
                if (departureTime === "undefined" || arrivalTime === "undefined") {
                    console.log("No schedules found.");
                    return [];
                }

                return {
                    id: index + 1,
                    departure: dep,
                    departureTime,
                    arrival: dest,
                    arrivalTime,
                    duration: details[2] ? details[2].textContent.trim() : "",
                    kilometers: details[3] ? details[3].textContent.trim() : "",
                    price: details[4] ? details[4].textContent.trim() : ""
                };
            }).filter(item => item.departureTime && item.arrivalTime); // Filter out invalid entries
        }, departure, destination);

        if (scheduleData.length === 0) {
            console.log("No valid bus schedules found.");
            return [];
        } else {
            console.log(scheduleData);

            // Ensure the directory exists
            const directory = path.resolve(__dirname, "../data/timetable");
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory, {recursive: true});
            }

            fs.writeFileSync(path.resolve(directory, "apms.json"), JSON.stringify(scheduleData, null, 2), "utf8");
            console.log("Bus schedule data has been saved to apms.json");
            return scheduleData;
        }
    } catch (e) {
        console.error('Error during data extraction:', e);
        return [];
    } finally {
        await browser.close();
    }
}

// Example call for testing
// scrapeAPMS('Maribor AP', 'Ljubljana AP', '13.08.2024').catch(err => console.error('Error executing scrapeAPMS:', err));

module.exports = {scrapeAPMS};