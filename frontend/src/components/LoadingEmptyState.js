import React from 'react';
import LoadingComponent from '../components/LoadingComponent';

function LoadingEmptyState(Component, providerName, providerUrl) {
    return function WrappedComponent({results, isLoading}) {
        const isResultsEmpty = (res) => {
            if (!res) return true;
            if (Array.isArray(res)) return res.length === 0;

            const mainEmpty = !res.main || res.main.length === 0;
            const nearbyDepEmpty = !res.nearbyDepartures || res.nearbyDepartures.length === 0;
            const nearbyDestEmpty = !res.nearbyDestinations || res.nearbyDestinations.length === 0;

            return mainEmpty && nearbyDepEmpty && nearbyDestEmpty;
        };

        if (isLoading) {
            return (
                <LoadingComponent content={
                    <>
                        Pridobivanje podatkov iz strani <a href={providerUrl}
                                                           target="_blank"
                                                           rel="noopener noreferrer"
                                                           className="text-[#386890] font-sans font-semibold hover:underline hover:text-[#4169E1] dark:text-purple-500 dark:hover:text-purple-400">{providerName}</a>...
                    </>
                }/>
            );
        }

        if (isResultsEmpty(results)) {
            return (
                <div className="container result-section mb-8">
                    <p className="text-gray-800 dark:text-white text-xs md:text-sm lg:text-base leading-relaxed italic text-center">
                        Iskanih rezultatov ponudnika{' '}
                        <a
                            href={providerUrl}
                            className="text-[#386890] font-sans font-semibold hover:underline hover:text-[#4169E1] dark:text-purple-500 dark:hover:text-purple-400"
                        >
                            {providerName}
                        </a>{' '}
                        nismo našli.
                    </p>
                </div>
            );
        }

        return <Component results={results}/>;
    };
}

export default LoadingEmptyState;