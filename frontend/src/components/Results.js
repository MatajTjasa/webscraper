import React from 'react';
import {useLocation} from 'react-router-dom';

function Results() {
    const location = useLocation();
    const {results} = location.state;

    if (!results) {
        return <div>No results found.</div>;
    }

    const renderPrevoziResults = (prevozi) => {
        return prevozi.map((route, index) => (
            <div key={index} className="result-section mb-8">
                <h2 className="text-2xl font-semibold text-center mb-4">
                    {route.from} to {route.to} ({route.count} trips)
                </h2>
                <table className="table-auto w-full bg-white rounded-md shadow-md">
                    <thead>
                    <tr>
                        <th className="px-4 py-2 bg-blue-600 text-white">Time</th>
                        <th className="px-4 py-2 bg-blue-600 text-white">Description</th>
                        <th className="px-4 py-2 bg-blue-600 text-white">Price</th>
                    </tr>
                    </thead>
                    <tbody>
                    {route.trips.map((trip, tripIndex) => (
                        <tr key={tripIndex} className="hover:bg-gray-100">
                            <td className="border px-4 py-2">{trip.time}</td>
                            <td className="border px-4 py-2">{trip.description}</td>
                            <td className="border px-4 py-2">{trip.price}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        ));
    };

    const renderTrainResults = (trains) => {
        return (
            <div className="result-section mb-8">
                <h2 className="text-2xl font-semibold text-center mb-4">Train Results</h2>
                <table className="table-auto w-full bg-white rounded-md shadow-md">
                    <thead>
                    <tr>
                        <th className="px-4 py-2 bg-blue-600 text-white">Departure Station</th>
                        <th className="px-4 py-2 bg-blue-600 text-white">Departure Time</th>
                        <th className="px-4 py-2 bg-blue-600 text-white">Arrival Station</th>
                        <th className="px-4 py-2 bg-blue-600 text-white">Arrival Time</th>
                        <th className="px-4 py-2 bg-blue-600 text-white">Travel Time</th>
                        <th className="px-4 py-2 bg-blue-600 text-white">Train Type</th>
                    </tr>
                    </thead>
                    <tbody>
                    {trains.map((train, index) => (
                        <tr key={index} className="hover:bg-gray-100">
                            <td className="border px-4 py-2">{train.departureStation}</td>
                            <td className="border px-4 py-2">{train.departureTime}</td>
                            <td className="border px-4 py-2">{train.arrivalStation}</td>
                            <td className="border px-4 py-2">{train.arrivalTime}</td>
                            <td className="border px-4 py-2">{train.travelTime}</td>
                            <td className="border px-4 py-2">{train.trainType}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderAPMSResults = (apms) => {
        return (
            <div className="result-section mb-8">
                <h2 className="text-2xl font-semibold text-center mb-4">APMS Results</h2>
                <table className="table-auto w-full bg-white rounded-md shadow-md">
                    <thead>
                    <tr>
                        <th className="px-4 py-2 bg-blue-600 text-white">Departure</th>
                        <th className="px-4 py-2 bg-blue-600 text-white">Departure Time</th>
                        <th className="px-4 py-2 bg-blue-600 text-white">Arrival</th>
                        <th className="px-4 py-2 bg-blue-600 text-white">Arrival Time</th>
                        <th className="px-4 py-2 bg-blue-600 text-white">Duration</th>
                        <th className="px-4 py-2 bg-blue-600 text-white">Kilometers</th>
                    </tr>
                    </thead>
                    <tbody>
                    {apms.map((bus, index) => (
                        <tr key={index} className="hover:bg-gray-100">
                            <td className="border px-4 py-2">{bus.departure}</td>
                            <td className="border px-4 py-2">{bus.departureTime}</td>
                            <td className="border px-4 py-2">{bus.arrival}</td>
                            <td className="border px-4 py-2">{bus.arrivalTime}</td>
                            <td className="border px-4 py-2">{bus.duration}</td>
                            <td className="border px-4 py-2">{bus.kilometers}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderArrivaResults = (arriva) => {
        return (
            <div className="result-section mb-8">
                <h2 className="text-2xl font-semibold text-center mb-4">Arriva Results</h2>
                <table className="table-auto w-full bg-white rounded-md shadow-md">
                    <thead>
                    <tr>
                        <th className="px-4 py-2 bg-blue-600 text-white">Departure</th>
                        <th className="px-4 py-2 bg-blue-600 text-white">Departure Time</th>
                        <th className="px-4 py-2 bg-blue-600 text-white">Arrival</th>
                        <th className="px-4 py-2 bg-blue-600 text-white">Arrival Time</th>
                        <th className="px-4 py-2 bg-blue-600 text-white">Travel Duration</th>
                        <th className="px-4 py-2 bg-blue-600 text-white">Prevoznik</th>
                        <th className="px-4 py-2 bg-blue-600 text-white">Length</th>
                        <th className="px-4 py-2 bg-blue-600 text-white">Price</th>
                    </tr>
                    </thead>
                    <tbody>
                    {arriva.map((bus, index) => (
                        <tr key={index} className="hover:bg-gray-100">
                            <td className="border px-4 py-2">{bus.departure}</td>
                            <td className="border px-4 py-2">{bus.departureTime}</td>
                            <td className="border px-4 py-2">{bus.arrival}</td>
                            <td className="border px-4 py-2">{bus.arrivalTime}</td>
                            <td className="border px-4 py-2">{bus.travelDuration}</td>
                            <td className="border px-4 py-2">{bus.prevoznik}</td>
                            <td className="border px-4 py-2">{bus.length}</td>
                            <td className="border px-4 py-2">{bus.price}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="App">
            <div className="cloud" style={{top: '50px', left: '50px'}}></div>
            <div className="cloud" style={{top: '100px', left: '250px'}}></div>
            <div className="cloud" style={{top: '150px', right: '50px'}}></div>
            <div className="container bg-white bg-opacity-80 p-8 rounded-lg shadow-lg relative z-10">
                <header className="App-header text-center">
                    <h1 className="text-[#4682B4] mb-8 text-4xl font-semibold">Bus, train, car schedules</h1>
                    <div className="results-container mt-8 w-full">
                        {results.Prevozi && renderPrevoziResults(results.Prevozi)}
                        {results.Train && renderTrainResults(results.Train)}
                        {results.APMS && renderAPMSResults(results.APMS)}
                        {results.Arriva && renderArrivaResults(results.Arriva)}
                    </div>
                </header>
            </div>
        </div>
    );
}

export default Results;
