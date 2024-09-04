import React, {useEffect} from 'react';
import './App.css';

function App() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            console.log('Service Worker support detected');
            navigator.serviceWorker.ready
                .then(async (registration) => {
                    console.log('Service worker registration successful:', registration);
                    const subscription = await registration.pushManager.getSubscription();

                    if (!subscription) {
                        const newSubscription = await subscribeUser(registration);
                        console.log('User subscribed:', newSubscription);
                    } else {
                        console.log('User is already subscribed:', subscription);
                    }
                })
                .catch(err => console.error('Service Worker registration error:', err));
        }
    }, []);

    const subscribeUser = async (registration) => {
        const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        try {
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });

            await fetch('http://localhost:4000/subscribe', {
                method: 'POST',
                body: JSON.stringify(subscription),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log('subscribed !!!!')
            return subscription;
        } catch (err) {
            console.error('Failed to subscribe user:', err);
        }
    };

    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Welcome to NotifyMe</h1>
                <p>Subscribe to VlakAvtoBus notifications to stay updated.</p>
            </header>
        </div>
    );
}

export default App;