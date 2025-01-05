import React, {useState} from 'react';
import loadingEmptyState from "../components/LoadingEmptyState";

function ResultsTrains({results}) {
    const [showInactive, setShowInactive] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const toggleInactiveRows = () => {
        setShowInactive(!showInactive);
    };

    const openModal = (content) => {
        setModalContent(content);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalContent(null);
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
                        <th className="px-2 md:px-4 py-2 bg-[#4682B4] text-white">Kraj odhoda</th>
                        <th className="px-2 md:px-4 py-2 bg-[#4682B4] text-white">Čas odhoda</th>
                        <th className="px-2 md:px-4 py-2 bg-[#4682B4] text-white">Kraj prihoda</th>
                        <th className="px-2 md:px-4 py-2 bg-[#4682B4] text-white">Čas prihoda</th>
                        <th className="px-2 md:px-4 py-2 bg-[#4682B4] text-white">Trajanje</th>
                        <th className="px-2 md:px-4 py-2 bg-[#4682B4] text-white">Prestopi</th>
                        <th className="px-2 md:px-4 py-2 bg-[#4682B4] text-white">Vlak</th>
                        <th className="px-2 md:px-4 py-2 bg-[#4682B4] text-white">Opozorilo</th>
                    </tr>
                    </thead>
                    <tbody>
                    {inactiveRows.length > 0 && !showInactive && (
                        <tr>
                            <td colSpan="8" className="text-center p-0">
                                <div
                                    onClick={toggleInactiveRows}
                                    className="cursor-pointer flex justify-center items-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 py-0.5 transition duration-300"
                                >
                                    <ArrowIcon direction="down"/>
                                </div>
                            </td>
                        </tr>
                    )}

                    {showInactive && (
                        <>
                            <tr>
                                <td colSpan="8" className="text-center p-0">
                                    <div
                                        onClick={toggleInactiveRows}
                                        className="cursor-pointer flex justify-center items-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 py-0.5 transition duration-300"
                                    >
                                        <ArrowIcon direction="up"/>
                                    </div>
                                </td>
                            </tr>

                            {inactiveRows.map((train, index) => (
                                <TrainRow
                                    key={index}
                                    train={train}
                                    openModal={openModal}
                                    index={index}
                                />
                            ))}

                            <tr>
                                <td colSpan="8" className="text-center p-0">
                                    <div
                                        onClick={toggleInactiveRows}
                                        className="cursor-pointer flex justify-center items-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 py-0.5 transition duration-300"
                                    >
                                        <ArrowIcon direction="up"/>
                                    </div>
                                </td>
                            </tr>
                        </>
                    )}

                    {activeRows.map((train, index) => (
                        <TrainRow
                            key={index}
                            train={train}
                            openModal={openModal}
                            index={index}
                        />
                    ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-lg w-full">
                        <h2 className="text-lg font-semibold mb-4">Opozorilo</h2>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{modalContent}</p>
                        <button
                            onClick={closeModal}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                            Zapri
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const TrainRow = ({train, openModal, index}) => (
    <tr
        className={`${
            index % 2 === 0 ? "bg-gray-100 dark:bg-gray-900" : "bg-white dark:bg-gray-800"
        } hover:bg-gray-200 dark:hover:bg-gray-700 ${
            !train.isActive ? "text-red-500" : ""
        }`}
    >
        <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2">{train.departureStation}</td>
        <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2">{train.departureTime}</td>
        <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2">{train.arrivalStation}</td>
        <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2">{train.arrivalTime}</td>
        <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2">{train.travelTime}</td>
        <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2">{train.transfers}</td>
        <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2">{train.trainType}</td>
        <td className="border border-gray-300 dark:border-gray-700 px-2 md:px-4 py-2 text-center">
            {train.warnings && train.warnings.length > 0 ? (
                <div
                    onClick={() => openModal(train.warnings)}
                    className="flex justify-center text-lg cursor-pointer"
                    title="Prikaži opozorilo"
                >
                    ⚠️
                </div>
            ) : (
                "—"
            )}
        </td>
    </tr>
);

export default loadingEmptyState(ResultsTrains, 'Slovenske železnice', 'https://potniski.sz.si/');