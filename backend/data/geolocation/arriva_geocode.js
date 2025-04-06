// geocode_arriva.js

const axios = require("axios");
const fs = require("fs").promises;

const file = "../destinations/arrivaDestinations.json";

async function loadStations() {
    const data = await fs.readFile(file, "utf-8");
    const json = JSON.parse(data);

    const list = json[0]?.DepartureStations;

    if (!Array.isArray(list)) {
        throw new Error("Ne najdem pravilnega seznama postaj v datoteki!");
    }

    return list.map(st => st.POS_NAZ);
}


async function geocodeStation(station) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(station + ', Slovenia')}&format=json&limit=1`;
    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "diploma-transportni-sistem/1.0 (kontakt@example.com)"
            }
        });
        const result = response.data[0];
        if (!result) return null;
        return {
            ime: station,
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon)
        };
    } catch (err) {
        console.error(`Napaka za "${station}":`, err.message);
        return null;
    }
}

async function run() {
    const stations = await loadStations();
    const geocoded = [];

    for (const station of stations) {
        const result = await geocodeStation(station);
        if (result) geocoded.push(result);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await fs.writeFile("arriva_geocoded.json", JSON.stringify(geocoded, null, 2), "utf-8");
    console.log(`Shranjeno ${geocoded.length} postaj v 'arriva_geocoded.json'.`);
}

run();
