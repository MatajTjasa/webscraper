const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeOptions() {
    const browser = await puppeteer.launch({ headless: false }); //true = skrij browser
    const page = await browser.newPage();

    // Replace this URL with the actual page URL you wish to scrape
    await page.goto('https://prevoz.org/');

    await page.select('#id_fc', 'SI');
    /*await delay(1000);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
*/
    await page.select('#id_tc', 'SI');
    // await delay(1000);
    // await page.keyboard.press('ArrowDown');
    // await page.keyboard.press('Enter');

    await page.click('#id_f');
    await delay(1000);
    await page.keyboard.type('Ljubljana');
    await delay(1000);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await page.click('#id_t');
    await delay(1000);
    await page.keyboard.type('Maribor');
    await delay(1000);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');


    // Open the date dropdown
    await page.click('#id_d');
    await delay(1000); // Ensure the dropdown is open

    // Count the number of date options
    const dateOptionCount = await page.evaluate(() => {
        const optionsNodes = Array.from(document.querySelectorAll('.select2-results__options li'));
        return optionsNodes.length;
    });

    await page.keyboard.press('ArrowDown')
    await delay(200)
    await page.keyboard.press('ArrowDown')
    await delay(200)
    await page.keyboard.press('Enter')

    await delay(2000);

    // Extract options from the date select element
    const dateOptions = await page.evaluate(() => {
        const optionsNodes = Array.from(document.querySelectorAll('.select2-results__options li'));
        return optionsNodes.map(option => ({
            id: option.getAttribute('data-select2-id'),
            text: option.innerText,
            selected: option.getAttribute('aria-selected') === 'true'
        }));
    });

    // Log extracted date options
    console.log(dateOptions);

    // Save date options to JSON file
    fs.writeFile('C://Users/mataj/WebstormProjects/webscraper/data/prevozi_dates.json', JSON.stringify(dateOptions, null, 2), err => {
        if (err) console.log('Error writing file:', err);
        else console.log('Successfully written to prevozi_dates.json');
    });


    // Extract destination options
    const destinationOptions = await page.evaluate(() => {
        const fcOptions = Array.from(document.querySelectorAll('#id_fc option'));
        const tcOptions = Array.from(document.querySelectorAll('#id_tc option'));
        const combinedOptions = [...fcOptions, ...tcOptions];
        return combinedOptions.map(option => ({
            value: option.getAttribute('value'),
            text: option.innerText,
            selected: option.hasAttribute('selected')
        }));
    });

    // Log extracted destination options
    console.log(destinationOptions);

    // Save destination options to JSON file
    fs.writeFile('C://Users/mataj/WebstormProjects/webscraper/data/prevozi_destinations.json', JSON.stringify(destinationOptions, null, 2), err => {
        if (err) console.log('Error writing file:', err);
        else console.log('Successfully written to prevozi_destinations.json');
    });

    await page.click('input[type="submit"]');

    //await page.waitForNavigation();

    await delay(5000)

    // Extract dynamic data from the new page
    const dynamicData = await page.evaluate(() => {
        const data = [];
        const cards = document.querySelectorAll('.card');

        cards.forEach(card => {
            const routeElement = card.querySelector('.d-flex.fw-bolden.h4.m-0');
            const from = routeElement.querySelector('span:first-child').innerText.trim();
            const to = routeElement.querySelector('span:last-child').innerText.trim();
            const count = card.querySelector('.card-header .count').innerText.trim();
            const trips = [];

            const tripItems = card.querySelectorAll('.list-group-item.carshare-overview');
            tripItems.forEach(item => {
                const time = item.querySelector('.link-body').innerText.trim();
                const description = item.querySelector('.description.small').innerText.trim();
                const price = item.querySelector('.options .item span.h5.fw-bold.m-0').innerText.trim();

                trips.push({ time, description, price });
            });

            data.push({ routeElement, from, to, count, trips });
        });

        return data;
    });

    // Log extracted dynamic data
    console.log(dynamicData);

    // Save dynamic data to JSON file
    fs.writeFile('C://Users/mataj/WebstormProjects/webscraper/data/prevozi.json', JSON.stringify(dynamicData, null, 2), err => {
        if (err) console.log('Error writing file:', err);
        else console.log('Successfully written to prevozi.json');
    });
    //await browser.close();
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
scrapeOptions().catch(err => console.error('Error executing scrapeOptions:', err));
