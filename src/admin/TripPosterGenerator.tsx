import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Download, Layout, Smartphone, Monitor, Coffee, Calendar, MapPin, 
  CreditCard, Clock, CheckCircle, Map, Trash2, Eye, Sparkles, 
  RotateCcw, Compass, Star, ArrowRight, Clipboard, Check,
  ChevronLeft, ChevronRight, CheckSquare, Square
} from 'lucide-react';
import { toPng } from 'html-to-image';

interface PosterProps {
  trip: any;
  onClose: () => void;
  type: 'open' | 'private';
  config?: any;
}

type AspectRatio = '1:1' | '4:3' | '16:9' | '9:16';
type LayoutType = 'poster' | 'rundown' | 'ad' | 'gears' | 'rules' | 'flag' | 'board';

const THEMES = [
  { id: 'dark', color: 'bg-[#111111]', text: 'text-white', primary: '#ff5722', secondary: '#222222', accent: '#ff7a50' },
  { id: 'light', color: 'bg-white border-4 border-black', text: 'text-black', primary: '#ff5722', secondary: '#f3f4f6', accent: '#e64a19' },
  { id: 'orange', color: 'bg-[#ff5722]', text: 'text-white', primary: '#111111', secondary: '#d84315', accent: '#ffd54f' },
  { id: 'slate', color: 'bg-[#0f172a]', text: 'text-white', primary: '#38bdf8', secondary: '#1e293b', accent: '#06b6d4' },
];

const ALL_SLIDES: { id: LayoutType, label: string }[] = [
  { id: 'poster', label: 'Poster Utama' },
  { id: 'rundown', label: 'Info / Rundown' },
  { id: 'gears', label: 'Perlengkapan' },
  { id: 'rules', label: 'Aturan' },
  { id: 'ad', label: 'Iklan' },
  { id: 'flag', label: 'Bendera' },
  { id: 'board', label: 'Papan' }
];

