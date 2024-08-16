import React, {useState} from 'react';
import LoadingComponent from '../components/LoadingComponent';

function ResultsTrains({results, isLoading}) {
    const [showInactive, setShowInactive] = useState(false);

    if (isLoading) {
        return (
            <LoadingComponent content={
                <>
                    Pridobivanje podatkov iz strani <a href="https://potniski.sz.si/" target="_blank"
                                                       rel="noopener noreferrer"
                                                       className="text-blue-600 underline hover:text-blue-800">Slovenske
                    železnice</a>...
                </>
            }/>
        );
    }

    if (!results || results.length === 0) {
        return (
            <div className="container result-section mb-8">
                <p className="text-gray-800 text-md leading-relaxed italic text-center">
                    Iskanih rezultatov ponudnika <a href="https://potniski.sz.si/"
                                                    className="text-[#386890] font-sans font-semibold hover:underline hover:text-[#4169E1]">Slovenske
                    železnice</a> nismo našli.
                </p>
            </div>
        );
    }

    const toggleInactiveRows = () => {
        setShowInactive(!showInactive);
    };

    const inactiveRows = results.filter(train => !train.isActive);
    const activeRows = results.filter(train => train.isActive);

    const ArrowIcon = ({direction = "down"}) => (
        <svg
            className={`w-6 h-6 transform ${direction === 'up' ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
    );

    return (
        <div className="container result-section mb-8">
            <h2 className="text-2xl font-semibold mb-4">Rezultati za vlake</h2>

            <div className="overflow-hidden rounded-lg shadow-md">
                <table className="table-auto w-full bg-white rounded-md shadow-md">
                    <thead>
                    <tr>
                        <th className="px-4 py-2 bg-[#4682B4] text-white">Kraj odhoda</th>
                        <th className="px-4 py-2 bg-[#4682B4] text-white">Čas odhoda</th>
                        <th className="px-4 py-2 bg-[#4682B4] text-white">Kraj prihoda</th>
                        <th className="px-4 py-2 bg-[#4682B4] text-white">Čas prihoda</th>
                        <th className="px-4 py-2 bg-[#4682B4] text-white">Trajanje</th>
                        <th className="px-4 py-2 bg-[#4682B4] text-white">Vlak</th>
                    </tr>
                    </thead>
                    <tbody>
                    {!showInactive && (
                        <tr>
                            <td colSpan="6" className="text-center p-0">
                                <div
                                    onClick={toggleInactiveRows}
                                    className="cursor-pointer flex justify-center items-center bg-gray-100 hover:bg-gray-200 py-0.5 transition duration-300">
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
                                        className="cursor-pointer flex justify-center items-center bg-gray-100 hover:bg-gray-200 py-0.5 transition duration-300">
                                        <ArrowIcon direction="up"/>
                                    </div>
                                </td>
                            </tr>

                            {inactiveRows.map((train, index) => (
                                <tr key={index}
                                    className={`hover:bg-gray-200 ${'text-red-400'} ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}>
                                    <td className="border px-4 py-2">{train.departureStation}</td>
                                    <td className="border px-4 py-2">{train.departureTime}</td>
                                    <td className="border px-4 py-2">{train.arrivalStation}</td>
                                    <td className="border px-4 py-2">{train.arrivalTime}</td>
                                    <td className="border px-4 py-2">{train.travelTime}</td>
                                    <td className="border px-4 py-2">{train.trainType}</td>
                                </tr>
                            ))}

                            <tr>
                                <td colSpan="6" className="text-center p-0">
                                    <div
                                        onClick={toggleInactiveRows}
                                        className="cursor-pointer flex justify-center items-center bg-gray-100 hover:bg-gray-200 py-0.5 transition duration-300">
                                        <ArrowIcon direction="up"/>
                                    </div>
                                </td>
                            </tr>
                        </>
                    )}

                    {activeRows.map((train, index) => (
                        <tr key={index}
                            className={`hover:bg-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}>
                            <td className="border px-4 py-2">{train.departureStation}</td>
                            <td className="border px-4 py-2">{train.departureTime}</td>
                            <td className="border px-4 py-2">{train.arrivalStation}</td>
                            <td className="border px-4 py-2">{train.arrivalTime}</td>
                            <td className="border px-4 py-2">{train.travelTime}</td>
                            <td className="border px-4 py-2">{train.trainType}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ResultsTrains;