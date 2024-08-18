import React, {useState, useEffect, useRef} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import axios from 'axios';

function SearchForm({onSearch, initialDeparture, initialDestination, initialDate}) {
    const API = process.env.REACT_APP_API_URL;
    const location = useLocation();
    const [departure, setDeparture] = useState(initialDeparture || '');
    const [destination, setDestination] = useState(initialDestination || '');
    const [date, setDate] = useState('');
    const [destinations, setDestinations] = useState([]);
    const [departureDropdownActive, setDepartureDropdownActive] = useState(false);
    const [destinationDropdownActive, setDestinationDropdownActive] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const navigate = useNavigate();
    const departureRef = useRef(null);
    const destinationRef = useRef(null);

    // Fetch destinations on component mount
    useEffect(() => {
        const fetchDestinations = async () => {
            try {
                const response = await axios.get('/webscraper/destinations');
                setDestinations(response.data);
            } catch (error) {
                if (error.response && error.response.status === 429) {
                    setErrorMessage('Ups, preveč zahtev! Počakaj malo in poskusi znova.');
                } else {
                    console.error('Error fetching destinations:', error);
                    setErrorMessage('Nekaj je šlo narobe pri iskanju destinacij. Poskusi znova kasneje.');
                }
            }
        };
        fetchDestinations();
    }, []);

    // Handle click outside of dropdowns to close them
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (departureRef.current && !departureRef.current.contains(event.target)) {
                setDepartureDropdownActive(false);
            }
            if (destinationRef.current && !destinationRef.current.contains(event.target)) {
                setDestinationDropdownActive(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [departureRef, destinationRef]);

    // Populate fields based on URL parameters
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const urlDeparture = queryParams.get('departure');
        const urlDestination = queryParams.get('destination');
        const urlDate = queryParams.get('date');

        if (urlDeparture) setDeparture(urlDeparture);
        if (urlDestination) setDestination(urlDestination);
        if (urlDate) {
            setDate(urlDate);
        } else {
            // Set default date if not provided in URL
            const options = {timeZone: 'Europe/Ljubljana', year: 'numeric', month: '2-digit', day: '2-digit'};
            const slovenianTime = new Intl.DateTimeFormat('en-GB', options).format(new Date());
            const [day, month, year] = slovenianTime.split('/');
            setDate(`${year}-${month}-${day}`);
        }
    }, [location.search]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting) return; // Prevent multiple submissions

        if (!departure || !destination || !date) {
            alert('Prosim zapolni vsa polja.');
            return;
        }

        setIsSubmitting(true); // Set to true to prevent further submissions

        // Navigate to results page
        navigate(`/search?departure=${departure}&destination=${destination}&date=${date}`);

        // Simulate a delay for user experience (e.g., showing loading)
        setTimeout(() => {
            setIsSubmitting(false);
        }, 500);
    };

    const handleDepartureChange = (e) => {
        setDeparture(e.target.value);
        setDepartureDropdownActive(true);
    };

    const handleDestinationChange = (e) => {
        setDestination(e.target.value);
        setDestinationDropdownActive(true);
    };

    const handleDepartureSelect = (value) => {
        setDeparture(value);
        setDepartureDropdownActive(false);
    };

    const handleDestinationSelect = (value) => {
        setDestination(value);
        setDestinationDropdownActive(false);
    };

    return (
        <div className="App">
            <div className="cloud" style={{top: '50px', left: '50px'}}></div>
            <div className="cloud" style={{top: '100px', left: '250px'}}></div>
            <div className="cloud" style={{top: '150px', right: '50px'}}></div>
            <div className="container bg-white bg-opacity-80 p-8 rounded-lg shadow-lg relative z-10">
                <header className="App-header text-center">
                    <h1 className="text-[#4682B4] mb-8 text-4xl font-semibold">Vlak, avto, bus urniki</h1>
                    <form onSubmit={handleSubmit} className="flex flex-wrap justify-center space-x-4">
                        <div className="custom-dropdown-container relative w-52" ref={departureRef}>
                            <input
                                type="text"
                                placeholder="Kraj odhoda"
                                value={departure}
                                onChange={handleDepartureChange}
                                className="custom-dropdown px-4 py-2 border border-gray-300 rounded-md w-full"
                                onClick={() => setDepartureDropdownActive(!departureDropdownActive)}
                            />
                            {departureDropdownActive && (
                                <div
                                    className="custom-dropdown-list absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto text-left">
                                    {destinations
                                        .filter(dest => dest.Kraj.toLowerCase().includes(departure.toLowerCase()))
                                        .map((dest, index) => (
                                            <div
                                                key={index}
                                                onClick={() => handleDepartureSelect(dest.Kraj)}
                                                className="px-4 py-2 cursor-pointer hover:bg-blue-100"
                                            >
                                                {dest.Kraj}
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                        <div className="custom-dropdown-container relative w-52" ref={destinationRef}>
                            <input
                                type="text"
                                placeholder="Kraj prihoda"
                                value={destination}
                                onChange={handleDestinationChange}
                                className="custom-dropdown px-4 py-2 border border-gray-300 rounded-md w-full"
                                onClick={() => setDestinationDropdownActive(!destinationDropdownActive)}
                            />
                            {destinationDropdownActive && (
                                <div
                                    className="custom-dropdown-list absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto text-left">
                                    {destinations
                                        .filter(dest => dest.Kraj.toLowerCase().includes(destination.toLowerCase()))
                                        .map((dest, index) => (
                                            <div
                                                key={index}
                                                onClick={() => handleDestinationSelect(dest.Kraj)}
                                                className="px-4 py-2 cursor-pointer hover:bg-blue-100"
                                            >
                                                {dest.Kraj}
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                        <div className="custom-dropdown-container relative w-52">
                            <input
                                type="date"
                                placeholder="Date (dd.mm.yyyy)"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="custom-date px-4 py-2 border border-gray-300 rounded-md w-full"
                            />
                        </div>
                        <button type="submit"
                                className="px-8 py-2 bg-[#4682B4] text-white rounded-md text-lg hover:bg-[#4169E1] ml-4"
                                disabled={isSubmitting} // Disable button when submitting
                        >
                            {isSubmitting ? 'Iskanje...' : 'Išči'}
                        </button>
                    </form>
                    {errorMessage && <p className="error-message text-red-500 mt-4">{errorMessage}</p>}
                </header>
            </div>
        </div>
    );
}

export default SearchForm;