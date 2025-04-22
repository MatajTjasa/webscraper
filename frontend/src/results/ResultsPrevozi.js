import React, {useState} from 'react';
import loadingEmptyState from "../components/LoadingEmptyState";
import {FaCar} from 'react-icons/fa';

function ResultsPrevozi({results}) {
    return (
        <div className="container result-section mb-8 p-4 rounded-2xl shadow-md bg-white dark:bg-gray-800">
            <div className="flex items-center mb-4">
                <FaCar className="text-[#4682B4] dark:text-purple-400 mr-2 text-2xl md:text-2xl"/>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-200">
                    <a href="https://prevoz.org" target="_blank" rel="noopener noreferrer" className="hover:underline">
                        Prevozi
                    </a>
                </h2>
            </div>

            {results.map((route, index) => (
                <CollapsibleRoute key={index} route={route}/>
            ))}

            <footer className="mt-8 text-center text-sm text-gray-600 dark:text-gray-300">
                <p className="italic">
                    Za ogled telefonske številke se prijavite na uradni strani{' '}
                    <a
                        href="https://prevoz.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#386890] font-semibold hover:underline hover:text-[#4169E1] dark:text-purple-500 dark:hover:text-purple-400"
                    >
                        Prevoz.si
                    </a>
                </p>
            </footer>
        </div>
    );
}

function CollapsibleRoute({route}) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="mb-6 border border-gray-300 rounded-xl shadow-lg overflow-hidden">
            <h3
                onClick={() => setIsOpen(!isOpen)}
                className="cursor-pointer text-md md:text-lg font-semibold px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
            >
                {route.from} ⇒ {route.to} {isOpen ? '▾' : '▸'}
            </h3>
            {isOpen && (
                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto bg-white dark:bg-gray-800 border-collapse">
                        <thead>
                        <tr>
                            {['Ura', 'Oseba', 'Cena'].map((header, idx) => (
                                <th key={idx}
                                    className="px-4 py-3 bg-[#4682B4] dark:bg-purple-900 text-white text-sm md:text-base font-semibold text-center">
                                    {header}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {route.trips.map((trip, index) => (
                            <tr
                                key={index}
                                className={`transition hover:bg-blue-50 dark:hover:bg-gray-700 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}`}
                            >
                                <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 font-semibold">{trip.time}</td>
                                <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">{trip.description}</td>
                                <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">{trip.price}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default loadingEmptyState(ResultsPrevozi, 'Prevozi', 'https://prevoz.org');