const express = require('express');
const redis = require('redis');
const {MongoClient} = require('mongodb');
const {scrapeAPMS} = require("../scrapers/apms");
const {scrapeArriva} = require("../scrapers/arriva");
const {scrapeArrivaByUrl} = require("../scrapers/arriva_byUrl");
const {scrapePrevozi} = require("../scrapers/prevozi");
const {scrapePrevoziByUrl} = require("../scrapers/prevozi_byUrl");
const {scrapeSlovenskeZeleznice} = require("../scrapers/slovenske_zeleznice");
const {scrapeSlovenskeZelezniceByUrl} = require("../scrapers/slovenske_zeleznice_byUrl");
const {scheduleCacheRefresh} = require('./cacheManager');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');

app.use(cors());
app.use(express.json());

// Load destinations data
const destinationsPath = path.join(__dirname, '../data/destinations/destinations.json');
const destinations = JSON.parse(fs.readFileSync(destinationsPath, 'utf-8'));

console.log('Destinations data loaded:', destinations);

// Connect to MongoDB
const uri = process.env.MONGODB_URI;
let mongoClient;

if (!uri) {
    console.error('MongoDB URI is not defined. Check your environment variables.');
} else {
    async function main() {
        mongoClient = new MongoClient(uri);
        try {
            await mongoClient.connect();
            console.log("Connected to MongoDB");
        } catch (e) {
            console.error('MongoDB connection error:', e);
        }
    }

    main().catch(console.error);
}

// Connect to Redis
const redisClient = redis.createClient({url: process.env.REDIS_URL});
redisClient.on('error', (err) => console.error('Redis error:', err));

redisClient.connect().then(() => {
    console.log('Connected to Redis');
    scheduleCacheRefresh(redisClient, PORT);
}).catch(err => {
    console.error('Redis connection error:', err);
});


// Function to check Redis for existing data
async function getCachedData(cacheKey) {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
        console.log('Cache hit');
        return JSON.parse(cachedData);
    }
    return null;
}

// API
app.post('/webscraper/searchAll', async (req, res) => {
    console.log('Starting request searchAll.');
    const {date, departure, destination} = req.body;

    const cacheKey = `searchAll-${departure}-${destination}-${date}`;
    console.log(cacheKey);

    // Checking Redis for cached data
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
        return res.json(cachedData);
    }

    const departureCodes = getDestinationCodes(departure);
    const destinationCodes = getDestinationCodes(destination);

    // Validate mappings
    if (!departureCodes.valid || !destinationCodes.valid) {
        return res.status(400).json({error: 'Invalid departure or destination location.'});
    }

    const tasks = [];

    if (validateTransportSupport(departureCodes, destinationCodes, 'APMS')) {
        tasks.push({name: 'APMS', fn: scrapeAPMS, args: [departureCodes.APMS, destinationCodes.APMS, date]});
    } else {
        console.log('APMS does not support this departure or destination.');
    }

    if (validateTransportSupport(departureCodes, destinationCodes, 'Arriva')) {
        tasks.push({
            name: 'Arriva',
            fn: scrapeArrivaByUrl,
            args: [departureCodes.Arriva, destinationCodes.Arriva, date]
        });
    } else {
        console.log('Arriva does not support this departure or destination.');
    }

    if (validateTransportSupport(departureCodes, destinationCodes, 'Train')) {
        tasks.push({
            name: 'Train',
            fn: scrapeSlovenskeZelezniceByUrl,
            args: [departureCodes.Train, destinationCodes.Train, date]
        });
    } else {
        console.log('Train does not support this departure or destination.');
    }

    if (validateTransportSupport(departureCodes, destinationCodes, 'Prevozi')) {
        tasks.push({
            name: 'Prevozi',
            fn: scrapePrevoziByUrl,
            args: [departureCodes.Prevozi, destinationCodes.Prevozi, reformatDate(date)]
        });
    } else {
        console.log('Prevozi does not support this departure or destination.');
    }

    try {
        const results = {};
        await Promise.all(tasks.map(async task => {
            console.log(`Starting ${task.name} scraper`);
            results[task.name] = await retry(task.fn)(...task.args);
        }));

        // Cache the results
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(results));
        res.json(results);
    } catch (error) {
        console.error('Error during scraping:', error);
        res.status(500).json({error: 'An error occurred while scraping data.'});
    }
    console.log('Ending request searchAll.');
});

app.post('/webscraper/searchAPMS', async (req, res) => {
    console.log('Starting request searchAPMS.');
    const {date, departure, destination} = req.body;
    const cacheKey = `APMS-${departure}-${destination}-${date}`;
    console.log(cacheKey);

    const departureCodes = getDestinationCodes(departure);
    const destinationCodes = getDestinationCodes(destination);

    if (!validateTransportSupport(departureCodes, destinationCodes, 'APMS')) {
        console.log('APMS does not support this departure or destination.');
    }

    try {
        const results = await retry(scrapeAPMS)(departureCodes.APMS, destinationCodes.APMS, date);
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(results));
        res.json(results);
    } catch (error) {
        console.error('Error during scraping:', error);
        res.status(500).json({error: 'An error occurred while scraping data.'});
    }
    console.log('Ending request searchAPMS.');
});

