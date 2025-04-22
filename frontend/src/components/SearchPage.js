import React, {useState, useEffect, Suspense, useContext} from 'react';
import {useLocation} from 'react-router-dom';
import SearchForm from '../components/SearchForm';
import LoadingComponent from '../components/LoadingComponent';
import NearbyStations from '../components/NearbyStations';
import {DestinationsContext} from '../context/DestinationsContext';
import axios from 'axios';

const ResultsAPMS = React.lazy(() => import('../results/ResultsAPMS'));
const ResultsArriva = React.lazy(() => import('../results/ResultsArriva'));
const ResultsTrains = React.lazy(() => import('../results/ResultsTrains'));
const ResultsPrevozi = React.lazy(() => import('../results/ResultsPrevozi'));

function SearchPage() {
    const {destinations, loading, error} = useContext(DestinationsContext);
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
    const queryParams = new URLSearchParams(location.search);
    const departure = queryParams.get('departure');
    const destination = queryParams.get('destination');
    const selectedDeparture = destinations.find(dest => dest.Kraj.toLowerCase() === departure?.toLowerCase());
    const selectedDestination = destinations.find(dest => dest.Kraj.toLowerCase() === destination?.toLowerCase());

    useEffect(() => {
        if (loading || destinations.length === 0 || error) return;

        const queryParams = new URLSearchParams(location.search);
        const departure = queryParams.get('departure');
        const destination = queryParams.get('destination');
        const date = queryParams.get('date');

        setArrivaResults(null);
        setTrainsResults(null);
        setApmsResults(null);
        setPrevoziResults(null);

        if (!departure || !destination || !date) {
            setErrorMessage('Prosim izpolnite vsa polja.');
            return;
        }

        if (departure === destination) {
            setErrorMessage('Kraj odhoda in kraj prihoda ne smeta biti enaka.');
            return;
        }

        const validDeparture = destinations.some(dest =>
            dest.Kraj.toLowerCase() === departure.toLowerCase() ||
            (dest.Postaje || []).some(postaja => postaja.Ime.toLowerCase() === departure.toLowerCase())
        );

        const validDestination = destinations.some(dest =>
            dest.Kraj.toLowerCase() === destination.toLowerCase() ||
            (dest.Postaje || []).some(postaja => postaja.Ime.toLowerCase() === destination.toLowerCase())
        );

        if (!validDeparture || !validDestination) {
            setErrorMessage('Neveljavna destinacija. Prosim izberi veljavno destinacijo.');
            return;
        }

        setErrorMessage('');
        setLoadingArriva(true);
        setLoadingTrains(true);
        setLoadingAPMS(true);
        setLoadingPrevozi(true);

        fetchTrainsResults(departure, destination, date);
        fetchAPMSResults(departure, destination, date);
        fetchArrivaResults(departure, destination, date);
        fetchPrevoziResults(departure, destination, date);
    }, [location.search, destinations, loading, error]);

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
                errorMessage={errorMessage || error}
            />

            {/*            {selectedDeparture && (
                <NearbyStations destination={selectedDeparture} label="🧭 Možnosti v bližini kraja odhoda:"/>
            )}

            {selectedDestination && (
                <NearbyStations destination={selectedDestination} label="🧭 Možnosti v bližini kraja prihoda:"/>
            )}*/}

            {!errorMessage && (
                <div className="results-container mt-8 w-full px-4 sm:px-0">
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