import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Download, Layout, Smartphone, Monitor, Coffee, Calendar, MapPin, 
  CreditCard, Clock, CheckCircle, Map, Hash, Trash2, Eye, Sparkles, 
  RotateCcw, Compass, Star, Award, ShieldCheck, Heart, ArrowRight
} from 'lucide-react';
import { toPng } from 'html-to-image';

interface PosterProps {
  trip: any;
  onClose: () => void;
  type: 'open' | 'private';
}

type AspectRatio = '1:1' | '4:3' | '16:9' | '9:16';
type LayoutType = 'poster' | 'rundown' | 'ad';

const THEMES = [
  { id: 'dark', color: 'bg-[#111111]', text: 'text-white', primary: '#ff5722', secondary: '#222222', accent: '#ff7a50' },
  { id: 'light', color: 'bg-white border-4 border-black', text: 'text-black', primary: '#ff5722', secondary: '#f3f4f6', accent: '#e64a19' },
  { id: 'orange', color: 'bg-[#ff5722]', text: 'text-white', primary: '#111111', secondary: '#d84315', accent: '#ffd54f' },
  { id: 'slate', color: 'bg-[#0f172a]', text: 'text-white', primary: '#38bdf8', secondary: '#1e293b', accent: '#06b6d4' },
  { id: 'emerald', color: 'bg-[#022c22]', text: 'text-white', primary: '#10b981', secondary: '#064e3b', accent: '#34d399' },
  { id: 'indigo', color: 'bg-[#1e1b4b]', text: 'text-white', primary: '#818cf8', secondary: '#312e81', accent: '#a5b4fc' },
  { id: 'sunset', color: 'bg-gradient-to-br from-[#85144b] to-[#f012be]', text: 'text-white', primary: '#ffdc00', secondary: 'rgba(0,0,0,0.3)', accent: '#7fdbff' },
  { id: 'retro', color: 'bg-[#f4efe6] border-4 border-[#2b2927]', text: 'text-[#2b2927]', primary: '#d95d39', secondary: '#dfd5c6', accent: '#f0a202' },
];

