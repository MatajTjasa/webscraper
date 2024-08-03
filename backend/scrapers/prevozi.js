const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapePrevozi(departure, destination, date) {
    const browser = await puppeteer.launch({headless: false}); // true = hide browser
    const page = await browser.newPage();

    await page.goto('https://prevozi.org/');

    await page.select('#id_fc', 'SI');
    await page.select('#id_tc', 'SI');

    await page.click('#id_f');
    await delay(1000);
    await page.keyboard.type(departure);
    await delay(1000);
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');

    await page.click('#id_t');
    await delay(1000);
    await page.keyboard.type(destination);
    await delay(1000);
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');

    // Open the date dropdown
    await page.click('#id_d');
    await delay(1000); // Ensure the dropdown is open

    // Reformat the date from dd.mm.yyyy to yyyy-mm-dd
    const [day, month, year] = date.split('.');
    const formattedDate = `${year}-${month}-${day}`;

    console.log('entering date part');
    // Select the date from the dropdown
    const targetOptionHandle = await page.evaluateHandle((formattedDate) => {
        const options = Array.from(document.querySelectorAll('.select2-results__option'));
        const targetOption = options.find(option => option.getAttribute('id').includes(formattedDate));
        if (targetOption) {
            return targetOption;
        } else {
            console.error('Target option not found for date:', formattedDate);
            return null;
        }
    }, formattedDate);

    if (targetOptionHandle) {
        await targetOptionHandle.asElement().click();
        console.log('Date selected successfully');
    } else {
        console.error('Failed to find and click the target option');
    }

    console.log('exiting date part');

    await delay(2000);

    // Ensure the date is selected by checking the selected attribute
    const selectedDate = await page.evaluate(() => {
        const selectedOption = document.querySelector('.select2-results__option[aria-selected="true"]');
        return selectedOption ? selectedOption.innerText : null;
    });

    console.log('Selected date:', selectedDate);

    // Extract options from the date select element
    /* const dateOptions = await page.evaluate(() => {
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
     fs.writeFile('../data/prevozi_dates.json', JSON.stringify(dateOptions, null, 2), err => {
         if (err) console.log('Error writing file:', err);
         else console.log('Successfully written to prevozi_dates.json');
     });*/

    // fix
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
    //console.log(destinationOptions);

    // Save destination options to JSON file
    fs.writeFileSync('../data/destinations/prevozi_destinations.json', JSON.stringify([], null, 2)); // Empty the list first
    fs.writeFile('../data/destinations/prevozi_destinations.json', JSON.stringify(destinationOptions, null, 2), err => {
        if (err) console.log('Error writing file:', err);
        else console.log('Successfully written to prevozi_destinations.json');
    });

    await page.click('input[type="submit"]');
    await delay(5000);

    // Check for alert message indicating no direct connections
    const noDirectConnectionMessage = await page.evaluate(() => {
        const alertElement = document.querySelector('.alert.alert-danger');
        return alertElement ? alertElement.innerText.trim() : null;
    });

    if (noDirectConnectionMessage) {
        console.log("No direct connections found.");
        fs.writeFileSync('../data/timetable/prevozi.json', JSON.stringify([], null, 2));
        await browser.close();
        return null;
    }

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
    fs.writeFile('../data/timetable/prevozi.json', JSON.stringify(dynamicData, null, 2), err => {
        if (err) console.log('Error writing file:', err);
        else console.log('Successfully written to prevozi.json');
    });

    await browser.close();
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//scrapePrevozi('Ljubljana', 'Maribor', '30.06.2024').catch(err => console.error('Error executing scrapeOptions:', err));

module.exports = {scrapePrevozi};
