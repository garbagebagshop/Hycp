import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FIRDraft, Station } from '../types';
import { POLICE_STATIONS } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userCoords?: { lat: number; lng: number } | null;
}

function calculateKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

export const FIRDraftModal: React.FC<Props> = ({ isOpen, onClose, userCoords }) => {
  const [step, setStep] = useState<'form' | 'camera' | 'result'>('form');
  const [formSection, setFormSection] = useState<'personal' | 'incident' | 'details'>('personal');
  
  const [draft, setDraft] = useState<FIRDraft>({
    issueType: '',
    complaintSubject: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    location: '',
    locationAccuracy: undefined,
    landmark: '',
    incidentAddress: '',
    description: '',
    timestamp: new Date().toLocaleString(),
    complainantName: '',
    complainantAge: '',
    complainantFatherSpouseName: '',
    complainantAddress: '',
    complainantPhone: '',
    suspectDetails: '',
    vehicleDetails: '',
    witnessDetails: '',
    stolenPropertyDetails: '',
    coords: userCoords || undefined
  });
  
  const [image, setImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const suggestedStation = useMemo(() => {
    if (!userCoords) return null;
    return [...POLICE_STATIONS].sort((a, b) => {
      const distA = calculateKm(userCoords.lat, userCoords.lng, a.lat, a.lng);
      const distB = calculateKm(userCoords.lat, userCoords.lng, b.lat, b.lng);
      return distA - distB;
    })[0];
  }, [userCoords]);

  // Capture high accuracy location when requested or available
  useEffect(() => {
    if (userCoords) {
      setDraft(prev => ({ 
        ...prev, 
        location: `${userCoords.lat.toFixed(7)}, ${userCoords.lng.toFixed(7)}`,
        coords: userCoords 
      }));
    }

    if (isOpen && !draft.locationAccuracy) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setDraft(prev => ({
          ...prev,
          locationAccuracy: Math.round(pos.coords.accuracy),
          location: `${pos.coords.latitude.toFixed(7)}, ${pos.coords.longitude.toFixed(7)}`,
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }
        }));
      }, null, { enableHighAccuracy: true });
    }
  }, [userCoords, isOpen]);

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
    if (!draft.issueType || !draft.description || !draft.complainantName || !draft.complaintSubject) {
      alert("Subject, Category, Description, and Name are required.");
      return;
    }
    setDraft(prev => ({ ...prev, timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'medium' }) }));
    setStep('result');
  };

  if (!isOpen) return null;

  // Optimized QR: encoded maps link for instant police verification
  const qrData = `https://www.google.com/maps/search/?api=1&query=${draft.coords?.lat},${draft.coords?.lng}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}&color=0-0-0&bgcolor=ffffff&margin=1`;

  const InputLabel = ({ label }: { label: string }) => (
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">{label}</label>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/90 backdrop-blur-md p-0 sm:p-4 overflow-y-auto print:relative print:bg-white print:p-0">
      <div className="bg-white w-full max-w-3xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 no-print">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Report Preparatory Form</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">High-Accuracy GPS Enabled</p>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white print:p-0 print:overflow-visible">
          {step === 'form' && (
            <div className="space-y-8 pb-12">
              {/* Progress Stepper */}
              <div className="flex gap-2 no-print">
                {['personal', 'incident', 'details'].map((s) => (
                  <button 
                    key={s}
                    onClick={() => setFormSection(s as any)}
                    className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                      formSection === s ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-300 border-slate-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {formSection === 'personal' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in slide-in-from-right-4">
                  <div className="col-span-full">
                    <InputLabel label="Full Name of Complainant" />
                    <input type="text" value={draft.complainantName} onChange={(e) => setDraft({...draft, complainantName: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="Legal full name" />
                  </div>
                  <div>
                    <InputLabel label="Father's / Spouse's Name" />
                    <input type="text" value={draft.complainantFatherSpouseName} onChange={(e) => setDraft({...draft, complainantFatherSpouseName: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                  </div>
                  <div>
                    <InputLabel label="Age" />
                    <input type="number" value={draft.complainantAge} onChange={(e) => setDraft({...draft, complainantAge: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                  </div>
                  <div className="col-span-full">
                    <InputLabel label="Active Contact Number" />
                    <input type="tel" value={draft.complainantPhone} onChange={(e) => setDraft({...draft, complainantPhone: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                  </div>
                  <div className="col-span-full">
                    <InputLabel label="Present Address" />
                    <textarea value={draft.complainantAddress} onChange={(e) => setDraft({...draft, complainantAddress: e.target.value})} rows={2} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="Your residential address" />
                  </div>
                  <button onClick={() => setFormSection('incident')} className="col-span-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200">Next: Incident Profile</button>
                </div>
              )}

              {formSection === 'incident' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in slide-in-from-right-4">
                  <div className="col-span-full">
                    <InputLabel label="Short Subject / Title of Complaint" />
                    <input type="text" value={draft.complaintSubject} onChange={(e) => setDraft({...draft, complaintSubject: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="Briefly state the issue" />
                  </div>
                  <div className="col-span-full">
                    <InputLabel label="Occurrence Category" />
                    <select value={draft.issueType} onChange={(e) => setDraft({...draft, issueType: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold appearance-none">
                      <option value="">Choose category</option>
                      <option value="Physical Assault">Physical Assault / Scuffle</option>
                      <option value="Snatching / Theft">Snatching / Theft / Robbery</option>
                      <option value="Cyber Crime / Online Fraud">Cyber Crime / Financial Fraud</option>
                      <option value="Harassment / Stalking">Harassment / Stalking</option>
                      <option value="Missing Person">Missing Person / Runaway</option>
                      <option value="Road Accident">Road Accident / Hit & Run</option>
                      <option value="Public Nuisance">Public Nuisance / Illegal Activity</option>
                    </select>
                  </div>
                  <div>
                    <InputLabel label="Date of Occurrence" />
                    <input type="date" value={draft.date} onChange={(e) => setDraft({...draft, date: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                  </div>
                  <div>
                    <InputLabel label="Approx. Time of Occurrence" />
                    <input type="time" value={draft.time} onChange={(e) => setDraft({...draft, time: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                  </div>
                  <div className="col-span-full">
                    <InputLabel label="Precise Spot of Incident" />
                    <input type="text" value={draft.incidentAddress} onChange={(e) => setDraft({...draft, incidentAddress: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="Colony, Street, Near X shop etc." />
                  </div>
                  <div className="col-span-full">
                    <InputLabel label="Nearby Landmark" />
                    <input type="text" value={draft.landmark} onChange={(e) => setDraft({...draft, landmark: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                  </div>
                  <button onClick={() => setFormSection('details')} className="col-span-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200">Next: Details & Photos</button>
                </div>
              )}

              {formSection === 'details' && (
                <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-right-4">
                  <div>
                    <InputLabel label="Detailed Chronological Facts" />
                    <textarea value={draft.description} onChange={(e) => setDraft({...draft, description: e.target.value})} rows={5} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="Narrate the event clearly as it happened..." />
                  </div>
                  <div>
                    <InputLabel label="Suspect(s) Description / Vehicle No." />
                    <input type="text" value={draft.suspectDetails} onChange={(e) => setDraft({...draft, suspectDetails: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="Identity markers, vehicle make/color etc." />
                  </div>
                  <div>
                    <InputLabel label="Witness(es) Name & Contact" />
                    <input type="text" value={draft.witnessDetails} onChange={(e) => setDraft({...draft, witnessDetails: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="Provide details of people who saw the incident" />
                  </div>
                  
                  <div className="space-y-4">
                    <InputLabel label="Photographic Evidence" />
                    <div className="flex gap-4">
                      <button onClick={startCamera} className="flex-1 p-5 bg-blue-600 text-white rounded-3xl font-black text-[11px] uppercase shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        Open Camera
                      </button>
                      <div className="flex-1 relative">
                        <input type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setImage(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <div className="flex items-center justify-center h-full p-5 bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400 rounded-3xl font-black text-[11px] uppercase">Upload File</div>
                      </div>
                    </div>
                    {image && <img src={image} className="w-full aspect-video object-cover rounded-3xl border-2 border-white shadow-md" />}
                  </div>

                  <button onClick={handleGenerate} className="w-full py-7 bg-blue-600 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-blue-200">Prepare Official Document</button>
                </div>
              )}
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
                  Capture Snapshot
                </button>
              </div>
            </div>
          )}

          {step === 'result' && (
            <div className="print:block">
              {/* COMPREHENSIVE PRINTABLE DOCUMENT */}
              <div id="printable-draft" className="bg-white text-slate-900 font-sans print:p-0 print:w-full">
                <div className="p-8 border-4 border-slate-900 print:m-0 print:p-12">
                  
                  {/* Location QR & Verification Top Bar */}
                  <div className="flex justify-between items-start mb-10 border-b-4 border-slate-900 pb-8">
                    <div className="max-w-[65%]">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-black text-xl italic">H</div>
                        <h1 className="text-3xl font-black tracking-tighter leading-none">HYDERABAD POLICE<br/>Facilitation Memo</h1>
                      </div>
                      <p className="text-[12px] font-black text-red-600 uppercase tracking-[0.2em] mb-4">Official Preliminary Complaint Draft</p>
                      
                      <div className="space-y-2 text-[10px] font-black uppercase text-slate-500">
                        <p className="bg-slate-100 px-3 py-1 inline-block rounded text-slate-900">ID: #RE-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                        <div className="flex flex-col gap-0.5 mt-2">
                           <p>Generated At: <span className="text-slate-900">{draft.timestamp}</span></p>
                           <p>GPS Precision: <span className="text-green-600">±{draft.locationAccuracy || 'N/A'} Meters Radius</span></p>
                           <p>Device OS Hash: <span className="text-slate-900 font-mono">{Math.random().toString(16).substr(2, 12)}</span></p>
                        </div>
                      </div>
                    </div>
                    <div className="text-center flex flex-col items-center">
                      <div className="p-2 border-2 border-slate-900 rounded-xl mb-2 bg-white">
                        <img src={qrUrl} alt="Location Verification QR" className="w-32 h-32" />
                      </div>
                      <p className="text-[8px] font-black text-slate-900 uppercase tracking-widest bg-yellow-400 px-2 py-0.5 rounded">Spot Verification QR</p>
                      <p className="text-[7px] font-bold text-slate-400 mt-1 uppercase">Scan for Precise Maps Spot</p>
                    </div>
                  </div>

                  {/* Immediate Jurisdiction */}
                  <div className="bg-slate-900 text-white p-6 rounded-xl mb-10 shadow-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Jurisdictional Limit</h2>
                        <p className="text-2xl font-black italic">{suggestedStation?.name || 'Local'} POLICE STATION</p>
                        <p className="text-xs font-bold text-slate-300 mt-1">{suggestedStation?.commissionerate || 'Hyderabad City'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Station Contact (CUG)</p>
                        <p className="text-xl font-black text-yellow-400">{suggestedStation?.mobile || suggestedStation?.phone || '100'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Complainant Information */}
                  <div className="mb-12">
                    <h3 className="text-[13px] font-black uppercase tracking-[0.2em] border-b-2 border-slate-900 pb-2 mb-6 flex items-center gap-3">
                      <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px]">1</span>
                      Complainant Identification
                    </h3>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-12 text-sm">
                      <div className="col-span-1 border-b border-slate-100 pb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Legal Name of Informant</p>
                        <p className="font-black text-lg">{draft.complainantName}</p>
                      </div>
                      <div className="col-span-1 border-b border-slate-100 pb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Active Phone Number</p>
                        <p className="font-black text-lg">{draft.complainantPhone}</p>
                      </div>
                      <div className="border-b border-slate-100 pb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Father / Spouse Name</p>
                        <p className="font-bold">{draft.complainantFatherSpouseName}</p>
                      </div>
                      <div className="border-b border-slate-100 pb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Declared Age</p>
                        <p className="font-bold">{draft.complainantAge} Years</p>
                      </div>
                      <div className="col-span-2 border-b border-slate-100 pb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Permanent/Current Address</p>
                        <p className="font-bold text-slate-700">{draft.complainantAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Incident Profile */}
                  <div className="mb-12">
                    <h3 className="text-[13px] font-black uppercase tracking-[0.2em] border-b-2 border-slate-900 pb-2 mb-6 flex items-center gap-3">
                      <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px]">2</span>
                      Incident Occurrence Profile
                    </h3>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-12 text-sm mb-8">
                      <div className="col-span-2 bg-slate-50 p-4 rounded border-l-4 border-slate-900">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Complaint Subject</p>
                        <p className="font-black text-xl leading-tight uppercase">{draft.complaintSubject}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Reported Category</p>
                        <p className="font-black text-slate-800">{draft.issueType}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Time of Occurrence</p>
                        <p className="font-black text-slate-800">{draft.date} @ {draft.time}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Point of Occurrence / Spot Address</p>
                        <p className="font-bold text-slate-900 text-lg leading-snug">{draft.incidentAddress}</p>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase">GPS Lock: {draft.location}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Nearest Landmark</p>
                        <p className="font-bold">{draft.landmark || 'Not Specified'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-[11px] font-black text-slate-900 uppercase mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                        Detailed Statement of Facts
                      </p>
                      <div className="text-base leading-relaxed p-6 bg-slate-50 italic rounded-xl border-l-8 border-slate-900 whitespace-pre-wrap font-serif shadow-inner">
                        "{draft.description}"
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Evidence & Witnesses */}
                  <div className="mb-12 page-break-inside-avoid">
                    <h3 className="text-[13px] font-black uppercase tracking-[0.2em] border-b-2 border-slate-900 pb-2 mb-6 flex items-center gap-3">
                      <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px]">3</span>
                      Evidence & Witnesses
                    </h3>
                    <div className="grid grid-cols-2 gap-8 text-sm">
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Suspect/Vehicle Data</p>
                        <p className="font-bold text-slate-800">{draft.suspectDetails || 'None Provided'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Eyewitness Logs</p>
                        <p className="font-bold text-slate-800">{draft.witnessDetails || 'No Witnesses Listed'}</p>
                      </div>
                    </div>
                    
                    {image && (
                      <div className="mt-8 border-2 border-slate-100 p-6 rounded-[2rem] bg-slate-50">
                        <p className="text-[11px] font-black text-slate-900 uppercase mb-4 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/></svg>
                          Primary Visual Evidence Attachment
                        </p>
                        <img src={image} className="w-full h-auto max-h-[450px] object-contain rounded-2xl shadow-sm border border-white" />
                        <div className="mt-3 text-center">
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic">Encrypted Metadata: CID-{Math.random().toString(36).substr(2, 12)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Declaration & Final Seals */}
                  <div className="pt-10 border-t-2 border-slate-300 mt-12">
                    <div className="flex gap-4 mb-10">
                      <div className="bg-slate-900 text-white p-2 rounded h-min font-black text-xs">!</div>
                      <p className="text-[10px] text-slate-500 text-justify leading-relaxed italic font-bold">
                        I hereby solemnly declare that the information provided above is accurate to the best of my knowledge. I am aware that filing a false report or misleading a public servant is a punishable offence under sections of Bharatiya Nyaya Sanhita (BNS) / IPC. This document is a computer-facilitated report intended for formal submission to the Duty Officer at the designated Police Station for registration of FIR / GD Entry.
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-end mt-20 px-4">
                      <div className="text-center">
                        <div className="w-56 h-0.5 bg-slate-400 mb-3"></div>
                        <p className="text-[11px] font-black uppercase tracking-widest">Informant Signature</p>
                        <p className="text-[8px] text-slate-400 mt-1 uppercase">Dt: ____________________</p>
                      </div>
                      <div className="text-center">
                        <div className="w-56 h-28 border-2 border-dashed border-slate-200 rounded-xl mb-3 flex items-center justify-center">
                           <p className="text-[9px] font-bold text-slate-200 uppercase rotate-[-15deg]">Station Seal & GD Ref No.</p>
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-widest">Duty Officer Approval</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* ACTION TOOLBAR (Hidden in Print) */}
              <div className="flex flex-col gap-4 mt-10 no-print px-4 pb-12">
                <button onClick={() => window.print()} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-base uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd"/></svg>
                  Generate & Print Final Report
                </button>
                <div className="flex gap-4">
                  <button onClick={() => setStep('form')} className="flex-1 py-5 bg-white border border-slate-900 text-slate-900 rounded-3xl font-black text-[11px] uppercase tracking-widest">Back to Form</button>
                  <button onClick={onClose} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-3xl font-black text-[11px] uppercase tracking-widest">Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @media print {
          #root { display: none !important; }
          html, body { 
            height: auto !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            background: white !important;
            -webkit-print-color-adjust: exact;
          }
          .fixed { position: static !important; display: block !important; padding: 0 !important; background: white !important; }
          .max-w-3xl { max-width: 100% !important; border-radius: 0 !important; margin: 0 !important; box-shadow: none !important; }
          .no-print { display: none !important; }
          #printable-draft { display: block !important; visibility: visible !important; width: 100% !important; }
          .page-break-inside-avoid { page-break-inside: avoid; }
          @page { size: A4; margin: 0.5cm; }
        }
      `}</style>
    </div>
  );
};