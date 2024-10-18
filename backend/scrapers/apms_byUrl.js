const axios = require('axios');
const {formatPrice} = require('../server/helpers');

async function scrapeAPMSbyUrl(departure, destination, date) {
    try {
        const url = `https://www.apms.si/response.ajax.php?com=voznired2020&task=get&datum=${encodeURIComponent(date)}&postaja_od=${encodeURIComponent(departure)}&postaja_do=${encodeURIComponent(destination)}`;
        console.log("APMS URL: ", url);

        const response = await axios.get(url);

        const jsonContent = response.data;

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
            price: formatPrice(item.cena.trim())
        }));

        console.log(formattedData);
        return formattedData;

    } catch (e) {
        console.error('Error executing scrapeAPMS:', e);
        return [];
    }
}

// Example call for testing
// scrapeAPMSbyUrl('Maribor AP', 'Murska Sobota AP', '23.08.2024').catch(err => console.error('Error executing scrapeAPMSbyUrl:', err));

module.exports = {scrapeAPMSbyUrl};