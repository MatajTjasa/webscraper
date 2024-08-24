import React from 'react';
import LoadingComponent from '../components/LoadingComponent';

function LoadingEmptyState(Component, providerName, providerUrl) {
    return function WrappedComponent({results, isLoading}) {
        if (isLoading) {
            return (
                <LoadingComponent content={
                    <>
                        Pridobivanje podatkov iz strani <a href={providerUrl}
                                                           target="_blank"
                                                           rel="noopener noreferrer"
                                                           className="text-[#386890] font-sans font-semibold hover:underline hover:text-[#4169E1]">{providerName}</a>...
                    </>
                }/>
            );
        }

        if (!Array.isArray(results) || results.length === 0) {
            return (
                <div className="container result-section mb-8">
                    <p className="text-gray-800 text-md leading-relaxed italic text-center">
                        Iskanih rezultatov ponudnika <a href={providerUrl}
                                                        className="text-[#386890] font-sans font-semibold hover:underline hover:text-[#4169E1]">{providerName}</a> nismo
                        našli.
                    </p>
                </div>
            );
        }

        return <Component results={results}/>;
    };
}

export default LoadingEmptyState;
