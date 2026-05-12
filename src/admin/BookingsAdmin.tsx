import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadFile } from '../lib/storage-utils';
import { X, Trash2, Plus, GripVertical, Users, Calendar, MapPin, Coffee, Mountain, Info, AlertCircle, FileText, Download, CheckCircle, Send, Globe, Map, Edit2, ChevronDown, Clock, TrendingUp, CreditCard, User, Clipboard, ChevronRight, ShoppingBag, MessageCircle, Eye } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { generateRundownPdf } from '../lib/pdf-utils';
import { customConfirm, customAlert } from '../GlobalDialog';
import { AppConfig, FacilityOption, DIFFICULTY_LEVELS as difficultyLevels, DURATION_LEVELS as durationLevels, OpenTrip, WEBSITE_VERSION } from '../useAppConfig';

export const InputWithPaste = ({ value, onChange, placeholder, className, ...props }: any) => {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange({ target: { value: text } } as any);
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  return (
    <div className="relative w-full flex items-center">
      <input 
        type="text" 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder} 
        className={`${className} pr-8`}
        {...props}
      />
      <button 
        type="button"
        onClick={handlePaste}
        className="absolute right-1 p-1.5 text-art-text/40 hover:text-art-orange transition-colors"
        title="Paste"
      >
        <Clipboard size={12} />
      </button>
    </div>
  );
};


export const ImageUploader = ({ value, onChange, placeholder = "URL Gambar" }: { value: string, onChange: (url: string) => void, placeholder?: string }) => {
  return (
    <div className="space-y-1 p-2 rounded-lg bg-art-bg/30 border border-art-text/10">
      <div className="flex items-center gap-2">
      	<InputWithPaste 
          className="border border-art-text/20 p-2 rounded text-[10px] w-full text-art-text bg-white outline-none focus:border-art-orange transition-colors" 
          value={value || ''} 
          onChange={(e: any) => onChange(e.target.value)} 
          placeholder={placeholder || "Masukkan Link URL Foto"} 
        />
      </div>
      {value ? (
        <div className="mt-2">
           <img src={value} className="w-full h-20 object-cover rounded border border-art-text/10" alt="Preview" onError={(e) => (e.currentTarget.style.display = 'none')} />
           <p className="text-[8px] text-art-green font-bold uppercase truncate mt-1">Preview Tersedia</p>
        </div>
      ) : (
        <p className="text-[8px] text-art-text/30 font-bold uppercase truncate">Belum ada gambar</p>
      )}
    </div>
  );
};



