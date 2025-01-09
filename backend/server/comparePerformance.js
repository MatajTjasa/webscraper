const {scrapeSlovenskeZelezniceByUrl} = require("../scrapers/slovenske_zeleznice_byUrl");
const {scrapeSlovenskeZelezniceDOM} = require("../scrapers/slovenske_zeleznice_DOM");


async function comparePerformance(departureStationCode, destinationStationCode, date) {
    console.log("Puppeteer start")
    const puppeteerStart = Date.now();
    const puppeteerData = await scrapeSlovenskeZelezniceByUrl(departureStationCode, destinationStationCode, date);
    const puppeteerDuration = (Date.now() - puppeteerStart) / 1000;
    console.log("Puppeteer end : " + puppeteerDuration)

    const jsdomStart = Date.now();
    const jsdomResult = await scrapeSlovenskeZelezniceDOM(departureStationCode, destinationStationCode, date);
    const jsdomDuration = (Date.now() - jsdomStart) / 1000;

    console.log("Finish")
    console.log('Puppeteer:', {
        duration: puppeteerDuration,
        data: puppeteerData,
    });

    console.log('JSDOM:', {
        duration: jsdomDuration,
        data: jsdomResult,
    });
}

module.exports = {comparePerformance};

//comparePerformance('42300', '43400', '2025-01-04').then(data => console.log(JSON.stringify(data, null, 2))).catch(err => console.error('Error:', err));
