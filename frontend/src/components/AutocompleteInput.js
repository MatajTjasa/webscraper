import React, {useState, useRef, useContext, useEffect} from 'react';
import {DestinationsContext} from '../context/DestinationsContext';

function AutocompleteInput({value, onChange, label, dropdownActive, setDropdownActive}) {
    const {destinations} = useContext(DestinationsContext);
    const [filteredOptions, setFilteredOptions] = useState([]);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setDropdownActive(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setDropdownActive]);

    useEffect(() => {
        const inputLower = value.toLowerCase();

        if (!inputLower) {
            setFilteredOptions(destinations.map(dest => ({label: dest.Kraj, type: 'kraj'})));
            return;
        }

        const kraji = destinations
            .filter(dest => dest.Kraj.toLowerCase().includes(inputLower))
            .map(dest => ({label: dest.Kraj, type: 'kraj'}));

        const postaje = destinations.flatMap(dest =>
            (dest.Postaje || [])
                .filter(post => post.Ime.toLowerCase().includes(inputLower))
                .map(post => ({label: post.Ime, type: 'postaja'}))
        );

        setFilteredOptions([...kraji, ...postaje]);
    }, [value, destinations]);

    return (
        <div className="custom-dropdown-container relative w-full sm:w-44" ref={containerRef}>
            <input
                ref={inputRef}
                type="text"
                placeholder={label}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="custom-dropdown px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md w-full bg-white dark:bg-gray-700 text-black dark:text-white"
                onClick={() => setDropdownActive(true)}
            />
            {dropdownActive && filteredOptions.length > 0 && (
                <div
                    className="custom-dropdown-list absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md mt-1 max-h-40 overflow-y-auto text-left">
                    {filteredOptions.map((option, index) => (
                        <div
                            key={index}
                            onClick={() => {
                                onChange(option.label);
                                setDropdownActive(false);
                            }}
                            className="px-4 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-gray-600"
                        >
                            {option.label} {option.type === 'postaja' &&
                            <span className="text-xs text-gray-400">(postaja)</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AutocompleteInput;