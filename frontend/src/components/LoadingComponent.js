import React from 'react';
import '../App.css';

function LoadingComponent({content}) {
    return (
        <div className="container loading-container">
            <img
                src={document.documentElement.classList.contains('dark') ? "/loading_spinner_dark.svg" : "/loading_spinner.svg"}
                alt="Loading..."
                className="loading-icon"
            />
            <p className="text-gray-800 dark:text-white text-md leading-relaxed italic text-center">{content}</p>
        </div>
    );
}

export default LoadingComponent;
