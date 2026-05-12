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


export const OpenTripCard: React.FC<{ ot: any, onJoin: (dest: string, path: string, dur: string, type: 'open', jadwal: string) => void, getSisaKuota: (ot: any) => number, visibilities: any, allLeaders: any[], config: any }> = ({ ot, onJoin, getSisaKuota, visibilities, allLeaders, config }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showWebRundown, setShowWebRundown] = useState(false);
  const { playClick, playHover } = useSound();
  
  const v = ot.visibility || {
    mepo: true,
    difficulty: true,
    duration: true,
    leader: true,
    beans: visibilities?.beans ?? true,
    price: true
  };

  const leaders = Array.isArray(ot.leaders) ? ot.leaders : (ot.leader ? [ot.leader] : []);
  
  const durInfo = config?.destinationsData?.find((d: any) => d.name === ot.name)?.paths?.find((p: any) => p.name === ot.path)?.durations?.find((dur: any) => dur.label === ot.duration);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-2xl border-2 border-art-text overflow-hidden hover:shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] transition-all flex flex-col group relative">
      <RundownPreviewModal isOpen={showWebRundown} onClose={() => setShowWebRundown(false)} rundownText={durInfo?.rundownHtml || durInfo?.rundownText || "Itinerary belum tersedia."} title={`${ot.name} - ${ot.duration}`} />
      <div className="h-48 relative overflow-hidden border-b-2 border-art-text">
        <img src={ot.image || undefined} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
         <div className="absolute top-3 left-3 bg-art-green text-white text-[8px] font-black px-2 py-1 rounded-lg border border-white/20 uppercase shadow-sm flex items-center gap-1">
            <Calendar size={10}/> {ot.jadwal}
         </div>
         {v.difficulty && (
           <div className="absolute top-3 right-3 bg-white text-art-text text-[8px] font-black px-2 py-1 rounded-lg border border-art-text/10 uppercase shadow-sm">
              {ot.difficulty}
           </div>
         )}
         <div className={`absolute bottom-3 left-3 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] font-black text-white uppercase tracking-widest border border-white/20 transition-colors ${getSisaKuota(ot) <= 3 ? 'bg-red-500' : 'bg-art-green/80'}`}>
            {getSisaKuota(ot)} Pax Left
         </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
         <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-art-text/40">{ot.region}</span>
            <span className="text-[8px] font-black text-art-green flex items-center gap-1 uppercase bg-art-green/5 px-2 py-0.5 rounded-full border border-art-green/10">
               <Globe size={10}/> {ot.path}
            </span>
         </div>
         <h3 className="text-2xl tracking-tighter font-black uppercase text-art-text mb-4 leading-tight group-hover:text-art-green transition-colors">{ot.name}</h3>
         
         <AnimatePresence>
            {showDetails && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-6 border-t border-dashed border-art-text/10 pt-4"
              >
                 <p className="text-[10px] font-medium text-art-text/60 italic leading-relaxed whitespace-pre-wrap mb-4">{ot.desc || "Bergabunglah dengan trip kami dan nikmati pengalaman mendaki yang tak terlupakan."}</p>
                 
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
                      const hasRundown = durInfo?.rundownHtml || ot.rundownText || ot.rundownPdf;
                      return (
                        <div className="mt-4 p-3 bg-art-bg/30 rounded-xl border border-art-text/10">
                           <h5 className="text-[9px] font-black uppercase text-art-text mb-2 flex items-center gap-1"><FileText size={10} className="text-art-orange" /> Itinerary / Rundown</h5>
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
                        </div>
                      );
                   })()}
              </motion.div>
            )}
         </AnimatePresence>

         <div className="mt-auto pt-4 border-t border-dashed border-art-text/10 flex flex-col gap-4">
           <div className="flex items-center justify-between">
              <div className="flex flex-col">
                 {ot.originalPrice > 0 && <span className="text-[9px] text-art-text/30 line-through">Rp {(ot.originalPrice * 1000).toLocaleString('id-ID')}</span>}
                 <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-art-orange leading-none">Rp {(ot.price * 1000).toLocaleString('id-ID')}</span>
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