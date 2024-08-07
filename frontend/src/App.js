import React, {useState, useEffect, useRef} from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [departure, setDeparture] = useState('');
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');
    const [results, setResults] = useState({});
    const [destinations, setDestinations] = useState([]);
    const [departureDropdownActive, setDepartureDropdownActive] = useState(false);
    const [destinationDropdownActive, setDestinationDropdownActive] = useState(false);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            <div className="container">
                <header className="App-header">
                    <h1>Bus, train, car schedules</h1>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <div className="custom-dropdown-container" ref={departureRef}>
                                <input
                                    type="text"
                                    placeholder="Select Departure"
                                    value={departure}
                                    onChange={handleDepartureChange}
                                    className="custom-dropdown"
                                    onClick={() => setDepartureDropdownActive(!departureDropdownActive)}
                                />
                                {departureDropdownActive && (
                                    <div className="custom-dropdown-list active">
                                        {destinations
                                            .filter(dest => dest.Kraj.toLowerCase().includes(departure.toLowerCase()))
                                            .map((dest, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handleDepartureSelect(dest.Kraj)}
                                                >
                                                    {dest.Kraj}
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                            <div className="custom-dropdown-container" ref={destinationRef}>
                                <input
                                    type="text"
                                    placeholder="Select Destination"
                                    value={destination}
                                    onChange={handleDestinationChange}
                                    className="custom-dropdown"
                                    onClick={() => setDestinationDropdownActive(!destinationDropdownActive)}
                                />
                                {destinationDropdownActive && (
                                    <div className="custom-dropdown-list active">
                                        {destinations
                                            .filter(dest => dest.Kraj.toLowerCase().includes(destination.toLowerCase()))
                                            .map((dest, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handleDestinationSelect(dest.Kraj)}
                                                >
                                                    {dest.Kraj}
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                            <div className="custom-dropdown-container">
                                <input
                                    type="text"
                                    placeholder="Date (dd.mm.yyyy)"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="custom-date"
                                />
                            </div>
                            <button type="submit">Search</button>
                        </div>
                    </form>
                    <div className="results-container">
                        {Object.keys(results).length > 0 && (
                            Object.keys(results).map(key => (
                                <div key={key} className="result-section">
                                    <h2>{key} Results</h2>
                                    <table>
                                        <thead>
                                        <tr>
                                            <th>Departure Station</th>
                                            <th>Departure Time</th>
                                            <th>Arrival Station</th>
                                            <th>Arrival Time</th>
                                            <th>Travel Time</th>
                                            <th>Transport Type</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {results[key].map((result, index) => (
                                            <tr key={index}>
                                                <td>{result.departureStation}</td>
                                                <td>{result.departureTime}</td>
                                                <td>{result.arrivalStation}</td>
                                                <td>{result.arrivalTime}</td>
                                                <td>{result.travelTime}</td>
                                                <td>{result.trainType}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))
                        )}
                    </div>
                </header>
            </div>
        </div>
    );
}

export default App;
