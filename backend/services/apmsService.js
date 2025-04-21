const {scrapeAPMSbyUrl} = require('../scrapers/apms_byUrl');
const {searchWithNearbyGeoLocations, cacheAllRelations} = require('../server/helpers');

async function searchAPMS(departure, destination, date, redisClient) {
    const results = await searchWithNearbyGeoLocations(
        departure,
        destination,
        date,
        'APMS',
        scrapeAPMSbyUrl,
        redisClient
    );

    await cacheAllRelations(departure, destination, date, results, 'APMS', redisClient);

    return {error: null, data: results};
}

module.exports = {searchAPMS};
