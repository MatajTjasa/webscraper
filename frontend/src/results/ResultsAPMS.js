import React from 'react';
import loadingEmptyState from "../components/LoadingEmptyState";

function ResultsAPMS({results}) {
    return (
        <div
            className="container result-section mb-8 bg-white dark:bg-gray-800 dark:bg-opacity-60 p-4 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-200">Rezultati za APMS</h2>
            <div className="overflow-hidden rounded-lg shadow-md border border-gray-300">
                <table
                    className="table-auto w-full rounded-md shadow-md bg-white dark:bg-gray-800 border-separate border-spacing-0">
                    <thead>
                    <tr>
                        <th className="px-4 py-2 bg-[#4682B4] dark:bg-purple-800 text-white">Kraj odhoda</th>
                        <th className="px-4 py-2 bg-[#4682B4] dark:bg-purple-800 text-white">Čas odhoda</th>
                        <th className="px-4 py-2 bg-[#4682B4] dark:bg-purple-800 text-white">Kraj prihoda</th>
                        <th className="px-4 py-2 bg-[#4682B4] dark:bg-purple-800 text-white">Čas prihoda</th>
                        <th className="px-4 py-2 bg-[#4682B4] dark:bg-purple-800 text-white">Trajanje</th>
                        <th className="px-4 py-2 bg-[#4682B4] dark:bg-purple-800 text-white">Dolžina</th>
                    </tr>
                    </thead>
                    <tbody>
                    {results.map((bus, index) => (
                        <tr
                            key={index}
                            className={`hover:bg-gray-200 dark:hover:bg-gray-700 ${
                                index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-900'
                            }`}
                        >
                            <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-800 dark:text-gray-200">{bus.departure}</td>
                            <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-800 dark:text-gray-200">{bus.departureTime}</td>
                            <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-800 dark:text-gray-200">{bus.arrival}</td>
                            <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-800 dark:text-gray-200">{bus.arrivalTime}</td>
                            <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-800 dark:text-gray-200">{bus.duration}</td>
                            <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-800 dark:text-gray-200">{bus.kilometers}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default loadingEmptyState(ResultsAPMS, 'APMS', 'https://www.apms.si');