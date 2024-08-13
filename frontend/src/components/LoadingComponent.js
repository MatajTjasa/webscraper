import React from 'react';
import '../App.css';

//import busLoading from '../../public/bus_loading.svg'; // Import the SVG file

function LoadingComponent({text}) {
    return (
        <div className="loading-container">
            <img src="/loading_spinner.svg" alt="Loading..." className="loading-icon"/>
            <p>{text}</p>
        </div>
    );
}

export default LoadingComponent;
