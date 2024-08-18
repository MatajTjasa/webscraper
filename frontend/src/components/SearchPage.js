import React, {useState, useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import SearchForm from '../components/SearchForm';
import ResultsArriva from '../results/ResultsArriva';
import ResultsTrains from '../results/ResultsTrains';
import ResultsAPMS from '../results/ResultsAPMS';
import ResultsPrevozi from '../results/ResultsPrevozi';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL;

function SearchPage() {
    const [arrivaResults, setArrivaResults] = useState(null);
    const [trainsResults, setTrainsResults] = useState(null);
    const [apmsResults, setApmsResults] = useState(null);
    const [prevoziResults, setPrevoziResults] = useState(null);
    const [loadingArriva, setLoadingArriva] = useState(true);
    const [loadingTrains, setLoadingTrains] = useState(true);
    const [loadingAPMS, setLoadingAPMS] = useState(true);
    const [loadingPrevozi, setLoadingPrevozi] = useState(true);

    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const departure = queryParams.get('departure');
        const destination = queryParams.get('destination');
        const date = queryParams.get('date');

        // Reset loading states
        setLoadingArriva(true);
        setLoadingTrains(true);
        setLoadingAPMS(true);
        setLoadingPrevozi(true);

        // Reset results
        setArrivaResults(null);
        setTrainsResults(null);
        setApmsResults(null);
        setPrevoziResults(null);

        if (departure && destination && date) {
            fetchPrevoziResults(departure, destination, date);
            fetchArrivaResults(departure, destination, date);
            fetchTrainsResults(departure, destination, date);
            fetchAPMSResults(departure, destination, date);
        }
    }, [location.search]);

    const fetchArrivaResults = async (departure, destination, date) => {
        try {
            const response = await axios.post('/webscraper/searchArrivaByUrl', {
                departure,
                destination,
                date
            });
            setArrivaResults(response.data);
            setLoadingArriva(false);
        } catch (error) {
            console.error('Error fetching Arriva data:', error);
            setLoadingArriva(false);
        }
    };

    const fetchTrainsResults = async (departure, destination, date) => {
        try {
            const response = await axios.post('/webscraper/searchSlovenskeZelezniceByUrl', {
                departure,
                destination,
                date
            });
            setTrainsResults(response.data);
            setLoadingTrains(false);
        } catch (error) {
            console.error('Error fetching Trains data:', error);
            setLoadingTrains(false);
        }
    };

    const fetchAPMSResults = async (departure, destination, date) => {
        try {
            const response = await axios.post('/webscraper/searchAPMS', {
                departure,
                destination,
                date
            });
            setApmsResults(response.data);
            setLoadingAPMS(false);
        } catch (error) {
            console.error('Error fetching APMS data:', error);
            setLoadingAPMS(false);
        }
    };

    const fetchPrevoziResults = async (departure, destination, date) => {
        try {
            const response = await axios.post('/webscraper/searchPrevoziByUrl', {
                departure,
                destination,
                date
            });
            setPrevoziResults(response.data);
            setLoadingPrevozi(false);
        } catch (error) {
            console.error('Error fetching Prevozi data:', error);
            setLoadingPrevozi(false);
        }
    };

    return (
        <div>
            <SearchForm/>
            <div className="results-container mt-8 w-full">

                <ResultsAPMS results={apmsResults} isLoading={loadingAPMS}/>

                <ResultsArriva results={arrivaResults} isLoading={loadingArriva}/>

                <ResultsTrains results={trainsResults} isLoading={loadingTrains}/>

                <ResultsPrevozi results={prevoziResults} isLoading={loadingPrevozi}/>
            </div>
        </div>
    );
}

export default SearchPage;