import React, { useState, useMemo, useCallback } from 'react';
import { POLICE_STATIONS } from './constants';
import { Commissionerate, Station } from './types';
import { EmergencyControls } from './components/EmergencyControls';
import { StationCard } from './components/StationCard';
import { findNearbyStations, resolveAreaName } from './services/gemini';

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<Commissionerate | 'All'>('All');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [nearbyStations, setNearbyStations] = useState<Station[]>([]);
  const [currentArea, setCurrentArea] = useState<string | null>(null);

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
      setLocationError('Geolocation not supported');
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude: lat, longitude: lng } = position.coords;
          const [areaName, stations] = await Promise.all([
            resolveAreaName(lat, lng),
            findNearbyStations('', { lat, lng })
          ]);

          setCurrentArea(areaName);
          setNearbyStations(stations);
          
          if (stations.length > 0) {
            setActiveTab('All');
            setSearchTerm('');
            setTimeout(() => {
              const resultsElement = document.getElementById('nearby-priority-section');
              if (resultsElement) {
                resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 500);
          }
        } catch (err) {
          setLocationError('Network error. Using search fallback.');
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        setLocationError('Location denied. Please type your area.');
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }, []);

  const tabs = ['All', ...Object.values(Commissionerate)];

  return (
    <div className="max-w-2xl mx-auto min-h-screen flex flex-col bg-slate-50 transition-colors duration-300">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-2xl border-b border-slate-200 px-4 pt-6 pb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="transition-transform active:scale-95 cursor-default" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900 flex items-center">
              HYD<span className="text-red-600">POLICE</span>
              <span className="ml-2 w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            </h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Jurisdiction Finder v2025</p>
          </div>
          <button 
            onClick={handleDetectLocation}
            disabled={isDetecting}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm transition-all active:scale-[0.97] ${
              isDetecting 
                ? 'bg-blue-100 text-blue-400 animate-pulse cursor-wait' 
                : 'bg-blue-600 text-white shadow-xl shadow-blue-200 hover:shadow-blue-300'
            }`}
          >
            <svg className={`w-5 h-5 ${isDetecting ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {isDetecting ? 'Verifying...' : 'Auto-Detect PS'}
          </button>
        </div>

        {currentArea && (
          <div className="mb-4 px-1 animate-in slide-in-from-top-4 fade-in duration-500">
            <div className="flex items-center justify-between bg-slate-900 p-3.5 rounded-2xl shadow-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 h-2 w-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Live Area: <span className="text-white text-sm tracking-normal">{currentArea}</span>
                </p>
              </div>
              <button 
                onClick={() => {setNearbyStations([]); setCurrentArea(null);}}
                className="text-[9px] font-black text-red-400 bg-red-400/10 px-3 py-1.5 rounded-xl uppercase tracking-tighter active:bg-red-400/20"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        <div className="mb-5">
          <input
            type="text"
            placeholder="Search locality"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-15 px-6 bg-slate-100/80 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-lg font-bold placeholder:text-slate-400"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                activeTab === tab 
                ? 'bg-slate-900 text-white shadow-lg translate-y-[-1px]' 
                : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main id="results-section" className="flex-1 px-4 py-8 safe-bottom overflow-y-auto">
        {locationError && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-xs font-black border border-red-100 flex items-center gap-3 animate-bounce">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
            <p className="uppercase">{locationError}</p>
          </div>
        )}

        {nearbyStations.length > 0 && !searchTerm && (
          <section 
            id="nearby-priority-section"
            className="mb-12 animate-in fade-in zoom-in duration-500 scroll-mt-[280px] sm:scroll-mt-[320px]"
          >
            <div className="flex items-center gap-4 mb-8 px-1">
              <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Verified Jurisdictions</h2>
              <div className="h-[2px] flex-1 bg-blue-100/50 rounded-full"></div>
            </div>
            <div className="space-y-6">
              {nearbyStations.map((station, idx) => (
                <div key={`nearby-${station.id}`} className={idx === 0 ? "relative" : "opacity-60 scale-[0.98] blur-[0.3px] transition-all hover:opacity-100 hover:scale-100 hover:blur-0"}>
                  {idx === 0 && (
                    <div className="absolute -top-3 left-4 z-10 bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-tighter ring-4 ring-slate-50">
                      Primary Station
                    </div>
                  )}
                  <StationCard station={station} />
                </div>
              ))}
            </div>
            <div className="h-px bg-slate-200 my-10 w-full opacity-50"></div>
          </section>
        )}

        {searchTerm === '' && activeTab === 'All' && !nearbyStations.length && (
          <div className="mb-8 animate-in fade-in duration-700 delay-200">
            <EmergencyControls />
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1 mb-8">
            {searchTerm ? `Results for "${searchTerm}"` : `Police Directory (${activeTab})`}
          </h2>
          
          <div className="grid gap-6">
            {filteredStations.length > 0 ? (
              filteredStations.map((station) => (
                <StationCard key={station.id} station={station} />
              ))
            ) : (
              <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 shadow-inner">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5"/></svg>
                </div>
                <p className="text-slate-500 font-black text-sm uppercase tracking-widest">Locality Not Found</p>
                <p className="text-xs text-slate-400 mt-2 font-bold px-8">Try searching for a nearby landmark or Mandal name.</p>
                <button 
                  onClick={() => {setSearchTerm(''); setActiveTab('All');}}
                  className="mt-6 px-8 py-3 bg-slate-900 text-white text-[10px] font-black rounded-2xl uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-transform"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="p-10 text-center bg-slate-100 border-t border-slate-200">
        <div className="max-w-xs mx-auto mb-10 text-left">
           <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
             <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
             Data Verification
           </h4>
           <p className="text-[9px] text-slate-500 font-bold leading-relaxed uppercase tracking-tight">
             The <span className="text-slate-900">94906</span> series are Official CUG numbers assigned to the Station House Officer (SHO) post. They are departmental lines and remain consistent regardless of personnel changes.
           </p>
           <div className="flex flex-wrap gap-2 mt-4">
             <a href="https://www.hyderabadpolice.gov.in" target="_blank" className="text-[8px] font-black text-blue-600 bg-blue-100 px-2 py-1 rounded-md uppercase">Hyd City Web</a>
             <a href="https://cyberabadpolice.gov.in" target="_blank" className="text-[8px] font-black text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md uppercase">Cyberabad Web</a>
             <a href="https://rachakondapolice.telangana.gov.in" target="_blank" className="text-[8px] font-black text-indigo-600 bg-indigo-100 px-2 py-1 rounded-md uppercase">Rachakonda Web</a>
           </div>
        </div>

        <div className="max-w-xs mx-auto">
          <p className="text-[10px] text-slate-400 font-black leading-relaxed uppercase tracking-tighter mb-8">
            Safety First. Reliable Directory.
          </p>
          <div className="flex items-center justify-center gap-4">
             <div className="group flex flex-col items-center gap-2">
               <div className="h-14 w-14 flex items-center justify-center bg-white rounded-3xl border border-slate-200 font-black text-lg shadow-sm group-active:scale-90 transition-transform">100</div>
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Police</span>
             </div>
             <div className="group flex flex-col items-center gap-2">
               <div className="h-14 w-14 flex items-center justify-center bg-white rounded-3xl border border-slate-200 font-black text-lg shadow-sm group-active:scale-90 transition-transform text-pink-600">1091</div>
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Women</span>
             </div>
             <div className="group flex flex-col items-center gap-2">
               <div className="h-14 w-14 flex items-center justify-center bg-white rounded-3xl border border-slate-200 font-black text-lg shadow-sm group-active:scale-90 transition-transform">112</div>
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">SOS</span>
             </div>
          </div>
          <div className="mt-10 pt-6 border-t border-slate-200">
             <p className="text-[8px] text-slate-300 font-bold uppercase tracking-[0.3em]">Official Database v3.2</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;