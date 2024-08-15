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
    }
};

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

function reformatDate(date) {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (datePattern.test(date)) { // from dd.mm.yyyy to yyyy-mm-dd
        return date;
    }
    const [day, month, year] = date.split('.');
    return `${year}-${month}-${day}`;
}


module.exports = {
    retry,
    validateTransportSupport,
    getDestinationCodes,
    reformatDate,
};