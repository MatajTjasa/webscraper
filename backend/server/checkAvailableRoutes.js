// Skripta za preverjanje in predpomnjenje relacij za common destinacije
const fs = require('fs');
const {getCommonDestinations, getDestinationsFromDatabase} = require('../server/database');
const {scrapeSlovenskeZelezniceByUrl} = require('../scrapers/slovenske_zeleznice_byUrl');
const {searchWithNearbyGeoLocations, getDestinationCodes, reformatDate} = require('../server/helpers');
require('dotenv').config();

async function checkAvailableRoutes(redisClient, PORT) {
    const commonDestinations = await getCommonDestinations();
    const date = '05.05.2025';
    const results = [];
    const {getDatabase} = require('../server/database');
    const db = getDatabase();
    const allStops = await db.collection('destinationsFlat').find({}).toArray();

    for (const item of commonDestinations) {
        if (!item || !item.locationA || !item.locationB || !item.providers) {
            console.warn('Skipping invalid destination entry:', item);
            continue;
        }

        const {locationA, locationB, providers} = item;
        const entry = {
            locationA,
            locationB,
            checkedCombinations: [],
            providers: {},
            postajalisca: {}
        };

        //  for (const provider of Object.keys(providers).filter(p => p === 'Arriva' || p === 'APMS')) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay to avoid spamming
        /*        if (!providers[provider]) {
                    entry.providers[provider] = false;
                    continue;
                }*/

        try {
            //const transportType = provider === 'Vlak' ? 'Train' : provider;
            const transportType = 'Arriva';
            const departure = locationA;
            const destination = locationB;

            const {findNearbyGeoLocations} = require('../server/helpers');
            const fromStops = await findNearbyGeoLocations(departure, 1, transportType);
            const toStops = await findNearbyGeoLocations(destination, 1, transportType);

            const postajalisca = [];
            let anyTrue = false;

            for (const from of fromStops) {
                for (const to of toStops) {
                    try {
                        const result = await searchWithNearbyGeoLocations(
                            from.Ime,
                            to.Ime,
                            date,
                            transportType,
                            //transportType === 'Train' ? scrapeSlovenskeZelezniceByUrl : provider === 'APMS' ? require('../scrapers/apms_byUrl').scrapeAPMSbyUrl : require('../scrapers/arriva_byUrl').scrapeArrivaByUrl,
                            require('../scrapers/arriva_byUrl').scrapeArrivaByUrl,
                            redisClient
                        );

                        const hasResult = (
                            Array.isArray(result.main) && result.main.length > 0 ||
                            Array.isArray(result.nearbyDepartures) && result.nearbyDepartures.length > 0 ||
                            Array.isArray(result.nearbyDestinations) && result.nearbyDestinations.length > 0
                        );

                        postajalisca.push({from: from.Ime, to: to.Ime, exists: hasResult});
                        if (hasResult) anyTrue = true;
                    } catch (e) {
                        postajalisca.push({from: from.Ime, to: to.Ime, exists: false});
                        console.error(`Error Arriva ${from.Ime} -> ${to.Ime}:`, e.message);
                    }
                }
            }

            entry.providers['Arriva'] = anyTrue;
            entry.postajalisca['Arriva'] = postajalisca;
        } catch (error) {
            console.error(`Check failed for ${'Arriva'} ${locationA} -> ${locationB}:`, error.message);
            entry.providers['Arriva'] = false;
        }
        //}

        results.push(entry);
    }

    fs.writeFileSync('confirmed_common_routes.json', JSON.stringify(results, null, 2), 'utf-8');
    console.log('All route checks written to confirmed_common_routes.json');
}

//module.exports = {checkAvailableRoutes};