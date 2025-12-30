import React from 'react';
import { Station, Commissionerate } from '../types';

interface Props {
  station: Station;
}

export const StationCard: React.FC<Props> = ({ station }) => {
  const handleCall = (num: string) => {
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
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col items-stretch gap-6 transition-all active:shadow-md active:border-slate-200">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-tighter ${badgeColor(station.commissionerate)}`}>
            {station.commissionerate}
          </span>
          {station.mobile && (
            <div className="flex items-center gap-1 text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              CUG VERIFIED
            </div>
          )}
        </div>
        <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2">{station.name}</h3>
        
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
             <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Landline</p>
             <p className="text-sm font-bold text-slate-700">{station.phone}</p>
          </div>
          {station.mobile && (
            <div className="p-3 bg-blue-50/40 rounded-2xl border border-blue-100">
               <p className="text-[9px] font-black text-blue-500 uppercase mb-1">Official CUG</p>
               <p className="text-sm font-bold text-blue-800">{station.mobile}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        {station.mobile && (
          <button
            onClick={() => handleCall(station.mobile!)}
            className="flex items-center justify-center gap-3 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-200 active:scale-[0.98] transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            CALL SHO (OFFICIAL)
          </button>
        )}
        <button
          onClick={() => handleCall(station.phone)}
          className="flex items-center justify-center gap-3 w-full py-4 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl font-black text-sm active:bg-slate-50 transition-all"
        >
          CALL LANDLINE
        </button>
      </div>
    </div>
  );
};