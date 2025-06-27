import React from 'react';

const ResetColorButton = ({ 
  onReset, 
  position = { top: 12, right: 50 }
}) => {
  return (
    <button
      onClick={onReset}
      style={{
        position: 'absolute',
        top: position.top,
        right: position.right,
        background: 'rgba(255, 255, 255, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '6px',
        color: '#fff',
        padding: '4px 8px',
        fontSize: '0.75rem',
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.target.style.background = 'rgba(255, 255, 255, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
      }}
    >
      Reset
    </button>
  );
};

export default ResetColorButton; 