app.post('/webscraper/searchArriva', async (req, res) => {
    console.log('Starting request searchArriva.');
    const {date, departure, destination} = req.body;
    const cacheKey = `Arriva-${departure}-${destination}-${date}`;
    console.log(cacheKey);
    try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        if (!validateTransportSupport(departureCodes, destinationCodes, 'Arriva')) {
            console.log('Arriva does not support this departure or destination.');
        }

        const results = await retry(scrapeArriva)(departureCodes.Arriva, destinationCodes.Arriva, date);
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(results));
        res.json(results);
    } catch (error) {
        res.status(500).json({error: 'An error occurred while scraping data.'});
    }
    console.log('Ending request searchArriva.');
});

app.post('/webscraper/searchArrivaByUrl', async (req, res) => {
    console.log('Starting request searchArrivaByUrl.');
    const {date, departure, destination} = req.body;
    const cacheKey = `ArrivaByUrl-${departure}-${destination}-${date}`;
    console.log(cacheKey);

    const departureCodes = getDestinationCodes(departure);
    const destinationCodes = getDestinationCodes(destination);

    if (!validateTransportSupport(departureCodes, destinationCodes, 'Arriva')) {
        console.log('Arriva does not support this departure or destination.');
    }

    try {
        const results = await retry(scrapeArrivaByUrl, 3)(departureCodes.Arriva, destinationCodes.Arriva, date);
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(results));
        res.json(results);
    } catch (error) {
        console.error('Error during scraping or cache operation:', error);
        res.status(500).json({error: 'An error occurred while scraping data.'});
    }
    console.log('Ending request searchArrivaByUrl.');
});

app.post('/webscraper/searchSlovenskeZeleznice', async (req, res) => {
    console.log('Starting request searchSlovenskeZeleznice.');
    const {date, departure, destination} = req.body;
    const cacheKey = `${departure}-${destination}-${date}`;
    console.log(cacheKey);

    const departureCodes = getDestinationCodes(departure);
    const destinationCodes = getDestinationCodes(destination);

    if (!validateTransportSupport(departureCodes, destinationCodes, 'Train')) {
        console.log('Slovenske železnice do not support this departure or destination.');
    }

    try {
        const results = await retry(scrapeSlovenskeZeleznice)(departureCodes.Train, destinationCodes.Train, date);
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(results));
        res.json(results);
    } catch (error) {
        res.status(500).json({error: 'An error occurred while scraping data.'});
    }
    console.log('Ending request searchSlovenskeZeleznice.');
});

app.post('/webscraper/searchSlovenskeZelezniceByUrl', async (req, res) => {
    console.log('Starting request searchSlovenskeZelezniceByUrl.');
    const {date, departure, destination} = req.body;
    const cacheKey = `Train-${departure}-${destination}-${date}`;
    console.log(cacheKey);

    const departureCodes = getDestinationCodes(departure);
    const destinationCodes = getDestinationCodes(destination);

    if (!validateTransportSupport(departureCodes, destinationCodes, 'Train')) {
        console.log('Slovenske železnice do not support this departure or destination.');
    }

    try {
        console.log('Cache miss, scraping data...');
        const results = await retry(scrapeSlovenskeZelezniceByUrl)(departureCodes.Train, destinationCodes.Train, date);
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(results));
        res.json(results);
    } catch (error) {
        console.error('Error during scraping or cache operation:', error);
        res.status(500).json({error: 'An error occurred while scraping data.'});
    }
    console.log('Ending request searchSlovenskeZelezniceByUrl.');
});

app.post('/webscraper/searchPrevozi', async (req, res) => {
    console.log('Starting request searchPrevozi.');
    const {date, departure, destination} = req.body;
    const cacheKey = `Prevozi-${departure}-${destination}-${date}`;
    console.log(cacheKey);

    const departureCodes = getDestinationCodes(departure);
    const destinationCodes = getDestinationCodes(destination);

    if (!validateTransportSupport(departureCodes, destinationCodes, 'Prevozi')) {
        console.log('Prevozi do not support this departure or destination.');
    }

    try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        const results = await retry(scrapePrevozi)(departureCodes.Prevozi, destinationCodes.Prevozi, date);
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(results));
        res.json(results);
    } catch (error) {
        res.status(500).json({error: 'An error occurred while scraping data.'});
    }
    console.log('Ending request searchPrevozi.');
});

app.post('/webscraper/searchPrevoziByUrl', async (req, res) => {
    console.log('Starting request searchPrevoziByUrl.');
    const {date, departure, destination} = req.body;
    const cacheKey = `PrevoziByUrl-${departure}-${destination}-${date}`;
    console.log(cacheKey);

    const departureCodes = getDestinationCodes(departure);
    const destinationCodes = getDestinationCodes(destination);

    if (!validateTransportSupport(departureCodes, destinationCodes, 'Prevozi')) {
        console.log('Prevozi do not support this departure or destination.');
    }

    try {
        const results = await retry(scrapePrevoziByUrl)(departureCodes.Prevozi, destinationCodes.Prevozi, reformatDate(date));
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(results));
        res.json(results);
    } catch (error) {
        console.error('Error during scraping or cache operation:', error);
        res.status(500).json({error: 'An error occurred while scraping data.'});
    }
    console.log('Ending request searchPrevoziByUrl.');
});

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

function getDestinationCodes(kraj) {
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
}

function reformatDate(date) {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (datePattern.test(date)) { // from dd.mm.yyyy to yyyy-mm-dd
        return date;
    }
    const [day, month, year] = date.split('.');
    return `${year}-${month}-${day}`;
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});