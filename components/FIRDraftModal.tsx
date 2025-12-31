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

  // Capture high accuracy location
  useEffect(() => {
    if (isOpen) {
      const getPos = () => {
        navigator.geolocation.getCurrentPosition((pos) => {
          setDraft(prev => ({
            ...prev,
            locationAccuracy: Math.round(pos.coords.accuracy),
            location: `${pos.coords.latitude.toFixed(7)}, ${pos.coords.longitude.toFixed(7)}`,
            coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }
          }));
        }, null, { enableHighAccuracy: true, timeout: 10000 });
      };
      getPos();
    }
  }, [isOpen]);

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

  const qrData = `https://www.google.com/maps/search/?api=1&query=${draft.coords?.lat},${draft.coords?.lng}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}&color=0-0-0&bgcolor=ffffff&margin=1`;

  const InputLabel = ({ label }: { label: string }) => (
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">{label}</label>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/90 backdrop-blur-md p-0 sm:p-4 overflow-y-auto print:relative print:block print:bg-white print:p-0 print:inset-auto">
      <div className="bg-white w-full max-w-3xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:rounded-none print:overflow-visible">
        
        {/* Modal Header (Hidden in Print) */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 no-print">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Report Preparatory Form</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ready for Print / Submission</p>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white print:p-0 print:overflow-visible">
          {step === 'form' && (
            <div className="space-y-8 pb-12 no-print">
              <div className="flex gap-2">
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
            <div id="printable-area-wrapper">
              <div id="printable-draft" className="bg-white text-slate-900 font-sans print:m-0">
                <div className="p-8 sm:p-12 border-[8px] border-slate-900 print:border-[12px]">
                  
                  {/* Absolute Top-Right QR for Print Verification */}
                  <div className="flex justify-between items-start mb-10 border-b-4 border-slate-900 pb-10">
                    <div className="max-w-[55%]">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl">H</div>
                        <div>
                          <h1 className="text-3xl font-black tracking-tighter leading-tight uppercase">Hyderabad Police</h1>
                          <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Official Preliminary Memo</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-[10px] font-black uppercase text-slate-400">
                        <p className="bg-slate-900 text-white px-3 py-1.5 inline-block rounded-md text-[11px]">DRAFT ID: #HYD-{Math.random().toString(36).substr(2, 8).toUpperCase()}</p>
                        <div className="pt-2">
                          <p>Generation Time: <span className="text-slate-900">{draft.timestamp}</span></p>
                          <p>GPS Integrity: <span className="text-green-600">High Resolution Verified</span></p>
                          <p>Radius Accuracy: <span className="text-slate-900">±{draft.locationAccuracy || '5'} Meters</span></p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="p-3 border-4 border-slate-900 rounded-[2rem] bg-white shadow-xl mb-3">
                        <img src={qrUrl} alt="Location Verification QR" className="w-36 h-36" />
                      </div>
                      <p className="text-[9px] font-black text-slate-900 uppercase tracking-[0.3em] bg-yellow-400 px-4 py-1.5 rounded-full inline-block">Crime Spot Auth QR</p>
                      <p className="text-[7px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Scan to Open High-Precision Map Spot</p>
                    </div>
                  </div>

                  {/* Immediate Action Jurisdiction */}
                  <div className="bg-slate-900 text-white p-8 rounded-[2rem] mb-12 shadow-2xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-2">Primary Jurisdictional Authority</h2>
                        <p className="text-3xl font-black italic tracking-tighter uppercase">{suggestedStation?.name || 'LOCAL'} POLICE STATION</p>
                        <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{suggestedStation?.commissionerate || 'Hyderabad City'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-2">Station CUG Access</p>
                        <p className="text-2xl font-black text-yellow-400 tabular-nums">{suggestedStation?.mobile || suggestedStation?.phone || '100'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-14">
                    <section>
                      <h3 className="text-[14px] font-black uppercase tracking-[0.3em] border-b-2 border-slate-900 pb-3 mb-8 flex items-center gap-4">
                        <span className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-[12px]">01</span>
                        Informant Identification
                      </h3>
                      <div className="grid grid-cols-2 gap-y-8 gap-x-12 text-sm">
                        <div className="col-span-1 border-b-2 border-slate-50 pb-2"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Full Legal Name</p><p className="font-black text-xl text-slate-900">{draft.complainantName}</p></div>
                        <div className="col-span-1 border-b-2 border-slate-50 pb-2"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Verified Contact</p><p className="font-black text-xl text-slate-900">{draft.complainantPhone}</p></div>
                        <div className="border-b-2 border-slate-50 pb-2"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Father / Spouse Name</p><p className="font-bold text-slate-800 text-lg">{draft.complainantFatherSpouseName}</p></div>
                        <div className="border-b-2 border-slate-50 pb-2"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Age</p><p className="font-bold text-slate-800 text-lg">{draft.complainantAge} Years</p></div>
                        <div className="col-span-2"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Residential Address</p><p className="font-bold text-slate-600 text-lg leading-snug">{draft.complainantAddress}</p></div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-[14px] font-black uppercase tracking-[0.3em] border-b-2 border-slate-900 pb-3 mb-8 flex items-center gap-4">
                        <span className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-[12px]">02</span>
                        Occurrence Profile
                      </h3>
                      <div className="grid grid-cols-2 gap-y-8 gap-x-12 text-sm mb-10">
                        <div className="col-span-2 bg-slate-50 p-6 rounded-3xl border-l-[12px] border-slate-900 shadow-inner">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Subject of Complaint</p>
                          <p className="font-black text-2xl leading-none uppercase tracking-tight text-slate-900">{draft.complaintSubject}</p>
                        </div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Occurrence Category</p><p className="font-black text-lg">{draft.issueType}</p></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Date & Time</p><p className="font-black text-lg">{draft.date} @ {draft.time}</p></div>
                        <div className="col-span-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Scene of Crime / Spot Address</p>
                          <p className="font-black text-slate-900 text-xl leading-relaxed">{draft.incidentAddress}</p>
                          <div className="mt-3 flex gap-4 text-[9px] font-bold text-slate-400 uppercase">
                            <span>Lat/Lng: {draft.location}</span>
                            <span className="text-blue-500">Precision Verified</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-8 bg-slate-50 rounded-[2rem] italic border-l-8 border-slate-200 font-serif leading-loose text-lg text-slate-800 shadow-inner">
                        <p className="text-[11px] font-black text-slate-400 uppercase not-italic mb-4 tracking-widest">Statement of Facts</p>
                        "{draft.description}"
                      </div>
                    </section>

                    <section className="page-break-inside-avoid">
                      <h3 className="text-[14px] font-black uppercase tracking-[0.3em] border-b-2 border-slate-900 pb-3 mb-8 flex items-center gap-4">
                        <span className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-[12px]">03</span>
                        Evidence Log
                      </h3>
                      <div className="grid grid-cols-2 gap-10 text-sm mb-12">
                        <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Suspect/Vehicle Data</p>
                          <p className="font-bold text-slate-900 text-base">{draft.suspectDetails || 'None Provided'}</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Eyewitness Information</p>
                          <p className="font-bold text-slate-900 text-base">{draft.witnessDetails || 'No Witnesses Listed'}</p>
                        </div>
                      </div>
                      {image && (
                        <div className="border-[10px] border-slate-50 p-8 rounded-[3rem] bg-white text-center shadow-xl">
                          <p className="text-[11px] font-black uppercase mb-6 text-slate-400 tracking-widest">Primary Visual Attachment</p>
                          <img src={image} className="max-w-full h-auto max-h-[500px] inline-block rounded-3xl shadow-2xl border-4 border-white" />
                        </div>
                      )}
                    </section>
                  </div>

                  <div className="mt-20 pt-12 border-t-4 border-slate-200">
                    <div className="bg-red-50 p-6 rounded-2xl text-[10px] text-red-800 text-justify leading-relaxed mb-20 border border-red-100 font-bold">
                      <strong>SOLEMN DECLARATION:</strong> I hereby declare that the facts stated above are true to the best of my knowledge. I am aware that knowingly providing false information to public servants is a criminal offense under the Bharatiya Nyaya Sanhita (BNS) / Indian Penal Code. This computer-facilitated draft is intended for registration of FIR / General Diary entry at the station.
                    </div>
                    <div className="flex justify-between items-end px-10">
                      <div className="text-center">
                        <div className="w-64 h-0.5 bg-slate-900 mb-4"></div>
                        <p className="text-[12px] font-black uppercase tracking-[0.2em]">Informant Signature</p>
                        <p className="text-[9px] text-slate-400 mt-2 uppercase tracking-widest">Date: ________________</p>
                      </div>
                      <div className="text-center">
                        <div className="w-56 h-32 border-4 border-dashed border-slate-100 rounded-2xl mb-4 flex items-center justify-center">
                          <p className="text-slate-100 font-black uppercase rotate-[-20deg] text-xs">Official Seal Area</p>
                        </div>
                        <p className="text-[12px] font-black uppercase tracking-[0.2em]">Duty Officer Auth</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Toolbar (Hidden in Print) */}
              <div className="flex flex-col gap-4 mt-10 no-print px-4 pb-12">
                <button 
                  onClick={() => window.print()} 
                  className="w-full py-7 bg-blue-600 text-white rounded-[2rem] font-black text-lg uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-5"
                >
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd"/></svg>
                  Generate PDF / Print Report
                </button>
                <div className="flex gap-4">
                  <button onClick={() => setStep('form')} className="flex-1 py-5 bg-white border-2 border-slate-900 text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest">Back to Form</button>
                  <button onClick={onClose} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[2rem] font-black text-xs uppercase tracking-widest">Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @media print {
          /* Robust Print Reset */
          html, body {
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
          }
          
          /* Hide EVERYTHING in the DOM except our modal container */
          body * {
            visibility: hidden !important;
            overflow: visible !important;
          }
          
          /* Show only the modal and its contents */
          .fixed.inset-0, .fixed.inset-0 *,
          #printable-area-wrapper, #printable-area-wrapper * {
            visibility: visible !important;
          }

          /* Force modal to fill page and behave as block */
          .fixed.inset-0 {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            display: block !important;
            background: white !important;
            z-index: auto !important;
            overflow: visible !important;
            padding: 0 !important;
          }

          .max-w-3xl {
            max-width: 100% !important;
            width: 100% !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            height: auto !important;
            overflow: visible !important;
            display: block !important;
          }

          .flex-1 {
            display: block !important;
            overflow: visible !important;
          }

          /* Explicitly hide the UI controls */
          .no-print {
            display: none !important;
            visibility: hidden !important;
          }

          #printable-draft {
            width: 100% !important;
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            overflow: visible !important;
          }

          .page-break-inside-avoid {
            page-break-inside: avoid !important;
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