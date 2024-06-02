const express = require('express');
const redis = require('redis');
const mongoose = require('mongoose');
const apms = require('../scrapers/apms.js');
const arriva = require('../scrapers/arriva.js');
const prevozi = require('../scrapers/prevozi.js');
const slovenske_zeleznice = require('../scrapers/slovenske_zeleznice.js');

const {scrapeAPMS} = require("../scrapers/apms");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Redis
const redisClient = redis.createClient();
redisClient.on('error', (err) => console.error('Redis error:', err));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:3000/webscraper', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(express.json());

app.post('/searchAPMS', async (req, res) => {
    const { date, departure, destination } = req.body;
    try {
        const results = await scrapeAPMS(departure, destination, date);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while scraping data.' });
    }
});

/*
app.post('/search', async (req, res) => {
    const { date, departure, destination } = req.body;
    const cacheKey = `${departure}-${destination}-${date}`;

    redisClient.get(cacheKey, async (err, data) => {
        if (err) throw err;

        if (data) {
            res.send(JSON.parse(data));
        } else {
            const results = await Promise.all([
                apms(departure, destination, date),
                arriva(departure, destination, date),
                prevozi(departure, destination, date),
                slovenske_zeleznice(departure, destination, date),
            ]);

            const aggregatedResults = [].concat(...results);
            await redisClient.setEx(cacheKey, 3600, JSON.stringify(aggregatedResults)); // Cache for 1 hour
            res.send(aggregatedResults);
        }
    });
});
*/
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


/*
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Endpoint to get train schedules
app.get('/api/train-schedules', (req, res) => {
    fs.readFile(path.join(__dirname, 'data', 'train_schedules.json'), 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading train schedules');
        }
        res.json(JSON.parse(data));
    });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
*/
