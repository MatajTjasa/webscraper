const {scrapeAPMSbyUrl} = require('../scrapers/apms_byUrl');
const {searchWithNearbyGeoLocations,} = require('../server/helpers');

async function searchAPMS(departure, destination, date, redisClient) {
    const results = await searchWithNearbyGeoLocations(
        departure,
        destination,
        date,
        'APMS',
        scrapeAPMSbyUrl,
        redisClient
    );

    return {error: null, data: results};
}

module.exports = {searchAPMS};
