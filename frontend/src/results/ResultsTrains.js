import React from 'react';
import LoadingComponent from '../components/LoadingComponent';

function ResultsTrains({results, isLoading}) {
    if (isLoading) {
        return <LoadingComponent text="Pridobivanje podatkov iz strani Train..."/>;
    }

    if (!results || results.length === 0) {
        return <div>No train results available.</div>;
    }

    return (
        <div className="container result-section mb-8">
            <h2 className="text-2xl font-semibold mb-4">Train Results</h2>
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
                {results.map((train, index) => (
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
}

export default ResultsTrains;