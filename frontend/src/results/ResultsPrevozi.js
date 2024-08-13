import React from 'react';

function ResultsPrevozi({results}) {
    if (!results || results.length === 0) {
        return <div>No Prevozi results available.</div>;
    }

    return (
        <div className="result-section mb-8">
            <h2 className="text-2xl font-semibold mb-4">Prevozi Results</h2>
            {results.map((route, index) => (
                <div key={index} className="result-section mb-8">
                    <h3 className="text-xl font-semibold mb-2">
                        {route.from} to {route.to} ({route.count} trips)
                    </h3>
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
            ))}
        </div>
    );
}

export default ResultsPrevozi;