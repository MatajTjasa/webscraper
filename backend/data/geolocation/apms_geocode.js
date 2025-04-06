const axios = require("axios");
const fs = require("fs").promises;

// Naloži seznam postaj (iz .json datoteke, ki si jo naredila prej)
async function loadStations() {
    const data = await fs.readFile("../destinations/apms_destinations.json", "utf-8");
    return JSON.parse(data);
}

// Išči koordinate preko Nominatim
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

// Glavna funkcija
async function run() {
    const stations = await loadStations();
    const geocoded = [];

    for (const station of stations) {
        const result = await geocodeStation(station);
        if (result) geocoded.push(result);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit: 1/s
    }

    await fs.writeFile("apms_geocoded.json", JSON.stringify(geocoded, null, 2), "utf-8");
    console.log(`Shranjeno ${geocoded.length} geolociranih postaj v 'apms_geocoded.json'.`);
}

run();
