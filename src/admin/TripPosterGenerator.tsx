import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Download, Layout, Smartphone, Monitor, Coffee, Calendar, MapPin, 
  CreditCard, Clock, CheckCircle, Map, Trash2, Eye, Sparkles, 
  RotateCcw, Compass, Star, ArrowRight, Clipboard, Check,
  ChevronLeft, ChevronRight
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
  { id: 'emerald', color: 'bg-[#022c22]', text: 'text-white', primary: '#10b981', secondary: '#064e3b', accent: '#34d399' },
  { id: 'indigo', color: 'bg-[#1e1b4b]', text: 'text-white', primary: '#818cf8', secondary: '#312e81', accent: '#a5b4fc' },
  { id: 'sunset', color: 'bg-gradient-to-br from-[#85144b] to-[#f012be]', text: 'text-white', primary: '#ffdc00', secondary: 'rgba(0,0,0,0.3)', accent: '#7fdbff' },
  { id: 'retro', color: 'bg-[#f4efe6] border-4 border-[#2b2927]', text: 'text-[#2b2927]', primary: '#d95d39', secondary: '#dfd5c6', accent: '#f0a202' },
];

export const TripPosterGenerator = ({ trip, onClose, type: initialType, config }: PosterProps) => {
  const tripName = trip.name || 'Gunung Indonesia';
  const [ratio, setRatio] = useState<AspectRatio>('1:1');
  const [layout, setLayout] = useState<LayoutType>('poster');
  const [theme, setTheme] = useState(THEMES[0]);
  const [bgOpacity, setBgOpacity] = useState(0.45);
  const [tripTypeLabel, setTripTypeLabel] = useState(initialType === 'open' ? 'OPEN TRIP' : 'PRIVATE TRIP');
  
  const rawVia = trip.path || trip.paths?.[0]?.name || 'Jalur Utama';
  // Strip any duplicate "via" prefix to prevent "Via Via Patak Banteng"
  const cleanVia = rawVia.replace(/^(via|Via|VIA)\s+/i, '');
  const [customVia, setCustomVia] = useState(cleanVia);
  const [showDiscountBadge, setShowDiscountBadge] = useState(trip.showDiscountBadge !== false);
  const [selectedSlides, setSelectedSlides] = useState<string[]>([
    'poster', 'rundown', 'gears', 'rules', 'ad', 'flag', 'board'
  ]);
  
  // Custom text states for Flag and Board layouts
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
  
  // New States for mobile responsiveness and user experience
  const [showPreview, setShowPreview] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'controls' | 'preview'>('controls');
  const [containerSize, setContainerSize] = useState({ width: 500, height: 500 });
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  // Auto Reset preview when crucial visual options change so they click "See Preview" again
  useEffect(() => {
    setShowPreview(false);
    if (window.innerWidth < 768) {
      setActiveMobileTab('controls');
    }
  }, [ratio, theme, tripTypeLabel]);

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
    const originalTransformOrigin = posterRef.current.style.transformOrigin;
    
    // Reset transform properties so image-to-html processes the source canvas at full 100% scale
    posterRef.current.style.transform = 'none';
    posterRef.current.style.transformOrigin = 'initial';

    // Reset parent wrapper size to full unscaled size to avoid any clipping/cropping
    const originalParentWidth = canvasWrapperRef.current ? canvasWrapperRef.current.style.width : '';
    const originalParentHeight = canvasWrapperRef.current ? canvasWrapperRef.current.style.height : '';
    if (canvasWrapperRef.current) {
      canvasWrapperRef.current.style.width = `${baseDim.width}px`;
      canvasWrapperRef.current.style.height = `${baseDim.height}px`;
    }
    
    try {
      // Delay briefly to allow DOM reflow
      await new Promise(resolve => setTimeout(resolve, 300));
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
      posterRef.current.style.transform = `scale(${scale})`;
      posterRef.current.style.transformOrigin = 'top left';
      if (canvasWrapperRef.current) {
        canvasWrapperRef.current.style.width = originalParentWidth;
        canvasWrapperRef.current.style.height = originalParentHeight;
      }
      setIsDownloading(false);
    }
  };

  const downloadAllSlides = async () => {
    if (posterRef.current === null) return;
    setIsDownloading(true);
    
    const originalLayout = layout;
    const originalParentWidth = canvasWrapperRef.current ? canvasWrapperRef.current.style.width : '';
    const originalParentHeight = canvasWrapperRef.current ? canvasWrapperRef.current.style.height : '';
    
    try {
      const slidesToDownload = selectedSlides.filter(s => ['poster', 'rundown', 'ad', 'gears', 'rules', 'flag', 'board'].includes(s));
      if (slidesToDownload.length === 0) {
        setIsDownloading(false);
        return;
      }

      for (let i = 0; i < slidesToDownload.length; i++) {
        const sType = slidesToDownload[i];
        setLayout(sType as LayoutType);
        
        // Wait for React state update and DOM repaint
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (posterRef.current) {
          posterRef.current.style.transform = 'none';
          posterRef.current.style.transformOrigin = 'initial';
          
          if (canvasWrapperRef.current) {
            canvasWrapperRef.current.style.width = `${baseDim.width}px`;
            canvasWrapperRef.current.style.height = `${baseDim.height}px`;
          }
          
          await new Promise(resolve => setTimeout(resolve, 300));

          const dataUrl = await toPng(posterRef.current, {
            cacheBust: true,
            pixelRatio: 3,
            quality: 0.95,
          });
          
          const link = document.createElement('a');
          link.download = `slide-${i + 1}-trip-${tripName.replace(/\s+/g, '-').toLowerCase()}-${sType}-${ratio}.png`;
          link.href = dataUrl;
          link.click();
        }
      }
    } catch (err) {
      console.error('Failed to download all slides sequentially', err);
    } finally {
      setLayout(originalLayout);
      if (posterRef.current) {
        posterRef.current.style.transform = `scale(${scale})`;
        posterRef.current.style.transformOrigin = 'top left';
      }
      if (canvasWrapperRef.current) {
        canvasWrapperRef.current.style.width = originalParentWidth;
        canvasWrapperRef.current.style.height = originalParentHeight;
      }
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

  // Fetch includes and excludes from admin dashboard facilities
  const inclusionsList = (config?.facilities?.include || [])
    .map((item: any) => typeof item === 'object' ? (item.isHidden ? null : item.name) : item)
    .filter(Boolean);

  const exclusionsList = (config?.facilities?.exclude || [])
    .map((item: any) => typeof item === 'object' ? (item.isHidden ? null : item.name) : item)
    .filter(Boolean);

  // Active items for UI displays with beautiful fallbacks - rendered in full as requested
  const posterIncludes = inclusionsList.length > 0 ? inclusionsList : ['Tenda Camp', 'Manual Brew Kopi', 'Makan & Minum', 'Guide APGI'];
  const posterExcludes = exclusionsList.length > 0 ? exclusionsList : ['Perlengkapan Pribadi', 'Transportasi Mepo', 'Obat-obatan Khusus'];

  // Instagram Caption Template Generator
  const captionInclusions = posterIncludes.map(item => `✅ ${item}`).join('\n');
  const captionExclusions = posterExcludes.map(item => `❌ ${item}`).join('\n');
  const cleanHashtagName = tripName.replace(/\s+/g, '').toLowerCase();

  const autoCaptionText = `⛰️ READY FOR ADVENTURE: ${tripTypeLabel} ${tripName.toUpperCase()} ⛰️

Saatnya keluar dari rutinitas harian dan kembali menyatu dengan megahnya alam! Tim @ngopi.dketinggian mengajak kamu menjelajahi keindahan puncak gunung terbaik Indonesia.

Nikmati petualangan mendaki yang seru, aman, dan penuh tawa dengan fasilitas terlengkap dan pemandu berlisensi resmi APGI.

📋 DETAIL PERJALANAN:
• Gunung: ${tripName}
• Jalur Pendakian: Via ${customVia}
• Durasi: ${tripDuration}
• Titik Kumpul (Meeting Point): ${tripMepo}
• Jadwal Keberangkatan: ${tripDate}

💰 HARGA TRIP:
• ${tripTypeLabel}: ${formatPrice(currentPrice)} ${originalPrice > currentPrice ? `(Normal: ${formatPrice(originalPrice)})` : ''}
*Sudah termasuk peralatan kelompok, konsumsi nikmat selama camp, pemandu bersertifikasi, dan pastinya seduhan KOPI MANUAL BREW sepuasnya di puncak gunung! ☕

🎁 FASILITAS TERMASUK (INCLUSIONS):
${captionInclusions}

🚫 TIDAK TERMASUK (EXCLUSIONS):
${captionExclusions}

👇 CARA PENDAFTARAN INSTAN:
Amankan slot pendakian kamu sekarang juga sebelum kehabisan! Klik link di bio Instagram kami @ngopi.dketinggian atau hubungi admin WhatsApp kami di kontak tertera.

#ngopidiketinggian #pendakiindonesia #infopendaki #opentrip${cleanHashtagName} #privatetrip${cleanHashtagName} #mountaineering #parapejalan #id_pendaki #indonesiantraveler #pesonaindonesia`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(autoCaptionText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              <div className="grid grid-cols-5 gap-1">
                {[
                  { id: 'poster', label: 'Poster' },
                  { id: 'rundown', label: 'Info' },
                  { id: 'ad', label: 'Iklan' },
                  { id: 'flag', label: 'Bendera' },
                  { id: 'board', label: 'Papan' }
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLayout(l.id as LayoutType)}
                    className={`py-2 rounded-lg text-[9px] font-black uppercase border-2 transition-all ${layout === l.id ? 'bg-art-text text-white border-art-text shadow-sm' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'}`}
                    title={l.label}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* IG Multi-Slide Carousel Selector */}
            <div className="space-y-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1">
                  📸 IG Carousel Slides
                </label>
                <span className="text-[8px] bg-art-orange/10 text-art-orange px-1.5 py-0.5 rounded uppercase font-black tracking-widest">Multi-Slide</span>
              </div>
              <p className="text-[9px] text-gray-400 leading-tight">
                Pilih slide yang ingin di-generate & diunduh satu per satu secara otomatis untuk konten carousel feeds Instagram Anda!
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { id: 'poster', label: 'Slide 1: Cover' },
                  { id: 'rundown', label: 'Slide 2: Rundown' },
                  { id: 'gears', label: 'Slide 3: Fasilitas' },
                  { id: 'rules', label: 'Slide 4: S&K' },
                  { id: 'ad', label: 'Slide 5: Promo' },
                  { id: 'flag', label: 'Slide 6: Bendera' },
                  { id: 'board', label: 'Slide 7: Papan' }
                ].map((s) => {
                  const isChecked = selectedSlides.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedSlides(selectedSlides.filter(x => x !== s.id));
                        } else {
                          setSelectedSlides([...selectedSlides, s.id]);
                        }
                      }}
                      className={`py-2 px-2.5 rounded-xl text-[9px] font-black border-2 text-left transition-all flex items-center justify-between ${
                        isChecked 
                          ? 'border-art-orange bg-orange-50 text-art-orange' 
                          : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      <span className="truncate">{s.label}</span>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[8px] ${isChecked ? 'bg-art-orange border-art-orange text-white' : 'border-gray-300 bg-gray-50 text-transparent'}`}>✓</span>
                    </button>
                  );
                })}
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

            {/* Kustomisasi Teks Bendera & Papan */}
            {['flag', 'board'].includes(layout) && (
              <div className="space-y-3 bg-orange-50/60 p-4 rounded-2xl border-2 border-art-orange/25">
                <label className="text-[10px] font-black uppercase text-art-orange tracking-widest flex items-center gap-1.5">
                  <Compass size={12} /> Kustomisasi Bendera & Papan
                </label>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-gray-500 uppercase tracking-wider block">Nama Gunung</label>
                  <input 
                    className="w-full border-2 border-gray-100 p-2.5 rounded-xl text-xs font-bold focus:border-art-orange outline-none bg-white"
                    value={mountainName}
                    onChange={e => setMountainName(e.target.value)}
                    placeholder="Contoh: GEDE PANGRANGO"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-gray-500 uppercase tracking-wider block">Tinggi Gunung (MDPL)</label>
                  <input 
                    className="w-full border-2 border-gray-100 p-2.5 rounded-xl text-xs font-bold focus:border-art-orange outline-none bg-white"
                    value={mountainMdpl}
                    onChange={e => setMountainMdpl(e.target.value)}
                    placeholder="Contoh: 2.958 MDPL"
                  />
                </div>
              </div>
            )}

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

            {/* Auto Caption Instagram Box */}
            <div className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-art-text uppercase tracking-wider flex items-center gap-1.5">
                  📱 Auto Caption Instagram
                </span>
                <span className="text-[8px] font-black bg-art-green/10 text-art-green px-1.5 py-0.5 rounded uppercase tracking-wider">Ready</span>
              </div>
              <p className="text-[9px] text-gray-400 leading-normal">
                Caption Instagram dibuat otomatis berdasarkan spesifikasi trip di dashboard admin Anda! Tinggal klik salin & langsung siap diposting.
              </p>
              <div className="relative">
                <textarea 
                  readOnly
                  value={autoCaptionText}
                  className="w-full h-24 bg-white border border-gray-200 rounded-xl p-2.5 text-[9px] font-bold text-gray-600 outline-none resize-none overflow-y-auto custom-scrollbar"
                />
                <button
                  onClick={copyToClipboard}
                  className={`absolute bottom-2 right-2 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow transition-all ${
                    copied 
                      ? 'bg-art-green text-white shadow-none' 
                      : 'bg-art-orange hover:bg-black text-white'
                  }`}
                >
                  {copied ? <Check size={10} /> : <Clipboard size={10} />}
                  {copied ? 'Tersalin' : 'Salin'}
                </button>
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
                    <Download size={16} /> {isDownloading ? 'Downloading...' : `Download Slide ${layout.toUpperCase()}`}
                  </button>
                  
                  {selectedSlides.length > 0 && (
                    <button 
                      onClick={downloadAllSlides}
                      disabled={isDownloading}
                      className="w-full bg-art-orange hover:bg-black disabled:bg-gray-400 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 border-2 border-white/20"
                    >
                      <Sparkles size={16} /> {isDownloading ? 'Downloading...' : `Download All ${selectedSlides.length} Slides 🎴`}
                    </button>
                  )}

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
            className={`flex-1 bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-8 flex items-center justify-center overflow-auto relative ${activeMobileTab === 'preview' ? 'block' : 'hidden md:block'}`}
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
              <div className="w-full h-full flex flex-col items-center justify-center overflow-auto p-4 relative min-h-[500px] z-10">
                
                {/* Visual Slide Header Info */}
                <div className="mb-4 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 text-white flex items-center gap-2 shadow-lg text-[9px] font-black uppercase tracking-widest z-20">
                  <span className="text-art-orange animate-pulse">●</span> 
                  <span>Preview Slide: {layout === 'poster' ? 'Cover Poster' : layout === 'rundown' ? 'Rencana Perjalanan (Rundown)' : layout === 'ad' ? 'Iklan/Promo' : layout === 'gears' ? 'Alat & Fasilitas' : layout === 'rules' ? 'S&K/Safety Aturan' : layout === 'flag' ? 'Bendera Cetak' : 'Papan Puncak'}</span>
                  <span className="bg-white/15 px-1.5 py-0.5 rounded text-white/80 font-mono">
                    {['poster', 'rundown', 'gears', 'rules', 'ad', 'flag', 'board'].indexOf(layout) + 1} / 7
                  </span>
                </div>

                {/* Main Row: Prev Button + Canvas Wrapper + Next Button */}
                <div className="flex items-center gap-4 max-w-full justify-center">
                  
                  {/* Prev Button */}
                  <button 
                    onClick={() => {
                      const list = ['poster', 'rundown', 'gears', 'rules', 'ad', 'flag', 'board'];
                      const curIdx = list.indexOf(layout);
                      const prevIdx = (curIdx - 1 + list.length) % list.length;
                      setLayout(list[prevIdx] as LayoutType);
                    }}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center transition-all shadow-lg border border-white/10 shrink-0 hover:scale-105 active:scale-95"
                    title="Slide Sebelumnya"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {/* Poster Workspace Wrapper with dynamic and RIGID bounds scaling layout */}
                  <div 
                    ref={canvasWrapperRef}
                    className="relative flex-shrink-0 shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/10 rounded-[1.5rem] overflow-hidden"
                    style={{
                      width: `${baseDim.width * scale}px`,
                      height: `${baseDim.height * scale}px`,
                      transition: 'all 0.3s ease-in-out'
                    }}
                  >
                    {/* High Resolution Render Canvas */}
                    <motion.div 
                      key={layout}
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -50, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      ref={posterRef}
                      className={`w-full h-full ${theme.color} relative overflow-hidden flex flex-col transition-all duration-300`}
                      style={{ 
                        width: `${baseDim.width}px`, 
                        height: `${baseDim.height}px`,
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        position: 'absolute',
                        top: 0,
                        left: 0
                      }}
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
                      <div className="relative z-10 flex flex-col h-full w-full justify-between">
                        
                        {/* Discount Sticker Bubble - Re-added as static, non-blinking circular badge */}
                        {showDiscountBadge && originalPrice > currentPrice && (
                          <div className="absolute top-[14%] right-[8%] w-16 h-16 rounded-full border-2 border-white flex flex-col items-center justify-center -rotate-12 shadow-[0_10px_25px_rgba(0,0,0,0.5)] z-20 bg-art-orange animate-none">
                            <span className="text-white text-sm font-black leading-none">{Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}%</span>
                            <span className="text-white text-[7.5px] font-black uppercase leading-none mt-0.5">OFF</span>
                          </div>
                        )}

                        <div className={`flex flex-col h-full w-full ${ratio === '9:16' ? 'p-[12%]' : ratio === '16:9' ? 'p-[5%]' : 'p-[8%]'} justify-between flex-1`}>
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
                                  <span className="text-[8px] font-black uppercase tracking-widest font-sans">Harga</span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                  {originalPrice > currentPrice && (
                                    <span className="text-[9px] font-black line-through opacity-30 leading-none">
                                      {formatPrice(originalPrice)}
                                    </span>
                                  )}
                                  <span className="text-sm md:text-base font-black leading-none" style={{ color: theme.accent }}>
                                    {formatPrice(currentPrice)}
                                  </span>
                                  {showDiscountBadge && originalPrice > currentPrice && (
                                    <span className="bg-yellow-400 text-black px-1.5 py-0.5 rounded text-[8px] font-black uppercase leading-none">
                                      {Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}% OFF
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Footer links */}
                            <div className="flex justify-between items-center pt-3 border-t border-current border-opacity-10 text-[9px] font-bold opacity-60">
                              <span>@ngopi.dketinggian</span>
                              <span>linktr.ee/ngopi.dketinggian</span>
                            </div>
                          </div>
                        </div>
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
                              <p className="text-[9px] font-bold opacity-70">Jalur: Via {customVia} • {tripDuration}</p>
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
                              <div className="w-full">
                                <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1.5">Fasilitas Included</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[8px] font-bold text-white/95">
                                  {posterIncludes.map((inc, index) => (
                                    <div key={index} className="flex items-center gap-1 truncate">
                                      <CheckCircle size={8} className="text-green-400 shrink-0" /> {inc}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="bg-white/10 p-3 rounded-xl border-2 border-dashed border-white/20">
                              <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Harga Trip</p>
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

                    {/* LAYOUT C: IKLAN (Redesigned with custom dual border layers & direct discount badge integration next to price) */}
                    {layout === 'ad' && (
                      <div className={`relative z-10 flex flex-col h-full ${ratio === '9:16' ? 'p-[12%]' : 'p-[8%]'} justify-between h-full w-full`}>
                        
                        {/* Elegant custom border structures to prevent overlap & keep layout extremely attractive */}
                        <div className="absolute inset-4 border-[3px] pointer-events-none z-20" style={{ borderColor: theme.primary }}></div>
                        <div className="absolute inset-5 border border-dashed pointer-events-none z-20 opacity-40" style={{ borderColor: theme.accent }}></div>
                        
                        {/* Absolute positioned neo-brutalist corner frames for maximum design aesthetic */}
                        <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4" style={{ borderColor: theme.accent }}></div>
                        <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4" style={{ borderColor: theme.accent }}></div>
                        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4" style={{ borderColor: theme.accent }}></div>
                        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4" style={{ borderColor: theme.accent }}></div>

                        {/* Top: Hype Banner */}
                        <div className="flex justify-between items-center bg-black text-white px-3 py-1 rounded-lg border border-white/10 z-10">
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-art-orange animate-pulse">🔥 LIMITED SEAT AVAILABLE!</span>
                          <span className="text-[7px] font-bold uppercase">DAFTAR INSTAN VIA WA</span>
                        </div>

                        {/* Title Display */}
                        <div className="my-auto text-center space-y-2 relative z-10">
                          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-art-orange font-sans">SAATNYA KELUAR DARI RUTINITAS!</p>
                          <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.65)] font-sans">
                            {tripName}
                          </h3>
                          <p className="text-xs font-bold text-white/90">Via {customVia} • {tripDuration}</p>

                          {/* High Energy Star Ratings */}
                          <div className="flex justify-center items-center gap-1 text-yellow-400 mt-2">
                            {[1,2,3,4,5].map(s => <Star key={s} size={10} fill="currentColor" />)}
                            <span className="text-[8px] font-black text-white ml-1 bg-black/40 px-1.5 py-0.5 rounded">5.0 (APGI RATED)</span>
                          </div>
                        </div>

                        {/* High Impact Core Services pills */}
                        <div className="space-y-2 max-w-sm mx-auto w-full z-10">
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="bg-black/60 border border-white/10 px-2 py-1.5 rounded-xl text-center backdrop-blur-md">
                              <span className="block text-[7px] text-white/50 uppercase">Manual Brew</span>
                              <span className="text-[9px] font-black text-white uppercase">☕ KOPI SEPUASNYA</span>
                            </div>
                            <div className="bg-black/60 border border-white/10 px-2 py-1.5 rounded-xl text-center backdrop-blur-md">
                              <span className="block text-[7px] text-white/50 uppercase">Alat Lengkap</span>
                              <span className="text-[9px] font-black text-white uppercase">🏕️ ALAT DISEDIAKAN</span>
                            </div>
                          </div>

                          {/* Price Display inside highlighted card with nested Discount text right next to the price */}
                          <div className="bg-gradient-to-r from-art-orange to-orange-600 p-3.5 rounded-2xl text-center text-white border-2 border-white shadow-2xl relative overflow-hidden">
                            <p className="text-[8px] font-black uppercase tracking-widest leading-none mb-1.5">HARGA KHUSUS MINGGU INI</p>
                            
                            <div className="flex flex-col items-center justify-center gap-1">
                              <div className="flex items-baseline justify-center gap-2 flex-wrap">
                                {originalPrice > currentPrice && (
                                  <span className="text-[10px] font-black line-through text-white/65">
                                    {formatPrice(originalPrice)}
                                  </span>
                                )}
                                <span className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                  {formatPrice(currentPrice)}
                                </span>
                              </div>
                              
                              {/* Integrated Discount next to/under the price inside the card boundary */}
                              {showDiscountBadge && originalPrice > currentPrice && (
                                <div className="bg-yellow-400 text-black px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1 mt-1">
                                  <span>🏷️ POTONGAN</span>
                                  <span>{Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}% OFF</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bottom CTA Block with Hand Pointer Accent */}
                        <div className="space-y-2 pt-3 border-t border-white/10 z-10">
                          <div className="flex items-center justify-between text-[8px] font-black uppercase text-white/85">
                            <span>👇 BOOKING SEKARANG</span>
                            <span>@ngopi.dketinggian</span>
                          </div>
                          <div className="bg-white text-black p-2 rounded-xl text-center font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center justify-center gap-1 hover:bg-art-orange hover:text-white transition-colors cursor-pointer">
                            <span>KLIK LINK DI BIO</span> <ArrowRight size={12} className="text-art-orange animate-bounce" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* LAYOUT D: GEARS (Inclusions, Exclusions & Optional Add-ons) */}
                    {layout === 'gears' && (
                      <div className={`relative z-10 flex flex-col h-full ${ratio === '9:16' ? 'p-[10%]' : 'p-[6%]'} justify-between h-full w-full`}>
                        {/* Header Branding */}
                        <div className="flex justify-between items-center border-b border-current border-opacity-15 pb-3">
                          <div className="flex items-center gap-1.5">
                            <Coffee size={16} style={{ color: theme.accent }} />
                            <span className={`text-[9px] font-black uppercase tracking-widest ${theme.text}`}>Fasilitas & Perlengkapan</span>
                          </div>
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded border border-current" style={{ color: theme.accent }}>{tripTypeLabel}</span>
                        </div>

                        {/* Content Grid */}
                        <div className={`my-auto grid ${ratio === '16:9' ? 'grid-cols-2 gap-4' : 'grid-cols-1 gap-4'} items-stretch`}>
                          
                          {/* Included Services Block */}
                          <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 space-y-2">
                            <p className="text-[8px] font-black uppercase tracking-widest text-emerald-400 border-b border-white/5 pb-1">✅ Fasilitas Termasuk (Inclusions)</p>
                            <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-white/90">
                              {posterIncludes.map((inc, i) => (
                                <div key={i} className="flex items-center gap-1 truncate">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></div>
                                  <span className="truncate">{inc}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Excluded Services Block */}
                          <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 space-y-2">
                            <p className="text-[8px] font-black uppercase tracking-widest text-red-400 border-b border-white/5 pb-1">❌ Tidak Termasuk (Exclusions)</p>
                            <div className="grid grid-cols-1 gap-1.5 text-[9px] font-bold text-white/90">
                              {posterExcludes.map((exc, i) => (
                                <div key={i} className="flex items-center gap-1.5 truncate">
                                  <span className="text-red-400 font-extrabold shrink-0">•</span>
                                  <span className="truncate">{exc}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>

                        {/* Additional info badge */}
                        <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                          <p className={`text-[8.5px] font-black uppercase tracking-wider ${theme.text}`}>☕ Spesial Seduhan Kopi Manual Brew Gratis Di Puncak Gunung!</p>
                        </div>

                        {/* Footer Contacts */}
                        <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest opacity-60 pt-3 border-t border-current border-opacity-10">
                          <span>Informasi: linktr.ee/ngopi.dketinggian</span>
                          <span>IG: @ngopi.dketinggian</span>
                        </div>
                      </div>
                    )}

                    {/* LAYOUT E: RULES (Terms, safety regulations & booking instructions) */}
                    {layout === 'rules' && (
                      <div className={`relative z-10 flex flex-col h-full ${ratio === '9:16' ? 'p-[10%]' : 'p-[6%]'} justify-between h-full w-full`}>
                        {/* Header Branding */}
                        <div className="flex justify-between items-center border-b border-current border-opacity-15 pb-3">
                          <div className="flex items-center gap-1.5">
                            <Compass size={16} style={{ color: theme.accent }} />
                            <span className={`text-[9px] font-black uppercase tracking-widest ${theme.text}`}>Syarat Ketentuan & Safety</span>
                          </div>
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded border border-current" style={{ color: theme.accent }}>Aturan Trip</span>
                        </div>

                        {/* Rules List */}
                        <div className="my-auto space-y-3">
                          <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3">
                            <p className="text-[8.5px] font-black uppercase tracking-widest text-amber-400 border-b border-white/5 pb-1">⛰️ Syarat & Keselamatan Pendaki</p>
                            <div className="space-y-2 text-[9.5px] font-bold text-white/90">
                              <div className="flex items-start gap-2">
                                <span className="text-amber-400 shrink-0 font-extrabold">1.</span>
                                <p className="leading-tight">Peserta wajib sehat jasmani & rohani, tidak ada riwayat penyakit kronis.</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-amber-400 shrink-0 font-extrabold">2.</span>
                                <p className="leading-tight">Membawa perlengkapan pribadi wajib sesuai standar pendakian.</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-amber-400 shrink-0 font-extrabold">3.</span>
                                <p className="leading-tight">Menjaga kelestarian alam: dilarang membuang sampah sembarangan.</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-amber-400 shrink-0 font-extrabold">4.</span>
                                <p className="leading-tight">Patuhi instruksi pemandu (APGI Guide) demi keamanan bersama.</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-2 text-center">
                            <p className="text-[8px] font-black uppercase tracking-widest text-art-orange leading-none">👇 CARA DAFTAR CEPAT & MUDAH</p>
                            <p className="text-[9px] font-bold leading-snug text-white/80">Hubungi WhatsApp Admin @ngopi.dketinggian, isi formulir data diri, bayar DP pendaftaran, dan Anda siap bertualang!</p>
                          </div>
                        </div>

                        {/* Footer Contacts */}
                        <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest opacity-60 pt-3 border-t border-current border-opacity-10">
                          <span>WhatsApp: linktr.ee/ngopi.dketinggian</span>
                          <span>IG: @ngopi.dketinggian</span>
                        </div>
                      </div>
                    )}

                    {/* LAYOUT F: BENDERA (Community Flag Layout) */}
                    {layout === 'flag' && (
                      <div className="relative z-10 flex flex-col h-full p-[10%] justify-between items-center text-center w-full bg-black/40">
                        {/* Flag Frame Borders */}
                        <div className="absolute inset-4 border-2 border-dashed opacity-30" style={{ borderColor: theme.accent }}></div>
                        <div className="absolute inset-6 border pointer-events-none opacity-10" style={{ borderColor: theme.text }}></div>

                        {/* Top: Branding logo */}
                        <div className="flex flex-col items-center gap-1">
                          <Compass size={28} className="animate-none" style={{ color: theme.accent }} />
                          <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${theme.text}`}>EXPEDITION TEAM</span>
                        </div>

                        {/* Middle: Huge Majestic Mountain Title & MDPL */}
                        <div className="my-auto space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-art-orange">SUMMIT PROJECT</p>
                          <h3 className={`font-black uppercase leading-none tracking-tight ${theme.text} text-5xl md:text-6xl drop-shadow-md`}>
                            {mountainName.toUpperCase()}
                          </h3>
                          <div className="h-1 w-32 bg-white/20 mx-auto rounded-full flex items-center justify-center">
                            <div className="h-1 w-12 rounded-full" style={{ backgroundColor: theme.primary }}></div>
                          </div>
                          <p className={`text-2xl font-black tracking-widest ${theme.text}`} style={{ color: theme.accent }}>
                            {mountainMdpl}
                          </p>
                        </div>

                        {/* Bottom: Community Credential */}
                        <div className="space-y-1 z-10">
                          <p className="text-[10px] font-black tracking-[0.25em] text-white uppercase leading-none">NGOPI DI KETINGGIAN</p>
                          <p className="text-[7px] font-black uppercase tracking-[0.15em] opacity-40">Est. 2026 • Premium Mountain Experience</p>
                        </div>
                      </div>
                    )}

                    {/* LAYOUT G: PAPAN (Summit Sign Board / Papan Puncak Foto) */}
                    {layout === 'board' && (
                      <div className="relative z-10 flex flex-col h-full p-[8%] justify-between items-center text-center w-full bg-amber-950/40 rounded-2xl overflow-hidden">
                        
                        {/* Wooden Plank Board Styling */}
                        <div className="absolute inset-2 border-4 border-amber-900 rounded-2xl bg-amber-950/90 shadow-2xl flex flex-col justify-between p-6 overflow-hidden">
                          {/* Wood Grain Lines */}
                          <div className="absolute inset-0 opacity-10 bg-gradient-to-b from-transparent via-amber-500/10 to-transparent pointer-events-none"></div>
                          {/* Horizontal Plank Dividers */}
                          <div className="absolute left-0 right-0 top-1/3 h-[2px] bg-amber-900/50"></div>
                          <div className="absolute left-0 right-0 top-2/3 h-[2px] bg-amber-900/50"></div>

                          {/* Corner Bolts/Rivets */}
                          <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-yellow-600/80 border border-yellow-800 shadow-inner flex items-center justify-center text-[5px] text-yellow-900 font-bold">+</div>
                          <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-yellow-600/80 border border-yellow-800 shadow-inner flex items-center justify-center text-[5px] text-yellow-900 font-bold">+</div>
                          <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-yellow-600/80 border border-yellow-800 shadow-inner flex items-center justify-center text-[5px] text-yellow-900 font-bold">+</div>
                          <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-yellow-600/80 border border-yellow-800 shadow-inner flex items-center justify-center text-[5px] text-yellow-900 font-bold">+</div>

                          {/* Board Header */}
                          <div className="flex justify-between items-center border-b border-yellow-600/30 pb-2 z-10 w-full">
                            <span className="text-[7.5px] font-black uppercase tracking-[0.2em] text-yellow-500">Puncak Sejati</span>
                            <div className="flex items-center gap-1 text-yellow-500">
                              <Compass size={10} />
                              <span className="text-[7px] font-bold">SAVER AREA</span>
                            </div>
                          </div>

                          {/* Main Board Content */}
                          <div className="my-auto space-y-2 z-10">
                            <h4 className="text-yellow-600 text-[10px] font-black uppercase tracking-[0.3em]">WELCOME TO</h4>
                            <h3 className="font-extrabold uppercase text-yellow-50 text-3xl md:text-4xl tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-serif">
                              ⛰️ {mountainName.toUpperCase()} ⛰️
                            </h3>
                            <div className="inline-block bg-yellow-500 text-black px-4 py-1.5 rounded-lg text-lg md:text-xl font-black tracking-widest shadow-md">
                              {mountainMdpl}
                            </div>
                            <p className="text-yellow-500/80 text-[8px] font-black tracking-[0.15em] uppercase">
                              Jalur Pendakian Resmi Via {customVia}
                            </p>
                          </div>

                          {/* Board Footer */}
                          <div className="flex justify-between items-center pt-2 border-t border-yellow-600/30 text-[7px] font-black uppercase text-yellow-600/80 z-10 w-full">
                            <span>Tgl: {tripDate}</span>
                            <span>@ngopi.dketinggian</span>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Decor ambient light points inside canvas */}
                    <div className="absolute -bottom-24 -left-24 w-60 h-60 opacity-20 rounded-full blur-[80px]" style={{ backgroundColor: theme.primary }}></div>
                    <div className="absolute -top-24 -right-24 w-60 h-60 opacity-25 rounded-full blur-[80px]" style={{ backgroundColor: theme.accent }}></div>
                  </motion.div>
                </div>

                {/* Right Button */}
                <button 
                  onClick={() => {
                    const list = ['poster', 'rundown', 'gears', 'rules', 'ad', 'flag', 'board'];
                    const curIdx = list.indexOf(layout);
                    const nextIdx = (curIdx + 1) % list.length;
                    setLayout(list[nextIdx] as LayoutType);
                  }}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center transition-all shadow-lg border border-white/10 shrink-0 hover:scale-105 active:scale-95"
                  title="Slide Selanjutnya"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Dots Indicator */}
              <div className="flex items-center gap-1.5 mt-5 z-20">
                {['poster', 'rundown', 'gears', 'rules', 'ad', 'flag', 'board'].map((s, idx) => {
                  const isActive = layout === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setLayout(s as LayoutType)}
                      className={`h-2 rounded-full transition-all duration-300 ${isActive ? 'w-6 bg-art-orange shadow-md' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                      title={`Slide ${idx + 1}`}
                    />
                  );
                })}
              </div>

                {/* Secondary Action Toolbar shown underneath the preview */}
                <div className="mt-6 flex flex-col sm:flex-row gap-2.5 w-full max-w-sm px-4 relative z-50">
                  <button 
                    onClick={downloadPoster}
                    disabled={isDownloading}
                    className="flex-1 bg-art-orange hover:bg-black disabled:bg-gray-400 text-white py-3.5 px-5 rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 shadow-xl transition-all"
                  >
                    <Download size={14} /> {isDownloading ? 'Downloading...' : `Download HD (${layout.toUpperCase()})`}
                  </button>
                  <button 
                    onClick={() => {
                      setShowPreview(false);
                      if (window.innerWidth < 768) {
                        setActiveMobileTab('controls');
                      }
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/10 py-3.5 px-5 rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 transition-all"
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
