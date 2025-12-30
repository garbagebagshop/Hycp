import React, { useState, useMemo, useCallback, useRef } from 'react';
import { POLICE_STATIONS } from './constants';
import { Commissionerate, Station } from './types';
import { EmergencyControls } from './components/EmergencyControls';
import { StationCard } from './components/StationCard';

// Mathematical function to calculate distance between two GPS points
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<Commissionerate | 'All'>('All');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [nearbyStations, setNearbyStations] = useState<Station[]>([]);
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredStations = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return POLICE_STATIONS.filter((station) => {
      const matchesSearch = !term || 
        station.name.toLowerCase().includes(term) ||
        station.keywords.some(k => k.toLowerCase().includes(term));
      
      const matchesTab = activeTab === 'All' || station.commissionerate === activeTab;
      
      return matchesSearch && matchesTab;
    });
  }, [searchTerm, activeTab]);

  const handleDetectLocation = useCallback(() => {
    setIsDetecting(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('GPS not available on this device');
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setUserCoords({ lat, lng });
        
        // Accurate mathematical calculation for specific PS Jurisdictions
        const sorted = [...POLICE_STATIONS].sort((a, b) => {
          const distA = getDistance(lat, lng, a.lat, a.lng);
          const distB = getDistance(lat, lng, b.lat, b.lng);
          return distA - distB;
        });

        const closest = sorted.slice(0, 3);
        setNearbyStations(closest);
        setActiveTab('All');
        setSearchTerm('');
        setIsDetecting(false);

        // Smooth scroll with precise offset
        setTimeout(() => {
          const resultsElement = document.getElementById('nearby-priority-section');
          if (resultsElement) {
            const yOffset = -220; 
            const y = resultsElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 300);
      },
      (error) => {
        let msg = 'Could not get location';
        if (error.code === error.PERMISSION_DENIED) msg = 'Location access was blocked';
        setLocationError(msg);
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const tabs = ['All', ...Object.values(Commissionerate)];

  return (
    <div className="max-w-2xl mx-auto min-h-screen flex flex-col bg-slate-50 transition-colors duration-300">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-2xl border-b border-slate-200 px-4 pt-6 pb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="cursor-pointer">
            <h1 className="text-2xl font-black tracking-tighter text-slate-900 flex items-center">
              HYD<span className="text-red-600">POLICE</span>
              <span className="ml-2 w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            </h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pin-Point Jurisdiction</p>
          </div>
          <button 
            onClick={handleDetectLocation}
            disabled={isDetecting}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-[10px] transition-all active:scale-[0.97] uppercase tracking-wider ${
              isDetecting 
                ? 'bg-blue-100 text-blue-500 animate-pulse' 
                : 'bg-blue-600 text-white shadow-xl shadow-blue-100'
            }`}
          >
            <svg className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {isDetecting ? 'Locating...' : 'My Station'}
          </button>
        </div>

        <div className="mb-5">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search locality (Mailardevpally, Abids...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 px-6 bg-slate-100/80 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-lg font-bold placeholder:text-slate-400"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 px-4 py-8 safe-bottom">
        {locationError && (
          <div className="mb-8 p-5 bg-white rounded-3xl border border-red-100 shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="bg-red-500 p-2 rounded-full">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
              </div>
              <p className="text-[11px] font-black text-red-600 uppercase">{locationError}</p>
            </div>
            <button onClick={handleDetectLocation} className="w-full py-3 bg-red-600 text-white rounded-xl uppercase text-[10px] font-black">RETRY GPS</button>
          </div>
        )}

        {nearbyStations.length > 0 && !searchTerm && (
          <section id="nearby-priority-section" className="mb-14 p-4 -mx-4 bg-blue-50/20 border-y border-blue-100/30 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center justify-between mb-8 px-4">
               <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Nearby Jurisdictions</h2>
               <button onClick={() => setNearbyStations([])} className="text-[10px] font-black text-slate-400 uppercase">Clear</button>
            </div>
            <div className="space-y-8 px-4">
              {nearbyStations.map((station, idx) => (
                <div key={`nearby-${station.id}`} className={idx === 0 ? "relative" : "opacity-60 scale-[0.98]"}>
                  {idx === 0 && (
                    <div className="absolute -top-3 left-6 z-10 bg-blue-600 text-white text-[8px] font-black px-3 py-1.5 rounded-full shadow-xl uppercase tracking-widest ring-4 ring-white">
                      Your PS Limit
                    </div>
                  )}
                  <StationCard station={station} userCoords={userCoords} />
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mb-8">
          <EmergencyControls />
        </div>

        <div className="grid gap-8">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1 mb-2">
            Police Directory ({activeTab})
          </h2>
          {filteredStations.map((station) => (
            <StationCard key={station.id} station={station} userCoords={userCoords} />
          ))}
          {filteredStations.length === 0 && (
             <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
               <p className="text-slate-400 font-black text-sm uppercase">No Stations Found</p>
             </div>
          )}
        </div>
      </main>

      <footer className="p-10 text-center bg-slate-100 border-t border-slate-200">
        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em]">Official HydPolice CUG v4.1</p>
      </footer>
    </div>
  );
};

export default App;