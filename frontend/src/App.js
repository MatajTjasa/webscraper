/*import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );

  export default App;
}*/
import logo from './images/logo.svg';
import React, { useEffect, useState } from 'react';

function App() {
  const [trainSchedules, setTrainSchedules] = useState([]);

  useEffect(() => {
    fetch('/api/train-schedules')
        .then(response => response.json())
        .then(data => setTrainSchedules(data))
        .catch(error => console.error('Error fetching train schedules:', error));
  }, []);

  return (
      <div className="App">
          <header className="App-header">
              <img src={logo} className="App-logo" alt="logo"/>
              <p>
                  Edit <code>src/App.js</code> and save to reload.
              </p>
              <a
                  className="App-link"
                  href="https://reactjs.org"
                  target="_blank"
                  rel="noopener noreferrer"
              >
                  Learn React
              </a>
          </header>

        <h1>Train Schedules</h1>
        <ul>
            {trainSchedules.map((schedule, index) => (
                <li key={index}>
                    {schedule.departureStation} to {schedule.arrivalStation} at {schedule.departureTime} - {schedule.trainType}
                </li>
            ))}
        </ul>
    </div>
);
}

export default App;
