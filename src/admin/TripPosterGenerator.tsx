import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Layout, Smartphone, Monitor, Coffee, Calendar, MapPin, CreditCard, Clock, CheckCircle, Map, Hash, Trash2 } from 'lucide-react';
import { toPng } from 'html-to-image';

interface PosterProps {
  trip: any;
  onClose: () => void;
  type: 'open' | 'private';
}

type AspectRatio = '1:1' | '4:3' | '16:9' | '9:16';

type LayoutType = 'poster' | 'rundown' | 'ad';

const THEMES = [
  { id: 'dark', color: 'bg-[#1a1a1a]', text: 'text-white', primary: '#ff5722', secondary: '#333333' },
  { id: 'light', color: 'bg-white border', text: 'text-[#1a1a1a]', primary: '#ff5722', secondary: '#f5f5f5' },
  { id: 'orange', color: 'bg-[#ff5722]', text: 'text-white', primary: '#1a1a1a', secondary: '#e64a19' },
  { id: 'slate', color: 'bg-[#1e293b]', text: 'text-white', primary: '#38bdf8', secondary: '#334155' },
  { id: 'emerald', color: 'bg-[#064e3b]', text: 'text-white', primary: '#10b981', secondary: '#065f46' },
  { id: 'indigo', color: 'bg-[#312e81]', text: 'text-white', primary: '#818cf8', secondary: '#3730a3' },
  { id: 'minimal', color: 'bg-gray-50', text: 'text-gray-900', primary: '#000000', secondary: '#e5e7eb' },
  { id: 'sunset', color: 'bg-gradient-to-br from-[#ff5f6d] to-[#ffc371]', text: 'text-white', primary: '#ffffff', secondary: 'rgba(255,255,255,0.2)' },
];

