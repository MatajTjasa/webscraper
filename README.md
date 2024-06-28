# webscraper

Slovenian Transport Web Scraper

## Overview

This project is a web scraper designed to collect transportation data from various Slovenian transportation websites: [Arriva](https://arriva.si), [APMS](https://www.apms.si), [Prevozi](https://prevoz.org) and [Slovenske železnice](https://potniski.sz.si). It uses Puppeteer for scraping and Redis for caching the scraped data.

## Features

- Scrapes transportation data from different Slovenian transport services.
- Caches scraped data using Redis to reduce the load on the target websites.
- Provides an API to fetch the transportation data.

# Features in the making
- Friendly GUI using React
- Scheduler that monitors and handles DOM changes 

## Technologies Used

- Node.js
- Puppeteer
- Cheerio
- Redis
- React

## Getting Started

### Prerequisites for developers

- Node.js and npm installed
- Redis installed and running
- A Redis server URL (for example, from Render or any other Redis provider)
- WSL2 (Windows Subsystem for Linux) installed if you are running on Windows

### Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/MatajTjasa/webscraper.git
    cd webscraper
    ```

2. Install the dependencies:

    ```sh
    npm install
    ```

3. Configure Redis:

    - Make sure your Redis server is running and accessible.
    - Update the Redis connection URL in `index.js` with your Redis server details.

    ```javascript
    const redisClient = redis.createClient({
        url: 'your-redis-url'
    });
    ```

4. Start the server:

    ```sh
    node index.js
    ```

## Usage

### API Endpoints

#### `POST /webscraper/searchAPMS`

Fetches transportation data from the APMS service.

- **Request Body:**

    ```json
    {
        "date": "30.06.2024",
        "departure": "Ljubljana",
        "destination": "Maribor"
    }
    ```

- **Response:**

    ```json
    [
        {
            "departureStation": "Ljubljana",
            "departureTime": "05:00",
            "arrivalStation": "Maribor",
            "arrivalTime": "07:16",
            "travelTime": "02:16",
            "trainType": "IC 311"
        }
    ]
    ```

#### `POST /webscraper/searchArriva`

Fetches transportation data from the Arriva service.

- **Request Body:**

    ```json
    {
        "date": "30.06.2024",
        "departure": "Ljubljana",
        "destination": "Maribor"
    }
    ```

- **Response:**

    ```json
    [
        {
            "departureStation": "Ljubljana",
            "departureTime": "06:00",
            "arrivalStation": "Maribor",
            "arrivalTime": "08:00",
            "travelTime": "02:00",
            "busType": "Arriva"
        }
    ]
    ```

#### `POST /webscraper/searchSlovenskeZeleznice`

Fetches transportation data from Slovenske železnice.

- **Request Body:**

    ```json
    {
        "date": "30.06.2024",
        "departure": "Ljubljana",
        "destination": "Maribor"
    }
    ```

- **Response:**

    ```json
    [
        {
            "departureStation": "Ljubljana",
            "departureTime": "07:00",
            "arrivalStation": "Maribor",
            "arrivalTime": "09:30",
            "travelTime": "02:30",
            "trainType": "RG 1604"
        }
    ]
    ```

#### `POST /webscraper/searchSlovenskeZelezniceByUrl`

Fetches transportation data from Slovenske železnice using a specific URL.

- **Request Body:**

    ```json
    {
        "date": "30.06.2024",
        "departure": "Ljubljana",
        "destination": "Maribor"
    }
    ```

- **Response:**

    ```json
    [
        {
            "departureStation": "Ljubljana",
            "departureTime": "08:00",
            "arrivalStation": "Maribor",
            "arrivalTime": "10:30",
            "travelTime": "02:30",
            "trainType": "IC 210"
        }
    ]
    ```

## Directory Structure

    /data: Contains JSON files with scraped data.
    /scrapers: Contains the scraper scripts for different services.
    /server: Contains the Express server code.
  
