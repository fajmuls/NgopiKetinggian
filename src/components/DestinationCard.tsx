import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Coffee, Mountain, Users, MessageCircle, AlertCircle, ShoppingBag, Eye, Download, FileText, Globe, CheckCircle, Smartphone, LogOut, Clock, TrendingUp, CreditCard, CheckCircle2, Trash2, Tent, Info, Send, User, ChevronRight, BellRing, ChevronDown, ExternalLink, Star, MessageSquare, Plus, Minus, Calculator, Share2, GitCompare } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDocs, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { generateRundownPdf, generateInvoice } from '../lib/pdf-utils';
import { customConfirm, customAlert } from '../GlobalDialog';
import { useSound } from '../hooks/useSound';
import { Button } from './Button';
import { RundownPreviewModal } from './RundownPreviewModal';
import { WeatherWidget } from './WeatherWidget';
import { useCompare } from '../CompareContext';

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

export const DestinationCard: React.FC<{ dest: any, visibilities: any, onBook: (destinasi: string, jalur: string, durasi: string, type: 'private' | 'open') => void, facilities?: any }> = ({ dest, visibilities, onBook, facilities }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showWebRundown, setShowWebRundown] = useState(false);
  const [selectedPath, setSelectedPath] = useState(0);
  const [highlighted, setHighlighted] = useState(false);
  const { selectedItems, toggleItem } = useCompare();
  const isSelectedForCompare = selectedItems.some(i => i.id === dest.id);
  
  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // Calculator state
  const [participants, setParticipants] = useState(2);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    // Fetch reviews from firestore
    const reviewsRef = collection(db, 'destinations', dest.id, 'reviews');
    const q = query(reviewsRef, orderBy('date', 'desc'), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReviews(data);
    });
    return () => unsub();
  }, [dest.id]);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
  }, [reviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) {
      customAlert("Harap isi nama dan komentar.");
      return;
    }
    setIsSubmittingReview(true);
    try {
      const reviewsRef = collection(db, 'destinations', dest.id, 'reviews');
      await addDoc(reviewsRef, {
        ...newReview,
        date: serverTimestamp()
      });
      setNewReview({ name: '', rating: 5, comment: '' });
      setShowReviewForm(false);
      customAlert("Terima kasih atas ulasan Anda!");
    } catch (err) {
      console.error(err);
      customAlert("Gagal mengirim ulasan.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

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
      className={`group bg-white border-2 rounded-2xl overflow-hidden hover:shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] transition-all duration-300 relative ${highlighted ? 'border-art-orange shadow-[12px_12px_0px_0px_#ff6b00] ring-4 ring-art-orange/50 ring-offset-4' : 'border-art-text'}`}
    >
      <RundownPreviewModal isOpen={showWebRundown} onClose={() => setShowWebRundown(false)} rundownText={currentDur?.rundownHtml || currentDur?.rundownText || "Itinerary belum tersedia."} title={`${dest.name} - ${currentDur?.label}`} />
      <div className="relative h-64 overflow-hidden border-b-2 border-art-text">
        <img src={dest.image || undefined} alt={dest.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
        
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="bg-art-orange text-white border-2 border-art-text px-3 py-1 font-black text-[9px] tracking-widest uppercase rounded-lg shadow-sm w-fit">{dest.difficulty}</div>
          {dest.showDiscountBadge && currentDur.originalPrice > currentDur.price && (
            <div className="bg-red-500 text-white border-2 border-art-text px-3 py-1 font-black text-[9px] tracking-widest uppercase rounded-lg shadow-sm w-fit animate-pulse flex items-center gap-1">
              Disc {Math.round(((currentDur.originalPrice - currentDur.price) / currentDur.originalPrice) * 100)}%
            </div>
          )}
          {avgRating > 0 && (
            <div className="bg-white/90 backdrop-blur-sm border-2 border-art-text px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
              <Star size={10} className="text-yellow-500 fill-yellow-500" />
              <span className="text-[10px] font-black">{avgRating.toFixed(1)}</span>
              <span className="text-[8px] text-art-text/40 font-bold uppercase tracking-tighter">({reviews.length})</span>
            </div>
          )}
        </div>

        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
          <div className="bg-white border-2 border-art-text px-3 py-1 font-black text-[9px] tracking-widest uppercase rounded-lg shadow-sm">{dest.region || dest.locationTag}</div>
          <button 
            onClick={(e) => { e.stopPropagation(); toggleItem({ id: dest.id, name: dest.name, image: dest.image, price: currentDur.price, difficulty: dest.difficulty, region: dest.region || dest.locationTag, duration: currentDur.label, type: 'private' }); }}
            className={`p-2 rounded-xl border-2 transition-all shadow-sm ${isSelectedForCompare ? 'bg-art-text text-white border-art-text' : 'bg-white/90 text-art-text border-art-text/10 hover:border-art-text'}`}
            title="Bandingkan Trip"
          >
            <GitCompare size={14} />
          </button>
        </div>

        <div className="absolute bottom-4 left-4 flex gap-2">
          <button onClick={() => handleShare('whatsapp')} className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center hover:scale-110 transition-transform shadow-md"><MessageCircle size={14}/></button>
          <button onClick={() => handleShare('twitter')} className="w-8 h-8 bg-sky-400 text-white rounded-lg flex items-center justify-center hover:scale-110 transition-transform shadow-md"><Share2 size={14}/></button>
        </div>

        {((currentDur?.rundownHtml || currentDur?.rundownPdf) && dest.rundownMode !== 'hidden') && (
           <div className="absolute bottom-4 right-4 flex gap-2">
              <button 
                 onClick={(e) => { e.stopPropagation(); playClick(); setShowWebRundown(true); }}
                 className="w-10 h-10 bg-white/90 backdrop-blur-sm border-2 border-art-text rounded-xl flex items-center justify-center text-art-text hover:bg-art-green hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
                 title="Lihat Rundown (Web)"
              >
                 <Eye size={18} />
              </button>
              <button 
                 onClick={(e) => { 
                    e.stopPropagation(); 
                    if (currentDur.rundownPdf) {
                       window.open(currentDur.rundownPdf, '_blank');
                    } else {
                       generateRundownPdf(currentDur, dest.name, currentPath.name, currentDur.label);
                    }
                 }}
                 className="w-10 h-10 bg-white/90 backdrop-blur-sm border-2 border-art-text rounded-xl flex items-center justify-center text-art-text hover:bg-art-orange hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
                 title="Download Itinerary (PDF)"
              >
                 <Download size={18} />
              </button>
           </div>
        )}
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
                  <p className="text-lg md:text-xl font-black text-art-text">Rp {dest.paths?.[0]?.durations?.[0]?.price || '0'}k</p>
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
                 
                 <p className="text-[11px] font-medium text-art-text/60 italic leading-loose bg-art-bg/20 p-4 rounded-xl border border-art-text/5">{dest.desc}</p>

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
                            {p.name}
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
                                          <span className="text-xs font-black text-art-text">Rp {currentDurPrice.toLocaleString('id-ID')}k</span>
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
                                    <span className="text-2xl font-black">Rp {totalEstimation}k</span>
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
                                   {currentDur?.originalPrice > currentDur?.price && <span className="text-[10px] text-art-text/30 line-through">Rp {currentDur.originalPrice}k</span>}
                                   <span className="text-xl font-black text-art-text">Rp {currentDur?.price}k</span>
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
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-art-text flex items-center gap-2">
                             <MessageSquare size={14} /> Ulasan Pendaki ({reviews.length})
                          </h4>
                          <button 
                            onClick={() => setShowReviewForm(!showReviewForm)}
                            className="bg-art-text text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-lg hover:bg-art-orange transition-colors shadow-sm"
                          >
                            {showReviewForm ? 'Batal' : 'Tulis Ulasan'}
                          </button>
                       </div>

                       <AnimatePresence>
                          {showReviewForm && (
                            <motion.form 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              onSubmit={handleSubmitReview}
                              className="bg-art-bg p-4 rounded-xl border border-art-text/5 space-y-3"
                            >
                               <div className="space-y-1">
                                  <label className="text-[8px] font-black uppercase text-art-text/40">Rating Anda</label>
                                  <StarRating rating={newReview.rating} size={20} interactive onRate={(r) => setNewReview(prev => ({ ...prev, rating: r }))} />
                               </div>
                               <input 
                                  className="w-full border border-art-text/10 p-2 rounded-lg text-[10px] font-bold outline-none focus:border-art-orange"
                                  placeholder="Nama Anda..."
                                  value={newReview.name}
                                  onChange={e => setNewReview(prev => ({ ...prev, name: e.target.value }))}
                                  required
                               />
                               <textarea 
                                  className="w-full border border-art-text/10 p-2 rounded-lg text-[10px] font-medium outline-none focus:border-art-orange h-20"
                                  placeholder="Ceritakan pengalaman Anda..."
                                  value={newReview.comment}
                                  onChange={e => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                                  required
                               />
                               <button 
                                  type="submit"
                                  disabled={isSubmittingReview}
                                  className="w-full bg-art-text text-white py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-art-orange transition-colors disabled:opacity-50"
                                >
                                  {isSubmittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
                               </button>
                            </motion.form>
                          )}
                       </AnimatePresence>

                       <div className="space-y-3">
                          {reviews.length === 0 ? (
                            <div className="text-center py-8 opacity-20">
                               <MessageSquare size={24} className="mx-auto mb-2" />
                               <p className="text-[9px] font-black uppercase">Belum ada ulasan</p>
                            </div>
                          ) : (
                            reviews.map((rev) => (
                              <div key={rev.id} className="bg-white border border-art-text/5 p-4 rounded-xl shadow-sm">
                                 <div className="flex justify-between items-start mb-2">
                                    <div>
                                       <p className="text-[10px] font-black uppercase leading-none">{rev.name}</p>
                                       <StarRating rating={rev.rating} size={10} />
                                    </div>
                                    <span className="text-[8px] font-bold text-art-text/30">
                                       {rev.date?.toDate?.() ? rev.date.toDate().toLocaleDateString('id-ID') : 'Baru saja'}
                                    </span>
                                 </div>
                                 <p className="text-[10px] font-medium text-art-text/70 italic leading-relaxed">"{rev.comment}"</p>
                              </div>
                            ))
                          )}
                       </div>
                    </div>

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
