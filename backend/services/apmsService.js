const {scrapeAPMSbyUrl} = require('../scrapers/apms_byUrl');
const {
    reformatDate,
    getDestinationCodes,
    validateTransportSupport,
    findNearbyStops
} = require('../server/helpers');

async function searchAPMS(departure, destination, date, redisClient) {
    const departureCodes = await getDestinationCodes(departure, redisClient);
    const destinationCodes = await getDestinationCodes(destination, redisClient);

    if (!validateTransportSupport(departureCodes, destinationCodes, 'APMS')) {
        return {error: 'APMS does not support this departure or destination.', data: null};
    }

    const formattedDate = reformatDate(date, 'APMS');
    const mainResult = await scrapeAPMSbyUrl(departureCodes['APMS'], destinationCodes['APMS'], formattedDate);

    const nearbyResults = await findNearbyStops(
        departure,
        destination,
        date,
        'APMS',
        scrapeAPMSbyUrl
    );

    return {
        error: null,
        data: {
            main: mainResult,
            nearby: nearbyResults
        }
    };
}

module.exports = {searchAPMS};
