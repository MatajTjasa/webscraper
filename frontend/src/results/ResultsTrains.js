import React, {useState} from 'react';
import loadingEmptyState from "../components/LoadingEmptyState";

function ResultsTrains({results}) {
    const [showInactive, setShowInactive] = useState(false);

    const toggleInactiveRows = () => {
        setShowInactive(!showInactive);
    };

    const inactiveRows = results.filter(train => !train.isActive);
    const activeRows = results.filter(train => train.isActive);

    const ArrowIcon = ({direction = "down"}) => (
        <svg
            className={`w-6 h-6 transform ${direction === 'up' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
    );

    return (
        <div className="container result-section mb-8 p-4 rounded-lg shadow-md">
            <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-200">Slovenske
                železnice</h2>

            <div className="overflow-x-auto rounded-lg shadow-md border border-gray-300">
                <table className="min-w-full table-auto rounded-md shadow-md bg-white dark:bg-gray-800">
                    <thead>
                    <tr>
                        <th className="px-2 md:px-4 py-2 bg-[#4682B4] dark:bg-purple-900 text-white text-xs md:text-sm lg:text-base">Kraj
                            odhoda
                        </th>
                        <th className="px-2 md:px-4 py-2 bg-[#4682B4] dark:bg-purple-900 text-white text-xs md:text-sm lg:text-base">Čas
                            odhoda
                        </th>
                        <th className="px-2 md:px-4 py-2 bg-[#4682B4] dark:bg-purple-900 text-white text-xs md:text-sm lg:text-base">Kraj
                            prihoda
                        </th>
                        <th className="px-2 md:px-4 py-2 bg-[#4682B4] dark:bg-purple-900 text-white text-xs md:text-sm lg:text-base">Čas
                            prihoda
                        </th>
                        <th className="px-2 md:px-4 py-2 bg-[#4682B4] dark:bg-purple-900 text-white text-xs md:text-sm lg:text-base">Trajanje</th>
                        <th className="px-2 md:px-4 py-2 bg-[#4682B4] dark:bg-purple-900 text-white text-xs md:text-sm lg:text-base">Vlak</th>
                    </tr>
                    </thead>
                    <tbody>
                    {inactiveRows.length > 0 && !showInactive && (
                        <tr>
                            <td colSpan="6" className="text-center p-0">
                                <div
                                    onClick={toggleInactiveRows}
                                    className="cursor-pointer flex justify-center items-center bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 py-0.5 transition duration-300">
                                    <ArrowIcon direction="down"/>
                                </div>
                            </td>
                        </tr>
                    )}

                    {showInactive && (
                        <>
                            <tr>
                                <td colSpan="6" className="text-center p-0">
                                    <div
                                        onClick={toggleInactiveRows}
                                        className="cursor-pointer flex justify-center items-center bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 py-0.5 transition duration-300">
                                        <ArrowIcon direction="up"/>
                                    </div>
                                </td>
                            </tr>

                            {inactiveRows.map((train, index) => (
                                <tr
                                    key={index}
                                    className={`hover:bg-gray-200 dark:hover:bg-gray-700 ${
                                        index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-900'
                                    }`}
                                >
                                    <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2 text-xs md:text-sm lg:text-base text-red-300">{train.departureStation}</td>
                                    <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2 text-xs md:text-sm lg:text-base text-red-300">{train.departureTime}</td>
                                    <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2 text-xs md:text-sm lg:text-base text-red-300">{train.arrivalStation}</td>
                                    <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2 text-xs md:text-sm lg:text-base text-red-300">{train.arrivalTime}</td>
                                    <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2 text-xs md:text-sm lg:text-base text-red-300">{train.travelTime}</td>
                                    <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2 text-xs md:text-sm lg:text-base text-red-300">{train.trainType}</td>
                                </tr>
                            ))}

                            <tr>
                                <td colSpan="6" className="text-center p-0">
                                    <div
                                        onClick={toggleInactiveRows}
                                        className="cursor-pointer flex justify-center items-center bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 py-0.5 transition duration-300">
                                        <ArrowIcon direction="up"/>
                                    </div>
                                </td>
                            </tr>
                        </>
                    )}

                    {activeRows.map((train, index) => (
                        <tr
                            key={index}
                            className={`hover:bg-gray-200 dark:hover:bg-gray-700 ${
                                index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-900'
                            }`}
                        >
                            <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2 text-xs md:text-sm lg:text-base text-gray-800 dark:text-gray-200">{train.departureStation}</td>
                            <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2 text-xs md:text-sm lg:text-base text-gray-800 dark:text-gray-200">{train.departureTime}</td>
                            <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2 text-xs md:text-sm lg:text-base text-gray-800 dark:text-gray-200">{train.arrivalStation}</td>
                            <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2 text-xs md:text-sm lg:text-base text-gray-800 dark:text-gray-200">{train.arrivalTime}</td>
                            <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2 text-xs md:text-sm lg:text-base text-gray-800 dark:text-gray-200">{train.travelTime}</td>
                            <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2 text-xs md:text-sm lg:text-base text-gray-800 dark:text-gray-200">{train.trainType}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default loadingEmptyState(ResultsTrains, 'Slovenske železnice', 'https://potniski.sz.si/');