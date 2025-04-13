require('dotenv').config({path: '../.env'});
const fs = require('fs');
const path = require('path');
const {MongoClient} = require('mongodb');

const uri = process.env.MONGODB_URI;
const jsonPath = path.join(__dirname, '../data/destinations/slovenia_destinations.json');

if (!uri) {
    console.error('❌ MongoDB URI not set');
    process.exit(1);
}

async function run() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log("✅ Connected to MongoDB");

        const db = client.db('webscraperDB');
        const collection = db.collection('destinations');

        const raw = fs.readFileSync(jsonPath, 'utf-8');
        const data = JSON.parse(raw);

        const dataWithIds = data.map((doc, index) => ({
            _id: index + 1,
            ...doc,
        }));

        await collection.deleteMany({});
        await collection.insertMany(dataWithIds);

        console.log(`✅ Imported ${dataWithIds.length} destinations`);
    } catch (err) {
        console.error('❌ MongoDB import failed:', err);
    } finally {
        await client.close();
    }
}

run();
