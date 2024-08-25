import React, {useState, useRef, useContext, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {DestinationsContext} from '../context/DestinationsContext';

function SearchForm({initialDeparture, initialDestination, initialDate, errorMessage}) {
    const {destinations, loading, error} = useContext(DestinationsContext);
    const [departure, setDeparture] = useState(initialDeparture || '');
    const [date, setDate] = useState('');
    const [destination, setDestination] = useState(initialDestination || '');
    const [departureDropdownActive, setDepartureDropdownActive] = useState(false);
    const [destinationDropdownActive, setDestinationDropdownActive] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localErrorMessage, setLocalErrorMessage] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const navigate = useNavigate();
    const departureRef = useRef(null);
    const destinationRef = useRef(null);

    useEffect(() => {
        if (!initialDate) {
            const options = {timeZone: 'Europe/Ljubljana', year: 'numeric', month: '2-digit', day: '2-digit'};
            const slovenianTime = new Intl.DateTimeFormat('en-GB', options).format(new Date());
            const [day, month, year] = slovenianTime.split('/');
            setDate(`${year}-${month}-${day}`);
        } else {
            setDate(initialDate);
        }
    }, [initialDate]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (departureRef.current && !departureRef.current.contains(event.target)) {
                setDepartureDropdownActive(false);
            }
            if (destinationRef.current && !destinationRef.current.contains(event.target)) {
                setDestinationDropdownActive(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [departureRef, destinationRef]);

    const validateInputs = () => {
        if (!departure || !destination || !date) {
            setLocalErrorMessage('Prosim zapolni vsa polja.');
            return false;
        }

        const validDestination = destinations.some(dest => dest.Kraj.toLowerCase() === destination.toLowerCase());

        if (!validDestination) {
            setLocalErrorMessage('Neveljavna destinacija. Prosim izberi veljavno destinacijo.');
            return false;
        }

        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setHasSubmitted(true);

        if (isSubmitting) return;

        if (!validateInputs()) return;

        setIsSubmitting(true);

        navigate(`/search?departure=${departure}&destination=${destination}&date=${date}`);

        setTimeout(() => {
            setIsSubmitting(false);
        }, 500);
    };

    const handleSwap = () => {
        const temp = departure;
        setDeparture(destination);
        setDestination(temp);

        const validDestination = destinations.some(dest => dest.Kraj.toLowerCase() === destination.toLowerCase());

        if (!validDestination) {
            setLocalErrorMessage('Neveljavna destinacija. Prosim izberi veljavno destinacijo.');
            return;
        }

        setLocalErrorMessage('');
    };

    return (
        <div className="App">
            <div className="cloud" style={{top: '50px', left: '50px'}}></div>
            <div className="cloud" style={{top: '100px', left: '250px'}}></div>
            <div className="cloud" style={{top: '150px', right: '50px'}}></div>
            <div
                className="container bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-90 p-8 rounded-lg shadow-lg relative z-10">
                <header className="App-header text-center">
                    <h1 className="text-[#4682B4] dark:text-purple-300 mb-8 text-4xl font-semibold">Vlak, avto, bus
                        urniki</h1>
                    <form onSubmit={handleSubmit} className="flex flex-wrap justify-center items-center space-x-4">
                        <div className="custom-dropdown-container relative w-52" ref={departureRef}>
                            <input
                                type="text"
                                placeholder="Kraj odhoda"
                                value={departure}
                                onChange={(e) => setDeparture(e.target.value)}
                                className="custom-dropdown px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md w-full bg-white dark:bg-gray-700 text-black dark:text-white"
                                onClick={() => setDepartureDropdownActive(!departureDropdownActive)}
                            />
                            {departureDropdownActive && destinations.length > 0 && (
                                <div
                                    className="custom-dropdown-list absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md mt-1 max-h-40 overflow-y-auto text-left">
                                    {destinations
                                        .filter(dest => dest.Kraj.toLowerCase().includes(departure.toLowerCase()))
                                        .map((dest, index) => (
                                            <div
                                                key={index}
                                                onClick={() => {
                                                    setDeparture(dest.Kraj);
                                                    setDepartureDropdownActive(false);
                                                }}
                                                className="px-4 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-gray-600"
                                            >
                                                {dest.Kraj}
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>

                        {/* Swap Button */}
                        <button
                            type="button"
                            onClick={handleSwap}
                            className="swap-button mx-2 px-4 py-2 bg-[#4682B4] dark:bg-purple-500 text-white rounded-md text-lg hover:bg-[#4169E1] dark:hover:bg-purple-600"
                        >
                            ⇆
                        </button>

                        <div className="custom-dropdown-container relative w-52" ref={destinationRef}>
                            <input
                                type="text"
                                placeholder="Kraj prihoda"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                className="custom-dropdown px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md w-full bg-white dark:bg-gray-700 text-black dark:text-white"
                                onClick={() => setDestinationDropdownActive(!destinationDropdownActive)}
                            />
                            {destinationDropdownActive && destinations.length > 0 && (
                                <div
                                    className="custom-dropdown-list absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md mt-1 max-h-40 overflow-y-auto text-left">
                                    {destinations
                                        .filter(dest => dest.Kraj.toLowerCase().includes(destination.toLowerCase()))
                                        .map((dest, index) => (
                                            <div
                                                key={index}
                                                onClick={() => {
                                                    setDestination(dest.Kraj);
                                                    setDestinationDropdownActive(false);
                                                }}
                                                className="px-4 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-gray-600"
                                            >
                                                {dest.Kraj}
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>

                        <div className="custom-dropdown-container relative w-52">
                            <input
                                type="date"
                                placeholder="Date (dd.mm.yyyy)"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="custom-date px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md w-full bg-white dark:bg-gray-700 text-black dark:text-white"
                            />
                        </div>

                        <button
                            type="submit"
                            className="px-8 py-2 bg-[#4682B4] dark:bg-purple-500 text-white rounded-md text-lg hover:bg-[#4169E1] dark:hover:bg-purple-600 ml-4"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Iskanje...' : 'Išči'}
                        </button>
                    </form>
                    {(hasSubmitted && (localErrorMessage || errorMessage || error)) &&
                        <p className="error-message text-red-500 dark:text-red-300 mt-4">{localErrorMessage || errorMessage || error}</p>}
                </header>
            </div>
        </div>
    );
}

export default SearchForm;