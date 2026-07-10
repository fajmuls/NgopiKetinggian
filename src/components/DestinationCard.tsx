import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Coffee, Mountain, Users, MessageCircle, AlertCircle, ShoppingBag, Eye, Download, FileText, Globe, CheckCircle, Smartphone, LogOut, Clock, TrendingUp, CreditCard, CheckCircle2, Trash2, Tent, Info, Send, User, ChevronRight, BellRing, ChevronDown, ExternalLink, Star, MessageSquare, Plus, Minus, Calculator, Share2, GitCompare, History, MoreVertical, MoreHorizontal } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth, loginWithGoogle } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDocs, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { generateRundownPdf, generateInvoice } from '../lib/pdf-utils';
import { customConfirm, customAlert } from '../GlobalDialog';
import { useSound } from '../hooks/useSound';
import { Button } from './Button';
import { RundownPreviewModal } from './RundownPreviewModal';
import { WeatherWidget } from './WeatherWidget';
import { useCompare } from '../CompareContext';
import { formatPrice } from '../useAppConfig';

const StarRating = ({ rating, size = 16, interactive = false, onRate }: { rating: number, size?: number, interactive?: boolean, onRate?: (r: number) => void }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
        >
          <Star
            size={size}
            className={`${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );
};

import { RatingSystem } from './RatingSystem';

export const DestinationCard: React.FC<{ dest: any, visibilities: any, onBook: (destinasi: string, jalur: string, durasi: string, type: 'private' | 'open') => void, facilities?: any }> = ({ dest, visibilities, onBook, facilities }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showWebRundown, setShowWebRundown] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pastParticipants, setPastParticipants] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedPath, setSelectedPath] = useState(0);
  const [highlighted, setHighlighted] = useState(false);
  const { selectedItems, toggleItem } = useCompare();
  const isSelectedForCompare = selectedItems.some(i => i.id === dest.id);
  
  const formatVia = (path: string) => {
    if (!path) return '';
    const clean = path.replace(/^(via|Via|VIA)\s+/i, '').trim();
    return `VIA ${clean}`;
  };

  const [user] = useAuthState(auth);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, 'mountainReviews'),
      where('mountainId', '==', dest.name.toLowerCase().replace(/\s+/g, '-'))
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => doc.data());
      setReviewsCount(data.length);
      if (data.length > 0) {
        const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
        setAvgRating(sum / data.length);
      } else {
        setAvgRating(0);
      }
    });
    return () => unsub();
  }, [dest.name]);
  
  // Calculator state
  const [participants, setParticipants] = useState(2);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail === dest.id) {
        setHighlighted(true);
        setTimeout(() => setHighlighted(false), 3000);
      }
    };
    window.addEventListener('highlight-dest', handler);
    return () => window.removeEventListener('highlight-dest', handler);
  }, [dest.id]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const q = query(collection(db, 'bookings'), where('mountainId', '==', dest.name.toLowerCase().replace(/\s+/g, '-')), where('status', '==', 'success'));
      const snap = await getDocs(q);
      setPastParticipants(snap.docs.map(doc => doc.data()));
    } catch (e) { console.error(e); } finally { setLoadingHistory(false); }
  };

  useEffect(() => { if (showHistory) fetchHistory(); }, [showHistory]);

  const safePaths = useMemo(() => dest.paths && dest.paths.length > 0 ? dest.paths : [{ name: "Jalur Utama", durations: dest.durations || [{ label: "1H (Tektok)", price: 0, originalPrice: 0 }] }], [dest.paths, dest.durations]);
  const currentPath = safePaths[selectedPath] || safePaths[0];
  
  const safeDurations = useMemo(() => currentPath.durations && currentPath.durations.length > 0 ? currentPath.durations : [{ label: "1H (Tektok)", price: 0, originalPrice: 0 }], [currentPath.durations]);
  
  const [selectedDuration, setSelectedDuration] = useState(safeDurations.findIndex((d: any) => d.label === '2H 1M') >= 0 ? safeDurations.findIndex((d: any) => d.label === '2H 1M') : 0);
  const { playHover, playClick } = useSound();
  
  useEffect(() => {
    if (safeDurations && selectedDuration >= safeDurations.length) {
      setSelectedDuration(0);
    }
  }, [selectedPath, safeDurations, selectedDuration]);

  const currentDur = safeDurations[selectedDuration] || safeDurations[0];
  const currentDurPrice = currentDur?.price || 0;

  const totalEstimation = useMemo(() => {
    let base = (currentDur?.price || 0) * participants;
    // Add addons
    selectedAddons.forEach(addonId => {
      // Find addon in facilities.opsi
      const addon = facilities?.opsi?.find((o: any) => o.name === addonId);
      if (addon && addon.price) {
        base += addon.price;
      }
    });
    return base;
  }, [currentDur, participants, selectedAddons, facilities]);

  const handleShare = (platform: 'whatsapp' | 'twitter') => {
    const url = window.location.href;
    const text = `Halo! Cek destinasi mendaki seru ke ${dest.name} bersama Ngopi di Ketinggian. Cek di sini: ${url}`;
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      id={`dest-card-${dest.id}`}
      className={`group bg-white border-2 rounded-2xl overflow-hidden hover:shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] transition-all duration-300 relative ${showActionsMenu ? 'z-[60]' : 'z-10'} ${highlighted ? 'border-art-orange shadow-[12px_12px_0px_0px_#ff6b00] ring-4 ring-art-orange/50 ring-offset-4' : 'border-art-text'}`}
    >
      <RundownPreviewModal isOpen={showWebRundown} onClose={() => setShowWebRundown(false)} rundownText={currentDur?.rundownHtml || currentDur?.rundownText || "Itinerary belum tersedia."} title={`${dest.name} - ${currentDur?.label}`} />
      
      <AnimatePresence>
        {showRatingModal && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-md">
              <RatingSystem mountainName={dest.name} onClose={() => setShowRatingModal(false)} />
            </motion.div>
          </div>
        )}
        {showHistory && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-art-text/60 backdrop-blur-md" onClick={() => setShowHistory(false)} />
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl">
                <div className="bg-art-text p-6 text-white">
                   <div className="flex justify-between items-start">
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                            <History size={16} className="text-art-orange" />
                            <h3 className="text-lg font-black uppercase tracking-tight">Riwayat Ekspedisi</h3>
                         </div>
                         <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{dest.name} • Private Trip</p>
                      </div>
                      <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
                   </div>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                   <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-art-bg/30 p-4 rounded-2xl border border-art-text/5 text-center">
                            <span className="block text-[9px] font-black uppercase text-art-text/30 mb-1">Total Pendaki</span>
                            <span className="text-xl font-black text-art-text">{pastParticipants.length}</span>
                         </div>
                         <div className="bg-art-bg/30 p-4 rounded-2xl border border-art-text/5 text-center">
                            <span className="block text-[9px] font-black uppercase text-art-text/30 mb-1">Trip Status</span>
                            <span className="text-xl font-black text-green-600">VERIFIED</span>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <h4 className="text-[11px] font-black uppercase tracking-widest text-art-text flex items-center gap-2"><Users size={14} className="text-art-orange" /> Jejak Pendaki</h4>
                         {loadingHistory ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-3">
                               <div className="w-8 h-8 border-4 border-art-orange border-t-transparent rounded-full animate-spin" />
                               <p className="text-[10px] font-black uppercase text-art-text/20 tracking-widest">Memuat...</p>
                            </div>
                         ) : pastParticipants.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2">
                               {pastParticipants.map((p, i) => (
                                  <div key={i} className="flex items-center justify-between p-3 bg-art-bg/20 border border-art-text/5 rounded-2xl">
                                     <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white border border-art-text/10 flex items-center justify-center text-art-text/30"><User size={16} /></div>
                                        <div>
                                           <span className="block text-xs font-black uppercase text-art-text">{p.userName}</span>
                                           <span className="block text-[9px] font-bold text-art-text/40 uppercase tracking-tighter">{p.tripTitle}</span>
                                        </div>
                                     </div>
                                     <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-black text-art-orange uppercase tracking-widest">Success</span>
                                        <span className="text-[7px] font-bold text-art-text/20 uppercase">{p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                                     </div>
                                  </div>
                               ))}
                            </div>
                         ) : (
                            <div className="py-12 text-center border-2 border-dashed border-art-text/5 rounded-3xl">
                               <p className="text-[10px] font-bold text-art-text/20 uppercase tracking-widest italic">Belum ada riwayat pendaki terverifikasi</p>
                            </div>
                         )}
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="relative h-64 overflow-hidden border-b-2 border-art-text">
        <img src={dest.image || undefined} alt={dest.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
        
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="bg-art-orange text-white border-2 border-art-text px-3 py-1 font-black text-[9px] tracking-widest uppercase rounded-lg shadow-sm w-fit">{dest.difficulty}</div>
          {dest.showDiscountBadge && currentDur.originalPrice > currentDur.price && (
            <div className="bg-red-500 text-white border-2 border-art-text px-3 py-1 font-black text-[9px] tracking-widest uppercase rounded-lg shadow-sm w-fit animate-pulse flex items-center gap-1">
              Disc {Math.round(((currentDur.originalPrice - currentDur.price) / currentDur.originalPrice) * 100)}%
            </div>
          )}
        </div>

        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-30">
          <div className="bg-white border-2 border-art-text px-3 py-1 font-black text-[9px] tracking-widest uppercase rounded-lg shadow-sm">{dest.region || dest.locationTag}</div>
          <button 
            onClick={(e) => { e.stopPropagation(); playClick(); setShowRatingModal(true); }}
            className="bg-white/90 backdrop-blur-sm border-2 border-art-text px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm hover:scale-105 transition-transform"
          >
            <RatingSystem mountainName={dest.name} showOnlyRating={true} />
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); toggleItem({ id: dest.id, name: dest.name, image: dest.image, price: currentDur.price, difficulty: dest.difficulty, region: dest.region || dest.locationTag, duration: currentDur.label, type: 'private' }); }}
              className={`p-2 rounded-xl border-2 transition-all shadow-sm ${isSelectedForCompare ? 'bg-art-text text-white border-art-text' : 'bg-white/90 text-art-text border-art-text/10 hover:border-art-text'}`}
              title="Bandingkan Trip"
            >
              <GitCompare size={14} />
            </button>
            
            <div className="relative" ref={actionsMenuRef}>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowActionsMenu(!showActionsMenu); }}
                className="p-2 rounded-xl bg-white/90 backdrop-blur-sm border-2 border-art-text/10 text-art-text hover:border-art-orange transition-all shadow-sm"
              >
                <MoreVertical size={14} />
              </button>
              
              <AnimatePresence>
                {showActionsMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-xl border-2 border-art-text overflow-hidden z-[100]"
                  >
                    <div className="p-1.5 space-y-0.5">
                      {((currentDur?.rundownHtml || currentDur?.rundownPdf) && dest.rundownMode !== 'hidden') && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setShowWebRundown(true); setShowActionsMenu(false); }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-[9px] font-black uppercase tracking-wider text-art-text hover:bg-art-bg rounded-md transition-colors"
                          >
                            <Eye size={12} /> Lihat Rundown
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (currentDur.rundownPdf) {
                                window.open(currentDur.rundownPdf, '_blank');
                              } else {
                                generateRundownPdf(currentDur, dest.name, currentPath.name, currentDur.label);
                              }
                              setShowActionsMenu(false); 
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-[9px] font-black uppercase tracking-wider text-art-text hover:bg-art-bg rounded-md transition-colors"
                          >
                            <Download size={12} /> Download PDF
                          </button>
                        </>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowCalculator(true); setShowActionsMenu(false); }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[9px] font-black uppercase tracking-wider text-art-text hover:bg-art-bg rounded-md transition-colors"
                      >
                        <Calculator size={12} /> Kalkulator Biaya
                      </button>
                      <div className="h-[1px] bg-art-text/10 my-0.5"></div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare('whatsapp');
                          setShowActionsMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[9px] font-black uppercase tracking-wider text-art-text hover:bg-art-bg rounded-md transition-colors"
                      >
                        <MessageCircle size={12} /> WA Share
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare('twitter');
                          setShowActionsMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[9px] font-black uppercase tracking-wider text-art-text hover:bg-art-bg rounded-md transition-colors"
                      >
                        <Share2 size={12} /> Tweet Share
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6">
        <div className="flex justify-between items-end mb-4">
           <div>
              <h3 className="text-lg md:text-xl font-black uppercase text-art-text tracking-tight mb-1">{dest.name}</h3>
              <p className="text-[8px] font-bold text-art-text/30 uppercase tracking-widest">{String(dest.height).replace(/mdpl/i, '').trim()} MDPL</p>
           </div>
           <div className="text-right">
              {dest.enablePrivateTrip !== false ? (
                <>
                  <p className="text-[9px] font-bold uppercase text-art-orange mb-1">Mulai Dari</p>
                  <p className="text-lg md:text-xl font-black text-art-text">Rp {formatPrice(dest.paths?.[0]?.durations?.[0]?.price || 0)}k</p>
                </>
              ) : (
                <p className="text-[9px] font-black uppercase text-art-text/30 border border-art-text/10 px-2 py-1 rounded">Private Trip Closed</p>
              )}
           </div>
        </div>

        <div className="flex flex-col gap-3">
           <Button 
            variant="secondary" 
            className="w-full py-4 text-[10px] font-black uppercase tracking-widest border-2"
            onClick={() => { playClick(); setShowDetails(!showDetails); }}
           >
             {showDetails ? 'Tutup Detail' : 'Lihat Detail Trip'}
           </Button>

           <AnimatePresence>
             {showDetails && (
               <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-6 pt-4 border-dashed border-art-text/10"
               >
                 <WeatherWidget location={dest.name} />
                 
                 <p className="text-[11px] font-medium text-art-text/90 italic leading-loose bg-art-bg/20 p-4 rounded-xl border border-art-text/5">{dest.desc}</p>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-art-text/40 mb-2">Pilihan Jalur:</p>
                      <div className="flex flex-wrap gap-2">
                        {safePaths.map((p: any, idx: number) => (
                          <button 
                            key={idx}
                            onClick={() => { playClick(); setSelectedPath(idx); }}
                            className={`text-[9px] font-black uppercase px-4 py-2.5 rounded-xl border-2 transition-all ${selectedPath === idx ? 'bg-art-text text-white border-art-text shadow-[4px_4px_0px_0px_#1a1a1a]' : 'bg-white text-art-text border-blue-100 hover:border-art-orange shadow-sm'}`}
                          >
                            {formatVia(p.name)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-art-text/40 mb-2">Pilihan Durasi:</p>
                      <div className="flex flex-wrap gap-2">
                        {safeDurations.map((dur: any, idx: number) => (
                          <button 
                            key={idx}
                            onClick={() => { playClick(); setSelectedDuration(idx); }}
                            className={`text-[9px] font-black uppercase px-4 py-2.5 rounded-xl border-2 transition-all ${selectedDuration === idx ? 'bg-art-text text-white border-art-text shadow-[4px_4px_0px_0px_#1a1a1a]' : 'bg-white text-art-text border-blue-100 hover:border-art-orange shadow-sm'}`}
                          >
                            {dur.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cost Calculator Section */}
                    {dest.enablePrivateTrip !== false && (
                      <div className="bg-art-orange/5 border-2 border-art-orange/10 rounded-2xl p-5">
                         <div className="flex items-center justify-between mb-4 pb-2 border-b border-art-orange/10">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-art-orange flex items-center gap-2">
                               <Calculator size={14} /> Kalkulator Estimasi Private
                            </h4>
                            <button 
                              onClick={() => setShowCalculator(!showCalculator)}
                              className="text-[9px] font-black uppercase text-art-text/40 hover:text-art-orange transition-colors"
                            >
                              {showCalculator ? 'Sembunyikan' : 'Gunakan'}
                            </button>
                         </div>
                         
                         {showCalculator && (
                           <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 {/* Left: Participants */}
                                 <div className="space-y-3">
                                    <p className="text-[9px] font-black uppercase text-art-text/40 tracking-widest">Kapasitas & Harga Dasar</p>
                                    <div className="bg-white border-2 border-art-text/10 p-4 rounded-2xl shadow-sm space-y-4">
                                       <div className="flex items-center justify-between">
                                          <span className="text-[10px] font-black uppercase">Peserta</span>
                                          <div className="flex items-center gap-3">
                                             <button onClick={() => setParticipants(Math.max(2, participants - 1))} className="w-8 h-8 rounded-lg bg-art-bg flex items-center justify-center hover:bg-art-orange hover:text-white transition-colors border-2 border-art-text/5"><Minus size={14}/></button>
                                             <span className="text-sm font-black min-w-[20px] text-center">{participants}</span>
                                             <button onClick={() => setParticipants(participants + 1)} className="w-8 h-8 rounded-lg bg-art-bg flex items-center justify-center hover:bg-art-orange hover:text-white transition-colors border-2 border-art-text/5"><Plus size={14}/></button>
                                          </div>
                                       </div>
                                       <div className="pt-3 border-t border-dashed border-art-text/5 flex justify-between items-center">
                                          <span className="text-[9px] font-bold text-art-text/40 uppercase">Harga / Pax</span>
                                          <span className="text-xs font-black text-art-text">Rp {formatPrice(currentDurPrice)}k</span>
                                       </div>
                                    </div>
                                 </div>

                                 {/* Right: Add-ons */}
                                 <div className="space-y-3">
                                    <p className="text-[9px] font-black uppercase text-art-text/40 tracking-widest">Layanan Upgrade (Add-ons)</p>
                                    <div className="flex flex-wrap gap-2">
                                       {facilities?.opsi?.filter((o: any) => o.price).map((o: any) => (
                                          <button 
                                             key={o.name}
                                             onClick={() => {
                                                setSelectedAddons(prev => prev.includes(o.name) ? prev.filter(n => n !== o.name) : [...prev, o.name]);
                                             }}
                                             className={`text-[8px] font-black uppercase px-3 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${selectedAddons.includes(o.name) ? 'bg-art-orange text-white border-art-orange shadow-md' : 'bg-white border-art-text/5 text-art-text/40 hover:border-art-orange/20'}`}
                                          >
                                             {o.name}
                                             <span className={`px-1 rounded-sm ${selectedAddons.includes(o.name) ? 'bg-white/20' : 'bg-art-bg text-art-orange'}`}>+{o.price}k</span>
                                          </button>
                                       ))}
                                    </div>
                                 </div>
                              </div>

                              <div className="pt-4 border-t-2 border-art-orange/20 flex justify-between items-center bg-art-orange text-white p-4 rounded-2xl shadow-lg -mx-2">
                                 <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-70">Total Estimasi Private</p>
                                    <p className="text-[7px] font-bold uppercase opacity-50">*Harga sewaktu-waktu bisa berubah</p>
                                 </div>
                                 <div className="text-right">
                                    <span className="text-2xl font-black">Rp {formatPrice(totalEstimation)}k</span>
                                    <p className="text-[8px] font-bold uppercase opacity-70">Sesuai Kapasitas</p>
                                 </div>
                              </div>
                           </motion.div>
                         )}
                      </div>
                    )}

                    {/* Trip Info Grid */}
                    <div className="bg-art-bg/50 rounded-2xl border-2 border-art-text/5 p-5 space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-art-orange/10 flex items-center justify-center text-art-orange animate-pulse"><MapPin size={14}/></div>
                             <div className="overflow-hidden">
                               <p className="text-[8px] font-black uppercase text-art-text/40 tracking-tighter leading-none mb-0.5">Meeting Point (PO)</p>
                               <p className="text-xs font-black truncate">
                                 {dest.mepoLink ? (
                                   <a href={dest.mepoLink} target="_blank" rel="noopener noreferrer" className="text-art-text underline hover:text-art-orange">{dest.mepo || "Basecamp"}</a>
                                 ) : (
                                   dest.mepo || "Basecamp"
                                 )}
                               </p>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><Users size={14}/></div>
                             <div className="overflow-hidden">
                               <p className="text-[8px] font-black uppercase text-art-text/40 tracking-tighter leading-none mb-0.5">Min Quota</p>
                               <p className="text-xs font-black uppercase truncate">{dest.kuota || "2 Pax"}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-art-bg flex items-center justify-center text-art-text/40"><Coffee size={14}/></div>
                             <div className="overflow-hidden">
                               <p className="text-[8px] font-black uppercase text-art-text/40 tracking-tighter leading-none mb-0.5">Beans Selection</p>
                               <p className="text-xs font-black uppercase truncate">{dest.beans || "Premium Blend"}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-art-green/10 flex items-center justify-center text-art-green"><Calendar size={14}/></div>
                             <div className="overflow-hidden">
                               <p className="text-[8px] font-black uppercase text-art-text/40 tracking-tighter leading-none mb-0.5">Jadwal / Schedule</p>
                               <p className="text-xs font-black uppercase truncate">{dest.schedule || "Bebas / Request"}</p>
                             </div>
                          </div>
                       </div>

                       {currentDur.tripContent && (
                          <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl mb-4">
                            <p className="text-[9px] font-black uppercase text-blue-600 mb-1 flex items-center gap-1"><Info size={12} /> Info Penting</p>
                            <p className="text-[10px] font-bold text-blue-900 leading-relaxed italic whitespace-pre-wrap">{currentDur.tripContent}</p>
                          </div>
                       )}

                       {dest.enablePrivateTrip !== false ? (
                          <div className="bg-art-orange/10 p-4 rounded-xl border border-dashed border-art-orange/30">
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-black uppercase text-art-orange">Biaya Per Orang</span>
                                <div className="flex items-center gap-2">
                                   {currentDur?.originalPrice > currentDur?.price && <span className="text-[10px] text-art-text/30 line-through">Rp {formatPrice(currentDur.originalPrice)}k</span>}
                                   <span className="text-xl font-black text-art-text">Rp {formatPrice(currentDur?.price || 0)}k</span>
                                </div>
                             </div>
                             <p className="text-[8px] font-bold text-art-text/40 uppercase">Harga Dasar (Min. 2 Pax)</p>
                          </div>
                       ) : (
                          <div className="bg-gray-100 p-4 rounded-xl border-2 border-gray-200 text-center">
                            <p className="text-xs font-black uppercase text-gray-400">Pemesanan Private Trip Sedang Ditutup</p>
                            <p className="text-[8px] font-bold text-gray-300 uppercase mt-1">Silakan cek Open Trip yang tersedia</p>
                          </div>
                       )}

                       {(() => {
                          const durInfo = currentDur;
                          const isRundownVisible = dest.visibility?.rundown !== false;
                          const hasRundown = (durInfo.rundownHtml || durInfo.rundownPdf) && isRundownVisible;
                          const rundownMode = dest.rundownMode || 'direct';

                          if (rundownMode === 'hidden' || !isRundownVisible) return null;

                          return (
                            <div className="p-3 bg-white border border-art-text/10 rounded-xl space-y-2">
                              <h5 className="text-[9px] font-black uppercase text-art-text flex items-center gap-1"><FileText size={10} className="text-art-orange" /> Itinerary / Rundown</h5>
                              {rundownMode === 'whatsapp' ? (
                                <button 
                                  onClick={() => window.open(`https://wa.me/628123456789?text=${encodeURIComponent(`Halo, saya ingin menanyakan rincian itinerary untuk ${dest.name} - ${currentDur.label}`)}`, '_blank')}
                                  className="w-full py-2.5 bg-green-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-md"
                                >
                                  <MessageCircle size={12}/> Hubungi via WhatsApp
                                </button>
                              ) : (
                                <>
                                  {durInfo.rundownHtml && (
                                    <div className="text-[8px] text-art-text/60 font-mono whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto pr-2 no-scrollbar border-l border-art-orange/30 pl-2">
                                      {durInfo.rundownHtml}
                                    </div>
                                  )}
                                  {hasRundown ? (
                                    <div className="flex gap-2">
                                      <button type="button" onClick={() => setShowWebRundown(true)} className="flex-1 py-2 border border-art-text text-art-text bg-white text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-art-bg transition-colors">
                                        Lihat Web <Eye size={8} className="inline ml-1" />
                                      </button>
                                      <button 
                                        type="button" 
                                        onClick={() => {
                                          if (durInfo.rundownPdf) {
                                            window.open(durInfo.rundownPdf, '_blank');
                                          } else {
                                            generateRundownPdf(durInfo, dest.name, currentPath.name, currentDur.label);
                                          }
                                        }} 
                                        className="flex-1 py-2 bg-art-text text-white text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-art-orange transition-colors"
                                      >
                                        Download PDF <Download size={8} className="inline ml-1" />
                                      </button>
                                    </div>
                                  ) : (
                                    <p className="text-[8px] font-bold text-art-text/20 uppercase text-center py-2">Belum ada rincian rundown</p>
                                  )}
                                </>
                              )}
                            </div>
                          );
                       })()}
                    </div>

                    {/* Ratings & Reviews Section */}
                    {visibilities?.showOverallReview !== false && (
                      <div className="space-y-4">
                         <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-art-text flex items-center gap-2">
                               <MessageSquare size={14} /> Rating & Ulasan Pendaki
                            </h4>
                            <button 
                              onClick={() => setShowRatingModal(true)}
                              className="bg-art-text text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-lg hover:bg-art-orange transition-colors shadow-sm"
                            >
                              Tulis / Lihat Semua
                            </button>
                         </div>
                         <div className="bg-art-bg/30 p-4 rounded-xl border border-art-text/5">
                            <RatingSystem mountainName={dest.name} showOnlyRating={true} />
                            <p className="text-[9px] text-art-text/50 mt-2 font-medium">Klik tombol di atas untuk memberikan ulasan atau melihat detail rating dari pendaki lain.</p>
                         </div>
                      </div>
                    )}

                    {dest.enablePrivateTrip !== false && (
                      <Button 
                        variant="primary" 
                        className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] bg-art-orange shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] active:shadow-none transition-all"
                        onClick={() => {
                          playClick();
                          onBook(dest.name, currentPath.name, currentDur?.label || "", "private");
                          setShowDetails(false);
                        }}
                      >
                        Booking Private Trip
                      </Button>
                    )}
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
