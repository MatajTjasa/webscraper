const cron = require('node-cron');
const axios = require('axios');
const {getCommonDestinations} = require('../server/database');
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

async function refreshCacheForDate(redisClient, PORT, date, ttl) {
    console.log(`Starting cache refresh task for ${date}.`);

    const commonDestinations = await getCommonDestinations();

    const tasks = commonDestinations.flatMap(({locationA, locationB, providers}) => {
        const taskList = [];

        if (providers?.APMS) {
            taskList.push({
                name: 'APMS',
                url: `/webscraper/searchAPMSbyUrl`,
                cacheKey: `APMS-${locationA}-${locationB}-${date}`,
                data: {departure: locationA, destination: locationB, date}
            });
        }

        if (providers?.Arriva) {
            taskList.push({
                name: 'Arriva',
                url: `/webscraper/searchArrivaByUrl`,
                cacheKey: `Arriva-${locationA}-${locationB}-${date}`,
                data: {departure: locationA, destination: locationB, date}
            });
        }

        if (providers?.Vlak) {
            taskList.push({
                name: 'Train',
                url: `/webscraper/searchSlovenskeZelezniceByUrlByUrl`,
                cacheKey: `Train-${locationA}-${locationB}-${date}`,
                data: {departure: locationA, destination: locationB, date}
            });
        }

        return taskList;
    });

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

async function runSequentially(redisClient, PORT) {
    if (isTaskRunning) {
        console.log('Previous task is still running. Skipping this execution.');
        return;
    }

    try {
        isTaskRunning = true;
        const startTime = Date.now();

        const datesAndTTLs = [
            // TODO change to 1 day & 2 days
            {offset: 0, ttl: 120},  // 30 minutes TTL for today
            {offset: 1, ttl: 240}  // 1 hour TTL for tomorrow
        ];

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

    cron.schedule('*/5 * * * *', () => {
        console.log('Scheduled task started');
        runSequentially(redisClient, PORT);
    });

    // Initial cache refresh for today and tomorrow
    runSequentially(redisClient, PORT);
}

module.exports = {
    scheduleCacheRefresh,
};