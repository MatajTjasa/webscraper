import React, {useState, useEffect, Suspense} from 'react';
import {useLocation} from 'react-router-dom';
import SearchForm from '../components/SearchForm';
import LoadingComponent from '../components/LoadingComponent';
import axios from 'axios';

const ResultsAPMS = React.lazy(() => import('../results/ResultsAPMS'));
const ResultsArriva = React.lazy(() => import('../results/ResultsArriva'));
const ResultsTrains = React.lazy(() => import('../results/ResultsTrains'));
const ResultsPrevozi = React.lazy(() => import('../results/ResultsPrevozi'));

function SearchPage() {
    const [arrivaResults, setArrivaResults] = useState(null);
    const [trainsResults, setTrainsResults] = useState(null);
    const [apmsResults, setApmsResults] = useState(null);
    const [prevoziResults, setPrevoziResults] = useState(null);
    const [loadingArriva, setLoadingArriva] = useState(false);
    const [loadingTrains, setLoadingTrains] = useState(false);
    const [loadingAPMS, setLoadingAPMS] = useState(false);
    const [loadingPrevozi, setLoadingPrevozi] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const departure = queryParams.get('departure');
        const destination = queryParams.get('destination');
        const date = queryParams.get('date');

        setArrivaResults(null);
        setTrainsResults(null);
        setApmsResults(null);
        setPrevoziResults(null);

        if (departure === destination) {
            setErrorMessage('Kraj odhoda in kraj prihoda ne smeta biti enaka.');
            return;
        }

        if (!departure || !destination || !date) {
            setErrorMessage('Prosim izpolnite vsa polja.');
            return;
        }

        setErrorMessage('');

        setLoadingArriva(true);
        setLoadingTrains(true);
        setLoadingAPMS(true);
        setLoadingPrevozi(true);

        fetchPrevoziResults(departure, destination, date);
        fetchArrivaResults(departure, destination, date);
        fetchTrainsResults(departure, destination, date);
        fetchAPMSResults(departure, destination, date);
    }, [location.search]);

    const fetchArrivaResults = async (departure, destination, date) => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/webscraper/searchArrivaByUrl`, {
                departure,
                destination,
                date
            });
            setArrivaResults(response.data);
        } catch (error) {
            console.error('Error fetching Arriva data:', error);
        } finally {
            setLoadingArriva(false);
        }
    };

    const fetchTrainsResults = async (departure, destination, date) => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/webscraper/searchSlovenskeZelezniceByUrl`, {
                departure,
                destination,
                date
            });
            setTrainsResults(response.data);
        } catch (error) {
            console.error('Error fetching Trains data:', error);
        } finally {
            setLoadingTrains(false);
        }
    };

    const fetchAPMSResults = async (departure, destination, date) => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/webscraper/searchAPMSbyUrl`, {
                departure,
                destination,
                date
            });
            setApmsResults(response.data);
        } catch (error) {
            console.error('Error fetching APMS data:', error);
        } finally {
            setLoadingAPMS(false);
        }
    };

    const fetchPrevoziResults = async (departure, destination, date) => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/webscraper/searchPrevoziByUrl`, {
                departure,
                destination,
                date
            });
            setPrevoziResults(response.data);
        } catch (error) {
            console.error('Error fetching Prevozi data:', error);
        } finally {
            setLoadingPrevozi(false);
        }
    };

    return (
        <div>
            <SearchForm
                initialDeparture={new URLSearchParams(location.search).get('departure')}
                initialDestination={new URLSearchParams(location.search).get('destination')}
                initialDate={new URLSearchParams(location.search).get('date')}
                errorMessage={errorMessage}
            />
            {!errorMessage && (
                <div className="results-container mt-8 w-full">
                    <Suspense fallback={<LoadingComponent content="Nalaganje podatkov..."/>}>
                        <ResultsAPMS results={apmsResults} isLoading={loadingAPMS}/>
                        <ResultsArriva results={arrivaResults} isLoading={loadingArriva}/>
                        <ResultsTrains results={trainsResults} isLoading={loadingTrains}/>
                        <ResultsPrevozi results={prevoziResults} isLoading={loadingPrevozi}/>
                    </Suspense>
                </div>
            )}
        </div>
    );
}

export default SearchPage;