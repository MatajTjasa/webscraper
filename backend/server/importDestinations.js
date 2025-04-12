require('dotenv').config();
const fs = require('fs');
const {MongoClient} = require('mongodb');

// Connect to MongoDB
const uri = process.env.MONGODB_URI;
let mongoClient;
const jsonPath = '../data/destinations/slovenian_destinations.json';


if (!uri) {
    return console.error('MongoDB URI is not defined. Check your environment variables.');
} else {
    async function main() {
        mongoClient = new MongoClient(uri);
        try {
            await mongoClient.connect();
            console.log("Connected to MongoDB");
        } catch (e) {
            console.error('MongoDB connection error:', e);
        }
    }

    main().catch(console.error);
}
const database = mongoClient.db('webscraperDB');


async function run() {
    try {
        if (!mongoClient) {
            mongoClient = new MongoClient(uri);
            await mongoClient.connect();
        }
        const collection = database.collection('destinations');
        //return await collection.find({}).toArray();

        const rawData = fs.readFileSync(jsonPath, 'utf-8');
        const data = JSON.parse(rawData);

        // Sequential ids
        const dataWithIds = data.map((doc, index) => ({
            _id: index + 1,
            ...doc
        }));

        await collection.deleteMany({});
        await collection.insertMany(dataWithIds);

        console.log(`✅ Imported ${dataWithIds.length} destinations.`);
    } catch (err) {
        console.error('❌ Error importing destinations:', err);
    } finally {
        await client.close();
    }
}

run();
