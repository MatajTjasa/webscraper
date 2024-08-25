import React from 'react';
import loadingEmptyState from "../components/LoadingEmptyState";

function ResultsPrevozi({results}) {
    return (
        <div
            className="container result-section mb-8 bg-white dark:bg-gray-800 dark:bg-opacity-60 p-4 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-200">Prevozi</h2>
            {results.map((route, index) => (
                <div key={index} className="mb-8">
                    <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-300">
                        {route.from} to {route.to} ({route.count} trips)
                    </h3>
                    <div className="overflow-hidden rounded-lg shadow-md border border-gray-300">
                        <table
                            className="table-auto w-full rounded-md shadow-md bg-white dark:bg-gray-800 border-separate border-spacing-0">
                            <thead>
                            <tr>
                                <th className="px-4 py-2 bg-[#4682B4] dark:bg-purple-900 text-white">Ura</th>
                                <th className="px-4 py-2 bg-[#4682B4] dark:bg-purple-900 text-white">Oseba</th>
                                <th className="px-4 py-2 bg-[#4682B4] dark:bg-purple-900 text-white">Cena</th>
                            </tr>
                            </thead>
                            <tbody>
                            {route.trips.map((trip, index) => (
                                <tr
                                    key={index}
                                    className={`hover:bg-gray-200 dark:hover:bg-gray-700 ${
                                        index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-900'
                                    }`}
                                >
                                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-800 dark:text-gray-200">{trip.time}</td>
                                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-800 dark:text-gray-200">{trip.description}</td>
                                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-800 dark:text-gray-200">{trip.price}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default loadingEmptyState(ResultsPrevozi, 'Prevozi', 'https://prevoz.org');