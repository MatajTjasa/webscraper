const express = require('express');
const redis = require('redis');
// const mongoose = require('mongoose');
const {scrapeAPMS} = require("../scrapers/apms");
const {scrapeArriva} = require("../scrapers/arriva");
const {scrapeSlovenskeZeleznice} = require("../scrapers/slovenske_zeleznice");
const {scrapeSlovenskeZelezniceByUrl} = require("../scrapers/slovenske_zeleznice_byUrl");

const app = express();
const PORT = process.env.PORT || 3000;

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

app.use(express.json());

app.post('/webscraper/searchAPMS', async (req, res) => {
    console.log('Starting request searchAPMS.')
    const {date, departure, destination} = req.body;
    const cacheKey = `${departure}-${destination}-${date}`;
    console.log(cacheKey)
    try {
        // Check cache
        // const cachedData = await redisClient.get(cacheKey);
        // if (cachedData) {
        //     return res.json(JSON.parse(cachedData));
        // }

        // Scrape data if not in cache
        const results = await scrapeAPMS(departure, destination, date);
        // Save to cache
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(results)); // Cache for 1 hour
        res.json(results);
    } catch (error) {
        res.status(500).json({error: 'An error occurred while scraping data.'});
    }
    console.log('Ending request searchAPMS.')
});

app.post('/webscraper/searchArriva', async (req, res) => {
    console.log('Starting request searchArriva.')
    const {date, departure, destination} = req.body;
    const cacheKey = `${departure}-${destination}-${date}`;
    console.log(cacheKey)
    try {
        // Check cache
        // const cachedData = await redisClient.get(cacheKey);
        // if (cachedData) {
        //     return res.json(JSON.parse(cachedData));
        // }

        // Scrape data if not in cache
        const results = await scrapeArriva(departure, destination, date);
        // Save to cache
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(results)); // Cache for 1 hour
        res.json(results);
    } catch (error) {
        res.status(500).json({error: 'An error occurred while scraping data.'});
    }
    console.log('Ending request searchArriva.')
});

app.post('/webscraper/searchSlovenskeZeleznice', async (req, res) => {
    console.log('Starting request searchSlovenskeZeleznice.')
    const {date, departure, destination} = req.body;
    const cacheKey = `${departure}-${destination}-${date}`;
    console.log(cacheKey)
    try {
        const results = await scrapeSlovenskeZeleznice(departure, destination, date);
        // Save to cache
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(results)); // Cache for 1 hour
        res.json(results);
    } catch (error) {
        res.status(500).json({error: 'An error occurred while scraping data.'});
    }
    console.log('Ending request searchSlovenskeZeleznice.')
});

/*app.post('/webscraper/searchSlovenskeZelezniceByUrl', async (req, res) => {
    console.log('Starting request searchSlovenskeZelezniceByUrl.');
    const { date, departure, destination } = req.body;
    const cacheKey = `${departure}-${destination}-${date}`;
    console.log(cacheKey);
    try {
        // Check cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        // Scrape data if not in cache
        const results = await scrapeSlovenskeZelezniceByUrl(departure, destination, date);
        // Save to cache
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(results)); // Cache for 1 hour
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while scraping data.' });
    }
    console.log('Ending request searchSlovenskeZelezniceByUrl.');
});*/

app.post('/webscraper/searchSlovenskeZelezniceByUrl', async (req, res) => {
    console.log('Starting request searchSlovenskeZelezniceByUrl.');
    const {date, departure, destination} = req.body;
    const cacheKey = `${departure}-${destination}-${date}`;
    console.log(cacheKey);

    try {
        // Check cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log('Cache hit');
            return res.json(JSON.parse(cachedData));
        }

        console.log('Cache miss, scraping data...');
        // Scrape data if not in cache
        const results = await scrapeSlovenskeZelezniceByUrl(departure, destination, date);

        // Save to cache
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(results)); // Cache for 1 hour
        res.json(results);
    } catch (error) {
        console.error('Error during scraping or cache operation:', error);
        res.status(500).json({error: 'An error occurred while scraping data.'});
    }
    console.log('Ending request searchSlovenskeZelezniceByUrl.');
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
