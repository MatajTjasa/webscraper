const {MongoClient} = require('mongodb');
const cron = require('node-cron');
const redis = require('redis');
const {scrapeAPMS, scrapeArrivaByUrl, scrapePrevoziByUrl, scrapeSlovenskeZelezniceByUrl} = require('../scrapers');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
let mongoClient;

async function getCommonDestinations() {
    if (!mongoClient) {
        mongoClient = new MongoClient(uri);
        await mongoClient.connect();
    }
    const database = mongoClient.db('webscraperDB');
    const collection = database.collection('transport');
    return await collection.find({}).toArray();
}

async function refreshCache(redisClient) {
    console.log('Starting cache refresh task.');

    const options = {timeZone: 'Europe/Ljubljana', year: 'numeric', month: '2-digit', day: '2-digit'};
    const date = new Date().toLocaleDateString('en-CA', options); // Current date in Slovenian time
    const commonDestinations = await getCommonDestinations();

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
                const result = await task.fn(...task.args);
                await redisClient.setEx(task.cacheKey, 3600, JSON.stringify(result));
                console.log(`${task.name} cache updated for ${departure} to ${destination}.`);
            } catch (error) {
                console.error(`Error refreshing cache for ${task.name} - ${departure} to ${destination}:`, error);
            }
        }
    }

    console.log('Cache refresh task completed.');
}

function scheduleCacheRefresh(redisClient) {
    // Runs every 30 minutes
    cron.schedule('*/30 * * * *', () => {
        refreshCache(redisClient);
    });

    // Run once on startup
    refreshCache(redisClient);
}

module.exports = {
    scheduleCacheRefresh,
};