require('dotenv').config();
const express = require('express');
const redis = require('redis');
const {MongoClient} = require('mongodb');
const {scrapeAPMS} = require("../scrapers/apms");
const {scrapeArriva} = require("../scrapers/arriva");
const {scrapePrevozi} = require("../scrapers/prevozi");
const {scrapeSlovenskeZeleznice} = require("../scrapers/slovenske_zeleznice");
const {scrapeSlovenskeZelezniceByUrl} = require("../scrapers/slovenske_zeleznice_byUrl");
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Connect to Redis
const redisClient = redis.createClient({
    url: 'rediss://red-cpe4mnlds78s73eqb9g0:wGvO2IXLBtYp0zDAosMpIynXyAclcRlz@frankfurt-redis.render.com:6379'
});
redisClient.on('error', (err) => console.error('Redis error:', err));

redisClient.connect().then(() => {
    console.log('Connected to Redis');
}).catch(err => {
    console.error('Redis connection error:', err);
});

console.log('Environment Variables:', process.env);

// Connect to MongoDB
const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('MongoDB URI is not defined. Check your environment variables.');
} else {
    async function main() {
        const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});

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

// API Endpoints
app.post('/webscraper/searchAPMS', async (req, res) => {
    console.log('Starting request searchAPMS.');
    const {date, departure, destination} = req.body;
    const cacheKey = `APMS-${departure}-${destination}-${date}`;
    console.log(cacheKey);
    try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        const results = await scrapeAPMS(departure, destination, date);
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

        const results = await scrapeArriva(departure, destination, date);
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(results));
        res.json(results);
    } catch (error) {
        res.status(500).json({error: 'An error occurred while scraping data.'});
    }
    console.log('Ending request searchArriva.');
});

app.post('/webscraper/searchSlovenskeZeleznice', async (req, res) => {
    console.log('Starting request searchSlovenskeZeleznice.');
    const {date, departure, destination} = req.body;
    const cacheKey = `${departure}-${destination}-${date}`;
    console.log(cacheKey);
    try {
        const results = await scrapeSlovenskeZeleznice(departure, destination, date);
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
    try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log('Cache hit');
            return res.json(JSON.parse(cachedData));
        }

        console.log('Cache miss, scraping data...');
        const results = await scrapeSlovenskeZelezniceByUrl(departure, destination, date);
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

        const results = await scrapePrevozi(departure, destination, date);
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(results));
        res.json(results);
    } catch (error) {
        res.status(500).json({error: 'An error occurred while scraping data.'});
    }
    console.log('Ending request searchPrevozi.');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
