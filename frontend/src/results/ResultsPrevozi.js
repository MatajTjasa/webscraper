import React from 'react';
import loadingEmptyState from "../components/LoadingEmptyState";

function ResultsPrevozi({results}) {
    return (
        <div className="container result-section mb-8 p-4 rounded-lg shadow-md">
            <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-200">Prevozi</h2>
            {results.map((route, index) => (
                <div key={index} className="mb-8">
                    <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-800 dark:text-gray-300">
                        {route.from} to {route.to} ({route.count} trips)
                    </h3>
                    <div className="overflow-x-auto rounded-lg shadow-md border border-gray-300">
                        <table className="min-w-full table-auto rounded-md shadow-md bg-white dark:bg-gray-800">
                            <thead>
                            <tr>
                                <th className="px-2 md:px-4 py-2 bg-[#4682B4] dark:bg-purple-900 text-white text-xs md:text-sm">Ura</th>
                                <th className="px-2 md:px-4 py-2 bg-[#4682B4] dark:bg-purple-900 text-white text-xs md:text-sm">Oseba</th>
                                <th className="px-2 md:px-4 py-2 bg-[#4682B4] dark:bg-purple-900 text-white text-xs md:text-sm">Cena</th>
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
                                    <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2 text-xs md:text-sm text-gray-800 dark:text-gray-200">{trip.time}</td>
                                    <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2 text-xs md:text-sm text-gray-800 dark:text-gray-200">{trip.description}</td>
                                    <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2 text-xs md:text-sm text-gray-800 dark:text-gray-200">{trip.price}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
            <footer style={{marginTop: '40px', textAlign: 'center', fontSize: '0.9rem', color: '#555'}}>
                <p className="italic text-gray-700 dark:text-gray-300">
                    *Za ogled telefonske številke se prijavite na uradni strani {' '}
                    <a
                        href="https://prevoz.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#386890] dark:text-purple-300 font-sans font-semibold hover:underline hover:text-[#4169E1] dark:hover:text-purple-500"
                    >
                        Prevoz.si
                    </a>
                </p>
            </footer>
        </div>
    );
}

export default loadingEmptyState(ResultsPrevozi, 'Prevozi', 'https://prevoz.org');