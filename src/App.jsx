import React, { useState, useEffect } from 'react';
import { scanImage } from './utils/scanner';
import { solveLevel } from './utils/solver';
import Tube from './components/Tube';
import './App.css';

function App() {
  const [level, setLevel] = useState(null); // { tubes, colorMap }
  const [solution, setSolution] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, scanning, solving, ready

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus('scanning');
    try {
      const result = await scanImage(file);
      setLevel(result);
      setSolution(null);
      setCurrentStep(0);
      setStatus('ready');
    } catch (err) {
      console.error(err);
      alert("Failed to scan image");
      setStatus('idle');
    }
  };

  const handleSolve = () => {
    if (!level) return;
    setStatus('solving');
    
    // Allow UI to render before freezing with calculation
    setTimeout(() => {
      const result = solveLevel(level.tubes);
      if (result.success) {
        setSolution(result.steps);
        setCurrentStep(0);
      } else {
        alert("No solution found!");
      }
      setStatus('ready');
    }, 100);
  };

  // Compute the state of tubes at the current step
  const getCurrentState = () => {
    if (!level) return [];
    // Deep copy initial state
    let currentState = JSON.parse(JSON.stringify(level.tubes));
    
    if (solution) {
      for (let i = 0; i < currentStep; i++) {
        const { from, to } = solution[i];
        const color = currentState[from].shift();
        currentState[to].unshift(color);
      }
    }
    return currentState;
  };

  const displayedTubes = getCurrentState();

  return (
    <div className="container">
      <h1>Water Sort Solver</h1>
      
      <div className="controls">
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <button disabled={!level || status !== 'ready'} onClick={handleSolve}>
          {status === 'solving' ? 'Solving...' : 'Solve Level'}
        </button>
      </div>

      <div className="game-board">
        {displayedTubes.map((tubeColors, idx) => (
          <div key={idx} className="tube-wrapper">
             <Tube 
                colors={tubeColors} 
                colorMap={level?.colorMap || []}
                active={solution && solution[currentStep] && (solution[currentStep].from === idx || solution[currentStep].to === idx)}
             />
             <span className="tube-label">{idx}</span>
          </div>
        ))}
      </div>

      {solution && (
        <div className="player-controls">
           <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}>Prev</button>
           <span>Step {currentStep} / {solution.length}</span>
           <button onClick={() => setCurrentStep(Math.min(solution.length, currentStep + 1))}>Next</button>
           
           {currentStep < solution.length && (
             <div className="instruction">
               Move from <b>Tube {solution[currentStep].from}</b> to <b>Tube {solution[currentStep].to}</b>
             </div>
           )}
        </div>
      )}
    </div>
  );
}

export default App;