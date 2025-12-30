import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FIRDraft, Station } from '../types';
import { POLICE_STATIONS } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userCoords?: { lat: number; lng: number } | null;
}

// Simple distance helper for internal modal logic
function calculateKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

export const FIRDraftModal: React.FC<Props> = ({ isOpen, onClose, userCoords }) => {
  const [step, setStep] = useState<'form' | 'camera' | 'result'>('form');
  const [draft, setDraft] = useState<FIRDraft>({
    issueType: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    location: '',
    landmark: '',
    description: '',
    timestamp: new Date().toLocaleString(),
    complainantName: '',
    complainantPhone: '',
    suspectDetails: '',
    vehicleDetails: '',
    witnessDetails: '',
    coords: userCoords || undefined
  });
  const [image, setImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Suggest the nearest police station
  const suggestedStation = useMemo(() => {
    if (!userCoords) return null;
    return [...POLICE_STATIONS].sort((a, b) => {
      const distA = calculateKm(userCoords.lat, userCoords.lng, a.lat, a.lng);
      const distB = calculateKm(userCoords.lat, userCoords.lng, b.lat, b.lng);
      return distA - distB;
    })[0];
  }, [userCoords]);

  useEffect(() => {
    if (userCoords) {
      setDraft(prev => ({ 
        ...prev, 
        location: `${userCoords.lat.toFixed(6)}, ${userCoords.lng.toFixed(6)}`,
        coords: userCoords 
      }));
    }
  }, [userCoords]);

  const startCamera = async () => {
    try {
      setStep('camera');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 4096 }, height: { ideal: 2160 } }, 
        audio: false 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Camera access failed.");
      setStep('form');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      setImage(canvas.toDataURL('image/jpeg', 0.9));
      stopCamera();
      setStep('form');
    }
  };

  const handleGenerate = () => {
    if (!draft.issueType || !draft.description || !draft.complainantName) {
      alert("Please fill Name, Category, and Description.");
      return;
    }
    setDraft(prev => ({ ...prev, timestamp: new Date().toLocaleString() }));
    setStep('result');
  };

  if (!isOpen) return null;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`HYD-MEMO|${draft.complainantName}|${draft.location}`)}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-md p-0 sm:p-4 overflow-y-auto print:relative print:bg-white print:p-0">
      <div className="bg-white w-full max-w-3xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Modal UI Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 no-print">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">FIR Evidence Draft</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Memorandum Generator</p>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white print:p-0 print:overflow-visible">
          {step === 'form' && (
            <div className="space-y-6 pb-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="col-span-full bg-blue-50 p-4 rounded-2xl border border-blue-100">
                   <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Recommended Action Station</p>
                   <p className="text-sm font-black text-slate-900">
                     {suggestedStation ? `Nearest: ${suggestedStation.name} PS (${suggestedStation.phone})` : 'Detecting jurisdiction...'}
                   </p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Full Legal Name</label>
                  <input type="text" value={draft.complainantName} onChange={(e) => setDraft({...draft, complainantName: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Contact Number</label>
                  <input type="tel" value={draft.complainantPhone} onChange={(e) => setDraft({...draft, complainantPhone: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Date</label>
                  <input type="date" value={draft.date} onChange={(e) => setDraft({...draft, date: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Time</label>
                  <input type="time" value={draft.time} onChange={(e) => setDraft({...draft, time: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                </div>
                <div className="col-span-full sm:col-span-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Category</label>
                  <select value={draft.issueType} onChange={(e) => setDraft({...draft, issueType: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold appearance-none">
                    <option value="">Select Category</option>
                    <option value="Physical Assault">Physical Assault</option>
                    <option value="Theft / Robbery">Theft / Robbery</option>
                    <option value="Cyber Crime">Cyber Crime</option>
                    <option value="Harassment">Harassment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Description of Facts</label>
                <textarea value={draft.description} onChange={(e) => setDraft({...draft, description: e.target.value})} rows={4} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Visual Evidence</label>
                <div className="flex gap-4">
                  <button onClick={startCamera} className="flex-1 p-5 bg-blue-600 text-white rounded-3xl font-black text-[11px] uppercase shadow-lg shadow-blue-100">Open Camera</button>
                  <div className="flex-1 relative">
                    <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setImage(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="flex items-center justify-center p-5 bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400 rounded-3xl font-black text-[11px] uppercase">Upload File</div>
                  </div>
                </div>
                {image && <img src={image} className="w-full aspect-video object-cover rounded-3xl border-2 border-white shadow-md" />}
              </div>

              <button onClick={handleGenerate} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-xl">Generate Final Document</button>
            </div>
          )}

          {step === 'camera' && (
            <div className="flex flex-col gap-6 animate-in fade-in h-full no-print min-h-[400px]">
              <div className="relative flex-1 bg-black rounded-[2.5rem] overflow-hidden">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex gap-4 p-4">
                <button onClick={() => { stopCamera(); setStep('form'); }} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-3xl font-black text-[11px] uppercase">Cancel</button>
                <button onClick={capturePhoto} className="flex-[2] py-5 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase shadow-xl flex items-center justify-center gap-3">
                  <div className="w-4 h-4 bg-white rounded-full animate-ping"></div>
                  Capture Photo
                </button>
              </div>
            </div>
          )}

          {step === 'result' && (
            <div className="print:block">
              {/* PRINTABLE AREA */}
              <div id="printable-draft" className="bg-white text-slate-900 font-sans print:p-8 print:w-full">
                <div className="p-10 border-4 border-slate-900 print:border-2 print:p-12">
                  <div className="flex justify-between items-start mb-10 border-b-2 border-slate-200 pb-10">
                    <div>
                      <h1 className="text-3xl font-black tracking-tighter">HYDPOLICE CONNECT</h1>
                      <p className="text-[11px] font-black text-red-600 uppercase tracking-[0.3em] mt-2">Official Situational Memorandum</p>
                      <div className="mt-8 space-y-1 text-[11px] font-bold text-slate-500">
                        <p>ID: #M-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                        <p>Date Generated: {draft.timestamp}</p>
                      </div>
                    </div>
                    <img src={qrUrl} alt="QR" className="w-24 h-24 p-1 border border-slate-100" />
                  </div>

                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Complainant Details</p>
                        <p className="text-xl font-black">{draft.complainantName}</p>
                        <p className="text-sm font-bold text-slate-600">{draft.complainantPhone}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Incident Profile</p>
                        <p className="text-xl font-black">{draft.issueType}</p>
                        <p className="text-sm font-bold text-slate-600">{draft.date} @ {draft.time}</p>
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-3">Suggested Jurisdiction</p>
                      <p className="text-lg font-black text-blue-600">{suggestedStation?.name || 'N/A'} POLICE STATION</p>
                      <p className="text-xs font-bold text-slate-500 mt-1">Contact: {suggestedStation?.phone || '100'}</p>
                      <div className="mt-4 text-[10px] font-mono text-slate-400">Verified GPS: {draft.location}</div>
                    </div>

                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Detailed Fact Statement</p>
                      <p className="text-base leading-relaxed p-6 bg-slate-50 italic rounded-xl border-l-8 border-slate-900">"{draft.description}"</p>
                    </div>

                    {image && (
                      <div className="break-inside-avoid pt-6">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Evidence Attachment</p>
                        <img src={image} className="w-full h-auto max-h-[400px] object-contain rounded-xl border border-slate-100" />
                      </div>
                    )}

                    <div className="pt-10 mt-10 border-t border-slate-100">
                      <p className="text-[9px] text-slate-400 italic text-justify leading-relaxed">
                        This is a self-generated memorandum for official facilitation. It captures real-time GPS and timestamps to assist law enforcement. 
                        It must be formally submitted at a Police Station to initiate legal proceedings.
                      </p>
                      <div className="flex justify-between mt-12 px-10">
                        <div className="text-center w-40 border-t border-slate-300 pt-2"><p className="text-[8px] font-bold text-slate-300 uppercase">Reporter Signature</p></div>
                        <div className="text-center w-40 border-t border-slate-300 pt-2"><p className="text-[8px] font-bold text-slate-300 uppercase">Duty Officer Seal</p></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION TOOLBAR (Hidden in Print) */}
              <div className="flex flex-col gap-4 mt-10 no-print px-4 pb-12">
                <button onClick={() => window.print()} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-base uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd"/></svg>
                  Save as PDF Document
                </button>
                <div className="flex gap-4">
                  <button onClick={() => setStep('form')} className="flex-1 py-5 bg-white border border-slate-900 text-slate-900 rounded-3xl font-black text-[11px] uppercase tracking-widest">Edit Details</button>
                  <button onClick={onClose} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-3xl font-black text-[11px] uppercase tracking-widest">Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @media print {
          /* COMPLETELY HIDE the entire app root to avoid ghost pages */
          #root { display: none !important; }
          
          /* Show ONLY the memorandum */
          html, body { height: auto !important; margin: 0 !important; padding: 0 !important; background: white !important; }
          
          .fixed { position: static !important; background: white !important; display: block !important; padding: 0 !important; }
          .max-w-3xl { max-width: 100% !important; border-radius: 0 !important; margin: 0 !important; box-shadow: none !important; }
          .no-print { display: none !important; }
          
          #printable-draft { 
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: 100vh;
            visibility: visible !important;
          }
          
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};