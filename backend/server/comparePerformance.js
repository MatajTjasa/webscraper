const {scrapeSlovenskeZelezniceByUrl} = require("../scrapers/slovenske_zeleznice_byUrl");
const {scrapeSlovenskeZelezniceDOM} = require("../scrapers/slovenske_zeleznice_DOM");
const {fetchPrevozi} = require("../scrapers/prevozi_byUrl");
const {scrapePrevozi} = require("../scrapers/prevozi");
const {scrapePrevoziDOM} = require("../scrapers/prevozi_DOM");
const {delay} = require("./helpers");

async function measureAverage(scrapeFunction, iterations, ...args) {
    let totalDuration = 0;
    console.log()
    for (let i = 0; i < iterations; i++) {
        await delay(60000)
        const start = Date.now();
        await scrapeFunction(...args);
        const duration = (Date.now() - start) / 1000;
        console.log(`${i + 1}. ${scrapeFunction.name} took: ${duration.toFixed(3)} seconds`);
        totalDuration += duration;
    }
    return totalDuration / iterations;
}

async function comparePerformance(departure, destination, date, transportType) {
    const iterations = 10;

    if (transportType === 'vlak') {
        console.log("Comparing performance for Slovenske železnice:");

        const puppeteerAverage = await measureAverage(scrapeSlovenskeZelezniceByUrl, iterations, departure, destination, date);
        const jsdomAverage = await measureAverage(scrapeSlovenskeZelezniceDOM, iterations);

        console.log("_______________________________________________________________________");
        console.log(
            `Finish comparing for Slovenske železnice (average over ${iterations} runs):\n` +
            `  puppeteer: ${puppeteerAverage.toFixed(3)}s \n` +
            `  jsdom: ${jsdomAverage.toFixed(3)}s `
        );

    } else if (transportType === 'prevoz') {
        console.log("Comparing performance for Prevozi:");

        const puppeteerAverage = await measureAverage(scrapePrevozi, iterations, departure, destination, date);
        const cheerioAverage = await measureAverage(fetchPrevozi, iterations, departure, destination, date);
        const jsdomAverage = await measureAverage(scrapePrevoziDOM, iterations, departure, destination, date);

        console.log("_______________________________________________________________________");
        console.log(
            `Finish comparing for Prevozi (average over ${iterations} runs):\n` +
            `  puppeteer: ${puppeteerAverage.toFixed(3)}s \n` +
            `  cheerio: ${cheerioAverage.toFixed(3)}s\n` +
            `  jsdom: ${jsdomAverage.toFixed(3)}s `
        );
    }
}

module.exports = {comparePerformance};

// Example usage:
// comparePerformance('42300', '43400', '2025-01-04', 'vlak').catch(console.error);
// comparePerformance('Ljubljana', 'Maribor', '2025-01-14', 'prevoz').catch(console.error);
