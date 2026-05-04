import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { uploadFile } from './lib/storage-utils';
import { X, Trash2, Plus, GripVertical, Users, Calendar, MapPin, Coffee, Info, AlertCircle, FileText, Download, CheckCircle, Send, Globe } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from './firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestore-error';
import { AppConfig, FacilityOption, DIFFICULTY_LEVELS, OpenTrip, WEBSITE_VERSION } from './useAppConfig';
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
  
  if (!isOpen) return null;

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
                    customConfirm("Kembalikan semua pengaturan ke awal (factory reset)?", () => {
                      revertToDefault();
                      showToast("Direset ke default!");
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
    if (!user || user.email !== 'mrachmanfm@gmail.com') {
      setLoading(false);
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
        .filter(b => b.type === 'open' && b.destinasi === ot.name && b.jadwal === ot.jadwal && (b.status === 'dp' || b.status === 'lunas'))
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
    doc.text(`#${booking.id.substring(0, 8).toUpperCase()}`, 140, 30);
    doc.setFontSize(9);
    doc.text(`TANGGAL: ${new Date(booking.createdAt?.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 140, 38);

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

    // Optional Services detailed
    if (booking.opsionalItems && booking.opsionalItems.length > 0) {
      booking.opsionalItems.forEach((item: any) => {
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`(+) ${item.name}`, 25, currentY);
        doc.text(`${item.count || 1} UNIT`, 130, currentY);
        doc.text(`Rp ${item.price.toLocaleString('id-ID')}`, 160, currentY);
        currentY += 6;
      });
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(10);
    } else if (booking.opsionalText) {
      doc.setFontSize(9);
      doc.text(`(+) LAYANAN TAMBAHAN: ${booking.opsionalText}`, 25, currentY);
      doc.text(`Rp ${(booking.opsionalPrice || 0).toLocaleString('id-ID')}`, 160, currentY);
      currentY += 8;
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
    doc.setFillColor(isLunas ? successColor[0] : accentColor[0], isLunas ? successColor[1] : accentColor[1], isLunas ? successColor[2] : accentColor[2]);
    doc.rect(20, currentY, 40, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(isLunas ? 'LUNAS' : booking.status.toUpperCase(), 40, currentY + 6.5, { align: 'center' });

    // Payment Info
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(9);
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
    
    doc.save(`Kuitansi_${booking.nama.replace(/\s/g, '_')}_${booking.id.substring(0,5)}.pdf`);
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
                    <div className="flex items-center gap-2 text-[10px] font-bold text-art-text/40 uppercase">
                      <span>{booking.type === 'open' ? '🟢 Open Trip' : '🔵 Private Trip'}</span>
                      <span>•</span>
                      <span>{booking.wa}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => generateInvoice(booking)}
                    className="p-2 border-2 border-blue-100 text-blue-500 rounded-xl hover:bg-blue-50 transition-colors"
                    title="Download Invoice"
                  >
                    <Download size={16} />
                  </button>
                  <select 
                    value={booking.status} 
                    onChange={(e) => handleStatusUpdate(booking.id, e.target.value)}
                    className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl outline-none cursor-pointer border-2 transition-all ${
                      booking.status === 'lunas' ? 'bg-art-green text-white border-art-green' : 
                      booking.status === 'dp' ? 'bg-art-orange text-white border-art-orange' :
                      booking.status === 'batal' ? 'bg-red-500 text-white border-red-500' : 
                      'bg-white border-art-text'
                    }`}
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="dp">💰 DP Masuk</option>
                    <option value="lunas">💳 Lunas</option>
                    <option value="batal">❌ Batal</option>
                  </select>
                  <button onClick={() => handleDelete(booking.id)} className="p-2 border-2 border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-2">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-art-orange shrink-0" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-art-text/30">Destinasi</p>
                        <p className="text-xs font-bold uppercase">{booking.destinasi} (Via {booking.jalur})</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-art-green shrink-0" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-art-text/30">Jadwal</p>
                        <p className="text-xs font-bold uppercase">{booking.jadwal} ({booking.durasi})</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-art-bg/30 p-4 rounded-2xl border-2 border-art-text/5">
                    <p className="text-[10px] font-black uppercase text-art-text/40 mb-2">Rincian Layanan & Promo</p>
                    <div className="space-y-2">
                       <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-art-text/60 uppercase">Paket Trip ({booking.peserta} Pax)</span>
                          <span className="font-black">Rp {((booking.totalPrice || 0) + (booking.discountAmount || 0) - (booking.opsionalPrice || 0)).toLocaleString('id-ID')}</span>
                       </div>
                       
                       {booking.opsionalItems && booking.opsionalItems.length > 0 ? (
                         booking.opsionalItems.map((item: any, idx: number) => (
                           <div key={idx} className="flex justify-between items-center text-[10px] pl-3 border-l-2 border-art-orange/30">
                             <span className="text-art-text/50 font-bold uppercase">+ {item.name} ({item.count || 1}x)</span>
                             <span className="font-bold text-art-orange">Rp {item.price.toLocaleString('id-ID')}</span>
                           </div>
                         ))
                       ) : booking.opsionalText && (
                         <div className="text-[10px] text-art-text/40 italic pl-3 border-l-2 border-art-orange/30">
                            Layanan: {booking.opsionalText}
                         </div>
                       )}

                       {booking.promoCode && (
                         <div className="flex justify-between items-center text-[10px] bg-red-50 p-2 rounded-xl border border-red-100 mt-2">
                           <span className="text-red-500 font-black uppercase">Promo: {booking.promoCode}</span>
                           <span className="font-black text-red-600">- Rp {booking.discountAmount?.toLocaleString('id-ID')}</span>
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-art-text/30">Status & Catatan</p>
                      <div className="flex items-center gap-2 mb-2">
                         <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            booking.status === 'lunas' ? 'bg-art-green text-white' : 
                            booking.status === 'dp' ? 'bg-art-orange text-white' : 
                            'bg-gray-100 text-art-text/40'
                         }`}>{booking.status}</div>
                         <span className="text-[10px] font-bold text-art-text/40">Dipesan: {new Date(booking.createdAt?.seconds * 1000).toLocaleDateString('id-ID')}</span>
                      </div>
                      <p className="text-[10px] font-medium italic text-art-text/60 leading-relaxed break-words bg-white border border-art-text/5 p-2 rounded-lg">"{booking.deskripsi || 'Tidak ada catatan.'}"</p>
                   </div>

                   <div className="mt-4 pt-4 border-t border-art-text/5 flex justify-between items-end">
                      <div>
                         <p className="text-[10px] font-black uppercase text-art-text/30">Total Tagihan</p>
                         <p className="text-2xl font-black text-art-text tracking-tighter">Rp {booking.totalPrice?.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] font-bold text-art-text/30 uppercase mb-0.5">Booking ID</p>
                         <p className="text-[10px] font-bold text-art-text/20 uppercase font-mono">{booking.id.substring(0,8)}</p>
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
            
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center mb-2">
              <span className="text-xs font-bold w-16">Region:</span>
              <input className="border p-2 rounded text-xs w-full sm:w-32" value={dest.region || 'Jawa'} onChange={e => {
                const nd = [...data];
                nd[i].region = e.target.value;
                setData(nd);
              }} placeholder="Contoh: Jawa Tengah" />
              
              <span className="text-xs font-bold w-12 sm:ml-4">Kuota:</span>
              <input className="border p-2 rounded text-xs w-full sm:flex-1" value={dest.kuota} onChange={e => {
                const nd = [...data];
                nd[i].kuota = e.target.value;
                setData(nd);
              }} placeholder="Contoh: Min 2 - Max 12 Pax" />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center mb-2">
              <span className="text-xs font-bold w-16">Mepo:</span>
              <input className="border p-2 rounded text-xs w-full sm:flex-1" value={dest.mepo || ''} onChange={e => {
                const nd = [...data];
                nd[i].mepo = e.target.value;
                setData(nd);
              }} placeholder="Meeting Point (Contoh: Basecamp)" />
              
              <span className="text-xs font-bold w-12 sm:ml-4">Beans:</span>
              <input className="border p-2 rounded text-xs w-full sm:flex-1" value={dest.beans || ''} onChange={e => {
                const nd = [...data];
                nd[i].beans = e.target.value;
                setData(nd);
              }} placeholder="Biji Kopi (Contoh: Arabica Blend)" />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center mb-2">
              <span className="text-xs font-bold w-16">Kesulitan:</span>
              <select className="border p-2 rounded text-xs w-full sm:flex-1" value={dest.difficulty || ''} onChange={e => {
                const nd = [...data];
                nd[i].difficulty = e.target.value;
                setData(nd);
              }}>
                <option value="">-- Pilih Kesulitan --</option>
                {DIFFICULTY_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>
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
                      <input type="number" className="border p-2 rounded text-xs w-20" value={dur.originalPrice} onChange={e => {
                            const nd = [...data];
                            nd[i].paths[pIdx].durations[j].originalPrice = parseInt(e.target.value) || 0;
                            setData(nd);
                          }} placeholder="Coret" />
                      <input type="number" className="border p-2 rounded text-xs w-20" value={dur.price} onChange={e => {
                            const nd = [...data];
                            nd[i].paths[pIdx].durations[j].price = parseInt(e.target.value) || 0;
                            setData(nd);
                          }} placeholder="Final" />
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

  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(config.tripLeaders)) {
      setData(JSON.parse(JSON.stringify(config.tripLeaders)));
    }
  }, [config.tripLeaders]);

  const handleSave = () => {
    updateConfig({ tripLeaders: data });
    showToast('Disimpan!');
  };

  return (
    <div className="space-y-6">
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
          <div key={i} className="bg-white p-4 rounded-lg border-2 border-art-text relative">
            <button onClick={() => {
              const nd = [...data];
              nd.splice(i, 1);
              setData(nd);
            }} className="absolute top-4 right-4 text-red-500"><Trash2 size={16}/></button>
            <div className="flex gap-2 mb-2 w-full pr-8">
              <input className="border p-2 rounded text-sm font-bold w-1/2 block" value={leader.name} onChange={e => {
                    setData(prev => prev.map((item, idx) => idx === i ? { ...item, name: e.target.value } : item));
              }} placeholder="Nama" />
              <input className="border p-2 rounded text-sm font-bold w-1/2 block" value={leader.age || ''} onChange={e => {
                    setData(prev => prev.map((item, idx) => idx === i ? { ...item, age: e.target.value } : item));
              }} placeholder="Pengalaman (cth: Pengalaman 10+ Tahun)" />
            </div>
            <input className="border p-2 rounded text-xs w-full mb-2 block" value={leader.description} onChange={e => {
                  setData(prev => prev.map((item, idx) => idx === i ? { ...item, description: e.target.value } : item));
            }} placeholder="Deskripsi" />
            <div className="mb-2">
              <ImageUploader value={leader.avatar} onChange={url => {
                  setData(prev => prev.map((item, idx) => idx === i ? { ...item, avatar: url } : item));
              }} placeholder="URL Foto Foto" />
            </div>
            <input className="border p-2 rounded text-xs w-full mb-2 block border-blue-300 bg-blue-50" value={leader.voiceLine || ''} onChange={e => {
                  setData(prev => prev.map((item, idx) => idx === i ? { ...item, voiceLine: e.target.value } : item));
            }} placeholder="URL Voice Audio (Dari Firebase Storage / URL)" />
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

  const handleSave = () => {
    updateConfig({ ceritaVideoUrl: url });
    showToast('Disimpan!');
  };

  return (
     <div className="space-y-6">
       <div className="flex flex-col gap-4 bg-white p-6 rounded-lg border-2 border-art-text">
        <p className="font-bold">URL Video Secangkir Cerita</p>
        <input className="border-2 border-art-text p-3 rounded" value={url} onChange={e => setUrl(e.target.value)} placeholder="Misal: https://www.youtube.com/embed/..." />
        <p className="text-xs text-art-text/60">Gunakan link embed YouTube atau file MP4 yang didukung.</p>
        <div className="flex gap-2 w-fit">
          <button onClick={() => {
            customConfirm("Beneran mau reset cerita ke default?", () => {
              setUrl(defaultVideo);
              updateConfig({ ceritaVideoUrl: defaultVideo });
              showToast('Direset ke Default!');
            });
          }} className="bg-red-100 text-red-600 px-4 py-3 rounded text-xs font-bold uppercase tracking-widest hidden sm:block">Reset Default</button>
          <button onClick={handleSave} className="bg-art-orange text-white px-4 py-3 rounded text-xs font-bold uppercase tracking-widest">Simpan Perubahan</button>
        </div>
       </div>
    </div>
  )
};

const HomepageAdmin = ({ config, updateConfig, showToast }: any) => {
  const [data, setData] = useState({ ...config.homepage, heroSlides: config.homepage.heroSlides || [] });

  const handleSave = () => {
    updateConfig({ homepage: data });
    showToast('Homepage Tersimpan!');
  };

  return (
    <div className="bg-white p-4 rounded-lg border-2 border-art-text space-y-8">
      <div className="space-y-4">
        <h3 className="font-bold text-sm uppercase">Edit Teks Homepage</h3>
        <input className="w-full border p-2 rounded" value={data.heroTitle || ''} onChange={e => setData({...data, heroTitle: e.target.value})} placeholder="Hero Title" />
        <input className="w-full border p-2 rounded" value={data.heroDescription || ''} onChange={e => setData({...data, heroDescription: e.target.value})} placeholder="Hero Description" />
        <div className="space-y-2">
          <label className="text-xs font-bold">Link Foto Latar Belakang Hero</label>
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
    if (!user || user.email !== 'mrachmanfm@gmail.com') {
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
      .filter(b => b.type === 'open' && b.destinasi === name && b.jadwal === jadwal && (b.status === 'dp' || b.status === 'lunas'))
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
      
      const formatDay = (date: Date) => date.getDate();
      const formatMonth = (date: Date) => {
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
        return months[date.getMonth()];
      };

      if (start.getMonth() === end.getMonth()) {
        if (days === 1) return `${formatDay(start)} ${formatMonth(start)}`;
        return `${formatDay(start)}-${formatDay(end)} ${formatMonth(start)}`;
      } else {
        return `${formatDay(start)} ${formatMonth(start)} - ${formatDay(end)} ${formatMonth(end)}`;
      }
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
        kuota: "15 Pax Tersisa",
        path: defaultPath,
        duration: defaultDuration,
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
             const nd = [{ id: Date.now().toString(), name: "", region: "", jadwal: "", kuota: "", mepo: "", difficulty: "", image: "", beans: "", path: "", duration: "", price: 0, originalPrice: 0, status: 'draft' }, ...data];
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
                      {ot.path && <span className="text-[8px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">Via {ot.path}</span>}
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
             {/* Layer 1: Destination Mountain */}
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-art-text/40">Destinasi Gunung {isLocked && <span className="text-red-500">(Terkunci)</span>}</label>
                <select 
                  disabled={isLocked}
                  className="w-full border-2 border-art-text/10 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-art-orange transition-all disabled:bg-gray-100" 
                  value={ot.name ?? ""} 
                  onChange={e => handleMountainSelect(i, e.target.value)}
                >
                  <option value="">-- Pilih Gunung --</option>
                  {config.destinationsData?.map((d: any) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
             </div>

             {/* Layer 2: Difficulty & Duration */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-art-text/40">Tingkat Kesulitan</label>
                   <select 
                      className="w-full border-2 border-art-text/10 p-2.5 rounded-xl text-xs font-bold focus:border-art-orange outline-none transition-all" 
                      value={ot.difficulty ?? ""} 
                      onChange={e => { const nd = [...data]; nd[i].difficulty = e.target.value; setData(nd); }}
                   >
                     <option value="">-- Pilih Kesulitan --</option>
                     {DIFFICULTY_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-art-text/40">Durasi Perjalanan</label>
                   <select 
                      className="w-full border-2 border-art-text/10 p-2.5 rounded-xl text-xs font-bold outline-none transition-all" 
                      value={ot.duration ?? ""} 
                      onChange={e => { 
                        const dur = e.target.value;
                        const nd = [...data]; 
                        nd[i].duration = dur; 
                        nd[i].jadwal = calculateDateRange(ot.startDate, dur);
                        setData(nd); 
                      }}
                    >
                     <option value="">-- Pilih Durasi --</option>
                     {durationLevels.map((lvl: string) => <option key={lvl} value={lvl}>{lvl}</option>)}
                   </select>
                </div>
             </div>

             {/* Layer 3: Path & Start Date */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-art-text/40">Jalur Pendakian {isLocked && <span className="text-red-500">(Terkunci)</span>}</label>
                   <select 
                     disabled={isLocked}
                     className="w-full border-2 border-art-text/10 p-2.5 rounded-xl text-xs font-bold disabled:bg-gray-100 outline-none transition-all" 
                     value={ot.path ?? ""} 
                     onChange={e => { const nd = [...data]; nd[i].path = e.target.value; setData(nd); }}
                   >
                     <option value="">-- Pilih Jalur --</option>
                     {ot.name && config.destinationsData?.find((d: any) => d.name === ot.name)?.paths?.map((p: any) => (
                       <option key={p.name} value={p.name}>{p.name}</option>
                     ))}
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-art-text/40">Tanggal Keberangkatan {isLocked && <span className="text-red-500">(Terkunci)</span>}</label>
                   <input 
                    type="date"
                    disabled={isLocked}
                    className="w-full border-2 border-art-text/10 p-2.5 rounded-xl text-xs font-bold outline-none disabled:bg-gray-100 transition-all font-mono" 
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
             </div>

             {/* Layer 4: Schedule Preview */}
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-art-text/40 italic">Jadwal Tampilan (Generate Otomatis)</label>
                <div className="p-3 border-2 border-art-text/5 bg-art-green/5 text-art-green font-black uppercase text-[11px] rounded-xl flex items-center">{ot.jadwal || "Belum ada jadwal yang terbentuk"}</div>
             </div>

             {/* Layer 5: Quota Management */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-art-text/40">Kuota Peserta Maksimal</label>
                   <input className="w-full border-2 border-art-orange/20 p-2.5 rounded-xl font-bold text-xs outline-none focus:border-art-orange transition-all" type="number" value={ot.maxKuota || ot.kuotaNum || 15} onChange={e => { 
                      const num = parseInt(e.target.value) || 0;
                      const nd = [...data]; 
                      nd[i].maxKuota = num; 
                      nd[i].kuotaNum = num;
                      nd[i].kuota = `${num - consumed} Pax Tersisa`;
                      setData(nd); 
                   }} />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-art-text/40">Status Ketersediaan</label>
                   <div className="flex items-center gap-3 h-[42px] bg-art-bg/20 rounded-xl px-3 border-2 border-transparent">
                      <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
                        <div className="h-full bg-art-orange" style={{ width: `${Math.min(100, (consumed / (ot.maxKuota || 15)) * 100)}%` }}></div>
                      </div>
                      <span className="text-[10px] font-black text-art-text uppercase whitespace-nowrap">{consumed} / {ot.maxKuota || 15} TERISI</span>
                   </div>
                </div>
             </div>

             {/* Layer 6: Pricing Layer */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-art-text/40">Harga Fix (Per Pax dalam Ribuan)</label>
                   <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-art-text/30">Rp</span>
                      <input className="w-full border-2 border-art-text/10 p-2.5 pl-8 rounded-xl font-black text-art-orange text-sm outline-none focus:border-art-orange transition-all" type="number" value={ot.price || ''} onChange={e => { const nd = [...data]; nd[i].price = parseInt(e.target.value) || 0; setData(nd); }} placeholder="Cth: 1500" />
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-art-text/40">Harga Sebelum Diskon (Jika Ada)</label>
                   <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-art-text/30">Rp</span>
                      <input className="w-full border-2 border-art-text/10 p-2.5 pl-8 rounded-xl text-sm text-art-text/40 outline-none focus:border-art-orange transition-all" type="number" value={ot.originalPrice || ''} onChange={e => { const nd = [...data]; nd[i].originalPrice = parseInt(e.target.value) || 0; setData(nd); }} placeholder="Cth: 1900" />
                   </div>
                </div>
             </div>

             {/* Layer 7: Grouped Metadata */}
             <div className="bg-art-bg/20 p-4 rounded-2xl border-2 border-art-text/5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-art-text/40">Kopi (Beans)</label>
                   <input className="w-full border-transparent bg-white/50 p-2 rounded-lg text-[11px] font-bold outline-none focus:bg-white" value={ot.beans || ''} onChange={e => { const nd = [...data]; nd[i].beans = e.target.value; setData(nd); }} placeholder="Arabica Blend" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-art-text/40">Mepo</label>
                   <input className="w-full border-transparent bg-white/50 p-2 rounded-lg text-[11px] font-bold outline-none focus:bg-white" value={ot.mepo || ''} onChange={e => { const nd = [...data]; nd[i].mepo = e.target.value; setData(nd); }} placeholder="Meeting Point" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-art-text/40">Trip Leader</label>
                   <input className="w-full border-transparent bg-white/50 p-2 rounded-lg text-[11px] font-bold outline-none focus:bg-white" value={ot.leader || ''} onChange={e => { const nd = [...data]; nd[i].leader = e.target.value; setData(nd); }} placeholder="Nama Pendamping" />
                </div>
             </div>

             {/* Layer 8: Photo Attachment */}
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-art-text/40">Link Poster Perjalanan</label>
                <input className="w-full border-2 border-art-text/5 p-2.5 rounded-xl text-[11px] italic text-blue-600 bg-white shadow-inner outline-none focus:border-art-orange transition-all" value={ot.image || ''} onChange={e => { const nd = [...data]; nd[i].image = e.target.value; setData(nd); }} placeholder="Masukan link URL foto poster" />
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
