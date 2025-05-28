import React, {useState} from 'react';
import loadingEmptyState from "../components/LoadingEmptyState";
import {FaBus} from "react-icons/fa";

function ResultGroup({from, to, rows, defaultOpen = true}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="mb-6 border border-gray-300 rounded-xl shadow-lg overflow-hidden">
            <h3
                onClick={() => setIsOpen(!isOpen)}
                className="cursor-pointer text-md md:text-lg font-semibold px-4 py-3 bg-gray-100 dark:bg-gray-700 dark:text-white text-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
                {from} ⇒ {to} {isOpen ? '▾' : '▸'}
            </h3>
            {isOpen && <ResultTable rows={rows}/>}
        </div>
    );
}

function ResultsAPMS({results}) {
    return (
        <div className="container result-section mb-8 p-4 rounded-2xl shadow-md bg-white dark:bg-gray-800">
            <div className="flex items-center mb-4">
                <FaBus className="text-[#4682B4] dark:text-purple-400 mr-2 text-2xl md:text-2xl"/>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-200">
                    <a href="https://apms.si" target="_blank" rel="noopener noreferrer" className="hover:underline">
                        APMS
                    </a>
                </h2>
            </div>

            {results.main && results.main.length > 0 && (
                <ResultGroup
                    from={results.main[0].departure}
                    to={results.main[0].arrival}
                    rows={results.main}
                    defaultOpen={true}
                />
            )}

            {results.nearbyDepartures && results.nearbyDepartures.length > 0 &&
                results.nearbyDepartures.map((group, index) => (
                    <ResultGroup
                        key={`ndep-${index}`}
                        from={group.schedule[0].departure}
                        to={group.schedule[0].arrival}
                        rows={group.schedule}
                        defaultOpen={false}
                    />
                ))}

            {results.nearbyDestinations && results.nearbyDestinations.length > 0 &&
                results.nearbyDestinations.map((group, index) => (
                    <ResultGroup
                        key={`ndest-${index}`}
                        from={group.schedule[0].departure}
                        to={group.schedule[0].arrival}
                        rows={group.schedule}
                        defaultOpen={false}
                    />
                ))}
        </div>
    );
}

function ResultTable({rows}) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full table-auto bg-white dark:bg-gray-800 border-collapse">
                <thead>
                <tr>
                    {['Kraj odhoda', 'Čas odhoda', 'Kraj prihoda', 'Čas prihoda', 'Trajanje', 'Km', 'Cena'].map((header, idx) => (
                        <th key={idx}
                            className="px-4 py-3 bg-[#4682B4] dark:bg-purple-900 text-white text-sm md:text-base text-center">
                            {header}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {rows.map((bus, index) => (
                    <tr
                        key={index}
                        className={`transition hover:bg-blue-50 dark:hover:bg-gray-700 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}`}
                    >
                        <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">{bus.departure}</td>
                        <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 font-semibold">{bus.departureTime}</td>
                        <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">{bus.arrival}</td>
                        <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 font-semibold">{bus.arrivalTime}</td>
                        <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">{bus.duration}</td>
                        <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">{bus.kilometers}</td>
                        <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">{bus.price}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default loadingEmptyState(ResultsAPMS, 'APMS', 'https://www.apms.si');