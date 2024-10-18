const axios = require('axios');

// TODO: add a solution with cheerio here and move fetchPrevozi elsewhere?
async function fetchPrevozi(departure, destination, date) {
    try {
        // API URL
        const url = `https://prevoz.org/api/rides?from=${encodeURIComponent(departure)}&to=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}`;
        console.log("Prevozi URL:", url);

        const response = await axios.get(url);

        if (!response.data || response.data.length === 0) {
            console.log("No ride shares found.");
            return [];
        }

        // Formatting
        const rideShares = response.data.map((ride, index) => ({
            id: index + 1,
            from: ride.from,
            to: ride.to,
            time: ride.time,
            description: ride.description,
            price: ride.price,
        }));

        console.log(rideShares);
        return rideShares;

    } catch (error) {
        console.error('Error fetching ride shares:', error);
        return [];
    }
}

// Example usage
// fetchPrevozi('Ljubljana', 'Maribor', '2024-08-04').catch(err => console.error('Error:', err));

module.exports = {fetchPrevozi};