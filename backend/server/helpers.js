const moment = require('moment');
const {getDestinationsFromDatabase} = require('./database');

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
    } else if (transportType === 'APMS' || transportType === 'Arriva') {
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


module.exports = {
    retry,
    validateTransportSupport,
    getDestinationCodes,
    reformatDate,
    reformatDateForCache,
    formatLocation,
    safeGoto,
    delay
};