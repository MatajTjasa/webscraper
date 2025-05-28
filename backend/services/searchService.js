const {searchWithNearbyGeoLocations, cacheAllRelations} = require('../server/helpers');

async function search(departure, destination, date, provider, scraperFunction, redisClient) {

    const results = await searchWithNearbyGeoLocations(
        departure,
        destination,
        date,
        provider,
        scraperFunction,
        redisClient
    );

    await cacheAllRelations(departure, destination, date, results, provider, redisClient);

    return {error: null, data: results};
}

module.exports = {search};