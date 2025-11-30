import React from 'react';

const Tube = ({ colors, colorMap, active }) => {
  // Pad with empty spots for visualization (4 max)
  const slots = [null, null, null, null];
  
  // Fill slots from bottom up visually, but data is Top->Bottom (0 is Top)
  // CSS Flex-col-reverse handles visual stacking, so we map directly.
  const displayColors = [...colors].reverse(); 

  return (
    <div 
      className={`tube ${active ? 'active' : ''}`}
      style={{
        border: '2px solid #ccc',
        borderBottomLeftRadius: '20px',
        borderBottomRightRadius: '20px',
        width: '40px',
        height: '140px',
        display: 'flex',
        flexDirection: 'column-reverse', // Stack from bottom
        overflow: 'hidden',
        margin: '10px',
        backgroundColor: '#222'
      }}
    >
      {displayColors.map((colorIndex, i) => (
        <div 
          key={i}
          style={{
            height: '25%',
            width: '100%',
            backgroundColor: colorMap[colorIndex],
            borderTop: '1px solid rgba(0,0,0,0.1)'
          }}
        />
      ))}
    </div>
  );
};

export default Tube;