const {MongoClient} = require('mongodb');
const cron = require('node-cron');
const axios = require('axios');

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

function getSlovenianDateString(offset = 0) {
    const options = {timeZone: 'Europe/Ljubljana', year: 'numeric', month: '2-digit', day: '2-digit'};
    return new Date(Date.now() + offset * 86400000).toLocaleDateString('sl-SI', options).split(' ').join('');
}

async function refreshCacheForDate(redisClient, PORT, date, ttl) {
    console.log(`Starting cache refresh task for ${date}.`);

    const commonDestinations = await getCommonDestinations();

    const tasks = commonDestinations.flatMap(({departure, destination}) => [
        {
            name: 'APMS',
            url: `/webscraper/searchAPMS`,
            cacheKey: `APMS-${departure}-${destination}-${date}`,
            data: {departure, destination, date}
        },
        {
            name: 'Arriva',
            url: `/webscraper/searchArrivaByUrl`,
            cacheKey: `ArrivaByUrl-${departure}-${destination}-${date}`,
            data: {departure, destination, date}
        },
        {
            name: 'Train',
            url: `/webscraper/searchSlovenskeZelezniceByUrl`,
            cacheKey: `Train-${departure}-${destination}-${date}`,
            data: {departure, destination, date}
        },
        {
            name: 'Prevozi',
            url: `/webscraper/searchPrevoziByUrl`,
            cacheKey: `PrevoziByUrl-${departure}-${destination}-${date}`,
            data: {departure, destination, date}
        }
    ]);

    for (const task of tasks) {
        try {
            console.log(`Refreshing cache for ${task.name} - ${task.data.departure} to ${task.data.destination} on ${date}`);

            const result = await axios.post(`http://localhost:${PORT}${task.url}`, task.data);
            await redisClient.setEx(task.cacheKey, ttl, JSON.stringify(result.data));

            console.log(`${task.name} cache updated for ${task.data.departure} to ${task.data.destination} on ${date}.`);
        } catch (error) {
            console.error(`Error refreshing cache for ${task.name} - ${task.data.departure} to ${task.data.destination} on ${date}:`, error);
        }
    }

    console.log(`Cache refresh task completed for ${date}.`);
}

function scheduleCacheRefresh(redisClient, PORT) {
    const timeIntervals = [
        {interval: '*/30 * * * *', offset: 0, ttl: 1800},  // 30 minutes TTL (time to live) for today
        {interval: '0 * * * *', offset: 1, ttl: 3600},      // 1 hour TTL for tomorrow
        {interval: '0 */4 * * *', offset: 2, ttl: 14400}    // 4 hours TTL for the day after tomorrow
    ];

    for (const {interval, offset, ttl} of timeIntervals) {
        cron.schedule(interval, () => {
            const date = getSlovenianDateString(offset);
            refreshCacheForDate(redisClient, PORT, date, ttl);
        });
    }

    // Initial cache refresh for today, tomorrow, and the day after tomorrow
    timeIntervals.forEach(({offset, ttl}) => {
        refreshCacheForDate(redisClient, PORT, getSlovenianDateString(offset), ttl);
    });
}

module.exports = {
    scheduleCacheRefresh,
};