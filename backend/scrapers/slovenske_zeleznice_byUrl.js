const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeSlovenskeZelezniceByUrl(departureStationCode, destinationStationCode, date) {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();

    // Construct the correct URL
    const url = `https://potniski.sz.si/vozni-redi-results/?action=timetables_search&current-language=sl&departure-date=${date}&entry-station=${departureStationCode}&exit-station=${destinationStationCode}`;

    // Navigate to the constructed URL
    await page.goto(url, {waitUntil: 'networkidle2'});

    // Wait for the timetable results to load
    await page.waitForSelector('.connection', {visible: true});

    // Scrape the train schedule data
    const trainSchedules = await page.evaluate(() => {
        const getTextContent = (element, selector) => {
            const foundElement = element.querySelector(selector);
            return foundElement ? foundElement.innerText.trim() : '';
        };

        const connections = Array.from(document.querySelectorAll('.connection'));
        return connections.map(connection => {
            const departureInfo = getTextContent(connection, '.item.has-issues .text-wrapper .fw-medium').split(' ob ');
            const arrivalInfo = getTextContent(connection, '.item.train-exit-station .fw-medium').split(' ob ');
            const departureStation = departureInfo[0].trim();
            const departureTime = departureInfo[1]?.trim() || '';
            const arrivalStation = arrivalInfo[0].trim();
            const arrivalTime = arrivalInfo[1]?.trim() || '';
            const travelTime = getTextContent(connection, '.d-flex.me-md-3.mt-2.mt-md-0.flex-column.flex-md-row .value.has-white-bg.fs-5.fit-content');
            const trainType = getTextContent(connection, '.train-list-item .train-trigger').trim();
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
    fs.writeFile('../data/timetable/slovenske_zeleznice_byUrl.json', JSON.stringify(trainSchedules, null, 2), err => {
        if (err) console.log('Error writing file:', err);
        else console.log('Successfully written to slovenske_zeleznice_byUrl.json');
    });

    return trainSchedules;

    await browser.close();
}

// Example usage with station codes
//scrapeSlovenskeZelezniceByUrl('42300', '43400', '25.07.2024').catch(err => console.error('Error executing scrapeSlovenskeZelezniceByUrl:', err));

module.exports = {scrapeSlovenskeZelezniceByUrl};
