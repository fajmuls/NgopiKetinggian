import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Coffee, Mountain, Users, MessageCircle, AlertCircle, ShoppingBag, Eye, Download, FileText, Globe, CheckCircle, Smartphone, LogOut, Clock, TrendingUp, CreditCard, CheckCircle2, Trash2, Tent, Info, Send, User, ChevronRight, BellRing, ChevronDown, ExternalLink } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { generateRundownPdf, generateInvoice } from '../lib/pdf-utils';
import { customConfirm, customAlert } from '../GlobalDialog';
import { useSound } from '../hooks/useSound';
import { Button } from './Button';
import { RundownPreviewModal } from './RundownPreviewModal';


export const DestinationCard: React.FC<{ dest: any, visibilities: any, onBook: (destinasi: string, jalur: string, durasi: string, type: 'private' | 'open') => void }> = ({ dest, visibilities, onBook }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showWebRundown, setShowWebRundown] = useState(false);
  const [selectedPath, setSelectedPath] = useState(0);
  const [highlighted, setHighlighted] = useState(false);
  
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
        
        {/* Mountain Custom Logo Removed */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="bg-art-orange text-white border-2 border-art-text px-3 py-1 font-black text-[9px] tracking-widest uppercase rounded-lg shadow-sm w-fit">{dest.difficulty}</div>
        </div>

        <div className="absolute top-4 right-4 bg-white border-2 border-art-text px-3 py-1 font-black text-[9px] tracking-widest uppercase rounded-lg shadow-sm">{dest.region || dest.locationTag}</div>

        {/* Quick Action Rundown */}
        {(currentDur?.rundownHtml || currentDur?.rundownPdf) && (
           <div className="absolute bottom-4 right-4 flex gap-2">
              <button 
                 onClick={(e) => { e.stopPropagation(); setShowWebRundown(true); }}
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
              <p className="text-[9px] font-bold text-art-text/40 uppercase tracking-widest">{String(dest.height).replace(/mdpl/i, '').trim()} MDPL</p>
           </div>
           <div className="text-right">
              <p className="text-[9px] font-bold uppercase text-art-orange mb-1">Mulai Dari</p>
              <p className="text-lg md:text-xl font-black text-art-text">Rp {dest.paths?.[0]?.durations?.[0]?.price || '0'}k</p>
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


                       <div className="bg-art-orange/10 p-4 rounded-xl border border-dashed border-art-orange/30">
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-[10px] font-black uppercase text-art-orange">Estimasi Biaya</span>
                             <div className="flex items-center gap-2">
                                {currentDur?.originalPrice > currentDur?.price && <span className="text-[10px] text-art-text/30 line-through">Rp {currentDur.originalPrice}k</span>}
                                <span className="text-xl font-black text-art-text">Rp {currentDur?.price}k</span>
                             </div>
                          </div>
                          <p className="text-[8px] font-bold text-art-text/40 uppercase">Harga Per Orang (Min. 2 Pax)</p>
                       </div>

                       {(() => {
                          const durInfo = currentDur;
                          const hasRundown = durInfo.rundownHtml || durInfo.rundownPdf;
                          return (
                            <div className="p-3 bg-white border border-art-text/10 rounded-xl space-y-2">
                              <h5 className="text-[9px] font-black uppercase text-art-text flex items-center gap-1"><FileText size={10} className="text-art-orange" /> Itinerary / Rundown</h5>
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
                            </div>
                          );
                       })()}
                    </div>

                    <Button 
                      variant="primary" 
                      className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] bg-art-orange shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] active:shadow-none transition-all"
                      onClick={() => {
                        onBook(dest.name, currentPath.name, currentDur?.label || "", "private");
                        setShowDetails(false);
                      }}
                    >
                      Booking Private Trip
                    </Button>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
