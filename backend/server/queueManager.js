const Queue = require('bull');
const {scrapeAPMS} = require('../scrapers/apms');
const {scrapeArrivaByUrl} = require('../scrapers/arriva_byUrl');
const {scrapePrevoziByUrl} = require('../scrapers/prevozi_byUrl');
const {scrapeSlovenskeZelezniceByUrl} = require('../scrapers/slovenske_zeleznice_byUrl');
const {retry} = require('./helpers');

const apmsQueue = new Queue('APMS Queue');
const arrivaQueue = new Queue('Arriva Queue');
const prevoziQueue = new Queue('Prevozi Queue');
const trainQueue = new Queue('Train Queue');

apmsQueue.process(async (job) => {
    return await retry(scrapeAPMS)(job.data.departure, job.data.destination, job.data.date);
});

arrivaQueue.process(async (job) => {
    return await retry(scrapeArrivaByUrl)(job.data.departure, job.data.destination, job.data.date);
});

prevoziQueue.process(async (job) => {
    return await retry(scrapePrevoziByUrl)(job.data.departure, job.data.destination, job.data.date);
});

trainQueue.process(async (job) => {
    return await retry(scrapeSlovenskeZelezniceByUrl)(job.data.departure, job.data.destination, job.data.date);
});

const addJobToQueue = async (queue, jobData) => {
    return await queue.add(jobData, {attempts: 3, backoff: 5000});
};
/*function addJobToQueue(queue, jobData) {
    return new Promise((resolve, reject) => {
        queue.add(jobData)
            .then(job => {
                job.finished().then(result => {
                    resolve(result);
                }).catch(err => reject(err));
            })
            .catch(err => reject(err));
    });
}*/

module.exports = {
    apmsQueue,
    arrivaQueue,
    prevoziQueue,
    trainQueue,
    addJobToQueue
};