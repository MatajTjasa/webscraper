import React, {useState, useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import {DestinationsProvider} from './context/DestinationsContext';
import SearchForm from './components/SearchForm';
import SearchPage from './components/SearchPage';
import './App.css';

function App() {
    const [darkMode, setDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('darkMode');
        return savedMode === 'true' || false;
    });

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('darkMode', newMode);
        document.documentElement.classList.toggle('dark', newMode);
    };

    // Set the initial dark mode class based on the stored preference
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    return (
        <DestinationsProvider>
            <Router>
                <div className="flex justify-between items-center p-4">
                    <button
                        className="text-2xl text-gray-800 dark:text-white hover:text-blue-500 absolute top-4 right-4"
                        onClick={toggleDarkMode}
                    >
                        {darkMode ? '🌙' : '☀️'}
                    </button>
                </div>
                <Routes>
                    <Route path="/search" element={<SearchPage/>}/>
                    <Route path="/" element={<SearchForm/>}/>
                </Routes>
            </Router>
        </DestinationsProvider>
    );
}

export default App;