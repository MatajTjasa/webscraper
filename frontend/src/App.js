import React, {useState, useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import {DestinationsProvider} from './context/DestinationsContext';
import SearchForm from './components/SearchForm';
import SearchPage from './components/SearchPage';
import './App.css';

function App() {
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const savedMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedMode);
        document.documentElement.classList.toggle('dark', savedMode);
    }, []);

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('darkMode', newMode ? 'true' : 'false');
        document.documentElement.classList.toggle('dark', newMode);
    };

    const stars = Array.from({length: 100}, (_, i) => (
        <div key={i} className="star" style={{
            top: `${Math.random() * 100}vh`,
            left: `${Math.random() * 100}vw`,
        }}></div>
    ));

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
                {darkMode && <div className="stars">{stars}</div>}
                <Routes>
                    <Route path="/search" element={<SearchPage/>}/>
                    <Route path="/" element={<SearchForm/>}/>
                </Routes>
                <footer className="italic mt-8 py-4 text-center text-gray-100 text-base">
                    <p>
                        Vsi urniki javnega prevoza so javno dostopni. Ta stran jih le prikazuje na enem mestu.
                    </p>
                </footer>
            </Router>
        </DestinationsProvider>
    );
}

export default App;