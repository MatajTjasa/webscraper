const moment = require('moment');
const {getDestinationsFromDatabase, getDatabase} = require('./database');

// Helper methods
const retry = (fn, retries = 3) => async (...args) => {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Attempt ${i + 1} to run ${fn.name}`);
            return await fn(...args);
        } catch (error) {
            console.warn(`Attempt ${i + 1} failed:`, error);
            if (i === retries - 1) throw error;
        }
        await delay(1000);
    }
};

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function validateTransportSupport(departureCodes, destinationCodes, transportType) {
    const departureMap = departureCodes[transportType];
    const destinationMap = destinationCodes[transportType];

    if (!departureMap || !destinationMap) {
        return false;
    }
    return true;
}

const getDestinationCodes = async (kraj, redisClient) => {
    let destinations;

    try {
        const cachedDestinations = await redisClient.get('destinations');

        if (cachedDestinations) {
            destinations = JSON.parse(cachedDestinations);
        } else {
            destinations = await getDestinationsFromDatabase();
            await redisClient.setEx('destinations', 43200, JSON.stringify(destinations));
        }
    } catch (error) {
        console.error('Error retrieving destinations from Redis:', error);
        destinations = await getDestinationsFromDatabase();
    }

    const destination = destinations.find(dest => dest.Kraj.toLowerCase() === kraj.toLowerCase());
    if (!destination) {
        return {valid: false};
    }

    const mappings = {
        APMS: destination.APMS || "",
        Arriva: destination.Arriva || "",
        Train: destination.Vlak || "",
        Prevozi: destination.Prevozi || ""
    };

    const valid = Object.values(mappings).every(code => code !== "");

    return {...mappings, valid};
};

function reformatDate(date, transportType) {
    if (transportType === 'Prevozi') {
        return moment(date, ['DD.MM.YYYY', 'YYYY-MM-DD']).format('YYYY-MM-DD');
    } else if (transportType === 'APMS' || transportType === 'Arriva' || transportType === 'Train') {
        return moment(date, ['DD.MM.YYYY', 'YYYY-MM-DD']).format('DD.MM.YYYY');
    } else {
        return date;// train accepts both
    }
}

function reformatDateForCache(date) {
    return moment(date, ['DD.MM.YYYY', 'YYYY-MM-DD']).format('DD.MM.YYYY');
}

function formatLocation(location) {
    return location.replace(/\s+/g, '+');
}

const formatPrice = (price) => {
    if (!price.includes('€')) {
        return `${price} €`;
    }
    return price;
};

async function safeGoto(page, url) {
    for (let i = 0; i < 3; i++) {
        try {
            await page.goto(url, {waitUntil: 'networkidle0', timeout: 60000});
            return;
        } catch (error) {
            console.error(`Attempt ${i + 1} to load page failed:`, error);
            await delay(2000);
        }
    }
    throw new Error(`Failed to load ${url} after multiple attempts`);
}

async function findNearbyStops(departure, destination, date, transportType, scraperFn) {
    const allDestinations = await getDestinationsFromDatabase();

    const findStopResults = async (fromList, toCode, fromLabel, toLabel, reverse = false) => {
        const results = [];

        for (const postaja of fromList || []) {
            const code = postaja[transportType];
            if (!code) continue;

            try {
                const response = reverse
                    ? await scraperFn(toCode, code, date)
                    : await scraperFn(code, toCode, date);

                if (response.length > 0) {
                    results.push({
                        from: reverse ? fromLabel : postaja.Ime,
                        to: reverse ? postaja.Ime : toLabel,
                        schedule: response
                    });
                }
            } catch (e) {
                console.error(`Failed at ${postaja.Ime}:`, e.message);
            }
        }

        return results;
    };

    const mainDep = allDestinations.find(d => d.Kraj.toLowerCase() === departure.toLowerCase());
    const mainDest = allDestinations.find(d => d.Kraj.toLowerCase() === destination.toLowerCase());
    const mainDepCode = mainDep?.[transportType];
    const mainDestCode = mainDest?.[transportType];

    const results = {
        main: [],
        nearbyDepartures: [],
        nearbyDestinations: []
    };

    if (mainDepCode && mainDestCode) {
        try {
            const mainResult = await scraperFn(mainDepCode, mainDestCode, date);
            if (mainResult.length > 0) {
                results.main = mainResult;
            }
        } catch (e) {
            console.error('Main search failed:', e.message);
        }
    }

    results.nearbyDepartures = await findStopResults(mainDep?.Postaje, mainDestCode, departure, destination);
    results.nearbyDestinations = await findStopResults(mainDest?.Postaje, mainDepCode, departure, destination, true);

    return results;
}

async function findNearbyGeoLocations(kraj, radiusInKm = 15, transportType) {
    const db = getDatabase();
    const collection = db.collection('destinationsFlat');

    const main = await collection.findOne({Kraj: kraj, type: 'kraj'});
    if (!main || !main.location) return [];

    const query = {
        location: {
            $near: {
                $geometry: main.location,
                $maxDistance: radiusInKm * 1000 // meters
            }
        },
        [transportType]: {$ne: ""}, //not equal
        Kraj: {$ne: kraj}
    };

    return await collection.find(query).toArray();
}

async function searchWithNearbyGeoLocations(departure, destination, date, transportType, scraperFn, redisClient) {
    const formattedDate = reformatDate(date, transportType);
    const cacheDate = reformatDateForCache(date);
    const depCodes = await getDestinationCodes(departure, redisClient);
    const destCodes = await getDestinationCodes(destination, redisClient);

    const results = {
        main: [],
        nearbyDepartures: [],
        nearbyDestinations: []
    };

    // main route
    if (depCodes[transportType] && destCodes[transportType]) {
        const mainKey = `${transportType}-${departure}-${destination}-${cacheDate}`;
        const cachedMain = await redisClient.get(mainKey);
        if (cachedMain && cachedMain !== '[]') {
            results.main = JSON.parse(cachedMain);
        } else {
            try {
                const mainResult = await scraperFn(depCodes[transportType], destCodes[transportType], formattedDate);
                if (mainResult.length > 0) {
                    results.main = mainResult;
                    await redisClient.setEx(mainKey, 3600, JSON.stringify(mainResult));
                }
            } catch (e) {
                console.error(`Main relation did not succeed:`, e.message);
            }
        }
    } else {
        console.log(`${transportType} does not support exact main relation, checking nearby...`);
    }

    // nearby departures
    const nearbyDeps = await findNearbyGeoLocations(departure, 15, transportType);
    for (const dep of nearbyDeps) {
        if (!dep[transportType] || !destCodes[transportType]) continue;
        const key = `${transportType}-${dep.Kraj}-${destination}-${cacheDate}`;
        const cached = await redisClient.get(key);
        if (cached && cached !== '[]') {
            results.nearbyDepartures.push({iz: dep.Kraj, v: destination, vozniRed: JSON.parse(cached)});
        } else {
            try {
                const altResult = await scraperFn(dep[transportType], destCodes[transportType], formattedDate);
                if (altResult.length > 0) {
                    results.nearbyDepartures.push({iz: dep.Kraj, v: destination, vozniRed: altResult});
                    await redisClient.setEx(key, 3600, JSON.stringify(altResult));
                }
            } catch (e) {
                console.error(`Error in near departure station ${dep.Kraj}:`, e.message);
            }
        }
    }

    // nearby destinations
    const nearbyDests = await findNearbyGeoLocations(destination, 15, transportType);
    for (const dest of nearbyDests) {
        if (!dest[transportType] || !depCodes[transportType]) continue;
        const key = `${transportType}-${departure}-${dest.Kraj}-${cacheDate}`;
        const cached = await redisClient.get(key);
        if (cached && cached !== '[]') {
            results.nearbyDestinations.push({iz: departure, v: dest.Kraj, vozniRed: JSON.parse(cached)});
        } else {
            try {
                const altResult = await scraperFn(depCodes[transportType], dest[transportType], formattedDate);
                if (altResult.length > 0) {
                    results.nearbyDestinations.push({iz: departure, v: dest.Kraj, vozniRed: altResult});
                    await redisClient.setEx(key, 3600, JSON.stringify(altResult));
                }
            } catch (e) {
                console.error(`Error in near destination station ${dest.Kraj}:`, e.message);
            }
        }
    }

    return results;
}

async function cacheAllRelations(departure, destination, date, results, transportType, redisClient) {
    const cacheDate = reformatDateForCache(date);

    if (Array.isArray(results.main) && results.main.length > 0) {
        const key = `${transportType}-${departure}-${destination}-${cacheDate}`;
        await redisClient.setEx(key, 3600, JSON.stringify(results.main));
    }

    for (const group of results.nearbyDepartures || []) {
        const key = `${transportType}-${group.iz}-${group.v}-${cacheDate}`;
        await redisClient.setEx(key, 3600, JSON.stringify(group.vozniRed));
    }

    for (const group of results.nearbyDestinations || []) {
        const key = `${transportType}-${group.iz}-${group.v}-${cacheDate}`;
        await redisClient.setEx(key, 3600, JSON.stringify(group.vozniRed));
    }
}

module.exports = {
    retry,
    validateTransportSupport,
    getDestinationCodes,
    reformatDate,
    reformatDateForCache,
    formatLocation,
    formatPrice,
    safeGoto,
    delay,
    findNearbyStops,
    findNearbyGeoLocations,
    searchWithNearbyGeoLocations,
    cacheAllRelations
};