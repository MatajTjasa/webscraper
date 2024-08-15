const express = require('express');
const redis = require('redis');
const {scrapeAPMS} = require("../scrapers/apms");
const {scrapeArrivaByUrl} = require("../scrapers/arriva_byUrl");
const {scrapePrevoziByUrl} = require("../scrapers/prevozi_byUrl");
const {scrapeSlovenskeZelezniceByUrl} = require("../scrapers/slovenske_zeleznice_byUrl");
const {scheduleCacheRefresh} = require('./cacheManager');
const {retry, validateTransportSupport, getDestinationCodes, reformatDate} = require('./helpers');
const {getDestinationsFromDatabase} = require('./database');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


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
app.get('/webscraper/destinations', async (req, res) => {
    const cacheKey = 'destinations';

    let destinations = await getCachedData(cacheKey);

    if (!destinations) {
        destinations = await getDestinationsFromDatabase();

        await redisClient.setEx(cacheKey, 43200, JSON.stringify(destinations)); //12h TTL
    }

    res.json(destinations.map(dest => ({Id: dest.Id, Kraj: dest.Kraj})));
});

app.post('/webscraper/searchAPMS', async (req, res) => {
    console.log('Starting request searchAPMS.');
    const {date, departure, destination} = req.body;
    const cacheKey = `APMS-${departure}-${destination}-${date}`;
    console.log(cacheKey);

    try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData && cachedData !== '[]') {
            console.log('Retrieving APMS data from cache.')
            return res.json(JSON.parse(cachedData));
        }


        const departureCodes = await await getDestinationCodes(departure, redisClient);
        const destinationCodes = await await await getDestinationCodes(destination, redisClient);

        if (!validateTransportSupport(departureCodes, destinationCodes, 'APMS')) {
            console.log('APMS does not support this departure or destination.');
            return res.json({message: "Departure or destination is not supported."});
        }

        const results = await retry(scrapeAPMS)(departureCodes.APMS, destinationCodes.APMS, date);
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(results));
        res.json(results);
    } catch (error) {
        console.error('Error during scraping:', error);
        res.status(500).json({error: 'An error occurred while scraping data.'});
    }
    console.log('Ending request searchAPMS.');
});

app.post('/webscraper/searchArrivaByUrl', async (req, res) => {
    console.log('Starting request searchArrivaByUrl.');
    const {date, departure, destination} = req.body;
    const cacheKey = `ArrivaByUrl-${departure}-${destination}-${date}`;
    console.log(cacheKey);

    try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData && cachedData !== '[]') {
            console.log('Retrieving Arriva data from cache.')
            return res.json(JSON.parse(cachedData));
        }

        const departureCodes = await await getDestinationCodes(departure, redisClient);
        const destinationCodes = await getDestinationCodes(destination, redisClient);

        if (!validateTransportSupport(departureCodes, destinationCodes, 'Arriva')) {
            console.log('Arriva does not support this departure or destination.');
            return res.json({message: "Departure or destination is not supported."});
        }

        const results = await retry(scrapeArrivaByUrl, 3)(departureCodes.Arriva, destinationCodes.Arriva, date);
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(results));
        res.json(results);

    } catch (error) {
        console.error('Error during scraping or cache operation:', error);
        res.status(500).json({error: 'An error occurred while scraping data.'});
    }
    console.log('Ending request searchArrivaByUrl.');
});

app.post('/webscraper/searchSlovenskeZelezniceByUrl', async (req, res) => {
    console.log('Starting request searchSlovenskeZelezniceByUrl.');
    const {date, departure, destination} = req.body;
    const cacheKey = `Train-${departure}-${destination}-${date}`;
    console.log(cacheKey);

    try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData && cachedData !== '[]') {
            console.log('Retrieving Slovenske železnice data from cache.')
            return res.json(JSON.parse(cachedData));
        }

        const departureCodes = await getDestinationCodes(departure, redisClient);
        const destinationCodes = await getDestinationCodes(destination, redisClient);

        if (!validateTransportSupport(departureCodes, destinationCodes, 'Train')) {
            console.log('Slovenske železnice do not support this departure or destination.');
            return res.json({message: "Departure or destination is not supported."});
        }

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

app.post('/webscraper/searchPrevoziByUrl', async (req, res) => {
    console.log('Starting request searchPrevoziByUrl.');
    const {date, departure, destination} = req.body;
    const cacheKey = `PrevoziByUrl-${departure}-${destination}-${date}`;
    console.log(cacheKey);

    try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData && cachedData !== '[]') {
            console.log('Retrieving Prevozi data from cache.')
            return res.json(JSON.parse(cachedData));
        }

        const departureCodes = await getDestinationCodes(departure, redisClient);
        const destinationCodes = await getDestinationCodes(destination, redisClient);

        if (!validateTransportSupport(departureCodes, destinationCodes, 'Prevozi')) {
            console.log('Prevozi do not support this departure or destination.');
            return res.json({message: "Departure or destination is not supported."});
        }

        const results = await retry(scrapePrevoziByUrl)(departureCodes.Prevozi, destinationCodes.Prevozi, reformatDate(date));
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(results));
        res.json(results);
    } catch (error) {
        console.error('Error during scraping or cache operation:', error);
        res.status(500).json({error: 'An error occurred while scraping data.'});
    }
    console.log('Ending request searchPrevoziByUrl.');
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});