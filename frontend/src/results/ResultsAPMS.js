import React from 'react';
import loadingEmptyState from "../components/LoadingEmptyState";

function ResultsAPMS({results}) {
    const renderGroup = (from, to, rows) => (
        <div className="mb-8">
            <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-800 dark:text-gray-300">
                {from} ⇒ {to}
            </h3>
            <ResultTable rows={rows}/>
        </div>
    );

    return (
        <div className="container result-section mb-8 p-4 rounded-lg shadow-md">
            <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-200">APMS</h2>

            {/* Main kot posebna relacija */}
            {results.main && results.main.length > 0 && renderGroup(
                results.main[0].departure,
                results.main[0].arrival,
                results.main
            )}

            {/* Nearby departures */}
            {results.nearbyDepartures && results.nearbyDepartures.length > 0 &&
                results.nearbyDepartures.map((group, index) => (
                    renderGroup(group.iz, group.v, group.vozniRed)
                ))
            }

            {/* Nearby destinations */}
            {results.nearbyDestinations && results.nearbyDestinations.length > 0 &&
                results.nearbyDestinations.map((group, index) => (
                    renderGroup(group.iz, group.v, group.vozniRed)
                ))
            }
        </div>
    );
}

function ResultTable({rows}) {
    return (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-300">
            <table className="min-w-full table-auto rounded-md shadow-md bg-white dark:bg-gray-800">
                <thead>
                <tr>
                    <th className="px-2 md:px-4 py-2 bg-[#4682B4] dark:bg-purple-800 text-white text-xs md:text-sm lg:text-base">Kraj
                        odhoda
                    </th>
                    <th className="px-2 md:px-4 py-2 bg-[#4682B4] dark:bg-purple-800 text-white text-xs md:text-sm lg:text-base">Čas
                        odhoda
                    </th>
                    <th className="px-2 md:px-4 py-2 bg-[#4682B4] dark:bg-purple-800 text-white text-xs md:text-sm lg:text-base">Kraj
                        prihoda
                    </th>
                    <th className="px-2 md:px-4 py-2 bg-[#4682B4] dark:bg-purple-800 text-white text-xs md:text-sm lg:text-base">Čas
                        prihoda
                    </th>
                    <th className="px-2 md:px-4 py-2 bg-[#4682B4] dark:bg-purple-800 text-white text-xs md:text-sm lg:text-base">Trajanje</th>
                    <th className="px-2 md:px-4 py-2 bg-[#4682B4] dark:bg-purple-800 text-white text-xs md:text-sm lg:text-base">km</th>
                    <th className="px-2 md:px-4 py-2 bg-[#4682B4] dark:bg-purple-800 text-white text-xs md:text-sm lg:text-base">Cena</th>
                </tr>
                </thead>
                <tbody>
                {rows.map((bus, index) => (
                    <tr
                        key={index}
                        className={`hover:bg-gray-200 dark:hover:bg-gray-700 ${
                            index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-900'
                        }`}
                    >
                        <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2">{bus.departure}</td>
                        <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2">{bus.departureTime}</td>
                        <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2">{bus.arrival}</td>
                        <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2">{bus.arrivalTime}</td>
                        <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2">{bus.duration}</td>
                        <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2">{bus.kilometers}</td>
                        <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2">{bus.price}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default loadingEmptyState(ResultsAPMS, 'APMS', 'https://www.apms.si');