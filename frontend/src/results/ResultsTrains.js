import React, {useState} from 'react';
import loadingEmptyState from "../components/LoadingEmptyState";
import {FaTrain} from 'react-icons/fa';

function ResultGroup({from, to, activeRows, inactiveRows, openModal, defaultOpen = true}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [showInactive, setShowInactive] = useState(false);

    const toggleInactiveRows = () => setShowInactive(!showInactive);

    return (
        <div className="mb-6 border border-gray-300 rounded-xl shadow-lg overflow-hidden">
            <h3
                onClick={() => setIsOpen(!isOpen)}
                className="cursor-pointer text-md md:text-lg font-semibold px-4 py-3 bg-gray-100 dark:bg-gray-700 dark:text-white text-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
                {from} ⇒ {to} {isOpen ? '▾' : '▸'}
            </h3>
            {isOpen && (
                <ResultTable
                    activeRows={activeRows}
                    inactiveRows={inactiveRows}
                    showInactive={showInactive}
                    toggleInactiveRows={toggleInactiveRows}
                    openModal={openModal}
                />
            )}
        </div>
    );
}

function ResultsTrains({results}) {
    const [modalContent, setModalContent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = (content) => {
        setModalContent(content);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setModalContent(null);
        setIsModalOpen(false);
    };

    const groupedResults = results.reduce((acc, train) => {
        const key = `${train.departureStation}⇒${train.arrivalStation}`;
        if (!acc[key]) acc[key] = {active: [], inactive: []};
        if (train.isActive) {
            acc[key].active.push(train);
        } else {
            acc[key].inactive.push(train);
        }
        return acc;
    }, {});

    return (
        <div className="container result-section mb-8 p-4 rounded-2xl shadow-md bg-white dark:bg-gray-800">
            <div className="flex items-center mb-4">
                <FaTrain className="text-[#4682B4] dark:text-purple-400 mr-2 text-2xl md:text-2xl"/>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-200">
                    <a href="https://potniski.sz.si/" target="_blank" rel="noopener noreferrer"
                       className="hover:underline">
                        Slovenske železnice
                    </a>
                </h2>
            </div>


            {Object.entries(groupedResults).map(([key, group], index) => {
                const [from, to] = key.split('⇒');
                return (
                    <ResultGroup
                        key={index}
                        from={from}
                        to={to}
                        activeRows={group.active}
                        inactiveRows={group.inactive}
                        openModal={openModal}
                        defaultOpen={true}
                    />
                );
            })}

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
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-lg w-full">
                        <h2 className="text-lg font-semibold mb-4">Opozorilo</h2>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{modalContent}</p>
                        <button
                            onClick={closeModal}
                            className="mt-4 px-4 py-2 bg-[#4682B4] dark:bg-purple-900 text-white rounded-lg hover:bg-[#4169E1] dark:hover:bg-purple-700 ml-auto block"
                        >
                            Zapri
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ResultTable({activeRows, inactiveRows, showInactive, toggleInactiveRows, openModal}) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full table-auto bg-white dark:bg-gray-800 border-collapse">
                <thead>
                <tr>
                    {['Kraj odhoda', 'Čas odhoda', 'Kraj prihoda', 'Čas prihoda', 'Trajanje', 'Prestopi', 'Vlak', 'Opozorilo'].map((header, idx) => (
                        <th key={idx}
                            className={`px-4 py-3 bg-[#4682B4] dark:bg-purple-900 text-white text-sm md:text-base font-semibold text-center`}>
                            {header}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {activeRows.map((train, index) => (
                    <TrainRow key={index} train={train} openModal={openModal} index={index}/>
                ))}

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
                            <TrainRow key={`inactive-${index}`} train={train} openModal={openModal} index={index}/>
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
                </tbody>
            </table>
        </div>
    );
}

const TrainRow = ({train, openModal, index}) => (
    <tr
        className={`transition hover:bg-blue-50 dark:hover:bg-gray-700 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'} ${!train.isActive ? 'text-[#FFB347]' : ''}`}
    >
        <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">{train.departureStation}</td>
        <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 font-semibold">{train.departureTime}</td>
        <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">{train.arrivalStation}</td>
        <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 font-semibold">{train.arrivalTime}</td>
        <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">{train.travelTime}</td>
        <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-center">{train.transfers}</td>
        <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-center">{train.trainType}</td>
        <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-center">
            {train.warnings && train.warnings.length > 0 ? (
                <div onClick={() => openModal(train.warnings)} className="flex justify-center text-lg cursor-pointer"
                     title="Prikaži opozorilo">
                    ⚠️
                </div>
            ) : (
                "—"
            )}
        </td>
    </tr>
);

const ArrowIcon = ({direction = "down"}) => (
    <svg className={`w-6 h-6 transform ${direction === 'up' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor"
         viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
    </svg>
);

export default loadingEmptyState(ResultsTrains, 'Slovenske železnice', 'https://potniski.sz.si/');