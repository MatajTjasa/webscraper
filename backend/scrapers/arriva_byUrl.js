const axios = require('axios');
const {formatLocation} = require('../server/helpers');
const {getCodeArriva} = require('../server/database.js');
const cheerio = require('cheerio');

async function scrapeArrivaByUrl(departure, destination, date) {
    try {
        const formattedDeparture = formatLocation(departure);
        const formattedDestination = formatLocation(destination);

        const departureId = await getCodeArriva(departure);
        const destinationId = await getCodeArriva(destination);

        if (!departureId || !destinationId) {
            console.log("One or both station codes could not be found in the database.");
            return [];
        }

        console.log(`Extracted IDs - Departure ID: ${departureId}, Destination ID: ${destinationId}`);

        // API URL
        const url = `https://arriva.si/vozni-redi/?departure-123=${formattedDeparture}&departure_id=${departureId}&departure=${formattedDeparture}&destination=${formattedDestination}&destination_id=${destinationId}&trip_date=${encodeURIComponent(date)}`;
        console.log("Arriva URL:", url);

        const response = await axios.get(url);

        const html = response.data;

        if (!html || html.includes("No direct connections")) {
            console.log("No direct connections found or invalid data.");
            return [];
        }

        // Extract bus schedule details from the response
        const connectionData = await fetchConnectionData(html);
        return connectionData;

    } catch (error) {
        console.error('Error in scrapeArrivaByUrl:', error);
        return [];
    }
}

// Helper function to parse the connection data from the HTML response
const fetchConnectionData = (html) => {
    const $ = cheerio.load(html);
    const connectionData = [];

    $('div.connection:not(.connection-header) .connection-inner').each((index, el) => {
        const connection = $(el);

        const departureTimeElement = connection.find('.departure-arrival .departure td span');
        const departureTime = departureTimeElement.eq(0).text().trim();
        const departure = departureTimeElement.parent().next().find('span').text().trim();

        const arrivalTimeElement = connection.find('.departure-arrival .arrival td span');
        const arrivalTime = arrivalTimeElement.eq(0).text().trim();
        const arrival = arrivalTimeElement.parent().next().find('span').text().trim();

        const travelDuration = connection.find('.duration .travel-duration span').text().trim();
        const prevoznik = connection.find('.duration .prevoznik span').eq(1).text().trim();

        const length = connection.find('.length').text().trim();
        const price = connection.find('.price').text().trim();

        connectionData.push({
            departure,
            departureTime,
            arrival,
            arrivalTime,
            travelDuration,
            prevoznik,
            length,
            price
        });
    });

    if (connectionData.length === 0) {
        console.log("No connections found.");
        return [];
    } else {
        return connectionData;
    }
}

module.exports = {scrapeArrivaByUrl};