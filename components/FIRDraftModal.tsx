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
        video: { facingMode: 'environment' }, 
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
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
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
    if (!draft.issueType || !draft.description) {
      alert("Please fill out the issue type and description.");
      return;
    }
    setDraft(prev => ({ ...prev, timestamp: new Date().toLocaleString() }));
    setStep('result');
  };

  if (!isOpen) return null;

  const qrData = encodeURIComponent(`FIR-DRAFT|TYPE:${draft.issueType}|TIME:${draft.timestamp}|LOC:${draft.location}|GPS:${draft.coords?.lat},${draft.coords?.lng}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">FIR Draft Tool</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Memorandum for PS Visit</p>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {step === 'form' && (
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Incident Type</label>
                <select 
                  value={draft.issueType}
                  onChange={(e) => setDraft({...draft, issueType: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 transition-all appearance-none"
                >
                  <option value="">Select Category</option>
                  <option value="Theft/Robbery">Theft / Robbery</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Physical Assault">Physical Assault</option>
                  <option value="Lost Property">Lost Property</option>
                  <option value="Cyber Crime">Cyber Crime</option>
                  <option value="Chain Snatching">Chain Snatching</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Date</label>
                  <input 
                    type="date"
                    value={draft.date}
                    onChange={(e) => setDraft({...draft, date: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Accurate Location</label>
                  <div className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl font-mono text-[9px] text-blue-600 font-bold truncate">
                    {draft.location || 'Detecting GPS...'}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Short Description</label>
                <textarea 
                  value={draft.description}
                  onChange={(e) => setDraft({...draft, description: e.target.value})}
                  rows={3}
                  placeholder="What happened? Max 200 chars..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Capture Evidence</label>
                <div className="flex gap-3">
                  <button 
                    onClick={startCamera}
                    className="flex-1 flex items-center justify-center gap-2 p-4 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl font-black text-[10px] uppercase active:scale-95 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    Take Photo
                  </button>
                  <div className="flex-1 relative">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                    <div className="flex items-center justify-center gap-2 p-4 bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      Upload
                    </div>
                  </div>
                </div>
                {image && (
                  <div className="relative w-24 h-24 mt-2">
                    <img src={image} className="w-full h-full object-cover rounded-xl shadow-md border-2 border-white" />
                    <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-lg">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                <p className="text-[9px] font-black text-red-800 leading-tight uppercase tracking-tight">
                  🚨 WARNING: Misleading information in legal documents can lead to arrest or legal action. Verify all facts.
                </p>
              </div>

              <button 
                onClick={handleGenerate}
                className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-[0.98] transition-all"
              >
                Create Evidence Memo
              </button>
            </div>
          )}

          {step === 'camera' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="relative aspect-[4/3] bg-black rounded-[2rem] overflow-hidden shadow-2xl border-4 border-slate-900">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => { stopCamera(); setStep('form'); }}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase"
                >
                  Cancel
                </button>
                <button 
                  onClick={capturePhoto}
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                >
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  Capture Photo
                </button>
              </div>
            </div>
          )}

          {step === 'result' && (
            <div className="space-y-8 animate-in zoom-in-95 duration-500 pb-4">
              <div id="printable-draft" className="p-8 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl relative overflow-hidden text-slate-900">
                <div className="flex justify-between items-start mb-6 border-b pb-6">
                  <div>
                    <h1 className="text-2xl font-black tracking-tighter">HYDPOLICE</h1>
                    <p className="text-[8px] font-black text-red-600 uppercase tracking-[0.3em]">Official Jurisdiction CUG v4.1</p>
                    <div className="mt-4">
                      <h3 className="text-lg font-black uppercase text-slate-800">Incident Draft</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Self-Declared Information</p>
                    </div>
                  </div>
                  <img src={qrUrl} alt="QR Code" className="w-20 h-20 p-1 bg-white border rounded-lg" />
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Incident Category</p>
                      <p className="text-sm font-black text-slate-900">{draft.issueType}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Declared Date</p>
                      <p className="text-sm font-black text-slate-900">{draft.date}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-2">GPS Verification Data</p>
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl font-mono text-[10px] text-blue-600 font-bold">
                      Lat/Lng: {draft.location}<br/>
                      Time: {draft.timestamp}
                    </div>
                  </div>

                  {image && (
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Evidence Attachment</p>
                      <img src={image} className="w-full h-48 object-cover rounded-2xl shadow-sm border border-slate-100" alt="Evidence" />
                    </div>
                  )}

                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Fact Description</p>
                    <p className="text-sm leading-relaxed p-4 bg-slate-50 rounded-2xl border-l-4 border-slate-900 italic">
                      "{draft.description}"
                    </p>
                  </div>

                  <div className="pt-6 border-t border-slate-100 text-center">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                      Generated via HydPolice Connect Platform
                    </p>
                    <p className="text-[7px] text-slate-300 mt-1 italic">
                      This is not a registered FIR. Show this to the duty officer for accurate detail reporting.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 no-print">
                <button 
                  onClick={() => window.print()}
                  className="w-full py-5 bg-blue-600 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd"/></svg>
                  Save as PDF / Print
                </button>
                <button 
                  onClick={() => setStep('form')}
                  className="w-full py-4 bg-white border-2 border-slate-200 text-slate-400 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em]"
                >
                  Edit Information
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 0 !important; }
          #printable-draft { border: none !important; box-shadow: none !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
};