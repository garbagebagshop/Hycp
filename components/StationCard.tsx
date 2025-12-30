
import React from 'react';
import { Station, Commissionerate } from '../types';

interface Props {
  station: Station;
}

export const StationCard: React.FC<Props> = ({ station }) => {
  const handleCall = (num: string) => {
    // Zero friction: strip formatting and call
    const cleanNum = num.replace(/[^0-9]/g, '');
    window.location.href = `tel:${cleanNum}`;
  };

  const badgeColor = (comm: Commissionerate) => {
    switch (comm) {
      case Commissionerate.HYDERABAD_CITY: return 'bg-blue-50 text-blue-600 border-blue-100';
      case Commissionerate.CYBERABAD: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case Commissionerate.RACHAKONDA: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case Commissionerate.WOMEN_PS: return 'bg-pink-50 text-pink-600 border-pink-100';
      case Commissionerate.BHAROSA: return 'bg-purple-50 text-purple-600 border-purple-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all active:shadow-md active:border-slate-200">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-tighter ${badgeColor(station.commissionerate)}`}>
            {station.commissionerate}
          </span>
        </div>
        <h3 className="text-xl font-black text-slate-900 leading-tight mb-1">{station.name}</h3>
        <p className="text-sm text-slate-400 font-bold tracking-tight">{station.phone}</p>
      </div>
      
      <div className="flex gap-3 w-full sm:w-auto">
        <button
          onClick={() => handleCall(station.phone)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-200 active:scale-[0.98] transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          CALL NOW
        </button>
        {station.secondaryPhone && (
          <button
            onClick={() => handleCall(station.secondaryPhone!)}
            className="px-6 py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-xs active:bg-slate-200 transition-all uppercase tracking-widest"
          >
            Alt
          </button>
        )}
      </div>
    </div>
  );
};
