import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Coffee, Map, Calendar, Users, ChevronRight, Tent, Mountain, CheckCircle2, User, Camera, X, PlusCircle, LogIn, LogOut, MoreVertical, Search, Settings, Mic, TrendingUp, BellRing, MapPin, ChevronDown, ExternalLink, AlertCircle, ShoppingBag, Send, Globe, FileText, Download, Info, Clock, Receipt, CreditCard, Trash2 } from 'lucide-react';
import { useSound } from './hooks/useSound';
import React, { useState, useEffect, useMemo } from 'react';
import { auth, db, loginWithGoogle, logout } from './firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { handleFirestoreError, OperationType } from './lib/firestore-error';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { GlobalDialogProvider, customAlert, customConfirm } from './GlobalDialog';
import { DIFFICULTY_LEVELS, DURATION_LEVELS, OpenTrip, useAppConfig } from './useAppConfig';
import { AdminPanelModal } from './AdminPanel';
import { generateRundownPdf, generateInvoice } from './lib/pdf-utils';

export function Button({ children, className = '', variant = 'primary', onClick, ...props }: any) {
  const { playClick, playHover } = useSound();
  
  const baseStyle = "px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-2 transform active:scale-95";
  const variants = {
    primary: "bg-art-text hover:bg-art-green text-white shadow-sm border border-transparent",
    secondary: "bg-white hover:bg-art-section text-art-text border border-art-text/20",
    glass: "bg-white/90 hover:bg-white text-art-text border border-transparent"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}
      onClick={(e) => {
        playClick();
        if(onClick) onClick(e);
      }}
      onMouseEnter={playHover}
      {...props}
    >
      {children}
    </button>
  );
}

