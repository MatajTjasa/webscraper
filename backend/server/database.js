require('dotenv').config();
const {MongoClient} = require('mongodb');


// Connect to MongoDB
const uri = process.env.MONGODB_URI;
let mongoClient;

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

async function getDestinationsFromDatabase() {
    if (!mongoClient) {
        mongoClient = new MongoClient(uri);
        await mongoClient.connect();
    }
    const collection = database.collection('destinations');
    return await collection.find({}).toArray();
}

async function getCommonDestinations() {
    if (!mongoClient) {
        mongoClient = new MongoClient(uri);
        await mongoClient.connect();
    }
    const collection = database.collection('transport');
    return await collection.find({}).toArray();
}

async function getCodeArriva(locationName) {
    const collection = database.collection('arrivaDestinations');
    const result = await collection.findOne({POS_NAZ: locationName});
    return result ? result.JPOS_IJPP : null;
}

module.exports = {getDestinationsFromDatabase, getCommonDestinations, getCodeArriva};