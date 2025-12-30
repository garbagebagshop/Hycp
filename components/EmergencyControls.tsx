import React from 'react';

interface Props {
  onOpenDraft: () => void;
}

export const EmergencyControls: React.FC<Props> = ({ onOpenDraft }) => {
  const handleCall = (num: string) => {
    window.location.href = `tel:${num}`;
  };

  return (
    <div className="flex flex-col gap-4 mb-8">
      <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3">
        <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <p className="text-[10px] font-black text-red-800 uppercase leading-relaxed tracking-tight">
          LEGAL NOTICE: False or misleading information may attract legal consequences under BNS/IPC.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleCall('100')}
          className="flex flex-col items-center justify-center p-6 bg-red-600 text-white rounded-[2rem] shadow-xl shadow-red-100 active:scale-95 transition-transform"
        >
          <span className="text-3xl font-black mb-1 tracking-tighter">100</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Emergency</span>
        </button>
        <button
          onClick={() => handleCall('1091')}
          className="flex flex-col items-center justify-center p-6 bg-pink-600 text-white rounded-[2rem] shadow-xl shadow-pink-100 active:scale-95 transition-transform"
        >
          <span className="text-3xl font-black mb-1 tracking-tighter">1091</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-pink-100">Women Help</span>
        </button>
      </div>

      <button
        onClick={onOpenDraft}
        className="w-full flex items-center justify-center gap-3 p-5 bg-white border-2 border-slate-900 text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-lg active:scale-[0.98] transition-all"
      >
        <span>📝</span> Prepare FIR draft
      </button>
    </div>
  );
};