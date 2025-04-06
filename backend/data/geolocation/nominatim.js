const axios = require("axios");
const fs = require("fs").promises;

const kraji = ["Maribor", "Ljubljana", "Celje", "Kranj", "Novo mesto"];
const results = {};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchData() {
    for (const kraj of kraji) {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(kraj)}&format=json&addressdetails=1&countrycodes=si&limit=10`;

        try {
            const response = await axios.get(url, {
                headers: {
                    "User-Agent": "diploma-transportni-sistem/1.0 (kontakt@example.com)"
                }
            });

            results[kraj] = response.data;
        } catch (err) {
            console.error(`Napaka za kraj "${kraj}":`, err.message);
            results[kraj] = [];
        }

        await delay(1000); //(1 req/s)
    }

    await fs.writeFile("nominatim_results.json", JSON.stringify(results, null, 2), "utf-8");
    console.log("Shranjeno v nominatim_results.json");
}

fetchData();
