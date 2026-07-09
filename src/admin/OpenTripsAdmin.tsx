import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadFile } from '../lib/storage-utils';
import { X, Trash2, Plus, GripVertical, Users, Calendar, MapPin, Coffee, Mountain, Info, AlertCircle, FileText, Download, CheckCircle, Send, Globe, Map, Edit2, ChevronDown, Clock, TrendingUp, CreditCard, User, Clipboard, ChevronRight, ShoppingBag, MessageCircle, Eye, Layout } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { generateRundownPdf } from '../lib/pdf-utils';
import { customConfirm, customAlert } from '../GlobalDialog';
import { InputWithPaste, ImageUploader } from '../components/admin/SharedAdmin';
import { RundownEditor } from '../components/admin/RundownEditor';
import { AppConfig, FacilityOption, DIFFICULTY_LEVELS as difficultyLevels, DURATION_LEVELS as durationLevels, OpenTrip, WEBSITE_VERSION, DIFFICULTY_LEVELS, DURATION_LEVELS } from '../useAppConfig';
import { handleFirestoreError, OperationType } from '../lib/firestore-error';
import { CustomSelect } from '../components/CustomSelect';
import { TripPosterGenerator } from './TripPosterGenerator';

export const OpenTripsAdmin = ({ config, updateConfig, showToast, prefillData, clearPrefill }: any) => {
  const [data, setData] = useState<OpenTrip[]>(config.openTrips || []);
  const [expandedIndexes, setExpandedIndexes] = useState<number[]>([]);
  const [activeTabs, setActiveTabs] = useState<Record<number, string>>({});
  const [bookings, setBookings] = useState<any[]>([]);
  const [user] = useAuthState(auth);
  const [showPoster, setShowPoster] = useState<any>(null);

  useEffect(() => {
    if (!user || (user.email !== 'mrachmanfm@gmail.com' && user.email !== 'mrahmanfm@gmail.com')) {
      return;
    }
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (config.openTrips && !prefillData) {
      setData(config.openTrips);
    }
  }, [config.openTrips]);

  useEffect(() => {
    if (prefillData) {
      const matchSchedule = prefillData.jadwal || "";
      let parsedDate = "";
      // Request usually passes just month like "Juli 2026", "23-25 Agustus" -> we just leave status as draft and pre-fill text
      
      const nd = [{ 
        id: Date.now().toString(), 
        name: prefillData.destinasi || "", 
        region: "", 
        jadwal: matchSchedule, 
        kuota: "", 
        kuotaNum: 15,
        mepo: "", 
        difficulty: "", 
        image: "", 
        beans: "", 
        path: "", 
        duration: "2H 1M", 
        price: 0, 
        leaders: [], 
        startDate: "",
        status: 'draft',
        igPostUrl: ""
      }, ...data];
      
      setData(nd);
      setExpandedIndexes([0]);
      clearPrefill();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillData]);

  const getConsumedQuota = (name: string, jadwal: string) => {
    return bookings
      .filter(b => b.type === 'open' && b.destinasi === name && b.jadwal === jadwal && (b.status === 'processing' || b.status === 'lunas' || b.status === 'selesai' || b.status === 'dp_partial'))
      .reduce((acc, b) => acc + (Number(b.peserta) || 0), 0);
  };

  const handleSave = () => { 
    const syncedData = data.map(ot => ({
      ...ot,
      consumedKuota: getConsumedQuota(ot.name, ot.jadwal)
    }));
    updateConfig({ openTrips: syncedData }); 
    showToast('Tersimpan!'); 
  };

  const calculateDateRange = (startDate: string, duration: string) => {
    if (!startDate || !duration) return "";
    
    try {
      const start = new Date(startDate);
      const days = parseInt(duration.split('H')[0]) || 1;
      const end = new Date(start);
      end.setDate(start.getDate() + (days - 1));
      
      const formatDate = (date: Date) => {
        const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
      };

      if (days === 1) return formatDate(start);
      return `${formatDate(start)} - ${formatDate(end)}`;
    } catch (e) {
      return "";
    }
  };

  const handleMountainSelect = (i: number, mountainName: string) => {
    const dest = config.destinationsData?.find((d: any) => d.name === mountainName);
    const nd = [...data];
    if (dest) {
      const defaultPath = dest.paths?.[0]?.name || "";
      const defaultDuration = dest.paths?.[0]?.durations?.[0]?.label || "2H 1M";
      const basePrice = dest.paths?.[0]?.durations?.[0]?.price || 0;
      const originalPrice = dest.paths?.[0]?.durations?.[0]?.originalPrice || 0;
      const rundownPdf = dest.paths?.[0]?.durations?.[0]?.rundownPdf || "";
      const rundownText = dest.paths?.[0]?.durations?.[0]?.rundownHtml || "";

      nd[i] = { 
        ...nd[i], 
        name: dest.name, 
        region: dest.region, 
        difficulty: dest.difficulty, 
        mepo: dest.mepo,
        mepoLink: dest.mepoLink || "",
        beans: dest.beans, 
        image: dest.image,
        kuotaNum: 15,
        maxKuota: 15,
        consumedKuota: 0,
        kuota: "15 Pax Tersisa",
        path: defaultPath,
        duration: defaultDuration,
        price: basePrice,
        rundownPdf: rundownPdf,
        rundownText: rundownText,
        leaders: [],
        status: 'draft'
      };
      
      if (nd[i].startDate) {
        nd[i].jadwal = calculateDateRange(nd[i].startDate, defaultDuration);
      }
    } else {
      nd[i].name = mountainName;
    }
    setData(nd);
  };

  const openTripReqs = bookings.filter(b => b.type === 'open_request' && b.status === 'pending');

  return (
    <div className="space-y-6 text-left">
      {/* Custom Trip Notification / Inbox */}
      {openTripReqs.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-art-text rounded-3xl p-6 shadow-[8px_8px_0px_0px_#1a1a1a] mb-8">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_0px_#1a1a1a]"><Globe size={28} /></div>
                <div>
                   <h3 className="text-xl font-black uppercase text-art-text tracking-tight">Trip Request Notification</h3>
                   <p className="text-[10px] font-bold text-art-text/40 uppercase tracking-widest leading-tight">Request custom / open trip baru (Belum diproses)</p>
                </div>
             </div>
             <div className="bg-white px-4 py-3 md:py-2 rounded-xl border-2 border-art-text shadow-[4px_4px_0px_0px_#1a1a1a]">
                <span className="text-[10px] font-black uppercase text-blue-600">{openTripReqs.length} Masuk</span>
             </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
              {openTripReqs.map((req: any) => (
                <div key={req.id} className="bg-white border-2 border-art-text p-4 rounded-2xl shadow-sm space-y-3">
                   <div className="flex justify-between items-start">
                      <div>
                         <h4 className="font-black uppercase text-[12px] leading-tight">{req.nama}</h4>
                         <p className="text-[10px] font-bold text-art-text/40 font-mono">{req.wa}</p>
                      </div>
                      <div className="text-right">
                         <span className="text-[9px] font-black uppercase bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md mb-1 block">{req.destinasi}</span>
                         <span className="text-[8px] font-bold text-art-text/40 font-mono">{req.jadwal}</span>
                      </div>
                   </div>
                   <div className="bg-blue-50 p-2 rounded-xl border border-blue-100 text-[9px] font-medium text-blue-800 leading-relaxed italic">
                      "{req.pesan || "No special request"}"
                   </div>
                   <div className="flex gap-2">
                      <button 
                         onClick={() => {
                            const nd = [{ 
                              id: Date.now().toString(), 
                              name: req.destinasi, 
                              region: "", 
                              jadwal: req.jadwal, 
                              kuota: "15 Pax Tersisa", 
                              kuotaNum: 15,
                              maxKuota: 15,
                              consumedKuota: 0,
                              mepo: "", 
                              difficulty: "Menengah", 
                              image: "", 
                              beans: "", 
                              path: req.jalur || "Jalur Utama", 
                              duration: "2 Hari 1 Malam", 
                              price: 0, 
                              leaders: [], 
                              startDate: "",
                              status: 'draft',
                              igPostUrl: ""
                            }, ...data];
                            setData(nd);
                            setExpandedIndexes([0]);
                            showToast("Request disetujui & disalin ke Draft!", "success");
                            updateDoc(doc(db, 'bookings', req.id), { status: 'approved_to_draft' });
                          }}
                         className="flex-[2] py-2 bg-blue-600 text-white border-2 border-art-text rounded-xl text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#1a1a1a] active:shadow-none hover:bg-blue-700 transition-all"
                      >Gunakan Data & Buat Draft</button>
                      <button 
                         onClick={async () => {
                            if (confirm("Hapus request ini?")) {
                               await deleteDoc(doc(db, 'bookings', req.id));
                               showToast("Request dihapus", "success");
                            }
                         }}
                         className="flex-1 py-2 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl text-[10px] font-black uppercase"
                      >Hapus</button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Management Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between bg-white p-6 rounded-3xl border-4 border-art-text gap-4 shadow-[8px_8px_0px_0px_#1a1a1a] mb-6">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-art-text text-white rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_#1a1a1a]"><Calendar size={22} /></div>
           <div>
              <h3 className="text-md font-black uppercase text-art-text leading-tight">Manajemen Open Trip</h3>
              <p className="text-[9px] font-bold text-art-text/40 uppercase">Kelola jadwal keberangkatan open trip</p>
           </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto mt-4 sm:mt-0">
              <div className="flex flex-col sm:flex-row bg-white rounded-xl border-2 border-art-text overflow-hidden shadow-sm w-full sm:w-auto">
                 <button type="button" onClick={(e) => {
                   e.preventDefault();
                   const nd = [{ id: Date.now().toString(), name: "", region: "", jadwal: "", kuota: "", mepo: "", difficulty: "", image: "", beans: "", path: "", duration: "", price: 0, leaders: [], status: 'draft', rundownText: '', rundownPdf: '', igPostUrl: '' }, ...data];
                   setData(nd);
                   setExpandedIndexes([0]);
                 }} className="w-full sm:w-auto hover:bg-art-bg px-4 py-4 sm:py-3 min-h-[44px] text-[10px] font-black uppercase tracking-widest border-b-2 sm:border-b-0 sm:border-r-2 border-art-text">+ Trip Manual</button>
                 <button type="button" onClick={(e) => {
                   e.preventDefault();
                   const nd = [{ id: Date.now().toString(), name: "", region: "", jadwal: "Pilih Tanggal Weekend", kuota: "15 Pax", kuotaNum: 15, maxKuota: 15, mepo: "", difficulty: "Menengah", image: "", beans: "", path: "", duration: "2 Hari 1 Malam", price: 0, leaders: [], status: 'draft', isWeekend: true, rundownText: '', rundownPdf: '', igPostUrl: '' }, ...data];
                   setData(nd);
                   setExpandedIndexes([0]);
                 }} className="w-full sm:w-auto hover:bg-blue-50 text-blue-600 px-4 py-4 sm:py-3 min-h-[44px] text-[10px] font-black uppercase tracking-widest border-b-2 sm:border-b-0 sm:border-r-2 border-art-text">+ Trip Weekend</button>
                 <button type="button" onClick={(e) => {
                   e.preventDefault();
                   const message = `Halo Owner,\nMohon update jadwal Open Trip selanjutnya agar bisa segera kami upload ke website.\n\nMohon isi format berikut:\n- Gunung: ____________\n- Via / Jalur: ____________\n- Tanggal: ____________\n- Kuota: ____________\n- Harga (Final): ____________\n- Mepo (Meeting Point): ____________\n\nTerima kasih.`;
                   const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
                   window.open(url, '_blank');
                 }} className="w-full sm:w-auto hover:bg-green-50 text-green-600 px-4 py-4 sm:py-3 min-h-[44px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center sm:justify-start gap-1"><MessageCircle size={12}/> Minta Jadwal (WA)</button>
              </div>
           <button onClick={handleSave} className="w-full sm:w-auto bg-art-orange text-white px-6 py-4 sm:py-3 min-h-[44px] rounded-xl text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">Simpan Database</button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
      {data.map((ot: any, i: number) => {
        const consumed = getConsumedQuota(ot.name, ot.jadwal);
        const isPublished = ot.status === 'published';
        const isLocked = isPublished; // If published, some fields are locked. User said "Once published and confirmed by admin, it cannot be edited" - I'll use published as the trigger for now.

        return (
        <div key={i} className={`relative bg-white rounded-2xl border-2 transition-all p-4 pt-10 md:pt-6 ${isPublished ? 'border-art-green shadow-md' : 'border-art-text bg-gray-50/30'}`}>
          <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-1 ${isPublished ? 'bg-art-green text-white shadow-sm' : 'bg-gray-200 text-gray-500'}`}>
             {isPublished ? <><Globe size={12}/> LIVE / TERBIT</> : 'DRAFT'}
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
             <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setExpandedIndexes(prev => prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i])}>
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${isPublished ? 'bg-art-green text-white' : 'bg-art-text text-white'}`}>
                   {expandedIndexes.includes(i) ? '-' : '+'}
                </span>
                <div>
                   <h4 className="font-black uppercase text-sm tracking-tight flex items-center gap-2">
                      {ot.name || 'Pilih Gunung'} 
                      {isPublished && <CheckCircle size={14} className="text-art-green" />}
                   </h4>
                   <div className="flex gap-2 flex-wrap mt-1">
                      {ot.jadwal && <span className="text-[8px] font-bold bg-white border border-art-text/10 px-2 py-0.5 rounded uppercase">{ot.jadwal}</span>}
                      {ot.path && <span className="text-[8px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">{ot.path}</span>}
                      {consumed > 0 && <span className="text-[8px] font-black bg-art-orange text-white px-2 py-0.5 rounded uppercase">DP: {consumed} Pax</span>}
                   </div>
                </div>
             </div>
             
             <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <button
                   onClick={() => {
                     const nd = [...data];
                     const newStatus = isPublished ? 'draft' : 'published';
                     nd[i].status = newStatus;
                     setData(nd);
                     // Directly sync to Firestore
                     updateConfig({ openTrips: nd });
                     showToast(newStatus === 'published' ? 'Trip telah TERBIT/LIVE!' : 'Trip disimpan sebagai DRAFT.');
                   }}
                   className={`w-full sm:w-auto ${isPublished ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-art-green hover:bg-green-600'} text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]`}
                >
                   {isPublished ? 'Jadikan Draft' : 'Terbitkan Trip'}
                </button>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const formatPrice = (p: number) => {
                      if (p === 0) return '0';
                      if (p < 1000) return `${p}K`;
                      if (p % 1000 === 0) return `${p / 1000}K`;
                      return p.toLocaleString('id-ID');
                    };
                    const msg = `Halo Owner,\nMohon konfirmasi untuk data Open Trip berikut:\n- Gunung: ${ot.name || '-'}\n- Via / Jalur: ${ot.path || '-'}\n- Tanggal: ${ot.jadwal || '-'}\n- Kuota: ${ot.kuota || '-'}\n- Harga: Rp ${formatPrice(ot.price || 0)}\n- Mepo: ${ot.mepo || '-'}\n- Durasi: ${ot.duration || '-'}\n\nApakah data di atas sudah benar dan siap untuk di-publish?`;
                    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
                    window.open(url, '_blank');
                  }}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1 text-[10px] font-black uppercase px-4 py-3 md:py-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all border border-green-200"
                >
                  <MessageCircle size={14}/> Konf. Owner
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const formatPrice = (p: number) => {
                      if (p === 0) return '0';
                      if (p < 1000) return `${p}K`;
                      if (p % 1000 === 0) return `${p / 1000}K`;
                      return p.toLocaleString('id-ID');
                    };
                    const text = `*OPEN TRIP ${ot.name?.toUpperCase() || '-'}*\n\n📅 *Jadwal:* ${ot.jadwal || '-'}\n📍 *Mepo:* ${ot.mepo || '-'}\n⛰️ *Jalur:* ${ot.path || '-'}\n💰 *Harga:* Rp ${formatPrice(ot.price || 0)}\n⏳ *Durasi:* ${ot.duration || '-'}\n👥 *Kuota:* ${ot.kuota || '-'}\n\nYuk booking sekarang melalui website: https://ngopidiketinggian.com`;
                    navigator.clipboard.writeText(text);
                    showToast("Teks trip disalin!");
                  }}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1 text-[10px] font-black uppercase px-4 py-3 md:py-2.5 bg-gray-50 text-art-text rounded-xl hover:bg-gray-100 transition-all border border-art-text/10"
                >
                  <Clipboard size={14}/> Salin Teks
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPoster(ot);
                  }}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1 text-[10px] font-black uppercase px-4 py-3 md:py-2.5 bg-art-orange text-white rounded-xl hover:bg-orange-600 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                >
                  <Layout size={14}/> Poster
                </button>

                <button 
                  disabled={consumed > 0}
                  onClick={() => {
                    if (consumed > 0) {
                      customAlert("Tidak bisa menghapus trip yang sudah ada DP (Down Payment) masuk.");
                      return;
                    }
                    customConfirm("Beneran mau hapus trip ini?", () => {
                      const nd = [...data]; nd.splice(i, 1); setData(nd);
                    });
                  }} 
                  className={`flex items-center justify-center p-2.5 rounded-xl transition-all border ${consumed > 0 ? 'text-gray-300 border-gray-200 opacity-50 cursor-not-allowed' : 'text-red-500 border-red-200 hover:bg-red-50'}`}
                >
                  <Trash2 size={16}/>
                </button>
             </div>
          </div>
          {expandedIndexes.includes(i) && (
          <div className="mt-4 pt-4 border-t border-art-text/5 space-y-4">

              <div className="flex flex-wrap gap-2 mb-4 border-b border-art-text/5 pb-2">
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); setActiveTabs(prev => ({ ...prev, [i]: 'basic' })); }} 
                  className={`px-4 py-3 md:py-2 text-[10px] font-black uppercase rounded-lg transition-all ${(!activeTabs[i] || activeTabs[i] === 'basic') ? 'bg-art-text text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >Info Dasar</button>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); setActiveTabs(prev => ({ ...prev, [i]: 'price' })); }} 
                  className={`px-4 py-3 md:py-2 text-[10px] font-black uppercase rounded-lg transition-all ${activeTabs[i] === 'price' ? 'bg-art-text text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >Harga & Kuota</button>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); setActiveTabs(prev => ({ ...prev, [i]: 'itinerary' })); }} 
                  className={`px-4 py-3 md:py-2 text-[10px] font-black uppercase rounded-lg transition-all ${activeTabs[i] === 'itinerary' ? 'bg-art-text text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >Rundown</button>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); setActiveTabs(prev => ({ ...prev, [i]: 'groups' })); }} 
                  className={`px-4 py-3 md:py-2 text-[10px] font-black uppercase rounded-lg transition-all ${activeTabs[i] === 'groups' ? 'bg-art-text text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >Grup</button>
                
                <button 
                  type="button"
                  onClick={(e) => {
                     e.preventDefault();
                     customAlert(
                        <div className="space-y-4 w-full">
                           <div className="border-b-2 border-art-text pb-2 flex items-center justify-between">
                              <h3 className="font-black uppercase text-sm">Manifest: {ot.name || '-'}</h3>
                           </div>
                           <div className="max-h-96 overflow-y-auto pr-2 space-y-2">
                              {bookings.filter(b => b.type === 'open' && b.destinasi === ot.name && b.jadwal === ot.jadwal && (b.status === 'processing' || b.status === 'lunas' || b.status === 'selesai' || b.status === 'dp_partial')).map(b => (
                                 <div key={b.id} className="p-3 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-between">
                                    <div>
                                       <div className="font-bold text-xs uppercase text-art-text">{b.nama}</div>
                                       <div className="text-[10px] text-gray-500 font-mono mt-1">{b.nohp}</div>
                                    </div>
                                    <div className="text-right">
                                       <div className="text-[10px] font-black uppercase text-art-orange">{b.peserta} Pax</div>
                                       <a href={`https://wa.me/${b.nohp?.replace(/^0/, '62')}`} target="_blank" className="text-[8px] bg-green-100 text-green-700 px-2 py-1 rounded inline-flex mt-1 uppercase font-bold items-center gap-1 hover:bg-green-200 transition-colors"><MessageCircle size={10}/> Chat</a>
                                    </div>
                                 </div>
                              ))}
                              {bookings.filter(b => b.type === 'open' && b.destinasi === ot.name && b.jadwal === ot.jadwal && (b.status === 'processing' || b.status === 'lunas' || b.status === 'selesai' || b.status === 'dp_partial')).length === 0 && (
                                 <p className="text-center text-xs text-gray-400 py-4 font-bold uppercase tracking-widest">Belum ada peserta</p>
                              )}
                           </div>
                        </div>
                     , "Manifest Peserta");
                  }} 
                  className="px-4 py-3 md:py-2 text-[10px] font-black uppercase rounded-lg transition-all bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 flex items-center gap-1 sm:ml-auto"
                ><Users size={12}/> Manifest</button>
              </div>

<div className={activeTabs[i] === 'itinerary' ? "space-y-6" : "hidden"}>
{/* Rundown Section for Open Trip */}
              <div className="bg-art-bg/30 p-5 rounded-2xl border border-art-text/20 space-y-4">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <FileText size={16} className="text-art-text" />
                      <h4 className="text-[11px] font-black uppercase text-art-text tracking-widest">Rundown / Itinerary Settings</h4>
                   </div>
                   <div className="flex gap-2">
                     <button 
                        type="button" 
                        onClick={() => generateRundownPdf({ rundownText: ot.rundownText, rundownPdf: ot.rundownPdf }, ot.name, ot.path, ot.duration)}
                        className="bg-art-text text-white px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest hover:bg-art-orange transition-colors flex items-center gap-1"
                      >
                        <FileText size={10} /> Preview PDF
                      </button>
                     <button 
                        type="button"
                        className="bg-white border border-art-text/20 text-art-text px-3 py-1.5 rounded-lg text-[8px] font-black uppercase hover:bg-art-bg transition-all shadow-sm flex items-center gap-1.5"
                        onClick={() => {
                          const rundownHtml = ot.rundownText || "Belum ada teks rundown.";
                          const title = ot.name ? `${ot.name} - ${ot.duration}` : "Trip Baru";
                          customAlert(
                            <div className="text-left w-full space-y-4">
                              <div className="border-b-2 border-art-text pb-2">
                                <h3 className="font-black uppercase text-xs">Preview Rundown: {title}</h3>
                              </div>
                              <div className="max-h-64 overflow-y-auto no-scrollbar pr-2 text-[10px] font-medium leading-relaxed whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded-xl border border-art-text/5">
                                {rundownHtml}
                              </div>
                              {ot.rundownPdf && (
                                <div className="flex items-center gap-2 text-art-green font-black uppercase text-[8px]">
                                  <CheckCircle size={10} /> PDF Tersedia
                                </div>
                              )}
                            </div>,
                            "Review Rundown"
                          );
                        }}
                     >
                        <Eye size={12} /> Review Rundown
                     </button>
                   </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-art-text/40 uppercase">Rundown PDF (URL Link)</label>
                    <ImageUploader 
                        value={ot.rundownPdf || ''} 
                        onChange={(url) => { const nd = [...data]; nd[i].rundownPdf = url; setData(nd); }}
                        placeholder="URL PDF / File PDF"
                    />
                    <p className="text-[8px] text-art-text/30 italic">Pioritas Utama: Jika ini diisi, user akan mengunduh PDF.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-art-text/40 uppercase">Atau, Ketik Manual (Rundown Detail)</label>
                    <RundownEditor 
                      value={ot.rundownText || ''}
                      onChange={(val) => { const nd = [...data]; nd[i].rundownText = val; setData(nd); }}
                      title={`Rundown ${ot.name}`}
                    />
                  </div>
                </div>
              </div>


               </div>
<div className={activeTabs[i] === 'groups' ? "space-y-6" : "hidden"}>
{/* Layer 7: Group Management (MOVED TO BOTTOM) */}
               <div className="bg-art-green/5 p-5 rounded-2xl border-2 border-art-green/20 space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Users size={16} className="text-art-green" />
                        <h4 className="text-[11px] font-black uppercase text-art-green tracking-widest">Group Management</h4>
                     </div>
                     <div className="flex gap-2">
                       <button 
                          onClick={() => {
                             const tripBookings = bookings.filter(b => b.type === 'open' && b.destinasi === ot.name && b.jadwal === ot.jadwal && (b.status === 'processing' || b.status === 'lunas' || b.status === 'selesai' || b.status === 'dp_partial'));
                             if (tripBookings.length === 0) {
                                customAlert("Belum ada peserta di trip ini.");
                                return;
                             }
                             const numbers = tripBookings.map(b => b.nohp?.replace(/^0/, '62')).filter(Boolean).join(',');
                             const template = `Halo Kak!\nIni broadcast info dari admin untuk Trip ${ot.name || '-'} jadwal ${ot.jadwal || '-'}.\n\nMeeting Point: ${ot.mepo || '-'}\n\nMohon persiapkan diri dan barang bawaan ya!`;
                             customAlert(
                                <div className="space-y-4">
                                   <div className="border-b-2 border-art-text pb-2">
                                      <h3 className="font-black uppercase text-sm">Broadcast WA ({tripBookings.length} Peserta)</h3>
                                   </div>
                                   <textarea 
                                      className="w-full border border-art-text/20 p-3 rounded-xl text-xs font-medium outline-none focus:border-art-orange transition-all min-h-[150px]"
                                      defaultValue={template}
                                      id={`broadcast-msg-${i}`}
                                   />
                                   <div className="flex flex-col gap-2">
                                      <p className="text-[9px] text-gray-500 font-medium italic">* WA Web tidak mendukung kirim massal otomatis. Klik tombol di bawah untuk membuka chat satu per satu dengan pesan yang sudah terisi.</p>
                                      <div className="max-h-40 overflow-y-auto space-y-2 mt-2">
                                        {tripBookings.map((b, idx) => (
                                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg">
                                            <span className="text-[10px] font-bold uppercase">{b.nama} ({b.nohp})</span>
                                            <button 
                                              onClick={() => {
                                                const msg = (document.getElementById(`broadcast-msg-${i}`) as HTMLTextAreaElement)?.value || template;
                                                window.open(`https://wa.me/${b.nohp?.replace(/^0/, '62')}?text=${encodeURIComponent(msg)}`, '_blank');
                                              }}
                                              className="text-[9px] font-black uppercase bg-green-500 text-white px-3 py-1.5 rounded hover:bg-green-600 transition-colors flex items-center gap-1"
                                            ><Send size={10}/> Kirim</button>
                                          </div>
                                        ))}
                                      </div>
                                   </div>
                                </div>
                             , "Broadcast Info");
                          }}
                          className="bg-white border-2 border-green-200 text-green-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm hover:bg-green-50 transition-all flex items-center gap-1"
                       ><MessageCircle size={12}/> Broadcast WA</button>
                       <button 
                          onClick={() => {
                             const nd = [...data];
                             if (!nd[i].groups) nd[i].groups = [];
                             nd[i].groups.push({ id: Date.now().toString(), name: `Grup ${nd[i].groups.length + 1}`, leader: "", members: "" });
                             setData(nd);
                          }}
                          className="bg-art-green text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm hover:scale-105 transition-all"
                       >Tambah Grup</button>
                     </div>
                  </div>

                  <div className="space-y-3">
                     {!ot.groups || ot.groups.length === 0 ? (
                        <div className="py-8 text-center border-2 border-dashed border-art-green/10 rounded-2xl">
                           <p className="text-[9px] font-bold text-art-green/30 uppercase tracking-widest">Belum ada grup yang dibentuk</p>
                        </div>
                     ) : (
                        ot.groups.map((group: any, gIdx: number) => (
                           <div key={group.id} className="bg-white border-2 border-art-green p-4 rounded-2xl space-y-3 relative group">
                              <button 
                                 onClick={() => {
                                    const nd = [...data];
                                    nd[i].groups.splice(gIdx, 1);
                                    setData(nd);
                                 }}
                                 className="absolute top-2 right-2 text-red-200 hover:text-red-500 transition-colors"
                              ><X size={14} /></button>
                              
                              <div className="grid grid-cols-2 gap-3">
                                 <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-art-green/40">Nama Grup</label>
                                    <input 
                                       className="w-full border-2 border-art-green/10 p-1.5 rounded-lg text-[10px] font-bold outline-none focus:border-art-green"
                                       value={group.name}
                                       onChange={(e) => {
                                          const nd = [...data];
                                          nd[i].groups[gIdx].name = e.target.value;
                                          setData(nd);
                                       }}
                                    />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-art-green/40">Leader / Guider</label>
                                    <select 
                                       className="w-full border-2 border-art-green/10 p-1.5 rounded-lg text-[10px] font-bold outline-none focus:border-art-green"
                                       value={group.leader}
                                       onChange={(e) => {
                                          const nd = [...data];
                                          nd[i].groups[gIdx].leader = e.target.value;
                                          setData(nd);
                                       }}
                                    >
                                       <option value="">Pilih Leader</option>
                                       {config.tripLeaders?.filter((l: any) => !l.isHidden).map((l: any) => <option key={l.id || l.name} value={l.name}>{l.name}</option>)}
                                    </select>
                                 </div>
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[8px] font-black uppercase text-art-green/40">Daftar Anggota (Ketik per baris)</label>
                                 <textarea 
                                    className="w-full border-2 border-art-green/10 p-2 rounded-lg text-[10px] h-20 outline-none focus:border-art-green resize-none font-mono"
                                    value={group.members}
                                    placeholder="Contoh:&#10;1. Andi&#10;2. Budi&#10;3. Caca"
                                    onChange={(e) => {
                                       const nd = [...data];
                                       nd[i].groups[gIdx].members = e.target.value;
                                       setData(nd);
                                    }}
                                 />
                              </div>

                              <div className="flex gap-2">
                                 <button 
                                    onClick={() => {
                                       const text = `*PEMBAGIAN GRUP TRIP ${ot.name.toUpperCase()}*\n*Jadwal:* ${ot.jadwal}\n\n*${group.name.toUpperCase()}*\nLeader: ${group.leader || "-"}\n\nAnggota:\n${group.members}\n\n_Silakan koordinasi lebih lanjut melalui leader masing-masing. Enjoy the trip!_`;
                                       const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                                       window.open(waUrl, '_blank');
                                    }}
                                    className="flex-1 py-1.5 bg-art-green text-white rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2"
                                 ><MessageCircle size={12} /> Share to WhatsApp</button>
                                 <button 
                                    onClick={() => {
                                       const text = `*PEMBAGIAN GRUP TRIP ${ot.name.toUpperCase()}*\n*Jadwal:* ${ot.jadwal}\n\n*${group.name.toUpperCase()}*\nLeader: ${group.leader || "-"}\n\nAnggota:\n${group.members}`;
                                       navigator.clipboard.writeText(text);
                                       showToast("Teks Grup disalin!");
                                    }}
                                    className="bg-gray-100 hover:bg-gray-200 text-art-text px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-colors"
                                 >Salin</button>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </div>


              </div>
<div className={(!activeTabs[i] || activeTabs[i] === 'basic') ? "space-y-6" : "hidden"}>
{/* Layer 1: Mountain + Difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-art-text/40">Gunung</label>
                  <CustomSelect 
                    value={ot.name}
                    placeholder="Pilih Gunung"
                    options={config.destinationsData?.map((d: any) => ({ value: d.name, label: d.name })) || []}
                    onChange={(val: string) => handleMountainSelect(i, val)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-art-text/40">Level Kesulitan</label>
                  <CustomSelect 
                    value={ot.difficulty}
                    placeholder="Pilih Level"
                    options={difficultyLevels.map(lvl => ({ value: lvl, label: lvl }))}
                    onChange={(val: string) => { const nd = [...data]; nd[i].difficulty = val; setData(nd); }}
                  />
                </div>
              </div>

              {/* Layer 2: Duration + Trail */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-art-text/40">Durasi</label>
                  <CustomSelect 
                    value={ot.duration}
                    placeholder="Pilih Durasi"
                    disabled={ot.isWeekend}
                    options={DURATION_LEVELS.map(lvl => ({ value: lvl, label: lvl }))}
                    onChange={(val: string) => {
                      const nd = [...data];
                      nd[i].duration = val;
                      nd[i].jadwal = calculateDateRange(ot.startDate, val);
                      setData(nd);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-art-text/40">Jalur (Sesuai Destinasi)</label>
                  <CustomSelect 
                    value={ot.path}
                    placeholder="Pilih Jalur"
                    options={[
                      ...(config.destinationsData?.find((d: any) => d.name === ot.name)?.paths || []).map((p: any) => ({ value: p.name, label: p.name })),
                      { value: 'custom', label: 'Ketik Manual' }
                    ]}
                    onChange={(val: string) => { const nd = [...data]; nd[i].path = val; setData(nd); }}
                  />
                  {ot.path === "custom" && (
                    <input 
                      autoFocus
                      className="w-full border-2 border-art-text/10 p-3 rounded-xl text-[10px] font-bold outline-none focus:border-art-orange transition-all mt-1" 
                      placeholder="Ketik Jalur..."
                      onBlur={e => { if(e.target.value) { const nd = [...data]; nd[i].path = e.target.value; setData(nd); } }}
                    />
                  )}
                </div>
              </div>

              {/* Layer 3: Date + Automatic Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-art-text/40">Keberangkatan</label>
                  {ot.isWeekend ? (
                    <div className="flex gap-1">
                       <div className="flex-[3]">
                          <input 
                            type="date"
                            className="w-full border border-art-text/20 p-2 rounded-xl text-[10px] font-bold outline-none focus:border-art-orange transition-all font-mono" 
                            value={ot.startDate || ""} 
                            onChange={e => { 
                              const date = e.target.value;
                              const d = new Date(date);
                              if (d.getDay() !== 6) {
                                showToast("Trip Weekend harus mulai di hari Sabtu!", "error");
                                return;
                              }
                              const nd = [...data]; 
                              nd[i].startDate = date; 
                              nd[i].duration = "2H 1M"; // Force fixed duration
                              nd[i].jadwal = calculateDateRange(date, "2H 1M");
                              setData(nd); 
                            }} 
                          />
                       </div>
                    </div>
                  ) : (
                    <input 
                      type="date"
                      className="w-full border border-art-text/20 p-2 rounded-xl text-[10px] font-bold outline-none focus:border-art-orange transition-all font-mono" 
                      value={ot.startDate || ""} 
                      onChange={e => { 
                        const date = e.target.value;
                        const nd = [...data]; 
                        nd[i].startDate = date; 
                        nd[i].jadwal = calculateDateRange(date, ot.duration);
                        setData(nd); 
                      }} 
                    />
                  )}
                  {ot.isWeekend && <p className="text-[7px] font-black text-blue-500 uppercase mt-0.5 ml-1">Wajib pilih Hari Sabtu • Durasi fixed 2H 1M</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-art-text/40">Jadwal (Automatis)</label>
                  <input 
                    readOnly
                    className="w-full border border-art-text/20 p-2 rounded-xl text-[10px] font-bold bg-gray-50 text-art-green outline-none uppercase" 
                    value={ot.jadwal || "Otomatis..."} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-art-text/40">Rundown Mode</label>
                  <select 
                    className="w-full border-2 border-art-text/5 p-2 rounded-xl text-xs font-bold outline-none focus:border-art-orange bg-white"
                    value={ot.rundownMode || 'direct'}
                    onChange={(e) => {
                      const nd = [...data];
                      nd[i].rundownMode = e.target.value;
                      setData(nd);
                    }}
                  >
                    <option value="direct">Langsung (Web & PDF)</option>
                    <option value="whatsapp">Minta via WhatsApp</option>
                    <option value="hidden">Sembunyikan</option>
                  </select>
                </div>
              </div>

              </div>
<div className={activeTabs[i] === 'price' ? "space-y-6" : "hidden"}>
{/* Layer 4: Capacity + Availability */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-art-text/40">Kapasitas (Pax)</label>
                    <input 
                      type="text"
                      inputMode="numeric"
                      className="w-full border border-art-text/20 p-2 rounded-xl text-[10px] font-bold outline-none focus:border-art-orange transition-all font-mono" 
                      value={ot.maxKuota ?? 15} 
                      onChange={e => { 
                        let valStr = e.target.value.replace(/^0+/, '');
                        if (valStr === '') valStr = '0';
                        const val = parseInt(valStr) || 0;
                        const nd = [...data]; 
                        nd[i].maxKuota = val; 
                        nd[i].kuotaNum = val; 
                        nd[i].kuota = `${val - consumed} Pax Tersisa`;
                        setData(nd); 
                      }} 
                    />
                 </div>
                 <div className="space-y-1">
                    <label className={`text-[9px] font-black uppercase ${Math.max(0, (ot.maxKuota || 0) - consumed) <= 0 ? 'text-red-500' : Math.max(0, (ot.maxKuota || 0) - consumed) <= 3 ? 'text-art-orange' : 'text-art-green'}`}>Sisa Slot</label>
                    <div className={`w-full border-2 border-dashed p-2 rounded-xl flex items-center justify-center ${Math.max(0, (ot.maxKuota || 0) - consumed) <= 0 ? 'border-red-500/30 bg-red-500/10' : Math.max(0, (ot.maxKuota || 0) - consumed) <= 3 ? 'border-art-orange/30 bg-art-orange/10' : 'border-art-green/30 bg-art-green/10'}`}>
                       <span className={`text-[10px] font-black uppercase ${Math.max(0, (ot.maxKuota || 0) - consumed) <= 0 ? 'text-red-500' : Math.max(0, (ot.maxKuota || 0) - consumed) <= 3 ? 'text-art-orange' : 'text-art-green'}`}>
                          {Math.max(0, (ot.maxKuota || 0) - consumed) <= 0 ? 'Kuota Penuh' : `${Math.max(0, (ot.maxKuota || 0) - consumed)} Pax Tersisa`}
                       </span>
                    </div>
                 </div>
                 {/* Layer 5: Price (K) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-art-text/40">Harga Final (k)</label>
                  <div className="relative">
                    <input 
                      type="text"
                      inputMode="numeric"
                      className="w-full border-2 border-art-text/10 p-3 rounded-xl text-[10px] font-bold outline-none focus:border-art-orange transition-all font-mono pl-8" 
                      value={ot.price ?? 0} 
                      onChange={e => { 
                        let valStr = e.target.value.replace(/^0+/, '');
                        if (valStr === '') valStr = '0';
                        const val = parseInt(valStr) || 0;
                        const nd = [...data]; 
                        nd[i].price = val; 
                        setData(nd); 
                      }} 
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-art-text/30 uppercase">Rp</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-art-text/40">Harga Coret (k) - Opsional</label>
                  <div className="relative">
                    <input 
                      type="text"
                      inputMode="numeric"
                      className="w-full border-2 border-art-text/10 p-3 rounded-xl text-[10px] font-bold outline-none focus:border-art-orange transition-all font-mono pl-8" 
                      value={ot.originalPrice ?? 0} 
                      onChange={e => { 
                        let valStr = e.target.value.replace(/^0+/, '');
                        if (valStr === '') valStr = '0';
                        const val = parseInt(valStr) || 0;
                        const nd = [...data]; 
                        nd[i].originalPrice = val; 
                        setData(nd); 
                      }} 
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-art-text/30 uppercase">Rp</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-art-text/40">Diskon Otomatis</label>
                  <div className="bg-gray-100 p-3 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center min-h-[44px]">
                    {ot.originalPrice && ot.price && ot.originalPrice > ot.price ? (
                      <>
                        <span className="text-[14px] font-black text-art-orange leading-none">{Math.round(((ot.originalPrice - ot.price) / ot.originalPrice) * 100)}%</span>
                        <span className="text-[8px] font-bold uppercase text-gray-400 mt-1">Diskon Hemat</span>
                      </>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Tanpa Diskon</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border-2 border-art-text/5 flex items-center justify-between">
                <div>
                   <h4 className="text-[10px] font-black uppercase text-art-text tracking-widest">Tampilkan Badge Diskon?</h4>
                   <p className="text-[8px] font-bold text-art-text/40 uppercase">Muncul di website & poster</p>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    const nd = [...data];
                    nd[i].showDiscountBadge = !ot.showDiscountBadge;
                    setData(nd);
                  }}
                  className={`w-12 h-6 rounded-full relative transition-all border-2 ${ot.showDiscountBadge ? 'bg-art-orange border-art-orange' : 'bg-gray-200 border-gray-300'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${ot.showDiscountBadge ? 'left-6' : 'left-0.5 shadow-sm'}`}></div>
                </button>
              </div>
             </div>

               </div>
<div className={(!activeTabs[i] || activeTabs[i] === 'basic') ? "space-y-6" : "hidden"}>
{/* Layer 7: Leaders & Description */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-art-text/40">Leaders (Pilih beberapa)</label>
                   <div className="flex flex-wrap gap-2 p-2 border border-art-text/20 rounded-xl bg-white max-h-32 overflow-y-auto">
                     {config.tripLeaders?.filter((l: any) => !l.isHidden).map((leader: any) => (
                       <label key={leader.id} className="flex items-center gap-1.5 px-2 py-1 bg-art-bg/30 rounded-lg cursor-pointer hover:bg-art-bg transition-colors">
                         <input 
                           type="checkbox" 
                           className="w-3 h-3 accent-art-orange"
                           checked={(ot.leaders || []).includes(leader.name)}
                           onChange={(e) => {
                             const nd = [...data];
                             const currentLeaders = [...(ot.leaders || [])];
                             if (e.target.checked) {
                               if (!currentLeaders.includes(leader.name)) {
                                 currentLeaders.push(leader.name);
                               }
                             } else {
                               const idx = currentLeaders.indexOf(leader.name);
                               if (idx > -1) currentLeaders.splice(idx, 1);
                             }
                             nd[i].leaders = currentLeaders;
                             setData(nd);
                           }}
                         />
                         <span className="text-[10px] font-bold">{leader.name}</span>
                       </label>
                     ))}
                   </div>
                 </div>
                 <div className="space-y-1">
                    {ot.leaders?.length > 0 && (
                      <div className="space-y-1 mb-4">
                        <label className="text-[9px] font-black uppercase text-art-orange tracking-widest">Primary Leader (Wajah Utama):</label>
                        <div className="flex flex-wrap gap-1.5 p-1 bg-white border-2 border-art-orange/10 rounded-xl">
                           {ot.leaders.map((ln: string) => (
                             <button
                               key={ln}
                               type="button"
                               onClick={() => {
                                 const nd = [...data];
                                 nd[i].primaryLeader = ln;
                                 setData(nd);
                               }}
                               className={`px-2 py-1.5 rounded-lg text-[9px] font-black uppercase border-2 transition-all ${ot.primaryLeader === ln ? 'bg-art-orange text-white border-art-orange shadow-[2px_2px_0px_0px_#1a1a1a]' : 'bg-white text-art-text/40 border-transparent hover:border-art-orange/20'}`}
                             >
                               {ln}
                             </button>
                           ))}
                        </div>
                      </div>
                    )}
                    <label className="text-[9px] font-black uppercase text-art-text/40">Deskripsi / Itinerary Singkat</label>
                    <textarea 
                      rows={3}
                      placeholder="Tuliskan detail trip atau copy..."
                      className="w-full border border-art-text/20 p-3 rounded-xl text-[10px] font-medium focus:border-art-orange outline-none transition-all resize-none" 
                      value={ot.desc || ""} 
                      onChange={e => { const nd = [...data]; nd[i].desc = e.target.value; setData(nd); }} 
                    />
                 </div>
               </div>

                {/* Layer 8: Meeting Point + Link Map */}
               <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100 space-y-2 mb-4">
                  <label className="text-[10px] font-black uppercase text-pink-600 tracking-widest flex items-center gap-1"><Layout size={10}/> Sumber Iklan (Instagram Post URL)</label>
                  <div className="flex gap-2">
                     <InputWithPaste 
                       className="flex-1 border border-pink-100 p-2.5 rounded-xl text-[11px] font-bold outline-none focus:border-pink-300 transition-all bg-white shadow-sm" 
                       value={ot.instagramPostUrl || ''} 
                       onChange={(e: any) => { const nd = [...data]; nd[i].instagramPostUrl = e.target.value; setData(nd); }} 
                       placeholder="https://www.instagram.com/p/..." 
                     />
                     {ot.instagramPostUrl && (
                       <button 
                         type="button"
                         onClick={() => window.open(ot.instagramPostUrl, '_blank')}
                         className="bg-white text-pink-600 p-2.5 rounded-xl border-2 border-pink-100 hover:bg-pink-50 transition-all shadow-sm"
                         title="Lihat Postingan"
                       >
                         <Send size={16} />
                       </button>
                     )}
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-art-text/40">Nama Meeting Point</label>
                    <input 
                      placeholder="Basecamp Wates"
                      className="w-full border border-art-text/20 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-art-orange transition-all" 
                      value={ot.mepo || ""} 
                      onChange={e => { const nd = [...data]; nd[i].mepo = e.target.value; setData(nd); }}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-black uppercase text-art-text/40">Link Google Maps</label>
                      <button 
                        onClick={async () => {
                          try {
                            const text = await navigator.clipboard.readText();
                            const nd = [...data];
                            nd[i].mepoLink = text;
                            setData(nd);
                            showToast("Link ditempel!");
                          } catch (err) {
                            showToast("Gagal menempel link", "error");
                          }
                        }}
                        className="p-1 rounded text-art-text/60 hover:bg-art-text/5 hover:text-art-text active:scale-95 transition-all outline-none"
                        title="Paste Link"
                      >
                        <Clipboard size={14} />
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <InputWithPaste 
                        placeholder="https://maps.google.com/..." 
                        className="w-full border border-art-text/20 p-2.5 rounded-xl text-xs font-bold focus:border-art-orange outline-none transition-all" 
                        value={ot.mepoLink || ""} 
                        onChange={(e: any) => { const nd = [...data]; nd[i].mepoLink = e.target.value; setData(nd); }} 
                      />
                      <button 
                        onClick={() => {
                          const query = `Basecamp ${ot.name} ${ot.region || ''} ${ot.mepo || ''}`;
                          window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, '_blank');
                        }}
                        className="p-2.5 bg-art-orange text-white rounded-xl hover:bg-orange-600 transition-colors"
                        title="Cari di Google Maps"
                      >
                        <Map size={16} />
                      </button>
                    </div>
                  </div>
               </div>

               {/* Layer 9: Beans */}
               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-art-text/40">Beans (Opsional)</label>
                  <input 
                     className="w-full border border-art-text/20 p-2.5 rounded-xl text-xs font-medium outline-none focus:border-art-orange transition-all" 
                     value={ot.beans || ""} 
                     onChange={e => { const nd = [...data]; nd[i].beans = e.target.value; setData(nd); }}
                     placeholder="Contoh: Arabica Gayo Blend"
                  />
               </div>

               {/* Visibility Settings Per Trip */}
               <div className="bg-art-bg/30 p-3 rounded-xl border border-art-text/5">
                 <p className="text-[9px] font-black uppercase text-art-text/40 tracking-widest mb-2">Visibilitas Detail Trip:</p>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                   {[
                     { key: 'mepo', label: 'Titik Temu' },
                     { key: 'difficulty', label: 'Tingkat Kesulitan' },
                     { key: 'duration', label: 'Durasi' },
                     { key: 'leader', label: 'Pemandu' }
                   ].map(v => (
                     <label key={v.key} className="flex items-center gap-2 cursor-pointer group">
                       <input 
                         type="checkbox" 
                         className="w-4 h-4 accent-art-orange"
                         checked={(ot.visibility || { mepo: true, difficulty: true, duration: true, leader: true })[v.key]}
                         onChange={e => {
                           const nd = [...data];
                           nd[i].visibility = {
                             ...(ot.visibility || { mepo: true, difficulty: true, duration: true, leader: true }),
                             [v.key]: e.target.checked
                           };
                           setData(nd);
                         }}
                       />
                       <span className="text-[10px] font-bold text-art-text/60 group-hover:text-art-text">{v.label}</span>
                     </label>
                   ))}
                 </div>
                 <p className="text-[8px] font-medium text-art-text/30 mt-2 italic">* Beberapa detail wajib tampil secara sistem.</p>
               </div>

              {/* Poster Link */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-art-text/40">Link Gambar Poster</label>
                <div className="w-full">
                  <ImageUploader 
                    value={ot.image} 
                    onChange={url => { const nd = [...data]; nd[i].image = url; setData(nd); }} 
                  />
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      );
    })}
    </div>
    <AnimatePresence>
      {showPoster && (
        <TripPosterGenerator 
          trip={showPoster} 
          type="open" 
          config={config}
          onClose={() => setShowPoster(null)} 
        />
      )}
    </AnimatePresence>
  </div>
);
};


