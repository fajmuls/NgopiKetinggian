import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Users, Calendar, ChevronRight, Map, Tent, 
  CheckCircle2, User, ShoppingBag, Send, Globe, 
  Clock, Download, Info, Search, CreditCard, 
  Trash2, TrendingUp, ChevronDown, ExternalLink, MapPin
} from 'lucide-react';
import { auth, db } from '../firebase';
import { 
  collection, addDoc, serverTimestamp, query, 
  orderBy, onSnapshot, where, deleteDoc, doc, updateDoc 
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { jsPDF } from 'jspdf';
import { customAlert, customConfirm } from '../GlobalDialog';

// Shared Button Component (duplicated from App.tsx or we could move it to its own file)
function Button({ children, className = '', variant = 'primary', onClick, ...props }: any) {
  const baseStyle = "px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-2 transform active:scale-95";
  const variants = {
    primary: "bg-[#1A1A1A] hover:bg-[#48BB78] text-white shadow-sm border border-transparent",
    secondary: "bg-white hover:bg-gray-50 text-[#1A1A1A] border border-gray-200",
    glass: "bg-white/90 hover:bg-white text-[#1A1A1A] border border-transparent"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

export const BookingModal = ({ 
  isOpen, 
  onClose, 
  destinationOptions, 
  prefill, 
  config, 
  updateConfig, 
  setIsHistoryOpen,
  playClick,
  playBack,
  playSuccess,
  playPop
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  destinationOptions?: any[], 
  prefill?: any, 
  config: any, 
  updateConfig: (c: any) => void, 
  setIsHistoryOpen: (v: boolean) => void,
  playClick: () => void,
  playBack: () => void,
  playSuccess: () => void,
  playPop: () => void
}) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [viewType, setViewType] = useState<'selection' | 'trip_list' | 'form'>('selection');
  const [user] = useAuthState(auth);

  const [currentType, setCurrentType] = useState<'private' | 'open'>('private');
  const [selectedDestinasi, setSelectedDestinasi] = useState('');
  const [selectedJalur, setSelectedJalur] = useState('');
  const [selectedDurasi, setSelectedDurasi] = useState('');
  const [selectedJadwal, setSelectedJadwal] = useState(''); 
  const [pesertaCount, setPesertaCount] = useState<number | string>(1); // Fixed: default to 1
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
    
    // Fixed: Always lead to "Choose your adventure" (selection) when clicking booking menu
    // unless it's a prefill (from card click)
    if (prefill) {
      setSelectedDestinasi(prefill.destinasi || '');
      setSelectedJalur(prefill.jalur || '');
      setSelectedDurasi(prefill.durasi || '');
      setSelectedJadwal(prefill.jadwal || '');
      setCurrentType(prefill.type || 'private');
      if (prefill.destinasi) setViewType('form');
    } else {
      setViewType('selection'); // Force reset to selection
      
      // But keep the data from draft if any
      const saved = localStorage.getItem('ngopi_booking_draft');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setFormState({
            nama: data.nama || '',
            email: data.email || '',
            wa: data.wa || '',
            deskripsi: data.deskripsi || ''
          });
          setPromoCode(data.promoCode || '');
          // We don't force reset selections here to "don't delete data when returning to previous state"
          // but we open at the 'selection' menu as requested.
          if (data.destinasi) setSelectedDestinasi(data.destinasi);
          if (data.jalur) setSelectedJalur(data.jalur);
          if (data.durasi) setSelectedDurasi(data.durasi);
          if (data.jadwal) setSelectedJadwal(data.jadwal);
          if (data.pesertaCount) setPesertaCount(data.pesertaCount);
          if (data.type) setCurrentType(data.type);
        } catch (e) {
          console.error("Failed to load draft", e);
        }
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
  let currentDestinationDetails: any = null;
  if (selectedDestinasi && selectedJalur && selectedDurasi && destinationOptions) {
     const dest = destinationOptions.find(d => d.name === selectedDestinasi);
     if (dest) {
       currentDestinationDetails = dest;
       const path = dest.paths?.find((p: any) => p.name === selectedJalur);
       if (path) {
         const duration = path.durations?.find((d: any) => d.label === selectedDurasi);
         if (duration) basePricePerPax = duration.price * 1000;
       }
     }
  }

  // Handle Open Trip Pricing
  if (currentType === 'open' && selectedDestinasi && config.openTrips) {
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

  const tripDays = (() => {
    if (!selectedDurasi) return 1;
    const hIndex = selectedDurasi.indexOf('H');
    return hIndex !== -1 ? Math.max(1, parseInt(selectedDurasi.substring(0, hIndex).trim())) : 1;
  })();

  const opsionalItemsList: any[] = [];
  let totalOpsionalPrice = 0;

  Object.entries(subSelected).forEach(([key, qty]) => {
    const [parentName, subName] = key.split('|');
    if (!selectedOpsional.includes(parentName)) return;

    const parentOpt = config?.facilities?.opsi?.find((o: any) => o.name === parentName);
    const subItem = parentOpt?.subItems?.find((s: any) => s.name === subName);
    if (subItem) {
      const pricePerDay = subItem.price ? Number(subItem.price) * 1000 : 0;
      const totalItemPrice = pricePerDay * Number(qty) * tripDays;
      
      opsionalItemsList.push({
        name: subName,
        parentName: parentName,
        price: pricePerDay,
        count: Number(qty),
        days: tripDays,
        subtotal: totalItemPrice,
        status: pricePerDay > 0 ? 'confirmed' : 'pending_price'
      });
      totalOpsionalPrice += totalItemPrice;
    }
  });

  selectedOpsional.forEach(optName => {
    const opt = config?.facilities?.opsi?.find((o: any) => o.name === optName);
    if (opt && (!opt.subItems || opt.subItems.length === 0)) {
       const isCalculated = opt.pricingFormat === 'calculated';
       const price = isCalculated ? (opt.price ? Number(opt.price) * 1000 : 0) : 0;
       opsionalItemsList.push({
         name: optName,
         parentName: optName,
         price: price,
         count: 1,
         days: 1, 
         subtotal: price,
         status: (opt.pricingFormat === 'manual' || !opt.pricingFormat) ? 'pending_price' : 'confirmed'
       });
       totalOpsionalPrice += price;
    }
  });

  const discountRate = activePromo ? activePromo.discount / 100 : 0;
  const discountAmount = grossPrice * discountRate;
  const netPrice = (grossPrice - discountAmount) + totalOpsionalPrice;
  
  const handleSubmitPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.nama || !formState.wa || !selectedDestinasi || !selectedJalur || !selectedDurasi || !selectedJadwal || !pesertaCount) {
      customAlert("Mohon lengkapi semua data wajib.");
      return;
    }
    setIsConfirming(true);
    if (playClick) playClick();
  };

  const handleBookingFinal = async () => {
    const { nama, email, wa, deskripsi } = formState;
    const finalJadwalLabel = currentType === 'private' ? calculateEndDate(selectedJadwal, selectedDurasi) : selectedJadwal;
    
    setIsSubmittingBooking(true);

    if (user) {
      try {
        await addDoc(collection(db, 'bookings'), {
          userId: user.uid,
          nama, email, wa,
          destinasi: selectedDestinasi, jalur: selectedJalur,
          durasi: selectedDurasi, jadwal: finalJadwalLabel, 
          peserta: pesertaCount,
          opsionalItems: opsionalItemsList,
          opsionalPrice: totalOpsionalPrice,
          discountAmount,
          promoCode: isPromoValid ? promoCode : '',
          deskripsi,
          type: currentType,
          totalPrice: netPrice,
          createdAt: serverTimestamp(),
          status: 'pending'
        });

        if (currentType === 'open' && config) {
           const updatedOpenTrips = (config.openTrips || []).map((ot: any) => {
              if (ot.name === selectedDestinasi && ot.jadwal === selectedJadwal) {
                 return { ...ot, consumedKuota: (ot.consumedKuota || 0) + Number(pesertaCount) };
              }
              return ot;
           });
           updateConfig({ openTrips: updatedOpenTrips });
        }
      } catch (error) {
        console.error(error);
      }
    }

    const waMsg = `Halo Admin! 🏕️\n\nDetail Booking:\nNama: ${nama}\nDestinasi: ${selectedDestinasi}\nJadwal: ${finalJadwalLabel}\nTotal: Rp ${netPrice.toLocaleString('id-ID')}`;
    window.open(`https://wa.me/6282127533268?text=${encodeURIComponent(waMsg)}`, '_blank');
    
    if (playSuccess) playSuccess();
    setShowSuccess(true);
    setTimeout(() => { 
      setShowSuccess(false); 
      setIsConfirming(false);
      setIsSubmittingBooking(false);
      onClose(); 
      setIsHistoryOpen(true);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 text-left">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-2xl rounded-[2.5rem] p-6 md:p-10 border-2 border-[#1A1A1A] relative max-h-[92vh] overflow-y-auto shadow-2xl">
        <button onClick={() => { if(playBack) playBack(); onClose(); }} className="absolute top-6 right-6 z-10 text-[#1A1A1A] hover:text-[#FF6B00] transition-colors"><X size={24} /></button>
        
        {showSuccess ? (
          <div className="text-center py-12 flex flex-col items-center justify-center h-full">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-100 text-[#48BB78] rounded-full flex items-center justify-center mb-6"><CheckCircle2 size={48} /></motion.div>
            <h3 className="text-2xl font-black uppercase text-[#1A1A1A] mb-3">Pesanan Terkirim!</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Diarahkan ke WhatsApp Admin...</p>
          </div>
        ) : isConfirming ? (
          <div className="pt-4 space-y-6">
             <h3 className="text-2xl font-black uppercase tracking-tight text-[#1A1A1A]">Konfirmasi Pesanan</h3>
             <div className="space-y-4">
               {/* Detail Rangkuman */}
               <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-100">
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Destinasi</span>
                    <span className="text-xs font-black uppercase">{selectedDestinasi}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Jalur</span>
                    <span className="text-xs font-black uppercase">{selectedJalur}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Jadwal</span>
                    <span className="text-xs font-black uppercase">{currentType === 'private' ? calculateEndDate(selectedJadwal, selectedDurasi) : selectedJadwal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Peserta</span>
                    <span className="text-xs font-black uppercase">{pesertaCount} Pax</span>
                  </div>
               </div>

               {isPromoValid && (
                  <div className="bg-green-50 p-4 rounded-xl border-2 border-green-100 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] uppercase font-black text-green-600 block">Promo Aktif ({activePromo.discount}%)</span>
                      <span className="text-xs font-bold uppercase">{promoCode}</span>
                    </div>
                    <span className="text-xs font-black text-green-600">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                  </div>
               )}

               <div className="bg-[#1A1A1A] p-6 rounded-2xl text-white">
                  <span className="text-[10px] uppercase font-black text-white/40 tracking-widest">Total Bayar</span>
                  <p className="text-3xl font-black">Rp {netPrice.toLocaleString('id-ID')}</p>
               </div>
             </div>

             <div className="flex gap-3">
                <button onClick={() => setIsConfirming(false)} className="flex-1 py-4 border-2 border-[#1A1A1A] rounded-2xl font-black uppercase text-[10px]">Revisi</button>
                <button onClick={handleBookingFinal} disabled={isSubmittingBooking} className="flex-[2] py-4 bg-[#1A1A1A] text-white rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2">
                   {isSubmittingBooking ? 'Memproses...' : 'Konfirmasi & Kirim'} <Send size={14} />
                </button>
             </div>
          </div>
        ) : viewType === 'selection' ? (
          <div className="pt-4">
             <h3 className="text-3xl font-black uppercase tracking-tighter text-[#1A1A1A] mb-2">Pilih Petualanganmu</h3>
             <p className="text-[10px] font-bold text-gray-400 mb-8 uppercase tracking-widest leading-relaxed">Tentukan jenis perjalanan yang paling cocok untukmu.</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => { if(playPop) playPop(); setCurrentType('private'); setViewType('form'); setPesertaCount(1); }}
                  className="group bg-white p-6 rounded-[2rem] border-2 border-[#1A1A1A] hover:shadow-[10px_10px_0px_#FF6B00] hover:translate-x-1 hover:translate-y-1 transition-all text-left"
                >
                   <div className="p-4 bg-[#FF6B00] text-white rounded-2xl w-fit mb-4"><Users size={28}/></div>
                   <h4 className="text-2xl font-black uppercase text-[#1A1A1A] mb-1">Private Trip</h4>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Atur jadwal dan rekan daki sendiri.</p>
                </button>
                
                <button 
                  onClick={() => { if(playPop) playPop(); setCurrentType('open'); setViewType('trip_list'); setPesertaCount(1); }}
                  className="group bg-white p-6 rounded-[2rem] border-2 border-[#1A1A1A] hover:shadow-[10px_10px_0px_#48BB78] hover:translate-x-1 hover:translate-y-1 transition-all text-left"
                >
                   <div className="p-4 bg-[#48BB78] text-white rounded-2xl w-fit mb-4"><Calendar size={28}/></div>
                   <h4 className="text-2xl font-black uppercase text-[#1A1A1A] mb-1">Open Trip</h4>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gabung bersama pendaki lainnya.</p>
                </button>

                {user && (
                   <button 
                     onClick={() => { if(playClick) playClick(); setIsHistoryOpen(true); onClose(); }}
                     className="md:col-span-2 mt-4 p-5 rounded-2xl border-2 border-gray-100 hover:border-[#FF6B00] transition-all flex items-center justify-between"
                   >
                     <div className="flex items-center gap-4">
                        <ShoppingBag size={20} className="text-[#FF6B00]" />
                        <span className="text-xs font-black uppercase tracking-widest">Riwayat Booking</span>
                     </div>
                     <ChevronRight size={20} className="text-gray-300" />
                   </button>
                )}
             </div>
          </div>
        ) : viewType === 'trip_list' ? (
           <div className="pt-4">
              <button onClick={() => setViewType('selection')} className="text-[10px] font-black uppercase text-[#FF6B00] mb-4 flex items-center gap-1"><ChevronRight size={14} className="rotate-180" /> Kembali</button>
              <h3 className="text-2xl font-black uppercase text-[#1A1A1A] mb-6">Jadwal Open Trip</h3>
              <div className="space-y-3">
                 {config.openTrips?.filter((ot: any) => getSisaKuota(ot) > 0).map((ot: any, idx: number) => (
                    <button 
                      key={idx} 
                      onClick={() => {
                        setSelectedDestinasi(ot.name);
                        setSelectedJadwal(ot.jadwal);
                        setSelectedJalur(ot.path || "Jalur Utama");
                        setSelectedDurasi(ot.duration || "N/A");
                        setViewType('form');
                      }}
                      className="w-full p-4 rounded-xl border-2 border-[#1A1A1A] hover:bg-gray-50 flex justify-between items-center text-left"
                    >
                       <div>
                          <h4 className="text-sm font-black uppercase">{ot.name}</h4>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{ot.jadwal}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-[#48BB78] uppercase">{getSisaKuota(ot)} Pax Sisa</p>
                          <p className="text-[10px] font-black text-[#FF6B00] uppercase">Rp {(ot.price*1000).toLocaleString('id-ID')}</p>
                       </div>
                    </button>
                 ))}
              </div>
           </div>
        ) : (
          <form className="space-y-6 pt-2" onSubmit={handleSubmitPreview}>
             <div className="flex justify-between items-center">
                <button type="button" onClick={() => setViewType(currentType === 'open' ? 'trip_list' : 'selection')} className="text-[10px] font-black uppercase text-[#FF6B00] flex items-center gap-1"><ChevronRight size={14} className="rotate-180" /> Kembali</button>
                <span className="text-[10px] font-black uppercase px-3 py-1 bg-gray-100 rounded-full">{currentType} Trip</span>
             </div>

             <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Nama Lengkap</label>
                      <input required className="w-full border-2 border-[#1A1A1A] p-4 rounded-2xl text-xs font-black uppercase" value={formState.nama} onChange={e => setFormState({...formState, nama: e.target.value})} placeholder="NAMA SESUAI KTP" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-400 ml-1">WhatsApp</label>
                      <input required className="w-full border-2 border-[#1A1A1A] p-4 rounded-2xl text-xs font-black" value={formState.wa} onChange={e => setFormState({...formState, wa: e.target.value})} placeholder="0812..." />
                   </div>
                </div>

                {/* Fixed UI: Show Trip Details (Mepo, Kuota etc) when destination selected */}
                <div className="space-y-4">
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Pilih Gunung</label>
                      <select 
                        required 
                        value={selectedDestinasi} 
                        onChange={e => { setSelectedDestinasi(e.target.value); setSelectedJalur(""); }}
                        disabled={currentType === 'open'}
                        className="w-full border-2 border-[#1A1A1A] p-4 rounded-2xl text-xs font-black uppercase"
                      >
                         <option value="">-- PILIH GUNUNG --</option>
                         {destinationOptions?.map((d, i) => <option key={i} value={d.name}>{d.name}</option>)}
                      </select>
                   </div>

                   {currentDestinationDetails && currentType === 'private' && (
                     <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-200">
                        <div className="flex gap-4">
                           <div className="flex-1">
                              <span className="text-[8px] font-black uppercase text-gray-400 block mb-1">Meeting Point</span>
                              <span className="text-[10px] font-bold uppercase">{currentDestinationDetails.mepo || 'Basecamp'}</span>
                           </div>
                           <div className="flex-1">
                              <span className="text-[8px] font-black uppercase text-gray-400 block mb-1">Ketentuan Kuota</span>
                              <span className="text-[10px] font-bold uppercase">{currentDestinationDetails.kuota || 'Min 2 Pax'}</span>
                           </div>
                        </div>
                     </div>
                   )}

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Pilih Jalur</label>
                        <select required value={selectedJalur} onChange={e => setSelectedJalur(e.target.value)} disabled={currentType === 'open' || !selectedDestinasi} className="w-full border-2 border-[#1A1A1A] p-3 rounded-xl text-[10px] font-black uppercase">
                           <option value="">-- JALUR --</option>
                           {currentDestinationDetails?.paths?.map((p: any) => <option key={p.name} value={p.name}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Pilih Durasi</label>
                        <select required value={selectedDurasi} onChange={e => setSelectedDurasi(e.target.value)} disabled={currentType === 'open' || !selectedJalur} className="w-full border-2 border-[#1A1A1A] p-3 rounded-xl text-[10px] font-black uppercase">
                           <option value="">-- DURASI --</option>
                           {currentDestinationDetails?.paths?.find((p: any) => p.name === selectedJalur)?.durations?.map((d: any) => <option key={d.label} value={d.label}>{d.label}</option>)}
                        </select>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Tanggal</label>
                        <input required type={currentType === 'private' ? 'date' : 'text'} readOnly={currentType === 'open'} className="w-full border-2 border-[#1A1A1A] p-3 rounded-xl text-[10px] font-black" value={selectedJadwal} onChange={e => setSelectedJadwal(e.target.value)} />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Peserta</label>
                        <div className="flex items-center gap-2 bg-white border-2 border-[#1A1A1A] rounded-xl px-2 h-[42px]">
                           <button type="button" onClick={() => setPesertaCount(Math.max(1, (Number(pesertaCount) || 1) - 1))} className="w-6 h-6 flex items-center justify-center bg-[#1A1A1A] text-white rounded-lg font-black">-</button>
                           <input type="number" value={pesertaCount} onChange={e => setPesertaCount(e.target.value)} className="w-full text-center font-black text-xs outline-none" min={1} />
                           <button type="button" onClick={() => setPesertaCount((Number(pesertaCount) || 0) + 1)} className="w-6 h-6 flex items-center justify-center bg-[#1A1A1A] text-white rounded-lg font-black">+</button>
                        </div>
                     </div>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Opsi Layanan Tambahan</label>
                      <div className="relative">
                         <button 
                           type="button" 
                           onClick={() => {
                             const el = document.getElementById('addon-dropdown-ref');
                             if (el) el.classList.toggle('hidden');
                           }}
                           className="w-full border-2 border-[#1A1A1A] p-4 rounded-2xl text-[10px] font-black text-left flex justify-between items-center"
                         >
                            <span className="truncate">{selectedOpsional.length === 0 ? 'Pilih Tambahan...' : `${selectedOpsional.length} Opsi Terpilih`}</span>
                            <ChevronDown size={14} />
                         </button>
                         <div id="addon-dropdown-ref" className="hidden absolute z-30 left-0 right-0 mt-2 bg-white border-2 border-[#1A1A1A] rounded-2xl p-4 max-h-60 overflow-y-auto shadow-2xl">
                            {config?.facilities?.opsi?.map((opt: any, i: number) => {
                               const isSelected = selectedOpsional.includes(opt.name);
                               return (
                                 <div key={i} className="mb-4 last:mb-0">
                                   <label className="flex items-center gap-3 cursor-pointer group">
                                      <input type="checkbox" checked={isSelected} onChange={() => handleToggleOption(opt.name)} className="w-4 h-4 accent-[#FF6B00]" />
                                      <div className="flex flex-col">
                                         <span className="text-[10px] font-black uppercase group-hover:text-[#FF6B00]">{opt.name}</span>
                                         <span className="text-[8px] font-bold text-gray-400">{opt.priceInfo}</span>
                                      </div>
                                   </label>
                                   {isSelected && opt.subItems?.length > 0 && (
                                     <div className="ml-6 mt-3 pl-4 border-l-2 border-gray-100 space-y-2">
                                        {opt.subItems.map((sub: any, sIdx: number) => {
                                           const qty = subSelected[`${opt.name}|${sub.name}`] || 0;
                                           return (
                                              <div key={sIdx} className="flex items-center justify-between">
                                                <span className="text-[9px] font-bold uppercase text-gray-500">{sub.name}</span>
                                                <div className="flex items-center gap-2">
                                                   <button type="button" onClick={() => handleUpdateSubItem(opt.name, sub.name, -1)} className="w-5 h-5 bg-gray-100 rounded text-xs">-</button>
                                                   <span className="text-[10px] font-black w-4 text-center">{qty}</span>
                                                   <button type="button" onClick={() => handleUpdateSubItem(opt.name, sub.name, 1)} className="w-5 h-5 bg-gray-100 rounded text-xs">+</button>
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

                   <div className="space-y-4 pt-4 border-t border-gray-100">
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Punya Kode Promo?</label>
                         <input className="w-full border-2 border-dashed border-[#1A1A1A] p-4 rounded-2xl text-[10px] font-black uppercase placeholder:italic" value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="MASUKKAN KODE DISINI" />
                      </div>
                      {isPromoValid && (
                        <div className="text-right">
                           <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[9px] font-black uppercase animate-pulse">Diskon {activePromo.discount}% Terpasang!</span>
                        </div>
                      )}
                   </div>
                </div>
             </div>

             <div className="bg-[#1A1A1A] p-6 rounded-2xl text-white shadow-[10px_10px_0px_#f5f5f5]">
                <div className="flex justify-between items-end">
                   <div>
                      <span className="text-[9px] font-black text-white/40 uppercase">Estimasi Total</span>
                      <h4 className="text-3xl font-black">Rp {netPrice.toLocaleString('id-ID')}</h4>
                   </div>
                   <button type="submit" className="bg-[#FF6B00] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">Lanjut</button>
                </div>
             </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export const BookingHistoryModal = ({ 
  isOpen, 
  onClose, 
  showToast,
  playBack,
  playPop,
  playClick
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  showToast: (m: string, t?: any) => void,
  playBack?: () => void,
  playPop?: () => void,
  playClick?: () => void
}) => {
  const [user] = useAuthState(auth);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'proses' | 'lunas'>('proses');

  useEffect(() => {
    if (!isOpen || !user) return;
    setLoading(true);
    const q = query(collection(db, 'bookings'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sorted = data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setBookings(sorted);
      setLoading(false);
    }, (error) => {
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isOpen, user]);

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'proses') {
      return b.status === 'pending' || b.status === 'processing' || b.status === 'dp_partial';
    } else {
      return b.status === 'lunas' || b.status === 'selesai' || b.status === 'batal';
    }
  });

  const generateInvoice = (booking: any) => {
    const docInvoice = new jsPDF();
    const primary = [26, 26, 26];
    docInvoice.setFillColor(250, 250, 250);
    docInvoice.rect(0, 0, 210, 297, 'F');
    docInvoice.setFillColor(primary[0], primary[1], primary[2]);
    docInvoice.rect(0, 0, 210, 40, 'F');
    docInvoice.setTextColor(255, 255, 255);
    docInvoice.setFontSize(20);
    docInvoice.text('NGOPI DI KETINGGIAN', 20, 25);
    docInvoice.save(`Invoice_${booking.destinasi}.pdf`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 text-left text-[#1A1A1A]">
      {/* UI Fix: Removed restrictive overflow and adjusted inner layout for overlap issues */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[2.5rem] border-4 border-[#1A1A1A] relative shadow-2xl overflow-hidden">
        <div className="p-6 md:p-8 flex justify-between items-center bg-white border-b-2 border-gray-100">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FF6B00]/10 rounded-xl text-[#FF6B00]"><Clock size={24} /></div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Status Pesanan</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Daftar riwayat perjalananmu</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:text-[#FF6B00] transition-colors"><X size={24} /></button>
        </div>

        <div className="bg-gray-50 border-b border-gray-100 px-6 py-2 flex gap-6">
           <button onClick={() => setActiveTab('proses')} className={`px-2 py-3 text-[10px] font-black uppercase border-b-4 transition-all ${activeTab === 'proses' ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-gray-300'}`}>Berjalan</button>
           <button onClick={() => setActiveTab('lunas')} className={`px-2 py-3 text-[10px] font-black uppercase border-b-4 transition-all ${activeTab === 'lunas' ? 'border-[#48BB78] text-[#48BB78]' : 'border-transparent text-gray-300'}`}>Selesai / Batal</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {loading ? (
             <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
          ) : filteredBookings.length === 0 ? (
             <div className="py-20 text-center text-gray-300 uppercase font-black text-xs">Belum ada riwayat trip.</div>
          ) : (
            filteredBookings.map((b: any) => (
              <div key={b.id} className="bg-white rounded-[2rem] border-4 border-[#1A1A1A] p-6 relative shadow-[6px_6px_0px_#f5f5f5] mb-4">
                 <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                       <div className="flex flex-col gap-1">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase w-fit border-2 ${
                             b.status === 'lunas' || b.status === 'selesai' ? 'bg-green-50 border-green-200 text-green-600' : 
                             b.status === 'batal' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-orange-50 border-orange-200 text-orange-600'
                          }`}>
                            {b.status === 'pending' ? 'Menunggu Konf.' : b.status.toUpperCase()}
                          </span>
                          <h4 className="text-2xl font-black uppercase tracking-tighter mt-2">{b.destinasi}</h4>
                       </div>
                       
                       {/* Fixed Overlap: Adjusting buttons area to the right and ensuring space */}
                       <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
                          <span className="text-[10px] font-bold text-gray-400">🕒 {b.jadwal}</span>
                          <div className="flex items-center gap-2 mt-2">
                             {(b.status === 'lunas' || b.status === 'selesai') && (
                               <button onClick={() => generateInvoice(b)} className="p-2 bg-green-100 text-green-600 rounded-lg"><Download size={14} /></button>
                             )}
                             <button 
                               onClick={() => {
                                 if (window.confirm("Batalakan / Hapus riwayat?")) {
                                   if(b.status === 'pending') {
                                      const waUrl = `https://wa.me/6282127533268?text=${encodeURIComponent(`Halo Admin, saya ingin membatalkan pesanan: ${b.destinasi}`)}`;
                                      window.open(waUrl, '_blank');
                                   } else {
                                      deleteDoc(doc(db, 'bookings', b.id));
                                      if(playPop) playPop();
                                   }
                                 }
                               }} 
                               className="p-2 bg-red-100 text-red-600 rounded-lg"
                             >
                               <Trash2 size={14} />
                             </button>
                          </div>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                       <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Jalur</span>
                          <span className="text-[10px] font-black uppercase">{b.jalur}</span>
                       </div>
                       <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Peserta</span>
                          <span className="text-[10px] font-black uppercase">{b.peserta} Orang</span>
                       </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t-2 border-[#1A1A1A] flex justify-between items-center bg-[#1A1A1A] p-4 rounded-xl -mx-2 -mb-2">
                       <span className="text-[10px] font-black uppercase text-white/40">Total Pembayaran</span>
                       <span className="text-xl font-black text-[#FF6B00]">Rp {(b.totalPrice || 0).toLocaleString('id-ID')}</span>
                    </div>
                 </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};
