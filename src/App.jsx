import React, { useState } from 'react';
import { scanImage } from './utils/scanner';
import { solveLevel } from './utils/solver';
import Tube from './components/Tube';
import './App.css';

function App() {
  const [level, setLevel] = useState(null);
  const [solution, setSolution] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState('idle');

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

  const getCurrentState = () => {
    if (!level) return [];
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

      {/* --- UPDATED STYLE INLINE FOR GRID --- */}
      <div className="game-board" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '20px',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        {displayedTubes.map((tubeColors, idx) => (
          <div key={idx} className="tube-wrapper" style={{ textAlign: 'center' }}>
             <Tube 
                colors={tubeColors} 
                colorMap={level?.colorMap || []}
                active={solution && solution[currentStep] && (solution[currentStep].from === idx || solution[currentStep].to === idx)}
             />
             <div className="tube-label" style={{ marginTop: '5px', fontWeight: 'bold' }}>{idx + 1}</div>
          </div>
        ))}
      </div>

      {solution && (
        <div className="player-controls">
           <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}>Prev</button>
           <span style={{ margin: '0 15px' }}>Step {currentStep} / {solution.length}</span>
           <button onClick={() => setCurrentStep(Math.min(solution.length, currentStep + 1))}>Next</button>
           
           {currentStep < solution.length && (
             <div className="instruction" style={{ marginTop: '20px', fontSize: '1.2em' }}>
                Move from <b style={{color: '#ff4d4d'}}>Tube {solution[currentStep].from}</b> to <b style={{color: '#4da6ff'}}>Tube {solution[currentStep].to}</b>
             </div>
           )}
        </div>
      )}
    </div>
  );
}

export default App;