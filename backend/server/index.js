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
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const path = require('path');

// Load destinations data
const destinationsPath = path.join(__dirname, '../data/destinations/destinations.json');
const destinations = JSON.parse(fs.readFileSync(destinationsPath, 'utf-8'));

console.log('Destinations data loaded:', destinations);

function getDestinationCode(kraj, type) {
    const destination = destinations.find(dest => dest.Kraj.toLowerCase() === kraj.toLowerCase());
    return destination ? destination[type] : null;
}

// Function to reformat date from dd.mm.yyyy to yyyy-mm-dd
function reformatDate(date) {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (datePattern.test(date)) {
        return date;
    }
    const [day, month, year] = date.split('.');
    return `${year}-${month}-${day}`;
}

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

if (!uri) {
    console.error('MongoDB URI is not defined. Check your environment variables.');
} else {
    async function main() {
        const client = new MongoClient(uri);

        try {
            await client.connect();
            console.log("Connected to MongoDB");
        } catch (e) {
            console.error('MongoDB connection error:', e);
        } finally {
            await client.close();
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


// API Endpoints
app.get('/webscraper/destinations', (req, res) => {
    const destinationsList = destinations.map(dest => ({Id: dest.Id, Kraj: dest.Kraj}));
    res.json(destinationsList);
});

app.post('/webscraper/searchAPMS', async (req, res) => {
    console.log('Starting request searchAPMS.');
    const {date, departure, destination} = req.body;
    const cacheKey = `APMS-${departure}-${destination}-${date}`;
    console.log(cacheKey);

    const departureMap = getDestinationCode(departure, 'APMS');
    const destinationMap = getDestinationCode(destination, 'APMS');

    if (!departureMap || !destinationMap) {
        return res.status(400).json({error: 'Invalid departure or destination location.'});
    }

    try {
        /*        const cachedData = await redisClient.get(cacheKey);
                if (cachedData) {
                    return res.json(JSON.parse(cachedData));
                }*/

        const results = await retry(scrapeAPMS)(departure, destination, date);
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(results));
        res.json(results);
    } catch (error) {
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

        const results = await retry(scrapeArriva)(departure, destination, date);
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

    // Mapping
    const departureMap = getDestinationCode(departure, 'Arriva');
    const destinationMap = getDestinationCode(destination, 'Arriva');

    if (!departureMap || !destinationMap) {
        return res.status(400).json({error: 'Invalid departure or destination location.'});
    }

    try {
        const results = await retry(scrapeArrivaByUrl, 3)(departureMap, destinationMap, date);
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

    // Map location names to codes
    const departureCode = getDestinationCode(departure, 'Vlak');
    const destinationCode = getDestinationCode(destination, 'Vlak');

    if (!departureCode || !destinationCode) {
        return res.status(400).json({error: 'Invalid departure or destination location.'});
    }

    const cacheKey = `Train-${departureCode}-${destinationCode}-${date}`;
    console.log(cacheKey);

    try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log('Cache hit');
            return res.json(JSON.parse(cachedData));
        }

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

app.post('/webscraper/searchPrevozi', async (req, res) => {
    console.log('Starting request searchPrevozi.');
    const {date, departure, destination} = req.body;
    const cacheKey = `Prevozi-${departure}-${destination}-${date}`;
    console.log(cacheKey);
    try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        const results = await retry(scrapePrevozi)(departure, destination, date);
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

    // Mapping
    const dateMap = reformatDate(date);
    const departureMap = getDestinationCode(departure, 'Prevozi');
    const destinationMap = getDestinationCode(destination, 'Prevozi');

    if (!departureMap || !destinationMap) {
        return res.status(400).json({error: 'Invalid departure or destination location.'});
    }


    try {
        /*        const cachedData = await redisClient.get(cacheKey);
                if (cachedData) {
                    console.log('Cache hit');
                    return res.json(JSON.parse(cachedData));
                }
                console.log('Cache miss, scraping data...');*/

        const results = await retry(scrapePrevoziByUrl)(departureMap, destinationMap, dateMap);
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
