import React, {useState, useEffect} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import SearchForm from './SearchForm';
import Results from './Results';
import axios from 'axios';

console.log("Starting on search")
function SearchPage() {
    const [results, setResults] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const departure = queryParams.get('departure');
        const destination = queryParams.get('destination');
        const date = queryParams.get('date');

        if (departure && destination && date) {
            fetchResults(departure, destination, date);
        }
    }, [location.search]);

    const fetchResults = async (departure, destination, date) => {
        try {
            const response = await axios.post('http://localhost:3000/webscraper/searchAll', {
                departure,
                destination,
                date
            });
            setResults(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleSearch = (departure, destination, date) => {
        navigate(`/search?departure=${departure}&destination=${destination}&date=${date}`);
    };

    return (
        <div>
            <SearchForm onSearch={handleSearch}/>
            {results && <Results results={results}/>}
        </div>
    );
}

export default SearchPage;
