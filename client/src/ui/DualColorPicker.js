import React, { useState, useEffect } from 'react';
import { generateGradient } from '../utils/gradientUtils';

const DualColorPicker = ({ 
  color1, 
  color2, 
  onColor1Change, 
  onColor2Change, 
  storageKey1, 
  storageKey2,
  defaultColor1,
  defaultColor2,
  position = { top: 12, right: 16 }
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Handle clicking outside color picker modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      const colorPicker = document.querySelector('.dual-color-picker-icon');
      const modal = document.querySelector('.color-picker-modal');
      
      if (showColorPicker && colorPicker && modal) {
        if (!colorPicker.contains(event.target) && !modal.contains(event.target)) {
          setShowColorPicker(false);
        }
      }
    };

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

  const handleReset = () => {
    onColor1Change(defaultColor1);
    onColor2Change(defaultColor2);
    // Clear localStorage
    if (storageKey1) localStorage.removeItem(storageKey1);
    if (storageKey2) localStorage.removeItem(storageKey2);
  };

  return (
    <>
      {/* Dual Color Picker Button */}
      <svg 
        className="dual-color-picker-icon"
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        style={{
          position: 'absolute',
          top: position.top,
          right: position.right,
          color: '#fff',
          cursor: 'pointer',
          zIndex: 2
        }}
        onClick={() => setShowColorPicker(!showColorPicker)}
      >
        <path d="M19.03 5.92l-1.06-1.06a2.12 2.12 0 0 0-3 0l-1.06 1.06 4.06 4.06 1.06-1.06a2.12 2.12 0 0 0 0-3z"/>
        <path d="M4 20h4l10.07-10.07-4.06-4.06L4 16v4z"/>
      </svg>

      {/* Color Picker Modal */}
      {showColorPicker && (
        <div
          className="color-picker-modal"
          style={{
            position: 'absolute',
            top: position.top + 38,
            right: position.right,
            width: 200,
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 10,
            padding: '16px',
            border: '1px solid rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#333', whiteSpace: 'nowrap' }}>
            Customize Gradient Colors
          </div>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Color 1</div>
              <input
                type="color"
                value={color1}
                onChange={e => onColor1Change(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Color 2</div>
              <input
                type="color"
                value={color2}
                onChange={e => onColor2Change(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              color: '#6c757d',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e9ecef';
              e.target.style.borderColor = '#adb5bd';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f8f9fa';
              e.target.style.borderColor = '#dee2e6';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M3 21v-5h5"/>
            </svg>
            Reset to Default
          </button>
        </div>
      )}
    </>
  );
};

export default DualColorPicker; 