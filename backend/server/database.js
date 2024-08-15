const {MongoClient} = require('mongodb');


// Connect to MongoDB
const uri = process.env.MONGODB_URI;
let mongoClient;

if (!uri) {
    console.error('MongoDB URI is not defined. Check your environment variables.');
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

async function getDestinationsFromDatabase() {
    if (!mongoClient) {
        mongoClient = new MongoClient(uri);
        await mongoClient.connect();
    }
    const database = mongoClient.db('webscraperDB');
    const collection = database.collection('destinations');
    return await collection.find({}).toArray();
}

async function getCommonDestinations() {
    if (!mongoClient) {
        mongoClient = new MongoClient(uri);
        await mongoClient.connect();
    }
    const database = mongoClient.db('webscraperDB');
    const collection = database.collection('transport');
    return await collection.find({}).toArray();
}

module.exports = {getDestinationsFromDatabase, getCommonDestinations};