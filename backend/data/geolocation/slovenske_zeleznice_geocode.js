const fs = require("fs").promises;
const axios = require("axios");

const file = "../destinations/slovenske_zeleznice_destinations.json";

async function loadStations() {
    const data = await fs.readFile(file, "utf-8");
    const json = JSON.parse(data);

    return json.map(st => ({
        id: st.value,
        name: st.text
    }));
}

async function geocodeStation(station) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(station.name + ', Slovenia')}&format=json&limit=1`;

    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "diploma-transportni-sistem/1.0 (kontakt@example.com)"
            }
        });

        const result = response.data[0];
        if (!result) return null;

        return {
            id: station.id,
            ime: station.name,
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon)
        };
    } catch (err) {
        console.error(`Napaka za "${station.name}":`, err.message);
        return null;
    }
}

async function run() {
    const stations = await loadStations();
    const geocoded = [];

    for (const station of stations) {
        const result = await geocodeStation(station);
        if (result) geocoded.push(result);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 req/s
    }

    await fs.writeFile("train_geocoded.json", JSON.stringify(geocoded, null, 2), "utf-8");
    console.log(`Shranjeno ${geocoded.length} vlak postaj v 'train_geocoded.json'.`);
}

run();
