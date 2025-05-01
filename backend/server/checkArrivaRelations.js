const {getDatabase} = require('../server/database');
const {scrapeArrivaByUrl} = require('../scrapers/arriva_byUrl');
require('dotenv').config();

const collectionName = 'arrivaRelationsCheck';
const destinationsCollection = 'destinations';
const testDate = '2025-05-05';
const BATCH_DELAY = 2000; // ms

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function relationAlreadyChecked(db, name1, name2) {
    return await db.collection(collectionName).findOne({
        $or: [
            {destination1: name1, destination2: name2},
            {destination1: name2, destination2: name1},
        ]
    });
}

async function checkArrivaRelations() {
    const db = await getDatabase();
    const destinations = await db.collection(destinationsCollection).find({}).toArray();

    const arrivaSet = new Set();
    destinations.forEach(dest => {
        if (dest.Arriva) arrivaSet.add(dest.Kraj);
        (dest.Postaje || []).forEach(p => {
            if (p.Arriva) arrivaSet.add(p.Ime);
        });
    });

    const allStations = Array.from(arrivaSet);

    for (let i = 0; i < allStations.length; i++) {
        for (let j = i + 1; j < allStations.length; j++) {
            const a = allStations[i];
            const b = allStations[j];

            const existing = await relationAlreadyChecked(db, a, b);
            if (existing) continue;

            console.log(`Checking: ${a} ⇄ ${b}`);
            let relationExists = false;
            try {
                const results = await scrapeArrivaByUrl(a, b, testDate);
                relationExists = results.length > 0;
            } catch (err) {
                console.error(`Error checking ${a} ⇄ ${b}:`, err.message);
            }

            await db.collection(collectionName).insertOne({
                destination1: a,
                destination2: b,
                relationExists
            });

            console.log(`Saved: ${a} ⇄ ${b} | exists: ${relationExists}`);
            await sleep(BATCH_DELAY);
        }
    }

    console.log('Done checking all Arriva relations.');
}

module.exports = {checkArrivaRelations};