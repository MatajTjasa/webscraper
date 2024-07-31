import React, {useState, useEffect} from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [departure, setDeparture] = useState('');
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');
    const [results, setResults] = useState([]);
    const [destinations, setDestinations] = useState([]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:3000/webscraper/searchSlovenskeZelezniceByUrl', {
                departure,
                destination,
                date
            });
            setResults(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
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
                        <select value={departure} onChange={(e) => setDeparture(e.target.value)} required>
                            <option value="" disabled>Select Departure</option>
                            {destinations.map((dest, index) => (
                                <option key={index} value={dest.Kraj}>{dest.Kraj}</option>
                            ))}
                        </select>
                        <select value={destination} onChange={(e) => setDestination(e.target.value)} required>
                            <option value="" disabled>Select Destination</option>
                            {destinations.map((dest, index) => (
                                <option key={index} value={dest.Kraj}>{dest.Kraj}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Date (dd.mm.yyyy)"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                        <button type="submit">Search</button>
                    </form>
                    <div>
                        {results.length > 0 && (
                            <table>
                                <thead>
                                <tr>
                                    <th>Departure Station</th>
                                    <th>Departure Time</th>
                                    <th>Arrival Station</th>
                                    <th>Arrival Time</th>
                                    <th>Travel Time</th>
                                    <th>Train Type</th>
                                </tr>
                                </thead>
                                <tbody>
                                {results.map((result, index) => (
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
                        )}
                    </div>
                </header>
            </div>
        </div>
    );
}

export default App;
