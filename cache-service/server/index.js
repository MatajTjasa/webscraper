const express = require('express');
const redis = require('redis');
const {scrapeAPMSbyUrl} = require("../scrapers/apms_byUrl");
const {scrapeArrivaByUrl} = require("../scrapers/arriva_byUrl");
const {scrapePrevoziByUrl} = require("../scrapers/prevozi_byUrl");
const {scrapeSlovenskeZelezniceByUrl} = require("../scrapers/slovenske_zeleznice_byUrl");
const {scheduleCacheRefresh} = require('./cacheManager');
const {retry, validateTransportSupport, getDestinationCodes, reformatDate, reformatDateForCache} = require('./helpers');
const {getDestinationsFromDatabase} = require('./database');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

const corsOptions = {
    origin: true,
};
app.use(cors(corsOptions));
app.use(express.json());

app.set('trust proxy', 1);

// Connect to Redis
const redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
        tls: true,
        rejectUnauthorized: true
    }
});

redisClient.on('error', (err) => console.error('Redis error:', err));

redisClient.connect().then(() => {
    console.log('Connected to Redis');
    scheduleCacheRefresh(redisClient, PORT);
}).catch(err => {
    console.error('Redis connection error:', err);
});

const ongoingRequests = new Map();

function trackRequest(key, promise, controller) {
    ongoingRequests.set(key, {promise, controller});
}

function clearRequest(key) {
    ongoingRequests.delete(key);
}

function abortRequest(key) {
    if (ongoingRequests.has(key)) {
        ongoingRequests.get(key).controller.abort();
        ongoingRequests.delete(key);
    }
}

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
app.get('/webscraper/destinations', async (req, res) => {
    const cacheKey = 'destinations';
    let destinations = await getCachedData(cacheKey);

    if (!destinations) {
        destinations = await getDestinationsFromDatabase();
        await redisClient.setEx(cacheKey, 43200, JSON.stringify(destinations)); // 12h TTL
    }

    res.json(destinations.map(dest => ({Id: dest.Id, Kraj: dest.Kraj})));
});

async function handleSearch(req, res, scraperFn, transportType) {
    let {date, departure, destination} = req.body;
    const cacheKey = `${transportType}-${departure}-${destination}-${reformatDateForCache(date)}`;

    date = reformatDate(date, transportType);

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData && cachedData !== '[]') {
        console.log('Retrieving data from cache.');
        return res.json(JSON.parse(cachedData));
    }

    const departureCodes = await getDestinationCodes(departure, redisClient);
    const destinationCodes = await getDestinationCodes(destination, redisClient);

    if (!validateTransportSupport(departureCodes, destinationCodes, transportType)) {
        console.log(`${transportType} does not support this departure or destination.`);
        return res.json({message: "Departure or destination is not supported."});
    }

    const controller = new AbortController();
    const signal = controller.signal;

    try {
        const scraperPromise = retry(scraperFn)(departureCodes[transportType], destinationCodes[transportType], date, {signal});
        trackRequest(cacheKey, scraperPromise, controller);

        const results = await scraperPromise;
        clearRequest(cacheKey);
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(results));
        res.json(results);
    } catch (error) {
        clearRequest(cacheKey);
        if (error.name === 'AbortError') {
            console.log(`Request ${cacheKey} was aborted.`);
        } else {
            console.error('Error during scraping:', error);
            res.status(500).json({error: 'An error occurred while scraping data.'});
        }
    }
}

app.post('/webscraper/searchAPMSbyUrl', async (req, res) => {
    console.log('Starting request searchAPMSbyUrl.');
    await handleSearch(req, res, scrapeAPMSbyUrl, 'APMS');
    console.log('Ending request searchAPMSbyUrl.');
});

app.post('/webscraper/searchArrivaByUrl', async (req, res) => {
    console.log('Starting request searchArrivaByUrl.');
    await handleSearch(req, res, scrapeArrivaByUrl, 'Arriva', false);
    console.log('Ending request searchArrivaByUrl.');
});

app.post('/webscraper/searchSlovenskeZelezniceByUrl', async (req, res) => {
    console.log('Starting request searchSlovenskeZelezniceByUrl.');
    await handleSearch(req, res, scrapeSlovenskeZelezniceByUrl, 'Train');
    console.log('Ending request searchSlovenskeZelezniceByUrl.');
});

app.post('/webscraper/searchPrevoziByUrl', async (req, res) => {
    console.log('Starting request searchPrevoziByUrl.');
    await handleSearch(req, res, scrapePrevoziByUrl, 'Prevozi', true);
    console.log('Ending request searchPrevoziByUrl.');
});

app.get('/heartbeat', async (req, res) => {
    console.log('Heart beating OK')
    res.status(200).send('Heart beating OK');
});

// Graceful shutdown
process.on('SIGINT', () => {
    redisClient.quit(() => {
        console.log('Redis client disconnected');
        process.exit(0);
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});