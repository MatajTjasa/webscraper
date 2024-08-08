import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import SearchForm from './components/SearchForm';
import Results from './components/Results';
import './App.css';

function AppWrapper() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<SearchForm/>}/>
                <Route path="/od:departure/do:destination/datum:date" element={<Results/>}/>
            </Routes>
        </Router>
    );
}

export default AppWrapper;
