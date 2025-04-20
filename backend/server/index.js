const express = require('express');
const redis = require('redis');
const {scrapeAPMSbyUrl} = require("../scrapers/apms_byUrl");
const {scrapeArrivaByUrl} = require("../scrapers/arriva_byUrl");
const {fetchPrevozi} = require("../scrapers/prevozi_byUrl");
const {scrapeSlovenskeZelezniceByUrl} = require("../scrapers/slovenske_zeleznice_byUrl");
const {scrapeSlovenskeZelezniceDOM} = require("../scrapers/slovenske_zeleznice_DOM");
const {comparePerformance} = require("./comparePerformance");
const {retry, validateTransportSupport, getDestinationCodes, reformatDate, reformatDateForCache} = require('./helpers');
const {getDestinationsFromDatabase} = require('./database');
const {searchAPMS} = require('../services/apmsService');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
    origin: ['http://localhost:5000', 'https://frontend-vmg7.onrender.com'], //true
    optionsSuccessStatus: 200, // legacy browser support
};
app.use(cors(corsOptions));
app.use(express.json());

app.set('trust proxy', 1);

const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5min
    max: 50, // limit of requests in 5min
    message: "Preveč zahtev. Prosim, poskusite znova čez 5 minut."
});
app.use(limiter);

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
    //scrapeSlovenskeZelezniceDOM().then(data => console.log(JSON.stringify(data, null, 2))).catch(err => console.error('Error:', err));
    // Compare Puppeteer and DOM
    //comparePerformance('42300', '43400', '14.01.2025', 'vlak').then(data => console.log(JSON.stringify(data, null, 2))).catch(err => console.error('Error:', err));
    //comparePerformance('Ljubljana', 'Celje', '2025-03-30', 'prevoz').then(data => console.log(JSON.stringify(data, null, 2))).catch(err => console.error('Error:', err));

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

    res.json(destinations.map(dest => ({
        Id: dest._id,
        Kraj: dest.Kraj,
        Postaje: (dest.Postaje || []).map(p => ({
            Ime: p.Ime,
            Vlak: p.Vlak || null,
            APMS: p.APMS || null,
            Arriva: p.Arriva || null,
            Prevozi: p.Prevozi || null,
            lat: p.lat,
            lon: p.lon
        }))
    })));
});

async function handleSearch(req, res, scraperFn, transportType) {
    let {date, departure, destination} = req.body;
    const cacheKey = `${transportType}-${departure}-${destination}-${reformatDateForCache(date)}`;
    const startTime = Date.now();

    date = reformatDate(date, transportType);

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData && cachedData !== '[]') {
        const duration = (Date.UTC() - startTime) / 1000;
        const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleTimeString()
        console.log(`Fetching data for ${transportType} ${date} from cache: ${duration} seconds at ${endTime}.`);
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

        const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleTimeString()
        const duration = (endTime - startTime) / 1000;
        //console.log(`Fetching data for ${transportType} ${date} from API: ${duration} seconds at ${endTime}.`);

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

async function handleSearchNoCache(req, res, scraperFn, transportType) {
    let {date, departure, destination} = req.body;
    const startTime = Date.now();

    try {
        date = reformatDate(date, transportType);
        const departureCodes = await getDestinationCodes(departure, redisClient);
        const destinationCodes = await getDestinationCodes(destination, redisClient);

        if (!validateTransportSupport(departureCodes, destinationCodes, transportType)) {
            console.log(`${transportType} does not support this departure or destination.`);
            return {error: `${transportType} does not support this departure or destination.`, data: null};
        }

        const results = await retry(scraperFn)(
            departureCodes[transportType],
            destinationCodes[transportType],
            date
        );

        const duration = (Date.now() - startTime) / 1000 + 's';
        console.log(`Fetching data for ${transportType} ${date} completed in ${duration}.`);

        return {error: null, data: results};
    } catch (error) {
        console.error(`Error fetching data for ${transportType}: ${error.message}`);
        return {error: error.message, data: null};
    }
}

app.post('/webscraper/searchAll', async (req, res) => {
    const {date, departure, destination} = req.body;

    const providers = [
        {name: 'APMS', scraperFn: scrapeAPMSbyUrl, transportType: 'APMS'},
        {name: 'Arriva', scraperFn: scrapeArrivaByUrl, transportType: 'Arriva'},
        {name: 'Slovenske železnice', scraperFn: scrapeSlovenskeZelezniceByUrl, transportType: 'Train'},
        {name: 'Prevozi', scraperFn: fetchPrevozi, transportType: 'Prevozi'},
    ];

    const results = [];
    const startTime = Date.now();

    for (const provider of providers) {
        const providerStartTime = Date.now();
        console.log(`Starting request for ${provider.name}.`);

        const {error, data} = await handleSearchNoCache(
            {body: {date, departure, destination}},
            res,
            provider.scraperFn,
            provider.transportType
        );

        const providerEndTime = Date.now();
        results.push({
            provider: provider.name,
            duration: (providerEndTime - providerStartTime) / 1000 + 's',
            data,
            error,
        });
    }

    const endTime = Date.now();
    const totalDuration = (endTime - startTime) / 1000 + 's';

    console.log(`Fetching all schedules completed. Total duration: ${totalDuration}.`);

    res.json({
        totalDuration,
        results,
    });
});


app.post('/webscraper/searchAPMSbyUrl', async (req, res) => {
    const {date, departure, destination} = req.body;
    console.log('Starting request searchAPMSbyUrl.');

    const result = await searchAPMS(departure, destination, date, redisClient);

    if (result.error) {
        return res.status(400).json({message: result.error});
    }

    return res.json(result.data);
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
    await handleSearch(req, res, fetchPrevozi, 'Prevozi', true);
    console.log('Ending request searchPrevoziByUrl.');
});

app.get('/heartbeat', async (req, res) => {
    console.log('Heart beating OK');
    res.status(200).send('Heart beating OK');
});

app.post('/webscraper/compare', async (req, res) => {
    const {date, departure, destination} = req.body;

    const puppeteerStart = Date.now();
    const puppeteerData = await scrapeSlovenskeZelezniceByUrl(departure, destination, date);
    const puppeteerDuration = (Date.now() - puppeteerStart) / 1000;

    const jsdomResult = await scrapeSlovenskeZelezniceDOM();

    res.json({
        puppeteer: {
            duration: puppeteerDuration,
            data: puppeteerData,
        },
        jsdom: {
            duration: jsdomResult.duration,
            data: jsdomResult,
        },
    });
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

//scrapeSlovenskeZelezniceDOM('42300', '43400', '12.01.2025').then(data => console.log(JSON.stringify(data, null, 2)));
