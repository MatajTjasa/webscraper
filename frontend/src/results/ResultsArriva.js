import React from 'react';
import LoadingComponent from '../components/LoadingComponent';

function ResultsArriva({results, isLoading}) {
    if (isLoading) {
        return <LoadingComponent text="Pridobivanje podatkov iz strani Arriva..."/>;
    }

    if (!results || results.length === 0) {
        return <div>No Arriva results available.</div>;
    }

    return (
        <div className="container result-section mb-8">
            <h2 className="text-2xl font-semibold mb-4">Arriva Results</h2>
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
                {results.map((bus, index) => (
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
}

export default ResultsArriva;