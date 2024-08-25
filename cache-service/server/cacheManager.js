const cron = require('node-cron');
const axios = require('axios');
const {getCommonDestinations} = require('./database');

let isTaskRunning = false;
let heartbeatInterval = null;

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

        await new Promise(resolve => setTimeout(resolve, 1000 * 15));  // 15s delay between each task
    }

    console.log(`Cache refresh task completed for ${date}.`);
}

function startHeartbeat() {
    heartbeatInterval = setInterval(() => {
        console.log('Heartbeat pulse');
    }, 60000);
}

function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
}

async function runSequentially(redisClient, PORT) {
    if (isTaskRunning) {
        console.log('Previous task is still running. Skipping this execution.');
        return;
    }

    stopHeartbeat();
    isTaskRunning = true;
    const startTime = Date.now();

    const datesAndTTLs = [
        {offset: 0, ttl: 1800},  // 30 minutes TTL for today
        {offset: 1, ttl: 3600},  // 1 hour TTL for tomorrow
        {offset: 2, ttl: 14400}  // 4 hours TTL for the day after tomorrow
    ];

    for (const {offset, ttl} of datesAndTTLs) {
        const date = getSlovenianDateString(offset);
        await refreshCacheForDate(redisClient, PORT, date, ttl);
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // duration in seconds
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    console.log(`Cache refresh process completed. Total duration: ${minutes}:${seconds.toString().padStart(2, '0')} minutes. Started at: ${new Date(startTime).toLocaleTimeString()}, Ended at: ${new Date(endTime).toLocaleTimeString()}.`);

    isTaskRunning = false;
    startHeartbeat();
}

function scheduleCacheRefresh(redisClient, PORT) {

    startHeartbeat();

    // Schedule the refresh to run at specific intervals
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