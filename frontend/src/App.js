import React, {useState} from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [departure, setDeparture] = useState('');
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');
    const [results, setResults] = useState([]);

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
            <header className="App-header">
                <h1>Slovenske Zeleznice Web Scraper</h1>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Departure Station Code"
                        value={departure}
                        onChange={(e) => setDeparture(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Destination Station Code"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Date (dd.mm.yyyy)"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
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
    );
}

export default App;
