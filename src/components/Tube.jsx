import React from 'react';

const Tube = ({ colors, colorMap, active }) => {
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
        flexDirection: 'column-reverse',
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