const cron = require('node-cron');
const axios = require('axios');
const {checkForChanges} = require('./changeDetector');
const {getCommonDestinations} = require('./database');
require('dotenv').config();

let isTaskRunning = false;

function getSlovenianDateString(offset = 0) {
    const options = {timeZone: 'Europe/Ljubljana', year: 'numeric', month: '2-digit', day: '2-digit'};
    return new Date(Date.now() + offset * 86400000).toLocaleDateString('sl-SI', options).split(' ').join('');
}

function getSlovenianTimeString(date) {
    const options = {timeZone: 'Europe/Ljubljana', hour: '2-digit', minute: '2-digit', second: '2-digit'};
    return new Intl.DateTimeFormat('sl-SI', options).format(date);
}

async function checkArrivaHealth(redisClient, PORT, subscription) {
    const testDate = getSlovenianDateString();
    const commonDestinations = await getCommonDestinations();
    const {departure, destination} = commonDestinations[0];

    const task = {
        name: 'Arriva',
        url: `/webscraper/searchArrivaByUrl`,
        data: {departure, destination, date: testDate}
    };

    try {
        console.log(`Health check for ${task.name} - ${departure} to ${destination} on ${testDate}`);
        const result = await axios.post(`http://localhost:${PORT}${task.url}`, task.data);

        const selectors = [
            'div.connection:not(.connection-header) .connection-inner',
            '.departure-arrival .departure td span',
            '.departure-arrival .arrival td span',
            '.duration .travel-duration span',
            '.duration .prevoznik span',
            '.length',
            '.price'
        ];

        await checkForChanges(result.data, selectors, subscription);

        if (result.data.length === 0) {
            throw new Error(`No data returned from Arriva scraper for ${departure} to ${destination} on ${testDate}`);
        }

        console.log(`${task.name} scraper is working correctly.`);
    } catch (error) {
        console.error(`Health check failed for ${task.name}: ${error.message}`);
        await checkForChanges(null, [], subscription);  // Pass subscription, even on failure
    }
}

async function refreshCacheForDate(redisClient, PORT, date, ttl) {
    console.log(`Starting cache refresh task for ${date}.`);

    const commonDestinations = await getCommonDestinations();

    const tasks = commonDestinations.flatMap(({departure, destination}) => [
        {
            name: 'APMS',
            url: `/webscraper/searchAPMSbyUrl`,
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
            console.error(`Failed to refresh cache for ${task.name} - ${task.data.departure} to ${task.data.destination} on ${date}: ${error.message}`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));  // 1s delay between each task
    }

    console.log(`Cache refresh task completed for ${date}.`);
}

async function getSubscriptions(redisClient) {
    const keys = await redisClient.keys('subscription:*');
    if (keys.length === 0) {
        console.log('No subscriptions found.');
        return [];  // Return an empty array if no subscriptions exist
    }
    const subscriptions = await Promise.all(keys.map(async (key) => {
        const subscription = await redisClient.get(key);
        return JSON.parse(subscription);
    }));
    return subscriptions;
}

async function runSequentially(redisClient, PORT) {
    if (isTaskRunning) {
        console.log('Previous task is still running. Skipping this execution.');
        return;
    }

    try {
        isTaskRunning = true;
        const startTime = Date.now();

        const datesAndTTLs = [
            {offset: 0, ttl: 1800},  // 30 minutes TTL for today
            {offset: 1, ttl: 3600},  // 1 hour TTL for tomorrow
            {offset: 2, ttl: 14400}  // 4 hours TTL for the day after tomorrow
        ];

        const subscriptions = await getSubscriptions(redisClient);

        if (subscriptions.length === 0) {
            console.log("No subscriptions found. Skipping notifications.");
        } else {
            for (const subscription of subscriptions) {
                await checkArrivaHealth(redisClient, PORT, subscription);
            }
        }

        for (const {offset, ttl} of datesAndTTLs) {
            const date = getSlovenianDateString(offset);
            await refreshCacheForDate(redisClient, PORT, date, ttl);
        }

        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000; // duration in seconds
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        console.log(`Cache refresh process completed. Total duration: ${minutes}:${seconds.toString().padStart(2, '0')} minutes. Started at: ${getSlovenianTimeString(new Date(startTime))}, Ended at: ${getSlovenianTimeString(new Date(endTime))}.`);

    } catch (error) {
        console.error('Error occurred during task execution:', error);
    } finally {
        isTaskRunning = false;
    }
}

function scheduleCacheRefresh(redisClient, PORT) {

    cron.schedule('*/30 * * * *', () => {
        console.log('Scheduled task started');
        runSequentially(redisClient, PORT);
    });

    // Initial cache refresh for today, tomorrow, and the day after tomorrow
    runSequentially(redisClient, PORT);
}

module.exports = {
    scheduleCacheRefresh,
};