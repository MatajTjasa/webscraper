import React from 'react';
import LoadingComponent from '../components/LoadingComponent';

function ResultsAPMS({results, isLoading}) {
    if (isLoading) {
        return (
            <LoadingComponent content={
                <>
                    Pridobivanje podatkov iz strani <a href="https://www.apms.si" target="_blank"
                                                       rel="noopener noreferrer"
                                                       className="text-blue-600 underline hover:text-blue-800">APMS</a>...
                </>
            }/>
        );
    }

    if (!results || results.length === 0) {
        return (
            <div className="container result-section mb-8">
                <p className="text-gray-800 text-md leading-relaxed italic text-center">
                    Iskanih rezultatov ponudnika <a href="https://www.apms.si"
                                                    className="text-[#386890] font-sans font-semibold hover:underline hover:text-[#4169E1]">APMS</a> nismo
                    našli.
                </p>
            </div>
        );
    }

    return (
        <div className="container result-section mb-8">
            <h2 className="text-2xl font-semibold mb-4">Rezultati za APMS</h2>
            <div className="overflow-hidden rounded-lg shadow-md">
                <table className="table-auto w-full bg-white rounded-md shadow-md">
                    <thead>
                    <tr>
                        <th className="px-4 py-2 bg-[#4682B4] text-white">Kraj odhoda</th>
                        <th className="px-4 py-2 bg-[#4682B4] text-white">Čas odhoda</th>
                        <th className="px-4 py-2 bg-[#4682B4] text-white">Kraj prihoda</th>
                        <th className="px-4 py-2 bg-[#4682B4] text-white">Čas prihoda</th>
                        <th className="px-4 py-2 bg-[#4682B4] text-white">Trajanje</th>
                        <th className="px-4 py-2 bg-[#4682B4] text-white">Dolžina</th>
                    </tr>
                    </thead>
                    <tbody>
                    {results.map((bus, index) => (
                        <tr key={index}
                            className={`hover:bg-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}>
                            <td className="border px-4 py-2">{bus.departure}</td>
                            <td className="border px-4 py-2">{bus.departureTime}</td>
                            <td className="border px-4 py-2">{bus.arrival}</td>
                            <td className="border px-4 py-2">{bus.arrivalTime}</td>
                            <td className="border px-4 py-2">{bus.duration}</td>
                            <td className="border px-4 py-2">{bus.kilometers}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ResultsAPMS;