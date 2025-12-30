
import React from 'react';

export const EmergencyControls: React.FC = () => {
  const handleCall = (num: string) => {
    window.location.href = `tel:${num}`;
  };

  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      <button
        onClick={() => handleCall('100')}
        className="flex flex-col items-center justify-center p-6 bg-red-600 text-white rounded-2xl shadow-lg active:scale-95 transition-transform"
      >
        <span className="text-3xl font-black mb-1">100</span>
        <span className="text-xs font-bold uppercase tracking-wider">Emergency</span>
      </button>
      <button
        onClick={() => handleCall('1091')}
        className="flex flex-col items-center justify-center p-6 bg-pink-600 text-white rounded-2xl shadow-lg active:scale-95 transition-transform"
      >
        <span className="text-3xl font-black mb-1">1091</span>
        <span className="text-xs font-bold uppercase tracking-wider">Women Help</span>
      </button>
    </div>
  );
};