export const TripPosterGenerator = ({ trip, onClose, type: initialType }: PosterProps) => {
  const [ratio, setRatio] = useState<AspectRatio>('1:1');
  const [layout, setLayout] = useState<LayoutType>('poster');
  const [theme, setTheme] = useState(THEMES[0]);
  const [bgOpacity, setBgOpacity] = useState(0.45);
  const [tripTypeLabel, setTripTypeLabel] = useState(initialType === 'open' ? 'OPEN TRIP' : 'PRIVATE TRIP');
  const [customVia, setCustomVia] = useState(trip.path || trip.paths?.[0]?.name || 'Jalur Utama');
  const [showDiscountBadge, setShowDiscountBadge] = useState(trip.showDiscountBadge !== false);
  
  // New States for mobile responsiveness and user experience
  const [showPreview, setShowPreview] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'controls' | 'preview'>('controls');
  const [containerSize, setContainerSize] = useState({ width: 500, height: 500 });
  const [isDownloading, setIsDownloading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);

  // Auto Reset preview when crucial visual options change so they click "See Preview" again
  useEffect(() => {
    setShowPreview(false);
    if (window.innerWidth < 768) {
      setActiveMobileTab('controls');
    }
  }, [ratio, layout, theme, tripTypeLabel]);

  // Dynamically observe container dimensions to scale high-res DOM perfectly
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateSize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setContainerSize({
          width: rect.width || 500,
          height: rect.height || 500
        });
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateSize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [showPreview, ratio, layout]);

  // Calculate Base Dimensions for locked-ratio rendering
  const getBaseDimensions = () => {
    switch (ratio) {
      case '1:1': return { width: 600, height: 600 };
      case '4:3': return { width: 640, height: 480 };
      case '16:9': return { width: 800, height: 450 };
      case '9:16': return { width: 450, height: 800 };
      default: return { width: 600, height: 600 };
    }
  };

  const baseDim = getBaseDimensions();
  // Safe scale factor with extra padding for previews
  const padding = window.innerWidth < 768 ? 24 : 48;
  const scaleX = (containerSize.width - padding) / baseDim.width;
  const scaleY = (containerSize.height - padding) / baseDim.height;
  const scale = Math.min(scaleX, scaleY, 1); // Clamp scale to a max of 1

  const downloadPoster = async () => {
    if (posterRef.current === null) return;
    setIsDownloading(true);
    
    const originalTransform = posterRef.current.style.transform;
    posterRef.current.style.transform = 'scale(1)';
    
    try {
      // Delay briefly to allow DOM reflow
      await new Promise(resolve => setTimeout(resolve, 150));
      const dataUrl = await toPng(posterRef.current, { 
        cacheBust: true, 
        pixelRatio: 4, 
        quality: 1,
      });
      const link = document.createElement('a');
      link.download = `ngopi-trip-${tripName.replace(/\s+/g, '-').toLowerCase()}-${layout}-${ratio}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download poster', err);
    } finally {
      posterRef.current.style.transform = originalTransform;
      setIsDownloading(false);
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
  const tripDuration = initialType === 'open' ? trip.duration : (trip.paths?.[0]?.durations?.[0]?.label || '2 Hari 1 Malam');

  // Breakdown rundown text into lines for itinerary timeline
  const rundownLines = (trip.rundownText || "Hari 1: Berkumpul di Mepo, Perjalanan & Camp.\nHari 2: Summit Attack, Turun & Kembali.")
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0)
    .slice(0, 5); // take max 5 items to keep visuals clean

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-black/95 backdrop-blur-xl"
    >
      <div className="bg-[#f3f4f6] w-full max-w-6xl rounded-none md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-full md:h-[95vh] border border-white/10">
        
        {/* Mobile Tab Header */}
        <div className="md:hidden flex border-b border-gray-200 bg-white">
          <button 
            onClick={() => setActiveMobileTab('controls')} 
            className={`flex-1 py-4 text-center text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeMobileTab === 'controls' ? 'border-art-orange text-art-text' : 'border-transparent text-gray-400'}`}
          >
            🎨 Desain & Opsi
          </button>
          <button 
            onClick={() => { setShowPreview(true); setActiveMobileTab('preview'); }} 
            className={`flex-1 py-4 text-center text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeMobileTab === 'preview' ? 'border-art-orange text-art-text' : 'border-transparent text-gray-400'}`}
          >
            👁️ Hasil Preview
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left Panel: Controls */}
          <div className={`w-full md:w-96 p-6 md:p-8 border-r border-gray-200 bg-white space-y-6 overflow-y-auto custom-scrollbar ${activeMobileTab === 'controls' ? 'block' : 'hidden md:block'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-[#1a1a1a]">Poster Creator</h2>
                <p className="text-[9px] font-black text-art-orange uppercase tracking-widest mt-0.5">NGOPI DI KETINGGIAN STUDIO</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <hr className="border-gray-100" />

            {/* Layout Switcher */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5">
                <Layout size={12} className="text-art-orange" /> Tipe Layout
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'poster', label: 'Poster 🏞️' },
                  { id: 'rundown', label: 'Info 🗒️' },
                  { id: 'ad', label: 'Iklan 📣' }
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLayout(l.id as LayoutType)}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${layout === l.id ? 'bg-art-text text-white border-art-text shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ratio Selector */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5">
                <Smartphone size={12} className="text-art-orange" /> Rasio Ukuran
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: '1:1', icon: Smartphone, label: '1:1 IG' },
                  { id: '4:3', icon: Layout, label: '4:3 Post' },
                  { id: '16:9', icon: Monitor, label: '16:9 Landscape' },
                  { id: '9:16', icon: Smartphone, label: '9:16 Story' }
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRatio(r.id as AspectRatio)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all ${ratio === r.id ? 'border-art-orange bg-orange-50/50 text-art-orange shadow-sm' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                  >
                    <r.icon size={16} />
                    <span className="text-[8px] font-black mt-1 uppercase tracking-tighter">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tipe & Jalur */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5">
                <Map size={12} className="text-art-orange" /> Tipe & Jalur Kustom
              </label>
              <div className="flex gap-1.5 mb-1">
                 {['OPEN TRIP', 'PRIVATE TRIP'].map(t => (
                   <button 
                    key={t}
                    onClick={() => setTripTypeLabel(t)}
                    className={`flex-1 py-2 rounded-lg text-[9px] font-black border-2 transition-all ${tripTypeLabel === t ? 'bg-art-text text-white border-art-text' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}
                   >
                     {t}
                   </button>
                 ))}
              </div>
              <input 
                className="w-full border-2 border-gray-100 p-3 rounded-xl text-xs font-bold focus:border-art-orange outline-none bg-gray-50/50"
                value={customVia}
                onChange={e => setCustomVia(e.target.value)}
                placeholder="Via / Jalur..."
              />
            </div>

            {/* Themes Selector */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5">
                  <Sparkles size={12} className="text-art-orange" /> Tema Desain
                </label>
                <span className="text-[8px] font-black bg-art-orange/10 text-art-orange px-1.5 py-0.5 rounded uppercase tracking-widest">{theme.id}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t)}
                    className={`h-9 rounded-xl ${t.color} flex items-center justify-center border border-black/10 transition-all ${theme.id === t.id ? 'ring-2 ring-offset-2 ring-art-orange scale-105' : 'opacity-80 hover:opacity-100'}`}
                  >
                    {theme.id === t.id && <CheckCircle size={14} className={t.id === 'light' || t.id === 'retro' ? 'text-black' : 'text-white'} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Badge Diskon</label>
                <button 
                  onClick={() => setShowDiscountBadge(!showDiscountBadge)}
                  className={`w-full py-2.5 rounded-xl text-[9px] font-black uppercase border-2 transition-all flex items-center justify-center gap-1.5 ${showDiscountBadge ? 'bg-art-orange/10 border-art-orange text-art-orange' : 'bg-white border-gray-100 text-gray-400'}`}
                >
                  {showDiscountBadge ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>
              
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Transparansi BG</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="range" min="0" max="1" step="0.05" 
                    value={bgOpacity} 
                    onChange={e => setBgOpacity(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-art-orange"
                  />
                  <span className="text-[9px] font-black text-gray-500 w-8 text-right">{Math.round(bgOpacity * 100)}%</span>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Desktop Direct Generate/Preview Switch */}
            <div className="hidden md:block pt-2">
              {!showPreview ? (
                <button 
                  onClick={() => setShowPreview(true)}
                  className="w-full bg-art-orange hover:bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-[4px_4px_0px_#1a1a1a] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                  <Eye size={16} /> Render Preview Poster
                </button>
              ) : (
                <div className="space-y-3">
                  <button 
                    onClick={downloadPoster}
                    disabled={isDownloading}
                    className="w-full bg-art-text hover:bg-black disabled:bg-gray-400 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95"
                  >
                    <Download size={16} /> {isDownloading ? 'Downloading...' : 'Download HD Poster'}
                  </button>
                  <button 
                    onClick={() => setShowPreview(false)}
                    className="w-full border-2 border-gray-200 hover:border-art-orange bg-white text-gray-500 hover:text-art-orange py-2.5 rounded-xl font-black uppercase tracking-wider text-[9px] flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RotateCcw size={12} /> Ubah Pilihan Desain
                  </button>
                </div>
              )}
              <p className="text-[8px] text-center mt-3 text-gray-400 uppercase font-black tracking-widest">OUTPUT: HIGH-RESOLUTION 4X PNG</p>
            </div>
          </div>

          {/* Right Panel: Preview Area / Workspace */}
          <div 
            ref={containerRef} 
            className={`flex-1 bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-8 flex items-center justify-center overflow-hidden relative ${activeMobileTab === 'preview' ? 'block' : 'hidden md:block'}`}
          >
            
            {/* Dynamic Rendering based on Preview state */}
            {!showPreview ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-md p-8 rounded-[2.5rem] text-center text-white space-y-6 shadow-2xl relative overflow-hidden"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-art-orange/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-art-green/10 rounded-full blur-2xl"></div>

                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto shadow-lg border border-white/10 text-art-orange">
                  <Sparkles size={32} className="animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-tight">Studio Poster Digital</h3>
                  <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] max-w-xs mx-auto leading-relaxed">
                    Render layout berkualitas tinggi dengan rasio presisi untuk sosial media dan materi promosi trip.
                  </p>
                </div>

                {/* Configuration Specs Indicator */}
                <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-2xl border border-white/5 text-[9px] font-black uppercase tracking-wider">
                  <div>
                    <span className="block text-white/40 mb-0.5">Rasio</span>
                    <span className="text-art-orange">{ratio}</span>
                  </div>
                  <div className="border-x border-white/5">
                    <span className="block text-white/40 mb-0.5">Tema</span>
                    <span className="text-art-orange">{theme.id}</span>
                  </div>
                  <div>
                    <span className="block text-white/40 mb-0.5">Layout</span>
                    <span className="text-art-orange">{layout}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowPreview(true)}
                  className="w-full bg-art-orange hover:bg-white text-white hover:text-art-text py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl transition-all"
                >
                  <Eye size={16} /> Lihat Preview Desain
                </button>
              </motion.div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center overflow-auto custom-scrollbar relative">
                
                {/* Poster Workspace Wrapper with rigid scaling formula */}
                <div 
                  className="flex items-center justify-center overflow-hidden flex-shrink-0"
                  style={{
                    width: `${baseDim.width}px`,
                    height: `${baseDim.height}px`,
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    transition: 'all 0.3s ease-in-out'
                  }}
                >
                  {/* High Resolution Render Canvas */}
                  <div 
                    ref={posterRef}
                    className={`w-full h-full ${theme.color} relative overflow-hidden flex flex-col transition-all duration-300`}
                    style={{ width: `${baseDim.width}px`, height: `${baseDim.height}px` }}
                  >
                    
                    {/* Background Visual Layer */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-opacity duration-300" 
                      style={{ 
                        backgroundImage: trip.image ? `url(${trip.image})` : 'none',
                        opacity: bgOpacity 
                      }}
                    ></div>

                    {/* Gradient Overlay for superior readability */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${
                      theme.id === 'light' || theme.id === 'retro' 
                        ? 'from-white/35 via-transparent to-white/10' 
                        : 'from-[#0b0c10]/85 via-black/40 to-[#0b0c10]/40'
                    }`}></div>
                    
                    {/* DESIGN ELEMENTS: CHOOSE BY LAYOUT */}
                    
                    {/* LAYOUT A: POSTER (Cinematic, clean, majestic mountain cover) */}
                    {layout === 'poster' && (
                      <div className={`relative z-10 flex flex-col h-full ${ratio === '9:16' ? 'p-[12%]' : ratio === '16:9' ? 'p-[5%]' : 'p-[8%]'} justify-between`}>
                        
                        {/* Header Branding */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center shadow-lg rotate-6">
                              <Coffee size={18} className="text-art-orange" />
                            </div>
                            <div className={theme.text}>
                              <h1 className="text-[8px] font-black uppercase tracking-[0.2em] leading-none opacity-85">Ngopi di</h1>
                              <h2 className="text-xs font-black uppercase tracking-[0.1em] leading-none text-art-orange">Ketinggian</h2>
                            </div>
                          </div>
                          
                          <div className="inline-block px-2.5 py-0.5 rounded-full border border-current text-[8px] font-black tracking-widest uppercase" style={{ color: theme.accent }}>
                            {tripTypeLabel}
                          </div>
                        </div>

                        {/* Middle: Title Block */}
                        <div className="my-auto space-y-3">
                          <p className={`text-[10px] font-black uppercase tracking-[0.4em] opacity-80 ${theme.text}`}>Explore Mountain</p>
                          <h3 className={`font-black uppercase leading-[0.85] tracking-tighter ${theme.text} ${ratio === '9:16' ? 'text-6xl' : 'text-5xl'}`}>
                            {tripName}
                          </h3>
                          <div className="h-1.5 w-24 rounded-full" style={{ backgroundColor: theme.primary }}></div>
                          <p className={`text-[9px] font-bold tracking-widest uppercase opacity-70 ${theme.text}`}>Via {customVia}</p>
                        </div>

                        {/* Bottom Info Row */}
                        <div className="space-y-4">
                          <div className={`grid grid-cols-2 ${ratio === '16:9' ? 'grid-cols-4 gap-4' : 'gap-y-4 gap-x-6'} ${theme.text}`}>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 opacity-40">
                                <Calendar size={12} />
                                <span className="text-[8px] font-black uppercase tracking-widest">Jadwal</span>
                              </div>
                              <p className="text-xs font-black">{tripDate}</p>
                            </div>
                            
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 opacity-40">
                                <Clock size={12} />
                                <span className="text-[8px] font-black uppercase tracking-widest">Durasi</span>
                              </div>
                              <p className="text-xs font-black uppercase">{tripDuration}</p>
                            </div>

                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 opacity-40">
                                <MapPin size={12} />
                                <span className="text-[8px] font-black uppercase tracking-widest">Mepo</span>
                              </div>
                              <p className="text-xs font-black truncate">{tripMepo}</p>
                            </div>

                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 opacity-40">
                                <CreditCard size={12} />
                                <span className="text-[8px] font-black uppercase tracking-widest">Investasi</span>
                              </div>
                              <div className="flex items-baseline gap-1">
                                {originalPrice > currentPrice && (
                                  <span className="text-[9px] font-black line-through opacity-30">
                                    {formatPrice(originalPrice)}
                                  </span>
                                )}
                                <p className="text-sm font-black" style={{ color: theme.accent }}>
                                  {formatPrice(currentPrice)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Footer links */}
                          <div className="flex justify-between items-center pt-3 border-t border-current border-opacity-10 text-[9px] font-bold opacity-60">
                            <span>@ngopi.dketinggian</span>
                            <span>linktr.ee/ngopi.dketinggian</span>
                          </div>
                        </div>

                        {/* Discount Sticker */}
                        {showDiscountBadge && originalPrice > currentPrice && (
                          <div className="absolute top-16 right-8 w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center -rotate-12 shadow-2xl" style={{ backgroundColor: theme.primary, borderColor: 'white' }}>
                            <span className="text-white text-[11px] font-black leading-none">{Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}%</span>
                            <span className="text-white text-[7px] font-black uppercase leading-none mt-0.5">OFF</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* LAYOUT B: INFO (Structured, informative, elegant itinerary cards) */}
                    {layout === 'rundown' && (
                      <div className={`relative z-10 flex flex-col h-full ${ratio === '9:16' ? 'p-[10%]' : 'p-[6%]'} justify-between`}>
                        {/* Header Branding */}
                        <div className="flex justify-between items-center border-b border-current border-opacity-15 pb-3">
                          <div className="flex items-center gap-1.5">
                            <Compass size={16} style={{ color: theme.accent }} />
                            <span className={`text-[9px] font-black uppercase tracking-widest ${theme.text}`}>Trip Details & Itinerary</span>
                          </div>
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded border border-current" style={{ color: theme.accent }}>{tripTypeLabel}</span>
                        </div>

                        {/* Content Grid */}
                        <div className={`my-auto grid ${ratio === '16:9' ? 'grid-cols-2 gap-4' : 'grid-cols-1 gap-4'} items-stretch`}>
                          
                          {/* Left Column: Mountain Specs & Rundown */}
                          <div className="space-y-3">
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5 backdrop-blur-sm">
                              <p className="text-[7px] font-black uppercase tracking-wider opacity-60 mb-0.5">Destinasi Gunung</p>
                              <h4 className={`text-xl font-black uppercase tracking-tight ${theme.text}`}>{tripName}</h4>
                              <p className="text-[9px] font-bold opacity-70">Jalur: {customVia} • {tripDuration}</p>
                            </div>

                            <div className="bg-black/35 p-3.5 rounded-xl border border-white/10 space-y-2">
                              <p className="text-[8px] font-black uppercase tracking-widest text-art-orange border-b border-white/5 pb-1">Rencana Kegiatan</p>
                              <div className="space-y-2 text-[9px] font-bold leading-relaxed text-white/90">
                                {rundownLines.map((line: string, i: number) => (
                                  <div key={i} className="flex items-start gap-2">
                                    <span className="w-4 h-4 bg-art-orange text-white text-[8px] font-black rounded-full flex items-center justify-center shrink-0">{i+1}</span>
                                    <p className="text-white/80">{line}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Pricing & Inclusions */}
                          <div className="space-y-3 flex flex-col justify-between">
                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between">
                              <div>
                                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Fasilitas Included</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1.5 text-[8px] font-bold">
                                  <div className="flex items-center gap-1"><CheckCircle size={8} className="text-green-400" /> Tenda Camp</div>
                                  <div className="flex items-center gap-1"><CheckCircle size={8} className="text-green-400" /> Manual Brew Kopi</div>
                                  <div className="flex items-center gap-1"><CheckCircle size={8} className="text-green-400" /> Makan & Minum</div>
                                  <div className="flex items-center gap-1"><CheckCircle size={8} className="text-green-400" /> Guide APGI</div>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white/10 p-3 rounded-xl border-2 border-dashed border-white/20">
                              <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Investasi Trip</p>
                              <div className="flex items-baseline gap-2 mt-1">
                                {originalPrice > currentPrice && (
                                  <span className="text-[10px] font-black line-through opacity-30">
                                    {formatPrice(originalPrice)}
                                  </span>
                                )}
                                <p className="text-2xl font-black" style={{ color: theme.accent }}>
                                  {formatPrice(currentPrice)}
                                </p>
                              </div>
                              <p className="text-[7px] text-white/50 mt-1 uppercase font-bold tracking-widest">Meeting Point: {tripMepo}</p>
                            </div>
                          </div>
                        </div>

                        {/* Footer Contacts */}
                        <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest opacity-60 pt-3 border-t border-current border-opacity-10">
                          <span>Hubungi Kami: linktr.ee/ngopi.dketinggian</span>
                          <span>IG: @ngopi.dketinggian</span>
                        </div>
                      </div>
                    )}

                    {/* LAYOUT C: IKLAN (Loud, energetic, brutalist Instagram ad copy) */}
                    {layout === 'ad' && (
                      <div className={`relative z-10 flex flex-col h-full ${ratio === '9:16' ? 'p-[12%]' : 'p-[8%]'} justify-between border-[6px]`} style={{ borderColor: theme.primary }}>
                        
                        {/* Top: Hype Banner */}
                        <div className="flex justify-between items-center bg-black text-white px-3 py-1 rounded-lg border border-white/10">
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-art-orange animate-pulse">🔥 LIMITED SEAT AVAILABLE!</span>
                          <span className="text-[7px] font-bold uppercase">DAFTAR INSTAN VIA WA</span>
                        </div>

                        {/* Title Display */}
                        <div className="my-auto text-center space-y-2 relative">
                          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-art-orange">SAATNYA KELUAR DARI RUTINITAS!</p>
                          <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                            {tripName}
                          </h3>
                          <p className="text-xs font-bold text-white/80">Via {customVia} • {tripDuration}</p>

                          {/* High Energy Star Ratings */}
                          <div className="flex justify-center items-center gap-1 text-yellow-400 mt-2">
                            {[1,2,3,4,5].map(s => <Star key={s} size={10} fill="currentColor" />)}
                            <span className="text-[8px] font-black text-white ml-1 bg-black/40 px-1 py-0.5 rounded">5.0 (APGI RATED)</span>
                          </div>
                        </div>

                        {/* High Impact Core Services pills */}
                        <div className="space-y-1.5 max-w-sm mx-auto w-full">
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="bg-black/40 border border-white/10 px-2 py-1.5 rounded-xl text-center backdrop-blur-md">
                              <span className="block text-[7px] text-white/50 uppercase">Manual Brew</span>
                              <span className="text-[9px] font-black text-white uppercase">☕ KOPI SEPUASNYA</span>
                            </div>
                            <div className="bg-black/40 border border-white/10 px-2 py-1.5 rounded-xl text-center backdrop-blur-md">
                              <span className="block text-[7px] text-white/50 uppercase">Alat Lengkap</span>
                              <span className="text-[9px] font-black text-white uppercase">🏕️ ALAT DISEDIAKAN</span>
                            </div>
                          </div>

                          {/* Price Display inside highlighted card */}
                          <div className="bg-gradient-to-r from-art-orange to-orange-600 p-3 rounded-2xl text-center text-white border-2 border-white shadow-xl">
                            <p className="text-[8px] font-black uppercase tracking-widest leading-none mb-1">HARGA KHUSUS MINGGU INI</p>
                            <div className="flex justify-center items-baseline gap-1.5">
                              {originalPrice > currentPrice && (
                                <span className="text-[11px] font-black line-through opacity-50">
                                  {formatPrice(originalPrice)}
                                </span>
                              )}
                              <span className="text-2xl font-black text-white drop-shadow">
                                {formatPrice(currentPrice)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom CTA Block with Hand Pointer Accent */}
                        <div className="space-y-2 pt-3 border-t border-white/10">
                          <div className="flex items-center justify-between text-[8px] font-black uppercase text-white/80">
                            <span>👇 BOOKING SEKARANG</span>
                            <span>@ngopi.dketinggian</span>
                          </div>
                          <div className="bg-white text-black p-2 rounded-xl text-center font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center justify-center gap-1">
                            <span>KLIK LINK DI BIO</span> <ArrowRight size={12} className="text-art-orange animate-bounce" />
                          </div>
                        </div>

                        {/* Extra discount overlay badge */}
                        {showDiscountBadge && originalPrice > currentPrice && (
                          <div className="absolute top-16 right-8 w-16 h-16 rounded-full border-4 flex flex-col items-center justify-center -rotate-12 shadow-[0_12px_30px_rgba(0,0,0,0.5)] animate-bounce" style={{ backgroundColor: '#ff5722', borderColor: 'white' }}>
                            <span className="text-white text-[12px] font-black leading-none">{Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}%</span>
                            <span className="text-white text-[7px] font-black uppercase leading-none mt-0.5">POTONGAN</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Decor ambient light points inside canvas */}
                    <div className="absolute -bottom-24 -left-24 w-60 h-60 opacity-20 rounded-full blur-[80px]" style={{ backgroundColor: theme.primary }}></div>
                    <div className="absolute -top-24 -right-24 w-60 h-60 opacity-25 rounded-full blur-[80px]" style={{ backgroundColor: theme.accent }}></div>
                  </div>
                </div>

                {/* Secondary Action Toolbar shown underneath the preview */}
                <div className="mt-4 flex flex-col sm:flex-row gap-2.5 w-full max-w-sm px-4 relative z-50">
                  <button 
                    onClick={downloadPoster}
                    disabled={isDownloading}
                    className="flex-1 bg-art-orange hover:bg-black disabled:bg-gray-400 text-white py-3 px-5 rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 shadow-xl transition-all"
                  >
                    <Download size={14} /> {isDownloading ? 'Downloading...' : 'Download HD (PNG)'}
                  </button>
                  <button 
                    onClick={() => {
                      setShowPreview(false);
                      if (window.innerWidth < 768) {
                        setActiveMobileTab('controls');
                      }
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/10 py-3 px-5 rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RotateCcw size={14} /> Ubah Desain
                  </button>
                </div>
              </div>
            )}
            
            {/* Status indicator tag */}
            <div className="absolute top-6 left-6 bg-white/15 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shadow-lg pointer-events-none z-50">
               <div className="w-2 h-2 rounded-full bg-art-orange animate-pulse shadow-[0_0_8px_#ff5722]"></div>
               <span className="text-[8px] font-black uppercase tracking-widest text-white/90">DIGITAL RENDERER</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
