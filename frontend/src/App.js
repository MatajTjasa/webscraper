import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import SearchForm from './components/SearchForm';
import SearchPage from './components/SearchPage';
import './App.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/search" element={<SearchPage/>}/> {/* Use SearchPage here */}
                <Route path="/" element={<SearchForm/>}/>
            </Routes>
        </Router>
    );
}

export default App;
