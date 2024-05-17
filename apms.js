const axios = require('axios');
const fs = require('fs');
const puppeteer = require('puppeteer');
const { getUri } = require("axios");

async function main() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('https://apms.si/');
    await page.waitForSelector('#odhod');
    await page.waitForSelector('#prihod');
    await page.waitForSelector('#datum');
    await delay(1000);

    await page.focus('#odhod');
    await page.keyboard.type('Murska Sobota AP');
    await delay(1000);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await page.focus('#prihod');
    await page.keyboard.type('Ljubljana AP');
    await delay(1000);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await page.click('#datum', {clickCount: 3});
    await page.keyboard.press('Backspace');
    await page.type('#datum', '10.05.2024');
    await delay(1000);

    await page.click("#iskanje", {clickCount: 3});
    await delay(2000);

    // handle if there are no results
    try {
        await page.waitForSelector('.latest-item.bts.grid-template-content', { timeout: 30000 });
        const scheduleData = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('.latest-item.bts.grid-template-content'));
            if (!rows.length) throw new Error("No schedule data elements found.");

            return rows.map((row, index) => {
                const details = Array.from(row.querySelectorAll('.single-latest-fl p'));
                return {
                    id: index + 1,
                    departureTime: details[0] ? details[0].textContent.trim() : "Unknown",
                    arrivalTime: details[1] ? details[1].textContent.trim() : "Unknown",
                    duration: details[2] ? details[2].textContent.trim() : "Unknown",
                    kilometers: details[3] ? details[3].textContent.trim() : "Unknown",
                    price: details[4] ? details[4].textContent.trim() : "Unknown"
                };
            });
        });

        if (scheduleData.length === 0) {
            console.log("No bus schedules found.");
        } else {
            console.log(scheduleData);
            fs.writeFile('C://Users/mataj/WebstormProjects/webscraper/data/apms.json', JSON.stringify(scheduleData, null, 2), 'utf8', (err) => {
                if (err) {
                    console.error('Error writing file:', err);
                } else {
                    console.log('Bus schedule data has been saved to apms.json');
                }
            });
        }
    } catch (e) {
        console.error('Error during data extraction:', e);
    }

    // Close the browser if necessary
    // await browser.close();
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(error => console.error('Error in main execution:', error));
