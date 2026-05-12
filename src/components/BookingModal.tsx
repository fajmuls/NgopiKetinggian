import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Coffee, Mountain, Users, MessageCircle, AlertCircle, ShoppingBag, Eye, Download, FileText, Globe, CheckCircle, Smartphone, LogOut, Clock, TrendingUp, CreditCard, CheckCircle2, Trash2, Tent, Info, Send, User, ChevronRight, BellRing, ChevronDown, ExternalLink, Map } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { generateRundownPdf, generateInvoice } from '../lib/pdf-utils';
import { customConfirm, customAlert } from '../GlobalDialog';
import { useSound } from '../hooks/useSound';
import { Button } from './Button';


export const BookingModal = ({ isOpen, onClose, destinationOptions, prefill, facilities, config, updateConfig, setIsHistoryOpen, userBookings }: { isOpen: boolean, onClose: () => void, destinationOptions?: any[], prefill?: { destinasi: string, jalur: string, durasi: string, type: 'private' | 'open', jadwal?: string }, facilities?: any, config: any, updateConfig: (c: any) => void, setIsHistoryOpen: (v: boolean) => void, userBookings: any[] }) => {
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
    
    // Support weekend date format if applicable
    if (startDateStr.includes('|')) {
      const [monthVal, dayStr] = startDateStr.split('|');
      if (!monthVal || !dayStr) return "";
      const [year, month] = monthVal.split('-').map(Number);
      const [startDay] = dayStr.split('-').map(Number);
      const start = new Date(year, month - 1, startDay);
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
    }

    const start = new Date(startDateStr);
    if (isNaN(start.getTime())) return startDateStr;
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

  const getBasePrice = () => {
    if (currentType === 'open') {
      const ot = config.openTrips?.find((t: any) => t.name === selectedDestinasi && t.jadwal === selectedJadwal);
      return (ot?.price || 0) * 1000;
    }
    
    if (!selectedDestinasi || !selectedJalur || !selectedDurasi) return 0;
    
    const dest = destinationOptions?.find(d => d.name === selectedDestinasi);
    const path = dest?.paths?.find((p: any) => p.name === selectedJalur);
    const duration = path?.durations?.find((d: any) => d.label === selectedDurasi);
    
    return (duration?.price || 0) * 1000;
  };

  const basePricePerPax = getBasePrice();

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
  
  const currentPesertaCount = Math.max(1, Number(pesertaCount) || 1);
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
      const [monthVal, dateVal] = (selectedJadwal || '').split('|');
      if (!formState.nama || !formState.wa || !selectedDestinasi || !monthVal || !dateVal || !pesertaCount) {
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
      const availableSlot = stats?.sisa ?? 0;
      if (Number(pesertaCount) > availableSlot) {
        customAlert(`Mohon kurangi jumlah peserta. Kuota tidak mencukupi, sisa slot tersedia: ${availableSlot} Pax.`, "Kuota Terbatas");
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
          userId: user?.uid || 'guest_id_' + Date.now(),
          nama: nama || 'Tanpa Nama', 
          email: email || user?.email || 'tanpa@email.com', 
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
        customAlert("Gagal menyimpan ke database, mohon hubungi admin", "Sedang ada gangguan sinkronisasi.");
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
                                {durInfo.rundownHtml ? (
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
