import React from 'react';

function NearbyStations({destination, label}) {
    if (!destination?.Postaje?.length) return null;

    return (
        <div className="mt-4">
            <p className="text-sm text-gray-500">{label}</p>
            <ul className="list-disc ml-6 mt-1 text-sm text-gray-700">
                {destination.Postaje?.length > 0 && (
                    <ul>
                        {destination.Postaje.map((postaja, index) => (
                            <li key={index}>
                                • {postaja.Ime} ({postaja.Vlak ? "vlak" : postaja.APMS ? "APMS" : postaja.Arriva ? "Arriva" : "prevoz"})
                            </li>
                        ))}
                    </ul>
                )}
            </ul>
        </div>
    );
}

export default NearbyStations;
