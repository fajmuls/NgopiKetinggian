import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Map, Calendar, MapPin, Coffee, Mountain, Users, MessageCircle, AlertCircle, ShoppingBag, Eye, Download, FileText, Globe, CheckCircle, Smartphone, LogOut, Clock, TrendingUp, CreditCard, CheckCircle2, Trash2, Tent, Info, Send, User, ChevronRight, BellRing, ChevronDown, ExternalLink } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDocs, deleteDoc } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { generateRundownPdf, generateInvoice } from '../lib/pdf-utils';
import { customConfirm, customAlert } from '../GlobalDialog';
import { useSound } from '../hooks/useSound';
import { Button } from './Button';


export const BookingHistoryModal = ({ isOpen, onClose, showToast, bookings }: { isOpen: boolean, onClose: () => void, showToast: (m: string, t?: any) => void, bookings: any[] }) => {
  const { playClick, playHover, playBack, playPop } = useSound();
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'proses' | 'lunas'>('proses');

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'proses') {
      return b.status === 'pending' || b.status === 'processing' || b.status === 'dp_partial' || b.status === 'approved_to_draft';
    } else {
      return b.status === 'lunas' || b.status === 'selesai' || b.status === 'rejected';
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 text-left text-art-text">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-art-section w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border-4 border-art-text relative shadow-2xl overflow-hidden">
        <div className="p-6 md:p-8 flex justify-between items-center bg-white border-b-4 border-art-text shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-art-orange/10 rounded-xl text-art-orange"><Clock size={24} /></div>
             <div>
               <h3 className="text-xl font-black uppercase tracking-tight leading-none">Riwayat Booking</h3>
               <p className="text-[10px] font-bold text-art-text/40 uppercase tracking-widest mt-1">Pantau status & detail pesananmu</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:text-art-orange transition-colors"><X size={24} /></button>
        </div>

        <div className="bg-white border-b-2 border-art-text/10 px-6 py-2 flex gap-4 shrink-0">
           <button 
             onClick={() => setActiveTab('proses')}
             className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all ${
               activeTab === 'proses' ? 'border-art-orange text-art-orange' : 'border-transparent text-art-text/30 hover:text-art-text/60'
             }`}
           >
             🛒 Diproses
           </button>
           <button 
             onClick={() => setActiveTab('lunas')}
             className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all ${
               activeTab === 'lunas' ? 'border-art-green text-art-green' : 'border-transparent text-art-text/30 hover:text-art-text/60'
             }`}
           >
             ✅ Lunas / Selesai
           </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-art-bg/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-art-orange border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-art-text/40">Memuat Data...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-20 border-4 border-dashed border-art-text/5 rounded-[2rem] bg-white/50">
              <ShoppingBag size={64} className="mx-auto mb-6 text-art-text/10" />
              <p className="text-sm font-black uppercase text-art-text/30 tracking-widest leading-loose">Belum ada riwayat {activeTab === 'proses' ? 'aktif' : 'selesai'}.<br/>Mulai petualanganmu sekarang!</p>
              <Button variant="primary" className="mt-8 mx-auto py-3 px-8 text-xs uppercase" onClick={onClose}>Jelajahi Trip</Button>
            </div>
          ) : (
            filteredBookings.map((b: any) => (
              <div key={b.id} className="bg-white rounded-[2rem] border-2 border-art-text/10 p-6 relative overflow-hidden group hover:border-art-text/30 transition-all shadow-sm">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform">
                   <Mountain size={80} />
                </div>
                
                <div className="flex flex-col md:flex-row gap-6 relative z-10">
                   <div className="flex-1 space-y-4">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 flex items-center gap-1.5 ${
                             b.status === 'lunas' || b.status === 'selesai' ? 'bg-art-green/10 text-art-green border-art-green' : 
                             b.status === 'processing' ? 'bg-blue-50 text-blue-600 border-blue-600' :
                             b.status === 'dp_partial' ? 'bg-yellow-50 text-yellow-600 border-yellow-600' :
                             b.status === 'approved_to_draft' ? 'bg-green-50 text-green-600 border-green-600' :
                             b.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-600' :
                             'bg-art-orange/10 text-art-orange border-art-orange'
                           }`}>
                             {b.status === 'pending' && <Clock size={10} />}
                             {b.status === 'processing' && <TrendingUp size={10} />}
                             {b.status === 'dp_partial' && <CreditCard size={10} />}
                             {b.status === 'approved_to_draft' && <CheckCircle2 size={10} />}
                             {b.status === 'lunas' && <CheckCircle2 size={10} />}
                             {b.status === 'selesai' && <MapPin size={10} />}
                             {b.status === 'rejected' && <X size={10} />}
                             {b.status === 'batal' && <X size={10} />}
                             {b.status === 'pending' ? 'Menunggu' : 
                              b.status === 'processing' ? 'Diproses' : 
                              b.status === 'dp_partial' ? 'DP Parsial' :
                              b.status === 'approved_to_draft' ? 'Disetujui' :
                              b.status === 'lunas' ? 'Lunas' : 
                              b.status === 'selesai' ? 'Trip Selesai' : 
                              b.status === 'rejected' ? 'Ditolak' :
                              'Dibatalkan'}
                           </div>
                           <span className="text-[10px] font-bold text-art-text/30 border-l border-art-text/10 pl-2">🕒 {b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Menunggu...'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           {(b.status === 'lunas' || b.status === 'selesai' || b.status === 'batal') ? (
                             <button 
                               onClick={() => {
                                 customConfirm("Hapus riwayat pesanan ini?", async () => {
                                   try {
                                     await deleteDoc(doc(db, 'bookings', b.id));
                                     playPop();
                                     showToast("Pesanan dihapus!", "success");
                                   } catch (error) {
                                     console.error("Error:", error);
                                   }
                                 });
                               }}
                               className="p-1.5 px-3 text-red-500 hover:bg-red-50 transition-colors uppercase text-[9px] font-black flex items-center gap-1 border-2 border-red-50 rounded-xl"
                             >
                               <Trash2 size={12} /> Hapus
                             </button>
                           ) : (
                             !b.requestCancel && (
                               <button 
                                 onClick={() => {
                                   const isPending = b.status === 'pending';
                                   const confirmMsg = isPending 
                                     ? "Batalkan pesanan ini? Pesanan belum diproses sehingga akan langsung dihapus."
                                     : "Ajukan pembatalan pesanan ini? Admin akan meninjau permintaan pembatalan Anda.";
                                   
                                   customConfirm(confirmMsg, async () => {
                                     try {
                                       if (isPending) {
                                         await deleteDoc(doc(db, 'bookings', b.id));
                                         showToast("Pesanan berhasil dibatalkan!", "success");
                                       } else {
                                         await updateDoc(doc(db, 'bookings', b.id), { requestCancel: true });
                                         showToast("Permintaan pembatalan terkirim!", "info");
                                       }
                                       playPop();
                                     } catch (error) {
                                       console.error("Error:", error);
                                       showToast("Gagal memproses pembatalan", "error");
                                     }
                                   });
                                 }}
                                 className="p-1.5 px-3 text-red-500 hover:bg-red-50 transition-colors uppercase text-[9px] font-black flex items-center gap-1 border-2 border-red-50 rounded-xl"
                               >
                                 <X size={12} /> {b.status === 'pending' ? 'Batalkan' : 'Request Batal'}
                               </button>
                             )
                           )}
                        </div>
                      </div>

                      {b.status === 'pending' && activeTab === 'proses' && (
                       <p className="text-[10px] font-bold text-art-orange italic bg-art-orange/5 p-2 rounded-lg border border-art-orange/10">"Menunggu konfirmasi admin."</p>
                     )}
                     
                     {b.requestCancel && (
                       <p className="text-[10px] font-bold text-red-500 italic bg-red-50 p-2 rounded-lg border border-red-100 mt-2">"Permintaan pembatalan sedang diproses oleh admin."</p>
                     )}
                      
                     <div className="relative pt-4">
                        <div className="flex flex-col md:flex-row gap-6 mt-2">
                           <div className="flex-1 space-y-3">
                              {/* Trip Utama Box */}
                              <div className="bg-art-bg/30 p-5 rounded-2xl border-2 border-art-text/10">
                                <div className="flex justify-between items-center mb-4 pb-3 border-b border-art-text/5">
                                  <h5 className="text-[10px] font-black uppercase text-art-text tracking-widest flex items-center gap-2"><Map size={14} className="text-art-text/40"/> Trip Utama</h5>
                                  <div className="text-right">
                                    <p className="text-[8px] font-bold text-art-text/40 uppercase">Subtotal Trip</p>
                                    <span className="text-[12px] font-black text-art-text">Rp {((b.totalPrice || 0) + (b.discountAmount || 0) - (b.opsionalPrice || 0)).toLocaleString('id-ID')}</span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <div>
                                      <p className="text-[9px] font-black text-art-text/30 uppercase mb-1">Destinasi</p>
                                      <p className="text-xs font-black text-art-text truncate">{b.destinasi}</p>
                                   </div>
                                   <div>
                                      <p className="text-[9px] font-black text-art-text/30 uppercase mb-1">Jalur / Durasi</p>
                                      <p className="text-[10px] font-black text-art-text">{b.jalur} • {b.durasi}</p>
                                   </div>
                                   <div>
                                      <p className="text-[9px] font-black text-art-text/30 uppercase mb-1">Jadwal</p>
                                      <p className="text-[10px] font-black text-art-text truncate">{b.jadwal}</p>
                                   </div>
                                   <div>
                                      <p className="text-[9px] font-black text-art-text/30 uppercase mb-1">Peserta</p>
                                      <p className="text-[10px] font-black text-art-text">{b.peserta} Pax x Rp {((((b.totalPrice || 0) + (b.discountAmount || 0) - (b.opsionalPrice || 0))) / (Number(b.peserta) || 1)).toLocaleString('id-ID')}</p>
                                   </div>
                                </div>
                              </div>

                              {/* Layanan Tambahan Box */}
                              {b.opsionalItems && b.opsionalItems.length > 0 && (
                                <div className="bg-art-bg/30 p-5 rounded-2xl border-2 border-art-text/10">
                                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-art-text/5">
                                    <h5 className="text-[10px] font-black uppercase text-art-text tracking-widest flex items-center gap-2"><Tent size={14} className="text-art-text/40"/> Layanan Tambahan</h5>
                                    <div className="text-right">
                                      <p className="text-[8px] font-bold text-art-text/40 uppercase">Subtotal Layanan</p>
                                      <span className="text-[12px] font-black text-art-orange">Rp {(b.opsionalPrice || 0).toLocaleString('id-ID')}</span>
                                    </div>
                                  </div>
                                  <div className="space-y-2 text-[10px] font-bold text-art-text/60">
                                    {b.opsionalItems.map((item: any, idx: number) => {
                                      const isPending = item.status === 'pending_price';
                                      return (
                                        <div key={idx} className="flex justify-between items-start">
                                          <span className="uppercase">{item.name} {item.isRental ? `(${item.count}x)` : ''}</span>
                                          <span className="text-art-text font-black ml-2 text-right">{isPending ? 'Estimasi Admin' : `Rp ${(item.subtotal || 0).toLocaleString('id-ID')}`}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Promosi Area Box */}
                              {b.promoCode && (
                                <div className="bg-art-green/10 p-5 rounded-2xl border-2 border-art-green/20">
                                  <div className="flex justify-between items-center">
                                    <h5 className="text-[10px] font-black uppercase text-art-green tracking-widest flex items-center gap-2">🎁 Promosi Area {b.discountPercentage && <span className="bg-art-green text-white px-2 py-0.5 rounded-full text-[8px] ml-1">-{b.discountPercentage}%</span>}</h5>
                                    <div className="text-right">
                                      <p className="text-[8px] font-bold text-art-green/60 uppercase text-right">Potongan Harga</p>
                                      <span className="text-[12px] font-black text-art-green">- Rp {b.discountAmount?.toLocaleString('id-ID')}</span>
                                    </div>
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-art-green/10">
                                    <p className="text-[9px] font-bold text-art-green/80 uppercase">KODE AKTIF: <span className="font-black">{b.promoCode}</span></p>
                                  </div>
                                </div>
                              )}
                           </div>

                           <div className="md:w-56 shrink-0 flex flex-col md:border-l border-art-text/10 md:pl-6 justify-between gap-6">
                              <div>
                                <span className="text-[10px] font-black text-art-text/30 uppercase block mb-1">Total Biaya</span>
                                <p className="text-2xl font-black text-art-orange tracking-tighter">Rp {b.totalPrice?.toLocaleString('id-ID')}</p>
                              </div>

                              <div className="flex flex-col gap-2">
                                {b.status === 'approved_to_draft' && (
                                  <button 
                                      onClick={() => {
                                        playClick();
                                        window.dispatchEvent(new CustomEvent('continueRegistration', { detail: b }));
                                      }}
                                      className="w-full flex items-center justify-center gap-2 bg-art-orange text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-sm mb-2"
                                  >
                                      <Edit2 size={14} /> Lanjutkan Registrasi
                                  </button>
                                )}
                                {(b.status === 'lunas' || b.status === 'selesai') ? (
                                  <button 
                                    onClick={() => { playClick(); generateInvoice(b); }}
                                    className="w-full flex items-center justify-center gap-2 bg-art-green text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-green-600 transition-colors shadow-sm"
                                  >
                                    <Download size={14} /> Download Kuitansi
                                  </button>
                                ) : (
                                  <div className="bg-art-bg border border-art-text/10 p-3 rounded-xl flex items-start gap-2">
                                    <Info size={12} className="text-art-text/30 mt-0.5" />
                                    <p className="text-[9px] font-bold text-art-text/40 leading-relaxed italic uppercase tracking-tighter">Kuitansi dapat diunduh jika status sudah "Lunas".</p>
                                  </div>
                                )}

                                {(b.rundownPdf || b.rundownText) && (
                                   <div className="flex flex-col gap-2 mt-4">
                                      <div className="grid grid-cols-2 gap-2">
                                         <button 
                                            onClick={() => {
                                              playClick();
                                              if (b.rundownPdf) {
                                                customAlert(
                                                  <div className="w-full h-[80vh]">
                                                    <iframe src={b.rundownPdf} className="w-full h-full rounded-xl border-2 border-art-text/10" title="Rundown Viewer" />
                                                  </div>, 
                                                  "Lihat Itinerary"
                                                );
                                              } else {
                                                customAlert(<div className="text-[11px] whitespace-pre-wrap text-left p-5 leading-relaxed font-medium font-mono border-2 border-art-text/10 rounded-2xl bg-white">{b.rundownText}</div>, "Itinerary / Rundown");
                                              }
                                            }}
                                            className="flex items-center justify-center gap-2 bg-art-text text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-art-text/80 transition-colors shadow-sm"
                                         >
                                            <Globe size={14} /> Lihat Itinerary
                                         </button>
                                         
                                         <button 
                                            onClick={() => {
                                              playClick();
                                              if (b.rundownPdf) {
                                                  const a = document.createElement('a');
                                                  a.href = b.rundownPdf;
                                                  a.target = "_blank";
                                                  a.click();
                                              } else {
                                                  let durObj = { rundownHtml: b.rundownText || "", label: b.durasi };
                                                  generateRundownPdf(durObj, b.destinasi, b.jalur, b.durasi);
                                              }
                                            }}
                                            className="flex items-center justify-center gap-2 bg-art-orange text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-sm"
                                         >
                                            <Download size={14} /> Download PDF
                                         </button>
                                      </div>
                                   </div>
                                )}

                                
                                <button 
                                  onClick={() => window.open(`https://wa.me/6282127533268?text=${encodeURIComponent(`Halo Admin, saya ingin menanyakan status booking ID: ${(b.id || '').substring(0,8)}`)}`, '_blank')}
                                  className="w-full flex items-center justify-center gap-2 border-2 border-art-text py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-art-text hover:text-white transition-colors"
                                >
                                  <Send size={14} /> Chat Admin
                                </button>
                              </div>
                           </div>
                        </div>
                     </div>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-6 md:p-8 bg-white border-t-2 border-art-text shrink-0 text-center">
           <p className="text-[9px] font-black text-art-text/30 uppercase tracking-[0.3em]">Ngopi di Ketinggian • Adventure & Brew</p>
        </div>
      </motion.div>
    </div>
  );
};