export const TripPosterGenerator = ({ trip, onClose, type: initialType, config }: PosterProps) => {
  const tripName = trip.name || 'Gunung Indonesia';
  const [ratio, setRatio] = useState<AspectRatio>('1:1');
  
  type PostCategory = 'kreator' | 'info' | 'iklan' | 'bendera' | 'papan' | 'custom';
  const [postCategory, setPostCategory] = useState<PostCategory>('info');
  
  const [selectedSlides, setSelectedSlides] = useState<LayoutType[]>(['poster', 'rundown', 'gears', 'rules', 'ad']);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const [flagDesign, setFlagDesign] = useState<number>(1);
  const [boardDesign, setBoardDesign] = useState<number>(1);
  const [boardDescription, setBoardDescription] = useState('Semoga langkah ini menjadi awal dari petualangan hebat lainnya.');
  
  const [theme, setTheme] = useState(THEMES[0]);
  const [bgOpacity, setBgOpacity] = useState(0.45);
  const [tripTypeLabel, setTripTypeLabel] = useState(initialType === 'open' ? 'OPEN TRIP' : 'PRIVATE TRIP');
  
  const rawVia = trip.path || trip.paths?.[0]?.name || 'Jalur Utama';
  const cleanVia = rawVia.replace(/^(via|Via|VIA)s+/i, '');
  const [customVia, setCustomVia] = useState(cleanVia);
  const [showDiscountBadge, setShowDiscountBadge] = useState(trip.showDiscountBadge !== false);

  useEffect(() => {
    switch (postCategory) {
      case 'kreator':
        setSelectedSlides(['poster']);
        break;
      case 'info':
        setSelectedSlides(['poster', 'rundown', 'gears', 'rules', 'ad']);
        break;
      case 'iklan':
        setSelectedSlides(['ad', 'rundown', 'gears']);
        break;
      case 'bendera':
        setSelectedSlides(['flag']);
        break;
      case 'papan':
        setSelectedSlides(['board']);
        break;
    }
    setActiveSlideIndex(0);
  }, [postCategory]);

  const activeLayout = selectedSlides[activeSlideIndex] || 'poster';

  const [mountainName, setMountainName] = useState(() => {
    return tripName.replace(/(Open|Private|Trip|Gunung|Gede|Pangrango)\s*/gi, '').trim() || 'GEDE PANGRANGO';
  });
  
  const [mountainMdpl, setMountainMdpl] = useState(() => {
    const nameLower = tripName.toLowerCase();
    if (nameLower.includes('pangrango')) return '3.019 MDPL';
    if (nameLower.includes('gede')) return '2.958 MDPL';
    if (nameLower.includes('prau')) return '2.565 MDPL';
    if (nameLower.includes('merbabu')) return '3.142 MDPL';
    if (nameLower.includes('rinjani')) return '3.726 MDPL';
    if (nameLower.includes('semeru')) return '3.676 MDPL';
    return '2.958 MDPL';
  });

  const [showPreview, setShowPreview] = useState(true);
  const [activeMobileTab, setActiveMobileTab] = useState<'controls' | 'preview'>('preview');
  const [containerSize, setContainerSize] = useState({ width: 500, height: 500 });
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setActiveMobileTab('controls');
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateSize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setContainerSize({
          width: rect.width - 32, 
          height: rect.height - 120 
        });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [activeMobileTab, showPreview]);

  // Dimension scaling calculation
  const getCanvasDimensions = () => {
    let width = 1080;
    let height = 1080;
    switch (ratio) {
      case '1:1': width = 1080; height = 1080; break;
      case '4:3': width = 1440; height = 1080; break;
      case '16:9': width = 1920; height = 1080; break;
      case '9:16': width = 1080; height = 1920; break;
    }
    return { width, height };
  };

  const { width: targetW, height: targetH } = getCanvasDimensions();
  
  const getScale = () => {
    const scaleW = containerSize.width / targetW;
    const scaleH = containerSize.height / targetH;
    return Math.min(scaleW, scaleH, 1) * 0.95; // 95% to give some breathing room
  };

  const currentScale = getScale();

  const handleDownload = async () => {
    if (!posterRef.current || selectedSlides.length === 0) return;
    setIsDownloading(true);
    
    try {
      const el = posterRef.current;
      const dataUrl = await toPng(el, { 
        quality: 1, 
        pixelRatio: 2, 
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `${tripName.replace(/[^a-zA-Z0-9]/g, '_')}_${activeLayout}_${ratio}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed', err);
      alert('Gagal mendownload gambar. Coba gunakan browser lain atau matikan AdBlock.');
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleSlide = (slideId: LayoutType) => {
    setPostCategory('custom');
    if (selectedSlides.includes(slideId)) {
      if (selectedSlides.length > 1) {
        const newSlides = selectedSlides.filter(s => s !== slideId);
        setSelectedSlides(newSlides);
        if (activeSlideIndex >= newSlides.length) {
          setActiveSlideIndex(newSlides.length - 1);
        }
      }
    } else {
      setSelectedSlides([...selectedSlides, slideId]);
    }
  };

  const renderContent = () => {
    const bgUrl = trip.coverImage || 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a';
    
    switch (activeLayout) {
      case 'poster':
        return (
          <div className="absolute inset-0 p-12 flex flex-col justify-between" style={{ zIndex: 10 }}>
            <div className="flex justify-between items-start">
              <div className="bg-art-orange text-white px-6 py-2 rounded-full text-2xl font-black uppercase tracking-widest shadow-lg border-4 border-white/20 backdrop-blur-md flex items-center gap-2">
                <Compass size={24} /> {tripTypeLabel}
              </div>
              <div className="text-right">
                <div className={`text-4xl font-black ${theme.text} drop-shadow-xl flex items-center justify-end gap-2`}>
                  <MapPin size={32} className="text-art-orange" /> {trip.destinasi}
                </div>
                <div className={`text-2xl font-bold ${theme.text} opacity-90 mt-2 bg-black/40 px-4 py-1 rounded-xl inline-block backdrop-blur-sm`}>
                  Via {customVia}
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <h1 className={`text-[8rem] leading-none font-black ${theme.text} uppercase tracking-tighter drop-shadow-2xl`}>
                {mountainName}
              </h1>
              <p className="text-4xl font-bold text-art-orange uppercase tracking-[0.5em] drop-shadow-lg">
                {mountainMdpl}
              </p>
            </div>

            <div className="flex justify-between items-end">
              <div className="space-y-4">
                <div className={`flex items-center gap-4 ${theme.text} text-3xl font-black bg-black/40 p-4 rounded-2xl backdrop-blur-md border border-white/10`}>
                  <Calendar className="text-art-orange" size={32} /> 
                  {trip.jadwal || 'Jadwal Fleksibel'}
                </div>
                <div className={`flex items-center gap-4 ${theme.text} text-2xl font-bold bg-black/40 p-4 rounded-2xl backdrop-blur-md border border-white/10`}>
                  <Clock className="text-art-orange" size={28} />
                  {trip.durasi || '2H 1M'}
                </div>
              </div>

              <div className="text-right space-y-2">
                {showDiscountBadge && trip.discountPrice && (
                  <div className="text-3xl text-gray-300 line-through font-bold drop-shadow-md">
                    Rp {trip.price?.toLocaleString('id-ID')}
                  </div>
                )}
                <div className={`text-6xl font-black ${theme.text} drop-shadow-2xl flex items-center gap-2 bg-black/40 p-4 rounded-2xl backdrop-blur-md border-2 border-art-orange`}>
                  <span className="text-art-orange text-4xl">Rp</span>
                  {(showDiscountBadge && trip.discountPrice ? trip.discountPrice : trip.price)?.toLocaleString('id-ID')}
                </div>
                <div className={`text-xl ${theme.text} opacity-80 uppercase tracking-widest mt-2 font-bold bg-black/40 px-4 py-2 rounded-xl inline-block backdrop-blur-sm`}>
                  / Pax
                </div>
              </div>
            </div>
          </div>
        );
      case 'rundown':
        return (
          <div className="absolute inset-0 p-16 flex flex-col" style={{ zIndex: 10 }}>
             <h2 className={`text-7xl font-black ${theme.text} uppercase tracking-tighter mb-12 flex items-center gap-6 border-b-4 border-art-orange pb-8`}>
                <Clock className="text-art-orange" size={64} /> INFO & RUNDOWN
             </h2>
             <div className="flex-1 grid grid-cols-2 gap-12">
                <div className={`bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl ${theme.text}`}>
                  <h3 className="text-4xl font-black text-art-orange mb-8 uppercase tracking-widest">Fasilitas (Include)</h3>
                  <ul className="space-y-4">
                    {['Transportasi PP', 'Tiket Masuk & Asuransi', 'Tenda & Matras', 'Makan Selama Pendakian', 'Guide & Porter Tim', 'P3K & Alat Masak'].map((inc, i) => (
                      <li key={i} className="flex items-center gap-4 text-2xl font-medium">
                        <CheckCircle className="text-art-orange shrink-0" size={28} /> {inc}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl ${theme.text}`}>
                  <h3 className="text-4xl font-black text-art-orange mb-8 uppercase tracking-widest">Itinerary Singkat</h3>
                  <ul className="space-y-6">
                    <li className="flex gap-6">
                       <span className="text-2xl font-black text-art-orange">H1</span>
                       <p className="text-2xl font-medium">Meeting point, perjalanan ke basecamp, mulai pendakian ke area camp.</p>
                    </li>
                    <li className="flex gap-6">
                       <span className="text-2xl font-black text-art-orange">H2</span>
                       <p className="text-2xl font-medium">Summit attack, kembali ke camp, turun ke basecamp, perjalanan pulang.</p>
                    </li>
                  </ul>
                  <div className="mt-8 p-6 bg-art-orange/20 rounded-2xl border-2 border-art-orange/50">
                    <p className="text-xl italic font-medium">*Rundown dapat berubah menyesuaikan kondisi lapangan dan cuaca demi keselamatan bersama.</p>
                  </div>
                </div>
             </div>
          </div>
        );
      case 'ad':
        return (
          <div className="absolute inset-0 p-16 flex flex-col justify-center items-center text-center" style={{ zIndex: 10 }}>
             <div className="bg-black/60 backdrop-blur-lg border-4 border-art-orange p-16 rounded-[3rem] w-full max-w-4xl shadow-2xl">
                <div className="flex justify-center gap-4 mb-8">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={s <= (trip.rating || 5) ? "text-yellow-400 animate-pulse" : "text-gray-500"} size={80} fill="currentColor" />
                  ))}
                </div>
                <h2 className={`text-7xl font-black ${theme.text} uppercase tracking-tighter mb-6 leading-tight`}>
                   SLOT TERBATAS!<br/><span className="text-art-orange">{tripName}</span>
                </h2>
                <p className={`text-3xl ${theme.text} opacity-90 mb-12 font-medium`}>
                   Daftar sekarang sebelum kehabisan. Sisa kuota menipis!
                </p>
                <div className="inline-flex flex-col items-center gap-4">
                  <div className="text-5xl font-black text-white bg-art-orange px-12 py-6 rounded-full uppercase tracking-widest shadow-[0_0_40px_rgba(255,87,34,0.5)]">
                     Booking Sekarang
                  </div>
                  <p className={`text-2xl ${theme.text} font-bold opacity-80`}>Klik link di bio</p>
                </div>
             </div>
          </div>
        );
      case 'gears':
      case 'rules':
      case 'flag':
      case 'board':
        return (
          <div className="absolute inset-0 flex items-center justify-center p-16" style={{ zIndex: 10 }}>
             <h2 className={`text-6xl font-black ${theme.text} uppercase`}>
                [{activeLayout.toUpperCase()}] TEMPLATE<br/>(Coming Soon)
             </h2>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex bg-gray-100 overflow-hidden text-left font-sans">
      <div className="flex flex-col md:flex-row w-full h-full">
        
        {/* Left Panel: Controls */}
        <div className={`w-full md:w-[400px] bg-white border-r border-gray-200 flex flex-col ${activeMobileTab === 'controls' ? 'flex' : 'hidden md:flex'}`}>
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10 shrink-0">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">Poster Generator</h2>
              <p className="text-[10px] font-bold text-art-orange tracking-widest uppercase">Ngopi Di Ketinggian</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* Category selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                <Layout size={14} className="text-art-orange" /> Kategori Post
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'info', label: 'Info (IG)' },
                  { id: 'iklan', label: 'Iklan' },
                  { id: 'kreator', label: '1 Poster' },
                  { id: 'custom', label: 'Custom' }
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setPostCategory(c.id as any)}
                    className={`py-2.5 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${postCategory === c.id ? 'bg-art-text text-white border-art-text shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slide Selection */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center justify-between">
                <span>Pilih Slide ({selectedSlides.length})</span>
                <span className="text-art-orange text-[9px] bg-orange-100 px-2 py-0.5 rounded-full">Urutkan</span>
              </label>
              <div className="space-y-2">
                {ALL_SLIDES.map((slide) => (
                  <button
                    key={slide.id}
                    onClick={() => toggleSlide(slide.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${selectedSlides.includes(slide.id) ? 'bg-white border-art-orange shadow-sm' : 'bg-white border-gray-200 opacity-60'}`}
                  >
                    <span className={`text-xs font-bold ${selectedSlides.includes(slide.id) ? 'text-art-text' : 'text-gray-400'}`}>{slide.label}</span>
                    {selectedSlides.includes(slide.id) ? <CheckSquare size={16} className="text-art-orange" /> : <Square size={16} className="text-gray-300" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Ratio */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                <Smartphone size={14} className="text-art-orange" /> Rasio Ukuran
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: '1:1', icon: Smartphone, label: '1:1 IG' },
                  { id: '4:3', icon: Layout, label: '4:3 Post' },
                  { id: '16:9', icon: Monitor, label: '16:9' },
                  { id: '9:16', icon: Smartphone, label: '9:16 Story' }
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRatio(r.id as AspectRatio)}
                    className={`flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all ${ratio === r.id ? 'border-art-orange bg-orange-50 text-art-orange shadow-sm' : 'border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                  >
                    <r.icon size={18} className="mb-1" />
                    <span className="text-[8px] font-black uppercase">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Themes */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                <Sparkles size={14} className="text-art-orange" /> Tema Desain
              </label>
              <div className="grid grid-cols-4 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t)}
                    className={`h-10 rounded-xl ${t.color} flex items-center justify-center border border-black/10 transition-all ${theme.id === t.id ? 'ring-2 ring-offset-2 ring-art-orange scale-105' : 'opacity-80 hover:opacity-100'}`}
                  >
                    {theme.id === t.id && <CheckCircle size={14} className={t.id === 'light' || t.id === 'retro' ? 'text-black' : 'text-white'} />}
                  </button>
                ))}
              </div>
            </div>

          </div>
          
          {/* Mobile Tab Nav */}
          <div className="md:hidden flex border-t border-gray-200 bg-white shrink-0">
             <button 
               onClick={() => setActiveMobileTab('controls')}
               className={`flex-1 py-4 text-xs font-black uppercase tracking-widest border-b-4 ${activeMobileTab === 'controls' ? 'border-art-orange text-art-text' : 'border-transparent text-gray-400'}`}
             >
               Pengaturan
             </button>
             <button 
               onClick={() => setActiveMobileTab('preview')}
               className={`flex-1 py-4 text-xs font-black uppercase tracking-widest border-b-4 ${activeMobileTab === 'preview' ? 'border-art-orange text-art-text' : 'border-transparent text-gray-400'}`}
             >
               Preview Slide
             </button>
          </div>
        </div>

        {/* Right Panel: Preview Engine */}
        <div className={`flex-1 flex flex-col bg-gray-900 relative ${activeMobileTab === 'preview' ? 'flex' : 'hidden md:flex'}`}>
          
          {/* Preview Canvas Area */}
          <div className="flex-1 overflow-hidden flex items-center justify-center relative p-4" ref={containerRef}>
             
             {selectedSlides.length > 0 ? (
               <div 
                 className="relative shadow-2xl overflow-hidden rounded-md transition-transform duration-300 ease-out flex-shrink-0"
                 style={{
                   width: targetW,
                   height: targetH,
                   transform: `scale(${currentScale})`,
                   transformOrigin: 'center center'
                 }}
               >
                 <div ref={posterRef} className={`w-full h-full relative ${theme.color}`}>
                    {/* Background Engine */}
                    <div className="absolute inset-0 z-0">
                      <img src={trip.coverImage || 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a'} alt="bg" className="w-full h-full object-cover" crossOrigin="anonymous" />
                      <div className="absolute inset-0 bg-black" style={{ opacity: bgOpacity }}></div>
                    </div>
                    {/* Content */}
                    {renderContent()}
                 </div>
               </div>
             ) : (
               <div className="text-gray-500 font-medium">Pilih minimal 1 slide untuk preview.</div>
             )}

          </div>

          {/* Bottom Nav / Slide Controls */}
          {selectedSlides.length > 0 && (
            <div className="h-24 bg-gray-950 flex items-center justify-between px-6 md:px-12 shrink-0 border-t border-gray-800">
               
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
                    disabled={activeSlideIndex === 0}
                    className="p-3 rounded-full bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-30 transition-all"
                  >
                     <ChevronLeft size={24} />
                  </button>
                  <div className="text-center">
                     <div className="text-white font-black uppercase text-sm tracking-widest">{activeLayout}</div>
                     <div className="text-gray-400 text-xs mt-1">Slide {activeSlideIndex + 1} / {selectedSlides.length}</div>
                  </div>
                  <button 
                    onClick={() => setActiveSlideIndex(prev => Math.min(selectedSlides.length - 1, prev + 1))}
                    disabled={activeSlideIndex === selectedSlides.length - 1}
                    className="p-3 rounded-full bg-art-orange text-white hover:bg-orange-600 disabled:opacity-30 transition-all"
                  >
                     <ChevronRight size={24} />
                  </button>
               </div>

               <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="bg-art-green text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-green-600 transition-colors shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50"
               >
                  {isDownloading ? (
                    <><RotateCcw size={20} className="animate-spin" /> PROSES...</>
                  ) : (
                    <><Download size={20} /> UNDUH SLIDE</>
                  )}
               </button>

            </div>
          )}
          
        </div>

      </div>
    </div>
  );
};
