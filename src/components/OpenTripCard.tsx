import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Coffee, Mountain, Users, MessageCircle, AlertCircle, ShoppingBag, Eye, Download, FileText, Globe, CheckCircle, Smartphone, LogOut, Clock, TrendingUp, CreditCard, CheckCircle2, Trash2, Tent, Info, Send, User, ChevronRight, BellRing, ChevronDown, ExternalLink, GitCompare, Share2, History, MoreVertical, MoreHorizontal } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { generateRundownPdf, generateInvoice } from '../lib/pdf-utils';
import { customConfirm, customAlert } from '../GlobalDialog';
import { useSound } from '../hooks/useSound';
import { Button } from './Button';
import { RundownPreviewModal } from './RundownPreviewModal';
import { WeatherWidget } from './WeatherWidget';
import { useCompare } from '../CompareContext';
import { formatPrice } from '../useAppConfig';


import { RatingSystem } from './RatingSystem';

export const OpenTripCard: React.FC<{ ot: any, onJoin: (dest: string, path: string, dur: string, type: 'open', jadwal: string) => void, getSisaKuota: (ot: any) => number, visibilities: any, allLeaders: any[], config: any }> = ({ ot, onJoin, getSisaKuota, visibilities, allLeaders, config }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showWebRundown, setShowWebRundown] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
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
  const [pastParticipants, setPastParticipants] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [highlighted, setHighlighted] = useState(false);
  const { playClick, playHover } = useSound();
  const { selectedItems, toggleItem } = useCompare();
  const isSelectedForCompare = selectedItems.some(i => i.id === ot.id);

  // Parse date to check if expired
  const parseDate = (dateStr: string) => {
    try {
      const parts = dateStr.split(' - ')[1] || dateStr.split(' - ')[0];
      if (!parts) return new Date();
      const [day, month, year] = parts.split(' ');
      const monthMap: any = {
        'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
        'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
      };
      return new Date(parseInt(year), monthMap[month] || 0, parseInt(day));
    } catch (e) { return new Date(); }
  };

  const tripEndDate = parseDate(ot.jadwal);
  const isExpired = tripEndDate < new Date();

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const q = query(collection(db, 'bookings'), where('tripId', '==', ot.id), where('status', '==', 'success'));
      const snap = await getDocs(q);
      setPastParticipants(snap.docs.map(doc => doc.data()));
    } catch (e) { console.error(e); } finally { setLoadingHistory(false); }
  };

  useEffect(() => { if (showHistory) fetchHistory(); }, [showHistory]);

  useEffect(() => {
    const handleHighlight = (e: CustomEvent) => {
      const targetId = ot.id || ot.name;
      if (e.detail === targetId) {
        setHighlighted(true);
        setTimeout(() => setHighlighted(false), 2000);
      }
    };
    window.addEventListener('highlight-dest', handleHighlight as any);
    return () => window.removeEventListener('highlight-dest', handleHighlight as any);
  }, [ot.id, ot.name]);
  
  const v = ot.visibility || {
    mepo: true,
    difficulty: true,
    duration: true,
    leader: true,
    beans: visibilities?.beans ?? true,
    price: true,
    rundown: visibilities?.rundown ?? true
  };

  const leaders = Array.isArray(ot.leaders) ? ot.leaders : (ot.leader ? [ot.leader] : []);
  
  const formatVia = (path: string) => {
    if (!path) return '';
    const clean = path.replace(/^(via|Via|VIA)\s+/i, '').trim();
    return `VIA ${clean}`;
  };

  const durInfo = config?.destinationsData?.find((d: any) => d.name === ot.name)?.paths?.find((p: any) => p.name === ot.path)?.durations?.find((dur: any) => dur.label === ot.duration);

  const handleShare = (platform: 'whatsapp' | 'twitter') => {
    const url = window.location.href;
    const text = `Halo! Cek Open Trip mendaki seru ke ${ot.name} pada tanggal ${ot.jadwal} bersama Ngopi di Ketinggian. Cek di sini: ${url}`;
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <motion.div id={`ot-card-${ot.id || ot.name}`} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`bg-white rounded-2xl border-2 border-art-text overflow-hidden hover:shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] transition-all flex flex-col group relative ${showActionsMenu ? 'z-[60]' : 'z-10'} ${highlighted ? 'ring-4 ring-art-orange ring-offset-4 ring-offset-art-bg animate-pulse' : ''}`}>
      <RundownPreviewModal isOpen={showWebRundown} onClose={() => setShowWebRundown(false)} rundownText={ot.rundownHtml || ot.rundownText || durInfo?.rundownHtml || durInfo?.rundownText || "Itinerary belum tersedia."} title={`${ot.name} - ${ot.duration}`} />
      
      {showHistory && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-art-text/60 backdrop-blur-md" onClick={() => setShowHistory(false)} />
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl">
              <div className="bg-art-text p-6 text-white">
                 <div className="flex justify-between items-start">
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <History size={16} className="text-art-orange" />
                          <h3 className="text-lg font-black uppercase tracking-tight">Riwayat Trip</h3>
                       </div>
                       <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{ot.name} • {ot.jadwal}</p>
                    </div>
                    <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
                 </div>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                 <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-art-bg/30 p-4 rounded-2xl border border-art-text/5 text-center">
                          <span className="block text-[9px] font-black uppercase text-art-text/30 mb-1">Peserta</span>
                          <span className="text-xl font-black text-art-text">{pastParticipants.length}</span>
                       </div>
                       <div className="bg-art-bg/30 p-4 rounded-2xl border border-art-text/5 text-center">
                          <span className="block text-[9px] font-black uppercase text-art-text/30 mb-1">Status</span>
                          <span className="text-xl font-black text-green-600">SELESAI</span>
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
                                      <span className="text-[8px] font-black text-art-orange uppercase tracking-widest">Verified</span>
                                      <span className="text-[7px] font-bold text-art-text/20 uppercase">{p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                                   </div>
                                </div>
                             ))}
                          </div>
                       ) : (
                          <div className="py-12 text-center border-2 border-dashed border-art-text/5 rounded-3xl">
                             <p className="text-[10px] font-bold text-art-text/20 uppercase tracking-widest italic">Belum ada riwayat pendaki</p>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
           </motion.div>
        </div>
      )}
      
      <AnimatePresence>
        {showRatingModal && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-md">
              <RatingSystem mountainName={ot.name} onClose={() => setShowRatingModal(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="h-48 relative overflow-hidden border-b-2 border-art-text">
        <img src={ot.image || undefined} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        
        {isExpired && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-6 z-[15] opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowHistory(true); }}
              className="bg-white text-art-text px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-2 shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              <History size={14} /> Lihat Riwayat
            </button>
          </div>
        )}

         <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <div className={`backdrop-blur-md px-2 py-1 rounded-lg text-[8px] font-black text-white uppercase tracking-widest border border-white/20 transition-colors ${getSisaKuota(ot) <= 3 ? 'bg-red-500' : 'bg-art-green/80'}`}>
               {getSisaKuota(ot)} Pax Left
            </div>
         </div>
      </div>
         
         {/* Mountain Custom Logo */}
         <div className="absolute top-3 left-3 flex flex-row items-center gap-2 z-30">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center -rotate-6 shadow-[3px_3px_0px_0px_#ff6b00] border-2 border-art-text overflow-hidden shrink-0">
              <img src={ot.logo || config?.homepage?.logo || "https://files.catbox.moe/lubzno.png"} alt="Mountain Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="bg-art-green text-white text-[8px] font-black px-2 py-1 rounded-lg border border-white/20 uppercase shadow-sm flex items-center gap-1 shrink-0">
                 <Calendar size={10}/> {ot.jadwal}
              </div>
              {ot.showDiscountBadge && ot.originalPrice > ot.price && (
                <div className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-lg border border-white/20 uppercase shadow-sm flex items-center gap-1 shrink-0 animate-pulse">
                  Disc {Math.round(((ot.originalPrice - ot.price) / ot.originalPrice) * 100)}%
                </div>
              )}
            </div>
         </div>

         <div className="absolute top-3 right-3 flex flex-col gap-2 z-30 items-end">
               <div className="flex gap-2">
                 <button 
                    onClick={(e) => { e.stopPropagation(); toggleItem({ id: ot.id, name: ot.name, image: ot.image, price: ot.price, difficulty: ot.difficulty, region: ot.region, duration: ot.duration, type: 'open' }); }}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shadow-md ${isSelectedForCompare ? 'bg-art-text text-white border-art-text' : 'bg-white/90 text-art-text border-art-text/10 hover:border-art-text'}`}
                    title="Bandingkan Trip"
                 >
                    <GitCompare size={14} />
                 </button>
                 
                 <div className="relative" ref={actionsMenuRef}>
                    <button 
                       onClick={(e) => { e.stopPropagation(); setShowActionsMenu(!showActionsMenu); }}
                       className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border-2 border-art-text/10 text-art-text hover:border-art-orange transition-all shadow-md flex items-center justify-center"
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
                                {(v.rundown !== false && ot.rundownMode !== 'hidden') && (
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
                                            if (ot.rundownPdf) {
                                               window.open(ot.rundownPdf, '_blank');
                                            } else {
                                               generateRundownPdf({ rundownHtml: ot.rundownText || durInfo?.rundownHtml }, ot.name, ot.path, ot.duration);
                                            }
                                            setShowActionsMenu(false);
                                         }}
                                         className="w-full flex items-center gap-2 px-2 py-1.5 text-[9px] font-black uppercase tracking-wider text-art-text hover:bg-art-bg rounded-md transition-colors"
                                      >
                                         <Download size={12} /> Download PDF
                                      </button>
                                   </>
                                )}
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
      <div className="p-5 flex-1 flex flex-col">
         <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-art-text/40">{ot.region}</span>
            <span className="text-[8px] font-black text-art-green flex items-center gap-1 uppercase bg-art-green/5 px-2 py-0.5 rounded-full border border-art-green/10">
               <Globe size={10}/> {formatVia(ot.path)}
            </span>
         </div>
         <div className="flex justify-between items-start mb-1">
            <h3 className="text-2xl tracking-tighter font-black uppercase text-art-text mb-4 leading-tight group-hover:text-art-green transition-colors flex-1">{ot.name}</h3>
            <button 
               onClick={(e) => { e.stopPropagation(); playClick(); setShowRatingModal(true); }}
               className="mt-1 flex flex-col items-end hover:scale-105 transition-transform"
            >
               <RatingSystem mountainName={ot.name} showOnlyRating={true} />
            </button>
         </div>
         
         <AnimatePresence>
            {showDetails && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-6 border-t border-dashed border-art-text/10 pt-4"
              >
                 <WeatherWidget location={ot.name} />
                 
                 <p className="text-[10px] font-medium text-art-text/90 italic leading-relaxed whitespace-pre-wrap mb-4 mt-4">{ot.desc || "Bergabunglah dengan trip kami dan nikmati pengalaman mendaki yang tak terlupakan."}</p>
                 
                 <div className="flex flex-col gap-1.5 pt-3 border-t border-art-text/5">
                    <div className="flex items-center gap-2">
                       <Calendar size={12} className="text-art-green flex-shrink-0" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-art-text">{ot.jadwal}</span>
                       <span className="text-art-text/20">•</span>
                       <span className="text-[10px] font-bold uppercase text-art-text/60">{ot.duration}</span>
                    </div>

                    <div className="flex items-center gap-2">
                       <MapPin size={12} className="text-art-orange flex-shrink-0" />
                       {ot.mepoLink ? (
                         <a href={ot.mepoLink} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase text-art-text underline hover:text-art-orange">{ot.mepo || "Basecamp"}</a>
                       ) : (
                         <span className="text-[10px] font-bold uppercase text-art-text/70">{ot.mepo || "Basecamp"}</span>
                       )}
                    </div>

                    <div className="flex items-center gap-2">
                       <Users size={12} className="text-blue-500 flex-shrink-0" />
                       <div className="flex flex-wrap gap-1 items-center">
                          <span className="text-[10px] font-bold uppercase text-art-text/40">Leader:</span>
                          {leaders.map((ln: string, idx: number) => {
                            const leaderObj = allLeaders?.find((l: any) => l.name === ln);
                            const isPrimary = leaderObj?.isPrimary;
                            return (
                              <span key={idx} className={`text-[10px] font-black uppercase tracking-tight px-2 py-0.5 rounded flex items-center gap-1 ${isPrimary ? 'bg-art-text text-white ring-2 ring-art-orange ring-offset-1' : 'bg-art-bg text-art-text/60 border border-art-text/5'}`}>
                                {isPrimary && <span className="text-[8px] bg-art-orange text-white px-1 rounded-sm leading-tight font-black uppercase">Main</span>}
                                {ln}
                              </span>
                            );
                          })}
                          {leaders.length === 0 && <span className="text-[10px] font-bold uppercase text-art-text/40 italic">TBD</span>}
                       </div>
                    </div>

                    {v.beans && (
                      <div className="flex items-center gap-2">
                         <Coffee size={12} className="text-art-text/40 flex-shrink-0" />
                         <span className="text-[10px] font-bold uppercase text-art-text/50">{ot.beans || "Premium Beans"}</span>
                      </div>
                    )}

                 </div>
                  
                   {(() => {
                      const isRundownVisible = v.rundown !== false;
                      const hasRundown = (durInfo?.rundownHtml || ot.rundownText || ot.rundownPdf) && isRundownVisible;
                      const rundownMode = ot.rundownMode || 'direct';

                      if (rundownMode === 'hidden' || !isRundownVisible) return null;

                      return (
                        <div className="mt-4 p-3 bg-art-bg/30 rounded-xl border border-art-text/10">
                           <h5 className="text-[9px] font-black uppercase text-art-text mb-2 flex items-center gap-1"><FileText size={10} className="text-art-orange" /> Itinerary / Rundown</h5>
                           
                           {rundownMode === 'whatsapp' ? (
                              <button 
                                onClick={() => window.open(`https://wa.me/628123456789?text=${encodeURIComponent(`Halo, saya ingin menanyakan rincian itinerary untuk Open Trip ${ot.name} - ${ot.jadwal}`)}`, '_blank')}
                                className="w-full py-2 bg-green-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-md"
                              >
                                <MessageCircle size={12}/> Hubungi via WhatsApp
                              </button>
                           ) : (
                              <>
                                {(durInfo?.rundownHtml || ot.rundownText) && (
                                    <div className="text-[8px] text-art-text/60 font-mono whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto pr-2 no-scrollbar border-l border-art-orange/30 pl-2">
                                      {durInfo?.rundownHtml || ot.rundownText}
                                    </div>
                                )}
                                
                                {hasRundown ? (
                                  <div className="flex gap-2 mt-3">
                                    <button type="button" onClick={() => setShowWebRundown(true)} className="flex-1 py-1.5 border border-art-text text-art-text bg-white text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-art-bg transition-colors">
                                      Lihat Web <Eye size={8} className="inline ml-1" />
                                    </button>
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        if (ot.rundownPdf) {
                                          window.open(ot.rundownPdf, '_blank');
                                        } else {
                                          generateRundownPdf({ rundownHtml: ot.rundownText || durInfo?.rundownHtml }, ot.name, ot.path, ot.duration);
                                        }
                                      }} 
                                      className="flex-1 py-1.5 bg-art-text text-white text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-art-orange transition-colors"
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
              </motion.div>
            )}
         </AnimatePresence>

         <div className="mt-auto pt-4 border-t border-dashed border-art-text/10 flex flex-col gap-4">
           <div className="flex items-center justify-between">
              <div className="flex flex-col">
                 {ot.originalPrice > 0 && <span className="text-[9px] text-art-text/30 line-through">Rp {formatPrice(ot.originalPrice * 1000)}</span>}
                 <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-art-orange leading-none">Rp {formatPrice(ot.price * 1000)}</span>
                    <span className="text-[8px] font-bold text-art-text/40 uppercase">/Pax</span>
                 </div>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => { playClick(); setShowDetails(!showDetails); }}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border-2"
              >
                {showDetails ? 'Tutup' : 'Detail'}
              </Button>
           </div>
           <Button 
             onClick={() => {
               onJoin(ot.name, ot.path, ot.duration, 'open', ot.jadwal);
               setShowDetails(false);
             }} 
             variant="primary" 
             className="w-full py-3 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] active:shadow-none transition-all"
           >
             Join Trip
           </Button>
         </div>
      </div>
    </motion.div>
  );
};