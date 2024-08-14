import React from 'react';
import '../App.css';

function LoadingComponent({text}) {
    return (
        <div className="loading-container">
            <img src="/loading_spinner.svg" alt="Loading..." className="loading-icon"/>
            <p>{text}</p>
        </div>
    );
}

export default LoadingComponent;