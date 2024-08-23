const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const {safeGoto} = require('../server/helpers');

puppeteer.use(StealthPlugin());

async function scrapeAPMSbyUrl(departure, destination, date) {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--incognito'],
        executablePath: puppeteer.executablePath()
    });

    const context = browser.defaultBrowserContext();
    const page = (await context.pages())[0]

    const url = `https://apms.si/response.ajax.php?com=voznired2020&task=get&datum=${encodeURIComponent(date)}&postaja_od=${encodeURIComponent(departure)}&postaja_do=${encodeURIComponent(destination)}`;
    console.log("Navigating to URL: ", url);

    await safeGoto(page, url);
    await safeGoto(page, url);

    try {
        const jsonContent = await page.evaluate(() => {
            const preElement = document.querySelector('pre');
            if (preElement && preElement.innerText !== 'null') {
                return JSON.parse(preElement.innerText);
            }
            return null;
        });

        if (!jsonContent || jsonContent.length === 0) {
            console.log("No valid bus schedules found or incorrect destination specified.");
            return [];
        }

        const formattedData = jsonContent.map((item, index) => ({
            id: index + 1,
            departure: departure,
            departureTime: item.odhod,
            arrival: destination,
            arrivalTime: item.prihod,
            duration: item.voznja,
            kilometers: item.km,
            price: item.cena.trim()
        }));

        console.log(formattedData);
        return formattedData;

    } catch (e) {
        console.error('Error executing scrapeAPMS:', e);
        return [];
    } finally {
        await browser.close();
    }
}

// Example call for testing
// scrapeAPMSbyUrl('Maribor AP', 'Murska Sobota AP', '23.08.2024').catch(err => console.error('Error executing scrapeAPMSbyUrl:', err));

module.exports = {scrapeAPMSbyUrl};