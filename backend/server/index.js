const express = require('express');
const redis = require('redis');
const {MongoClient} = require('mongodb');
const cron = require('node-cron');
const {scrapeAPMS} = require("../scrapers/apms");
const {scrapeArriva} = require("../scrapers/arriva");
const {scrapeArrivaByUrl} = require("../scrapers/arriva_byUrl");
const {scrapePrevozi} = require("../scrapers/prevozi");
const {scrapePrevoziByUrl} = require("../scrapers/prevozi_byUrl");
const {scrapeSlovenskeZeleznice} = require("../scrapers/slovenske_zeleznice");
const {scrapeSlovenskeZelezniceByUrl} = require("../scrapers/slovenske_zeleznice_byUrl");
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

// Connect to Redis
const redisClient = redis.createClient({url: process.env.REDIS_URL});
redisClient.on('error', (err) => console.error('Redis error:', err));

redisClient.connect().then(() => {
    console.log('Connected to Redis');
}).catch(err => {
    console.error('Redis connection error:', err);
});

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

// Retry wrapper function
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

// Function to check Redis for existing data
async function getCachedData(cacheKey) {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
        console.log('Cache hit');
        return JSON.parse(cachedData);
    }
    return null;
}

// Function to refresh cache
async function refreshCache() {
    console.log('Starting cache refresh task.');
    const db = mongoClient.db('webscraperDB');
    const commonDestinations = await db.collection('transport').find({}).toArray();

    const options = {timeZone: 'Europe/Ljubljana', year: 'numeric', month: '2-digit', day: '2-digit'};
    const date = new Date().toLocaleDateString('en-CA', options); // YYYY-MM-DD
    console.log('Today: ' + date);

    for (const {departure, destination} of commonDestinations) {
        const tasks = [
            {
                name: 'APMS',
                fn: scrapeAPMS,
                cacheKey: `APMS-${departure}-${destination}-${date}`,
                args: [departure, destination, date]
            },
            {
                name: 'Arriva',
                fn: scrapeArrivaByUrl,
                cacheKey: `ArrivaByUrl-${departure}-${destination}-${date}`,
                args: [departure, destination, date]
            },
            {
                name: 'Train',
                fn: scrapeSlovenskeZelezniceByUrl,
                cacheKey: `Train-${departure}-${destination}-${date}`,
                args: [departure, destination, date]
            },
            {
                name: 'Prevozi',
                fn: scrapePrevoziByUrl,
                cacheKey: `PrevoziByUrl-${departure}-${destination}-${date}`,
                args: [departure, destination, date]
            }
        ];

        for (const task of tasks) {
            try {
                console.log(`Refreshing cache for ${task.name} - ${departure} to ${destination}`);
                const result = await retry(task.fn)(...task.args);
                await redisClient.setEx(task.cacheKey, 3600, JSON.stringify(result));
                console.log(`${task.name} cache updated for ${departure} to ${destination}.`);
            } catch (error) {
                console.error(`Error refreshing cache for ${task.name} - ${departure} to ${destination}:`, error);
            }
        }
    }

    console.log('Cache refresh task completed.');
}

// Schedule the task to run every 30 minutes
cron.schedule('*/30 * * * *', () => {
    refreshCache();
});
refreshCache();

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

    // Preparing the tasks, only including those with valid mappings
    const tasks = [];

    if (departureCodes.APMS && destinationCodes.APMS) {
        tasks.push({name: 'APMS', fn: scrapeAPMS, args: [departureCodes.APMS, destinationCodes.APMS, date]});
    }

    if (departureCodes.Arriva && destinationCodes.Arriva) {
        tasks.push({
            name: 'Arriva',
            fn: scrapeArrivaByUrl,
            args: [departureCodes.Arriva, destinationCodes.Arriva, date]
        });
    }

    tasks.push({
        name: 'Train',
        fn: scrapeSlovenskeZelezniceByUrl,
        args: [departureCodes.Train, destinationCodes.Train, date]
    });

    if (departureCodes.Prevozi && destinationCodes.Prevozi) {
        tasks.push({
            name: 'Prevozi',
            fn: scrapePrevoziByUrl,
            args: [departureCodes.Prevozi, destinationCodes.Prevozi, reformatDate(date)]
        });
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

    const departureMap = getDestinationCode(departure, 'APMS');
    const destinationMap = getDestinationCode(destination, 'APMS');

    if (!departureMap || !destinationMap) {
        console.log('APMS does not support this departure or destination or it is invalid. Departure: {departureMap}, Destination: {destinationMap}');
    }

    try {
        // Check Redis for cached data
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            // Check if cached data is valid (not an empty array or invalid)
            if (Array.isArray(parsedData) && parsedData.length > 0 && parsedData[0].departureTime !== "undefined") {
                console.log('Valid cache hit');
                return res.json(parsedData);
            } else {
                console.log('Cache contains invalid or empty data, proceeding to scrape.');
            }
        }

        // If no valid cache, scrape the data
        const results = await retry(scrapeAPMS)(departureMap, destinationMap, date);

        // If results are valid, cache them; otherwise, store an empty array in cache
        const cacheValue = results.length > 0 ? JSON.stringify(results) : JSON.stringify([]);
        await redisClient.setEx(cacheKey, 3600, cacheValue);

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

    const departureCodes = getDestinationCodes(departure);
    const destinationCodes = getDestinationCodes(destination);

    if (!departureCodes.Arriva || !destinationCodes.Arriva) {
        console.log({error: 'Arriva does not support this departure or destination or it is invalid.'});
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

    try {
        const results = await retry(scrapeSlovenskeZeleznice)(departure, destination, date);
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

    // Map location names to codes
    const departureCode = getDestinationCode(departure, 'Vlak');
    const destinationCode = getDestinationCode(destination, 'Vlak');

    if (!departureCode || !destinationCode) {
        console.log({error: 'Slovenske železnice do not support this departure or destination or it is invalid.'});
    }

    try {
        console.log('Cache miss, scraping data...');
        const results = await retry(scrapeSlovenskeZelezniceByUrl)(departureCode, destinationCode, date);
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

    // Mapping
    const dateMap = reformatDate(date);
    const departureMap = getDestinationCode(departure, 'Prevozi');
    const destinationMap = getDestinationCode(destination, 'Prevozi');

    if (!departureMap || !destinationMap) {
        console.log({error: 'Prevozi do not support this departure or destination or it is invalid.'});
    }

    try {
        const results = await retry(scrapePrevoziByUrl)(departureMap, destinationMap, dateMap);
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(results));
        res.json(results);
    } catch (error) {
        console.error('Error during scraping or cache operation:', error);
        res.status(500).json({error: 'An error occurred while scraping data.'});
    }
    console.log('Ending request searchPrevoziByUrl.');
});

// Helper methods
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