import React from 'react';

const LoadingSpinner = ({ text = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-r-2 border-accent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      <p className="text-text-secondary font-medium animate-pulse">{text}</p>
    </div>
  );
};

export default LoadingSpinner;
