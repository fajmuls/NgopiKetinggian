import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Coffee, Map, Calendar, Users, ChevronRight, Tent, Mountain, CheckCircle2, User, Camera, X, PlusCircle, LogIn, LogOut, Menu } from 'lucide-react';
import { useSound } from './hooks/useSound';
import React, { useState, useEffect } from 'react';
import { auth, loginWithGoogle, logout } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

function Button({ children, className = '', variant = 'primary', onClick, ...props }: any) {
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

const BookingModal = ({ isOpen, onClose, destinationOptions, prefill }: { isOpen: boolean, onClose: () => void, destinationOptions?: any[], prefill?: { destinasi: string, durasi: string } }) => {
  const { playClick, playHover } = useSound();
  const [showSuccess, setShowSuccess] = useState(false);
  const [user] = useAuthState(auth);

  const [rentEquipment, setRentEquipment] = useState(false);
  const [rentClothing, setRentClothing] = useState(false);
  
  if (!isOpen) return null;

  const handleBooking = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nama = formData.get('nama');
    const emailStr = formData.get('email') || 'Tidak diisi';
    const wa = formData.get('wa');
    const destinasi = formData.get('destinasi');
    const durasi = formData.get('durasi');
    const jadwal = formData.get('jadwal') || 'Belum ditentukan';
    const peserta = formData.get('peserta');
    const deskripsi = formData.get('deskripsi') || 'Tidak ada catatan khusus';
    
    let opsionalSelected = [];
    const mainOpsional = formData.getAll('opsional_main');
    
    if (mainOpsional.includes('Penjemputan / Transportasi')) opsionalSelected.push('Penjemputan / Transportasi');
    if (mainOpsional.includes('Lainnya')) opsionalSelected.push('Lainnya');

    if (rentEquipment) {
      const equipItems = ['Jaket Gunung', 'Sepatu Trekking', 'Ransel', 'Headlamp'].map(item => {
        const qty = formData.get(`qty_${item}`);
        if (formData.get(`chk_${item}`) && qty && Number(qty) > 0) return `${item} (${qty})`;
        return null;
      }).filter(Boolean);
      if (equipItems.length > 0) opsionalSelected.push(`Sewa Peralatan: ${equipItems.join(', ')}`);
    }

    if (rentClothing) {
      const clothItems = ['Pakaian Tebal', 'Sarung Tangan Extra', 'Kupluk / Topi Gunung'].map(item => {
        const qty = formData.get(`qty_${item}`);
        if (formData.get(`chk_${item}`) && qty && Number(qty) > 0) return `${item} (${qty})`;
        return null;
      }).filter(Boolean);
      if (clothItems.length > 0) opsionalSelected.push(`Sewa Pakaian: ${clothItems.join(', ')}`);
    }
    
    const opsionalText = opsionalSelected.length > 0 ? opsionalSelected.join(' | ') : 'Tidak ada tambahan';
    
    const text = `Halo Admin Trip Ngopi di Ketinggian,\n\nSaya ingin booking trip dengan detail berikut:\n- Nama: ${nama}\n- Email: ${emailStr}\n- No WA: ${wa}\n- Destinasi: ${destinasi}\n- Durasi: ${durasi}\n- Rencana Jadwal: ${jadwal}\n- Jumlah: ${peserta} Pax\n- Tambahan Opsional: ${opsionalText}\n- Catatan/Kendala: ${deskripsi}\n\nMohon info ketersediaan dan total biayanya. Terima kasih!`;
    const waText = encodeURIComponent(text);

    setShowSuccess(true);
    
    // Open WA next
    window.open(`https://wa.me/6282127533268?text=${waText}`, '_blank');
    
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-art-bg w-full max-w-lg rounded-2xl p-6 md:p-8 border-2 border-art-text relative max-h-[90vh] overflow-y-auto">
        <button onClick={(e) => { playClick(); onClose(); e.preventDefault(); setShowSuccess(false); }} className="absolute top-4 right-4 text-art-text hover:text-art-orange transition-colors" type="button">
          <X size={24} />
        </button>
        {showSuccess ? (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-art-green/20 text-art-green rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-art-text mb-3">Pesanan Diterima!</h3>
            <p className="font-medium text-art-text/80 mb-6 text-sm">Permintaan Anda sedang dialihkan ke WhatsApp Admin...</p>
          </div>
        ) : (
          <>
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-art-text mb-6">Booking Trip</h3>
            <form className="space-y-4" onSubmit={handleBooking}>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-art-text/50 mb-1">Nama Lengkap</label>
            <input name="nama" required type="text" className="w-full border-2 border-art-text bg-white px-3 py-2 rounded-lg text-art-text font-medium outline-none focus:border-art-orange text-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-art-text/50 mb-1">Alamat Email</label>
            <input name="email" required type="email" defaultValue={user?.email || ''} className="w-full border-2 border-art-text bg-white px-3 py-2 rounded-lg text-art-text font-medium outline-none focus:border-art-orange text-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-art-text/50 mb-1">Nomor WhatsApp</label>
            <input name="wa" required type="tel" className="w-full border-2 border-art-text bg-white px-3 py-2 rounded-lg text-art-text font-medium outline-none focus:border-art-orange text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-art-text/50 mb-1">Pilih Destinasi</label>
              <select name="destinasi" defaultValue={prefill?.destinasi || ""} className="w-full border-2 border-art-text bg-white px-2 py-2 rounded-lg text-art-text font-medium outline-none focus:border-art-orange text-sm">
                <option value="">-- Pilih Destinasi --</option>
                {destinationOptions ? destinationOptions.map((dest, i) => (
                  <option key={i} value={dest.name}>{dest.name}</option>
                )) : (
                  <>
                    <option>Gunung Gede Pangrango</option>
                    <option>Gunung Salak</option>
                    <option>Gunung Semeru</option>
                    <option>Gunung Rinjani</option>
                    <option>Gunung Sumbing</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-art-text/50 mb-1">Pilih Durasi</label>
              <select name="durasi" defaultValue={prefill?.durasi || ""} className="w-full border-2 border-art-text bg-white px-2 py-2 rounded-lg text-art-text font-medium outline-none focus:border-art-orange text-sm">
                <option value="">-- Pilih Durasi --</option>
                <option>1H (Tektok)</option>
                <option>2H 1M</option>
                <option>3H 2M</option>
                <option>4H 3M</option>
                <option>5H 4M</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-art-text/50 mb-1">Jadwal (Bisa disesuaikan nanti)</label>
            <input name="jadwal" type="date" className="w-full border-2 border-art-text bg-white px-3 py-2 rounded-lg text-art-text font-medium outline-none focus:border-art-orange text-sm" />
            <p className="text-[10px] mt-1 text-art-text/60 italic">*Jadwal pasti dapat didiskusikan setelah booking.</p>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-art-text/50 mb-1">Jumlah Peserta</label>
            <input name="peserta" type="number" min="1" defaultValue="2" className="w-full border-2 border-art-text bg-white px-3 py-2 rounded-lg text-art-text font-medium outline-none focus:border-art-orange text-sm" />
            <p className="text-[10px] mt-1 text-art-text/60 italic">*Minimal peserta tergantung destinasi. Kuota maksimal 12 Pax.</p>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-art-text/50 mb-1">Catatan Tambahan (Kondisi Khusus / Kesehatan)</label>
            <textarea name="deskripsi" rows={2} placeholder="Mohon isi deskripsi ini jika ada kebutuhan personal atau kendala/penyakit bawaan." className="w-full border-2 border-art-text bg-white px-3 py-2 rounded-lg text-art-text font-medium outline-none focus:border-art-orange text-sm"></textarea>
          </div>
          <div className="border-t border-art-text/20 pt-4 mt-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-art-text/50 mb-2">Tambahan Opsional (Di luar paket, dikenakan biaya tambahan)</label>
            <div className="space-y-3">
              
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-art-text cursor-pointer hover:text-art-orange mb-1">
                  <input type="checkbox" checked={rentEquipment} onChange={(e) => setRentEquipment(e.target.checked)} className="w-4 h-4 text-art-orange border-art-text rounded" />
                  Sewa Peralatan Gunung
                </label>
                {rentEquipment && (
                  <div className="pl-6 mt-2 text-xs space-y-2">
                    {['Jaket Gunung', 'Sepatu Trekking', 'Ransel', 'Headlamp'].map(item => (
                      <div key={item} className="flex items-center gap-3">
                         <input type="checkbox" name={`chk_${item}`} value="yes" className="w-3 h-3 text-art-orange rounded" />
                         <span className="w-24 text-art-text/80">{item}</span>
                         <input type="number" name={`qty_${item}`} min="1" defaultValue="1" className="w-12 border border-art-text/30 rounded px-1 py-0.5 text-center bg-white" />
                         <span className="text-art-text/50">pcs</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-art-text cursor-pointer hover:text-art-orange mb-1">
                  <input type="checkbox" checked={rentClothing} onChange={(e) => setRentClothing(e.target.checked)} className="w-4 h-4 text-art-orange border-art-text rounded" />
                  Sewa Pakaian Khusus
                </label>
                {rentClothing && (
                  <div className="pl-6 mt-2 text-xs space-y-2">
                    {['Pakaian Tebal', 'Sarung Tangan Extra', 'Kupluk / Topi Gunung'].map(item => (
                      <div key={item} className="flex items-center gap-3">
                         <input type="checkbox" name={`chk_${item}`} value="yes" className="w-3 h-3 text-art-orange rounded" />
                         <span className="w-32 text-art-text/80">{item}</span>
                         <input type="number" name={`qty_${item}`} min="1" defaultValue="1" className="w-12 border border-art-text/30 rounded px-1 py-0.5 text-center bg-white" />
                         <span className="text-art-text/50">pcs</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-art-text cursor-pointer hover:text-art-orange">
                <input type="checkbox" name="opsional_main" value="Penjemputan / Transportasi" className="w-4 h-4 text-art-orange border-art-text rounded" />
                Penjemputan / Transportasi
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-art-text cursor-pointer hover:text-art-orange">
                <input type="checkbox" name="opsional_main" value="Lainnya" className="w-4 h-4 text-art-orange border-art-text rounded" />
                Lainnya (Unspecified)
              </label>

            </div>
          </div>
          <Button variant="primary" className="w-full mt-6 py-4 uppercase text-[10px] tracking-widest" type="submit">
            Kirim Permintaan Ke WhatsApp
          </Button>
        </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

const destinationsData = [
  {
    id: "gede",
    name: "Gunung Gede Pangrango",
    height: "2.958 mdpl",
    desc: "Eksplorasi megahnya Alun-Alun Suryakencana, padang savana penuh edelweiss. Kita akan camp dan menyeduh kopi sore menanti senja, serta morning coffee dengan view kawah yang menakjubkan.",
    image: "https://images.unsplash.com/photo-1542459954-469b8bd51515?q=80&w=2070&auto=format&fit=crop",
    locationTag: "Alun-Alun Suryakencana",
    difficulty: "Pemula - Menengah",
    mepo: "Cibodas / Gunung Putri",
    kuota: "Min 2 - Max 12 Pax",
    beans: "Java Preanger",
    durations: [
      { label: "1H (Tektok)", price: 400 },
      { label: "2H 1M", price: 650 },
      { label: "3H 2M", price: 900 }
    ]
  },
  {
    id: "salak",
    name: "Gunung Salak",
    height: "2.211 mdpl",
    desc: "Menjelajahi keeksotisan jalur Gunung Salak dan pesona Kawah Ratu. Sangat cocok untuk pendaki, ditemani hangatnya kopi andalan di tengah rimbunnya hutan tropis.",
    image: "https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?q=80&w=2070&auto=format&fit=crop",
    locationTag: "Kawah Ratu",
    difficulty: "Pemula",
    mepo: "TNGHS / Cidahu",
    kuota: "Min 2 - Max 12 Pax",
    beans: "Gayo / Flores",
    durations: [
      { label: "1H (Tektok)", price: 350 },
      { label: "2H 1M", price: 600 },
      { label: "3H 2M", price: 850 }
    ]
  },
  {
    id: "semeru",
    name: "Gunung Semeru",
    height: "3.676 mdpl",
    desc: "Menaklukkan atap Pulau Jawa. Perjalanan panjang dari Ranu Kumbolo hingga puncak Mahameru, menyeduh kopi di tepian danau nan eksotis dan mengagumi kawah Jonggring Saloko.",
    image: "https://images.unsplash.com/photo-1543884487-7359df37db0d?q=80&w=2070&auto=format&fit=crop",
    locationTag: "Ranu Kumbolo",
    difficulty: "Menengah - Ahli",
    mepo: "Tumpang / Malang",
    kuota: "Min 4 - Max 15 Pax",
    beans: "Dampit / Kintamani",
    durations: [
      { label: "2H 1M", price: 1200 },
      { label: "3H 2M", price: 1600 },
      { label: "4H 3M", price: 2100 }
    ]
  },
  {
    id: "rinjani",
    name: "Gunung Rinjani",
    height: "3.726 mdpl",
    desc: "Menaklukkan salah satu gunung terindah di Indonesia. Menyusuri sabana Sembalun, berkemah di tepi Danau Segara Anak, dan menikmati momen ngopi dengan pemandangan magis yang tak terlupakan.",
    image: "https://images.unsplash.com/photo-1571365893322-921319c5c163?q=80&w=2659&auto=format&fit=crop",
    locationTag: "Segara Anak",
    difficulty: "Sangat Ahli",
    mepo: "Bandara Lombok / Sembalun",
    kuota: "Min 4 - Max 10 Pax",
    beans: "Kintamani / Toraja",
    durations: [
      { label: "3H 2M", price: 2000 },
      { label: "4H 3M", price: 2500 },
      { label: "5H 4M", price: 3200 }
    ]
  },
  {
    id: "sumbing",
    name: "Gunung Sumbing",
    height: "3.371 mdpl",
    desc: "Mengeksplorasi Gunung Sumbing via jalur Garung dengan hamparan sabana luas dan samudra awan menakjubkan. Seduh kopi premium sambil memandang indahnya alam Wonosobo.",
    image: "https://images.unsplash.com/photo-1589308078059-814cb2091fb1?q=80&w=2072&auto=format&fit=crop",
    locationTag: "Sabana Sumbing",
    difficulty: "Menengah",
    mepo: "Basecamp Garung / Wonosobo",
    kuota: "Min 3 - Max 12 Pax",
    beans: "Temanggung / Sindoro",
    durations: [
      { label: "2H 1M", price: 850 },
      { label: "3H 2M", price: 1200 }
    ]
  }
];

const heroSlides = [
  {
    name: "Gunung Gede Pangrango",
    height: "2.958",
    image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2671&auto=format&fit=crop"
  },
  {
    name: "Gunung Salak",
    height: "2.211",
    image: "https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?q=80&w=2070&auto=format&fit=crop"
  },
  {
    name: "Gunung Semeru",
    height: "3.676",
    image: "https://images.unsplash.com/photo-1543884487-7359df37db0d?q=80&w=2070&auto=format&fit=crop"
  },
  {
    name: "Gunung Rinjani",
    height: "3.726",
    image: "https://images.unsplash.com/photo-1571365893322-921319c5c163?q=80&w=2659&auto=format&fit=crop"
  }
];

const DestinationCard: React.FC<{ dest: typeof destinationsData[0], onBook: (destinasi: string, durasi: string) => void }> = ({ dest, onBook }) => {
  const [selectedDuration, setSelectedDuration] = useState(dest.durations.findIndex((d: any) => d.label === '2H 1M') >= 0 ? dest.durations.findIndex((d: any) => d.label === '2H 1M') : 0);
  const { playHover } = useSound();
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="group relative bg-white overflow-hidden border-2 border-art-text flex flex-col lg:flex-row hover:shadow-[16px_16px_0px_0px_rgba(26,26,26,1)] transition-all duration-300 mt-12"
    >
      <div className="order-2 lg:order-1 lg:w-1/2 relative overflow-hidden h-64 lg:h-auto border-t-2 lg:border-t-0 lg:border-r-2 border-art-text">
        <img 
          src={dest.image} 
          alt={dest.name} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 grayscale-[10%]"
        />
        <div className="absolute top-4 right-4 md:top-6 md:right-6 bg-white border-2 border-art-text px-3 py-1.5 md:px-4 md:py-2 uppercase font-bold text-[10px] tracking-widest text-art-text flex gap-2 items-center">
          <Tent size={14}/> {dest.locationTag}
        </div>
      </div>
      <div className="order-1 lg:order-2 lg:w-1/2 p-6 lg:p-12 flex flex-col justify-between bg-art-section">
        <div>
          <div className="flex gap-3 mb-8">
            <span className="bg-white text-art-text border border-art-text text-[10px] tracking-widest uppercase font-bold px-4 py-1.5 rounded-full">{dest.difficulty}</span>
          </div>
          <h3 className="text-3xl font-serif italic text-art-text mb-4">{dest.name} <span className="font-sans font-black normal-case block mt-2 text-4xl">{dest.height}</span></h3>
          <p className="font-medium text-art-text/80 mb-8 leading-relaxed">{dest.desc}</p>
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-art-text/50 mb-3">Pilihan Durasi Trip:</p>
            <div className="flex flex-wrap gap-2">
              {dest.durations.map((dur: any, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => setSelectedDuration(idx)}
                  onMouseEnter={playHover}
                  className={`text-[10px] tracking-widest uppercase font-bold px-4 py-2 rounded-lg border-2 transition-all ${selectedDuration === idx ? 'bg-art-text text-white border-art-text' : 'bg-white text-art-text border-art-text/20 hover:border-art-text'}`}
                >
                  {dur.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-y-6 gap-x-4 md:gap-x-8 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4" onMouseEnter={playHover}>
              <div className="w-8 h-8 md:w-10 md:h-10 border border-art-text rounded-full flex items-center justify-center"><Calendar className="text-art-text" size={14} /></div>
              <div><p className="text-[10px] font-bold uppercase tracking-widest text-art-text/50">Jadwal</p><p className="font-bold text-art-text text-xs md:text-sm mt-1">Sesuai Permintaan</p></div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4" onMouseEnter={playHover}>
              <div className="w-8 h-8 md:w-10 md:h-10 border border-art-text rounded-full flex items-center justify-center"><Map className="text-art-text" size={14} /></div>
              <div><p className="text-[10px] font-bold uppercase tracking-widest text-art-text/50">Mepo</p><p className="font-bold text-art-text text-xs md:text-sm mt-1">{dest.mepo}</p></div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4" onMouseEnter={playHover}>
              <div className="w-8 h-8 md:w-10 md:h-10 border border-art-text rounded-full flex items-center justify-center"><Users className="text-art-text" size={14} /></div>
              <div><p className="text-[10px] font-bold uppercase tracking-widest text-art-text/50">Kuota</p><p className="font-bold text-art-text text-xs md:text-sm mt-1">{dest.kuota}</p></div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4" onMouseEnter={playHover}>
              <div className="w-8 h-8 md:w-10 md:h-10 border border-art-text rounded-full flex items-center justify-center"><Coffee className="text-art-text" size={14} /></div>
              <div><p className="text-[10px] font-bold uppercase tracking-widest text-art-text/50">Beans</p><p className="font-bold text-art-text text-xs md:text-sm mt-1">{dest.beans}</p></div>
            </div>
          </div>
          <div className="mb-10 text-[10px] text-art-text/60 font-medium italic border-l-2 border-art-orange pl-3">
            *Jika pesanan melebihi kuota maksimal atau ingin custom jalur pendakian, silakan chat via Admin. Harga akan disesuaikan.
          </div>
        </div>
        <div className="border-t-2 border-art-text pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-art-orange mb-1">Harga Mulai Dari ({dest.durations[selectedDuration].label})</p>
            <p className="text-2xl md:text-3xl font-black text-art-text">Rp {dest.durations[selectedDuration].price}k<span className="text-[10px] md:text-xs font-bold uppercase opacity-50 ml-1">/pax</span></p>
          </div>
          <Button onClick={() => onBook(dest.name, dest.durations[selectedDuration].label)} variant="primary" className="w-full sm:w-auto text-[10px] uppercase tracking-widest px-8 py-3 md:py-2 rounded-lg">Booking Cepat</Button>
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [user] = useAuthState(auth);
  const [showSplash, setShowSplash] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState({ destinasi: '', durasi: '' });
  const [filterDifficulty, setFilterDifficulty] = useState('Semua');

  const handleOpenBooking = (destinasi = '', durasi = '') => {
    setBookingPrefill({ destinasi, durasi });
    setIsBookingOpen(true);
  };
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const { playHover, playClick } = useSound();
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

  const galleryPhotos = [
    { src: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=2070&auto=format&fit=crop", desc: "Momen ngopi pagi" },
    { src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop", desc: "Suasana sunrise" },
    { src: "https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?q=80&w=2070&auto=format&fit=crop", desc: "Trekking bersama" },
    { src: "https://images.unsplash.com/photo-1498855926480-d98e83099315?q=80&w=2070&auto=format&fit=crop", desc: "Istirahat di camp" }
  ];

  // Hero slideshow auto-play
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const difficultyOptions = ['Semua', 'Pemula', 'Menengah', 'Ahli', 'Sangat Ahli'];
  const filteredDestinations = destinationsData.filter(dest => {
    if (filterDifficulty === 'Semua') return true;
    return dest.difficulty.toLowerCase().includes(filterDifficulty.toLowerCase());
  });

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80, // Adjust this offset if header is taller
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
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
              className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-art-text mb-8 mx-auto shadow-2xl relative bg-white"
            >
              <img src="https://files.catbox.moe/lubzno.png" alt="Logo Ngopi Ketinggian" className="w-full h-full object-contain p-2" />
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
              >
                Mulai Melihat Tour <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
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

      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} destinationOptions={destinationsData} prefill={bookingPrefill} />
      <div className="min-h-screen selection:bg-art-orange selection:text-white overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="absolute w-full z-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 md:h-24 flex items-end justify-between border-b border-art-text/10 pb-4">
          <div className="flex items-center gap-3 cursor-pointer" onMouseEnter={playHover}>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white overflow-hidden border border-art-text/20">
              <img src="https://files.catbox.moe/lubzno.png" alt="Logo Ngopi Ketinggian" className="w-full h-full object-contain bg-white" />
            </div>
            <span className="text-xs tracking-[0.3em] font-black uppercase leading-none text-art-text">Ngopi<br/>Ketinggian</span>
          </div>
          <div className="hidden lg:flex gap-8 items-center text-[10px] font-bold uppercase tracking-widest text-art-text">
            <a href="#cerita" onClick={(e) => scrollToSection(e, 'cerita')} className="opacity-60 hover:opacity-100 hover:border-t-2 hover:border-art-text pt-2 transition-all" onMouseEnter={playHover}>Cerita Kami</a>
            <a href="#leader" onClick={(e) => scrollToSection(e, 'leader')} className="opacity-60 hover:opacity-100 hover:border-t-2 hover:border-art-text pt-2 transition-all" onMouseEnter={playHover}>Trip Leader</a>
            <a href="#fasilitas" onClick={(e) => scrollToSection(e, 'fasilitas')} className="opacity-60 hover:opacity-100 hover:border-t-2 hover:border-art-text pt-2 transition-all" onMouseEnter={playHover}>Fasilitas</a>
            <a href="#destinasi" onClick={(e) => scrollToSection(e, 'destinasi')} className="opacity-60 hover:opacity-100 hover:border-t-2 hover:border-art-text pt-2 transition-all" onMouseEnter={playHover}>Destinasi</a>
            <a href="#galeri" onClick={(e) => scrollToSection(e, 'galeri')} className="opacity-60 hover:opacity-100 hover:border-t-2 hover:border-art-text pt-2 transition-all" onMouseEnter={playHover}>Galeri</a>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {!user ? (
              <button onClick={() => loginWithGoogle()} className="flex items-center gap-1 md:gap-2 uppercase text-[10px] tracking-widest font-bold text-art-text hover:text-art-orange transition-colors" onMouseEnter={playHover}>
                <svg viewBox="0 0 24 24" className="w-3 h-3 md:w-4 md:h-4" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg> <span className="hidden md:inline">Login</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 md:gap-4">
                <span className="text-[10px] uppercase tracking-widest font-bold text-art-text/80 hidden md:inline">{user.displayName?.split(' ')[0]}</span>
                <button onClick={() => logout()} className="text-art-text/60 hover:text-red-500 transition-colors" title="Logout" onMouseEnter={playHover}><LogOut size={14}/></button>
              </div>
            )}
            <Button onClick={() => handleOpenBooking()} className="uppercase text-[8px] md:text-[10px] tracking-widest px-2 py-2 md:px-4 md:py-3 rounded-lg" variant="primary">
              <span className="md:hidden">Daftar</span>
              <span className="hidden md:inline">Daftar Sekarang</span>
            </Button>
            <button className="flex lg:hidden text-art-text ml-1" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-art-bg border-b border-art-text/10 overflow-hidden"
            >
              <div className="flex flex-col gap-6 p-8 text-[12px] font-bold uppercase tracking-widest text-art-text items-center">
                <a href="#cerita" onClick={(e) => scrollToSection(e, 'cerita')}>Cerita Kami</a>
                <a href="#leader" onClick={(e) => scrollToSection(e, 'leader')}>Trip Leader</a>
                <a href="#fasilitas" onClick={(e) => scrollToSection(e, 'fasilitas')}>Fasilitas</a>
                <a href="#destinasi" onClick={(e) => scrollToSection(e, 'destinasi')}>Destinasi</a>
                <a href="#galeri" onClick={(e) => scrollToSection(e, 'galeri')}>Galeri</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-art-bg pt-32 pb-24 md:py-0 text-center md:text-left">
        {/* Parallax Background using Grid layout pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none mix-blend-multiply flex">
          <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover opacity-[0.25] grayscale" alt="Cover bg" />
        </div>
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-[1]">
          <div className="grid grid-cols-12 h-full w-full opacity-[0.03]">
            <div className="border-r border-black"></div><div className="border-r border-black"></div><div className="border-r border-black"></div><div className="border-r border-black"></div>
            <div className="border-r border-black"></div><div className="border-r border-black"></div><div className="border-r border-black"></div><div className="border-r border-black"></div>
            <div className="border-r border-black"></div><div className="border-r border-black"></div><div className="border-r border-black"></div><div></div>
          </div>
        </div>

        <div className="relative w-full max-w-7xl mx-auto h-full grid grid-cols-1 md:grid-cols-12 px-6 md:px-12 z-10 gap-12 md:gap-0">
          <div className="col-span-1 md:col-span-6 z-20 flex flex-col justify-center items-center md:items-start pt-12 md:pb-20">
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-art-green font-serif italic text-2xl mb-2"
            >
              Open Trip Eksklusif
            </motion.p>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-[32px] sm:text-[50px] md:text-[80px] lg:text-[110px] leading-[0.95] md:leading-[0.85] font-black uppercase tracking-tight text-art-text mb-8 md:whitespace-nowrap"
            >
              Trip Ngopi Di<br/>
              <span className="text-art-orange drop-shadow-sm">Ketinggian</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="md:text-xl font-medium max-w-md text-art-text/80 mb-12"
            >
              Menikmati kopi manual brew terbaik, hangatnya kebersamaan, dan magisnya lautan awan dari puncak gunung.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4 px-4 sm:px-0"
            >
              <Button onClick={() => handleOpenBooking()} variant="primary" className="text-[10px] uppercase font-bold tracking-widest py-4 rounded-lg">
                Booking Trip
              </Button>
              <Button onClick={() => window.location.href='#destinasi'} variant="secondary" className="text-[10px] uppercase font-bold tracking-widest py-4 rounded-lg">
                Lihat Destinasi
              </Button>
            </motion.div>
          </div>

          <div 
            className="flex col-span-12 md:col-span-6 h-full items-center justify-center relative mt-12 md:mt-0 px-2"
          >
             <div className="relative w-full max-w-[300px] md:max-w-none md:w-[380px] h-[360px] md:h-[520px] isolate mx-auto">
               <div className="absolute inset-0 bg-gray-300 rounded-[40px] overflow-hidden border-[8px] md:border-[12px] border-white shadow-2xl rotate-3">
                 <motion.img 
                   key={currentSlideIndex}
                   initial={{ opacity: 0, scale: 1.05 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ duration: 1 }}
                   src={heroSlides[currentSlideIndex].image} 
                   alt={heroSlides[currentSlideIndex].name} 
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
                     className="text-3xl font-serif italic drop-shadow-md"
                   >
                     {heroSlides[currentSlideIndex].name}
                   </motion.h3>
                 </div>
               </div>
               
               {/* Fixed DEM Ketinggian Widget - positioned at top left */}
               <motion.div 
                 key={`badge-${currentSlideIndex}`}
                 initial={{ scale: 0, rotate: -45 }}
                 animate={{ scale: 1, rotate: -12 }}
                 transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
                 className="absolute -top-6 -left-6 md:-top-8 md:-left-8 w-24 h-24 bg-art-orange rounded-full flex flex-col items-center justify-center text-white -rotate-[12deg] border-4 border-white shadow-2xl z-[100]"
               >
                 <span className="text-[8px] uppercase font-bold tracking-tighter">Ketinggian</span>
                 <span className="text-xl font-black leading-none my-0.5">{heroSlides[currentSlideIndex].height}</span>
                 <span className="text-[8px] opacity-80 uppercase">MDPL</span>
               </motion.div>
             </div>
          </div>
        </div>

        {/* Floating Vertical Text */}
        <div className="absolute top-[40%] left-4 rotate-180 hidden xl:block" style={{ writingMode: 'vertical-rl' }}>
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-black/20">EST. 2026 • ADVENTURE & BREW</span>
        </div>
      </section>

      {/* Promo Banner - Moved to right under Hero */}
      <section className="bg-art-bg flex flex-col items-center justify-center border-b border-art-text">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-12 py-8 flex items-center justify-center">
          <a href="#destinasi" onClick={(e) => scrollToSection(e, 'destinasi')} className="w-full block hover:opacity-90 transition-opacity">
            <img src="https://files.catbox.moe/lbf6xr.png" alt="Promo Banner" className="w-full h-auto object-contain rounded-2xl shadow-xl border-4 border-white" />
          </a>
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
              <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tight text-art-text mb-6 md:mb-8 leading-tight">Secangkir Cerita <br/><span className="text-art-green font-serif italic normal-case font-normal text-xl md:text-6xl">di Atas Awan</span></h2>
              <div className="w-12 h-1 bg-art-orange mb-8"></div>
              <p className="font-medium text-art-text/80 mb-6 leading-relaxed">
                Selama lebih dari 10 tahun, kami telah menemani ribuan langkah menapaki puncak-puncak tertinggi di Nusantara. Mengarungi samudra awan dan dinginnya udara gunung mengajarkan kami satu hal: mendaki bukan sekadar tentang seberapa cepat Anda tiba di puncak, melainkan bagaimana Anda meresapi setiap detik perjalanannya. Ya... dan tentunya dengan secangkir kopi hangat di genggaman.
              </p>
              <p className="font-medium text-art-text/80 mb-10 leading-relaxed">
                Berbekal pengalaman panjang ini, meracik kopi di alam terbuka tak lagi sekadar ritual bagi kami, ia menjelma jadi perayaan kebersamaan. Lupakan sejenak semrawutnya ibukota. Kami siapkan ritme perjalanan yang santai, aman, penuh cerita, dan tentu saja... kopi rindu tebal yang diseduh di waktu yang paling tepat. Sesuatu yang tak akan pernah Anda temukan walau di coffee shop semewah apa pun di tengah kota.
              </p>
              
              <div className="space-y-6 border-l-2 border-art-text/10 pl-6">
                {[
                  { title: "Manual Brew Experience", desc: "Nikmati V60, Chemex, atau Aeropress dari barista kami." },
                  { title: "Grup Eksklusif", desc: "Maksimal 12 orang per perjalanan untuk keintiman." },
                  { title: "Peralatan Premium", desc: "Tenda The North Face dll untuk kenyamanan istirahat." }
                ].map((item, i) => (
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
              <div className="absolute inset-0 bg-art-orange rounded-[40px] transform rotate-3 scale-105 z-0" />
              <img 
                src="https://images.unsplash.com/photo-1542459954-469b8bd51515?q=80&w=2070&auto=format&fit=crop" 
                alt="Pourover coffee outdoor" 
                className="relative z-10 rounded-[40px] shadow-2xl w-full object-cover aspect-[4/5] grayscale-[10%] border-8 border-white"
              />
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
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-art-text mb-4 leading-tight">Kenalan dengan <br/><span className="text-art-green font-serif italic normal-case font-normal text-2xl md:text-5xl">Trip Leader Kami</span></h2>
            <div className="w-12 h-1 bg-art-orange mx-auto mb-8"></div>
            <p className="font-medium text-art-text/80 mb-6 leading-relaxed">
              Tim profesional kami yang siap memandu perjalanan Anda agar lebih aman, menyenangkan, dan tentunya memastikan seduhan kopi Anda sempurna.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {/* Leader 1 */}
            <div className="border border-art-text/10 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow bg-art-bg flex flex-col items-center p-6 text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md mb-4 relative">
                 <img src="https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&fit=crop" alt="Sukmayadi" className="w-full h-full object-cover grayscale-[20%]" />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-widest text-art-text">Sukmayadi</h3>
              <p className="text-[10px] uppercase tracking-widest font-bold text-art-orange mt-2 mb-4">Pengalaman 10+ Tahun</p>
              <p className="text-xs text-art-text/70">Expert navigasi dan coffee brewer. Menaklukkan puluhan puncak gunung.</p>
            </div>

            {/* Leader 2 */}
            <div className="border border-art-text/10 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow bg-art-bg flex flex-col items-center p-6 text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md mb-4 relative">
                 <img src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=400&fit=crop" alt="Ardi" className="w-full h-full object-cover grayscale-[20%]" />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-widest text-art-text">Ardi</h3>
              <p className="text-[10px] uppercase tracking-widest font-bold text-art-orange mt-2 mb-4">Pengalaman 7 Tahun</p>
              <p className="text-xs text-art-text/70">Spesialis survival dan logistik perjalanan panjang.</p>
            </div>

            {/* Leader 3 */}
            <div className="border border-art-text/10 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow bg-art-bg flex flex-col items-center p-6 text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md mb-4 relative">
                 <img src="https://images.unsplash.com/photo-1522345511043-4ccb3708e13f?w=400&fit=crop" alt="Rizky" className="w-full h-full object-cover grayscale-[20%]" />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-widest text-art-text">Rizky</h3>
              <p className="text-[10px] uppercase tracking-widest font-bold text-art-orange mt-2 mb-4">Pengalaman 5 Tahun</p>
              <p className="text-xs text-art-text/70">Fotografer alam bebas dan pemandu jalur ramah pemula.</p>
            </div>

            {/* Leader 4 */}
            <div className="border border-art-text/10 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow bg-art-bg flex flex-col items-center p-6 text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md mb-4 relative">
                 <img src="https://images.unsplash.com/photo-1465311440653-ba9b1d9d0f5c?w=400&fit=crop" alt="Deni" className="w-full h-full object-cover grayscale-[20%]" />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-widest text-art-text">Deni</h3>
              <p className="text-[10px] uppercase tracking-widest font-bold text-art-orange mt-2 mb-4">Pengalaman 6 Tahun</p>
              <p className="text-xs text-art-text/70">Pakar P3K dan master penyeduh kopi pagi.</p>
            </div>
          </div>

          {/* Tim Lapangan Gallery */}
          <div className="mt-20">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-black uppercase tracking-tight text-art-text">Tim Lapangan Kami</h3>
              <p className="text-art-text/60 font-medium mt-2">Momen kebersamaan dan dedikasi tim di alam bebas</p>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-8 snap-x scrollbar-hide">
              <img src="https://images.unsplash.com/photo-1510525009512-ad7fc13eefab?w=600&auto=format&fit=crop" alt="Tim Lapangan" className="w-80 h-64 object-cover rounded-2xl snap-center flex-shrink-0 grayscale-[20%] border-2 border-art-text hover:grayscale-0 hover:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] transition-all" />
              <img src="https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=600&auto=format&fit=crop" alt="Tim Lapangan 2" className="w-80 h-64 object-cover rounded-2xl snap-center flex-shrink-0 grayscale-[20%] border-2 border-art-text hover:grayscale-0 hover:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] transition-all" />
              <img src="https://images.unsplash.com/photo-1550983570-5b65df05eaca?w=600&auto=format&fit=crop" alt="Tim Lapangan 3" className="w-80 h-64 object-cover rounded-2xl snap-center flex-shrink-0 grayscale-[20%] border-2 border-art-text hover:grayscale-0 hover:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] transition-all" />
              <img src="https://images.unsplash.com/photo-1517400508440-20dc951dc84d?w=600&auto=format&fit=crop" alt="Tim Lapangan 4" className="w-80 h-64 object-cover rounded-2xl snap-center flex-shrink-0 grayscale-[20%] border-2 border-art-text hover:grayscale-0 hover:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] transition-all" />
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
                <li className="flex items-start gap-3"><div className="w-2 h-2 mt-1.5 rounded-full bg-art-orange flex-shrink-0"></div><span>Tiket masuk & asuransi pendakian resmi (Simaksi)</span></li>
                <li className="flex items-start gap-3"><div className="w-2 h-2 mt-1.5 rounded-full bg-art-orange flex-shrink-0"></div><span>Tenda premium kapasitas 2-3 orang</span></li>
                <li className="flex items-start gap-3"><div className="w-2 h-2 mt-1.5 rounded-full bg-art-orange flex-shrink-0"></div><span>Matras & Sleeping bag hangat</span></li>
                <li className="flex items-start gap-3"><div className="w-2 h-2 mt-1.5 rounded-full bg-art-orange flex-shrink-0"></div><span>Makan selama pendakian (Sesuai durasi)</span></li>
                <li className="flex items-start gap-3"><div className="w-2 h-2 mt-1.5 rounded-full bg-art-orange flex-shrink-0"></div><span>Signature Coffee Drip di camp & morning coffee</span></li>
                <li className="flex items-start gap-3"><div className="w-2 h-2 mt-1.5 rounded-full bg-art-orange flex-shrink-0"></div><span>P3K dan Alat masak kelompok</span></li>
                <li className="flex items-start gap-3"><div className="w-2 h-2 mt-1.5 rounded-full bg-art-orange flex-shrink-0"></div><span>Tour leader berpengalaman & Porter tim</span></li>
              </ul>
            </div>
            
            <div className="bg-art-bg text-art-text p-8 rounded-2xl border-2 border-art-text">
              <h3 className="text-xl font-bold uppercase tracking-widest text-art-orange mb-6 flex items-center gap-3"><X /> Exclude</h3>
              <ul className="space-y-4 text-sm font-medium">
                <li className="flex items-start gap-3"><div className="w-2 h-2 mt-1.5 rounded-full bg-art-text flex-shrink-0"></div><span>Transportasi dari kota asal ke Meeting Point</span></li>
                <li className="flex items-start gap-3"><div className="w-2 h-2 mt-1.5 rounded-full bg-art-text flex-shrink-0"></div><span>Pengeluaran pribadi di luar fasilitas</span></li>
                <li className="flex items-start gap-3"><div className="w-2 h-2 mt-1.5 rounded-full bg-art-text flex-shrink-0"></div><span>Obat-obatan pribadi yang khusus</span></li>
              </ul>
            </div>

            <div className="bg-white/5 border-2 border-white/20 text-white p-8 rounded-2xl relative overflow-hidden">
               <div className="absolute inset-0 bg-art-orange/10"></div>
               <div className="relative z-10">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-art-orange rounded-full mix-blend-overlay filter blur-3xl opacity-50 translate-x-10 -translate-y-10"></div>
                 <h3 className="text-xl font-bold uppercase tracking-widest text-art-orange mb-6 flex items-center gap-3"><PlusCircle /> Optional (Tambahan)</h3>
                 <p className="text-sm font-medium text-white/70 mb-4">Pilih fasilitas tambahan jika Anda membutuhkannya. <br/><span className="text-art-orange">Catatan: Tambahan opsional ini akan dikenakan biaya tambahan dan tidak termasuk ke dalam harga paket yang tertera. Boleh dicat admin untuk detail harga tambahan.</span></p>
                 <ul className="space-y-4 text-sm font-medium">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-art-orange flex-shrink-0"></div>
                    <div>
                      <span>Sewa Peralatan Gunung</span>
                      <p className="text-xs text-white/50 mt-1">- Jaket Gunung</p>
                      <p className="text-xs text-white/50 mt-1">- Sepatu Trekking</p>
                      <p className="text-xs text-white/50 mt-1">- Ransel</p>
                      <p className="text-xs text-white/50 mt-1">- Headlamp</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-art-orange flex-shrink-0"></div>
                    <div>
                      <span>Sewa Pakaian Khusus</span>
                      <p className="text-xs text-white/50 mt-1">- Pakaian tebal</p>
                      <p className="text-xs text-white/50 mt-1">- Sarung tangan extra</p>
                      <p className="text-xs text-white/50 mt-1">- Kupluk / Topi Gunung</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-art-orange flex-shrink-0"></div>
                    <span>Penjemputan dan Pengantaran di Meeting Point</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-art-orange flex-shrink-0"></div>
                    <span>Lainnya (Bisa didiskusikan)</span>
                  </li>
                 </ul>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Destination Section */}
      <section id="destinasi" className="py-20 md:py-32 bg-art-bg relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none mix-blend-multiply">
          <img src="https://images.unsplash.com/photo-1571365893322-921319c5c163?q=80&w=2074&auto=format&fit=crop" className="w-full h-full object-cover opacity-[0.35] grayscale" alt="Mountain bg" />
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-art-text mb-6">Destinasi Utama</h2>
            <div className="w-12 h-1 bg-art-text mx-auto mb-6"></div>
            <p className="font-medium text-art-text/80 mb-10">Bergabunglah dalam perjalanan epik ke salah satu gunung paling ikonik di Jawa Barat dengan formasi ngopi terindah kami.</p>
            
            {/* Filter */}
            <div className="flex flex-wrap justify-center gap-3">
              {difficultyOptions.map(level => (
                <button
                  key={level}
                  onClick={() => { playClick(); setFilterDifficulty(level); }}
                  onMouseEnter={playHover}
                  className={`text-[10px] tracking-widest uppercase font-bold px-6 py-2 rounded-full border-2 transition-all ${filterDifficulty === level ? 'bg-art-text text-white border-art-text' : 'bg-white text-art-text border-art-text/20 hover:border-art-text'}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {filteredDestinations.length > 0 ? (
            filteredDestinations.map((dest) => (
              <DestinationCard key={dest.id} dest={dest} onBook={(destinasi, durasi) => handleOpenBooking(destinasi, durasi)} />
            ))
          ) : (
            <div className="text-center py-20 border-2 border-art-text/20 rounded-2xl bg-white/50">
              <p className="text-art-text/60 font-medium">Belum ada destinasi untuk tingkat kesulitan ini.</p>
            </div>
          )}
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
            slides={galleryPhotos}
          />
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
    </div>
    </>
  );
}
