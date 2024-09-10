import React, {useState, useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import {DestinationsProvider} from './context/DestinationsContext';
import SearchForm from './components/SearchForm';
import SearchPage from './components/SearchPage';
import './App.css';

function App() {
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode === 'true') {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('darkMode', newMode ? 'true' : 'false');
        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const stars = Array.from({length: 100}, (_, i) => (
        <div key={i} className="star" style={{
            top: `${Math.random() * 100}vh`,
            left: `${Math.random() * 100}vw`,
        }}></div>
    ));

    useEffect(() => {
        const setVh = () => {
            let vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setVh();
        window.addEventListener('resize', setVh);

        return () => window.removeEventListener('resize', setVh);
    }, []);

    return (
        <DestinationsProvider>
            <Router>
                {darkMode ? (
                    <div style={{
                        width: '100vw',
                        height: 'calc(var(--vh, 1vh) * 100)',
                        backgroundColor: '#000000FF',
                        backgroundImage: 'linear-gradient(to bottom right, #071526 10%, #030d18 30%, #29056d 50%, #000000 80%, #000 100%)',
                        transition: 'background 0.5s ease, color 0.5s ease',
                        backgroundAttachment: 'fixed',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        color: '#ccc',
                        zIndex: '-1',
                        position: 'fixed',
                        top: '0'
                    }}></div>
                ) : (
                    <div style={{
                        width: '100vw',
                        height: 'calc(var(--vh, 1vh) * 100)',
                        backgroundColor: '#1E8EFD',
                        overflowX: 'hidden',
                        overflowY: 'auto',
                        backgroundImage: 'linear-gradient(to bottom right, #fff, #eae7df 15%, #6DB3F2 60%, #1E8EFD 80%, #B4ECF0)',
                        transition: 'background 0.5s ease, color 0.5s ease',
                        backgroundAttachment: 'fixed',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        zIndex: '-1',
                        position: 'fixed',
                        top: '0'
                    }}></div>
                )}
                <div className="flex justify-between items-center p-4">
                    <button
                        className="text-2xl text-gray-800 dark:text-white hover:text-blue-500 absolute top-4 right-4"
                        onClick={toggleDarkMode}
                    >
                        {!darkMode ? '🌙' : '☀️'}
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