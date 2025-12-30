import React, { useState, useMemo } from 'react';
import { Station, Commissionerate } from '../types';
import { POLICE_STATIONS } from '../constants';

interface Props {
  station: Station;
  userCoords?: { lat: number, lng: number } | null;
}

// Distance helper for internal neighbors
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

export const StationCard: React.FC<Props> = ({ station, userCoords }) => {
  const [showMap, setShowMap] = useState(false);

  const handleCall = (num: string) => {
    const cleanNum = num.replace(/[^0-9]/g, '');
    window.location.href = `tel:${cleanNum}`;
  };

  const handleNavigate = () => {
    let url = '';
    if (userCoords) {
      url = `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${station.lat},${station.lng}&travelmode=driving`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${station.lat},${station.lng}`;
    }
    window.open(url, '_blank');
  };

  const neighbors = useMemo(() => {
    return POLICE_STATIONS
      .filter(s => s.id !== station.id)
      .map(s => ({
        ...s,
        dist: getDistanceKm(station.lat, station.lng, s.lat, s.lng)
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 2);
  }, [station]);

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

  const mapEmbedUrl = `https://maps.google.com/maps?q=${station.lat},${station.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="bg-white rounded-[2.5rem] p-5 sm:p-7 shadow-sm border border-slate-100 flex flex-col items-stretch gap-5 transition-all active:shadow-md active:border-slate-200">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[9px] font-black px-2.5 py-1.5 rounded-xl border uppercase tracking-wider ${badgeColor(station.commissionerate)}`}>
            {station.commissionerate}
          </span>
          <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
            ID: {station.id.toUpperCase()}
          </div>
        </div>
        
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">{station.name}</h3>
          <button 
            onClick={() => setShowMap(!showMap)}
            className={`flex-shrink-0 ml-4 p-3 rounded-2xl border transition-all ${
              showMap ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-400 border-slate-100 active:bg-slate-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </button>
        </div>
        
        {showMap && (
          <div className="mb-6 animate-in zoom-in-95 slide-in-from-top-4 duration-300">
            <div className="relative h-48 w-full bg-slate-100 rounded-[1.8rem] overflow-hidden border border-slate-200 shadow-inner">
               <iframe 
                src={mapEmbedUrl}
                className="absolute inset-0 w-full h-full grayscale-[20%] opacity-90"
                frameBorder="0"
                allowFullScreen
                loading="lazy"
               ></iframe>
               <div className="absolute bottom-3 right-3">
                 <button 
                  onClick={handleNavigate}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-lg flex items-center gap-2 active:scale-95 transition-transform"
                 >
                   <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                     <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                   </svg>
                   DIRECTIONS
                 </button>
               </div>
            </div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-3 px-1">
              {userCoords ? 'Calculated route from current location' : 'Station location on map'}
            </p>
          </div>
        )}

        <div className="mb-4 px-2">
          <p className="text-[8px] font-black text-red-500 uppercase tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
            False reporting attracts legal action
          </p>
        </div>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleCall(station.phone)}
            className="group flex items-center justify-between w-full p-3.5 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200 active:scale-[0.98] transition-all"
          >
            <div className="text-left pl-1 overflow-hidden">
               <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Landline (24/7)</p>
               <p className="text-base sm:text-lg font-black tracking-tight whitespace-nowrap">{station.phone}</p>
            </div>
            <div className="flex-shrink-0 h-11 w-11 bg-white/10 rounded-xl flex items-center justify-center ml-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </button>
          
          {station.mobile && (
            <button
              onClick={() => handleCall(station.mobile!)}
              className="flex items-center justify-between w-full p-3.5 bg-white border border-slate-200 text-slate-900 rounded-2xl active:bg-slate-50 transition-all"
            >
              <div className="text-left pl-1 overflow-hidden">
                 <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">SHO Official CUG</p>
                 <p className="text-sm sm:text-base font-bold text-slate-800 whitespace-nowrap">{station.mobile}</p>
              </div>
              <div className="flex-shrink-0 h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center ml-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
            </button>
          )}
        </div>

        {/* Nearby Alternatives Section */}
        <div className="mt-6 pt-6 border-t border-slate-50">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">Nearby Alternatives</p>
          <div className="flex gap-2">
            {neighbors.map(neighbor => (
              <div 
                key={`neighbor-${neighbor.id}`}
                className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-1 cursor-pointer active:bg-slate-100 transition-colors"
                onClick={() => handleCall(neighbor.mobile || neighbor.phone)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-900 truncate pr-1">{neighbor.name}</span>
                  <svg className="w-2.5 h-2.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                  </svg>
                </div>
                <p className="text-[7px] font-bold text-slate-400 uppercase truncate">~{neighbor.dist.toFixed(1)} km</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};