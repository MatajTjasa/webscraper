const {MongoClient} = require('mongodb');
const cron = require('node-cron');
const axios = require('axios'); // Add Axios to make HTTP requests
const redis = require('redis');

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

async function refreshCache(redisClient, PORT) {
    console.log('Starting cache refresh task.');

    const options = {timeZone: 'Europe/Ljubljana', year: 'numeric', month: '2-digit', day: '2-digit'};
    const date = new Date().toLocaleDateString('sl-SI', options).split(' ').join(''); // DD.MM.YYYY
    const commonDestinations = await getCommonDestinations();

    for (const {departure, destination} of commonDestinations) {
        const tasks = [
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
        ];

        for (const task of tasks) {
            try {
                console.log(`Refreshing cache for ${task.name} - ${departure} to ${destination}`);

                const result = await axios.post(`http://localhost:${PORT}${task.url}`, task.data);

                await redisClient.setEx(task.cacheKey, 1800, JSON.stringify(result.data));
                console.log(`${task.name} cache updated for ${departure} to ${destination}.`);
            } catch (error) {
                console.error(`Error refreshing cache for ${task.name} - ${departure} to ${destination}:`, error);
            }
        }
    }

    console.log('Cache refresh task completed.');
}

function scheduleCacheRefresh(redisClient, PORT) {
    // Runs every 30 minutes
    cron.schedule('*/30 * * * *', () => {
        refreshCache(redisClient, PORT);
    });

    // Run once on startup
    refreshCache(redisClient, PORT);
}

module.exports = {
    scheduleCacheRefresh,
};

/*async function refreshCache() {
    console.log('Starting cache refresh task.');
    const db = mongoClient.db('webscraperDB');
    const commonDestinations = await db.collection('transport').find({}).toArray();

    const options = {timeZone: 'Europe/Ljubljana', year: 'numeric', month: '2-digit', day: '2-digit'};
    const date = new Date().toLocaleDateString('sl-SI', options); // DD.MM.YYYY
    // console.log('Today: ' + date);
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
cron.schedule('*!/30 * * * *', () => {
    refreshCache();
});
refreshCache();*/
