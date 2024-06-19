const express = require('express');
const redis = require('redis');
// const mongoose = require('mongoose');
// const apms = require('../scrapers/apms.js');
// const arriva = require('../scrapers/arriva.js');
// const prevozi = require('../scrapers/prevozi.js');
// const slovenske_zeleznice = require('../scrapers/slovenske_zeleznice.js');
const {scrapeAPMS} = require("../scrapers/apms");
const {scrapeArriva} = require("../scrapers/arriva");

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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
