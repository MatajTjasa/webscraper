import React, {useEffect} from 'react';

function LoadingSpinner() {
    useEffect(() => {
        // Initialize the loader
        const ldld = new window.ldloader({root: '.ldld'});

        return () => {
            // Clean up loader instance if needed
            ldld.toggle(false);
        };
    }, []);

    return (
        <div className="flex justify-center mt-4">
            <div className="ldld full"></div>
        </div>
    );
}

export default LoadingSpinner;