const BookingModal = ({ isOpen, onClose, destinationOptions, prefill, facilities, config, updateConfig, setIsHistoryOpen, userBookings }: { isOpen: boolean, onClose: () => void, destinationOptions?: any[], prefill?: { destinasi: string, jalur: string, durasi: string, type: 'private' | 'open', jadwal?: string }, facilities?: any, config: any, updateConfig: (c: any) => void, setIsHistoryOpen: (v: boolean) => void, userBookings: any[] }) => {
  const { playClick, playHover, playSuccess, playBack, playPop } = useSound();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [viewType, setViewType] = useState<'selection' | 'trip_list' | 'form'>('selection');
  const [user] = useAuthState(auth);

  const [currentType, setCurrentType] = useState<'private' | 'open' | 'open_request'>('private');
  const [selectedDestinasi, setSelectedDestinasi] = useState('');
  const [selectedJalur, setSelectedJalur] = useState('');
  const [selectedDurasi, setSelectedDurasi] = useState('');
  const [selectedJadwal, setSelectedJadwal] = useState(''); 
  const [pesertaCount, setPesertaCount] = useState<number | string>(currentType === 'private' ? 2 : 1);
  const [promoCode, setPromoCode] = useState('');
  
  const [selectedOpsional, setSelectedOpsional] = useState<string[]>([]);
  const [subSelected, setSubSelected] = useState<Record<string, number>>({});
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  const [formState, setFormState] = useState({
    nama: '',
    email: '',
    wa: '',
    deskripsi: ''
  });

  // Load from local storage on mount
  useEffect(() => {
    if (!isOpen) return;
    const saved = localStorage.getItem('ngopi_booking_draft');
    if (saved && !prefill) {
      try {
        const data = JSON.parse(saved);
        setFormState({
          nama: data.nama || '',
          email: data.email || '',
          wa: data.wa || '',
          deskripsi: data.deskripsi || ''
        });
        setPromoCode(data.promoCode || '');
        if (data.destinasi) setSelectedDestinasi(data.destinasi);
        if (data.jalur) setSelectedJalur(data.jalur);
        if (data.durasi) setSelectedDurasi(data.durasi);
        if (data.jadwal) setSelectedJadwal(data.jadwal);
        if (data.pesertaCount) setPesertaCount(data.pesertaCount);
        if (data.type) setCurrentType(data.type);
        // Force viewType to selection as per user request
        setViewType('selection');
      } catch (e) {
        console.error("Failed to load draft", e);
      }
    }
  }, [isOpen]);

  // Persist to local storage
  useEffect(() => {
    if (!isOpen) return;
    const draft = {
      ...formState,
      promoCode,
      destinasi: selectedDestinasi,
      jalur: selectedJalur,
      durasi: selectedDurasi,
      jadwal: selectedJadwal,
      pesertaCount,
      type: currentType,
      viewType
    };
    localStorage.setItem('ngopi_booking_draft', JSON.stringify(draft));
  }, [formState, promoCode, selectedDestinasi, selectedJalur, selectedDurasi, selectedJadwal, pesertaCount, currentType, viewType, isOpen]);

  useEffect(() => {
    if (prefill) {
      setSelectedDestinasi(prefill.destinasi || '');
      setSelectedJalur(prefill.jalur || '');
      setSelectedDurasi(prefill.durasi || '');
      setSelectedJadwal(prefill.jadwal || '');
      setCurrentType(prefill.type || 'private');
      if (prefill.destinasi) setViewType('form');
    }
  }, [prefill]);

  const handleToggleOption = (opt: string) => {
    setSelectedOpsional(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);
  };

  const handleUpdateSubItem = (optName: string, subItemName: string, delta: number) => {
    const key = `${optName}|${subItemName}`;
    setSubSelected(prev => {
      const current = prev[key] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: next };
    });
  };

  const calculateEndDate = (startDateStr: string, durationLabel: string) => {
    if (!startDateStr || !durationLabel) return "";
    const start = new Date(startDateStr);
    const hIndex = durationLabel.indexOf('H');
    const days = hIndex !== -1 ? parseInt(durationLabel.substring(0, hIndex).trim()) : 1;
    const end = new Date(start);
    end.setDate(start.getDate() + (days - 1));
    
    const formatDate = (date: Date) => {
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    if (days === 1) return formatDate(start);
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  let basePricePerPax = 0;
  if (selectedDestinasi && selectedJalur && selectedDurasi && destinationOptions) {
     const dest = destinationOptions.find(d => d.name === selectedDestinasi);
     if (dest) {
       const path = dest.paths?.find((p: any) => p.name === selectedJalur);
       if (path) {
         const duration = path.durations?.find((d: any) => d.label === selectedDurasi);
         if (duration) basePricePerPax = duration.price * 1000;
       }
     }
  }

  // Handle Open Trip Pricing if preselected from OpenTrip card
  if (currentType === 'open' && prefill?.destinasi && config.openTrips) {
     const ot = config.openTrips.find((t: any) => t.name === selectedDestinasi && t.jadwal === selectedJadwal);
     if (ot) basePricePerPax = ot.price * 1000;
  }

  const getOpenTripStats = (otName: string, otJadwal: string) => {
    const ot = config.openTrips?.find((t: any) => t.name === otName && t.jadwal === otJadwal);
    if (!ot) return { sisa: 0, total: 0 };
    const total = ot.maxKuota || ot.kuotaNum || 15;
    const consumed = ot.consumedKuota || 0;
    return { sisa: Math.max(0, total - consumed), total };
  };

  const getSisaKuota = (ot: any) => {
    const total = ot.maxKuota || ot.kuotaNum || 15;
    const consumed = ot.consumedKuota || 0;
    return Math.max(0, total - consumed);
  };

  const activePromo = config?.promoCodes?.find((p: any) => p.code.toLowerCase() === promoCode.toLowerCase());
  const isPromoValid = !!activePromo;
  
    const currentPesertaCount = typeof pesertaCount === 'number' && pesertaCount > 0 ? pesertaCount : 1;
  const grossPrice = basePricePerPax * currentPesertaCount;

  const getDaysFromLabel = (label: string) => {
    if (!label) return 1;
    const hIndex = label.indexOf('H');
    return hIndex !== -1 ? Math.max(1, parseInt(label.substring(0, hIndex).trim())) : 1;
  };
  const tripDays = getDaysFromLabel(selectedDurasi);

  const opsionalItemsList: any[] = [];
  let totalOpsionalPrice = 0;

  // 1. First, handle sub-items (Rental Items)
  Object.entries(subSelected).forEach(([key, qty]) => {
    const [parentName, subName] = key.split('|');
    
    if (!selectedOpsional.includes(parentName)) return;

    const parentOpt = config?.facilities?.opsi?.find((o: any) => o.name === parentName);
    const subItem = parentOpt?.subItems?.find((s: any) => s.name === subName);
    if (subItem) {
      const pricePerDay = subItem.price ? Number(subItem.price) * 1000 : 0;
      const numQty = Number(qty);
      const totalItemPrice = pricePerDay * numQty * tripDays;
      
      opsionalItemsList.push({
        name: subName,
        parentName: parentName,
        price: pricePerDay,
        count: numQty,
        days: tripDays,
        subtotal: totalItemPrice,
        status: pricePerDay > 0 ? 'confirmed' : 'pending_price',
        isRental: true,
        priceInfo: subItem.priceInfo
      });
      totalOpsionalPrice += totalItemPrice;
    }
  });

  // 2. Handle standalone items (Items without sub-items)
  selectedOpsional.forEach(optName => {
    const opt = config?.facilities?.opsi?.find((o: any) => o.name === optName);
    if (opt) {
      if (!opt.subItems || opt.subItems.length === 0) {
        const isCalculated = opt.pricingFormat === 'calculated';
        const price = isCalculated ? (opt.price ? Number(opt.price) * 1000 : 0) : 0;
        const isManual = opt.pricingFormat === 'manual' || !opt.pricingFormat;

        opsionalItemsList.push({
          name: optName,
          parentName: optName,
          price: price,
          count: 1,
          days: 1, 
          subtotal: price,
          status: isManual ? 'pending_price' : 'confirmed',
          isRental: false,
          priceInfo: opt.priceInfo
        });
        totalOpsionalPrice += price;
      }
    }
  });

  const discountRate = activePromo ? activePromo.discount / 100 : 0;
  const discountAmount = grossPrice * discountRate;
  const netPrice = (grossPrice - discountAmount) + totalOpsionalPrice;
  
  if (!isOpen) return null;

  const handleSubmitPreview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation logic tailored to type
    if (currentType === 'open_request') {
      if (!formState.nama || !formState.wa || !selectedDestinasi || !selectedJadwal || (selectedJadwal.includes('|') && !selectedJadwal.split('|')[1]) || !pesertaCount) {
        customAlert("Mohon lengkapi semua data wajib (Nama, WA, Destinasi, dan Jadwal).");
        return;
      }
    } else {
      if (!formState.nama || !formState.wa || !selectedDestinasi || !selectedJalur || !selectedDurasi || !selectedJadwal || !pesertaCount) {
        customAlert("Mohon lengkapi semua data wajib.");
        return;
      }
    }

    if (currentType === 'open') {
      const stats = getOpenTripStats(selectedDestinasi, selectedJadwal);
      if (Number(pesertaCount) > stats.sisa) {
        customAlert(`Mohon kurangi jumlah peserta. Kuota tidak mencukupi, sisa slot tersedia: ${stats.sisa} Pax.`, "Kuota Terbatas");
        return;
      }
    }

    if (currentType === 'private') {
      const today = new Date();
      if (selectedJadwal) {
        const selectedDate = new Date(selectedJadwal);
        const diffTime = selectedDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 7) {
          customAlert("Pemesanan private trip minimal H-7 keberangkatan.", "Informasi");
          return;
        }
      }
    }

    setIsConfirming(true);
    playClick();
  };

  const handleBookingFinal = async () => {
    const { nama, email, wa, deskripsi } = formState;
    let finalJadwalLabel = selectedJadwal;
    if (currentType === 'private') {
      finalJadwalLabel = calculateEndDate(selectedJadwal, selectedDurasi);
    } else if (currentType === 'open_request') {
      finalJadwalLabel = selectedJadwal.replace(/\|/g, ' ');
    }
  
      const subItemsFormatted = Object.entries(subSelected).map(([key, qty]) => {
        const [parent, item] = key.split('|');
        return `${item} (${qty}x)`;
      }).join(', ');
  
      const finalOpsionalText = [
        ...selectedOpsional.filter(opt => !config?.facilities?.opsi?.find((o: any) => o.name === opt)?.subItems),
        subItemsFormatted
      ].filter(Boolean).join(' | ');
  
      setIsSubmittingBooking(true);

      if (user) {
        try {
          const destData = config.destinationsData?.find((d: any) => d.name === (selectedDestinasi || '-'));
          const pathData = destData?.paths?.find((p: any) => p.name === (selectedJalur || '-'));
          const durData = pathData?.durations?.find((dur: any) => dur.label === (selectedDurasi || '-'));
          
          let finalRundownText = durData?.rundownHtml || "";
          let finalRundownPdf = durData?.rundownPdf || "";

          if (currentType === 'open') {
             const ot = config.openTrips?.find((t: any) => t.name === selectedDestinasi && t.jadwal === selectedJadwal);
             if (ot) {
                if (ot.rundownText) finalRundownText = ot.rundownText;
                if (ot.rundownPdf) finalRundownPdf = ot.rundownPdf;
             }
          }

          await addDoc(collection(db, 'bookings'), {
            userId: user.uid,
            nama: nama || 'Tanpa Nama', 
            email: email || user.email || 'tanpa@email.com', 
            wa: wa || '08000000',
            destinasi: selectedDestinasi || '-', 
            jalur: selectedJalur || '-',
            durasi: selectedDurasi || '-', 
            jadwal: finalJadwalLabel || '-', 
            peserta: pesertaCount || 1,
            opsionalText: finalOpsionalText || 'Tidak ada',
            opsionalItems: opsionalItemsList,
            opsionalPrice: totalOpsionalPrice,
            discountAmount: discountAmount,
            discountPercentage: activePromo?.discount || 0,
            promoCode: isPromoValid ? promoCode : '',
            deskripsi: deskripsi || 'Tidak ada catatan khusus',
            type: currentType || 'private',
            totalPrice: netPrice || 0,
            createdAt: serverTimestamp(),
            status: 'pending', // Displayed as "Menunggu Konfirmasi Admin"
            rundownText: finalRundownText,
            rundownPdf: finalRundownPdf
          });
  
          if (currentType === 'open' && config) {
             const updatedOpenTrips = (config.openTrips || []).map((ot: any) => {
                if (ot.name === selectedDestinasi && ot.jadwal === selectedJadwal) {
                   const currentConsumed = typeof ot.consumedKuota === 'number' ? ot.consumedKuota : 0;
                   const newConsumed = currentConsumed + Number(pesertaCount);
                   return { ...ot, consumedKuota: newConsumed };
                }
                return ot;
             });
             updateConfig({ openTrips: updatedOpenTrips });
          }
        } catch (error) {
          console.error("Booking addDoc error: ", error);
        }
      }
  
      const waMsg = `Halo Admin Trip Ngopi di Ketinggian! 🏕️\n\nSaya tertarik untuk booking trip, berikut detail pesanan saya:\n\n*Data Pemesan*\n• Nama: ${nama}\n• No WhatsApp: ${wa}\n• Email: ${email}\n\n*Detail Trip*\n• Destinasi: *${selectedDestinasi}*\n• Jalur: ${selectedJalur}\n• Durasi: ${selectedDurasi}\n• Rencana Tanggal: ${finalJadwalLabel}\n• Jumlah Peserta: ${pesertaCount} Pax\n\n*Promo & Biaya*\n• Kode Promo: ${promoCode || '-'} ${isPromoValid ? `(Valid - Diskon ${activePromo.discount}%)` : ''}\n• Estimasi Harga Paket: Rp ${netPrice.toLocaleString('id-ID')} ${isPromoValid ? `(Diskon Rp ${discountAmount.toLocaleString('id-ID')})` : ''}\n\n*Opsi Tambahan (Opsional)*\n${finalOpsionalText ? finalOpsionalText.split(' | ').map(o => `• ${o}`).join('\n') : '• Tidak ada'}\n\n*Catatan Khusus / Kesehatan*\n_${deskripsi || '-'}_ \n\nMohon info untuk ketersediaan jadwal serta total biayanya ya min.\nTerima kasih! 🙌`;
      
      if (currentType !== 'open_request') {
        window.open(`https://wa.me/6282127533268?text=${encodeURIComponent(waMsg)}`, '_blank');
      }
      
      playSuccess();
      setShowSuccess(true);
      setTimeout(() => { 
        setShowSuccess(false); 
        setIsConfirming(false);
        setIsSubmittingBooking(false);
        onClose(); 
        setIsHistoryOpen(true);
      }, 1500);
    };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 text-left">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-2xl rounded-[2.5rem] p-6 md:p-10 border-2 border-art-text relative max-h-[92vh] overflow-y-auto shadow-2xl">
        <button onClick={() => { playBack(); onClose(); }} className="absolute top-6 right-6 z-10 text-art-text hover:text-art-orange transition-colors"><X size={24} /></button>
        
        {showSuccess ? (
          <div className="text-center py-12 flex flex-col items-center justify-center h-full">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-art-green/20 text-art-green rounded-full flex items-center justify-center mb-6"><CheckCircle2 size={48} /></motion.div>
            <h3 className="text-2xl font-black uppercase text-art-text mb-3">Pesanan Diarahkan ke WhatsApp!</h3>
            <p className="text-xs font-bold text-art-text/40 uppercase tracking-widest text-center px-4">Terima kasih, pembayaran akan dikonfirmasi admin segera.</p>
          </div>
        ) : isConfirming ? (
          <div className="pt-4 space-y-6">
             <div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-art-text mb-1">Konfirmasi Pesanan</h3>
                <p className="text-[10px] font-bold text-art-text/40 uppercase tracking-widest">Pastikan data di bawah sudah benar sebelum kirim.</p>
             </div>

             <div className="space-y-3">
               {/* Pemesan Box */}
               <div className="bg-art-bg/30 p-5 rounded-2xl border-2 border-art-text/10">
                 <div className="flex justify-between items-center mb-3 pb-2 border-b border-art-text/5">
                   <h5 className="text-[10px] font-black uppercase text-art-text tracking-widest flex items-center gap-2"><User size={14} className="text-art-text/40"/> Data Pemesan</h5>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <p className="text-[9px] font-black text-art-text/30 uppercase mb-1">Pemesan</p>
                       <p className="text-xs font-black text-art-text truncate">{formState.nama}</p>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-art-text/30 uppercase mb-1">WhatsApp & Email</p>
                       <p className="text-[10px] font-bold text-art-text truncate">{formState.wa} • {formState.email || user?.email}</p>
                    </div>
                 </div>
                 {formState.deskripsi && (
                   <div className="mt-3 pt-3 border-t border-art-text/5">
                     <p className="text-[9px] font-black text-art-text/30 uppercase mb-1">Catatan Khusus</p>
                     <p className="text-[10px] font-bold text-art-text">{formState.deskripsi}</p>
                   </div>
                 )}
               </div>

               {/* Trip Utama Box */}
               <div className="bg-art-bg/30 p-5 rounded-2xl border-2 border-art-text/10">
                 <div className="flex justify-between items-center mb-4 pb-3 border-b border-art-text/5">
                   <h5 className="text-[10px] font-black uppercase text-art-text tracking-widest flex items-center gap-2"><Map size={14} className="text-art-text/40"/> Trip Utama</h5>
                   <div className="text-right">
                     <p className="text-[8px] font-bold text-art-text/40 uppercase">Subtotal Trip</p>
                     <span className="text-[12px] font-black text-art-text">Rp {(basePricePerPax * currentPesertaCount).toLocaleString('id-ID')}</span>
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <p className="text-[9px] font-black text-art-text/30 uppercase mb-1">Destinasi</p>
                       <p className="text-xs font-black text-art-text truncate">{selectedDestinasi}</p>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-art-text/30 uppercase mb-1">Jalur / Durasi</p>
                       <p className="text-[10px] font-black text-art-text">{selectedJalur} • {selectedDurasi}</p>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-art-text/30 uppercase mb-1">Jadwal</p>
                       <p className="text-[10px] font-black text-art-text truncate">{currentType === 'private' ? calculateEndDate(selectedJadwal, selectedDurasi) : selectedJadwal}</p>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-art-text/30 uppercase mb-1">Peserta</p>
                       <p className="text-[10px] font-black text-art-text">{pesertaCount} Pax x Rp {basePricePerPax.toLocaleString('id-ID')}</p>
                    </div>
                 </div>
               </div>

               {/* Layanan Tambahan Box */}
               {opsionalItemsList.length > 0 && (
                 <div className="bg-art-bg/30 p-5 rounded-2xl border-2 border-art-text/10">
                   <div className="flex justify-between items-center mb-4 pb-3 border-b border-art-text/5">
                     <h5 className="text-[10px] font-black uppercase text-art-text tracking-widest flex items-center gap-2"><Tent size={14} className="text-art-text/40"/> Layanan Tambahan</h5>
                     <div className="text-right">
                       <p className="text-[8px] font-bold text-art-text/40 uppercase">Subtotal Layanan</p>
                       <span className="text-[12px] font-black text-art-orange">Rp {totalOpsionalPrice.toLocaleString('id-ID')}</span>
                     </div>
                   </div>
                   <div className="space-y-2 text-[10px] font-bold text-art-text/60">
                     {opsionalItemsList.map((item: any, idx: number) => (
                       <div key={idx} className="flex justify-between items-start">
                         <span className="uppercase">{item.name} {item.isRental ? `(${item.count}x • ${item.days} Hari)` : ''}</span>
                         <span className="text-art-text font-black ml-2 text-right">{item.status === 'pending_price' ? 'Biaya Menyusul' : `Rp ${item.subtotal.toLocaleString('id-ID')}`}</span>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {/* Promosi Area Box */}
               {isPromoValid && (
                 <div className="bg-art-green/10 p-5 rounded-2xl border-2 border-art-green/20">
                   <div className="flex justify-between items-center">
                     <h5 className="text-[10px] font-black uppercase text-art-green tracking-widest flex items-center gap-2">🎁 Promosi Area <span className="bg-art-green text-white px-2 py-0.5 rounded-full text-[8px] ml-1">-{activePromo.discount}%</span></h5>
                     <div className="text-right">
                       <p className="text-[8px] font-bold text-art-green/60 uppercase text-right">Potongan Harga</p>
                       <span className="text-[12px] font-black text-art-green">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                     </div>
                   </div>
                   <div className="mt-2 pt-2 border-t border-art-green/10">
                     <p className="text-[9px] font-bold text-art-green/80 uppercase">KODE AKTIF: <span className="font-black">{promoCode}</span></p>
                   </div>
                 </div>
               )}

               {/* Total Area Box */}
               <div className="bg-art-text p-6 rounded-2xl border-2 border-art-text text-white shadow-[6px_6px_0px_0px_rgba(255,107,0,0.3)]">
                  <div className="flex justify-between items-end">
                     <div>
                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">Total Estimasi Keseluruhan</p>
                        <h4 className="text-3xl sm:text-4xl font-black text-white leading-none tracking-tighter">Rp {netPrice.toLocaleString('id-ID')}</h4>
                     </div>
                  </div>
               </div>
             </div>

             <div className="flex gap-3">
                <button 
                  onClick={() => { playBack(); setIsConfirming(false); }} 
                  className="flex-1 py-4 border-2 border-art-text rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-art-bg"
                >Revisi Data</button>
                <button 
                  onClick={() => { 
                    playPop(); 
                    if (currentType === 'open_request') {
                      customConfirm("Apakah Anda yakin ingin mengirimkan request jadwal ini?", () => {
                        handleBookingFinal();
                      });
                    } else {
                      handleBookingFinal(); 
                    }
                  }} 
                  disabled={isSubmittingBooking}
                  className="flex-[2] py-4 bg-art-text text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(255,107,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >{isSubmittingBooking ? 'Memproses...' : (currentType === 'open_request' ? 'Konfirmasi Request' : 'Konfirmasi & Kirim')} <Send size={14} /></button>
             </div>
          </div>
        ) : viewType === 'selection' ? (
          <div className="pt-4">
             <h3 className="text-3xl font-black uppercase tracking-tighter text-art-text mb-2">Pilih Petualanganmu</h3>
             <p className="text-[10px] font-bold text-art-text/40 mb-8 uppercase tracking-[0.2em] leading-relaxed">Persiapkan diri untuk perjalanan yang tak terlupakan.</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <button 
                  onClick={() => { playPop(); setCurrentType('private'); setViewType('form'); setPesertaCount(2); }}
                  className="group bg-white p-6 rounded-[2rem] border-2 border-art-text hover:shadow-[10px_10px_0px_0px_rgba(255,107,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all text-left"
                >
                   <div className="flex justify-between items-start mb-5">
                      <div className="p-4 bg-art-orange text-white rounded-2xl shadow-lg transform group-hover:rotate-6 transition-transform"><Users size={28}/></div>
                      <div className="w-10 h-10 rounded-full border-2 border-art-text/10 flex items-center justify-center group-hover:border-art-orange transition-colors">
                        <ChevronRight className="text-art-text/20 group-hover:text-art-orange" />
                      </div>
                   </div>
                   <h4 className="text-2xl font-black uppercase text-art-text mb-1 tracking-tight">Private Trip</h4>
                   <p className="text-[10px] font-bold text-art-text/40 uppercase tracking-widest">Tentukan sendiri kawan daki & jadwalmu.</p>
                </button>
                
                <button 
                  onClick={() => { 
                    playPop(); 
                    setCurrentType('open'); 
                    const available = config.openTrips?.filter((ot: any) => ot.kuotaNum > 0) || [];
                    if (available.length === 0) {
                      setViewType('trip_list');
                    } else {
                      setViewType('trip_list');
                    }
                    setPesertaCount(1);
                  }}
                  className="group bg-white p-6 rounded-[2rem] border-2 border-art-text hover:shadow-[10px_10px_0px_0px_rgba(72,187,120,1)] hover:translate-x-1 hover:translate-y-1 transition-all text-left"
                >
                   <div className="flex justify-between items-start mb-5">
                      <div className="p-4 bg-art-green text-white rounded-2xl shadow-lg transform group-hover:-rotate-6 transition-transform"><Calendar size={28}/></div>
                      <div className="w-10 h-10 rounded-full border-2 border-art-text/10 flex items-center justify-center group-hover:border-art-green transition-colors">
                        <ChevronRight className="text-art-text/20 group-hover:text-art-green" />
                      </div>
                   </div>
                   <h4 className="text-2xl font-black uppercase text-art-text mb-1 tracking-tight">Open Trip</h4>
                   <p className="text-[10px] font-bold text-art-text/40 uppercase tracking-widest">Gabung tim daki lain di jadwal yang ada.</p>
                </button>

                {user && (
                   <button 
                     onClick={() => { playClick(); setIsHistoryOpen(true); onClose(); }}
                     className="mt-4 w-full md:col-span-2 group bg-art-bg/30 p-5 rounded-[2rem] border-2 border-art-text/10 hover:border-art-orange hover:bg-white transition-all flex items-center justify-between transition-all shadow-sm"
                   >
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-white rounded-2xl border border-art-text/10 group-hover:bg-art-orange group-hover:text-white transition-colors">
                            <ShoppingBag size={24}/>
                         </div>
                         <div className="text-left">
                            <h5 className="text-sm font-black uppercase text-art-text tracking-widest">Riwayat Booking</h5>
                            <p className="text-[10px] font-bold text-art-text/40 uppercase tracking-tighter">Pantau status & detail pesananmu</p>
                         </div>
                      </div>
                      <ChevronRight size={20} className="text-art-text/20 group-hover:text-art-orange group-hover:translate-x-1 transition-all" />
                   </button>
                )}
             </div>
          </div>
        ) : viewType === 'trip_list' ? (
           <div className="pt-4">
              <button type="button" onClick={() => { playBack(); setViewType('selection'); }} className="text-[8px] font-black uppercase text-art-orange hover:underline mb-4 flex items-center gap-1 tracking-widest"><ChevronRight size={10} className="rotate-180" /> Kembali</button>
              <h3 className="text-2xl font-black uppercase text-art-text tracking-tight mb-6">Open Trip Tersedia</h3>
              
              {/* User Custom Request Notifications */}
              {user && userBookings.some(b => b.type === 'open_request' && (b.status === 'pending' || b.status === 'approved_to_draft')) && (
                 <div className="mb-6 bg-white border-2 border-art-text rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                       <Globe size={60} />
                    </div>
                    <h4 className="text-[10px] font-black uppercase text-art-text flex items-center gap-2 mb-3">
                       <BellRing size={14} className="text-art-orange animate-bounce" /> Status Request Trip Kustom
                    </h4>
                    <div className="space-y-2">
                       {userBookings.filter(b => b.type === 'open_request' && (b.status === 'pending' || b.status === 'approved_to_draft')).map(b => (
                          <div key={b.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-art-text/5">
                             <div>
                                <p className="text-[10px] font-black uppercase text-art-text">{b.destinasi}</p>
                                <p className="text-[8px] font-bold text-art-text/40 font-mono italic">{b.jadwal}</p>
                             </div>
                             <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg border-2 ${
                                b.status === 'pending' ? 'bg-art-orange/10 border-art-orange text-art-orange' : 'bg-art-green/10 border-art-green text-art-green'
                             }`}>
                                {b.status === 'pending' ? 'DITINJAU' : 'DISETUJUI'}
                             </span>
                          </div>
                       ))}
                    </div>
                 </div>
              )}
              
              <div className="space-y-3">
                 {config.openTrips?.filter((ot: any) => getSisaKuota(ot) > 0).length === 0 ? (
                    <div className="text-center py-10 bg-art-bg rounded-3xl border-2 border-dashed border-art-text/10 px-4 flex flex-col items-center justify-center">
                       <p className="text-[10px] font-black text-art-text/40 uppercase tracking-widest mb-4 italic">Kami belum ada jadwal open trip.</p>
                       <Button onClick={() => setViewType('selection')} variant="secondary" className="text-[9px] py-1.5 px-3 border-2 border-art-text mx-auto">Lihat Private Trip</Button>
                    </div>
                 ) : (
                    config.openTrips?.filter((ot: any) => getSisaKuota(ot) > 0).map((ot: any, idx: number) => {
                       const sisa = getSisaKuota(ot);
                       return (
                        <button 
                          key={idx} 
                          onClick={() => {
                            playClick();
                            setSelectedDestinasi(ot.name);
                            setSelectedJadwal(ot.jadwal);
                            setSelectedJalur(ot.path || "Jalur Utama");
                            setSelectedDurasi(ot.duration || "N/A");
                            setViewType('form');
                          }}
                          className="w-full group bg-white p-4 rounded-2xl border-2 border-art-text hover:bg-art-bg hover:translate-x-1 transition-all flex justify-between items-center text-left"
                        >
                           <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                 <h4 className="text-sm font-black uppercase text-art-text">{ot.name}</h4>
                                 <span className="text-[8px] font-black text-art-green bg-art-green/10 px-1.5 py-0.5 rounded border border-art-green/20 uppercase tracking-tighter">{ot.path}</span>
                              </div>
                              <p className="text-[10px] font-bold text-art-text/40 uppercase">{ot.jadwal}</p>
                           </div>
                           <div className="text-right">
                              <p className={`text-[10px] font-black uppercase ${sisa <= 3 ? 'text-red-500' : 'text-art-green'}`}>{sisa} Pax Tersisa</p>
                              <p className="text-[10px] font-black text-art-orange uppercase">Rp {(ot.price*1000).toLocaleString('id-ID')}</p>
                           </div>
                        </button>
                       );
                    })
                 )}
              </div>
              <div className="mt-6 pt-4 border-t-2 border-dashed border-art-text/10">
                 <p className="text-[10px] font-bold text-art-text/40 text-center mb-3">Tidak menemukan jadwal weekend yang cocok?</p>
                 <Button 
                   onClick={() => {
                     playClick();
                     setSelectedDestinasi('');
                     setSelectedJadwal('');
                     setSelectedJalur('');
                     setSelectedDurasi('2 Hari 1 Malam');
                     setCurrentType('open_request');
                     setViewType('form');
                   }} 
                   variant="secondary" 
                   className="w-full text-[10px] uppercase font-bold border-2 border-art-text tracking-widest bg-white hover:bg-gray-50"
                 >
                   Request Jadwal Weekend
                 </Button>
              </div>
           </div>
        ) : (
          <form className="space-y-6 pt-2" onSubmit={handleSubmitPreview}>
             <div className="flex justify-between items-start pr-6">
               <div>
                  <button type="button" onClick={() => { playBack(); setViewType((currentType === 'open' || currentType === 'open_request') ? 'trip_list' : 'selection'); }} className="text-[8px] font-black uppercase text-art-orange hover:underline mb-2 flex items-center gap-1 tracking-widest"><ChevronRight size={10} className="rotate-180" /> Ganti Pilihan</button>
                  <h3 className="text-2xl font-black uppercase text-art-text tracking-tight">Detail Booking</h3>
                  <p className="text-[9px] font-bold text-art-text/30 uppercase tracking-[0.2em]">{currentType === 'open_request' ? 'Request Open' : currentType} Adventure</p>
               </div>
               <div className="text-right">
                  <span className={`text-[8px] font-black px-3 py-1 rounded-full border-2 uppercase tracking-widest ${currentType === 'private' ? 'bg-art-orange/10 border-art-orange text-art-orange' : 'bg-art-green/10 border-art-green text-art-green'}`}>
                     {currentType === 'open_request' ? 'REQUEST' : currentType}
                  </span>
               </div>
             </div>
             
             <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                     <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-art-text/40 mb-1.5 ml-1">Nama Pemesan</label>
                     <input name="nama" required type="text" value={formState.nama} onChange={e => setFormState({...formState, nama: e.target.value})} className="w-full border-2 border-art-text bg-white px-4 py-3 rounded-2xl text-art-text font-black outline-none focus:border-art-orange transition-all text-xs" placeholder="NAMA LENGKAP" />
                  </div>
                  <div className="relative">
                     <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-art-text/40 mb-1.5 ml-1">WhatsApp</label>
                     <input name="wa" required type="tel" value={formState.wa} onChange={e => setFormState({...formState, wa: e.target.value})} className="w-full border-2 border-art-text bg-white px-4 py-3 rounded-2xl text-art-text font-black outline-none focus:border-art-orange transition-all text-xs" placeholder="0812..." />
                  </div>
                </div>

                {currentType !== 'open_request' && (
                <div className="relative">
                   <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-art-text/40 mb-1.5 ml-1">Email</label>
                   <input name="email" required type="email" value={formState.email} onChange={e => setFormState({...formState, email: e.target.value})} className="w-full border-2 border-art-text bg-white px-4 py-3 rounded-2xl text-art-text font-black outline-none focus:border-art-orange transition-all text-xs" placeholder="ALAMAT@MAIL.COM" />
                </div>
                )}

                <div className="space-y-4">
                   <div className="relative">
                      <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-art-text/40 mb-1.5 ml-1">Pilih Destinasi</label>
                      <select 
                        name="destinasi" 
                        required 
                        value={selectedDestinasi} 
                        onChange={e => { 
                          setSelectedDestinasi(e.target.value); 
                          setSelectedJalur(''); 
                          if (currentType === 'open_request') setSelectedDurasi('2H 1M');
                          else setSelectedDurasi(''); 
                          setSelectedJadwal(''); 
                        }} 
                        className="w-full border-2 border-art-text bg-white px-4 py-3 rounded-2xl text-art-text font-black outline-none focus:border-art-orange text-xs disabled:bg-gray-200/50 shadow-sm"
                        disabled={currentType === 'open'}
                      >
                         <option value="">-- PILIH GUNUNG --</option>
                         {currentType === 'open' ? (
                            config.openTrips?.map((ot: any, idx: number) => <option key={idx} value={ot.name}>{ot.name} ({ot.jadwal})</option>)
                         ) : (
                            destinationOptions?.filter(e => e.isActive !== false).map((d, i) => <option key={i} value={d.name}>{d.name}</option>)
                         )}
                      </select>
                   </div>

                   {true && (
                   <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-art-text/40 mb-1.5 ml-1">Pilih Jalur</label>
                        <select 
                          name="jalur" 
                          required={currentType !== 'open_request'}
                          value={selectedJalur}
                          onChange={e => { setSelectedJalur(e.target.value); setSelectedDurasi(''); }}
                          className="w-full border-2 border-art-text bg-white px-3 py-3 rounded-xl text-[10px] font-black text-art-text outline-none focus:border-art-orange disabled:bg-gray-200/50 shadow-sm" 
                          disabled={!selectedDestinasi || currentType === 'open'}
                        >
                          <option value="">-- PILIH JALUR --</option>
                          {selectedDestinasi && destinationOptions?.find(d => d.name === selectedDestinasi)?.paths?.map((p: any) => (
                             <option key={p.name} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="relative">
                        <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-art-text/40 mb-1.5 ml-1">Pilih Durasi</label>
                        {currentType === 'open_request' ? (
                          <div className="w-full border-2 border-art-text bg-art-bg/30 px-3 py-3 rounded-xl text-[10px] font-black text-art-text/40 shadow-sm flex items-center gap-2">
                            <Clock size={12} className="text-art-text/20" /> 2H 1M (Weekend Only)
                          </div>
                        ) : (
                          <select 
                            name="durasi" 
                            required={currentType !== 'open_request'}
                            value={selectedDurasi}
                            onChange={e => setSelectedDurasi(e.target.value)}
                            className="w-full border-2 border-art-text bg-white px-3 py-3 rounded-xl text-[10px] font-black text-art-text outline-none focus:border-art-orange disabled:bg-gray-200/50 shadow-sm" 
                            disabled={!selectedJalur || currentType === 'open'}
                          >
                            <option value="">-- DURASI --</option>
                            {selectedJalur && destinationOptions?.find(d => d.name === selectedDestinasi)?.paths?.find((p: any) => p.name === selectedJalur)?.durations?.map((dur: any, idx: number) => (
                               <option key={idx} value={dur.label}>{dur.label}</option>
                            ))}
                          </select>
                        )}
                      </div>
                   </div>
                   )}

                   {selectedDestinasi && selectedJalur && selectedDurasi && (() => {
                      const durInfo = destinationOptions?.find(d => d.name === selectedDestinasi)?.paths?.find((p: any) => p.name === selectedJalur)?.durations?.find((dur: any) => dur.label === selectedDurasi);
                      if (!durInfo || (!durInfo.rundownHtml && !durInfo.rundownPdf)) return null;
                      
                      const currentOt = currentType === 'open' ? config.openTrips?.find((o: any) => o.name === selectedDestinasi) : null;
                      const showPdf = currentOt ? currentOt.showRundownPdf !== false : true;

                      return (
                         <div className="bg-art-bg/50 border border-art-text/10 p-4 rounded-2xl relative shadow-sm">
                            <h4 className="text-[10px] font-black uppercase text-art-text mb-2 flex items-center gap-1.5"><FileText size={12} className="text-art-orange" /> Itinerary / Rundown Kegiatan</h4>
                            {durInfo.rundownHtml && (
                               <div className="text-[9px] text-art-text/60 font-mono whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto pr-2 no-scrollbar border-l-2 border-art-orange/30 pl-3">
                                 {durInfo.rundownHtml}
                               </div>
                            )}
                            {showPdf && (
                              <div className="flex gap-2">
                                {durInfo.rundownPdf ? (
                                  <a href={durInfo.rundownPdf} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest px-3 py-2 bg-white rounded-lg border-2 border-art-text text-art-text hover:bg-art-orange hover:border-art-orange hover:text-white transition-all ${durInfo.rundownHtml ? 'mt-3' : ''}`}>
                                    PDF Rundown Lengkap <Download size={10} />
                                  </a>
                                ) : durInfo.rundownHtml ? (
                                  <button type="button" onClick={() => generateRundownPdf(durInfo, selectedDestinasi, selectedJalur, selectedDurasi)} className={`inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest px-3 py-2 bg-white rounded-lg border-2 border-art-text text-art-text hover:bg-art-orange hover:border-art-orange hover:text-white transition-all ${durInfo.rundownHtml ? 'mt-3' : ''}`}>
                                    Lihat PDF Rundown <Download size={10} />
                                  </button>
                                ) : null}
                              </div>
                            )}
                         </div>
                      );
                    })()}

                   <div className="grid grid-cols-2 gap-4">
                      {currentType === 'open_request' ? (
                        <div className="col-span-2">
                           <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-art-text/40 mb-1.5 ml-1">Request Jadwal Weekend (Bulan & Tanggal)</label>
                           <div className="flex gap-2">
                             <select 
                               className="w-1/2 border-2 border-art-text bg-white px-3 py-3 rounded-xl text-[10px] font-black text-art-text outline-none focus:border-art-orange"
                               value={selectedJadwal.split('|')[0] || ''}
                               onChange={e => setSelectedJadwal(`${e.target.value}|`)}
                             >
                                <option value="">-- Bulan --</option>
                                {Array.from({ length: 6 }).map((_, i) => {
                                  const d = new Date();
                                  d.setMonth(d.getMonth() + i);
                                  const monthStr = d.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
                                  const monthVal = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}`;
                                  return <option key={monthVal} value={monthVal}>{monthStr}</option>;
                                })}
                             </select>
                             <select 
                               className="w-1/2 border-2 border-art-text bg-white px-3 py-3 rounded-xl text-[10px] font-black text-art-text outline-none focus:border-art-orange disabled:bg-gray-100"
                               value={selectedJadwal.split('|')[1] || ''}
                               onChange={e => setSelectedJadwal(`${selectedJadwal.split('|')[0]}|${e.target.value}`)}
                               disabled={!selectedJadwal.split('|')[0]}
                             >
                                <option value="">-- Tanggal --</option>
                                {(() => {
                                   const [monthVal] = selectedJadwal.split('|');
                                   if (!monthVal) return null;
                                   const [year, month] = monthVal.split('-').map(Number);
                                   const daysInMonth = new Date(year, month, 0).getDate();
                                   
                                   const weekends = [];
                                   for (let i = 1; i <= daysInMonth; i++) {
                                      const date = new Date(year, month - 1, i);
                                      if (date.getDay() === 6) {
                                         const endDate = new Date(date);
                                         endDate.setDate(date.getDate() + 1);
                                         // User requested: Month should NOT be displayed, only the day.
                                         // Spanning months should stay as days only.
                                         weekends.push(`${i}-${endDate.getDate()}`);
                                      }
                                   }
                                   return weekends.map((w, idx) => (
                                      <option key={idx} value={w}>{w}</option>
                                   ));
                                })()}
                             </select>
                           </div>
                        </div>
                      ) : (
                        <div className="relative">
                           <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-art-text/40 mb-1.5 ml-1">Rencana Tanggal</label>
                           <input 
                             name="jadwal" 
                             required 
                             type={currentType === 'open' ? 'text' : 'date'} 
                             value={selectedJadwal}
                             onChange={e => setSelectedJadwal(e.target.value)}
                             readOnly={currentType === 'open'}
                             className="w-full border-2 border-art-text bg-white px-3 py-3 rounded-xl text-[10px] font-black text-art-text outline-none focus:border-art-orange disabled:bg-gray-200/50 shadow-sm" 
                           />
                        </div>
                      )}
                       <div className="relative">
                          <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-art-text/40 mb-1.5 ml-1">Jumlah Peserta</label>
                          <div className="flex items-center gap-2 bg-white border-2 border-art-text rounded-xl px-2 h-[42px] shadow-sm">
                             <button type="button" onClick={() => setPesertaCount(Math.max(1, (Number(pesertaCount) || 1) - 1))} className="w-6 h-6 flex items-center justify-center bg-art-text text-white rounded-lg font-black hover:bg-art-orange transition-colors text-[12px]">-</button>
                             <input name="peserta" type="number" value={pesertaCount} onChange={e => setPesertaCount(e.target.value)} className="w-full text-center font-black text-art-text outline-none text-xs bg-transparent" min={1} />
                             <button type="button" onClick={() => setPesertaCount((Number(pesertaCount) || 0) + 1)} className="w-6 h-6 flex items-center justify-center bg-art-text text-white rounded-lg font-black hover:bg-art-green transition-colors text-[12px]">+</button>
                          </div>
                          {currentType === 'open' && (
                             <div className="mt-1 ml-1 flex justify-between items-center">
                               <span className="text-[7px] font-black uppercase text-art-text/30">Sisa Slot: {getOpenTripStats(selectedDestinasi, selectedJadwal).sisa} Pax</span>
                               {Number(pesertaCount) > getOpenTripStats(selectedDestinasi, selectedJadwal).sisa && (
                                 <span className="text-[7px] font-black uppercase text-red-500 animate-pulse">Kuota Tidak Cukup!</span>
                               )}
                             </div>
                          )}
                       </div>
                   </div>


                    {currentType !== 'open_request' && (
                      <>
                        <div className="relative">
                           <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-art-text/40 mb-1.5 ml-1">Opsi Layanan Tambahan</label>
                          <div className="relative">
                             <button 
                               type="button" 
                               onClick={() => {
                                 const el = document.getElementById('addon-dropdown');
                                 if (el) el.classList.toggle('hidden');
                               }}
                               className="w-full border-2 border-art-text bg-white px-4 py-3 rounded-2xl text-art-text font-black text-left text-[10px] flex justify-between items-center shadow-sm"
                             >
                               <span className="truncate">{selectedOpsional.length === 0 && Object.keys(subSelected).length === 0 ? 'PILIH LAYANAN TAMBAHAN...' : `${selectedOpsional.length + Object.keys(subSelected).length} LAYANAN DIPILIH`}</span>
                               <ChevronDown size={14} className="text-art-text/40" />
                             </button>
                             <div id="addon-dropdown" className="hidden absolute z-30 left-0 right-0 mt-2 bg-white border-2 border-art-text rounded-2xl shadow-2xl p-4 max-h-64 overflow-y-auto">
                                <div className="grid grid-cols-1 gap-2">
                                  {config?.facilities?.opsi
                                     ?.slice()
                                     .sort((a: any, b: any) => (a.subItems?.length || 0) - (b.subItems?.length || 0))
                                     .map((opt: any, i: number) => {
                                     const isSelected = selectedOpsional.includes(opt.name);
                                     return (
                                        <div key={i} className="space-y-2 border-b border-art-text/5 last:border-0 pb-2">
                                           <label className="flex items-center gap-3 p-1 hover:bg-art-bg rounded-xl cursor-pointer transition-colors group">
                                              <input 
                                                type="checkbox" 
                                                checked={isSelected}
                                                onChange={() => handleToggleOption(opt.name)}
                                                className="w-4 h-4 accent-art-orange"
                                              />
                                              <div className="flex flex-col">
                                                 <span className="text-[10px] font-black text-art-text uppercase tracking-wider group-hover:text-art-orange">{opt.name === "Upgrade then private" ? "Upgrade Tenda Privat" : opt.name}</span>
                                                 {opt.price || opt.name === "Upgrade then private" ? (
                                                   <span className="text-[8px] font-bold text-art-orange uppercase tracking-tighter">Rp {( (opt.name === "Upgrade then private" ? 100 : opt.price) * 1000).toLocaleString('id-ID')} / Hari</span>
                                                 ) : opt.priceInfo && (
                                                   <span className="text-[8px] font-bold text-art-text/40">{opt.priceInfo}</span>
                                                 )}
                                              </div>
                                           </label>
                                           
                                           {isSelected && opt.subItems && (
                                              <div className="ml-8 space-y-2 pt-1 border-l-2 border-art-orange/20 pl-4">
                                                 {opt.subItems.map((sub: any, sIdx: number) => {
                                                    const qty = subSelected[`${opt.name}|${sub.name}`] || 0;
                                                    return (
                                                       <div key={sIdx} className="flex items-center justify-between gap-4">
                                                          <div className="flex flex-col">
                                                             <span className="text-[9px] font-bold text-art-text/60 uppercase">{sub.name}</span>
                                                             {sub.price ? (
                                                                <span className="text-[8px] font-black text-art-orange/70 italic uppercase tracking-tighter">Rp {(sub.price * 1000).toLocaleString('id-ID')} / Hari</span>
                                                              ) : sub.priceInfo && (
                                                                <span className="text-[8px] font-medium text-art-text/30 italic">{sub.priceInfo}</span>
                                                              )}
                                                          </div>
                                                          <div className="flex items-center gap-1.5 bg-art-bg border border-art-text/10 rounded-lg px-1 py-0.5">
                                                             <button type="button" onClick={() => handleUpdateSubItem(opt.name, sub.name, -1)} className="w-4 h-4 flex items-center justify-center bg-white border border-art-text/20 text-art-text rounded hover:bg-art-orange hover:text-white transition-colors text-[10px]">-</button>
                                                             <span className="w-5 text-center font-black text-[10px] text-art-text">{qty}</span>
                                                             <button type="button" onClick={() => handleUpdateSubItem(opt.name, sub.name, 1)} className="w-4 h-4 flex items-center justify-center bg-white border border-art-text/20 text-art-text rounded hover:bg-art-green hover:text-white transition-colors text-[10px]">+</button>
                                                          </div>
                                                       </div>
                                                    );
                                                 })}
                                              </div>
                                           )}
                                        </div>
                                     );
                                  })}
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="relative">
                          <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-art-text/40 mb-1.5 ml-1">Catatan Khusus / Kesehatan</label>
                          <textarea name="deskripsi" value={formState.deskripsi} onChange={e => setFormState({...formState, deskripsi: e.target.value})} className="w-full border-2 border-art-text bg-white px-4 py-3 rounded-2xl text-art-text font-bold outline-none focus:border-art-orange text-xs h-20 resize-none placeholder:text-art-text/20 shadow-sm" placeholder="Tuliskan jika ada request khusus..."></textarea>
                       </div>

                       <div className="relative">
                          <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-art-text/40 mb-1.5 ml-1">Kode Promo</label>
                          <input 
                            name="promo" 
                            type="text" 
                            value={promoCode} 
                            onChange={e => setPromoCode(e.target.value)} 
                            className="w-full border-2 border-dashed border-art-text bg-white px-4 py-3 rounded-2xl text-art-text font-black outline-none focus:border-art-orange text-[10px] uppercase tracking-widest shadow-sm" 
                            placeholder="MASUKKAN KODE DISINI"
                          />
                       </div>
                     </>
                   )}
                </div>
             </div>

             <div className="space-y-3">
               <div className="bg-art-bg/30 p-5 rounded-2xl border-2 border-art-text/10">
                 <div className="flex justify-between items-center mb-4 pb-3 border-b border-art-text/5">
                   <h5 className="text-[10px] font-black uppercase text-art-text tracking-widest flex items-center gap-2"><Map size={14} className="text-art-text/40"/> Trip Utama</h5>
                   <div className="text-right">
                     <p className="text-[8px] font-bold text-art-text/40 uppercase">{currentType === 'open_request' ? 'Status' : 'Subtotal Trip'}</p>
                     <span className="text-[12px] font-black text-art-text">{currentType === 'open_request' ? 'ESTIMASI ADMIN' : `Rp ${(basePricePerPax * currentPesertaCount).toLocaleString('id-ID')}`}</span>
                   </div>
                 </div>
                 <div className="space-y-2 text-[10px] font-bold text-art-text/60">
                   <div className="flex justify-between"><span>Destinasi:</span><span className="text-art-text font-black uppercase">{selectedDestinasi || '-'}</span></div>
                   {currentType !== 'open_request' && <div className="flex justify-between"><span>Jalur & Durasi:</span><span className="text-art-text font-black uppercase">{selectedJalur || '-'} • {selectedDurasi || '-'}</span></div>}
                   <div className="flex justify-between"><span>Jadwal:</span><span className="text-art-text font-black uppercase">{selectedJadwal ? (currentType === 'private' ? calculateEndDate(selectedJadwal, selectedDurasi) : selectedJadwal.replace(/\|/g, ' ')) : '-'}</span></div>
                   <div className="flex justify-between pt-1 mt-1 border-t border-art-text/5"><span>Peserta:</span><span className="text-art-text font-black uppercase">{currentPesertaCount} Pax {currentType !== 'open_request' && `x RP ${basePricePerPax.toLocaleString('id-ID')}`}</span></div>
                 </div>
               </div>

               {opsionalItemsList.length > 0 && (
                 <div className="bg-art-bg/30 p-5 rounded-2xl border-2 border-art-text/10">
                   <div className="flex justify-between items-center mb-4 pb-3 border-b border-art-text/5">
                     <h5 className="text-[10px] font-black uppercase text-art-text tracking-widest flex items-center gap-2"><Tent size={14} className="text-art-text/40"/> Layanan Tambahan</h5>
                     <div className="text-right">
                       <p className="text-[8px] font-bold text-art-text/40 uppercase">Subtotal Layanan</p>
                       <span className="text-[12px] font-black text-art-orange">Rp {totalOpsionalPrice.toLocaleString('id-ID')}</span>
                     </div>
                   </div>
                   <div className="space-y-2 text-[10px] font-bold text-art-text/60">
                     {opsionalItemsList.map((item: any, idx: number) => (
                       <div key={idx} className="flex justify-between items-start">
                         <span className="uppercase">{item.name} {item.isRental ? `(${item.count}x • ${item.days} Hari)` : ''}</span>
                         <span className="text-art-text font-black ml-2 text-right">{item.status === 'pending_price' ? 'Biaya Menyusul' : `Rp ${item.subtotal.toLocaleString('id-ID')}`}</span>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {isPromoValid && (
                 <div className="bg-art-green/10 p-5 rounded-2xl border-2 border-art-green/20">
                   <div className="flex justify-between items-center">
                     <h5 className="text-[10px] font-black uppercase text-art-green tracking-widest flex items-center gap-2">🎁 Promosi Area <span className="bg-art-green text-white px-2 py-0.5 rounded-full text-[8px] ml-1">-{activePromo.discount}%</span></h5>
                     <div className="text-right">
                       <p className="text-[8px] font-bold text-art-green/60 uppercase text-right">Potongan Harga</p>
                       <span className="text-[12px] font-black text-art-green">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                     </div>
                   </div>
                   <div className="mt-2 pt-2 border-t border-art-green/10">
                     <p className="text-[9px] font-bold text-art-green/80 uppercase">KODE AKTIF: <span className="font-black">{promoCode}</span></p>
                   </div>
                 </div>
               )}
               
               {currentType !== 'open_request' && (
               <div className="bg-art-text p-6 rounded-2xl border-2 border-art-text text-white shadow-[6px_6px_0px_0px_rgba(255,107,0,0.3)]">
                  <div className="flex justify-between items-end">
                     <div>
                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">Total Estimasi Keseluruhan</p>
                        <h4 className="text-3xl sm:text-4xl font-black text-white leading-none tracking-tighter">Rp {netPrice.toLocaleString('id-ID')}</h4>
                     </div>
                  </div>
               </div>
               )}
             </div>

             <Button type="submit" variant="primary" className="w-full py-5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3">
                {currentType === 'open_request' ? 'Request Jadwal' : 'Review & Konfirmasi'} <ExternalLink size={14} />
             </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

const defaultTripLeaders = [
  { name: "Sukmayadi", age: "31 Th", description: "Punya segudang pengalaman dengan tim penolong.", avatar: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&fit=crop", voiceLine: "" },
  { name: "Agung", age: "29 Th", description: "Jago masak dan meracik kopi, selalu siap membantu.", avatar: "https://images.unsplash.com/photo-1534308143481-c55f00be8bd7?w=400&fit=crop", voiceLine: "" },
  { name: "Ilham", age: "28 Th", description: "Si paling humoris, mencairkan suasana di tiap pendakian.", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&fit=crop", voiceLine: "" },
  { name: "Alman", age: "28 Th", description: "Santai tapi pasti, porter andalan yang tak pernah mengeluh.", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&fit=crop", voiceLine: "" }
];

const destinationsData = [
  {
    "id": "gunung-prau",
    "name": "Gunung Prau",
    "isActive": true,
    "region": "Jawa Tengah",
    "height": "2.590 mdpl",
    "desc": "Lautan awan terbaik di Jawa Tengah dengan jalur yang ramah namun memukau.",
    "image": "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2671&auto=format&fit=crop",
    "locationTag": "Basecamp",
    "difficulty": "Menengah",
    "mepo": "Basecamp Wates",
    "mepoLink": "https://maps.app.goo.gl/PzS2B9115B1cRyT16",
    "kuota": "Min 2 - Max 12 Pax",
    "beans": "Arabica Dieng",
    "paths": [
      {
        "name": "Via Wates",
        "durations": [
          { "label": "1H (Tektok)", "price": 450, "originalPrice": 520 },
          { "label": "2H 1M", "price": 750, "originalPrice": 850 },
          { "label": "3H 2M", "price": 1050, "originalPrice": 1200 }
        ]
      },
      {
        "name": "Via Patak Banteng",
        "durations": [
          { "label": "1H (Tektok)", "price": 400, "originalPrice": 480 },
          { "label": "2H 1M", "price": 680, "originalPrice": 750 }
        ]
      }
    ]
  },
  {
    "id": "gunung-kembang",
    "name": "Gunung Kembang",
    "isActive": true,
    "region": "Jawa Tengah",
    "height": "2.340 mdpl",
    "desc": "Taman bunga di ketinggian dengan jalur 'Banteng' yang menantang adrenalin.",
    "image": "https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?q=80&w=2070&auto=format&fit=crop",
    "locationTag": "Basecamp",
    "difficulty": "Pemula - Menengah",
    "mepo": "Basecamp Lengkong",
    "kuota": "Min 2 - Max 10 Pax",
    "beans": "Java Arabica",
    "paths": [
      {
        "name": "Via Lengkong",
        "durations": [
          { "label": "1H (Tektok)", "price": 380, "originalPrice": 450 },
          { "label": "2H 1M", "price": 620, "originalPrice": 700 }
        ]
      },
      {
        "name": "Via Blembem",
        "durations": [
          { "label": "2H 1M", "price": 590, "originalPrice": 650 }
        ]
      }
    ]
  },
  {
    "id": "gunung-merbabu",
    "name": "Gunung Merbabu",
    "isActive": true,
    "region": "Jawa Tengah",
    "height": "3.142 mdpl",
    "desc": "Sabana luas yang menyejukkan mata, salah satu pemandangan terbaik di Jawa.",
    "image": "https://images.unsplash.com/photo-1543884487-7359df37db0d?q=80&w=2070&auto=format&fit=crop",
    "locationTag": "Basecamp",
    "difficulty": "Menengah - Mahir",
    "mepo": "Selo / Thekelan",
    "kuota": "Min 2 - Max 12 Pax",
    "beans": "Mount Merbabu Blend",
    "paths": [
      {
        "name": "Via Selo",
        "durations": [
          { "label": "1H (Tektok)", "price": 650, "originalPrice": 750 },
          { "label": "2H 1M", "price": 1050, "originalPrice": 1200 },
          { "label": "3H 2M", "price": 1450, "originalPrice": 1650 }
        ]
      },
      {
        "name": "Via Suwanting",
        "durations": [
          { "label": "2H 1M", "price": 1150, "originalPrice": 1300 },
          { "label": "3H 2M", "price": 1550, "originalPrice": 1750 }
        ]
      }
    ]
  },
  {
    "id": "gunung-semeru",
    "name": "Gunung Semeru",
    "isActive": true,
    "region": "Jawa Timur",
    "height": "3.676 mdpl",
    "desc": "Atap tanah Jawa. Perjalanan spiritual menuju puncak tertinggi Jawa.",
    "image": "https://images.unsplash.com/photo-1543884487-7359df37db0d?q=80&w=2070&auto=format&fit=crop",
    "locationTag": "Tumpang/Malang",
    "difficulty": "Mahir",
    "mepo": "Tumpang/Ranu Pani",
    "kuota": "Min 2 - Max 12 Pax",
    "beans": "Java Semeru Coffee",
    "paths": [
      {
        "name": "Via Ranu Pani",
        "durations": [
          { "label": "3H 2M", "price": 1850, "originalPrice": 2100 },
          { "label": "4H 3M", "price": 2350, "originalPrice": 2600 }
        ]
      }
    ]
  }
];

// Removed hardcoded heroSlides

const OpenTripCard: React.FC<{ ot: any, onJoin: (dest: string, path: string, dur: string, type: 'open', jadwal: string) => void, getSisaKuota: (ot: any) => number, visibilities: any, allLeaders: any[], config: any }> = ({ ot, onJoin, getSisaKuota, visibilities, allLeaders, config }) => {
  const [showDetails, setShowDetails] = useState(false);
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
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-2xl border-2 border-art-text overflow-hidden hover:shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] transition-all flex flex-col">
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
                  
                  {durInfo && (
                     <div className="mt-4 p-3 bg-art-bg/30 rounded-xl border border-art-text/10">
                        <h5 className="text-[9px] font-black uppercase text-art-text mb-2 flex items-center gap-1"><FileText size={10} className="text-art-orange" /> Itinerary / Rundown</h5>
                        {durInfo.rundownHtml && (
                           <div className="text-[8px] text-art-text/60 font-mono whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto pr-2 no-scrollbar border-l border-art-orange/30 pl-2">
                             {durInfo.rundownHtml}
                           </div>
                        )}
                        {ot.showRundownPdf !== false && (
                          <div className="flex gap-2">
                           {durInfo.rundownPdf ? (
                              <a href={durInfo.rundownPdf} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-2 py-1.5 bg-white rounded-lg border border-art-text text-art-text hover:bg-art-orange hover:border-art-orange hover:text-white transition-all ${durInfo.rundownHtml ? 'mt-3' : ''}`}>
                                PDF Rundown Lengkap <Download size={8} />
                              </a>
                           ) : (
                              <button type="button" onClick={(e) => { e.stopPropagation(); generateRundownPdf(durInfo, ot.name, ot.path, ot.duration); }} className={`inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-2 py-1.5 bg-white rounded-lg border border-art-text text-art-text hover:bg-art-orange hover:border-art-orange hover:text-white transition-all ${durInfo.rundownHtml ? 'mt-3' : ''}`}>
                                Lihat PDF Rundown <Download size={8} />
                              </button>
                           )}
                          </div>
                        )}
                     </div>
                  )}
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
const DestinationCard: React.FC<{ dest: any, visibilities: any, onBook: (destinasi: string, jalur: string, durasi: string, type: 'private' | 'open') => void }> = ({ dest, visibilities, onBook }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPath, setSelectedPath] = useState(0);
  
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
      className="group bg-white border-2 border-art-text rounded-2xl overflow-hidden hover:shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] transition-all duration-300"
    >
      <div className="relative h-64 overflow-hidden border-b-2 border-art-text">
        <img src={dest.image || undefined} alt={dest.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute top-4 right-4 bg-white border-2 border-art-text px-3 py-1 font-black text-[10px] tracking-widest uppercase rounded-lg shadow-sm">{dest.region || dest.locationTag}</div>
        <div className="absolute top-4 left-4 bg-art-orange text-white border-2 border-art-text px-3 py-1 font-black text-[10px] tracking-widest uppercase rounded-lg shadow-sm">{dest.difficulty}</div>
      </div>

      <div className="p-6 md:p-8">
        <div className="flex justify-between items-end mb-4">
           <div>
              <h3 className="text-2xl font-black uppercase text-art-text tracking-tight mb-1">{dest.name}</h3>
              <p className="text-[10px] font-bold text-art-text/40 uppercase tracking-widest">{String(dest.height).replace(/mdpl/i, '').trim()} MDPL</p>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-art-orange mb-1">Mulai Dari</p>
              <p className="text-2xl font-black text-art-text">Rp {dest.paths?.[0]?.durations?.[0]?.price || '0'}k</p>
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
                          // Rundown always visible
                          return (
                            <div className="p-3 bg-white border border-art-text/10 rounded-xl space-y-2">
                              <h5 className="text-[9px] font-black uppercase text-art-text flex items-center gap-1"><FileText size={10} className="text-art-orange" /> Itinerary / Rundown</h5>
                              {durInfo.rundownHtml && (
                                <div className="text-[8px] text-art-text/60 font-mono whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto pr-2 no-scrollbar border-l border-art-orange/30 pl-2">
                                  {durInfo.rundownHtml}
                                </div>
                              )}
                              <div className="flex gap-2">
                                {durInfo?.rundownPdf ? (
                                  <a href={durInfo.rundownPdf} target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-2 bg-art-text text-white text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-art-orange transition-colors">
                                    Download PDF <Download size={8} className="inline ml-1" />
                                  </a>
                                ) : (
                                  <button type="button" onClick={() => generateRundownPdf(durInfo, dest.name, currentPath.name, currentDur.label)} className="flex-1 py-2 bg-art-text text-white text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-art-orange transition-colors">
                                    Lihat PDF Rundown <Download size={8} className="inline ml-1" />
                                  </button>
                                )}
                              </div>
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

const SettingsModal = ({ isOpen, onClose, theme, setTheme, setIsHistoryOpen }: { isOpen: boolean, onClose: () => void, theme: string, setTheme: (t: string) => void, setIsHistoryOpen: (v: boolean) => void }) => {
  const { playClick, playHover, playBack, playPop } = useSound();
  const [user] = useAuthState(auth);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [localVolume, setLocalVolume] = useState(() => {
    const saved = localStorage.getItem('appVolume');
    return saved ? parseFloat(saved) : 1.0;
  });

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setLocalVolume(newVol);
    localStorage.setItem('appVolume', newVol.toString());
    window.dispatchEvent(new Event('volumeChange'));
  };

  const themes = [
    { id: 'default', name: 'Rush (Default)', color: '#421404' },
    { id: 'matcha', name: 'Matcha (Hijau)', color: '#afa231' },
    { id: 'wine', name: 'Wine (Merah)', color: '#4c0004' },
    { id: 'wasabi', name: 'Wasabi (Kuning)', color: '#dcd189' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left text-art-text">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-art-section w-full max-w-sm rounded-2xl p-6 md:p-8 border-2 border-art-text relative shadow-2xl">
        <button onClick={(e) => { playClick(); onClose(); e.preventDefault(); }} className="absolute top-4 right-4 text-art-text hover:text-art-orange transition-colors" type="button">
          <X size={24} />
        </button>
        <h3 className="text-xl font-black uppercase tracking-tight text-art-text mb-6">Pengaturan</h3>
        
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-widest text-art-text/80 mb-3">Volume Suara Tombol</label>
          <div className="flex items-center gap-4 border-b border-art-text/10 pb-6 mb-6">
            <span className="text-xs font-bold w-12">{Math.round(localVolume * 100)}%</span>
            <input 
              type="range" 
              min="0" max="3" step="0.1" 
              value={localVolume} 
              onChange={handleVolumeChange}
              className="flex-1 accent-art-orange"
            />
          </div>

          <label className="block text-xs font-bold uppercase tracking-widest text-art-text/80 mb-3">Tema Tampilan</label>
          <div className="grid grid-cols-2 gap-2 border-b border-art-text/10 pb-6 mb-6">
            {themes.map(t => (
              <button 
                key={t.id} 
                onClick={() => { playClick(); setTheme(t.id); }} 
                onMouseEnter={playHover}
                className={`flex flex-col gap-1 items-start p-2 rounded border-2 transition-all ${theme === t.id ? 'border-art-orange bg-white/50 shadow-sm' : 'border-art-text/10 hover:border-art-text/30'}`}
              >
                <div className="w-full h-6 rounded flex" style={{ backgroundColor: t.color }}></div>
                <span className="text-[10px] font-bold uppercase w-full text-center leading-tight mt-1">{t.name}</span>
              </button>
            ))}
          </div>

          <label className="block text-xs font-bold uppercase tracking-widest text-art-text/80 mb-3">Akun</label>
          <div className="flex flex-col gap-3">
            {!user ? (
              <button onClick={() => { playClick(); loginWithGoogle(); }} className="flex items-center justify-center gap-2 border-2 border-art-text py-3 px-4 rounded-lg hover:bg-art-text hover:text-white transition-colors" onMouseEnter={playHover}>
                <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg>
                <span className="text-xs uppercase font-bold tracking-widest">Login via Google</span>
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border border-art-text/30 p-3 rounded-lg bg-white/50">
                   <div className="flex items-center gap-3">
                     <img src={user.photoURL || ''} alt="Avatar" className="w-8 h-8 rounded-full border border-art-text" />
                     <span className="text-xs font-bold text-art-text">{user.displayName}</span>
                   </div>
                   <button onClick={() => { playClick(); logout(); }} className="text-[10px] bg-red-100 hover:bg-red-200 text-red-600 font-bold uppercase tracking-widest px-3 py-1.5 rounded-md transition-colors" title="Logout" onMouseEnter={playHover}>Logout</button>
                </div>
              </div>
            )}
            
            {showTokenInput ? (
              <div className="flex gap-2 w-full mt-2">
                <input 
                  type="password"
                  id="adminTokenInput"
                  placeholder="Masukkan Token Admin"
                  className="w-full border border-art-text/30 px-3 py-2 rounded-lg text-xs outline-none focus:border-art-orange"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (e.currentTarget.value === 'Fajmuls22' || user?.email === 'mrachmanfm@gmail.com' || user?.email === 'mrahmanfm@gmail.com') {
                        localStorage.setItem('isAdminValid', 'true');
                        window.dispatchEvent(new Event('adminModeToggled'));
                        onClose();
                      } else {
                        customAlert('Token salah!');
                      }
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    playClick();
                    const inputElement = document.getElementById('adminTokenInput') as HTMLInputElement;
                    if (inputElement) {
                      if (inputElement.value === 'Fajmuls22' || user?.email === 'mrachmanfm@gmail.com' || user?.email === 'mrahmanfm@gmail.com') {
                        localStorage.setItem('isAdminValid', 'true');
                        window.dispatchEvent(new Event('adminModeToggled'));
                        onClose();
                      } else {
                        customAlert('Token salah!');
                      }
                    }
                  }}
                  className="bg-art-text text-white px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap"
                >
                  Go
                </button>
              </div>
            ) : (
              <button 
                onClick={(e) => { 
                  playClick(); 
                  if (user?.email === 'mrachmanfm@gmail.com' || user?.email === 'mrahmanfm@gmail.com') {
                    localStorage.setItem('isAdminValid', 'true');
                    window.dispatchEvent(new Event('adminModeToggled'));
                    onClose();
                  } else {
                    setShowTokenInput(true);
                  }
                }} 
                className="flex items-center justify-center gap-2 border border-art-text/30 py-2 px-4 rounded-lg hover:bg-art-text/10 transition-colors mt-2 text-art-text/50 w-full"
                onMouseEnter={playHover}
              >
                <span className="font-bold text-[10px] uppercase tracking-widest">Mode Admin</span>
              </button>
            )}
          </div>
        </div>
        
        <Button onClick={() => { playClick(); onClose(); }} variant="primary" className="w-full text-[10px] uppercase font-bold tracking-widest py-3 rounded-lg mt-8">
          Tutup
        </Button>
      </motion.div>
    </div>
  );
};

const BookingHistoryModal = ({ isOpen, onClose, showToast, bookings }: { isOpen: boolean, onClose: () => void, showToast: (m: string, t?: any) => void, bookings: any[] }) => {
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
                             {b.status === 'pending' ? 'Pending' : 
                              b.status === 'processing' ? 'Diproses' : 
                              b.status === 'dp_partial' ? 'DP Parsial' :
                              b.status === 'approved_to_draft' ? 'Disetujui' :
                              b.status === 'lunas' ? 'Lunas' : 
                              b.status === 'selesai' ? 'Trip Selesai' : 
                              b.status === 'rejected' ? 'Ditolak' :
                              'Dibatalkan'}
                           </div>
                           <span className="text-[10px] font-bold text-art-text/30 border-l border-art-text/10 pl-2">🕒 {b.createdAt ? new Date(b.createdAt.seconds * 1000).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '...'}</span>
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
                                   <div className="flex flex-col gap-2">
                                      {b.rundownPdf ? (
                                         <div className="grid grid-cols-2 gap-2">
                                           <a 
                                              href={b.rundownPdf} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-sm"
                                           >
                                              <Globe size={14} /> View Itinerary
                                           </a>
                                           <a 
                                              href={b.rundownPdf} 
                                              download
                                              className="flex items-center justify-center gap-2 bg-art-text text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-art-orange transition-colors shadow-sm"
                                           >
                                              <Download size={14} /> PDF
                                           </a>
                                         </div>
                                      ) : (
                                         <button 
                                            onClick={() => {
                                              playClick();
                                              customAlert(<div className="text-xs whitespace-pre-wrap text-left p-4 leading-loose font-medium font-mono border-2 border-art-text/10 rounded-2xl bg-white">{b.rundownText}</div>, "Itinerary / Rundown");
                                            }}
                                            className="w-full flex items-center justify-center gap-2 bg-art-text text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-art-orange transition-colors shadow-sm"
                                         >
                                            <FileText size={14} /> Lihat Itinerary
                                         </button>
                                      )}
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

const defaultGalleryPhotos = [
  { src: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=2070&auto=format&fit=crop", desc: "Momen ngopi pagi" },
  { src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop", desc: "Suasana sunrise" },
  { src: "https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?q=80&w=2070&auto=format&fit=crop", desc: "Trekking bersama" },
  { src: "https://images.unsplash.com/photo-1498855926480-d98e83099315?q=80&w=2070&auto=format&fit=crop", desc: "Istirahat di camp" }
];

export default function App() {
  const [user] = useAuthState(auth);
  const [showSplash, setShowSplash] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState({ destinasi: '', jalur: '', durasi: '', type: 'private' as 'private' | 'open', jadwal: '' });
  const [filterDifficulty, setFilterDifficulty] = useState('Semua');
  const [filterRegion, setFilterRegion] = useState('Semua');
  const [openFilterRegion, setOpenFilterRegion] = useState('Semua');
  const [openFilterDifficulty, setOpenFilterDifficulty] = useState('Semua');
  const difficultyOptions = ["Semua", ...DIFFICULTY_LEVELS];
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'info' | 'error' } | null>(null);
  const getSisaKuota = (ot: any) => {
    const total = ot.maxKuota || ot.kuotaNum || 15;
    const consumed = ot.consumedKuota || 0;
    return Math.max(0, total - consumed);
  };

  const showToastMsg = (msg: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('appTheme') || 'default';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length > 0) {
      setShowSearchDropdown(true);
    } else {
      setShowSearchDropdown(false);
    }
  };

  const getSearchResults = () => {
     if (!searchQuery) return [];
     const q = searchQuery.toLowerCase();
     const results = [];
     if ('fasilitas'.includes(q) || 'premium'.includes(q)) {
        results.push({ type: 'section', id: 'fasilitas', name: 'Fasilitas & Layanan' });
     }
     if ('gunung'.includes(q) || 'destinasi'.includes(q)) {
        results.push({ type: 'section', id: 'destinasi', name: 'Semua Gunung & Destinasi' });
     }
     
     destinationsData.forEach(d => {
        if (d.name.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q)) {
           results.push({ type: 'mountain', id: d.id, name: d.name });
        }
     });
     
     return results;
  };

  const executeSearch = (item: any) => {
    setShowSearchDropdown(false);
    if (item.type === 'section') {
       setSearchQuery('');
       scrollToSection({ preventDefault: () => {} } as any, item.id);
    } else {
       setSearchQuery(item.name);
       scrollToSection({ preventDefault: () => {} } as any, 'destinasi');
    }
  };

  const handleOpenBooking = (destinasi = '', jalur = '', durasi = '', type: 'private' | 'open' = 'open', jadwal = '') => {
    playClick();
    setBookingPrefill({ destinasi, jalur, durasi, type, jadwal });
    setIsBookingOpen(true);
    showToastMsg(`Membuka Booking: ${destinasi}`);
  };
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const { playHover, playClick, playPop } = useSound();
  const { scrollY } = useScroll();

  // Lock scroll when splash is active
  useEffect(() => {
    if (showSplash) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [showSplash]);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [userBookings, setUserBookings] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      setUserBookings([]);
      return;
    }
    const q = query(
      collection(db, 'bookings'), 
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserBookings(data);
    }, (error) => {
      console.error("App bookings fetch error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const { config, updateConfig, revertToDefault, loading } = useAppConfig(destinationsData, defaultTripLeaders, defaultGalleryPhotos);
  
  const currentDestinations = config.destinationsData;
  const currentTripLeaders = config.tripLeaders;
  const galleryPhotos = config.galleryPhotos;

  const filteredOpenTrips = (config.openTrips || []).filter((ot: any) => {
    const matchesRegion = openFilterRegion === 'Semua' || ot.region === openFilterRegion;
    const matchesDifficulty = openFilterDifficulty === 'Semua' || 
                             ot.difficulty === openFilterDifficulty;
    const matchesSearch = ot.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRegion && matchesDifficulty && matchesSearch;
  });

  useEffect(() => {
    const onAdminToggle = () => setIsAdminPanelOpen(true);
    window.addEventListener('adminModeToggled', onAdminToggle);
    return () => window.removeEventListener('adminModeToggled', onAdminToggle);
  }, []);

const heroSlidesConfig = config.homepage?.heroSlides && config.homepage.heroSlides.length > 0 
    ? config.homepage.heroSlides 
    : [
        { name: "Gunung Gede Pangrango", height: "2.958", image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2671&auto=format&fit=crop" },
        { name: "Gunung Salak", height: "2.211", image: "https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?q=80&w=2070&auto=format&fit=crop" }
      ];

  // Hero slideshow auto-play
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % heroSlidesConfig.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroSlidesConfig.length]);

  const filteredDestinations = currentDestinations.filter(dest => {
    if (dest.isActive === false) return false;
    const matchesDifficulty = filterDifficulty === 'Semua' || 
                             dest.difficulty === filterDifficulty;
    const matchesRegion = filterRegion === 'Semua' || dest.region === filterRegion;
    const matchesSearch = dest.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          dest.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDifficulty && matchesRegion && matchesSearch;
  });

  const scrollToSection = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement> | { preventDefault: () => void }, id: string) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsMobileMenuOpen(false);
    
    // Allow a small delay for menu to close and state to settle
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        // Use scrollIntoView as primary
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  return (
    <>
      <GlobalDialogProvider />
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: '-100%' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[200] bg-art-bg flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="w-48 h-48 rounded-full overflow-hidden border-4 border-art-text mb-8 mx-auto shadow-2xl relative bg-white"
            >
              <img src="https://files.catbox.moe/lubzno.png" alt="Logo Ngopi Ketinggian" className="w-full h-full object-contain" />
            </motion.div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-4xl md:text-5xl font-black uppercase tracking-tight text-art-text mb-4"
            >
              Ngopi Ketinggian
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="text-art-text/80 font-medium max-w-md mx-auto mb-12 text-lg"
            >
              Open trip eksklusif yang menyediakan pengalaman mendaki dengan fasilitas lengkap dan secangkir kopi terbaik di atas awan.
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="flex flex-col gap-3 w-full max-w-sm mx-auto"
            >
              <Button 
                variant="primary" 
                className="w-full py-4 text-sm tracking-widest uppercase font-bold group" 
                onClick={() => { playClick(); setShowSplash(false); }}
                disabled={loading}
              >
                {loading ? "Memuat Data..." : "Mulai Melihat Tour"} {!loading && <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" className="w-full text-[10px] tracking-widest uppercase font-bold" onClick={() => window.open('https://www.instagram.com/ngopi.dketinggian?igsh=Y3JtN3Y2eXIya29y', '_blank')}>
                  Kunjungi IG
                </Button>
                <Button variant="secondary" className="w-full text-[10px] tracking-widest uppercase font-bold" onClick={() => window.open('https://tiktok.com/@ngopidiketinggian', '_blank')}>
                  Kunjungi TikTok
                </Button>
              </div>
              {!user ? (
                <div className="mt-2 text-center">
                   <p className="text-[10px] text-art-text/60 italic mb-2 uppercase tracking-widest font-bold">*Opsional: Login untuk kemudahan akses</p>
                   <Button variant="glass" className="w-full border-art-text border bg-white flex items-center justify-center gap-2 text-[10px] tracking-widest uppercase font-bold" onClick={() => loginWithGoogle()}>
                     <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg> Login via Google
                   </Button>
                </div>
              ) : (
                <div className="mt-2 text-center">
                   <p className="text-[10px] text-art-green italic mb-2 uppercase tracking-widest font-bold">Halo, {user.displayName}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
        destinationOptions={currentDestinations.filter(d => d.isActive !== false)} 
        prefill={bookingPrefill} 
        facilities={config.facilities}
        config={config}
        updateConfig={updateConfig}
        setIsHistoryOpen={setIsHistoryOpen}
        userBookings={userBookings}
      />
      <BookingHistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        showToast={showToastMsg}
        bookings={userBookings}
      />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} theme={theme} setTheme={setTheme} setIsHistoryOpen={setIsHistoryOpen} />
      <AdminPanelModal isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} config={config} updateConfig={updateConfig} revertToDefault={revertToDefault} showToast={showToastMsg} defaultLists={{ destinations: destinationsData, leaders: defaultTripLeaders, gallery: defaultGalleryPhotos, cerita: "https://videos.pexels.com/video-files/856172/856172-hd_1920_1080_30fps.mp4" }} />
      <div className="min-h-screen selection:bg-art-orange selection:text-white overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="absolute w-full z-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 md:h-24 flex items-end justify-between border-b border-art-text/10 pb-4">
          <div className="flex items-center gap-4 cursor-pointer shrink-0" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} onMouseEnter={playHover}>
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white overflow-hidden border-2 border-art-text shadow-sm shrink-0">
              <img src="https://files.catbox.moe/lubzno.png" alt="Logo Ngopi Ketinggian" className="w-full h-full object-contain bg-white" />
            </div>
            <span className="text-sm tracking-[0.3em] font-black uppercase leading-tight text-art-text hidden sm:block">Ngopi<br/>Ketinggian</span>
          </div>
          
          <div className="flex-1 flex justify-center px-4 md:px-8 max-w-2xl mx-auto">
            <div className="relative w-full">
              <input 
                type="text" 
                placeholder="Cari gunung..." 
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-transparent border-b border-art-text/30 px-3 py-1.5 focus:outline-none focus:border-art-orange text-xs font-bold tracking-wider uppercase text-art-text placeholder:text-art-text/40 transition-colors" 
              />
              <Search className="absolute right-0 top-1/2 -translate-y-1/2 text-art-text/40 w-4 h-4 pointer-events-none" />
              <AnimatePresence>
                {showSearchDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 w-full mt-2 bg-white border-2 border-art-text rounded-xl shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] overflow-y-auto max-h-[50vh] z-50 origin-top"
                  >
                    {getSearchResults().length > 0 ? (
                      <div className="py-2">
                         {getSearchResults().map(res => (
                           <button key={res.id + res.name} onClick={() => { playClick(); executeSearch(res); }} className="w-full text-left px-4 py-3 border-b border-art-text/5 last:border-b-0 hover:bg-art-bg hover:text-art-orange transition-colors flex flex-col md:flex-row md:items-center justify-between text-[11px] font-bold text-art-text uppercase tracking-widest gap-1">
                              <span>{res.name}</span>
                              <span className="text-[9px] text-art-text/50">{res.type === 'section' ? 'Kategori / Menu' : 'Destinasi Gunung'}</span>
                           </button>
                         ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-art-text/50 font-medium italic">Tidak ada hasil ditemukan</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0 border-l border-art-text/20 pl-4 items-center">
            <button className="p-2 text-art-text hover:text-art-orange transition-colors" onClick={(e) => { playClick(); setIsMobileMenuOpen(!isMobileMenuOpen); }} title="Menu">
              {isMobileMenuOpen ? <X size={24} /> : <MoreVertical size={24} />}
            </button>
            <button onClick={() => { playPop(); setIsSettingsOpen(true); }} className="p-2 text-art-text hover:text-art-orange transition-colors" onMouseEnter={playHover} aria-label="Settings" title="Pengaturan & Akun">
              <Settings size={20} />
            </button>
          </div>
        </div>
        
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="absolute top-[80px] md:top-[96px] right-6 md:right-12 w-64 bg-white border-2 border-art-text shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] overflow-hidden z-40 rounded-xl"
            >
              <div className="absolute inset-0 z-0 opacity-5 pointer-events-none flex items-center justify-center">
                <img src="https://files.catbox.moe/lubzno.png" className="w-3/4 object-contain" alt="Background Menu" />
              </div>
              <div className="flex flex-col gap-0 p-2 text-[12px] font-bold uppercase tracking-widest text-art-text items-stretch relative z-10">
                <button onClick={(e) => { playClick(); scrollToSection(e, 'cerita'); }} className="text-left px-4 py-3 border-b border-art-text/10 hover:bg-art-orange/10 hover:text-art-orange transition-colors">Cerita Kami</button>
                <button onClick={(e) => { playClick(); scrollToSection(e, 'leader'); }} className="text-left px-4 py-3 border-b border-art-text/10 hover:bg-art-orange/10 hover:text-art-orange transition-colors">Trip Leader</button>
                <button onClick={(e) => { playClick(); scrollToSection(e, 'fasilitas'); }} className="text-left px-4 py-3 border-b border-art-text/10 hover:bg-art-orange/10 hover:text-art-orange transition-colors">Fasilitas</button>
                <button onClick={(e) => { playClick(); scrollToSection(e, 'destinasi'); }} className="text-left px-4 py-3 border-b border-art-text/10 hover:bg-art-orange/10 hover:text-art-orange transition-colors">Destinasi</button>
                <button onClick={(e) => { playClick(); scrollToSection(e, 'galeri'); }} className="text-left px-4 py-3 hover:bg-art-orange/10 hover:text-art-orange transition-colors">Galeri</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden bg-art-bg pt-32 pb-20 md:py-0">
        {/* Parallax Background using Grid layout pattern */}
          <div className="absolute inset-0 z-0 pointer-events-none mix-blend-multiply flex">
            {config.homepage?.heroPhotoUrl ? (
               <img src={config.homepage.heroPhotoUrl} className="w-full h-full object-cover opacity-[0.25] grayscale" alt="Cover bg" />
            ) : (
               <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover opacity-[0.25] grayscale" alt="Cover bg" />
            )}
          </div>
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-[1] hidden md:block">
          <div className="grid grid-cols-12 h-full w-full opacity-[0.03]">
            <div className="border-r border-black"></div><div className="border-r border-black"></div><div className="border-r border-black"></div><div className="border-r border-black"></div>
            <div className="border-r border-black"></div><div className="border-r border-black"></div><div className="border-r border-black"></div><div className="border-r border-black"></div>
            <div className="border-r border-black"></div><div className="border-r border-black"></div><div className="border-r border-black"></div><div></div>
          </div>
        </div>

        <div className="relative w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 px-6 md:px-12 z-10 gap-12 md:gap-8 items-center mt-8 md:mt-0">
          <div className="flex flex-col justify-center text-center md:text-left items-center md:items-start z-40 relative">
            
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={`text-4xl sm:text-5xl md:text-[60px] lg:text-[86px] leading-[1.0] md:leading-[0.85] font-black uppercase tracking-tight mb-4 md:mb-6 w-full text-center md:text-left z-50 relative pointer-events-none whitespace-pre-wrap ${theme === 'default' ? 'text-art-title' : 'text-art-title'}`}
              >
                <sup className="text-art-orange text-[0.4em] top-[-0.8em] relative inline-block">{config.homepage?.heroTitlePrefix || "Trip"}</sup> {config.homepage?.heroTitle || "Ngopi Di\nKetinggian"}
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className={`text-[13px] md:text-lg font-medium max-w-xs sm:max-w-md mb-6 md:mb-8 w-full mx-auto md:mx-0 text-center md:text-left pointer-events-auto ${theme === 'default' ? 'text-art-text/90' : 'text-art-text/80'}`}
              >
                {config.homepage?.heroDescription || "Harga terjangkau dengan pengalaman trip profesional. Nikmati secangkir kopi manual brew terbaik, hangatnya kebersamaan, and magisnya lautan awan dari puncak gunung."}
                <br/><span className="mt-2 block font-serif italic font-bold text-sm md:text-base text-art-orange">{config.homepage?.heroTagline || "Jaya / Jaya / Jaya"}</span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="mb-6 w-full text-center md:text-left"
              >
                <p className="text-art-text font-serif italic text-xl md:text-2xl font-bold">Open Trip Exclusive</p>
                <p className="text-[10px] md:text-xs font-sans font-bold uppercase tracking-widest text-art-text/70 mt-1 block">{config.homepage?.heroFeatures || "Fasilitas Premium • Pemandu Ahli • Keamanan Terjamin"}</p>
              </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-3 w-full max-w-[240px] sm:max-w-none mx-auto md:mx-0 justify-center md:justify-start"
            >

              <Button onClick={() => handleOpenBooking()} variant="primary" className="text-[10px] md:text-xs uppercase font-bold tracking-widest py-3 px-5 rounded-lg w-full sm:w-auto">
                Booking Trip
              </Button>
              <Button onClick={() => window.location.href='#destinasi'} variant="secondary" className="text-[10px] md:text-xs uppercase font-bold tracking-widest py-3 px-5 rounded-lg w-full sm:w-auto">
                Lihat Destinasi
              </Button>
            </motion.div>
          </div>

          <div className="flex justify-center items-center relative z-20 pointer-events-none md:pointer-events-auto">
             <div className="relative w-full max-w-[260px] sm:max-w-[300px] md:max-w-[320px] aspect-[4/5] md:aspect-[3/4] isolate mx-auto">
               <div className="absolute inset-0 bg-gray-300 rounded-[32px] md:rounded-[40px] overflow-hidden border-[6px] md:border-[12px] border-white shadow-2xl rotate-2 md:rotate-3">
                 <motion.img 
                   key={currentSlideIndex}
                   initial={{ opacity: 0, scale: 1.05 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ duration: 1 }}
                   src={heroSlidesConfig[currentSlideIndex]?.image || undefined} 
                   alt={heroSlidesConfig[currentSlideIndex]?.name} 
                   className="w-full h-full object-cover grayscale-[15%] absolute inset-0 z-0"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                 
                 <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 text-white z-20">
                   <p className="text-[10px] uppercase tracking-widest opacity-80 mb-1">Lokasi Utama</p>
                   <motion.h3 
                     key={`title-${currentSlideIndex}`}
                     initial={{ y: 20, opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     transition={{ duration: 0.5, delay: 0.3 }}
                     className="text-2xl md:text-3xl font-serif italic drop-shadow-md"
                   >
                     {heroSlidesConfig[currentSlideIndex]?.name}
                   </motion.h3>
                 </div>
               </div>
               
               {/* Fixed DEM Ketinggian Widget - positioned at top left */}
               <motion.div 
                 key={`badge-${currentSlideIndex}`}
                 initial={{ scale: 0, rotate: -45 }}
                 animate={{ scale: 1, rotate: -12 }}
                 transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
                 className="absolute -top-4 -left-4 md:-top-8 md:-left-8 w-20 h-20 md:w-24 md:h-24 bg-art-orange rounded-full flex flex-col items-center justify-center text-white -rotate-[12deg] border-4 border-white shadow-2xl z-[100]"
               >
                 <span className="text-[6px] md:text-[8px] uppercase font-bold tracking-tighter">Ketinggian</span>
                 <span className="text-xl md:text-2xl font-black leading-none my-0.5">{heroSlidesConfig[currentSlideIndex]?.height}</span>
                 <span className="text-[6px] md:text-[8px] opacity-80 uppercase">MDPL</span>
               </motion.div>
             </div>
          </div>
        </div>

        {/* Floating Vertical Text */}
        <div className="absolute top-[40%] left-4 rotate-180 hidden xl:block" style={{ writingMode: 'vertical-rl' }}>
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-black/20">EST. 2026 • ADVENTURE & BREW</span>
        </div>
      </section>

      {/* The Concept Section */}
      <section id="cerita" className="py-20 md:py-32 bg-art-section relative border-y border-art-text overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none mix-blend-overlay">
          <img src="https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=2076&auto=format&fit=crop" className="w-full h-full object-cover opacity-[0.25] grayscale" alt="Mountain bg" />
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-art-text mb-6 md:mb-8 leading-tight">{config.homepage?.ceritaTitle || "Secangkir Cerita"} <br/><span className="text-art-green font-serif italic normal-case font-normal text-3xl md:text-5xl">{config.homepage?.ceritaSub || "di Atas Awan"}</span></h2>
              <div className="w-12 h-1 bg-art-orange mb-8"></div>
              <p className="text-sm md:text-base font-medium text-art-text/80 mb-6 leading-relaxed">
                {config.homepage?.ceritaParagraph1 || "Selama lebih dari 10 tahun, kami telah menemani ribuan langkah menapaki puncak-puncak tertinggi di Nusantara. Mengarungi samudra awan dan dinginnya udara gunung mengajarkan kami satu hal: mendaki bukan sekadar tentang seberapa cepat Anda tiba di puncak, melainkan bagaimana Anda meresapi setiap detik perjalanannya. Ya... dan tentunya dengan secangkir kopi hangat di genggaman."}
              </p>
              <p className="text-sm md:text-base font-medium text-art-text/80 mb-10 leading-relaxed">
                {config.homepage?.ceritaParagraph2 || "Berbekal pengalaman panjang ini, meracik kopi di alam terbuka tak lagi sekadar ritual bagi kami, ia menjelma jadi perayaan kebersamaan. Lupakan sejenak semrawutnya ibukota. Kami siapkan ritme perjalanan yang santai, aman, penuh cerita, dan tentu saja... kopi rindu tebal yang diseduh di waktu yang paling tepat. Sesuatu yang tak akan pernah Anda temukan walau di coffee shop semewah apa pun di tengah kota."}
              </p>
              
              <div className="space-y-6 border-l-2 border-art-text/10 pl-6">
                {(config.homepage?.ceritaFeatures || [
                  { title: "Manual Brew Experience", desc: "Nikmati V60, Chemex, atau Aeropress dari barista kami." },
                  { title: "Grup Eksklusif", desc: "Maksimal 12 orang per perjalanan untuk keintiman." },
                  { title: "Peralatan Premium", desc: "Tenda The North Face dll untuk kenyamanan istirahat." }
                ]).map((item: any, i: number) => (
                  <div key={i} className="flex gap-4 items-start" onMouseEnter={playHover}>
                    <div>
                      <h4 className="font-bold text-art-text uppercase text-sm tracking-widest">{item.title}</h4>
                      <p className="text-sm font-medium text-art-text/60 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-art-orange rounded-3xl transform rotate-3 scale-105 z-0" />
              {config.ceritaVideoUrl.includes('youtube.com') || config.ceritaVideoUrl.includes('youtu.be') ? (
                <iframe 
                  src={config.ceritaVideoUrl}
                  style={config.ceritaVideoRatio && config.ceritaVideoRatio !== 'auto' ? { aspectRatio: config.ceritaVideoRatio } : {}}
                  className={`relative z-10 rounded-3xl shadow-2xl w-full ${!config.ceritaVideoRatio || config.ceritaVideoRatio === 'auto' ? 'aspect-video' : ''} grayscale-[10%] border-8 border-white`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video 
                  autoPlay loop muted playsInline controls
                  style={config.ceritaVideoRatio && config.ceritaVideoRatio !== 'auto' ? { aspectRatio: config.ceritaVideoRatio } : {}}
                  src={config.ceritaVideoUrl} 
                  poster="https://images.unsplash.com/photo-1542459954-469b8bd51515?q=80&w=2070&auto=format&fit=crop"
                  className="relative z-10 rounded-3xl shadow-2xl w-full h-auto max-h-[75vh] grayscale-[10%] border-8 border-white shadow-[12px_12px_0px_0px_rgba(26,26,26,1)]"
                />
              )}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl z-20 border border-art-text/5"
              >
                <div className="flex items-center gap-4">
                  <img src="https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=100&h=100&fit=crop" alt="Kopi Premium" className="w-12 h-12 rounded-full object-cover border-2 border-art-text/10" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-art-orange">Kopi Premium</p>
                    <p className="text-sm font-bold text-art-text mt-1 leading-tight">Diseduh Segar <br/>di Atas Gunung</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trip Leader Section */}
      <section id="leader" className="py-20 md:py-24 bg-white border-y border-art-text relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none mix-blend-multiply">
          <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover opacity-[0.25] grayscale" alt="Mountain bg" />
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-art-text mb-4 leading-tight">{config.homepage?.leaderTitle || "Kenalan dengan"} <br/><span className="text-art-green font-serif italic normal-case font-normal text-3xl md:text-5xl">{config.homepage?.leaderSub || "Trip Leader Kami"}</span></h2>
            <div className="w-12 h-1 bg-art-orange mx-auto mb-8"></div>
            <p className="text-sm md:text-base font-medium text-art-text/80 mb-6 leading-relaxed">
              {config.homepage?.leaderParagraph || "Tim profesional kami yang siap memandu perjalanan Anda agar lebih aman, menyenangkan, dan tentunya memastikan seduhan kopi Anda sempurna."}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {currentTripLeaders.map((leader, i) => (
              <div key={i} className="border border-art-text/10 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow bg-art-bg flex flex-col items-center p-6 text-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md mb-4 relative">
                   <img src={leader.avatar || undefined} alt={leader.name} className="w-full h-full object-cover grayscale-[20%]" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-widest text-art-text">{leader.name}</h3>
                <p className="text-[10px] uppercase tracking-widest font-bold text-art-orange mt-2 mb-4">{leader.age}</p>
                <p className="text-xs text-art-text/70 mb-4 h-12 flex items-center justify-center">{leader.description}</p>
                {leader.voiceLine ? (
                  <audio controls className="w-full h-8 mt-auto rounded-full" src={leader.voiceLine}></audio>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-art-orange/20 text-art-orange flex items-center justify-center mt-auto">
                    <Mic size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tim Lapangan Gallery */}
          <div className="mt-20">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-black uppercase tracking-tight text-art-text">Tim Lapangan Kami</h3>
              <p className="text-art-text/60 font-medium mt-2">Momen kebersamaan dan dedikasi tim di alam bebas</p>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-8 snap-x scrollbar-hide px-4">
              {(config.teamPhotos || []).filter((url: string) => url && url.trim() !== '').map((url: string, idx: number) => (
                <img 
                  key={idx}
                  src={url} 
                  alt={`Tim Lapangan ${idx + 1}`} 
                  className="w-80 h-64 object-cover rounded-2xl snap-center flex-shrink-0 grayscale-[20%] border-2 border-art-text hover:grayscale-0 hover:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] transition-all" 
                />
              ))}
              {(!config.teamPhotos || config.teamPhotos.filter((url: string) => url && url.trim() !== '').length === 0) && (
                <p className="text-xs font-bold text-art-text/40 italic mx-auto">Upload foto tim di dashboard admin.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Fasilitas / Include Paket Section */}
      <section id="fasilitas" className="py-20 md:py-24 bg-art-green text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none mix-blend-overlay">
          <img src="https://images.unsplash.com/photo-1542385151-efd9000785a0?q=80&w=2074&auto=format&fit=crop" className="w-full h-full object-cover opacity-40" alt="Mountain bg" />
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4">Fasilitas Open Trip</h2>
            <div className="w-12 h-1 bg-art-orange mx-auto mb-8"></div>
            <p className="font-medium text-white/80 leading-relaxed">
              Berikut ini adalah berbagai fasilitas premium dan pelayanan maksimal yang akan Anda dapatkan jika memilih jasa open trip kami. Kami memastikan setiap perjalanan Anda aman, nyaman, dan tentu saja ditemani pengalaman menyeduh kopi terbaik di alam bebas.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 p-8 rounded-2xl border-2 border-white/20">
              <h3 className="text-xl font-bold uppercase tracking-widest text-art-orange mb-6 flex items-center gap-3"><CheckCircle2 /> Include</h3>
              <ul className="space-y-4 text-sm font-medium">
                {config.facilities?.include?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3"><div className="w-2 h-2 mt-1.5 rounded-full bg-art-orange flex-shrink-0"></div><span>{item}</span></li>
                ))}
              </ul>
            </div>
            
            <div className="bg-art-bg text-art-text p-8 rounded-2xl border-2 border-art-text">
              <h3 className="text-xl font-bold uppercase tracking-widest text-art-orange mb-6 flex items-center gap-3"><X /> Exclude</h3>
              <ul className="space-y-4 text-sm font-medium">
                {config.facilities?.exclude?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3"><div className="w-2 h-2 mt-1.5 rounded-full bg-art-text flex-shrink-0"></div><span>{item}</span></li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 border-2 border-white/20 text-white p-8 rounded-2xl relative overflow-hidden">
               <div className="absolute inset-0 bg-art-orange/10"></div>
               <div className="relative z-10">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-art-orange rounded-full mix-blend-overlay filter blur-3xl opacity-50 translate-x-10 -translate-y-10"></div>
                 <h3 className="text-xl font-bold uppercase tracking-widest text-art-orange mb-6 flex items-center gap-3"><PlusCircle /> Optional (Tambahan)</h3>
                 <p className="text-sm font-medium text-white/70 mb-4">Pilih fasilitas tambahan jika Anda membutuhkannya. <br/><span className="text-art-orange">Catatan: Tambahan opsional ini dikenakan biaya dan tidak termasuk harga tertera.</span></p>
                 <ul className="space-y-4 text-sm font-medium">
                  {config.facilities?.opsi?.map((opt: any, i: number) => (
                    <li key={i} className="flex flex-col gap-1 items-start">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-art-orange flex-shrink-0"></div>
                        <span>{opt.name} {opt.priceInfo ? `- ${opt.priceInfo}` : ''}</span>
                      </div>
                      {opt.subItems && opt.subItems.length > 0 && (
                        <ul className="ml-5 mt-1 space-y-1">
                          {opt.subItems.map((sub: any, subIdx: number) => (
                             <li key={subIdx} className="text-xs text-white/50 flex items-start gap-2">
                               <span>-</span>
                               <span>{sub.name} {sub.priceInfo ? `- ${sub.priceInfo}` : ''}</span>
                             </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                 </ul>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Destination Section - Separated Open & Private */}
      <section id="destinasi" className="py-20 md:py-32 bg-[#F3F4F6] relative overflow-hidden">
        {/* Background image same as hero section */}
        <div className="absolute inset-0 z-0 pointer-events-none mix-blend-multiply flex">
          {config.homepage?.heroPhotoUrl ? (
             <img src={config.homepage.heroPhotoUrl} className="w-full h-full object-cover opacity-[0.25] grayscale-[80%]" alt="Destinasi bg" />
          ) : (
             <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover opacity-[0.25] grayscale-[80%]" alt="Destinasi bg" />
          )}
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          
          {/* OPEN TRIP SECTION */}
          {config.openTrips && config.openTrips.length > 0 && (
            <div className="mb-32">
              <div className="text-center max-w-5xl mx-auto mb-16 px-4">
                <span className="text-xs md:text-sm font-black uppercase tracking-[0.4em] text-art-orange mb-4 block">Fixed Schedule Adventure</span>
                <h2 className="text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter text-art-text mb-8 leading-none">Open Trip <span className="text-art-green">Ngopi</span></h2>
                <div className="w-24 h-2 bg-art-green mx-auto mb-10"></div>
                <p className="font-bold text-art-text/60 text-sm md:text-base uppercase tracking-widest leading-relaxed italic max-w-2xl mx-auto">Gabung dengan pendaki lain di jadwal yang sudah ditentukan. Harga lebih hemat namun fasilitas tetap premium.</p>
                
                {/* FILTERS */}
                <div className="mt-12 flex flex-col items-center justify-center gap-6 w-full max-w-2xl mx-auto border-t border-art-text/5 pt-10">
                   <div className="grid grid-cols-2 gap-4 w-full">
                     {/* Wilayah Filter (Left) */}
                     <div className="flex flex-col relative group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-art-text/50 mb-2 ml-2 flex items-center gap-1.5">
                           <MapPin size={10} className="text-art-green" /> Wilayah
                        </label>
                        <select 
                          value={openFilterRegion}
                          onChange={(e) => setOpenFilterRegion(e.target.value)}
                          className="w-full appearance-none bg-white border-2 border-art-text px-4 py-3 rounded-2xl text-[11px] font-black tracking-widest uppercase text-art-text outline-none focus:border-art-green shadow-sm cursor-pointer"
                        >
                          {['Semua', ...Array.from(new Set(config.openTrips.map((ot: any) => ot.region))).filter(Boolean)].sort().map((reg: any) => (
                            <option key={reg} value={reg}>{reg}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 bottom-3.5 pointer-events-none text-art-text"><ChevronDown size={14} /></div>
                     </div>

                     {/* Kesulitan Filter (Right) */}
                     <div className="flex flex-col relative group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-art-text/50 mb-2 ml-2 flex items-center gap-1.5">
                           <AlertCircle size={10} className="text-art-orange" /> Kesulitan
                        </label>
                        <select 
                          value={openFilterDifficulty}
                          onChange={(e) => setOpenFilterDifficulty(e.target.value)}
                          className="w-full appearance-none bg-white border-2 border-art-text px-4 py-3 rounded-2xl text-[11px] font-black tracking-widest uppercase text-art-text outline-none focus:border-art-green shadow-sm cursor-pointer"
                        >
                          {['Semua', ...DIFFICULTY_LEVELS].map((lvl: any) => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 bottom-3.5 pointer-events-none text-art-text"><ChevronDown size={14} /></div>
                     </div>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredOpenTrips.length > 0 ? (
                  filteredOpenTrips.map((ot: any, i: number) => (
                    <OpenTripCard key={i} ot={ot} onJoin={handleOpenBooking} getSisaKuota={getSisaKuota} visibilities={config.visibilities} allLeaders={config.tripLeaders} config={config} />
                  ))
                ) : (
                  <div className="col-span-full py-24 border-4 border-dashed border-art-text/5 rounded-[3rem] flex flex-col items-center justify-center text-center bg-white/40">
                    <Search size={64} className="mb-6 text-art-text/5" />
                    <p className="font-black uppercase tracking-[0.2em] text-sm text-art-text/30">Belum ada jadwal untuk kriteria ini</p>
                    <button onClick={() => { setOpenFilterRegion('Semua'); setOpenFilterDifficulty('Semua'); }} className="mt-6 px-6 py-2 bg-art-orange text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Reset Filter</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PRIVATE TRIP SECTION */}
          <div className="text-center max-w-5xl mx-auto mb-16 px-4">
            <span className="text-xs md:text-sm font-black uppercase tracking-[0.4em] text-art-orange mb-4 block">Exclusive Journey</span>
            <h2 className="text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter text-art-text mb-8 leading-none">Private <span className="text-art-orange">Trip</span></h2>
            <div className="w-24 h-2 bg-art-text mx-auto mb-10"></div>
            <p className="font-bold text-art-text/60 text-sm md:text-base uppercase tracking-widest leading-relaxed italic max-w-2xl mx-auto">Tentukan sendiri gunung tujuan, jalur pendakian, dan durasi sesuai keinginanmu. Cocok untuk solo traveler maupun rombongan tertutup.</p>
            
                {/* FILTERS */}
                <div className="mt-12 flex flex-col items-center justify-center gap-6 w-full max-w-2xl mx-auto border-t border-art-text/5 pt-10">
                   <div className="grid grid-cols-2 gap-4 w-full">
                     {/* Wilayah Filter (Left) */}
                     <div className="flex flex-col relative group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-art-text/50 mb-2 ml-2 flex items-center gap-1.5">
                           <MapPin size={10} className="text-art-green" /> Wilayah
                        </label>
                        <select 
                          value={filterRegion}
                          onChange={(e) => setFilterRegion(e.target.value)}
                          className="w-full appearance-none bg-white border-2 border-art-text px-4 py-3 rounded-2xl text-[11px] font-black tracking-widest uppercase text-art-text outline-none focus:border-art-orange shadow-sm cursor-pointer"
                        >
                          {['Semua', ...Array.from(new Set(currentDestinations.map(d => d.region))).filter(Boolean)].sort().map((r: any) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 bottom-3.5 pointer-events-none text-art-text"><ChevronDown size={14} /></div>
                     </div>

                     {/* Kesulitan Filter (Right) */}
                     <div className="flex flex-col relative group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-art-text/50 mb-2 ml-2 flex items-center gap-1.5">
                           <AlertCircle size={10} className="text-art-orange" /> Kesulitan
                        </label>
                        <select 
                          value={filterDifficulty}
                          onChange={(e) => setFilterDifficulty(e.target.value)}
                          className="w-full appearance-none bg-white border-2 border-art-text px-4 py-3 rounded-2xl text-[11px] font-black tracking-widest uppercase text-art-text outline-none focus:border-art-orange shadow-sm cursor-pointer"
                        >
                          {difficultyOptions.map((opt: any) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 bottom-3.5 pointer-events-none text-art-text"><ChevronDown size={14} /></div>
                     </div>
                   </div>
                </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {filteredDestinations.length > 0 ? (
              filteredDestinations.map((dest: any, idx: number) => (
                <DestinationCard 
                  key={dest.id} 
                  dest={dest} 
                  visibilities={{}} 
                  onBook={(d, j, dur, t) => handleOpenBooking(d, j, dur, t)} 
                />
              ))
            ) : (
              <div className="col-span-full py-20 border-2 border-dashed border-art-text/20 rounded-2xl bg-white/50 flex flex-col items-center justify-center text-center px-4">
                <Mountain size={48} className="text-art-text/20 mb-4" />
                <h4 className="font-bold text-xl uppercase tracking-tighter text-art-text">Destinasi Belum Tersedia</h4>
                <p className="text-sm font-medium text-art-text/60 mt-2 max-w-xs">Gunakan filter wilayah atau kesulitan yang berbeda untuk menemukan trip impianmu.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="galeri" className="py-20 md:py-24 bg-art-text text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none mix-blend-overlay">
          <img src="https://images.unsplash.com/photo-1543884487-7359df37db0d?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover opacity-[0.15]" alt="Mountain bg" />
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-6">Galeri Pendakian</h2>
            <div className="w-12 h-1 bg-art-orange mx-auto mb-6"></div>
            <p className="font-medium text-white/60">Beberapa momen seru dari para peserta open trip kami bersama tim.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {galleryPhotos.map((photo, index) => (
              <img 
                key={index}
                src={photo.src} 
                alt={photo.desc} 
                onClick={() => { setGalleryIndex(index); setGalleryOpen(true); }}
                className={`w-full aspect-square object-cover rounded-2xl grayscale-[20%] hover:grayscale-0 transition-all border-4 border-transparent hover:border-art-orange cursor-pointer ${index % 2 !== 0 ? 'md:mt-8' : ''}`} 
              />
            ))}
          </div>

          <Lightbox
            open={galleryOpen}
            close={() => setGalleryOpen(false)}
            index={galleryIndex}
            slides={galleryPhotos.map((p: any) => ({ src: p.src, alt: p.desc }))}
          />
        </div>
      </section>

      {/* Promo Banner */}
      <section className="bg-art-bg flex flex-col items-center justify-center border-t border-art-text">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-12 py-12 flex items-center justify-center relative">
          <div className="absolute top-0 right-12 w-24 h-24 bg-art-orange rounded-full mix-blend-multiply blur-xl opacity-50 pointer-events-none"></div>
          <div className="absolute bottom-0 left-12 w-32 h-32 bg-art-green rounded-full mix-blend-multiply blur-xl opacity-50 pointer-events-none"></div>
          <a href="#destinasi" onClick={(e) => scrollToSection(e, 'destinasi')} className="w-full block hover:scale-[1.02] transition-transform duration-500 z-10 flex justify-center">
            <img src="https://files.catbox.moe/lbf6xr.png" alt="Promo Promo Trip Ngopi" className="w-full max-w-4xl h-auto object-contain rounded-3xl shadow-2xl border-[6px] md:border-[10px] border-white" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-art-text py-16 text-white border-t border-art-text">
        <div className="max-w-7xl mx-auto px-6 md:px-12 border-b border-white/10 pb-16 mb-8 grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border border-white/20">
                <img src="https://files.catbox.moe/lubzno.png" alt="Logo Ngopi Ketinggian" className="w-full h-full object-contain bg-white" />
              </div>
              <span className="text-xs tracking-[0.3em] font-black uppercase leading-none text-white opacity-80">Ngopi<br/>Ketinggian</span>
            </div>
            <p className="text-white/60 font-medium max-w-sm mb-6 leading-relaxed">
              Pengalaman pendakian gunung yang dipadukan dengan budaya kopi nusantara. Aman, nyaman, dan berkesan.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-[10px] uppercase tracking-widest text-art-orange">Penjelajahan</h4>
            <ul className="space-y-4 text-white/60 font-medium text-sm">
              <li><a href="#destinasi" className="hover:text-white transition-colors flex items-center gap-2" onMouseEnter={playHover}><span className="w-4 h-[1px] bg-white/20"></span>Gunung Gede Pangrango</a></li>
              <li><a href="#destinasi" className="hover:text-white transition-colors flex items-center gap-2" onMouseEnter={playHover}><span className="w-4 h-[1px] bg-white/20"></span>Gunung Salak</a></li>
              <li><a href="#destinasi" className="hover:text-white transition-colors flex items-center gap-2" onMouseEnter={playHover}><span className="w-4 h-[1px] bg-white/20"></span>Gunung Semeru</a></li>
              <li><a href="#destinasi" className="hover:text-white transition-colors flex items-center gap-2" onMouseEnter={playHover}><span className="w-4 h-[1px] bg-white/20"></span>Gunung Rinjani</a></li>
              <li><a href="#destinasi" className="hover:text-white transition-colors flex items-center gap-2" onMouseEnter={playHover}><span className="w-4 h-[1px] bg-white/20"></span>Gunung Sumbing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-[10px] uppercase tracking-widest text-art-orange">Hubungi Kami</h4>
            <ul className="space-y-4 text-white/60 font-medium text-sm">
              <li><a href="https://wa.me/6282127533268" className="hover:text-white transition-colors" onMouseEnter={playHover}>WA: 0821 2753 3268</a></li>
              <li><a href="https://www.instagram.com/ngopi.dketinggian?igsh=Y3JtN3Y2eXIya29y" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" onMouseEnter={playHover}>IG: @ngopi.dketinggian</a></li>
              <li><a href="https://tiktok.com/@ngopidiketinggian" className="hover:text-white transition-colors" onMouseEnter={playHover}>TikTok: @ngopidiketinggian</a></li>
              <li>Email: siliwangiputra1510@gmail.com</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center text-white/40 text-[10px] font-bold uppercase tracking-widest gap-4 md:gap-0">
          <p>&copy; {new Date().getFullYear()} Trip Ngopi di Ketinggian.</p>
          <p>EST. 2026 • ADVENTURE & BREW</p>
        </div>
      </footer>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] bg-art-text text-white px-8 py-4 rounded-2xl border-4 border-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 min-w-[300px]"
          >
             <div className="w-8 h-8 rounded-full bg-art-orange flex items-center justify-center text-white shrink-0"><BellRing size={16} /></div>
             <p className="text-sm font-black uppercase tracking-widest leading-none">{toast.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}
