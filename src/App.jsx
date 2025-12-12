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

  const handleSolve = (initialLevel) => {
    const levelToSolve = initialLevel || level;
    if (!levelToSolve) return;
    setStatus('solving');

    // Introduce a slight delay to allow the 'solving' status to display
    setTimeout(() => {
      const result = solveLevel(levelToSolve.tubes);
      if (result.success) {
        setSolution(result.steps);
        setCurrentStep(0);
      } else {
        alert("No solution found!");
      }
      setStatus('ready');
    }, 100);
  };

  // 1. Update handleImageUpload to call handleSolve immediately
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
      
      // Immediately trigger solve after setting the level state
      // Pass the result directly to ensure we use the new state
      handleSolve(result); 

    } catch (err) {
      console.error(err);
      alert("Failed to scan image");
      setStatus('idle');
    }
  };

  // 2. New function to copy the steps
  const handleCopySteps = () => {
    if (!solution || solution.length === 0) return;

    // Format steps as "1->2\n3->4\n..."
    const stepsText = solution
      .map((step, idx) => `${idx + 1}. ${step.from + 1}->${step.to + 1}`)
      .join('\n');

    navigator.clipboard.writeText(stepsText)
      .then(() => {
        alert("Steps copied to clipboard!");
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        alert("Failed to copy steps.");
      });
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
        {/* The 'Solve Level' button is now less necessary since solving is automatic, but we keep the logic just in case */}
        <button disabled={!level || status !== 'ready' || solution} onClick={() => handleSolve()}> 
          {status === 'solving' ? 'Solving...' : 'Solve Level'}
        </button>
      </div>

      {solution && (
        <div>
          <h3 style={{marginTop: 0}}>Steps ({solution.length}):</h3>
          {/* 3. Add the Copy Steps button here */}
          <button 
            onClick={handleCopySteps} 
            style={{ marginBottom: '10px', padding: '10px 15px', cursor: 'pointer' }}
          >
            📋 Copy Steps
          </button>
          <div style={{ 
            fontSize: '1.2rem', 
            lineHeight: '1.8',
            fontFamily: 'monospace'
          }}>
            {solution.map((step, idx) => (
              <div key={idx}>
                {/* Adding 1 to indices to match human-readable tube labels */}
                <strong>{idx+1}. {step.from + 1}&rarr;{step.to + 1}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Rest of the component remains the same --- */}
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
               Move from <b style={{color: '#ff4d4d'}}>Tube {solution[currentStep].from + 1}</b> to <b style={{color: '#4da6ff'}}>Tube {solution[currentStep].to + 1}</b>
             </div>
           )}
        </div>
      )}
    </div>
  );
}

export default App;