export const TripPosterGenerator = ({ trip, onClose, type: initialType }: PosterProps) => {
  const [ratio, setRatio] = useState<AspectRatio>('1:1');
  const [layout, setLayout] = useState<LayoutType>('poster');
  const [theme, setTheme] = useState(THEMES[0]);
  const [bgOpacity, setBgOpacity] = useState(0.4);
  const [tripTypeLabel, setTripTypeLabel] = useState(initialType === 'open' ? 'OPEN TRIP' : 'PRIVATE TRIP');
  const [customVia, setCustomVia] = useState(trip.path || trip.paths?.[0]?.name || '');
  const posterRef = useRef<HTMLDivElement>(null);

  const downloadPoster = async () => {
    if (posterRef.current === null) return;
    try {
      const dataUrl = await toPng(posterRef.current, { 
        cacheBust: true, 
        pixelRatio: 4, // 4x for Ultra HD
        quality: 1,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      const link = document.createElement('a');
      link.download = `poster-${trip.name || 'trip'}-${layout}-${ratio}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download poster', err);
    }
  };

  const getContainerStyles = () => {
    switch (ratio) {
      case '1:1': return 'aspect-square w-full max-w-[600px]';
      case '4:3': return 'aspect-[4/3] w-full max-w-[650px]';
      case '16:9': return 'aspect-[16/9] w-full max-w-[850px]';
      case '9:16': return 'aspect-[9/16] h-[750px]';
      default: return 'aspect-square';
    }
  };

  const formatPrice = (p: number | string) => {
    const val = parseInt(String(p)) || 0;
    if (val === 0) return 'Rp 0';
    if (val < 1000) return `Rp ${val}K`;
    if (val % 1000 === 0) return `Rp ${val / 1000}K`;
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  const tripName = trip.name || 'Gunung Indonesia';
  const currentPrice = initialType === 'open' 
    ? trip.price 
    : Math.min(...(trip.paths?.flatMap((p: any) => p.durations?.map((d: any) => d.price)) || [0]));
  
  const originalPrice = initialType === 'open'
    ? trip.originalPrice
    : Math.min(...(trip.paths?.flatMap((p: any) => p.durations?.map((d: any) => d.originalPrice)) || [0]));

  const tripDate = initialType === 'open' ? trip.jadwal : 'Sesuai Request';
  const tripMepo = initialType === 'open' ? trip.mepo : 'Jakarta / Sesuai Meeting Point';
  const tripDuration = initialType === 'open' ? trip.duration : (trip.paths?.[0]?.durations?.[0]?.label || '-');

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
    >
      <div className="bg-[#f8f9fa] w-full max-w-6xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[95vh] border border-white/10">
        {/* Left: Controls */}
        <div className="w-full md:w-96 p-8 border-r border-gray-200 bg-white space-y-8 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black uppercase tracking-tight text-[#1a1a1a]">Poster Designer</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Layout Desain</label>
            <div className="flex gap-2">
              {[
                { id: 'poster', label: 'Poster' },
                { id: 'rundown', label: 'Info' },
                { id: 'ad', label: 'Iklan' }
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLayout(l.id as LayoutType)}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${layout === l.id ? 'bg-art-text text-white border-art-text shadow-md' : 'bg-white text-gray-400 border-gray-100'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Rasio Gambar</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: '1:1', icon: Smartphone, label: '1:1' },
                { id: '4:3', icon: Layout, label: '4:3' },
                { id: '16:9', icon: Monitor, label: '16:9' },
                { id: '9:16', icon: Smartphone, label: '9:16' }
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRatio(r.id as AspectRatio)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border-2 transition-all ${ratio === r.id ? 'border-[#ff5722] bg-orange-50 text-[#ff5722] shadow-sm' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                >
                  <r.icon size={18} />
                  <span className="text-[8px] font-bold mt-1 uppercase tracking-tighter">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Tipe & Jalur</label>
            <div className="flex gap-2 mb-2">
               {['OPEN TRIP', 'PRIVATE TRIP'].map(t => (
                 <button 
                  key={t}
                  onClick={() => setTripTypeLabel(t)}
                  className={`flex-1 py-2 rounded-lg text-[9px] font-black border-2 transition-all ${tripTypeLabel === t ? 'bg-art-text text-white border-art-text' : 'bg-white text-gray-400 border-gray-100'}`}
                 >
                   {t}
                 </button>
               ))}
            </div>
            <input 
              className="w-full border-2 border-gray-100 p-3 rounded-xl text-xs font-bold focus:border-art-orange outline-none"
              value={customVia}
              onChange={e => setCustomVia(e.target.value)}
              placeholder="Via / Jalur..."
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Tema Visual</label>
            <div className="flex flex-wrap gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t)}
                  className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center transition-all ${theme.id === t.id ? 'ring-2 ring-offset-2 ring-art-orange scale-110' : 'opacity-60 hover:opacity-100'}`}
                >
                  {theme.id === t.id && <CheckCircle size={14} className={t.id === 'light' ? 'text-black' : 'text-white'} />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex justify-between">
              <span>Transparansi BG</span>
              <span>{Math.round(bgOpacity * 100)}%</span>
            </label>
            <input 
              type="range" min="0" max="1" step="0.05" 
              value={bgOpacity} 
              onChange={e => setBgOpacity(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-art-orange"
            />
          </div>

          <div className="pt-8">
            <button 
              onClick={downloadPoster}
              className="w-full bg-[#1a1a1a] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl hover:bg-black transition-all active:scale-95 group"
            >
              <Download size={16} className="group-hover:translate-y-0.5 transition-transform" /> Download HD Poster
            </button>
            <p className="text-[8px] text-center mt-3 text-gray-400 uppercase font-bold tracking-widest">Format: PNG • Quality: 4x HD</p>
          </div>
        </div>

        {/* Right: Preview Area */}
        <div className="flex-1 bg-gray-200/50 p-4 md:p-12 flex items-center justify-center overflow-auto relative custom-scrollbar">
          <div 
            ref={posterRef}
            className={`${getContainerStyles()} ${theme.color} relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col transition-all duration-500`}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-500" 
              style={{ 
                backgroundImage: trip.image ? `url(${trip.image})` : 'none',
                opacity: bgOpacity 
              }}
            ></div>
            
            {/* Main Content Layout */}
            <div className={`relative z-10 flex flex-col h-full ${ratio === '9:16' ? 'p-[12%]' : ratio === '16:9' ? 'p-[6%]' : 'p-[8%]'} transition-all`}>
              {/* Header */}
              <div className={`flex items-center gap-3 ${ratio === '16:9' ? 'mb-[4%]' : 'mb-[8%]'}`}>
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-xl rotate-12">
                  <Coffee size={24} style={{ color: theme.primary }} />
                </div>
                <div className={theme.text}>
                  <h1 className="text-[10px] font-black uppercase tracking-[0.2em] leading-none opacity-80">Ngopi di</h1>
                  <h2 className="text-sm font-black uppercase tracking-[0.1em] leading-none" style={{ color: theme.id === 'orange' ? 'white' : theme.id === 'sunset' ? 'white' : '#ff5722' }}>Ketinggian</h2>
                </div>
              </div>

              {/* Label Component */}
              <div className="inline-block px-3 py-1 rounded-full border-2 border-current self-start mb-6" style={{ borderColor: theme.primary, color: theme.primary }}>
                <span className="text-[9px] font-black tracking-widest">{tripTypeLabel}</span>
              </div>

              {layout === 'poster' ? (
                <>
                  {/* Title Section */}
                  <div className={`${ratio === '16:9' ? 'mb-4' : 'mb-auto'}`}>
                    <p className={`text-[12px] font-black uppercase tracking-[0.4em] opacity-60 mb-2 ${theme.text}`}>Explore Indonesia</p>
                    <h3 className={`font-black uppercase leading-[0.85] tracking-tighter mb-4 ${theme.text} ${ratio === '9:16' ? 'text-6xl' : ratio === '16:9' ? 'text-5xl' : 'text-6xl'}`}>
                      {tripName}
                    </h3>
                    <div className="h-2 w-32 rounded-full" style={{ backgroundColor: theme.primary }}></div>
                  </div>

                  {/* Info Grid */}
                  <div className={`grid ${ratio === '16:9' ? 'grid-cols-4 gap-4' : 'grid-cols-2 gap-y-8 gap-x-6'} ${theme.text}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 opacity-40">
                        <Calendar size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Jadwal</span>
                      </div>
                      <p className="text-sm font-black">{tripDate}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 opacity-40">
                        <Map size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Via Jalur</span>
                      </div>
                      <p className="text-sm font-black uppercase tracking-tight">{customVia || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 opacity-40">
                        <MapPin size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Meeting Point</span>
                      </div>
                      <p className="text-sm font-black">{tripMepo}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 opacity-40">
                        <CreditCard size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Price</span>
                      </div>
                      <div className="flex flex-col">
                        {originalPrice > currentPrice && (
                          <span className="text-[10px] font-black line-through opacity-30 leading-none">
                            {formatPrice(originalPrice)}
                          </span>
                        )}
                        <p className="text-xl font-black" style={{ color: theme.id === 'minimal' ? '#ff5722' : theme.id === 'orange' ? 'white' : theme.id === 'sunset' ? 'white' : theme.primary }}>
                          {formatPrice(currentPrice)}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : layout === 'rundown' ? (
                <div className={`flex flex-col flex-1 ${theme.text}`}>
                  <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Itinerary & Rundown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                    <div className="space-y-4">
                       <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">Destinasi</p>
                          <p className="text-lg font-black">{tripName}</p>
                          <p className="text-xs font-bold opacity-60 mt-1">{customVia} • {tripDuration}</p>
                       </div>
                       <div className="bg-black/10 p-4 rounded-2xl">
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-3">Rencana Perjalanan</p>
                          <div className="space-y-3 max-h-48 overflow-hidden text-[10px] font-bold leading-relaxed whitespace-pre-line">
                            {trip.rundownText || "Rundown sedang disiapkan oleh tim pemandu kami.\n\nHari 1: Berkumpul di Mepo, Perjalanan & Camp.\nHari 2: Summit Attack, Turun & Kembali."}
                          </div>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-3">Price Info</p>
                          <div className="flex flex-col">
                            {originalPrice > currentPrice && (
                              <span className="text-[11px] font-black line-through opacity-30">
                                {formatPrice(originalPrice)}
                              </span>
                            )}
                            <p className="text-3xl font-black" style={{ color: theme.primary }}>
                              {formatPrice(currentPrice)}
                            </p>
                          </div>
                          <p className="text-[8px] mt-2 font-bold opacity-50 uppercase tracking-wider">Per Orang • All Include (S&K Berlaku)</p>
                       </div>
                       <div className="flex-1 border-t border-white/10 pt-4">
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">Fasilitas Unggulan</p>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                             <div className="flex items-center gap-1.5"><CheckCircle size={10} className="text-green-400" /> Manual Brew Kopi</div>
                             <div className="flex items-center gap-1.5"><CheckCircle size={10} className="text-green-400" /> Tenda Premium</div>
                             <div className="flex items-center gap-1.5"><CheckCircle size={10} className="text-green-400" /> Makan & Minum</div>
                             <div className="flex items-center gap-1.5"><CheckCircle size={10} className="text-green-400" /> Guide & Porter</div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`flex flex-col flex-1 items-center justify-center text-center ${theme.text}`}>
                  <div className="relative mb-8">
                     <div className="absolute -inset-4 bg-white/20 blur-3xl rounded-full"></div>
                     <p className="relative text-sm font-black uppercase tracking-[0.5em] opacity-60 mb-4">Limited Slot Available</p>
                     <h3 className="relative text-7xl font-black uppercase tracking-tighter leading-[0.8]">
                        {tripName}
                     </h3>
                  </div>
                  
                  <div className="flex gap-4 mb-8">
                     <div className="bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
                        <p className="text-[9px] font-black uppercase opacity-60 mb-1">Price</p>
                        <p className="text-2xl font-black" style={{ color: theme.primary }}>{formatPrice(currentPrice)}</p>
                     </div>
                     <div className="bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
                        <p className="text-[9px] font-black uppercase opacity-60 mb-1">Jadwal</p>
                        <p className="text-2xl font-black">{tripDate}</p>
                     </div>
                  </div>

                  <div className="w-full max-w-sm h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 mb-8"></div>
                  
                  <div className="flex flex-wrap justify-center gap-6 opacity-80">
                     <div className="flex flex-col items-center">
                        <MapPin size={16} className="mb-1" style={{ color: theme.primary }} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{tripMepo}</span>
                     </div>
                     <div className="flex flex-col items-center">
                        <Map size={16} className="mb-1" style={{ color: theme.primary }} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Via {customVia}</span>
                     </div>
                     <div className="flex flex-col items-center">
                        <Clock size={16} className="mb-1" style={{ color: theme.primary }} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{tripDuration}</span>
                     </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className={`flex items-center justify-between border-t border-current border-opacity-10 pt-6 mt-auto ${theme.text}`}>
                <div className="space-y-1">
                  <p className="text-[8px] font-black uppercase tracking-[0.25em] opacity-40">Booking / Info Lengkap</p>
                  <p className="text-xs font-black">ngopidiketinggian.com</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[8px] font-black uppercase tracking-[0.25em] opacity-40">Instagram</p>
                  <p className="text-xs font-black">@ngopidiketinggian</p>
                </div>
              </div>

              {/* Decor */}
              <div className="absolute -bottom-20 -left-20 w-80 h-80 opacity-5 rounded-full blur-[100px]" style={{ backgroundColor: theme.primary }}></div>
              <div className="absolute top-0 right-0 w-64 h-64 opacity-10 rounded-full blur-[80px]" style={{ backgroundColor: theme.primary }}></div>
            </div>

            {/* Side Branding */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 rotate-90 origin-right mr-4 opacity-10 pointer-events-none">
               <span className={`text-[40px] font-black uppercase tracking-[0.5em] whitespace-nowrap ${theme.text}`}>EST. 2024 • NGOPI DI KETINGGIAN</span>
            </div>
          </div>
          
          <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white flex items-center gap-3 shadow-sm pointer-events-none">
             <div className="w-2.5 h-2.5 rounded-full bg-[#ff5722] animate-pulse shadow-[0_0_10px_#ff5722]"></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-[#1a1a1a]">Digital Studio Mode</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
