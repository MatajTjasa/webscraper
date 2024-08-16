import React from 'react';
import '../App.css';

function LoadingComponent({content}) {
    return (
        <div className="loading-container">
            <img src="/loading_spinner.svg" alt="Loading..." className="loading-icon"/>
            <p>{content}</p>
        </div>
    );
}

export default LoadingComponent;
