import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Trash2, Plus, GripVertical, Users, Calendar, MapPin, Coffee, Info, AlertCircle, FileText, Download } from 'lucide-react';
import { db } from './firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestore-error';
import { AppConfig, FacilityOption, DIFFICULTY_LEVELS, OpenTrip } from './useAppConfig';
import { jsPDF } from 'jspdf';

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
  const [activeTab, setActiveTab] = useState<'destinations' | 'leaders' | 'gallery' | 'cerita' | 'openTrips' | 'facilities' | 'bookings' | 'promoCodes'>('openTrips');
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 text-left text-art-text">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-art-section w-full max-w-5xl max-h-[95vh] flex flex-col rounded-2xl border-2 border-art-text relative shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-art-text bg-white">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black uppercase tracking-tight text-art-text">Admin Dashboard</h2>
            <button 
              onClick={() => {
                if (window.confirm("Beneran mau reset semua ke default global?")) {
                  revertToDefault();
                  showToast("Berhasil direset global!");
                }
              }} 
              className="text-[10px] bg-red-100 text-red-600 px-3 py-1.5 font-bold uppercase rounded-md tracking-widest hover:bg-red-200 transition-colors"
            >
              Reset ke Default
            </button>
          </div>
          <button onClick={onClose} className="p-2 hover:text-art-orange transition-colors"><X size={24} /></button>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="flex sm:flex-col gap-2 p-4 border-b sm:border-b-0 sm:border-r border-art-text bg-white overflow-x-auto sm:overflow-x-visible w-full sm:w-48 shrink-0">
            <button onClick={() => setActiveTab('bookings')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'bookings' ? 'bg-art-green text-white' : 'hover:bg-art-text/10'}`}>Daftar Booking</button>
            <div className="w-full h-px bg-art-text/10 my-2"></div>
            <button onClick={() => setActiveTab('openTrips')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'openTrips' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Open Trip (Bebas)</button>
            <button onClick={() => setActiveTab('destinations')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'destinations' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Destinasi & Durasi</button>
            <button onClick={() => setActiveTab('leaders')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'leaders' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Trip Leaders</button>
            <button onClick={() => setActiveTab('gallery')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'gallery' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Gallery</button>
            <button onClick={() => setActiveTab('facilities')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'facilities' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Fasilitas</button>
            <button onClick={() => setActiveTab('promoCodes')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'promoCodes' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Kode Promo</button>
            <button onClick={() => setActiveTab('cerita')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'cerita' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Secangkir Cerita</button>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-art-bg/50">
            {activeTab === 'bookings' && <BookingsAdmin showToast={showToast} />}
            {activeTab === 'openTrips' && <OpenTripsAdmin config={config} updateConfig={updateConfig} showToast={showToast} />}
            {activeTab === 'destinations' && <DestinationsAdmin config={config} updateConfig={updateConfig} showToast={showToast} defaultList={defaultLists.destinations} />}
            {activeTab === 'leaders' && <LeadersAdmin config={config} updateConfig={updateConfig} showToast={showToast} defaultList={defaultLists.leaders} />}
            {activeTab === 'gallery' && <GalleryAdmin config={config} updateConfig={updateConfig} showToast={showToast} defaultList={defaultLists.gallery} />}
            {activeTab === 'facilities' && <FacilitiesAdmin config={config} updateConfig={updateConfig} showToast={showToast} defaultList={defaultLists.facilities} />}
            {activeTab === 'promoCodes' && <PromoCodesAdmin config={config} updateConfig={updateConfig} showToast={showToast} />}
            {activeTab === 'cerita' && <CeritaAdmin config={config} updateConfig={updateConfig} showToast={showToast} defaultVideo={defaultLists.cerita} />}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const BookingsAdmin = ({ showToast }: any) => {
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Firestore onSnapshot error:", error);
      handleFirestoreError(error, OperationType.LIST, 'bookings');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [showToast]);

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
    if (window.confirm("Beneran mau hapus data booking ini?")) {
      try {
        await deleteDoc(doc(db, 'bookings', id));
        await syncOpenTripQuota(bookings, undefined, undefined, id);
        showToast("Booking berhasil dihapus!");
      } catch (error) {
        showToast("Gagal menghapus booking", 'error');
      }
    }
  };

  const generateInvoice = (booking: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(255, 107, 0); // Art-orange
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('INVOICE TRIP', 20, 25);
    
    doc.setFontSize(10);
    doc.text('Trip Ngopi di Ketinggian', 150, 20);
    doc.text('Tangerang, Indonesia', 150, 25);
    doc.text('WA: 0821-2753-3268', 150, 30);
    
    // Billing Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text('DITUJUKAN KEPADA:', 20, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nama: ${booking.nama}`, 20, 62);
    doc.text(`Email: ${booking.email}`, 20, 69);
    doc.text(`WhatsApp: ${booking.wa}`, 20, 76);
    
    doc.setFont('helvetica', 'bold');
    doc.text('DETAIL PESANAN:', 120, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`ID Booking: ${booking.id}`, 120, 62);
    doc.text(`Tanggal: ${new Date(booking.createdAt?.seconds * 1000).toLocaleDateString('id-ID')}`, 120, 69);
    doc.text(`Status: ${booking.status.toUpperCase()}`, 120, 76);
    
    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(20, 90, 170, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Keterangan', 25, 96);
    doc.text('Total', 160, 96);
    
    // Table Content
    doc.setFont('helvetica', 'normal');
    let y = 110;
    doc.text(`Trip ${booking.destinasi} (Via ${booking.jalur})`, 25, y); y += 7;
    doc.text(`${booking.jadwal} (${booking.durasi})`, 25, y); y += 7;
    doc.text(`${booking.peserta} Peserta`, 25, y); y += 7;
    doc.text(`Layanan: ${booking.opsionalText}`, 25, y); y += 15;
    
    // Summary
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, 190, y); y += 10;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL PEMBAYARAN:', 25, y);
    doc.text(`Rp ${booking.totalPrice?.toLocaleString('id-ID')}`, 150, y);
    
    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Terima kasih telah mempercayakan perjalanan anda kepada kami.', 20, 280);
    doc.text('Silahkan hubungi admin jika ada kendala pembayaran.', 20, 285);
    
    doc.save(`Invoice_${booking.nama.replace(/\s/g, '_')}_${booking.id.substring(0,5)}.pdf`);
    showToast("Invoice berhasil diunduh!");
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-art-orange shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-art-text/30">Destinasi & Jalur</p>
                      <p className="text-xs font-bold uppercase">{booking.destinasi} (Via {booking.jalur})</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-art-green shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-art-text/30">Jadwal & Durasi</p>
                      <p className="text-xs font-bold uppercase">{booking.jadwal} ({booking.durasi})</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Users size={16} className="text-art-text/60 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-art-text/30">Peserta & Harga</p>
                      <p className="text-xs font-bold uppercase">{booking.peserta} Orang - Total: Rp {booking.totalPrice?.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Coffee size={16} className="text-art-orange shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-art-text/30">Opsional Layanan</p>
                      <p className="text-xs font-bold uppercase truncate max-w-[200px]">{booking.opsionalText || 'Tidak ada'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-art-bg/50 p-4 rounded-xl border border-art-text/5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-art-text/30 block mb-1">Catatan Tambahan:</span>
                    <p className="text-[11px] font-medium leading-relaxed italic text-art-text/70 break-words">"{booking.deskripsi}"</p>
                  </div>
                  <span className="text-[8px] font-black uppercase text-art-text/20 mt-4 text-right">ID: {booking.id}</span>
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
            if (window.confirm("Beneran mau reset destinasi ke default?")) {
              const defaultData = JSON.parse(JSON.stringify(defaultList));
              setData(defaultData);
              updateConfig({ destinationsData: defaultData });
              showToast('Direset ke Default!');
            }
          }} className="bg-red-100 text-red-600 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hidden sm:block">Reset Default</button>
          <button onClick={() => {
             setData(JSON.parse(JSON.stringify(config.destinationsData)));
             if (config.visibilities) setVisibilities(config.visibilities);
             setExpandedIndexes([]);
             showToast('Di-reset ke data tersimpan terakhir!');
          }} className="bg-gray-100 text-gray-600 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hidden sm:block">Batal</button>
          <button onClick={() => {
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
            <button 
              onClick={() => {
                const nd = [...data];
                if (!nd[i].paths) nd[i].paths = [];
                nd[i].paths.push({ name: "Jalur Baru", durations: [{ label: "1H (Tektok)", price: 0, originalPrice: 0 }] });
                setData(nd);
                if (!expandedIndexes.includes(i)) setExpandedIndexes([...expandedIndexes, i]);
              }}
              className="text-[10px] bg-art-text text-white px-3 py-1.5 rounded whitespace-nowrap hidden sm:block"
            >+ Jalur</button>
            <button onClick={() => {
               const nd = [...data]; nd.splice(i, 1); setData(nd);
            }} className="text-red-500 hover:text-red-600 hidden sm:block"><Trash2 size={16}/></button>
          </div>

          {expandedIndexes.includes(i) && (
          <div className="grid gap-4 mt-4">
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
            
            <button 
              onClick={() => {
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
                  <button onClick={() => {
                    const nd = [...data];
                    nd[i].paths[pIdx].durations.push({ label: "1H (Tektok)", price: 0, originalPrice: 0 });
                    setData(nd);
                  }} className="text-[10px] bg-blue-500 text-white px-2 py-1.5 rounded whitespace-nowrap">+ Durasi</button>
                </div>
                
                <div className="pl-0 sm:pl-14 space-y-2">
                  {path.durations.map((dur: any, j: number) => (
                    <div key={j} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <select className="border p-2 rounded text-xs w-full sm:flex-1" value={dur.label} onChange={e => {
                        const nd = [...data];
                        nd[i].paths[pIdx].durations[j].label = e.target.value;
                        setData(nd);
                      }}>
                        <option value="">-- Pilih Durasi --</option>
                        {durationLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                      </select>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative">
                          <input type="number" className="border p-2 rounded text-xs w-24 flex-1 sm:flex-none" value={dur.originalPrice} onChange={e => {
                            const nd = [...data];
                            nd[i].paths[pIdx].durations[j].originalPrice = parseInt(e.target.value) || 0;
                            setData(nd);
                          }} placeholder="Coret" />
                          <span className="absolute -top-3 left-0 text-[8px] font-bold text-art-text/40 bg-white px-1">Harga Coret (K)</span>
                        </div>
                        <div className="relative">
                          <input type="number" className="border p-2 rounded text-xs w-24 flex-1 sm:flex-none" value={dur.price} onChange={e => {
                            const nd = [...data];
                            nd[i].paths[pIdx].durations[j].price = parseInt(e.target.value) || 0;
                            setData(nd);
                          }} placeholder="Final" />
                          <span className="absolute -top-3 left-0 text-[8px] font-bold text-art-orange/60 bg-white px-1">Harga Final (K)</span>
                        </div>
                        <button onClick={() => {
                          const nd = [...data];
                          nd[i].paths[pIdx].durations.splice(j, 1);
                          setData(nd);
                        }} className="text-red-500 p-2 border rounded hover:bg-red-50 bg-white"><Trash2 size={16} /></button>
                      </div>
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
              <img src={url} className="w-full h-full object-cover" />
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
            if (window.confirm("Beneran mau reset leaders ke default?")) {
              const defaultData = JSON.parse(JSON.stringify(defaultList));
              setData(defaultData);
              updateConfig({ tripLeaders: defaultData });
              showToast('Direset ke Default!');
            }
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
            <input className="border p-2 rounded text-xs w-full mb-2 block" value={leader.avatar} onChange={e => {
                  setData(prev => prev.map((item, idx) => idx === i ? { ...item, avatar: e.target.value } : item));
            }} placeholder="URL Foto URL" />
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
            if (window.confirm("Beneran mau reset gallery ke default?")) {
              const defaultData = JSON.parse(JSON.stringify(defaultList));
              setData(defaultData);
              updateConfig({ galleryPhotos: defaultData });
              showToast('Direset ke Default!');
            }
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
            <img src={photo.src} className="w-full h-32 object-cover rounded" />
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
            if (window.confirm("Beneran mau reset cerita ke default?")) {
              setUrl(defaultVideo);
              updateConfig({ ceritaVideoUrl: defaultVideo });
              showToast('Direset ke Default!');
            }
          }} className="bg-red-100 text-red-600 px-4 py-3 rounded text-xs font-bold uppercase tracking-widest hidden sm:block">Reset Default</button>
          <button onClick={handleSave} className="bg-art-orange text-white px-4 py-3 rounded text-xs font-bold uppercase tracking-widest">Simpan Perubahan</button>
        </div>
       </div>
    </div>
  )
};


const OpenTripsAdmin = ({ config, updateConfig, showToast }: any) => {
  const [data, setData] = useState<OpenTrip[]>(config.openTrips || []);
  const [expandedIndexes, setExpandedIndexes] = useState<number[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

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
        kuota: "15 Pax Tersisa",
        path: defaultPath,
        duration: defaultDuration
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
        <p className="text-xs font-bold uppercase text-art-text/60">Custom Trip (Open Trip)</p>
        <div className="flex gap-2">
           <button onClick={() => {
             const nd = [{ id: Date.now().toString(), name: "", region: "", jadwal: "", kuota: "", mepo: "", difficulty: "", image: "", beans: "", path: "", duration: "", price: 0, originalPrice: 0 }, ...data];
             setData(nd);
             setExpandedIndexes([0]);
           }} className="bg-art-text text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">+ Custom Trip</button>
           <button onClick={handleSave} className="bg-art-orange text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">Simpan</button>
        </div>
      </div>
      {data.map((ot: any, i: number) => (
        <div key={i} className="bg-white p-4 rounded-lg border-2 border-art-text space-y-3 relative overflow-hidden transition-all">
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <button 
              onClick={() => { const nd = [...data]; nd.splice(i, 1); setData(nd); }} 
              className="text-red-500 hover:bg-red-50 p-2 rounded"
            >
              <Trash2 size={16}/>
            </button>
          </div>
          
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpandedIndexes(prev => prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i])}>
             <span className="font-black text-xl w-6 text-center">{expandedIndexes.includes(i) ? '-' : '+'}</span>
             <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
                <span className="text-sm font-black uppercase tracking-tight">{ot.name || 'Gunung Belum Dipilih'}</span>
                {ot.jadwal && <span className="text-[10px] font-bold bg-art-green/10 text-art-green px-2 py-0.5 rounded uppercase">{ot.jadwal}</span>}
                {ot.path && <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">{ot.path}</span>}
                {ot.region && <span className="text-[8px] font-black uppercase text-art-text/40 tracking-widest bg-gray-100 px-1.5 py-0.5 rounded ml-auto">{ot.region}</span>}
             </div>
          </div>

          {expandedIndexes.includes(i) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-8 pt-4 border-t border-dashed border-art-text/10 mt-4">
            <div className="flex flex-col sm:col-span-2">
               <span className="text-[10px] uppercase font-bold mb-1 opacity-50">Provinsi / Wilayah</span>
               <select className="border p-2 rounded text-sm font-bold" value={ot.region} onChange={e => { const nd = [...data]; nd[i].region = e.target.value; setData(nd); }}>
                  <option value="">-- Pilih Provinsi --</option>
                  {INDONESIA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
               </select>
            </div>
            <div className="flex flex-col sm:col-span-2">
              <span className="text-[10px] uppercase font-bold mb-1 opacity-50">Gunung Tujuan</span>
              <select className="border p-2 rounded text-sm font-bold bg-gray-50" value={ot.name} onChange={e => handleMountainSelect(i, e.target.value)}>
                <option value="">-- Pilih Gunung --</option>
                {config.destinationsData?.map((d: any) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold mb-1 opacity-50">Tanggal Mulai</span>
              <input 
                type="date"
                className="border p-2 rounded text-sm font-bold" 
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
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold mb-1 opacity-50">Jadwal Keberangkatan (Display)</span>
              <input className="border p-2 rounded text-sm bg-gray-50 font-bold" value={ot.jadwal} readOnly placeholder="Otomatis (cth: 15-16 Ags)" />
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] uppercase font-bold mb-1 opacity-50">Meeting Point</span>
               <input className="border p-2 rounded text-sm" value={ot.mepo} onChange={e => { const nd = [...data]; nd[i].mepo = e.target.value; setData(nd); }} placeholder="Meeting Point" />
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] uppercase font-bold mb-1 opacity-50">Trip Leader</span>
               <input className="border p-2 rounded text-sm" value={ot.leader || ''} onChange={e => { const nd = [...data]; nd[i].leader = e.target.value; setData(nd); }} placeholder="Trip Leader" />
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] uppercase font-bold mb-1 opacity-50">Beans (Biji Kopi)</span>
               <input className="border p-2 rounded text-sm" value={ot.beans} onChange={e => { const nd = [...data]; nd[i].beans = e.target.value; setData(nd); }} placeholder="Beans" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold mb-1 opacity-50">Kuota Maksimal (Kapasitas Tolal)</span>
              <div className="flex items-center gap-2">
                <input 
                  className="w-20 border p-2 rounded text-sm font-bold border-art-orange/30" 
                  type="number" 
                  value={ot.maxKuota || ot.kuotaNum || 15} 
                  onChange={e => { 
                    const num = parseInt(e.target.value) || 0;
                    const nd = [...data]; 
                    nd[i].maxKuota = num; 
                    nd[i].kuotaNum = num; // Fallback sync
                    nd[i].kuota = `${num - getConsumedQuota(ot.name, ot.jadwal)} Pax Tersisa`;
                    setData(nd); 
                  }} 
                />
                <div className="flex-1 bg-art-orange/5 border border-art-orange/20 p-2 rounded flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase text-art-orange">Terisi: {getConsumedQuota(ot.name, ot.jadwal)}</span>
                  <span className="text-[10px] font-bold uppercase text-art-green">Sisa: {(ot.maxKuota || ot.kuotaNum || 15) - getConsumedQuota(ot.name, ot.jadwal)}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold mb-1 opacity-50">Tampilan Kuota (Otomatis)</span>
              <input className="border p-2 rounded text-sm bg-gray-50 font-bold text-art-green" value={`${(ot.maxKuota || ot.kuotaNum || 15) - getConsumedQuota(ot.name, ot.jadwal)} Pax Tersisa`} readOnly />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold mb-1 opacity-50">Kesulitan</span>
              <select className="border p-2 rounded text-sm font-bold" value={ot.difficulty} onChange={e => { const nd = [...data]; nd[i].difficulty = e.target.value; setData(nd); }}>
                <option value="">-- Pilih Kesulitan --</option>
                {DIFFICULTY_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold mb-1 opacity-50">Jalur (Via)</span>
              <select className="border p-2 rounded text-sm disabled:bg-gray-100" value={ot.path} onChange={e => { const nd = [...data]; nd[i].path = e.target.value; setData(nd); }} disabled={!ot.name}>
                <option value="">-- Pilih Jalur --</option>
                {ot.name && config.destinationsData?.find((d: any) => d.name === ot.name)?.paths?.map((p: any) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold mb-1 opacity-50">Durasi</span>
              <select className="border p-2 rounded text-sm" value={ot.duration} onChange={e => { 
                  const dur = e.target.value;
                  const nd = [...data]; 
                  nd[i].duration = dur; 
                  nd[i].jadwal = calculateDateRange(ot.startDate, dur);
                  setData(nd); 
                }}>
                <option value="">-- Pilih Durasi --</option>
                {durationLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold mb-1 opacity-50">Harga Akhir (K)</span>
              <input className="border p-2 rounded text-sm font-black text-art-orange" type="number" value={ot.price} onChange={e => { const nd = [...data]; nd[i].price = parseInt(e.target.value) || 0; setData(nd); }} placeholder="Harga Akhir (k)" />
              <p className="text-[8px] text-art-text/50">Contoh: 1500 = 1,5 Juta</p>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold mb-1 opacity-50">Harga Coret (K)</span>
              <input className="border p-2 rounded text-sm" type="number" value={ot.originalPrice} onChange={e => { const nd = [...data]; nd[i].originalPrice = parseInt(e.target.value) || 0; setData(nd); }} placeholder="Harga Coret (k)" />
            </div>
            <div className="flex flex-col sm:col-span-2">
              <span className="text-[10px] uppercase font-bold mb-1 opacity-50">URL Gambar Banner</span>
              <input className="border p-2 rounded text-sm" value={ot.image} onChange={e => { const nd = [...data]; nd[i].image = e.target.value; setData(nd); }} placeholder="URL Gambar" />
            </div>
          </div>
          )}
        </div>
      ))}
    </div>
  )
}

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
        <button onClick={() => setData({ ...data, [key]: [...data[key], "Item Baru"] })} className="text-xs bg-art-text text-white px-2 py-1 rounded">+ Tambah</button>
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
            if (window.confirm("Beneran mau reset fasilitas ke default?")) {
              const defaultData = JSON.parse(JSON.stringify(defaultList || { include: [], exclude: [], opsi: [] }));
              setData(defaultData);
              updateConfig({ facilities: defaultData });
              showToast('Direset ke Default!');
            }
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
          <button onClick={addOption} className="text-xs bg-art-text text-white px-2 py-1 rounded">+ Tambah Opsi Utama</button>
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
                    <button onClick={() => addSubItem(i)} className="text-[9px] bg-art-orange text-white px-2 py-1 rounded uppercase font-bold">+ Tambah Sub</button>
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
           <button onClick={() => {
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
