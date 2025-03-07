const fs = require('fs').promises;
const path = require('path');
const {JSDOM} = require("jsdom");

async function scrapePrevoziDOM() {
    const filePath = path.join(__dirname, '../data/PrevoziStran.html');
    const html = await fs.readFile(filePath, 'utf-8');
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const cards = Array.from(document.querySelectorAll('.card'));
    const data = cards.map((card) => {
        const routeElement = card.querySelector('.card-header .d-flex.fw-bolden.h4.m-0');
        if (!routeElement) return null;

        const from = routeElement.querySelector('span:first-child')?.textContent.trim() || '';
        const to = routeElement.querySelector('span:last-child')?.textContent.trim() || '';
        const count = card.querySelector('.card-header .count')?.textContent.trim() || '';

        const trips = Array.from(card.querySelectorAll('.list-group-item.carshare-overview')).map((item) => {
            const time = item.querySelector('.link-body')?.textContent.trim() || '';
            const description = item.querySelector('.description.small')?.textContent.trim() || '';
            const price = item.querySelector('.options .item span.h5.fw-bold.m-0')?.textContent.trim() || '';

            return {time, description, price};
        });

        return {from, to, count, trips};
    });

    return data.filter(item => item !== null);
}

module.exports = {scrapePrevoziDOM};

//scrapePrevoziDOM().then((data) => console.log(JSON.stringify(data, null, 2))).catch((error) => console.error("Error executing prevoziDOM:", error));
