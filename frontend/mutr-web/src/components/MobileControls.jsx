import React from 'react';
import { Joystick } from 'react-joystick-component';
import './MobileControls.css';

const MobileControls = ({ onMove, onStop }) => {
  return (
    <div className="mobile-controls-container">
      <Joystick 
        size={100} 
        sticky={false} 
        baseColor="rgba(255, 255, 255, 0.2)" 
        stickColor="rgba(255, 255, 255, 0.5)" 
        move={onMove} 
        stop={onStop} 
      />
    </div>
  );
};

export default MobileControls;