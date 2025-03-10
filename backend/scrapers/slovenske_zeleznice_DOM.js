const fs = require('fs').promises;
const path = require('path');
const {JSDOM} = require("jsdom");

async function scrapeSlovenskeZelezniceDOM() {
    const filePath = path.join(__dirname, '../data/SlovenskeZelezniceStran.html');
    const html = await fs.readFile(filePath, 'utf-8');
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const cleanText = (text) => text.replace(/^Vlak:\s*/, '').replace(/\s+/g, ' ').trim();

    const connections = Array.from(document.querySelectorAll('.connection'));
    return connections.map((connection) => {
        const isActive = connection.classList.contains('connection-active');

        const timeAndStations = connection.querySelector('.d-flex.align-items-center.gap-1.fs-5.fw-medium');
        const departureTime = timeAndStations?.children[0]?.textContent.trim() || '';
        const departureStation = timeAndStations?.children[1]?.textContent.trim() || '';
        const arrivalStation = timeAndStations?.children[5]?.textContent.trim() || '';
        const arrivalTime = timeAndStations?.children[6]?.textContent.trim() || '';

        const detailsContainer = connection.querySelector('.accordion-header.d-flex.flex-column.flex-md-row.justify-content-between.rounded-2.p-2');
        const detailParagraphs = detailsContainer ? Array.from(detailsContainer.querySelectorAll('p')) : [];
        let transfers = detailParagraphs[0]?.querySelector('.value')?.textContent.trim();
        transfers = !transfers || transfers === '0' ? '' : transfers;
        const travelTime = detailParagraphs[1]?.querySelector('.value')?.textContent.trim() || '';

        const rawTrainType = connection.querySelector('.graphic-transit .fw-medium.fs-3.fs-4.fit-content')?.textContent.trim();
        const trainType = cleanText(rawTrainType || '');

        const warnings = Array.from(connection.querySelectorAll('.notice-wrapper')).map((warning) => warning.textContent.trim());

        return {
            isActive,
            departureTime,
            departureStation,
            arrivalTime,
            arrivalStation,
            travelTime,
            trainType,
            transfers,
            warnings,
        };
    });
}

module.exports = {scrapeSlovenskeZelezniceDOM};
