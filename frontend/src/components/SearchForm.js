import React, {useState, useEffect, useRef} from 'react';
import {useLocation} from 'react-router-dom';
import axios from 'axios';

function SearchForm({onSearch}) {
    const [departure, setDeparture] = useState('');
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');
    const [destinations, setDestinations] = useState([]);
    const [departureDropdownActive, setDepartureDropdownActive] = useState(false);
    const [destinationDropdownActive, setDestinationDropdownActive] = useState(false);

    const location = useLocation();
    const departureRef = useRef(null);
    const destinationRef = useRef(null);

    useEffect(() => {
        const fetchDestinations = async () => {
            try {
                const response = await axios.get('http://localhost:3000/webscraper/destinations');
                setDestinations(response.data);
            } catch (error) {
                console.error('Error fetching destinations:', error);
            }
        };

        fetchDestinations();
    }, []);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const departure = queryParams.get('departure');
        const destination = queryParams.get('destination');
        const date = queryParams.get('date');

        if (departure) setDeparture(departure);
        if (destination) setDestination(destination);
        if (date) setDate(date);
    }, [location.search]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!departure || !destination || !date) {
            alert('Please fill in all fields.');
            return;
        }
        onSearch(departure, destination, date);
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
                    <h1 className="text-[#4682B4] mb-8 text-4xl font-semibold">Bus, train, car schedules</h1>
                    <form onSubmit={handleSubmit} className="flex flex-wrap justify-center space-x-4">
                        <div className="custom-dropdown-container relative w-52" ref={departureRef}>
                            <input
                                type="text"
                                placeholder="Select Departure"
                                value={departure}
                                onChange={handleDepartureChange}
                                className="custom-dropdown px-4 py-2 border border-gray-300 rounded-md w-full"
                                onClick={() => setDepartureDropdownActive(!departureDropdownActive)}
                            />
                            {departureDropdownActive && (
                                <div
                                    className="custom-dropdown-list absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto">
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
                                placeholder="Select Destination"
                                value={destination}
                                onChange={handleDestinationChange}
                                className="custom-dropdown px-4 py-2 border border-gray-300 rounded-md w-full"
                                onClick={() => setDestinationDropdownActive(!destinationDropdownActive)}
                            />
                            {destinationDropdownActive && (
                                <div
                                    className="custom-dropdown-list absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto">
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
                                type="text"
                                placeholder="Date (dd.mm.yyyy)"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="custom-date px-4 py-2 border border-gray-300 rounded-md w-full"
                            />
                        </div>
                        <button type="submit"
                                className="px-8 py-2 bg-[#4682B4] text-white rounded-md text-lg hover:bg-[#4169E1] ml-4">Search
                        </button>
                    </form>
                </header>
            </div>
        </div>
    );
}

export default SearchForm;
