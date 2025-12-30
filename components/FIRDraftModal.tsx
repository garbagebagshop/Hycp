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
  const [isCapturing, setIsCapturing] = useState(false);
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
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 4096 }, height: { ideal: 2160 } }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Camera access failed. Ensure you have granted permissions.");
      setStep('form');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      // Capture at natural resolution of the stream
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
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
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = () => {
    if (!draft.issueType || !draft.description || !draft.complainantName) {
      alert("Required: Name, Category, and Description.");
      return;
    }
    setDraft(prev => ({ ...prev, timestamp: new Date().toLocaleString() }));
    setStep('result');
  };

  if (!isOpen) return null;

  const qrData = encodeURIComponent(`HYD-POL-MEMO-V3|${draft.complainantName}|${draft.issueType}|${draft.location}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-md p-0 sm:p-4 overflow-y-auto print:static print:bg-white print:p-0 print:block">
      <div className="bg-white w-full max-w-3xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300 flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:rounded-none print:w-full">
        
        {/* Header - Hidden in Print */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 no-print">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Evidence Memorandum</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Incident Detail Logger</p>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white print:overflow-visible print:p-0">
          {step === 'form' && (
            <div className="space-y-6 pb-10">
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100 mb-2">
                <p className="text-[9px] font-black text-red-800 leading-tight uppercase tracking-tight">
                  🚨 LEGAL NOTICE: False or misleading information provided in this document 
                  is a punishable offense under the Bharatiya Nyaya Sanhita (BNS).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Full Name of Complainant</label>
                  <input type="text" value={draft.complainantName} onChange={(e) => setDraft({...draft, complainantName: e.target.value})} placeholder="Official Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Mobile Number</label>
                  <input type="tel" value={draft.complainantPhone} onChange={(e) => setDraft({...draft, complainantPhone: e.target.value})} placeholder="99xxxxxxxx" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Incident Date</label>
                  <input type="date" value={draft.date} onChange={(e) => setDraft({...draft, date: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none" />
                </div>
                <div className="sm:col-span-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Approx Time</label>
                  <input type="time" value={draft.time} onChange={(e) => setDraft({...draft, time: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none" />
                </div>
                <div className="sm:col-span-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Incident Category</label>
                  <select value={draft.issueType} onChange={(e) => setDraft({...draft, issueType: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none appearance-none">
                    <option value="">Select Category</option>
                    <option value="Physical Assault">Physical Assault</option>
                    <option value="Theft / Robbery">Theft / Robbery</option>
                    <option value="Cyber Crime">Cyber Crime</option>
                    <option value="Harassment">Harassment</option>
                    <option value="Road Accident">Road Accident</option>
                    <option value="Chain Snatching">Chain Snatching</option>
                    <option value="Property Dispute">Property Dispute</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">GPS Location</label>
                  <div className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl font-mono text-[9px] text-blue-600 font-bold truncate">
                    {draft.location || 'Retrieving Location...'}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Specific Landmark / Shop Name</label>
                  <input type="text" value={draft.landmark} onChange={(e) => setDraft({...draft, landmark: e.target.value})} placeholder="e.g. Pillar 125, More Supermarket" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Suspect Description</label>
                  <input type="text" value={draft.suspectDetails} onChange={(e) => setDraft({...draft, suspectDetails: e.target.value})} placeholder="Height, clothes, names" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Vehicle Numbers</label>
                  <input type="text" value={draft.vehicleDetails} onChange={(e) => setDraft({...draft, vehicleDetails: e.target.value})} placeholder="TS XX XX XXXX" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Witness Names</label>
                  <input type="text" value={draft.witnessDetails} onChange={(e) => setDraft({...draft, witnessDetails: e.target.value})} placeholder="Name & Mobile" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Detailed Description of Facts</label>
                <textarea value={draft.description} onChange={(e) => setDraft({...draft, description: e.target.value})} rows={5} placeholder="State events in chronological order..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500" />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Evidence Documentation</label>
                <div className="flex gap-3">
                  <button onClick={startCamera} className="flex-1 flex items-center justify-center gap-3 p-5 bg-blue-600 text-white rounded-3xl font-black text-[11px] uppercase shadow-xl shadow-blue-100 active:scale-95 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    Full-Res Capture
                  </button>
                  <div className="flex-1 relative">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                    <div className="flex items-center justify-center gap-3 p-5 bg-slate-50 border border-slate-200 text-slate-600 rounded-3xl font-black text-[11px] uppercase">
                      Upload File
                    </div>
                  </div>
                </div>
                {image && (
                  <div className="relative w-full aspect-video mt-4 border-2 border-slate-100 rounded-3xl overflow-hidden shadow-inner">
                    <img src={image} className="w-full h-full object-cover" />
                    <button onClick={() => setImage(null)} className="absolute top-4 right-4 bg-red-600 text-white rounded-full p-2 shadow-2xl">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                )}
              </div>

              <button onClick={handleGenerate} className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl active:scale-[0.98] transition-all">
                Finalize Report Document
              </button>
            </div>
          )}

          {step === 'camera' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300 h-full no-print min-h-[500px]">
              <div className="relative flex-1 bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-slate-900">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none border-[20px] border-black/20">
                  <div className="w-[85%] h-[85%] border-2 border-white/50 border-dashed rounded-3xl"></div>
                </div>
              </div>
              <div className="flex gap-4 p-4">
                <button onClick={() => { stopCamera(); setStep('form'); }} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-3xl font-black text-[11px] uppercase">Discard</button>
                <button onClick={capturePhoto} className="flex-[2] py-5 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase shadow-xl flex items-center justify-center gap-4 active:scale-95">
                  <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                  Capture Resolution
                </button>
              </div>
            </div>
          )}

          {step === 'result' && (
            <div className="print:p-0">
              <div id="printable-draft" className="bg-white text-slate-900 font-sans print:visible print:block print:w-full print:m-0 print:p-0">
                <div className="p-12 border-[12px] border-double border-slate-900 rounded-[4rem] print:border-4 print:border-solid print:rounded-none print:p-12">
                  
                  {/* Header */}
                  <div className="flex justify-between items-start mb-12 border-b-4 border-slate-900 pb-10">
                    <div>
                      <h1 className="text-4xl font-black tracking-tighter text-slate-900 leading-none">HYDPOLICE CONNECT</h1>
                      <p className="text-[11px] font-black text-red-600 uppercase tracking-[0.4em] mt-2">Official Incident Memorandum</p>
                      <div className="mt-8 space-y-1 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                        <p>Document ID: <span className="text-slate-900">#MEMO-{Math.random().toString(36).substr(2, 6).toUpperCase()}</span></p>
                        <p>Generated: <span className="text-slate-900">{draft.timestamp}</span></p>
                      </div>
                    </div>
                    <img src={qrUrl} alt="QR Code" className="w-28 h-28 p-1 bg-white border-2 border-slate-100 rounded-3xl" />
                  </div>

                  <div className="space-y-10">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-8">
                      <div className="p-6 bg-slate-50 rounded-3xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Reported By</p>
                        <p className="text-2xl font-black text-slate-900">{draft.complainantName}</p>
                        <p className="text-sm font-bold text-slate-600 mt-1">{draft.complainantPhone}</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-3xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Incident Profile</p>
                        <p className="text-2xl font-black text-slate-900">{draft.issueType}</p>
                        <p className="text-sm font-bold text-slate-600 mt-1">{draft.date} @ {draft.time}</p>
                      </div>
                    </div>

                    {/* GPS Verified Section */}
                    <div className="p-6 border-2 border-blue-200 bg-blue-50/40 rounded-[2.5rem]">
                      <h4 className="text-[10px] font-black text-blue-600 uppercase mb-4 tracking-[0.3em]">Verified Location Metadata</h4>
                      <div className="grid grid-cols-2 gap-6 text-xs font-mono font-bold text-blue-900">
                        <div>
                          <p className="text-[8px] uppercase text-blue-400 mb-1">GPS Coordinates</p>
                          <p>{draft.location}</p>
                        </div>
                        <div>
                          <p className="text-[8px] uppercase text-blue-400 mb-1">Landmark Declaration</p>
                          <p>{draft.landmark || 'No Landmark Given'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Investigation Blocks */}
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-1 border-l-2 border-slate-100 pl-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Suspects</p>
                        <p className="text-sm font-bold text-slate-800">{draft.suspectDetails || 'N/A'}</p>
                      </div>
                      <div className="space-y-1 border-l-2 border-slate-100 pl-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vehicles</p>
                        <p className="text-sm font-bold text-slate-800">{draft.vehicleDetails || 'N/A'}</p>
                      </div>
                      <div className="space-y-1 border-l-2 border-slate-100 pl-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Witnesses</p>
                        <p className="text-sm font-bold text-slate-800">{draft.witnessDetails || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Full Narrative */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Detailed Declaration</p>
                      <div className="text-lg leading-relaxed text-slate-900 p-8 bg-slate-50 border-l-[12px] border-slate-900 italic font-medium rounded-r-3xl">
                        "{draft.description}"
                      </div>
                    </div>

                    {/* High-Resolution Evidence Image */}
                    {image && (
                      <div className="space-y-4 pt-6 break-inside-avoid">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Primary Evidence Documentation</p>
                        <div className="border-4 border-slate-50 p-1 rounded-[2.5rem] overflow-hidden shadow-sm">
                          <img src={image} className="w-full h-auto max-h-[14cm] object-contain rounded-[2.2rem]" alt="Incident Evidence" />
                        </div>
                      </div>
                    )}

                    {/* Self Declaration & Signature Space */}
                    <div className="pt-12 mt-12 border-t-2 border-slate-100">
                      <p className="text-[10px] text-slate-400 leading-relaxed text-justify italic mb-12">
                        I hereby declare that the information provided above is true to the best of my knowledge and belief. 
                        I understand that this is a digital situational memorandum intended for police facilitation and 
                        does not substitute an official FIR until certified by a Police Officer.
                      </p>
                      <div className="flex justify-between items-end px-12">
                        <div className="text-center w-48">
                          <div className="border-b-2 border-slate-200 h-16 mb-3"></div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reporter Signature</p>
                        </div>
                        <div className="text-center w-48">
                          <div className="border-b-2 border-slate-200 h-16 mb-3"></div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Station Seal / Sign</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Toolbar - Hidden in Print */}
              <div className="flex flex-col gap-4 mt-12 no-print px-4 pb-12">
                <button 
                  onClick={() => window.print()}
                  className="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] font-black text-base uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-4"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd"/></svg>
                  Save Full Document (PDF)
                </button>
                <div className="flex gap-4">
                  <button onClick={() => setStep('form')} className="flex-1 py-5 bg-white border-2 border-slate-900 text-slate-900 rounded-3xl font-black text-[11px] uppercase tracking-widest active:bg-slate-50 transition-colors">Edit Content</button>
                  <button onClick={onClose} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-3xl font-black text-[11px] uppercase tracking-widest active:bg-slate-200 transition-colors">Exit Tool</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Precision Print CSS */}
      <style>{`
        @media print {
          /* Hide EVERYTHING else */
          body * { 
            visibility: hidden !important; 
          }
          /* Only show the printable report */
          #printable-draft, #printable-draft * { 
            visibility: visible !important; 
          }
          #printable-draft {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            visibility: visible !important;
            display: block !important;
          }
          .no-print { 
            display: none !important; 
          }
          .fixed, .backdrop-blur-md, .bg-slate-900\\/80 { 
            position: absolute !important;
            background: white !important;
            overflow: visible !important;
          }
          /* Page setup */
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};