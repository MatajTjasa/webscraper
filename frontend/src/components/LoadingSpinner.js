import React, {useEffect} from 'react';

function LoadingSpinner() {
    useEffect(() => {
        // Check if ldLoader is loaded correctly
        if (window.ldLoader) {
            const ldld = new window.ldLoader({root: '.ldld'});
            ldld.on();  // Turn on the loader

            // Cleanup to turn off the loader on unmount
            return () => ldld.off();
        } else {
            console.error('ldLoader is not available.');
        }
    }, []);

    return (
        <div className="spinner-container">
            <img
                className="ldld"
                src={`././public/spinner.svg`}  // fix
                alt="Loading..."
            />
        </div>
    );
}

export default LoadingSpinner;
