import React, {useState} from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import {DestinationsProvider} from './context/DestinationsContext';
import SearchForm from './components/SearchForm';
import SearchPage from './components/SearchPage';
import './App.css';

function App() {
    const [darkMode, setDarkMode] = useState(false);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.documentElement.classList.toggle('dark', !darkMode);
    };

    return (
        <DestinationsProvider>
            <Router>
                <div className="flex justify-between items-center p-4">
                    {/* We only render the dark mode toggle here */}
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