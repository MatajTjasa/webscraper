import React from 'react';
import LoadingComponent from '../components/LoadingComponent';

function ResultsAPMS({results, isLoading}) {
    if (isLoading) {
        return <LoadingComponent text="Pridobivanje podatkov iz strani APMS..."/>;
    }

    if (!results || results.length === 0) {
        return <div>No APMS results available.</div>;
    }

    return (
        <div className="result-section mb-8">
            <h2 className="text-2xl font-semibold mb-4">APMS Results</h2>
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
                {results.map((bus, index) => (
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
}

export default ResultsAPMS;