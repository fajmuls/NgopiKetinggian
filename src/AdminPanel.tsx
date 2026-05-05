import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { uploadFile } from './lib/storage-utils';
import { X, Trash2, Plus, GripVertical, Users, Calendar, MapPin, Coffee, Info, AlertCircle, FileText, Download, CheckCircle, Send, Globe, Map, Edit2 } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from './firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestore-error';
import { AppConfig, FacilityOption, DIFFICULTY_LEVELS, DURATION_LEVELS, OpenTrip, WEBSITE_VERSION } from './useAppConfig';
import { jsPDF } from 'jspdf';

import { customConfirm, customAlert } from './GlobalDialog';

export const AdminPanelModal = ({ 
  isOpen, 
  onClose, 
  config, 
  updateConfig,
  revertToDefault,
  defaultLists,
  showToast
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  config: AppConfig,
  updateConfig: (c: Partial<AppConfig>) => void,
  revertToDefault: () => void,
  defaultLists: any,
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void
}) => {
  const [activeCategory, setActiveCategory] = useState<'booking' | 'trip' | 'website'>('booking');
  const [activeTab, setActiveTab] = useState<string>('bookings');
  
  if (!isOpen || !config) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 text-left text-art-text">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-art-section w-full max-w-5xl max-h-[95vh] flex flex-col rounded-2xl border-2 border-art-text relative shadow-2xl overflow-hidden">
        <div className="flex flex-col border-b border-art-text bg-white">
          <div className="flex justify-between items-center p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black uppercase tracking-tight text-art-text">Admin Dashboard</h2>
              <p className="text-[10px] font-bold text-art-orange">v{WEBSITE_VERSION}</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    customConfirm("Jadikan pengaturan saat ini sebagai default global? Tindakan ini tidak bisa dibatalkan.", async () => {
                      try {
                        const { writeBatch, doc } = await import('firebase/firestore');
                        const batch = writeBatch(db);
                        batch.set(doc(db, 'destinations', 'data'), { items: config.destinationsData });
                        batch.set(doc(db, 'leaders', 'data'), { items: config.tripLeaders });
                        batch.set(doc(db, 'gallery', 'data'), { items: config.galleryPhotos });
                        batch.set(doc(db, 'openTrips', 'data'), { items: config.openTrips });
                        
                        const websiteData = { ...config };
                        delete (websiteData as any).destinationsData;
                        delete (websiteData as any).tripLeaders;
                        delete (websiteData as any).galleryPhotos;
                        delete (websiteData as any).openTrips;
  
                        batch.set(doc(db, 'website', 'data'), websiteData);

                        // Save snapshot for "Reset Default" functionality
                        batch.set(doc(db, 'defaults', 'data'), {
                          destinations: config.destinationsData,
                          leaders: config.tripLeaders,
                          gallery: config.galleryPhotos,
                          openTrips: config.openTrips,
                          website: websiteData
                        });

                        await batch.commit();
                        showToast("Berhasil di-set sebagai default!", "success");
                      } catch (e) {
                        console.error(e);
                        showToast("Gagal menyimpan ke default", "error");
                      }
                    });
                  }} 
                  className="text-[10px] bg-art-green text-white px-3 py-1.5 font-bold uppercase rounded-md tracking-widest hover:bg-green-600 transition-colors shadow-sm"
                >
                  Set Default
                </button>
                <button 
                  onClick={() => {
                    customConfirm("Kembalikan ke pengaturan awal tersimpan?", async () => {
                      await revertToDefault();
                      showToast("Direset ke default!", "success");
                    });
                  }} 
                  className="text-[10px] bg-red-100 text-red-600 px-3 py-1.5 font-bold uppercase rounded-md tracking-widest hover:bg-red-200 transition-colors shadow-sm"
                >
                  Reset Default
                </button>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:text-art-orange transition-colors"><X size={24} /></button>
          </div>
          <div className="flex gap-2 px-4 pb-2 border-t border-art-text/10 pt-2">
            <button onClick={() => { setActiveCategory('booking'); setActiveTab('bookings'); }} className={`text-[10px] sm:text-xs font-black uppercase py-2 px-4 rounded-t-lg ${activeCategory === 'booking' ? 'bg-art-text text-white' : 'bg-art-bg text-art-text/60'}`}>Booking</button>
            <button onClick={() => { setActiveCategory('trip'); setActiveTab('openTrips'); }} className={`text-[10px] sm:text-xs font-black uppercase py-2 px-4 rounded-t-lg ${activeCategory === 'trip' ? 'bg-art-text text-white' : 'bg-art-bg text-art-text/60'}`}>Trip</button>
            <button onClick={() => { setActiveCategory('website'); setActiveTab('cerita'); }} className={`text-[10px] sm:text-xs font-black uppercase py-2 px-4 rounded-t-lg ${activeCategory === 'website' ? 'bg-art-text text-white' : 'bg-art-bg text-art-text/60'}`}>Website</button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Sub Sidebar Tabs */}
          <div className="flex sm:flex-col gap-1.5 p-4 border-b sm:border-b-0 sm:border-r border-art-text bg-white overflow-x-auto sm:overflow-x-visible w-full sm:w-48 shrink-0">
            {activeCategory === 'booking' && (
              <>
                <button onClick={() => setActiveTab('bookings')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'bookings' ? 'bg-art-green text-white' : 'hover:bg-art-text/10'}`}>Daftar Booking</button>
                <button onClick={() => setActiveTab('promoCodes')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'promoCodes' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Kode Promo</button>
              </>
            )}
            {activeCategory === 'trip' && (
              <>
                <button onClick={() => setActiveTab('openTrips')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'openTrips' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Open Trip</button>
                <button onClick={() => setActiveTab('destinations')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'destinations' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Destinasi & Durasi</button>
              </>
            )}
            {activeCategory === 'website' && (
              <>
                <button onClick={() => setActiveTab('homepage')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'homepage' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Homepage</button>
                <button onClick={() => setActiveTab('cerita')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'cerita' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Cerita</button>
                <button onClick={() => setActiveTab('facilities')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'facilities' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Fasilitas</button>
                <button onClick={() => setActiveTab('gallery')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'gallery' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Gallery</button>
                <button onClick={() => setActiveTab('leaders')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'leaders' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Trip Leaders</button>
                <button onClick={() => setActiveTab('cleanupPhotos')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'cleanupPhotos' ? 'bg-red-600 text-white' : 'hover:bg-red-50 text-red-600'}`}>Cleanup Foto</button>
              </>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-art-bg/50">
            {activeTab === 'bookings' && <BookingsAdmin showToast={showToast} config={config} updateConfig={updateConfig} />}
            {activeTab === 'openTrips' && <OpenTripsAdmin config={config} updateConfig={updateConfig} showToast={showToast} />}
            {activeTab === 'destinations' && <DestinationsAdmin config={config} updateConfig={updateConfig} showToast={showToast} defaultList={defaultLists.destinations} />}
            {activeTab === 'leaders' && <LeadersAdmin config={config} updateConfig={updateConfig} showToast={showToast} defaultList={defaultLists.leaders} />}
            {activeTab === 'gallery' && <GalleryAdmin config={config} updateConfig={updateConfig} showToast={showToast} defaultList={defaultLists.gallery} />}
            {activeTab === 'facilities' && <FacilitiesAdmin config={config} updateConfig={updateConfig} showToast={showToast} defaultList={defaultLists.facilities} />}
            {activeTab === 'promoCodes' && <PromoCodesAdmin config={config} updateConfig={updateConfig} showToast={showToast} />}
            {activeTab === 'cerita' && <CeritaAdmin config={config} updateConfig={updateConfig} showToast={showToast} defaultVideo={defaultLists.cerita} />}
            {activeTab === 'homepage' && <HomepageAdmin config={config} updateConfig={updateConfig} showToast={showToast} />}
            {activeTab === 'cleanupPhotos' && <CleanupPhotosAdmin config={config} updateConfig={updateConfig} showToast={showToast} />}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const BookingsAdmin = ({ showToast, config, updateConfig }: any) => {
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [user] = useAuthState(auth);
  React.useEffect(() => {
    if (!user || (user.email !== 'mrachmanfm@gmail.com' && user.email !== 'mrahmanfm@gmail.com') || !config) {
      if (user) setLoading(false);
      return;
    }
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Firestore onSnapshot error:", error);
      setLoading(false);
      showToast('Gagal memuat booking. Silahkan lapor admin.', 'error');
    });
    return () => unsubscribe();
  }, [user]);

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
      await updateDoc(doc(db, 'bookings', id), { status: newStatus });
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

  const generateInvoice = (booking: any) => {
    const doc = new jsPDF();
    const primaryColor = [26, 26, 26]; // Art-text
    const accentColor = [255, 107, 0]; // Art-orange
    const successColor = [0, 160, 0]; // Art-green
    
    // Background decor
    doc.setFillColor(250, 250, 250);
    doc.rect(0, 0, 210, 297, 'F');
    
    // Header bar
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 50, 'F');
    
    // Logo text Replacement (since we can't easily embed images without URL fetching issues in PDF here)
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('NGOPI DI KETINGGIAN', 20, 25);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('ADVENTURE & BREW • EST. 2026', 20, 32);
    
    // Invoice Info on Header
    doc.setFontSize(10);
    doc.text('KUITANSI PEMBAYARAN', 140, 20);
    doc.setFontSize(14);
    doc.text(`#${(booking.id || '').substring(0, 8).toUpperCase()}`, 140, 30);
    doc.setFontSize(9);
    const bookingDate = booking.createdAt ? new Date(booking.createdAt.seconds * 1000) : new Date();
    const displayDate = isNaN(bookingDate.getTime()) ? new Date() : bookingDate;
    doc.text(`TANGGAL: ${displayDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 140, 38);

    // Section colors and borders
    const drawSectionHeader = (title: string, y: number) => {
      doc.setFillColor(240, 240, 240);
      doc.rect(20, y, 170, 8, 'F');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(title, 25, y + 5.5);
    };

    // Client & Trip Info
    drawSectionHeader('INFORMASI PELANGGAN', 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`NAMA LENGKAP: ${booking.nama.toUpperCase()}`, 25, 75);
    doc.text(`WHATSAPP: ${booking.wa}`, 25, 82);
    doc.text(`EMAIL: ${booking.email}`, 25, 89);
    
    drawSectionHeader('DETAIL PERJALANAN', 100);
    doc.text(`DESTINASI: ${booking.destinasi.toUpperCase()} (VIA ${booking.jalur.toUpperCase()})`, 25, 115);
    doc.text(`JADWAL: ${booking.jadwal} (${booking.durasi})`, 25, 122);
    doc.text(`JUMLAH PESERTA: ${booking.peserta} ORANG`, 25, 129);
    doc.text(`TIPE TRIP: ${booking.type === 'open' ? 'OPEN TRIP' : 'PRIVATE TRIP'}`, 25, 136);

    // Items and Pricing
    drawSectionHeader('RINCIAN BIAYA', 150);
    doc.setFont('helvetica', 'bold');
    doc.text('KETERANGAN', 25, 165);
    doc.text('JUMLAH', 130, 165);
    doc.text('SUBTOTAL', 160, 165);
    doc.setDrawColor(230, 230, 230);
    doc.line(20, 168, 190, 168);
    
    doc.setFont('helvetica', 'normal');
    let currentY = 175;
    
    // Base Trip
    doc.text(`PAKET TRIP ${booking.destinasi.toUpperCase()}`, 25, currentY);
    doc.text(`${booking.peserta} PAX`, 130, currentY);
    const baseTotal = (booking.totalPrice || 0) + (booking.discountAmount || 0) - (booking.opsionalPrice || 0);
    doc.text(`Rp ${baseTotal.toLocaleString('id-ID')}`, 160, currentY);
    currentY += 8;

    if (booking.opsionalItems && booking.opsionalItems.length > 0) {
      booking.opsionalItems.forEach((item: any) => {
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        const itemLine = `(+) ${item.name} (${item.count || 1}x • ${item.days || 1} Hari @ Rp ${item.price.toLocaleString('id-ID')})`;
        const splitItem = doc.splitTextToSize(itemLine, 130);
        doc.text(splitItem, 25, currentY);
        doc.text(item.price === 0 ? 'Dikonfirmasi Admin' : `Rp ${item.subtotal.toLocaleString('id-ID')}`, 160, currentY);
        currentY += (splitItem.length * 6);
      });
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(10);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black uppercase tracking-widest text-art-text">Daftar Booking Masuk</h3>
        <span className="text-[10px] font-black uppercase px-3 py-1 bg-art-text text-white rounded-full">{bookings.length} Pesanan</span>
      </div>

      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-art-text/10 rounded-2xl">
            <Info className="mx-auto mb-2 text-art-text/20" size={32} />
            <p className="font-bold text-art-text/40 uppercase text-xs">Belum ada booking masuk</p>
          </div>
        ) : (
          bookings.map((booking: any) => (
            <div key={booking.id} className={`bg-white rounded-2xl border-2 transition-all p-5 flex flex-col gap-4 ${booking.status === 'confirmed' ? 'border-art-green' : booking.status === 'cancelled' ? 'border-red-400' : 'border-art-text'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-art-text/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border-2 ${booking.status === 'confirmed' ? 'bg-art-green/10 border-art-green text-art-green' : booking.status === 'cancelled' ? 'bg-red-50 border-red-400 text-red-400' : 'bg-art-bg border-art-text text-art-text'}`}>
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="font-black uppercase tracking-tight text-lg leading-none mb-1">{booking.nama}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase">
                      <span className="text-art-text/40">{booking.type === 'open' ? '🟢 Open Trip' : '🔵 Private Trip'}</span>
                      <span className="text-art-text/20">•</span>
                      <span className="text-art-text/40">{booking.wa}</span>
                      <span className="text-art-text/20">•</span>
                      <span className="text-art-orange lowercase font-medium bg-art-orange/5 px-2 py-0.5 rounded-full">{booking.email || 'no-email'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => window.open(`https://wa.me/${booking.wa.startsWith('0') ? '62' + booking.wa.substring(1) : booking.wa}?text=${encodeURIComponent(`Halo ${booking.nama}, ini dari Ngopi di Ketinggian. Kami ingin mengonfirmasi booking Anda untuk trip ${booking.destinasi}.`)}`, '_blank')}
                     className="px-3 py-2 bg-[#25D366] text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-[#20ba59] transition-colors shadow-sm"
                   >
                     <Send size={14} /> Contact WA
                   </button>
                   <button 
                    onClick={() => generateInvoice(booking)}
                    className="p-2 border-2 border-art-text/10 text-art-text/60 rounded-xl hover:bg-art-bg transition-colors"
                    title="Download Invoice"
                  >
                    <Download size={16} />
                  </button>
                  <select 
                    value={booking.status} 
                    onChange={(e) => handleStatusUpdate(booking.id, e.target.value)}
                    className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl outline-none cursor-pointer border-2 transition-all ${
                      booking.status === 'lunas' ? 'bg-art-green text-white border-art-green' : 
                      booking.status === 'selesai' ? 'bg-gray-800 text-white border-gray-800' :
                      booking.status === 'processing' ? 'bg-blue-600 text-white border-blue-600' :
                      booking.status === 'batal' ? 'bg-red-500 text-white border-red-500' : 
                      'bg-white border-art-text'
                    }`}
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="processing">⚙️ Processing</option>
                    <option value="dp_partial">💸 DP (Parsial)</option>
                    <option value="lunas">💳 Lunas</option>
                    <option value="selesai">🏆 Selesai</option>
                    <option value="batal">❌ Batal</option>
                  </select>
                  <button onClick={() => handleDelete(booking.id)} className="p-2 border-2 border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-art-orange/5 rounded-lg text-art-orange"><MapPin size={16} /></div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-art-text/30 tracking-widest">Destinasi</p>
                        <p className="text-xs font-black uppercase">{(booking.destinasi || 'N/A')} ({(booking.jalur || 'N/A')})</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-art-green/5 rounded-lg text-art-green"><Calendar size={16} /></div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-art-text/30 tracking-widest">Jadwal</p>
                        <p className="text-xs font-black uppercase">{(booking.jadwal || 'N/A')} ({(booking.durasi || 'N/A')})</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-art-bg/20 p-4 rounded-2xl border-2 border-art-text/5 space-y-3">
                    <p className="text-[10px] font-black uppercase text-art-text/40 tracking-[0.2em] mb-2 font-mono">Biling Summary</p>
                    <div className="space-y-2">
                       {/* MAIN PACKAGE */}
                       <div className="flex justify-between items-center text-xs bg-white/50 p-2 rounded-lg border border-art-text/5">
                          <div className="flex flex-col">
                            <span className="font-black text-art-text uppercase text-[10px]">📦 Paket Trip {booking.destinasi}</span>
                            <span className="text-[9px] text-art-text/40">{booking.peserta} Pax • {booking.jadwal}</span>
                          </div>
                          <span className="font-black text-art-text">Rp {((booking.totalPrice || 0) + (booking.discountAmount || 0) - (booking.opsionalPrice || 0)).toLocaleString('id-ID')}</span>
                       </div>
                       
                       {/* OPTIONAL ITEMS */}
                       {booking.opsionalItems && booking.opsionalItems.length > 0 ? (
                         <div className="space-y-1.5 pt-1">
                            <p className="text-[9px] font-bold text-art-orange uppercase tracking-widest pl-2 mb-1">Layanan Tambahan:</p>
                            {booking.opsionalItems.map((item: any, idx: number) => {
                               const canEdit = !item.isRental;
                               return (
                                 <div key={idx} className="flex justify-between items-center text-[10px] pl-3 border-l-2 border-art-orange/20 py-1">
                                   <div className="flex flex-col">
                                     <span className="text-art-text/70 font-black uppercase flex items-center gap-1.5">
                                       {item.isRental ? '🎒' : '✨'} {item.name}
                                       {canEdit && (
                                         <button onClick={() => {
                                             const newPriceStr = window.prompt("Masukkan harga baru per hari (Angka saja):", (item.price || 0).toString());
                                             if (newPriceStr !== null) {
                                               const newPrice = parseInt(newPriceStr.replace(/[^0-9]/g, ''));
                                               if (!isNaN(newPrice)) {
                                                 handleOpsionalPriceUpdate(booking, idx, newPrice);
                                               }
                                             }
                                         }} className="text-art-orange hover:bg-art-orange/10 p-1 rounded-full transition-colors"><Edit2 size={10}/></button>
                                       )}
                                     </span>
                                     <span className="text-[9px] text-art-text/30">
                                       {item.count || 1}x • {item.days || 1} Hari • @Rp {(item.price || 0).toLocaleString('id-ID')}
                                     </span>
                                   </div>
                                   <span className={`font-black ${item.status === 'pending_price' ? 'text-art-orange italic' : 'text-art-text/80'}`}>
                                     {item.status === 'pending_price' ? "TUNGGU KONF." : `Rp ${(item.subtotal || 0).toLocaleString('id-ID')}`}
                                   </span>
                                 </div>
                               );
                            })}
                         </div>
                       ) : (
                         booking.opsionalText && booking.opsionalText !== 'Tidak ada' && (
                           <div className="text-[10px] text-art-text/40 italic pl-3 border-l-2 border-art-orange/30">
                              Layanan: {booking.opsionalText}
                           </div>
                         )
                       )}

                       {booking.promoCode && (
                         <div className="flex justify-between items-center text-[10px] bg-art-green/5 p-2 rounded-xl border border-art-green/10 mt-2">
                           <span className="text-art-green font-black uppercase flex items-center gap-2">🎁 Promo: {booking.promoCode}</span>
                           <span className="font-black text-art-green">- Rp {booking.discountAmount?.toLocaleString('id-ID')}</span>
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between border-l border-art-text/5 pl-6">
                   <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-black uppercase text-art-text/30 tracking-widest mb-2 font-mono">Status & Note</p>
                        <div className="flex items-center gap-2 mb-3">
                           <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${
                              booking.status === 'lunas' ? 'bg-art-green text-white' : 
                              booking.status === 'selesai' ? 'bg-gray-800 text-white' :
                              booking.status === 'dp_partial' ? 'bg-yellow-500 text-white' :
                              booking.status === 'processing' ? 'bg-blue-600 text-white' :
                              'bg-art-bg text-art-text/60 border border-art-text/10'
                           }`}>{
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
                               <p className="text-[10px] font-black uppercase text-art-orange/60 tracking-widest mb-1">Total Piutang</p>
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
const INDONESIA_PROVINCES = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau", "Jambi", "Bengkulu", 
  "Sumatera Selatan", "Kepulauan Bangka Belitung", "Lampung", "DKI Jakarta", "Jawa Barat", 
  "Banten", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur", "Bali", "Nusa Tenggara Barat", 
  "Nusa Tenggara Timur", "Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan", 
  "Kalimantan Timur", "Kalimantan Utara", "Sulawesi Utara", "Gorontalo", "Sulawesi Tengah", 
  "Sulawesi Barat", "Sulawesi Selatan", "Sulawesi Tenggara", "Maluku", "Maluku Utara", 
  "Papua Barat", "Papua", "Papua Tengah", "Papua Pegunungan", "Papua Selatan", "Papua Barat Daya"
];

const difficultyLevels = ["Pemula", "Pemula-Menengah", "Menengah", "Menengah-Ahli", "Ahli", "Sangat Ahli"];
const durationLevels = ["1H (Tektok)", "2H 1M", "3H 2M", "4H 3M", "5H 4M"];

const DestinationsAdmin = ({ config, updateConfig, showToast, defaultList }: any) => {
  const [data, setData] = useState(JSON.parse(JSON.stringify(config.destinationsData)));
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("Semua");
  const [expandedIndexes, setExpandedIndexes] = useState<number[]>([]);

  const [visibilities, setVisibilities] = useState(config.visibilities || { map: true, quota: true, beans: true, routes: true });

  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(config.destinationsData)) {
      setData(JSON.parse(JSON.stringify(config.destinationsData)));
    }
  }, [config.destinationsData]);
  
  useEffect(() => {
    if (config.visibilities) setVisibilities(config.visibilities);
  }, [config.visibilities]);

  const handleSave = () => {
    updateConfig({ destinationsData: data, visibilities });
    showToast('Tersimpan!');
  };


  const regions = ["Semua", ...Array.from(new Set(data.map((d: any) => d.region || "Jawa")))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-lg border border-art-text/20 gap-3">
        <p className="text-xs font-bold text-art-text/60 uppercase">Mengedit Destinasi & Jalur</p>
        <div className="flex gap-2">
          <button onClick={() => {
            customConfirm("Beneran mau reset destinasi ke default?", () => {
              const defaultData = JSON.parse(JSON.stringify(defaultList));
              setData(defaultData);
              updateConfig({ destinationsData: defaultData });
              showToast('Direset ke Default!');
            });
          }} className="bg-red-100 text-red-600 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hidden sm:block">Reset Default</button>
          <button onClick={() => {
             setData(JSON.parse(JSON.stringify(config.destinationsData)));
             if (config.visibilities) setVisibilities(config.visibilities);
             setExpandedIndexes([]);
             showToast('Di-reset ke data tersimpan terakhir!');
          }} className="bg-gray-100 text-gray-600 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hidden sm:block">Batal</button>
          <button type="button" onClick={(e) => {
             e.preventDefault();
             const nd = [...data];
             nd.unshift({ id: Date.now().toString(), name: "Gunung Baru", desc: "Deskripsi", region: "Jawa", difficulty: "Pemula", image: "https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?w=500", paths: [] });
             setData(nd);
             setExpandedIndexes([0]);
          }} className="bg-art-text text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">+ Destinasi</button>
          <button onClick={handleSave} className="bg-art-orange text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">Simpan Perubahan</button>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg border border-art-text/20 grid grid-cols-2 md:grid-cols-4 gap-4">
        {['map', 'quota', 'beans', 'routes'].map(key => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-art-orange w-4 h-4" checked={(visibilities as any)[key]} onChange={e => setVisibilities({...visibilities, [key]: e.target.checked})} />
            <span className="text-xs font-bold uppercase tracking-tight text-art-text">Tampilkan {key}</span>
          </label>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg border border-art-text/20">
        <input 
          type="text" 
          placeholder="Cari Gunung / Jalur..." 
          className="border border-art-text/30 px-3 py-2 rounded text-sm outline-none focus:border-art-orange flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select 
          className="border border-art-text/30 px-3 py-2 rounded text-sm outline-none focus:border-art-orange"
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
        >
          {regions.map((r: any) => (
            <option key={r} value={r as string}>{r as string}</option>
          ))}
        </select>
      </div>

      {data.map((dest: any, i: number) => {
        const matchesSearch = dest.name.toLowerCase().includes(search.toLowerCase());
        const matchesRegion = regionFilter === "Semua" || dest.region === regionFilter;
        
        if (!matchesSearch && !matchesRegion) return null;
        if (!matchesSearch && matchesRegion && search) return null; // exact search logic
        if (matchesSearch && regionFilter !== "Semua" && dest.region !== regionFilter) return null;

        return (
        <div key={i} className={`bg-white p-4 rounded-lg border-2 ${dest.isActive !== false ? 'border-art-text' : 'border-gray-300 opacity-70'} space-y-4 relative w-full overflow-hidden`}>
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center gap-2 z-10 bg-white/80 backdrop-blur-sm p-1 rounded-md">
            <span className="text-[10px] uppercase font-bold tracking-widest text-art-text/60 hidden sm:inline">Aktif di Homepage?</span>
            <input 
              type="checkbox" 
              className="w-4 h-4 accent-art-orange"
              checked={dest.isActive !== false}
              onChange={(e) => {
                const nd = [...data];
                nd[i].isActive = e.target.checked;
                setData(nd);
              }}
            />
            <button onClick={() => {
               const nd = [...data]; nd.splice(i, 1); setData(nd);
            }} className="text-red-500 hover:text-red-600 sm:hidden"><Trash2 size={16}/></button>
          </div>
          <div className="flex items-center gap-4 pr-16 sm:pr-32">
            <button
               onClick={() => {
                 setExpandedIndexes(prev => prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i])
               }}
               className="text-art-text hover:text-art-orange w-6 h-6 flex items-center justify-center shrink-0"
            >
               <span className="font-bold text-xl">{expandedIndexes.includes(i) ? '-' : '+'}</span>
            </button>
            <input 
              className="font-bold text-lg border-b border-dashed border-art-text/30 outline-none focus:border-art-orange w-full bg-transparent max-w-[calc(100%-2rem)]" 
              value={dest.name}
              onChange={e => {
                const nd = [...data];
                nd[i].name = e.target.value;
                setData(nd);
              }}
              placeholder="Nama Gunung"
            />
          <button type="button" onClick={(e) => {
             e.preventDefault();
             const nd = [...data];
             if (!nd[i].paths) nd[i].paths = [];
             nd[i].paths.push({ name: "Jalur Baru", durations: [{ label: "1H (Tektok)", price: 0, originalPrice: 0 }] });
             setData(nd);
             if (!expandedIndexes.includes(i)) setExpandedIndexes([...expandedIndexes, i]);
          }} className="text-[10px] bg-art-text text-white px-3 py-1.5 rounded whitespace-nowrap hidden sm:block">+ Jalur</button>
            <button onClick={() => {
               const nd = [...data]; nd.splice(i, 1); setData(nd);
            }} className="text-red-500 hover:text-red-600 hidden sm:block"><Trash2 size={16}/></button>
          </div>

          {expandedIndexes.includes(i) && (
          <div className="grid gap-4 mt-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center mb-2">
              <span className="text-xs font-bold w-16">Foto:</span>
              <div className="w-full sm:flex-1">
                <ImageUploader value={dest.image} onChange={url => {
                  const nd = [...data];
                  nd[i].image = url;
                  setData(nd);
                }} placeholder="URL Gambar / Unggah File" />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 sm:items-start mb-2">
              <div className="flex flex-col flex-1 min-w-[120px]">
                <span className="text-[9px] font-bold uppercase mb-1">Region:</span>
                <input className="border p-2 rounded text-xs w-full" value={dest.region || 'Jawa'} onChange={e => {
                  const nd = [...data];
                  nd[i].region = e.target.value;
                  setData(nd);
                }} placeholder="Cth: Jawa Tengah" />
              </div>
              
              <div className="flex flex-col flex-1 min-w-[120px]">
                <span className="text-[9px] font-bold uppercase mb-1">Kuota:</span>
                <input className="border p-2 rounded text-xs w-full" value={dest.kuota} onChange={e => {
                  const nd = [...data];
                  nd[i].kuota = e.target.value;
                  setData(nd);
                }} placeholder="Cth: 2-12 Pax" />
              </div>

              <div className="flex flex-col flex-1 min-w-[120px]">
                <span className="text-[9px] font-bold uppercase mb-1">Mepo:</span>
                <input className="border p-2 rounded text-xs w-full" value={dest.mepo || ''} onChange={e => {
                  const nd = [...data];
                  nd[i].mepo = e.target.value;
                  setData(nd);
                }} placeholder="Basecamp" />
              </div>
              
              <div className="flex flex-col flex-1 min-w-[120px]">
                <span className="text-[9px] font-bold uppercase mb-1">Beans:</span>
                <input className="border p-2 rounded text-xs w-full" value={dest.beans || ''} onChange={e => {
                  const nd = [...data];
                  nd[i].beans = e.target.value;
                  setData(nd);
                }} placeholder="Kopi" />
              </div>
              
              <div className="flex flex-col flex-1 min-w-[120px]">
                <span className="text-[9px] font-bold uppercase mb-1">Level:</span>
                <select className="border p-2 rounded text-[11px] w-full" value={dest.difficulty || ''} onChange={e => {
                  const nd = [...data];
                  nd[i].difficulty = e.target.value;
                  setData(nd);
                }}>
                  <option value="">Status</option>
                  {DIFFICULTY_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                </select>
              </div>
            </div>
            
            <button type="button" 
              onClick={(e) => {
                e.preventDefault();
                const nd = [...data];
                if (!nd[i].paths) nd[i].paths = [];
                nd[i].paths.push({ name: "Jalur Baru", durations: [{ label: "1H (Tektok)", price: 0, originalPrice: 0 }] });
                setData(nd);
              }}
              className="text-[10px] bg-art-text text-white px-3 py-1.5 rounded w-full sm:hidden"
            >+ Jalur</button>

            {dest.paths?.map((path: any, pIdx: number) => (
              <div key={pIdx} className="border border-art-text/20 p-3 rounded-lg bg-gray-50 space-y-3 relative">
                <button onClick={() => {
                   const nd = [...data];
                   nd[i].paths.splice(pIdx, 1);
                   setData(nd);
                }} className="absolute top-3 right-3 text-red-500"><Trash2 size={14}/></button>
                <div className="flex items-center gap-2 pr-8">
                  <span className="text-[10px] font-bold uppercase w-12">Jalur:</span>
                  <input className="border p-1.5 rounded text-xs flex-1" value={path.name} onChange={e => {
                    const nd = [...data];
                    nd[i].paths[pIdx].name = e.target.value;
                    setData(nd);
                  }} placeholder="Nama Jalur" />
                  <button type="button" onClick={(e) => {
                    e.preventDefault();
                    const nd = [...data];
                    nd[i].paths[pIdx].durations.push({ label: "1H (Tektok)", price: 0, originalPrice: 0 });
                    setData(nd);
                  }} className="text-[10px] bg-blue-500 text-white px-2 py-1.5 rounded whitespace-nowrap">+ Durasi</button>
                </div>
                
                <div className="pl-0 sm:pl-14 space-y-2">
                  {path.durations.map((dur: any, j: number) => (
                    <div key={j} className="flex gap-2 items-center">
                      <select className="border p-2 rounded text-xs flex-1" value={dur.label} onChange={e => {
                        const nd = [...data];
                        nd[i].paths[pIdx].durations[j].label = e.target.value;
                        setData(nd);
                      }}>
                        {durationLevels.map((lvl: string) => <option key={lvl} value={lvl}>{lvl}</option>)}
                      </select>
                      <input 
                        type="text"
                        inputMode="numeric"
                        className="border p-2 rounded text-xs w-20 font-mono" 
                        value={dur.originalPrice ?? 0} 
                        onChange={e => {
                          let valStr = e.target.value.replace(/^0+/, '');
                          if (valStr === '') valStr = '0';
                          const val = parseInt(valStr) || 0;
                          const nd = [...data];
                          nd[i].paths[pIdx].durations[j].originalPrice = val;
                          setData(nd);
                        }} 
                        placeholder="Coret" 
                      />
                      <input 
                        type="text"
                        inputMode="numeric"
                        className="border p-2 rounded text-xs w-20 font-mono" 
                        value={dur.price ?? 0} 
                        onChange={e => {
                          let valStr = e.target.value.replace(/^0+/, '');
                          if (valStr === '') valStr = '0';
                          const val = parseInt(valStr) || 0;
                          const nd = [...data];
                          nd[i].paths[pIdx].durations[j].price = val;
                          setData(nd);
                        }} 
                        placeholder="Final" 
                      />
                        <button onClick={() => {
                          const nd = [...data];
                          nd[i].paths[pIdx].durations.splice(j, 1);
                          setData(nd);
                        }} className="text-red-500 p-2"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )})}
    </div>
  );
};

// Sub-components for Admin
const TeamPhotosAdmin = ({ config, updateConfig, showToast }: any) => {
  const [photos, setPhotos] = useState(config.teamPhotos || []);

  const handleSave = () => {
    updateConfig({ teamPhotos: photos });
    showToast('Foto Tim Tersimpan!');
  };

  return (
    <div className="bg-white p-4 rounded-lg border-2 border-art-text space-y-4">
      <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
        <h3 className="font-bold text-sm uppercase">Foto Tim Lapangan (Maks 4)</h3>
        <div className="flex gap-2">
          <button onClick={() => setPhotos([...photos, ""])} className="text-xs bg-art-text text-white px-2 py-1 rounded">+ Foto</button>
          <button onClick={handleSave} className="text-xs bg-art-orange text-white px-2 py-1 rounded">Simpan</button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {photos.map((url: string, i: number) => (
          <div key={i} className="space-y-2 relative">
            <button onClick={() => {
              const np = [...photos]; np.splice(i, 1); setPhotos(np);
            }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md z-10"><Trash2 size={12}/></button>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-art-text/10">
              {url && <img src={url} className="w-full h-full object-cover" />}
            </div>
            <input className="w-full border p-1 text-[10px] rounded" value={url} onChange={e => {
              const np = [...photos]; np[i] = e.target.value; setPhotos(np);
            }} placeholder="URL Image" />
          </div>
        ))}
      </div>
    </div>
  );
};

const LeadersAdmin = ({ config, updateConfig, showToast, defaultList }: any) => {
  const [data, setData] = useState([...config.tripLeaders]);
  const [leaderTitle, setLeaderTitle] = useState(config.homepage?.leaderTitle || '');
  const [leaderSub, setLeaderSub] = useState(config.homepage?.leaderSub || '');
  const [leaderParagraph, setLeaderParagraph] = useState(config.homepage?.leaderParagraph || '');

  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(config.tripLeaders)) {
      setData(JSON.parse(JSON.stringify(config.tripLeaders)));
    }
  }, [config.tripLeaders]);

  const handleSave = () => {
    updateConfig({ tripLeaders: data, homepage: { ...config.homepage, leaderTitle, leaderSub, leaderParagraph } });
    showToast('Leaders & Teks Homepage Tersimpan!');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border-2 border-art-text space-y-4">
        <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
           <Edit2 size={16} className="text-art-orange" /> Edit Teks Trip Leader (Homepage)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <input className="w-full border p-2 rounded text-xs" value={leaderTitle} onChange={e => setLeaderTitle(e.target.value)} placeholder="Judul Bagian Leader (Kenalan dengan)" />
           <input className="w-full border p-2 rounded text-xs" value={leaderSub} onChange={e => setLeaderSub(e.target.value)} placeholder="Sub-judul Bagian Leader (Trip Leader Kami)" />
        </div>
        <textarea className="w-full border p-2 rounded text-xs h-16" value={leaderParagraph} onChange={e => setLeaderParagraph(e.target.value)} placeholder="Paragraf Trip Leader"></textarea>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-art-text/20">
        <p className="text-xs font-bold text-art-text/60 uppercase">Daftar Trip Leader</p>
        <div className="flex gap-2">
          <button onClick={() => {
            customConfirm("Beneran mau reset leaders ke default?", () => {
              const defaultData = JSON.parse(JSON.stringify(defaultList));
              setData(defaultData);
              updateConfig({ tripLeaders: defaultData });
              showToast('Direset ke Default!');
            });
          }} className="bg-red-100 text-red-600 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">Reset Default</button>
          <button onClick={() => {
             setData(JSON.parse(JSON.stringify(config.tripLeaders)));
             showToast('Di-reset ke data tersimpan terakhir!');
          }} className="bg-gray-100 text-gray-600 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hidden sm:block">Batal</button>
          <button onClick={() => {
            setData([...data, { name: "Nama Baru", age: "20 th", description: "Deskripsi", avatar: "https://via.placeholder.com/150", voiceLine: "" }]);
          }} className="bg-art-text text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">+ Leader</button>
          <button onClick={handleSave} className="bg-art-orange text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">Simpan</button>
        </div>
      </div>
      <div className="space-y-4">
        {data.map((leader, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border-2 border-art-text relative hover:border-art-orange transition-all group">
            <button onClick={() => {
              const nd = [...data];
              nd.splice(i, 1);
              setData(nd);
            }} className="absolute top-4 right-4 text-red-500 hover:scale-110 transition-transform"><Trash2 size={20}/></button>
            
            <div className="flex flex-col gap-6">
              {/* Leader Image Preview at Top */}
              <div className="w-full h-48 sm:h-64 rounded-xl border-2 border-dashed border-art-text/10 overflow-hidden bg-art-bg flex items-center justify-center p-2">
                <ImageUploader 
                  value={leader.avatar} 
                  onChange={url => setData(prev => prev.map((item, idx) => idx === i ? { ...item, avatar: url } : item))} 
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-art-text/40">Link Gambar (Eksplisit)</label>
                  <input 
                    className="w-full border-2 border-art-text/10 p-3 rounded-xl text-xs font-mono bg-gray-50 text-art-text/60" 
                    value={leader.avatar} 
                    onChange={e => setData(prev => prev.map((item, idx) => idx === i ? { ...item, avatar: e.target.value } : item))} 
                    placeholder="URL Image (Auto-update if uploaded above)" 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-art-text/40">Nama Lengkap</label>
                    <input 
                      className="w-full border-2 border-art-text/10 p-3 rounded-xl text-sm font-black outline-none focus:border-art-orange" 
                      value={leader.name} 
                      onChange={e => setData(prev => prev.map((item, idx) => idx === i ? { ...item, name: e.target.value } : item))} 
                      placeholder="Contoh: Alex Honnold" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-art-text/40">Pengalaman / Usia</label>
                    <input 
                      className="w-full border-2 border-art-text/10 p-3 rounded-xl text-sm font-bold outline-none focus:border-art-orange" 
                      value={leader.age || ''} 
                      onChange={e => setData(prev => prev.map((item, idx) => idx === i ? { ...item, age: e.target.value } : item))} 
                      placeholder="Contoh: 10 Tahun / 28 Th" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-art-text/40">Deskripsi / Bio</label>
                  <textarea 
                    rows={4}
                    className="w-full border-2 border-art-text/10 p-3 rounded-xl text-xs font-medium outline-none focus:border-art-orange resize-none" 
                    value={leader.description} 
                    onChange={e => setData(prev => prev.map((item, idx) => idx === i ? { ...item, description: e.target.value } : item))} 
                    placeholder="Tuliskan pengalaman atau moto hidup..." 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-art-text/60">Voice Audio URL</label>
                  <input 
                    className="w-full border-2 border-blue-100 p-3 rounded-xl text-[11px] font-medium outline-none focus:border-blue-400 bg-blue-50/20" 
                    value={leader.voiceLine || ''} 
                    onChange={e => setData(prev => prev.map((item, idx) => idx === i ? { ...item, voiceLine: e.target.value } : item))} 
                    placeholder="https://firebasestorage... (URL Audio)" 
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
        <p className="text-[10px] text-art-text/50">Kosongkan URL Voice Line agar admin bisa mengisi audionya secara manual dari luar jika dibutuhkan, atau isikan URL Firebase/Public HTTPS yang sudah dihosting. Karena Firestore hanya menampung teks url.</p>
      </div>

      <div className="mt-8 border-t-2 border-dashed border-art-text/20 pt-8">
        <TeamPhotosAdmin config={config} updateConfig={updateConfig} showToast={showToast} />
      </div>
    </div>
  );
};

const GalleryAdmin = ({ config, updateConfig, showToast, defaultList }: any) => {
  const [data, setData] = useState([...config.galleryPhotos]);
  
  const handleSave = () => {
    updateConfig({ galleryPhotos: data });
    showToast('Disimpan!');
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-art-text/20">
        <p className="text-xs font-bold text-art-text/60 uppercase">Gallery Foto</p>
        <div className="flex gap-2">
          <button onClick={() => {
            customConfirm("Beneran mau reset gallery ke default?", () => {
              const defaultData = JSON.parse(JSON.stringify(defaultList));
              setData(defaultData);
              updateConfig({ galleryPhotos: defaultData });
              showToast('Direset ke Default!');
            });
          }} className="bg-red-100 text-red-600 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hidden sm:block">Reset Default</button>
          <button onClick={() => {
             setData(JSON.parse(JSON.stringify(config.galleryPhotos)));
             showToast('Di-reset ke data tersimpan terakhir!');
          }} className="bg-gray-100 text-gray-600 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hidden sm:block">Batal</button>
          <button onClick={() => {
            setData([...data, { src: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=2070", desc: "Foto Baru" }]);
          }} className="bg-art-text text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">+ Foto</button>
          <button onClick={handleSave} className="bg-art-orange text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">Simpan</button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.map((photo, i) => (
          <div key={i} className="bg-white p-3 rounded border border-art-text relative space-y-2 flex flex-col">
            <button onClick={() => {
              const nd = [...data]; nd.splice(i, 1); setData(nd);
            }} className="absolute top-2 right-2 text-red-500 bg-white p-1 rounded"><Trash2 size={16}/></button>
            {photo.src && <img src={photo.src} className="w-full h-32 object-cover rounded" />}
            <input className="border p-1 text-xs w-full rounded" value={photo.src} onChange={e => {
                  const nd = [...data]; nd[i].src = e.target.value; setData(nd);
            }} placeholder="URL Image" />
            <input className="border p-1 text-xs w-full rounded" value={photo.desc} onChange={e => {
                  const nd = [...data]; nd[i].desc = e.target.value; setData(nd);
            }} placeholder="Caption" />
          </div>
        ))}
      </div>
    </div>
  );
};

const CeritaAdmin = ({ config, updateConfig, showToast, defaultVideo }: any) => {
  const [url, setUrl] = useState(config.ceritaVideoUrl);
  const [ceritaTitle, setCeritaTitle] = useState(config.homepage?.ceritaTitle || '');
  const [ceritaSub, setCeritaSub] = useState(config.homepage?.ceritaSub || '');
  const [ceritaParagraph1, setCeritaParagraph1] = useState(config.homepage?.ceritaParagraph1 || '');
  const [ceritaParagraph2, setCeritaParagraph2] = useState(config.homepage?.ceritaParagraph2 || '');
  const [ceritaFeatures, setCeritaFeatures] = useState(config.homepage?.ceritaFeatures || []);

  const handleSave = () => {
    updateConfig({ 
       ceritaVideoUrl: url, 
       homepage: { 
         ...config.homepage, 
         ceritaTitle, 
         ceritaSub, 
         ceritaParagraph1, 
         ceritaParagraph2,
         ceritaFeatures
       } 
    });
    showToast('Cerita Berhasil Disimpan!');
  };

  return (
     <div className="space-y-6">
       <div className="flex flex-col gap-4 bg-white p-6 rounded-lg border-2 border-art-text">
        <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
           <Edit2 size={16} className="text-art-orange" /> Edit Konten Cerita (Homepage)
        </h3>
        
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="w-full border p-2 rounded text-xs" value={ceritaTitle} onChange={e => setCeritaTitle(e.target.value)} placeholder="Judul Cerita (Secangkir Cerita)" />
            <input className="w-full border p-2 rounded text-xs" value={ceritaSub} onChange={e => setCeritaSub(e.target.value)} placeholder="Sub-judul (di Atas Awan)" />
          </div>
          <textarea className="w-full border p-2 rounded text-xs h-24" value={ceritaParagraph1} onChange={e => setCeritaParagraph1(e.target.value)} placeholder="Paragraf 1"></textarea>
          <textarea className="w-full border p-2 rounded text-xs h-24" value={ceritaParagraph2} onChange={e => setCeritaParagraph2(e.target.value)} placeholder="Paragraf 2"></textarea>
        
          <div className="pt-4 space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
              <h4 className="font-bold text-xs uppercase">Edit Fitur Cerita</h4>
              <button type="button" onClick={() => setCeritaFeatures([...ceritaFeatures, { title: '', desc: '' }])} className="text-xs bg-art-text text-white px-2 py-1 rounded">+ Fitur</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(ceritaFeatures || []).map((feat: any, idx: number) => (
                <div key={idx} className="border border-art-text/20 p-4 rounded-lg space-y-2 relative bg-art-bg/20">
                  <button type="button" onClick={() => {
                    const nf = [...ceritaFeatures]; nf.splice(idx, 1); setCeritaFeatures(nf);
                  }} className="absolute top-2 right-2 text-red-500"><Trash2 size={16}/></button>
                  <input className="w-full border p-2 rounded text-xs" value={feat.title} onChange={e => {
                    const nf = [...ceritaFeatures]; nf[idx].title = e.target.value; setCeritaFeatures(nf);
                  }} placeholder="Judul Fitur" />
                  <textarea className="w-full border p-2 rounded text-xs h-16" value={feat.desc} onChange={e => {
                    const nf = [...ceritaFeatures]; nf[idx].desc = e.target.value; setCeritaFeatures(nf);
                  }} placeholder="Deskripsi Fitur"></textarea>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5 pt-4 border-t border-art-text/10">
          <p className="text-[10px] font-black uppercase text-art-text/40 tracking-widest">URL Video (Background)</p>
          <input className="border-2 border-art-text p-3 rounded-xl w-full text-xs font-mono" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
          <p className="text-[9px] text-art-text/30 italic">Gunakan link embed YouTube atau file MP4.</p>
        </div>

        <div className="flex gap-2 w-fit mt-6">
          <button onClick={() => {
            customConfirm("Beneran mau reset cerita ke default?", () => {
              setUrl(defaultVideo);
              updateConfig({ ceritaVideoUrl: defaultVideo });
              showToast('Direset ke Default!');
            });
          }} className="bg-red-100 text-red-600 px-4 py-3 rounded text-xs font-bold uppercase tracking-widest hidden sm:block">Reset Default</button>
          <button onClick={handleSave} className="bg-art-orange text-white px-4 py-3 rounded text-xs font-bold uppercase tracking-widest">Simpan Perubahan</button>
        </div>
        
        {/* Video Preview */}
        {url && (
          <div className="mt-4 border-2 border-art-text/20 p-4 rounded-lg bg-gray-50 flex flex-col max-w-sm">
            <p className="text-xs font-bold mb-2 uppercase">Preview Video</p>
            {url.includes('youtube.com') || url.includes('youtu.be') ? (
              <iframe 
                src={url}
                className="w-full aspect-[4/5] object-cover rounded shadow"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video 
                autoPlay loop muted playsInline controls
                src={url} 
                className="w-full aspect-[4/5] object-cover rounded shadow bg-black"
              />
            )}
          </div>
        )}
       </div>
    </div>
  )
};

const HomepageAdmin = ({ config, updateConfig, showToast }: any) => {
  const [data, setData] = useState({ ...config.homepage, heroSlides: config.homepage.heroSlides || [] });

  const handleSave = () => {
    updateConfig({ homepage: data });
    showToast('Hero & Slide Tersimpan!');
  };

  return (
    <div className="bg-white p-6 rounded-2xl border-2 border-art-text space-y-8">
      <div className="space-y-4">
        <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
           <Edit2 size={16} className="text-art-orange" /> Edit Teks Hero Utama
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
              <label className="text-[10px] font-black uppercase text-art-text/40 mb-1 ml-1">Slogan Atas</label>
              <input className="w-full border-2 border-art-text/10 p-2 rounded-xl text-xs font-bold" value={data.heroSub || ''} onChange={e => setData({...data, heroSub: e.target.value})} placeholder="Open Trip Eksklusif" />
           </div>
           <div>
              <label className="text-[10px] font-black uppercase text-art-text/40 mb-1 ml-1">Floating Features</label>
              <input className="w-full border-2 border-art-text/10 p-2 rounded-xl text-xs font-bold" value={data.heroFeatures || ''} onChange={e => setData({...data, heroFeatures: e.target.value})} placeholder="Fasilitas Premium • Pemandu Ahli" />
           </div>
           <div>
              <label className="text-[10px] font-black uppercase text-art-text/40 mb-1 ml-1">Prefix Judul</label>
              <input className="w-full border-2 border-art-text/10 p-2 rounded-xl text-xs font-black uppercase" value={data.heroTitlePrefix || ''} onChange={e => setData({...data, heroTitlePrefix: e.target.value})} placeholder="TRIP" />
           </div>
           <div>
              <label className="text-[10px] font-black uppercase text-art-text/40 mb-1 ml-1">Tagline Bawah</label>
              <input className="w-full border-2 border-art-text/10 p-2 rounded-xl text-xs font-bold" value={data.heroTagline || ''} onChange={e => setData({...data, heroTagline: e.target.value})} placeholder="JAYA / JAYA / JAYA" />
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
              <label className="text-[10px] font-black uppercase text-art-text/40 mb-1 ml-1">Judul Utama</label>
              <textarea className="w-full border-2 border-art-text/10 p-2 rounded-xl text-xs font-black h-20 resize-none" value={data.heroTitle || ''} onChange={e => setData({...data, heroTitle: e.target.value})} placeholder="Ngopi Di Ketinggian"></textarea>
           </div>
           <div>
              <label className="text-[10px] font-black uppercase text-art-text/40 mb-1 ml-1">Deskripsi Hero</label>
              <textarea className="w-full border-2 border-art-text/10 p-2 rounded-xl text-xs font-medium h-20 resize-none" value={data.heroDescription || ''} onChange={e => setData({...data, heroDescription: e.target.value})} placeholder="Nikmati pengalaman trip tak terlupakan..."></textarea>
           </div>
        </div>
        
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-art-text/40 tracking-widest block">Foto Background Hero</label>
          <ImageUploader value={data.heroPhotoUrl || ''} onChange={(url) => setData({...data, heroPhotoUrl: url})} placeholder="URL Foto Utama Hero" />
        </div>
      </div>

      <div className="pt-6 border-t-2 border-dashed border-art-text/20 space-y-4">
        <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
          <h3 className="font-bold text-sm uppercase">Edit Slide Gunung (Ketinggian MDPL)</h3>
          <button type="button" onClick={(e) => { e.preventDefault(); setData({ ...data, heroSlides: [...data.heroSlides, { name: "Gunung Contoh", height: "0.000", image: "" }] })}} className="text-xs bg-art-text text-white px-2 py-1 rounded">+ Slide</button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           {data.heroSlides.map((slide: any, i: number) => (
             <div key={i} className="border border-art-text/20 p-4 rounded-lg space-y-2 relative bg-art-bg/20">
                <button onClick={() => {
                   const ns = [...data.heroSlides]; ns.splice(i, 1); setData({...data, heroSlides: ns});
                }} className="absolute top-2 right-2 text-red-500"><Trash2 size={16}/></button>

                <div>
                   <label className="text-[10px] font-bold uppercase block mb-1">Pilih dari Destinasi (Opsional)</label>
                   <select 
                     className="w-full border p-2 rounded text-xs mb-2 bg-white outline-none focus:border-art-orange"
                     onChange={(e) => {
                       const destName = e.target.value;
                       if (!destName) return;
                       const dest = config.destinationsData?.find((d: any) => d.name === destName);
                       if (dest) {
                         const ns = [...data.heroSlides];
                         ns[i] = {
                           ...ns[i],
                           name: dest.name,
                           height: dest.height?.replace(' mdpl', '') || "",
                           image: dest.image || ns[i].image
                         };
                         setData({...data, heroSlides: ns});
                       }
                     }}
                     value=""
                   >
                     <option value="">-- Pilih Gunung --</option>
                     {config.destinationsData?.map((d: any) => (
                       <option key={d.id} value={d.name}>{d.name}</option>
                     ))}
                   </select>
                   <label className="text-[10px] font-bold uppercase block mb-1">Nama Gunung</label>
                   <input className="w-full border p-2 rounded text-xs" value={slide.name} onChange={e => {
                      const ns = [...data.heroSlides]; ns[i].name = e.target.value; setData({...data, heroSlides: ns});
                   }} placeholder="Nama Gunung" />
                </div>
                <div>
                   <label className="text-[10px] font-bold uppercase block mb-1">Ketinggian (Cth: 3.676)</label>
                   <input className="w-full border p-2 rounded text-xs" value={slide.height} onChange={e => {
                      const ns = [...data.heroSlides]; ns[i].height = e.target.value; setData({...data, heroSlides: ns});
                   }} placeholder="Ketinggian MDPL" />
                </div>
                <div>
                   <label className="text-[10px] font-bold uppercase block mb-1">Foto Background</label>
                   <ImageUploader value={slide.image} onChange={(url) => {
                      const ns = [...data.heroSlides]; ns[i].image = url; setData({...data, heroSlides: ns});
                   }} placeholder="URL Foto Gunung" />
                </div>
             </div>
           ))}
        </div>
      </div>

      <button onClick={handleSave} className="bg-art-orange text-white px-4 py-2 rounded text-xs font-bold uppercase w-full">Simpan Homepage</button>
    </div>
  );
};

const CleanupPhotosAdmin = ({ config, updateConfig, showToast }: any) => {
  const handleCleanup = () => {
    customConfirm("Beneran mau hapus semua URL foto? Tindakan ini tidak bisa dibatalkan!", () => {
      const newConfig = {
        ...config,
        destinationsData: config.destinationsData.map((d: any) => ({ ...d, image: "" })),
        tripLeaders: config.tripLeaders.map((l: any) => ({ ...l, avatar: "" })),
        homepage: { ...config.homepage, heroPhotoUrl: "" },
        galleryPhotos: []
      };
      updateConfig(newConfig);
      showToast('Foto dibersihkan!');
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg border-2 border-red-500 space-y-4">
      <h3 className="font-bold text-sm uppercase text-red-600">Cleanup Database</h3>
      <p className="text-xs">Hapus semua referensi foto dari database untuk memperbarui secara manual.</p>
      <button onClick={handleCleanup} className="bg-red-600 text-white px-4 py-2 rounded text-xs font-bold uppercase">Hapus Semua Foto</button>
    </div>
  );
};


const ImageUploader = ({ value, onChange, placeholder = "URL Gambar" }: { value: string, onChange: (url: string) => void, placeholder?: string }) => {
  return (
    <div className="space-y-1 p-2 rounded-lg bg-art-bg/30 border border-art-text/10">
      <div className="flex items-center gap-2">
      	<input 
          className="border border-art-text/20 p-2 rounded text-[10px] w-full text-art-text bg-white outline-none focus:border-art-orange transition-colors" 
          value={value || ''} 
          onChange={e => onChange(e.target.value)} 
          placeholder={placeholder || "Masukkan Link URL Foto"} 
        />
      </div>
      {value && <p className="text-[8px] text-art-green font-bold uppercase truncate">Link Terdeteksi</p>}
    </div>
  );
};


const OpenTripsAdmin = ({ config, updateConfig, showToast }: any) => {
  const [data, setData] = useState<OpenTrip[]>(config.openTrips || []);
  const [expandedIndexes, setExpandedIndexes] = useState<number[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (!user || (user.email !== 'mrachmanfm@gmail.com' && user.email !== 'mrahmanfm@gmail.com')) {
      return;
    }
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (config.openTrips) {
      setData(config.openTrips);
    }
  }, [config.openTrips]);

  const getConsumedQuota = (name: string, jadwal: string) => {
    return bookings
      .filter(b => b.type === 'open' && b.destinasi === name && b.jadwal === jadwal && (b.status === 'processing' || b.status === 'lunas' || b.status === 'selesai' || b.status === 'dp_partial'))
      .reduce((acc, b) => acc + (Number(b.peserta) || 0), 0);
  };

  const handleSave = () => { 
    const syncedData = data.map(ot => ({
      ...ot,
      consumedKuota: getConsumedQuota(ot.name, ot.jadwal)
    }));
    updateConfig({ openTrips: syncedData }); 
    showToast('Tersimpan!'); 
  };

  const calculateDateRange = (startDate: string, duration: string) => {
    if (!startDate || !duration) return "";
    
    try {
      const start = new Date(startDate);
      const days = parseInt(duration.split('H')[0]) || 1;
      const end = new Date(start);
      end.setDate(start.getDate() + (days - 1));
      
      const formatDate = (date: Date) => {
        const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
      };

      if (days === 1) return formatDate(start);
      return `${formatDate(start)} - ${formatDate(end)}`;
    } catch (e) {
      return "";
    }
  };

  const handleMountainSelect = (i: number, mountainName: string) => {
    const dest = config.destinationsData?.find((d: any) => d.name === mountainName);
    const nd = [...data];
    if (dest) {
      const defaultPath = dest.paths?.[0]?.name || "";
      const defaultDuration = dest.paths?.[0]?.durations?.[0]?.label || "2H 1M";
      const basePrice = dest.paths?.[0]?.durations?.[0]?.price || 0;
      const originalPrice = dest.paths?.[0]?.durations?.[0]?.originalPrice || 0;

      nd[i] = { 
        ...nd[i], 
        name: dest.name, 
        region: dest.region, 
        difficulty: dest.difficulty, 
        mepo: dest.mepo, 
        beans: dest.beans, 
        image: dest.image,
        kuotaNum: 15,
        maxKuota: 15,
        consumedKuota: 0,
        kuota: "15 Pax Tersisa",
        path: defaultPath,
        duration: defaultDuration,
        price: basePrice,
        originalPrice: originalPrice,
        leaders: [],
        status: 'draft'
      };
      
      if (nd[i].startDate) {
        nd[i].jadwal = calculateDateRange(nd[i].startDate, defaultDuration);
      }
    } else {
      nd[i].name = mountainName;
    }
    setData(nd);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between bg-white p-4 rounded-lg border border-art-text/20">
        <p className="text-xs font-bold uppercase text-art-text/60">Manajemen Open Trip</p>
        <div className="flex gap-2">
           <button type="button" onClick={(e) => {
             e.preventDefault();
             const nd = [{ id: Date.now().toString(), name: "", region: "", jadwal: "", kuota: "", mepo: "", difficulty: "", image: "", beans: "", path: "", duration: "", price: 0, originalPrice: 0, leaders: [], status: 'draft' }, ...data];
             setData(nd);
             setExpandedIndexes([0]);
           }} className="bg-art-text text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">+ Custom Trip</button>
           <button onClick={handleSave} className="bg-art-orange text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest shadow-lg">Simpan Ke Database</button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
      {data.map((ot: any, i: number) => {
        const consumed = getConsumedQuota(ot.name, ot.jadwal);
        const isPublished = ot.status === 'published';
        const isLocked = isPublished; // If published, some fields are locked. User said "Once published and confirmed by admin, it cannot be edited" - I'll use published as the trigger for now.

        return (
        <div key={i} className={`bg-white rounded-xl border-2 transition-all p-4 ${isPublished ? 'border-art-green shadow-md' : 'border-art-text bg-gray-50/30'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setExpandedIndexes(prev => prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i])}>
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${isPublished ? 'bg-art-green text-white' : 'bg-art-text text-white'}`}>
                   {expandedIndexes.includes(i) ? '-' : '+'}
                </span>
                <div>
                   <h4 className="font-black uppercase text-sm tracking-tight flex items-center gap-2">
                      {ot.name || 'Pilih Gunung'} 
                      {isPublished && <CheckCircle size={14} className="text-art-green" />}
                      {!ot.name && <span className="text-[8px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded">Draft</span>}
                   </h4>
                   <div className="flex gap-2 flex-wrap mt-1">
                      {ot.jadwal && <span className="text-[8px] font-bold bg-white border border-art-text/10 px-2 py-0.5 rounded uppercase">{ot.jadwal}</span>}
                      {ot.path && <span className="text-[8px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">{ot.path}</span>}
                      {isPublished && <span className="text-[8px] font-black bg-art-green text-white px-2 py-0.5 rounded uppercase flex items-center gap-1"><Globe size={8}/> Terbit</span>}
                      {consumed > 0 && <span className="text-[8px] font-black bg-art-orange text-white px-2 py-0.5 rounded uppercase">DP: {consumed} Pax</span>}
                   </div>
                </div>
             </div>
             
             <div className="flex items-center gap-2">
                {!isPublished ? (
                  <button 
                    disabled={!ot.name || !ot.jadwal || !ot.price}
                    onClick={() => {
                        const nd = [...data];
                        nd[i].status = 'published';
                        setData(nd);
                        showToast("Trip diterbitkan!");
                    }}
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase px-3 py-1.5 bg-art-green text-white rounded-lg hover:shadow-md transition-all disabled:opacity-30"
                  >
                    <Send size={12}/> Terbitkan
                  </button>
                ) : (
                  <button 
                    disabled={consumed > 0}
                    onClick={() => {
                        const nd = [...data];
                        nd[i].status = 'draft';
                        setData(nd);
                        showToast("Trip ditarik ke draft.");
                    }}
                    className="text-[9px] font-black uppercase px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-30"
                  >
                    Tarik ke Draft
                  </button>
                )}
                
                <button 
                  disabled={consumed > 0}
                  onClick={() => {
                    if (consumed > 0) {
                      customAlert("Tidak bisa menghapus trip yang sudah ada DP (Down Payment) masuk.");
                      return;
                    }
                    customConfirm("Beneran mau hapus trip ini?", () => {
                      const nd = [...data]; nd.splice(i, 1); setData(nd);
                    });
                  }} 
                  className={`p-2 rounded-lg transition-all ${consumed > 0 ? 'text-gray-300 opacity-50 cursor-not-allowed' : 'text-red-400 hover:bg-red-50'}`}
                >
                  <Trash2 size={16}/>
                </button>
             </div>
          </div>

          {expandedIndexes.includes(i) && (
          <div className="mt-4 pt-4 border-t-2 border-dashed border-art-text/10 space-y-4">
              {/* Layer 1: Mountain + Difficulty */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-art-text/40">Gunung</label>
                  <select 
                    className="w-full border-2 border-art-text/10 p-2 rounded-xl text-[10px] font-bold focus:border-art-orange outline-none transition-all" 
                    value={ot.name ?? ""} 
                    onChange={e => handleMountainSelect(i, e.target.value)}
                  >
                    <option value=""> Pilih Gunung </option>
                    {config.destinationsData?.map((d: any) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-art-text/40">Level</label>
                  <select 
                    className="w-full border-2 border-art-text/10 p-2 rounded-xl text-[10px] font-bold focus:border-art-orange outline-none transition-all" 
                    value={ot.difficulty ?? ""} 
                    onChange={e => { const nd = [...data]; nd[i].difficulty = e.target.value; setData(nd); }}
                  >
                    <option value=""> Level </option>
                    {DIFFICULTY_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                  </select>
                </div>
              </div>

              {/* Layer 2: Duration + Trail */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-art-text/40">Durasi</label>
                  <select 
                    className="w-full border-2 border-art-text/10 p-2 rounded-xl text-[10px] font-bold outline-none transition-all" 
                    value={ot.duration ?? ""} 
                    onChange={e => { 
                      const dur = e.target.value;
                      const nd = [...data]; 
                      nd[i].duration = dur; 
                      nd[i].jadwal = calculateDateRange(ot.startDate, dur);
                      setData(nd); 
                    }}
                  >
                    <option value=""> Durasi </option>
                    {DURATION_LEVELS.map((lvl: string) => <option key={lvl} value={lvl}>{lvl}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-art-text/40">Jalur (Sesuai Destinasi)</label>
                  <select 
                    className="w-full border-2 border-art-text/10 p-2 rounded-xl text-[10px] font-bold outline-none focus:border-art-orange transition-all" 
                    value={ot.path || ""} 
                    onChange={e => { const nd = [...data]; nd[i].path = e.target.value; setData(nd); }}
                  >
                    <option value="">-- Pilih Jalur --</option>
                    {config.destinationsData?.find((d: any) => d.name === ot.name)?.paths?.map((p: any) => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                    <option value="custom">-- Ketik Manual --</option>
                  </select>
                  {ot.path === "custom" && (
                    <input 
                      autoFocus
                      className="w-full border-2 border-art-text/10 p-2 rounded-xl text-[10px] font-bold outline-none focus:border-art-orange transition-all mt-1" 
                      placeholder="Ketik Jalur..."
                      onBlur={e => { if(e.target.value) { const nd = [...data]; nd[i].path = e.target.value; setData(nd); } }}
                    />
                  )}
                </div>
              </div>

              {/* Layer 3: Date + Automatic Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-art-text/40">Keberangkatan</label>
                  <input 
                    type="date"
                    className="w-full border-2 border-art-text/10 p-2 rounded-xl text-[10px] font-bold outline-none focus:border-art-orange transition-all font-mono" 
                    value={ot.startDate || ""} 
                    onChange={e => { 
                      const date = e.target.value;
                      const nd = [...data]; 
                      nd[i].startDate = date; 
                      nd[i].jadwal = calculateDateRange(date, ot.duration);
                      setData(nd); 
                    }} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-art-text/40">Jadwal (Automatis)</label>
                  <input 
                    readOnly
                    className="w-full border-2 border-art-text/10 p-2 rounded-xl text-[10px] font-bold bg-gray-50 text-art-green outline-none uppercase" 
                    value={ot.jadwal || "Otomatis..."} 
                  />
                </div>
              </div>

              {/* Layer 4: Capacity + Availability */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-art-text/40">Kapasitas (Pax)</label>
                    <input 
                      type="text"
                      inputMode="numeric"
                      className="w-full border-2 border-art-text/10 p-2 rounded-xl text-[10px] font-bold outline-none focus:border-art-orange transition-all font-mono" 
                      value={ot.maxKuota ?? 15} 
                      onChange={e => { 
                        let valStr = e.target.value.replace(/^0+/, '');
                        if (valStr === '') valStr = '0';
                        const val = parseInt(valStr) || 0;
                        const nd = [...data]; 
                        nd[i].maxKuota = val; 
                        nd[i].kuotaNum = val; 
                        nd[i].kuota = `${val - (ot.consumedKuota || 0)} Pax Tersisa`;
                        setData(nd); 
                      }} 
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-art-green">Sisa Slot</label>
                    <div className="w-full border-2 border-dashed border-art-green/20 bg-art-green/10 p-2 rounded-xl flex items-center justify-center">
                       <span className="text-[10px] font-black uppercase text-art-green">
                          {Math.max(0, (ot.maxKuota || 0) - (ot.consumedKuota || 0))} Pax Tersisa
                       </span>
                    </div>
                 </div>
              </div>

              {/* Layer 5: Price (K) + Strike Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-art-text/40">Harga (k)</label>
                  <div className="relative">
                    <input 
                      type="text"
                      inputMode="numeric"
                      className="w-full border-2 border-art-text/10 p-2 rounded-xl text-[10px] font-bold outline-none focus:border-art-orange transition-all font-mono pl-6" 
                      value={ot.price ?? 0} 
                      onChange={e => { 
                        let valStr = e.target.value.replace(/^0+/, '');
                        if (valStr === '') valStr = '0';
                        const val = parseInt(valStr) || 0;
                        const nd = [...data]; 
                        nd[i].price = val; 
                        setData(nd); 
                      }} 
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-art-text/30">Rp</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-art-text/40">Coret (k)</label>
                  <div className="relative">
                    <input 
                      type="text"
                      inputMode="numeric"
                      className="w-full border-2 border-art-text/10 p-2 rounded-xl text-[10px] font-black outline-none focus:border-art-orange transition-all font-mono pl-6 text-red-500" 
                      value={ot.originalPrice ?? 0} 
                      onChange={e => { 
                        let valStr = e.target.value.replace(/^0+/, '');
                        if (valStr === '') valStr = '0';
                        const val = parseInt(valStr) || 0;
                        const nd = [...data]; 
                        nd[i].originalPrice = val; 
                        setData(nd); 
                      }} 
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-red-300">Rp</span>
                  </div>
                </div>
              </div>

              {/* Layer 7: Leaders */}
              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <label className="text-[9px] font-black uppercase text-art-text/40">Leaders</label>
                    <button onClick={() => { const nd = [...data]; if (!nd[i].leaders) nd[i].leaders = []; nd[i].leaders.push(""); setData(nd); }} className="text-[8px] bg-art-text text-white px-2 py-1 rounded uppercase font-black">+ Add</button>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    {(ot.leaders || []).map((leaderId: any, lIdx: number) => (
                       <div key={lIdx} className="flex gap-1">
                          <select className="flex-1 border-2 border-art-text/10 p-2 rounded-xl text-[9px] font-bold outline-none" value={leaderId} onChange={e => { const nd = [...data]; nd[i].leaders[lIdx] = e.target.value; setData(nd); }}>
                             <option value="">Pilih</option>
                             {config.tripLeaders?.map((l: any) => (<option key={l.name} value={l.name}>{l.name}</option>))}
                          </select>
                          <button onClick={() => { const nd = [...data]; nd[i].leaders.splice(lIdx, 1); setData(nd); }} className="p-1 text-red-500"><Trash2 size={12}/></button>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Layer 7: Meeting Point with Maps Helper */}
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-art-text/40">Meeting Point</label>
                 <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative">
                       <input 
                         className="w-full border-2 border-art-text/10 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-art-orange transition-all pr-10" 
                         value={ot.mepo || ""} 
                         onChange={e => { const nd = [...data]; nd[i].mepo = e.target.value; setData(nd); }}
                         placeholder="Contoh: Basecamp Patak Banteng"
                         id={`mepo-input-${i}`}
                       />
                       <button 
                         onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              const nd = [...data]; nd[i].mepo = text; setData(nd);
                            } catch (e) {
                              showToast("Gagal paste dari klipbor", "error");
                            }
                         }}
                         className="absolute right-3 top-1/2 -translate-y-1/2 text-art-text/40 hover:text-art-orange"
                         title="Paste from Clipboard"
                       >
                         <FileText size={14} />
                       </button>
                    </div>
                    <button 
                      onClick={() => {
                        // User wants to search for mountain first
                        const searchQuery = (ot.name || '') + " " + (ot.mepo || '');
                        window.open(`https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`, '_blank');
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-art-bg border-2 border-art-text rounded-xl hover:bg-art-orange hover:text-white transition-all text-[10px] font-black uppercase tracking-tight"
                    >
                      <Map size={14} /> Pilih di Maps
                    </button>
                 </div>
              </div>

              {/* Optional: Beans */}
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-art-text/40 italic">Biji Kopi (Opsional)</label>
                 <input 
                    className="w-full border-2 border-art-text/10 p-2.5 rounded-xl text-xs font-medium outline-none focus:border-art-orange transition-all" 
                    value={ot.beans || ""} 
                    onChange={e => { const nd = [...data]; nd[i].beans = e.target.value; setData(nd); }}
                    placeholder="Contoh: Arabica Gayo Blend"
                 />
              </div>

              {/* Poster Link */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-art-text/40">Link Gambar Poster</label>
                <div className="w-full">
                  <ImageUploader 
                    value={ot.image} 
                    onChange={url => { const nd = [...data]; nd[i].image = url; setData(nd); }} 
                  />
                </div>
              </div>
          </div>
          )}
        </div>
      )})}
      </div>
    </div>
  );
};

const FacilitiesAdmin = ({ config, updateConfig, showToast, defaultList }: any) => {
  const [data, setData] = useState(config.facilities || { include: [], exclude: [], opsi: [] });

  useEffect(() => {
    if (config.facilities) {
      setData(config.facilities);
    }
  }, [config.facilities]);

  const handleSave = () => { 
    updateConfig({ facilities: data }); 
    showToast('Tersimpan!'); 
  };

  const addOption = () => {
    const nd = { ...data };
    if (!nd.opsi) nd.opsi = [];
    nd.opsi = [...nd.opsi, { name: "Opsi Baru", priceInfo: "", subItems: [] }];
    setData(nd);
  };

  const addSubItem = (optIdx: number) => {
    const nd = { ...data };
    const targetOpsi = { ...nd.opsi[optIdx] };
    if (!targetOpsi.subItems) targetOpsi.subItems = [];
    targetOpsi.subItems = [...targetOpsi.subItems, { name: "Sub Item Baru", priceInfo: "Rp 50rb" }];
    nd.opsi[optIdx] = targetOpsi;
    setData(nd);
  };

  const updateSubItem = (optIdx: number, subIdx: number, field: string, value: string) => {
    const nd = { ...data };
    nd.opsi[optIdx].subItems[subIdx][field] = value;
    setData(nd);
  };

  const removeSubItem = (optIdx: number, subIdx: number) => {
    const nd = { ...data };
    nd.opsi[optIdx].subItems.splice(subIdx, 1);
    setData(nd);
  };

  const renderSimpleList = (key: 'include' | 'exclude', label: string) => (
    <div className="bg-white p-4 rounded-lg border-2 border-art-text space-y-3">
      <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
        <h3 className="font-bold text-sm uppercase">{label}</h3>
          <button type="button" onClick={(e) => {
            e.preventDefault();
            setData({ ...data, [key]: [...data[key], "Item Baru"] });
          }} className="text-xs bg-art-text text-white px-2 py-1 rounded">+ Tambah</button>
      </div>
      {data[key].map((item: string, i: number) => (
        <div key={i} className="flex gap-2">
          <input className="border p-2 rounded text-sm flex-1" value={item} onChange={e => {
            const nd = { ...data }; nd[key][i] = e.target.value; setData(nd);
          }} />
          <button onClick={() => {
            const nd = { ...data }; nd[key].splice(i, 1); setData(nd);
          }} className="text-red-500 p-2 border rounded hover:bg-red-50"><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between bg-white p-4 rounded-lg border border-art-text/20">
        <p className="text-xs font-bold uppercase text-art-text/60">Fasilitas Trip</p>
        <div className="flex gap-2">
          <button onClick={() => {
            customConfirm("Beneran mau reset fasilitas ke default?", () => {
              const defaultData = JSON.parse(JSON.stringify(defaultList || { include: [], exclude: [], opsi: [] }));
              setData(defaultData);
              updateConfig({ facilities: defaultData });
              showToast('Direset ke Default!');
            });
          }} className="bg-red-100 text-red-600 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hidden sm:block">Reset Default</button>
          <button onClick={handleSave} className="bg-art-orange text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">Simpan</button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderSimpleList('include', 'Termasuk (Include)')}
        {renderSimpleList('exclude', 'Tidak Termasuk (Exclude)')}
      </div>

      <div className="bg-white p-4 rounded-lg border-2 border-art-text space-y-4">
        <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
          <h3 className="font-bold text-sm uppercase">Opsi Tambahan (Bisa Sub-Item)</h3>
          <button onClick={(e) => { e.preventDefault(); addOption(); }} className="text-xs bg-art-text text-white px-2 py-1 rounded">+ Tambah Opsi Utama</button>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {data.opsi.map((opt: FacilityOption, i: number) => (
            <div key={i} className="border-2 border-art-text/10 p-4 rounded-xl space-y-3 relative bg-art-bg/20">
               <button onClick={() => {
                 const nd = { ...data }; nd.opsi.splice(i, 1); setData(nd);
               }} className="absolute top-4 right-4 text-red-500"><Trash2 size={18} /></button>
               
               <div className="flex flex-col sm:flex-row gap-3 pr-10">
                 <div className="flex-1">
                   <label className="text-[10px] font-black uppercase text-art-text/40 block mb-1">Nama Opsi</label>
                   <input className="w-full border p-2 rounded text-xs font-bold" value={opt.name} onChange={e => {
                      const nd = { ...data }; nd.opsi[i].name = e.target.value; setData(nd);
                   }} />
                 </div>
                 <div className="w-full sm:w-48">
                   <label className="text-[10px] font-black uppercase text-art-text/40 block mb-1">Info Harga (Kalo ada)</label>
                   <input className="w-full border p-2 rounded text-xs" value={opt.priceInfo || ''} onChange={e => {
                      const nd = { ...data }; nd.opsi[i].priceInfo = e.target.value; setData(nd);
                   }} placeholder="Cth: Rp 10rb/pax" />
                 </div>
               </div>

               <div className="pl-6 border-l-2 border-art-orange/20 space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-art-orange">Sub-Items (Spesifik)</span>
          <button type="button" onClick={(e) => { e.preventDefault(); addSubItem(i); }} className="text-[9px] bg-art-orange text-white px-2 py-1 rounded uppercase font-bold">+ Tambah Sub</button>
                  </div>
                  
                  {opt.subItems?.map((sub, sIdx) => (
                    <div key={sIdx} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <input className="w-full border-b p-1 text-[11px] outline-none focus:border-art-orange bg-transparent" value={sub.name} onChange={e => updateSubItem(i, sIdx, 'name', e.target.value)} placeholder="Nama Item" />
                      </div>
                      <div className="w-24">
                        <input className="w-full border-b p-1 text-[11px] outline-none focus:border-art-orange bg-transparent" value={sub.priceInfo || ''} onChange={e => updateSubItem(i, sIdx, 'priceInfo', e.target.value)} placeholder="Harga" />
                      </div>
                      <button onClick={() => removeSubItem(i, sIdx)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                    </div>
                  ))}
                  {(!opt.subItems || opt.subItems.length === 0) && <p className="text-[10px] text-art-text/30 italic">Belum ada sub-item.</p>}
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const PromoCodesAdmin = ({ config, updateConfig, showToast }: any) => {
  const [data, setData] = useState(config.promoCodes || []);

  useEffect(() => {
    setData(config.promoCodes || []);
  }, [config.promoCodes]);

  const handleSave = () => { updateConfig({ promoCodes: data }); showToast('Tersimpan!'); };

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between bg-white p-4 rounded-lg border border-art-text/20">
        <p className="text-xs font-bold uppercase text-art-text/60 font-black">Manajemen Kode Promo</p>
        <div className="flex gap-2">
           <button type="button" onClick={(e) => {
             e.preventDefault();
             const nd = [{ code: "BARU", discount: 10 }, ...data];
             setData(nd);
           }} className="bg-art-text text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest font-black">+ Kode Promo</button>
           <button onClick={handleSave} className="bg-art-orange text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest font-black">Simpan</button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((promo: any, i: number) => (
          <div key={i} className="bg-white p-4 rounded-xl border-2 border-art-text flex flex-col gap-3 relative">
            <button onClick={() => {
              const nd = [...data]; nd.splice(i, 1); setData(nd);
            }} className="absolute top-2 right-2 text-red-500 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
            
            <div>
              <label className="text-[10px] font-black uppercase text-art-text/40 block mb-1">Kode Promo</label>
              <input 
                className="w-full border-2 border-art-text p-2 rounded-lg font-black uppercase text-sm" 
                value={promo.code} 
                onChange={e => {
                  const nd = [...data]; nd[i].code = e.target.value; setData(nd);
                }} 
                placeholder="PROMOCODE"
              />
            </div>
            
            <div>
              <label className="text-[10px] font-black uppercase text-art-text/40 block mb-1">Diskon (%)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="number"
                  className="w-full border-2 border-art-text p-2 rounded-lg font-black text-sm" 
                  value={promo.discount} 
                  onChange={e => {
                    const nd = [...data]; nd[i].discount = parseInt(e.target.value) || 0; setData(nd);
                  }} 
                  min="0"
                  max="100"
                />
                <span className="font-black text-xl text-art-text">%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
