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

async function getSelectors(name) {
    if (!mongoClient) {
        mongoClient = new MongoClient(uri);
        await mongoClient.connect();
    }

    const collection = database.collection('selectors');

    const result = await collection.findOne({name: name});

    if (result) {
        return result.selectors;
    } else {
        throw new Error(`No selectors found for the name: ${name}`);
    }
}

async function selectorsChanged(name) {
    if (!mongoClient) {
        mongoClient = new MongoClient(uri);
        await mongoClient.connect();
    }

    const collection = database.collection('selectors');

    const result = await collection.updateOne(
        {name: name},
        {$set: {changed: true}}
    );

    if (result.matchedCount === 0) {
        throw new Error(`No selectors found for the name: ${name}`);
    } else if (result.modifiedCount === 0) {
        throw new Error(`Failed to update the 'changed' field for ${name}`);
    } else {
        console.log(`'changed' field set to true for ${name}`);
        return result;
    }
}

async function checkDbChanged(name) {
    if (!mongoClient) {
        mongoClient = new MongoClient(uri);
        await mongoClient.connect();
    }

    const collection = database.collection('selectors');

    const result = await collection.findOne(
        {name: name},
        {projection: {changed: 1, _id: 0}}
    );

    if (result) {
        return result.changed;
    } else {
        return false;
    }
}

module.exports = {
    getDestinationsFromDatabase,
    getCommonDestinations,
    getCodeArriva,
    getSelectors,
    selectorsChanged,
    checkDbChanged
};