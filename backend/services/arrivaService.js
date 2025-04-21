const {scrapeArrivaByUrl} = require('../scrapers/arriva_byUrl');
const {searchWithNearbyGeoLocations, cacheAllRelations} = require('../server/helpers');

async function searchArriva(departure, destination, date, redisClient) {
    const results = await searchWithNearbyGeoLocations(
        departure,
        destination,
        date,
        'Arriva',
        scrapeArrivaByUrl,
        redisClient
    );

    await cacheAllRelations(departure, destination, date, results, 'APMS', redisClient);

    return {error: null, data: results};
}

module.exports = {searchArriva};
