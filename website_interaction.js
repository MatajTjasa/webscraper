const puppeteer = require('puppeteer');

const website_interaction = () => {
    // Your code here
};

module.exports = website_interaction;

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Navigate to the website
    await page.goto('https://arriva.si/vozni-redi/');

    // Interact with fields and buttons
    await page.type('input-departure .form-control .ta-field .typeahead', 'Ljubljana AP');
    await page.type('input-destination form-control ta-field', 'Maribor AP');
    await page.type('form-control flatpickr-input active', '29.3.2024');

    await page.click('submit btn btn-primary ml-auto');

    // Wait for the page to load with search results
    await page.waitForSelector('.searchResult');

    // Extract and analyze data from the website
    const data = await page.evaluate(() => {
        const results = [];
        document.querySelectorAll('.searchResult').forEach(result => {
            results.push(result.textContent);
        });
        return results;
    });

    console.log(data);

    await browser.close();
})();

