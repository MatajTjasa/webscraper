const axios = require('axios');
const cheerio = require('cheerio');

async function fetchPrevozi(departure, destination, date) {
    try {
        //URL
        const url = `https://prevoz.org/prevoz/list/?fc=SI&f=${encodeURIComponent(departure)}&tc=SI&t=${encodeURIComponent(destination)}&d=${encodeURIComponent(date)}`;
        console.log("Prevozi URL:", url);

        const response = await axios.get(url);

        if (!response.data) {
            console.log("No data returned from the request.");
            return [];
        }

        const $ = cheerio.load(response.data);
        const rideShares = [];

        $('.card').each((index, card) => {
            const $card = $(card);

            const cardBody = $card.find('.card-body');
            if (cardBody.text().includes('Noben prevoz ne ustreza iskalnim pogojem')) {
                console.log('No rides available.');
                return; // Skip this card
            }

            const from = $card.find('.d-flex.fw-bolden.h4.m-0 span:first-child').text().trim();
            const to = $card.find('.d-flex.fw-bolden.h4.m-0 span:last-child').text().trim();

            const trips = [];
            $card.find('.list-group-item.carshare-overview').each((_, item) => {
                const $item = $(item);

                const time = $item.find('.link-body').text().trim();
                const description = $item.find('.description.small').text().trim();
                const price = $item.find('.options .item span.h5.fw-bold.m-0').text().trim();

                if (time) {
                    trips.push({time, description, price});
                }
            });

            if (trips.length > 0) {
                rideShares.push({from, to, trips});
            }
        });

        console.log(rideShares);
        return rideShares;
    } catch (error) {
        console.error('Error fetching prevozi:', error);
        return [];
    }
}

// Example usage
//fetchPrevozi('Ljubljana', 'Maribor', '2025-01-14').catch(err => console.error('Error:', err));

module.exports = {fetchPrevozi};
