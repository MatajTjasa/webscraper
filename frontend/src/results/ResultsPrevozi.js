import React from 'react';
import LoadingComponent from '../components/LoadingComponent';

function ResultsPrevozi({results, isLoading}) {
    if (isLoading) {
        return (
            <LoadingComponent content={
                <>
                    Pridobivanje podatkov iz strani <a href="https://prevoz.org"
                                                       target="_blank"
                                                       rel="noopener noreferrer"
                                                       className="text-[#386890] font-sans font-semibold hover:underline hover:text-[#4169E1]">Prevozi</a>...
                </>
            }/>
        );
    }

    if (!results || results.length === 0) {
        return (
            <div className="container result-section mb-8">
                <p className="text-gray-800 text-md leading-relaxed italic text-center">
                    Iskanih rezultatov ponudnika <a href="https://prevoz.org/"
                                                    className="text-[#386890] font-sans font-semibold hover:underline hover:text-[#4169E1]">Prevozi</a> nismo
                    našli.
                </p>
            </div>
        );
    }

    return (
        <div className="container result-section mb-8">
            <h2 className="text-2xl font-semibold mb-4">Prevozi</h2>
            {results.map((route, index) => (
                <div key={index} className="mb-8">
                    <h3 className="text-xl font-semibold mb-2">
                        {route.from} to {route.to} ({route.count} trips)
                    </h3>
                    <div className="overflow-hidden rounded-lg shadow-md">
                        <table className="table-auto w-full bg-white rounded-md shadow-md">
                            <thead>
                            <tr>
                                <th className="px-4 py-2 bg-[#4682B4] text-white">Ura</th>
                                <th className="px-4 py-2 bg-[#4682B4] text-white">Oseba</th>
                                <th className="px-4 py-2 bg-[#4682B4] text-white">Cena</th>
                            </tr>
                            </thead>
                            <tbody>
                            {route.trips.map((trip, index) => (
                                <tr key={index}
                                    className={`hover:bg-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}>
                                    <td className="border px-4 py-2">{trip.time}</td>
                                    <td className="border px-4 py-2">{trip.description}</td>
                                    <td className="border px-4 py-2">{trip.price}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default ResultsPrevozi;