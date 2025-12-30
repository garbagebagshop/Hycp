import React, { useState, useEffect, useRef } from 'react';
import { FIRDraft } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userCoords?: { lat: number; lng: number } | null;
}

export const FIRDraftModal: React.FC<Props> = ({ isOpen, onClose, userCoords }) => {
  const [step, setStep] = useState<'form' | 'camera' | 'result'>('form');
  const [draft, setDraft] = useState<FIRDraft>({
    issueType: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    description: '',
    timestamp: new Date().toLocaleString(),
    complainantName: '',
    complainantPhone: '',
    suspectDetails: '',
    vehicleDetails: '',
    coords: userCoords || undefined
  });
  const [image, setImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Could not access camera. Please check permissions.");
      setStep('form');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      // Capture at full video resolution
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setImage(dataUrl);
        stopCamera();
        setStep('form');
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = () => {
    if (!draft.issueType || !draft.description || !draft.complainantName) {
      alert("Please fill out your Name, Incident Category, and Description.");
      return;
    }
    setDraft(prev => ({ ...prev, timestamp: new Date().toLocaleString() }));
    setStep('result');
  };

  if (!isOpen) return null;

  const qrData = encodeURIComponent(`HYD-POL-MEMO|NAME:${draft.complainantName}|TYPE:${draft.issueType}|TIME:${draft.timestamp}|LOC:${draft.location}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-md p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300 flex flex-col max-h-screen">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 no-print">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">FIR Evidence Draft</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Official Memoranda Generator</p>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {step === 'form' && (
            <div className="space-y-6 pb-10">
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100 mb-2">
                <p className="text-[9px] font-black text-red-800 leading-tight uppercase tracking-tight">
                  🚨 LEGAL NOTICE: Information provided in this memo must be truthful. 
                  Misrepresentation of facts may attract legal consequences under the law.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Complainant Name</label>
                  <input 
                    type="text"
                    value={draft.complainantName}
                    onChange={(e) => setDraft({...draft, complainantName: e.target.value})}
                    placeholder="Full Legal Name"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Contact Number</label>
                  <input 
                    type="tel"
                    value={draft.complainantPhone}
                    onChange={(e) => setDraft({...draft, complainantPhone: e.target.value})}
                    placeholder="Primary Mobile"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Incident Category</label>
                <select 
                  value={draft.issueType}
                  onChange={(e) => setDraft({...draft, issueType: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 transition-all appearance-none"
                >
                  <option value="">Select Category</option>
                  <option value="Theft / Burglary">Theft / Burglary</option>
                  <option value="Physical Assault">Physical Assault</option>
                  <option value="Harassment / Eve Teasing">Harassment / Eve Teasing</option>
                  <option value="Cyber Fraud">Cyber Fraud</option>
                  <option value="Traffic Accident">Traffic Accident</option>
                  <option value="Lost & Found">Lost & Found</option>
                  <option value="Domestic Violence">Domestic Violence</option>
                  <option value="Chain Snatching">Chain Snatching</option>
                  <option value="Property Damage">Property Damage</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Incident Date</label>
                  <input 
                    type="date"
                    value={draft.date}
                    onChange={(e) => setDraft({...draft, date: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Current GPS Point</label>
                  <div className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl font-mono text-[9px] text-blue-600 font-bold truncate">
                    {draft.location || 'Detecting...'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Suspect Details (If any)</label>
                  <input 
                    type="text"
                    value={draft.suspectDetails}
                    onChange={(e) => setDraft({...draft, suspectDetails: e.target.value})}
                    placeholder="Name, description, clothing..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Vehicle Info (If any)</label>
                  <input 
                    type="text"
                    value={draft.vehicleDetails}
                    onChange={(e) => setDraft({...draft, vehicleDetails: e.target.value})}
                    placeholder="Number plate, color, model..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Full Description of Event</label>
                <textarea 
                  value={draft.description}
                  onChange={(e) => setDraft({...draft, description: e.target.value})}
                  rows={4}
                  placeholder="Explain the incident in detail..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Evidence Photo (Full Ratio Capture)</label>
                <div className="flex gap-3">
                  <button 
                    onClick={startCamera}
                    className="flex-1 flex items-center justify-center gap-2 p-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase active:scale-95 transition-all shadow-lg shadow-blue-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    Live Camera
                  </button>
                  <div className="flex-1 relative">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                    <div className="flex items-center justify-center gap-2 p-4 bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      File Upload
                    </div>
                  </div>
                </div>
                {image && (
                  <div className="relative w-full aspect-video mt-2">
                    <img src={image} className="w-full h-full object-cover rounded-2xl shadow-md border-2 border-white" />
                    <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 shadow-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={handleGenerate}
                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-[0.98] transition-all"
              >
                Generate Final Memorandum
              </button>
            </div>
          )}

          {step === 'camera' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300 h-full">
              <div className="relative flex-1 bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-slate-900">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                   <div className="w-[80%] h-[80%] border-2 border-white border-dashed rounded-3xl"></div>
                </div>
              </div>
              <div className="flex gap-4 p-4">
                <button 
                  onClick={() => { stopCamera(); setStep('form'); }}
                  className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-3xl font-black text-[10px] uppercase"
                >
                  Go Back
                </button>
                <button 
                  onClick={capturePhoto}
                  className="flex-[2] py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-95"
                >
                  <div className="w-4 h-4 bg-white rounded-full border-2 border-white ring-4 ring-white/30"></div>
                  Take Full Shot
                </button>
              </div>
            </div>
          )}

          {step === 'result' && (
            <div className="animate-in zoom-in-95 duration-500 pb-10">
              {/* This is the printable section */}
              <div id="printable-draft" className="bg-white text-slate-900 font-sans print:m-0 print:p-0">
                <div className="p-10 border-4 border-slate-900 rounded-[3rem] shadow-none print:border-2 print:rounded-none">
                  
                  {/* Header */}
                  <div className="flex justify-between items-start mb-10 border-b-4 border-slate-900 pb-10">
                    <div>
                      <h1 className="text-4xl font-black tracking-tighter text-slate-900">HYDPOLICE CONNECT</h1>
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] mb-4">Official Evidence Memorandum</p>
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-black uppercase text-slate-500">Document ID: <span className="text-slate-900">#{Math.random().toString(36).substr(2, 9).toUpperCase()}</span></p>
                        <p className="text-xs font-black uppercase text-slate-500">Generated: <span className="text-slate-900">{draft.timestamp}</span></p>
                      </div>
                    </div>
                    <img src={qrUrl} alt="QR Code" className="w-28 h-28 p-1 bg-white border-2 border-slate-100 rounded-2xl" />
                  </div>

                  <div className="space-y-10">
                    {/* Person Details */}
                    <div className="grid grid-cols-2 gap-8">
                      <div className="p-5 bg-slate-50 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Reporting Person</p>
                        <p className="text-xl font-black text-slate-900">{draft.complainantName}</p>
                        <p className="text-sm font-bold text-slate-600 mt-1">{draft.complainantPhone}</p>
                      </div>
                      <div className="p-5 bg-slate-50 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Incident Type</p>
                        <p className="text-xl font-black text-slate-900">{draft.issueType}</p>
                        <p className="text-sm font-bold text-slate-600 mt-1">Date: {draft.date}</p>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="p-6 border-2 border-blue-100 bg-blue-50/30 rounded-3xl">
                      <h4 className="text-[10px] font-black text-blue-600 uppercase mb-3 tracking-[0.2em]">Validated Geolocation Data</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                        <p className="text-slate-700"><strong>GPS Coordinates:</strong> {draft.location}</p>
                        <p className="text-slate-700"><strong>Timestamp:</strong> {draft.timestamp}</p>
                      </div>
                    </div>

                    {/* Investigation details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                       <div className="space-y-2">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suspect Information</p>
                         <p className="text-base font-bold text-slate-800">{draft.suspectDetails || 'None Disclosed'}</p>
                       </div>
                       <div className="space-y-2">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehicle/Object Info</p>
                         <p className="text-base font-bold text-slate-800">{draft.vehicleDetails || 'None Disclosed'}</p>
                       </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Incident Narrative</p>
                      <div className="text-lg leading-relaxed text-slate-800 p-8 bg-slate-50 border-l-[10px] border-slate-900 italic font-medium">
                        "{draft.description}"
                      </div>
                    </div>

                    {/* Full Ratio Evidence Image */}
                    {image && (
                      <div className="space-y-4 pt-4 break-inside-avoid">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attached Visual Evidence</p>
                        <img src={image} className="w-full h-auto max-h-[1000px] object-contain rounded-3xl border-2 border-slate-100 shadow-sm" alt="Evidence" />
                      </div>
                    )}

                    {/* Footer / Legal */}
                    <div className="pt-10 border-t-2 border-slate-100 flex flex-col gap-4">
                      <p className="text-xs font-black text-slate-900 uppercase text-center tracking-widest">Self-Declaration Statement</p>
                      <p className="text-[10px] text-slate-400 leading-relaxed text-justify italic">
                        The information contained in this document is a self-declared memorandum generated by the user. 
                        It is intended to provide accurate situational data (including GPS and timestamp) to aid in the 
                        filing of an official police report. This document is not a certified First Information Report (FIR) 
                        until signed and stamped by the competent authority at a Police Station.
                      </p>
                      <div className="flex justify-between items-end mt-10">
                        <div className="w-48 border-b-2 border-slate-300 pb-1">
                          <p className="text-[8px] font-black text-slate-300 uppercase">Reporter Signature</p>
                        </div>
                        <div className="w-48 border-b-2 border-slate-300 pb-1 text-right">
                          <p className="text-[8px] font-black text-slate-300 uppercase">Duty Officer Seal</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Screen */}
              <div className="flex flex-col gap-3 mt-8 no-print px-4">
                <button 
                  onClick={() => window.print()}
                  className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-4"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd"/></svg>
                  Save Full Document (PDF)
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setStep('form')}
                    className="flex-1 py-5 bg-white border-2 border-slate-900 text-slate-900 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em]"
                  >
                    Edit Draft
                  </button>
                  <button 
                    onClick={onClose}
                    className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em]"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          .no-print { display: none !important; }
          body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            overflow: visible !important;
          }
          #root { height: auto !important; }
          .fixed { position: static !important; background: transparent !important; padding: 0 !important; display: block !important; }
          .max-w-2xl { max-width: 100% !important; border-radius: 0 !important; margin: 0 !important; box-shadow: none !important; }
          #printable-draft { 
            display: block !important;
            padding: 2cm !important;
            min-height: 29.7cm;
          }
          .rounded-t-[2.5rem], .rounded-[2.5rem], .rounded-3xl, .rounded-2xl {
            border-radius: 0 !important;
          }
          img { max-height: 50% !important; }
        }
      `}</style>
    </div>
  );
};