export const BookingsAdmin = ({ bookings, showToast, config, updateConfig, onNavigateToOpenTrip }: any) => {
  const [loading, setLoading] = React.useState(false);
  const [showDashboard, setShowDashboard] = React.useState(false);
  // Remove local useEffect and state for bookings

  const syncOpenTripQuota = async (currentBookings: any[], updatedBookingId?: string, newStatus?: string, deletedBookingId?: string) => {

    if (!config.openTrips) return;
    
    // Create a modified bookings array reflecting the hypothetical database state
    const simulatedBookings = currentBookings.map(b => 
      b.id === updatedBookingId ? { ...b, status: newStatus } : b
    ).filter(b => b.id !== deletedBookingId);

    let needsUpdate = false;
    const newOpenTrips = config.openTrips.map((ot: any) => {
      const consumed = simulatedBookings
        .filter(b => b.type === 'open' && b.destinasi === ot.name && b.jadwal === ot.jadwal && (b.status === 'processing' || b.status === 'lunas' || b.status === 'selesai' || b.status === 'dp_partial'))
        .reduce((acc, b) => acc + (Number(b.peserta) || 0), 0);
      
      if (ot.consumedKuota !== consumed) {
        needsUpdate = true;
        return { ...ot, consumedKuota: consumed };
      }
      return ot;
    });

    if (needsUpdate) {
      await updateConfig({ openTrips: newOpenTrips });
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'bookings', id), { 
        status: newStatus,
        requestCancel: false 
      });
      await syncOpenTripQuota(bookings, id, newStatus);
      showToast(`Status booking berhasil diupdate ke ${newStatus}!`);
      if (newStatus === 'lunas') {
        showToast("Kuitansi telah dikirim ke email pelanggan!", "info");
      }
    } catch (error) {
      console.error(error);
      showToast('Gagal update status', 'error');
    }
  };

  const handleOpsionalPriceUpdate = async (booking: any, itemIndex: number, newPricePerDay: number) => {
    try {
      const updatedItems = [...booking.opsionalItems];
      const item = updatedItems[itemIndex];
      const oldSubtotal = item.subtotal || 0;
      item.price = newPricePerDay;
      item.subtotal = newPricePerDay * (item.count || 1) * (item.days || 1);
      item.status = 'confirmed';
      
      const opsionalPriceDiff = item.subtotal - oldSubtotal;
      const newOpsionalPrice = (booking.opsionalPrice || 0) + opsionalPriceDiff;
      const newTotalPrice = (booking.totalPrice || 0) + opsionalPriceDiff;
      
      await updateDoc(doc(db, 'bookings', booking.id), { 
        opsionalItems: updatedItems,
        opsionalPrice: newOpsionalPrice,
        totalPrice: newTotalPrice
      });
      showToast(`Harga layanan berhasil diupdate!`);
    } catch (error) {
      console.error(error);
      showToast("Gagal update harga layanan", "error");
    }
  };

  const handleDelete = async (id: string) => {
    customConfirm("Beneran mau hapus data booking ini?", async () => {
      try {
        await deleteDoc(doc(db, 'bookings', id));
        await syncOpenTripQuota(bookings, undefined, undefined, id);
        showToast("Booking berhasil dihapus!");
      } catch (error) {
        showToast("Gagal menghapus booking", 'error');
      }
    });
  };

  const generateInvoice = async (booking: any) => {
    const doc = new jsPDF();
    const primaryColor = [26, 26, 26]; // Art-text
    const accentColor = [255, 107, 0]; // Art-orange
    const successColor = [0, 160, 0]; // Art-green
    
    // Background decor
    doc.setFillColor(250, 250, 250);
    doc.rect(0, 0, 210, 297, 'F');
    
    // Watermark
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        doc.setGState(new (doc.GState as any)({ opacity: 0.1 })); // Increased from 0.01 to 0.1 (10%)
        const aspectRatio = img.width / img.height;
        doc.addImage(img, 'PNG', 45, 100, 120, 120 / aspectRatio);
        doc.setGState(new (doc.GState as any)({ opacity: 1 }));
        resolve();
      };
      img.onerror = () => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(60);
        doc.setTextColor(235, 235, 235);
        doc.text("NGOPI DI", 105, 140, { angle: 45, align: 'center' });
        doc.text("KETINGGIAN", 105, 170, { angle: 45, align: 'center' });
        resolve();
      };
      img.src = 'https://files.catbox.moe/lubzno.png';
    });
    
    // Header bar
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 50, 'F');
    
    // Logo text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('NGOPI DI KETINGGIAN', 20, 25);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('ADVENTURE & BREW • EST. 2026', 20, 32);
    
    // Invoice Info on Header
    doc.setFontSize(8);
    doc.text('KUITANSI PEMBAYARAN', 140, 20);
    doc.setFontSize(12);
    doc.text(`#${(booking.id || '').substring(0, 8).toUpperCase()}`, 140, 30);
    doc.setFontSize(8);
    
    const bookingDate = booking.createdAt ? new Date(booking.createdAt.seconds * 1000) : new Date();
    const displayDate = isNaN(bookingDate.getTime()) ? new Date() : bookingDate;
    
    const paymentDateRaw = booking.updatedAt || booking.createdAt;
    const paymentDate = paymentDateRaw ? new Date(paymentDateRaw.seconds * 1000) : displayDate;
    const paymentDateStr = isNaN(paymentDate.getTime()) ? '-' : paymentDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    doc.text(`TGL PESAN: ${displayDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })}`, 140, 38);
    doc.text(`TGL BAYAR: ${paymentDateStr}`, 140, 44);

    // Section colors and borders
    const drawSectionHeader = (title: string, y: number) => {
      doc.setFillColor(240, 240, 240);
      doc.rect(20, y, 170, 7, 'F');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(title, 25, y + 5);
    };

    // Client & Trip Info
    drawSectionHeader('INFORMASI PELANGGAN', 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`NAMA LENGKAP: ${booking.nama.toUpperCase()}`, 25, 75);
    doc.text(`WHATSAPP: ${booking.wa}`, 25, 80);
    doc.text(`EMAIL: ${booking.email}`, 25, 85);
    
    drawSectionHeader('DETAIL PERJALANAN', 95);
    const pathLabel = (booking.jalur || "").toUpperCase();
    const finalPath = pathLabel.startsWith("VIA") ? pathLabel : `VIA ${pathLabel}`;
    doc.text(`DESTINASI: ${booking.destinasi.toUpperCase()} (${finalPath})`, 25, 110);
    doc.text(`JADWAL: ${booking.jadwal} (${booking.durasi})`, 25, 115);
    doc.text(`JUMLAH PESERTA: ${booking.peserta} ORANG`, 25, 120);
    doc.text(`TIPE TRIP: ${booking.type === 'open' ? 'OPEN TRIP' : booking.type === 'open_request' ? 'REQ. OPEN TRIP' : 'PRIVATE TRIP'}`, 25, 125);

    // Items and Pricing
    drawSectionHeader('RINCIAN BIAYA', 140);
    doc.setFont('helvetica', 'bold');
    doc.text('KETERANGAN', 25, 155);
    doc.text('QTY / PRICE', 120, 155);
    doc.text('SUBTOTAL', 160, 155);
    doc.setDrawColor(230, 230, 230);
    doc.line(20, 158, 190, 158);
    
    doc.setFont('helvetica', 'normal');
    let currentY = 165;
    
    // Base Trip
    const baseTotal = (booking.totalPrice || 0) + (booking.discountAmount || 0) - (booking.opsionalPrice || 0);
    const pricePerPax = baseTotal / (Number(booking.peserta) || 1);
    doc.text(`PAKET TRIP ${booking.destinasi.toUpperCase()}`, 25, currentY);
    doc.text(`${booking.peserta} Pax @ Rp ${pricePerPax.toLocaleString('id-ID')}`, 110, currentY);
    doc.text(`Rp ${baseTotal.toLocaleString('id-ID')}`, 160, currentY);
    currentY += 8;

    if (booking.opsionalItems && booking.opsionalItems.length > 0) {
      booking.opsionalItems.forEach((item: any) => {
        doc.setFontSize(7);
        doc.setTextColor(80, 80, 80);
        const itemDesc = `(+) ${item.name}`;
        const itemQty = `${item.count || 1}x • ${item.days || 1}H @ Rp ${item.price.toLocaleString('id-ID')}`;
        
        doc.text(itemDesc, 25, currentY);
        doc.text(itemQty, 110, currentY);
        doc.text(item.price === 0 ? '-' : `Rp ${item.subtotal.toLocaleString('id-ID')}`, 160, currentY);
        currentY += 6;
      });
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(8);
    } else if (booking.opsionalText) {
      doc.setFontSize(9);
      const splitText = doc.splitTextToSize(`(+) LAYANAN TAMBAHAN: ${booking.opsionalText}`, 130);
      doc.text(splitText, 25, currentY);
      doc.text(`Rp ${(booking.opsionalPrice || 0).toLocaleString('id-ID')}`, 160, currentY);
      currentY += (splitText.length * 6) + 2;
    }

    // Promo Code
    if (booking.promoCode) {
      currentY += 4;
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`KODE PROMO: ${booking.promoCode.toUpperCase()}`, 25, currentY);
      doc.text(`- Rp ${booking.discountAmount?.toLocaleString('id-ID')}`, 160, currentY);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      currentY += 8;
    }

    // Total
    doc.setLineWidth(0.5);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.line(120, currentY, 190, currentY);
    currentY += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL AKHIR:', 120, currentY);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text(`Rp ${booking.totalPrice?.toLocaleString('id-ID')}`, 160, currentY);

    // Status Badge
    currentY += 20;
    const isLunas = booking.status === 'lunas';
    const isDP = booking.status === 'dp_partial';
    
    if (isLunas) {
      doc.setFillColor(successColor[0], successColor[1], successColor[2]);
    } else if (isDP) {
      doc.setFillColor(255, 193, 7); // Yellow/Amber for DP
    } else {
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    }
    
    doc.rect(20, currentY, 40, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    const statusLabel = booking.status === 'lunas' ? 'LUNAS' : 
                        booking.status === 'dp_partial' ? 'PARSIAL DP' : 
                        booking.status.toUpperCase();
    doc.text(statusLabel, 40, currentY + 6.5, { align: 'center' });

    // Note Section with Wrap (Fix Overflow)
    currentY += 20;
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('CATATAN KHUSUS:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    const splitDesc = doc.splitTextToSize(booking.deskripsi || "Tidak ada catatan khusus.", 170);
    doc.text(splitDesc, 20, currentY + 5);

    // Payment Info
    currentY += (splitDesc.length * 5) + 10;
    doc.setFont('helvetica', 'bold');
    doc.text('METODE PEMBAYARAN:', 120, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text('Transfer Bank BCA', 120, currentY + 5);
    doc.text('A/N: Muhammad Rachman', 120, currentY + 10);
    doc.text('No. Rek: 0987-654-321', 120, currentY + 15);
    
    // Footer
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 270, 190, 270);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Dokumen ini sah dikeluarkan secara digital oleh Ngopi di Ketinggian.', 105, 278, { align: 'center' });
    doc.text('https://ngopidiketinggian.id', 105, 283, { align: 'center' });
    
    doc.save(`Kuitansi_${booking.nama.replace(/\s/g, '_')}_${(booking.id || '').substring(0,5)}.pdf`);
    showToast("Kuitansi berhasil diunduh!");
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-art-orange"></div></div>;

  const pendingBookings = bookings.filter((b: any) => b.status === 'pending' && b.type !== 'open_request');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* NOTIFICATION PANEL - BOOKING LIST ONLY */}
        <div className="bg-gradient-to-br from-orange-50 to-white border-2 border-art-text rounded-3xl p-6 shadow-[8px_8px_0px_0px_#1a1a1a]">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-art-orange text-white rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#1a1a1a]">
                   <ShoppingBag size={22} />
                </div>
                <div>
                   <h3 className="text-lg font-black uppercase text-art-text tracking-tight leading-tight">Booking Notification</h3>
                   <p className="text-[10px] font-bold text-art-text/40 uppercase">Pesanan masuk (Belum diproses)</p>
                </div>
             </div>
             <span className="bg-art-orange text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm">{pendingBookings.length} Pesanan</span>
          </div>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
            {pendingBookings.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-art-text/10 rounded-2xl bg-gray-50/50">
                 <p className="text-[10px] font-bold text-art-text/20 uppercase tracking-widest">Tidak ada booking baru</p>
              </div>
            ) : (
              pendingBookings.map((req: any) => (
                <div key={req.id} className="bg-white border-art-text border-2 p-4 rounded-2xl shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-black uppercase text-[12px] text-art-text leading-tight">{req.nama}</h4>
                      <p className="text-[9px] font-bold text-art-text/40 font-mono tracking-tighter">{req.wa}</p>
                    </div>
                    <div className="text-right">
                       <span className="text-[9px] font-black uppercase bg-art-text text-white px-2 py-0.5 rounded-md mb-1 block shadow-sm">{req.destinasi}</span>
                       <span className="text-[8px] font-bold text-art-text/40 font-mono">{req.jadwal}</span>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                         await updateDoc(doc(db, 'bookings', req.id), { status: 'processing' });
                         showToast("Berhasil diproses!", "success");
                      } catch (e) {
                         showToast("Gagal update", "error");
                      }
                    }}
                    className="w-full py-2 bg-art-orange text-white border-2 border-art-text rounded-xl text-[10px] font-black uppercase hover:bg-art-text transition-all shadow-[2px_2px_0px_0px_#1a1a1a] active:shadow-none active:translate-x-0.5 active:translate-y-0.5"
                  >Konfirmasi & Proses</button>
                </div>
              ))
            )}
          </div>
        </div>


        {/* QUICK STATS / RESET */}
        <div className="bg-art-text text-white rounded-3xl p-6 flex flex-col justify-between">
           <div>
              <h3 className="text-xl font-black uppercase tracking-tighter mb-1">Database Booking</h3>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-6">Kelola seluruh data reservasi</p>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <p className="text-[8px] font-black text-white/30 uppercase mb-1">Total Booking</p>
                    <p className="text-2xl font-black">{bookings.length}</p>
                 </div>
                 <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <p className="text-[8px] font-black text-white/30 uppercase mb-1">Selesai</p>
                    <p className="text-2xl font-black text-art-green">{bookings.filter(b => b.status === 'selesai' || b.status === 'lunas').length}</p>
                 </div>
              </div>
           </div>
           <button 
              onClick={async () => {
                customConfirm("⚠️ PERINGATAN: Hapus SELURUH database booking? Tindakan ini tidak bisa dibatalkan.", async () => {
                  try {
                    const bookingsToDelete = bookings.map((b: any) => b.id);
                    for (const id of bookingsToDelete) {
                      await deleteDoc(doc(db, 'bookings', id));
                    }
                    showToast("Database berhasil direset!", "success");
                  } catch (e) {
                    showToast("Gagal reset database", "error");
                  }
                });
              }}
              className="mt-6 w-full py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.3)] active:translate-x-1 active:translate-y-1 active:shadow-none"
           >
             Reset Seluruh Database
           </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
           <Clipboard size={18} className="text-art-text" />
           <h3 className="text-xl font-black uppercase text-art-text tracking-tighter">Daftar Reservasi & Payment Slips</h3>
        </div>
        {bookings.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-art-text/10 rounded-2xl">
            <Info className="mx-auto mb-2 text-art-text/20" size={32} />
            <p className="font-bold text-art-text/40 uppercase text-xs">Belum ada booking masuk</p>
          </div>
        ) : (
          bookings.map((booking: any) => (
            <div key={booking.id} className={`bg-white rounded-2xl border-2 transition-all p-5 flex flex-col gap-4 ${booking.status === 'confirmed' ? 'border-art-green' : booking.status === 'cancelled' ? 'border-red-400' : booking.requestCancel ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-art-text'}`}>
              {booking.requestCancel && (
                <div className="bg-red-500 text-white text-[10px] font-black uppercase py-2 px-4 -mt-5 -mx-5 rounded-t-xl mb-2 flex items-center justify-between">
                  <span>⚠️ USER MEMINTA PEMBATALAN PESANAN</span>
                  <button 
                    onClick={async () => {
                      try {
                        await updateDoc(doc(db, 'bookings', booking.id), { requestCancel: false });
                        showToast("Permintaan pembatalan ditolak/dihapus", "info");
                      } catch (e) {
                         showToast("Gagal update", "error");
                      }
                    }}
                    className="bg-white/20 hover:bg-white/40 px-2 py-0.5 rounded text-[8px]"
                  >
                    Hapus Notif
                  </button>
                </div>
              )}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-art-text/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border-2 ${booking.status === 'confirmed' ? 'bg-art-green/10 border-art-green text-art-green' : booking.status === 'cancelled' ? 'bg-red-50 border-red-400 text-red-400' : 'bg-art-bg border-art-text text-art-text'}`}>
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="font-black uppercase tracking-tight text-lg leading-none mb-1">{booking.nama}</h4>
                    <div className="flex flex-col gap-1 mt-2">
                       <span className="text-art-orange text-[10px] lowercase font-medium bg-art-orange/5 w-fit px-2 py-0.5 rounded-md border border-art-orange/10 flex items-center gap-1.5">
                          <User size={10} /> {booking.email || 'no-email'}
                       </span>
                       <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase mt-1">
                          <span className="text-art-text/40">{booking.type === 'open' ? '🟢 Open Trip' : booking.type === 'open_request' ? '🟡 Req. Open' : '🔵 Private Trip'}</span>
                          <span className="text-art-text/20">•</span>
                          <span className="text-art-text/40">{booking.wa}</span>
                          <span className="text-art-text/10">|</span>
                          <span className="text-art-text/40 italic">
                            {booking.createdAt ? new Date(booking.createdAt.seconds * 1000).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '...'}
                          </span>
                       </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                   <div className="flex items-center gap-2">
                     <div className="relative">
                       <select 
                         value={booking.status || 'pending'} 
                         onChange={(e) => handleStatusUpdate(booking.id, e.target.value)}
                         className={`pl-3 pr-8 py-2 rounded-xl text-[10px] font-black uppercase appearance-none cursor-pointer transition-all border-2 ${
                           booking.status === 'lunas' ? 'bg-art-green/10 border-art-green/20 text-art-green' : 
                               booking.status === 'selesai' ? 'bg-gray-100 border-gray-200 text-gray-500' :
                               booking.status === 'dp_partial' ? 'bg-yellow-100 border-yellow-200 text-yellow-700' :
                               booking.status === 'processing' ? 'bg-blue-100 border-blue-200 text-blue-700' :
                               'bg-white border-art-text/20 text-art-text/60'
                         }`}
                       >
                         <option value="pending">Pending</option>
                         <option value="processing">Proses</option>
                         <option value="dp_partial">DP Parsial</option>
                         <option value="lunas">Lunas</option>
                         <option value="selesai">Selesai</option>
                         <option value="batal">Batal</option>
                       </select>
                       <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                     </div>

                     <button 
                       onClick={() => window.open(`https://wa.me/${booking.wa.startsWith('0') ? '62' + booking.wa.substring(1) : booking.wa}?text=${encodeURIComponent(`Halo ${booking.nama}, ini dari Ngopi di Ketinggian. Kami ingin mengonfirmasi booking Anda untuk trip ${booking.destinasi}.`)}`, '_blank')}
                       className="px-4 py-2 bg-[#25D366] text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-[#20ba59] transition-all shadow-sm active:scale-95"
                     >
                       <Send size={14} /> Contact WA
                     </button>
                   </div>

                   <div className="flex items-center gap-2 border-l border-art-text/10 pl-2">
                     <button 
                      onClick={() => generateInvoice(booking)}
                      className="p-2 border-2 border-art-text/10 text-art-text/60 rounded-xl hover:bg-art-bg transition-colors"
                      title="Download Invoice"
                    >
                      <Download size={16} />
                    </button>
                    <button onClick={() => handleDelete(booking.id)} className="p-2 border-2 border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors">
                      <Trash2 size={16} />
                    </button>
                   </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
                <div className="space-y-4">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-art-text/40 tracking-[0.2em] px-4 font-mono">Billing Details</p>

                    <div className="bg-white rounded-2xl border-2 border-art-text p-4 shadow-sm relative overflow-hidden group/box">
                       <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none group-hover/box:rotate-12 transition-transform">
                          <Mountain size={32} />
                       </div>
                       <div className="flex justify-between items-start mb-2">
                          <span className="text-[9px] font-black text-art-text/40 uppercase tracking-[0.2em]">TRIP UTAMA</span>
                          <span className="text-[8px] bg-art-text text-white px-2 py-0.5 rounded-md font-black uppercase tracking-widest">{booking.type === 'open' ? 'Open' : booking.type === 'open_request' ? 'Req. Open' : 'Private'}</span>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-dashed border-art-text/10">
                          <div className="flex items-center gap-2">
                             <div className="p-1.5 bg-art-orange/5 rounded-lg text-art-orange"><MapPin size={12} /></div>
                             <div>
                                <p className="text-[7px] font-black uppercase text-art-text/30">Destinasi</p>
                                <p className="text-[9px] font-black uppercase">{booking.destinasi} ({booking.jalur})</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="p-1.5 bg-art-green/5 rounded-lg text-art-green"><Calendar size={12} /></div>
                             <div>
                                <p className="text-[7px] font-black uppercase text-art-text/30">Jadwal</p>
                                <p className="text-[9px] font-black uppercase">{booking.jadwal} ({booking.durasi})</p>
                             </div>
                          </div>
                       </div>

                       <div className="flex justify-between items-end">
                          <div>
                             <h5 className="text-sm font-black text-art-text uppercase leading-none mb-1">{booking.destinasi}</h5>
                             <p className="text-[9px] font-bold text-art-text/40">{booking.peserta} Pax • Rp {((((booking.totalPrice || 0) + (booking.discountAmount || 0) - (booking.opsionalPrice || 0))) / (Number(booking.peserta) || 1)).toLocaleString('id-ID')} / Pax</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[8px] font-bold text-art-text/40 uppercase">Subtotal Trip</p>
                             <p className="font-black text-art-text text-sm">Rp {((booking.totalPrice || 0) + (booking.discountAmount || 0) - (booking.opsionalPrice || 0)).toLocaleString('id-ID')}</p>
                          </div>
                       </div>
                    </div>

                    {/* BOX 2: ADDITIONAL SERVICES */}
                    {booking.opsionalItems && booking.opsionalItems.length > 0 && (
                      <div className="bg-white rounded-2xl border-2 border-art-text p-4 shadow-sm relative overflow-hidden group/box">
                         <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none group-hover/box:rotate-12 transition-transform">
                            <Coffee size={32} />
                         </div>
                         <div className="flex justify-between items-start mb-3">
                            <span className="text-[9px] font-black text-art-orange uppercase tracking-[0.2em]">LAYANAN TAMBAHAN</span>
                         </div>
                         <div className="space-y-3">
                            {booking.opsionalItems.map((item: any, idx: number) => {
                               const canEdit = !item.isRental;
                               return (
                                 <div key={idx} className="flex justify-between items-start text-[10px] border-b border-dashed border-art-text/5 pb-2 last:border-0 last:pb-0">
                                   <div className="flex flex-col">
                                     <span className="font-black text-art-text uppercase tracking-tight flex items-center gap-1.5">
                                       • {item.name} {item.isRental ? `(${item.count}x)` : ''}
                                       {canEdit && (
                                         <button onClick={() => {
                                             const newPriceStr = window.prompt("Masukkan harga baru:", (item.price || 0).toString());
                                             if (newPriceStr !== null) {
                                               const newPrice = parseInt(newPriceStr.replace(/[^0-9]/g, ''));
                                               if (!isNaN(newPrice)) {
                                                 handleOpsionalPriceUpdate(booking, idx, newPrice);
                                               }
                                             }
                                         }} className="text-art-orange hover:bg-art-orange/10 p-1 rounded-full transition-colors"><Edit2 size={10}/></button>
                                       )}
                                     </span>
                                     <span className="text-[8px] font-bold text-art-text/40 italic ml-3">
                                       {item.isRental ? `${item.days} Hari • Rp ${(item.price || 0).toLocaleString('id-ID')}` : item.priceInfo || item.name}
                                     </span>
                                   </div>
                                   <div className="text-right">
                                     <span className={`font-black text-[10px] ${item.status === 'pending_price' ? 'text-art-orange italic' : 'text-art-text'}`}>
                                       {item.status === 'pending_price' ? "Input Admin" : `Rp ${(item.subtotal || 0).toLocaleString('id-ID')}`}
                                     </span>
                                   </div>
                                 </div>
                               );
                            })}
                         </div>
                         <div className="mt-4 pt-3 border-t-2 border-art-text/5 flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-art-text/30">Subtotal Layanan</span>
                            <span className="text-sm font-black text-art-orange">Rp {(booking.opsionalPrice || 0).toLocaleString('id-ID')}</span>
                         </div>
                      </div>
                    )}

                    {/* BOX PROMO */}
                    {booking.promoCode && (
                      <div className="bg-art-green/10 rounded-2xl border-2 border-art-green p-4 relative overflow-hidden group/box">
                         <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                               <span className="text-lg">🎁</span>
                               <div>
                                  <span className="text-[9px] font-black text-art-green uppercase tracking-[0.2em] block">PROMO AKTIF</span>
                                  <h5 className="text-sm font-black text-art-text uppercase tracking-tight">{booking.promoCode}</h5>
                               </div>
                            </div>
                            <span className="text-sm font-black text-art-green">- Rp {booking.discountAmount?.toLocaleString('id-ID')}</span>
                         </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col justify-between border-l border-art-text/5 pl-6">
                   <div className="space-y-4">
                      {/* BOX: RUNDOWN MANAGEMENT (Private Only) */}
                      {booking.type === 'private' && (
                        <div className="bg-blue-50/50 rounded-2xl border-2 border-blue-200 p-4 shadow-sm relative group/box">
                           <div className="flex justify-between items-center mb-3">
                              <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-1">
                                 <Clipboard size={10} /> Itinerary & Rundown (Private)
                              </span>
                              <button 
                                onClick={async () => {
                                  const dest = (config.destinationsData || []).find((d: any) => d.name === booking.destinasi);
                                  const path = dest?.paths?.find((p: any) => p.name === booking.jalur);
                                  const dur = path?.durations?.find((d: any) => d.label === booking.durasi);
                                  if (dur) {
                                    if (dur.rundownHtml || dur.rundownPdf) {
                                       await updateDoc(doc(db, 'bookings', booking.id), { 
                                         rundownText: dur.rundownHtml || "",
                                         rundownPdf: dur.rundownPdf || ""
                                       });
                                       showToast("Template dimuat!");
                                    } else {
                                       showToast("Template kosong");
                                    }
                                  } else {
                                    showToast("Data destinasi tidak ditemukan");
                                  }
                                }}
                                className="text-[8px] font-black uppercase text-blue-600 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded-md transition-colors border border-blue-200 flex items-center gap-1"
                              >
                                <Plus size={10} /> Pakai Template
                              </button>
                           </div>
                           <div className="space-y-3">
                              <div className="space-y-1">
                                 <label className="text-[8px] font-black uppercase text-art-text/40">Link PDF Rundown</label>
                                 <ImageUploader 
                                   value={booking.rundownPdf || ""} 
                                   onChange={async (url) => {
                                      await updateDoc(doc(db, 'bookings', booking.id), { rundownPdf: url });
                                      showToast("PDF Rundown diupdate!");
                                   }} 
                                 />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[8px] font-black uppercase text-art-text/40">Teks Rundown / Itinerary</label>
                                 <textarea 
                                    className="w-full border-2 border-art-text/10 p-2 rounded-xl text-[10px] font-medium outline-none focus:border-art-orange transition-all resize-none bg-white"
                                    rows={4}
                                    defaultValue={booking.rundownText || ""}
                                    onBlur={async (e) => {
                                      if (e.target.value !== booking.rundownText) {
                                         await updateDoc(doc(db, 'bookings', booking.id), { rundownText: e.target.value });
                                         showToast("Teks Itinerary diupdate!");
                                      }
                                    }}
                                    placeholder="Input teks itinerary di sini..."
                                 />
                              </div>
                           </div>
                        </div>
                      )}

                      <div>
                        <p className="text-[10px] font-black uppercase text-art-text/30 tracking-widest mb-2 font-mono">Status & Note</p>
                        <div className="flex items-center gap-2 mb-3">
                           <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center gap-1.5 ${
                              booking.status === 'lunas' ? 'bg-art-green text-white' : 
                              booking.status === 'selesai' ? 'bg-gray-800 text-white' :
                              booking.status === 'dp_partial' ? 'bg-yellow-500 text-white' :
                              booking.status === 'processing' ? 'bg-blue-600 text-white' :
                              'bg-art-bg text-art-text/60 border border-art-text/10'
                           }`}>
                              {booking.status === 'pending' && <Clock size={10} />}
                              {booking.status === 'processing' && <TrendingUp size={10} />}
                              {booking.status === 'dp_partial' && <CreditCard size={10} />}
                              {booking.status === 'lunas' && <CheckCircle size={10} />}
                              {booking.status === 'selesai' && <MapPin size={10} />}
                              {booking.status === 'batal' && <X size={10} />}
                              {
                               booking.status === 'pending' ? 'Pending' : 
                               booking.status === 'processing' ? 'Diproses' : 
                               booking.status === 'dp_partial' ? 'DP Parsial' :
                               booking.status === 'lunas' ? 'Lunas' : 
                               booking.status === 'selesai' ? 'Selesai' :
                               'Batal'
                            }</div>
                        </div>
                        <p className="text-[11px] font-medium italic text-art-text/50 leading-relaxed break-words bg-white border-2 border-dashed border-art-text/5 p-3 rounded-2xl">
                          "{booking.deskripsi || 'Tidak ada catatan dari pelanggan.'}"
                        </p>
                      </div>

                      <div className="bg-art-orange/5 p-4 rounded-2xl border-2 border-art-orange/10">
                         <div className="flex justify-between items-end">
                            <div>
                               <p className="text-[10px] font-black uppercase text-art-orange/60 tracking-widest mb-1">Total Estimasi Akhir:</p>
                               <p className="text-3xl font-black text-art-text tracking-tighter">Rp {booking.totalPrice?.toLocaleString('id-ID')}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[9px] font-bold text-art-text/30 uppercase mb-0.5">Ref ID</p>
                               <p className="text-[10px] font-black text-art-text/20 uppercase font-mono tracking-tighter">{booking.id?.substring(0,8) || '...'}</p>
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
    </div>
  );
};

// Sub-components for Admin

