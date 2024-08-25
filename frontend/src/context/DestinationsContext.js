import React, {createContext, useState, useEffect} from 'react';
import axios from 'axios';

export const DestinationsContext = createContext();

export const DestinationsProvider = ({children}) => {
    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDestinations = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/webscraper/destinations`);
                setDestinations(response.data);
            } catch (error) {
                if (error.response && error.response.status === 429) {
                    setError('Ups, preveč zahtev! Počakaj malo in poskusi znova.');
                } else {
                    setError('Nekaj je šlo narobe pri iskanju destinacij. Poskusi znova kasneje.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDestinations();
    }, []);

    return (
        <DestinationsContext.Provider value={{destinations, loading, error}}>
            {children}
        </DestinationsContext.Provider>
    );
};
