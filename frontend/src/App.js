import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import SearchPage from './components/SearchPage';
import {DestinationsProvider} from './context/DestinationsContext';
import './App.css';

function App() {
    return (
        <DestinationsProvider>
            <Router>
                <Routes>
                    <Route path="/search" element={<SearchPage/>}/>
                    <Route path="/" element={<SearchPage/>}/>
                </Routes>
            </Router>
        </DestinationsProvider>
    );
}

export default App;