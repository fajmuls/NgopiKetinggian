import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { customAlert } from '../GlobalDialog';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { 
  TransformWrapper, 
  TransformComponent, 
} from 'react-zoom-pan-pinch';
import { 
  X, Download, Layout, Smartphone, Monitor, Coffee, Calendar, MapPin, 
  CreditCard, Clock, CheckCircle, Map, Trash2, Eye, Sparkles, 
  RotateCcw, Compass, Star, ArrowRight, Clipboard, Check,
  ChevronLeft, ChevronRight, FileText, Maximize, RotateCw, Plus, Minus
} from 'lucide-react';

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
  // removed postCategory
  const [flagDesign, setFlagDesign] = useState<number>(1);
  const [boardDesign, setBoardDesign] = useState<number>(1);
  const [boardDescription, setBoardDescription] = useState('Semoga langkah ini menjadi awal dari petualangan hebat lainnya.');
  const [zoomScale, setZoomScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [theme, setTheme] = useState(THEMES[0]);
  const [bgOpacity, setBgOpacity] = useState(0.45);
  const [tripTypeLabel, setTripTypeLabel] = useState(initialType === 'open' ? 'OPEN TRIP' : 'PRIVATE TRIP');
  
  const rawVia = trip.path || trip.paths?.[0]?.name || 'Jalur Utama';
  // Strip any duplicate "via" prefix to prevent "Via Via Patak Banteng"
  const cleanVia = rawVia.replace(/^(via|Via|VIA)\s+/i, '');
  const [customVia, setCustomVia] = useState(cleanVia);
  const [showDiscountBadge, setShowDiscountBadge] = useState(trip.showDiscountBadge !== false);
  const [selectedSlides, setSelectedSlides] = useState<string[]>(['poster']);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [posterDesign, setPosterDesign] = useState<number>(1);
  const [infoDesign, setInfoDesign] = useState<number>(1);
  const [adDesign, setAdDesign] = useState<number>(1);
  const [flagShowLogo, setFlagShowLogo] = useState(true);
  const [flagLogoOpacity, setFlagLogoOpacity] = useState(0.8);
  const [flagBgType, setFlagBgType] = useState<'image' | 'color'>('image');
  const [flagShowMountain, setFlagShowMountain] = useState(true);
  const [boardShowMountain, setBoardShowMountain] = useState(true);
  
  useEffect(() => {
    switch (layout) {
      case 'poster':
        setSelectedSlides(['poster']);
        break;
      case 'rundown': // Info
        setSelectedSlides(['poster', 'rundown', 'gears', 'rules', 'ad']);
        break;
      case 'ad': // Iklan
        setSelectedSlides(['ad', 'rundown', 'gears']); // 3 slides for Iklan
        break;
      case 'flag': // Bendera
        setSelectedSlides(['flag']);
        break;
      case 'board': // Papan
        setSelectedSlides(['board']);
        break;
    }
    setCurrentSlide(0);
  }, [layout]);
  
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
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const transformWrapperRef = useRef<any>(null);

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
  const padding = window.innerWidth < 768 ? 32 : 64;
  const scaleX = (containerSize.width - padding) / baseDim.width;
  const scaleY = (containerSize.height - padding) / baseDim.height;
  const scale = Math.min(scaleX, scaleY, 1); 
  
  // Adjusted scale for the preview container to ensure it always fits visually with a bit of "breathing room"
  const previewScale = scale * 0.95;

  const downloadPoster = async (format: 'png' | 'pdf' = 'png') => {
    if (posterRef.current === null) return;
    setIsDownloading(true);
    setDownloadProgress(20);
    
    const originalTransform = posterRef.current.style.transform;
    const originalTransformOrigin = posterRef.current.style.transformOrigin;
    const originalParentWidth = canvasWrapperRef.current ? canvasWrapperRef.current.style.width : '';
    const originalParentHeight = canvasWrapperRef.current ? canvasWrapperRef.current.style.height : '';
    const originalParentPosition = canvasWrapperRef.current ? canvasWrapperRef.current.style.position : '';
    const originalParentZIndex = canvasWrapperRef.current ? canvasWrapperRef.current.style.zIndex : '';
    
    if (canvasWrapperRef.current) {
      canvasWrapperRef.current.style.width = `${baseDim.width}px`;
      canvasWrapperRef.current.style.height = `${baseDim.height}px`;
      canvasWrapperRef.current.style.position = 'fixed';
      canvasWrapperRef.current.style.left = '0';
      canvasWrapperRef.current.style.top = '0';
      canvasWrapperRef.current.style.zIndex = '-9999';
    }
    
    try {
      setDownloadProgress(50);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dataUrl = await toPng(posterRef.current, { 
        cacheBust: true, 
        pixelRatio: 4, 
        quality: 1,
      });

      setDownloadProgress(80);

      if (format === 'pdf') {
        const pdf = new jsPDF({
          orientation: baseDim.width > baseDim.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [baseDim.width, baseDim.height]
        });
        pdf.addImage(dataUrl, 'PNG', 0, 0, baseDim.width, baseDim.height);
        pdf.save(`ngopi-trip-${tripName.replace(/\s+/g, '-').toLowerCase()}-${layout}-${Date.now()}.pdf`);
      } else {
        const link = document.createElement('a');
        link.download = `ngopi-trip-${tripName.replace(/\s+/g, '-').toLowerCase()}-${layout}-${ratio}.png`;
        link.href = dataUrl;
        link.click();
      }
      
      setDownloadProgress(100);
      customAlert(`${format.toUpperCase()} Berhasil Diunduh!`);
    } catch (err) {
      console.error('Failed to download poster', err);
      customAlert('Gagal mengunduh poster.');
    } finally {
      posterRef.current.style.transform = `scale(${previewScale})`;
      posterRef.current.style.transformOrigin = 'top left';
      if (canvasWrapperRef.current) {
        canvasWrapperRef.current.style.width = originalParentWidth;
        canvasWrapperRef.current.style.height = originalParentHeight;
        canvasWrapperRef.current.style.position = originalParentPosition;
        canvasWrapperRef.current.style.left = '';
        canvasWrapperRef.current.style.top = '';
        canvasWrapperRef.current.style.zIndex = originalParentZIndex;
      }
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 500);
    }
  };

  const downloadAllSlides = async (format: 'png' | 'pdf' = 'png') => {
    if (posterRef.current === null) return;
    setIsDownloading(true);
    
    const originalLayout = layout;
    const originalParentWidth = canvasWrapperRef.current ? canvasWrapperRef.current.style.width : '';
    const originalParentHeight = canvasWrapperRef.current ? canvasWrapperRef.current.style.height : '';
    const originalParentPosition = canvasWrapperRef.current ? canvasWrapperRef.current.style.position : '';
    const originalParentZIndex = canvasWrapperRef.current ? canvasWrapperRef.current.style.zIndex : '';
    
    try {
      const slidesToDownload = selectedSlides.filter(s => ['poster', 'rundown', 'ad', 'gears', 'rules', 'flag', 'board'].includes(s));
      
      if (slidesToDownload.length === 0) {
        customAlert('Pilih setidaknya satu slide untuk diunduh.');
        setIsDownloading(false);
        return;
      }

      let pdf: any = null;
      if (format === 'pdf') {
        pdf = new jsPDF({
          orientation: baseDim.width > baseDim.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [baseDim.width, baseDim.height]
        });
      }

      for (let i = 0; i < slidesToDownload.length; i++) {
        const sType = slidesToDownload[i];
        setDownloadProgress(Math.round(((i) / slidesToDownload.length) * 100));
        setLayout(sType as LayoutType);
        
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (posterRef.current && canvasWrapperRef.current) {
          posterRef.current.style.transform = 'none';
          posterRef.current.style.transformOrigin = 'initial';
          canvasWrapperRef.current.style.width = `${baseDim.width}px`;
          canvasWrapperRef.current.style.height = `${baseDim.height}px`;
          canvasWrapperRef.current.style.position = 'fixed';
          canvasWrapperRef.current.style.zIndex = '-9999';
          
          await new Promise(resolve => setTimeout(resolve, 400));
          
          const dataUrl = await toPng(posterRef.current, {
            cacheBust: true,
            pixelRatio: 3,
            quality: 0.95,
          });
          
          if (format === 'pdf') {
            if (i > 0) pdf.addPage([baseDim.width, baseDim.height], baseDim.width > baseDim.height ? 'landscape' : 'portrait');
            pdf.addImage(dataUrl, 'PNG', 0, 0, baseDim.width, baseDim.height);
          } else {
            const link = document.createElement('a');
            link.download = `slide-${i + 1}-trip-${tripName.replace(/\s+/g, '-').toLowerCase()}-${sType}-${ratio}.png`;
            link.href = dataUrl;
            link.click();
          }
        }
      }

      if (format === 'pdf') {
        pdf.save(`ngopi-trip-${tripName.replace(/\s+/g, '-').toLowerCase()}-full-package-${Date.now()}.pdf`);
      }
      
      setDownloadProgress(100);
      customAlert(`Berhasil Mengunduh ${slidesToDownload.length} Slide!`);
    } catch (err) {
      console.error('Failed to download all slides sequentially', err);
      customAlert('Gagal mengunduh semua slide.');
    } finally {
      setLayout(originalLayout);
      if (posterRef.current) {
        posterRef.current.style.transform = `scale(${previewScale})`;
        posterRef.current.style.transformOrigin = 'top left';
      }
      if (canvasWrapperRef.current) {
        canvasWrapperRef.current.style.width = originalParentWidth;
        canvasWrapperRef.current.style.height = originalParentHeight;
        canvasWrapperRef.current.style.position = originalParentPosition;
        canvasWrapperRef.current.style.left = '';
        canvasWrapperRef.current.style.top = '';
        canvasWrapperRef.current.style.zIndex = originalParentZIndex;
      }
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 500);
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

            {/* Additional Controls based on Layout */}
            {(selectedSlides[currentSlide] || layout) === 'poster' && (
              <div className="space-y-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Opsi Desain Poster</label>
                <div className="grid grid-cols-5 gap-1 pt-1">
                  {[1,2,3,4,5].map((d) => (
                    <button
                      key={d}
                      onClick={() => setPosterDesign(d)}
                      className={`py-2 rounded-xl text-[9px] font-black border-2 transition-all ${posterDesign === d ? 'border-art-orange bg-orange-50 text-art-orange' : 'border-gray-200 bg-white text-gray-400'}`}
                    >
                      D{d}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            
            {['rundown', 'gears', 'rules'].includes(selectedSlides[currentSlide] || layout) && (
              <div className="space-y-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 mt-3">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Opsi Desain Info</label>
                <div className="grid grid-cols-5 gap-1 pt-1">
                  {[1,2,3,4,5].map((d) => (
                    <button
                      key={d}
                      onClick={() => setInfoDesign(d)}
                      className={`py-2 rounded-xl text-[9px] font-black border-2 transition-all ${infoDesign === d ? 'border-art-orange bg-orange-50 text-art-orange' : 'border-gray-200 bg-white text-gray-400'}`}
                    >
                      D{d}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {(selectedSlides[currentSlide] || layout) === 'ad' && (
              <div className="space-y-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 mt-3">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Opsi Desain Promo</label>
                <div className="grid grid-cols-5 gap-1 pt-1">
                  {[1,2,3,4,5].map((d) => (
                    <button
                      key={d}
                      onClick={() => setAdDesign(d)}
                      className={`py-2 rounded-xl text-[9px] font-black border-2 transition-all ${adDesign === d ? 'border-art-orange bg-orange-50 text-art-orange' : 'border-gray-200 bg-white text-gray-400'}`}
                    >
                      D{d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(layout === 'rundown' || layout === 'ad') && (
               <div className="space-y-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Pilih Slide</label>
                  <div className="grid grid-cols-2 gap-2">
                     {(layout === 'rundown' ? ['poster', 'rundown', 'gears', 'rules', 'ad'] : ['ad', 'rundown', 'gears']).map(slideId => (
                        <label key={slideId} className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                           <input 
                             type="checkbox" 
                             checked={selectedSlides.includes(slideId)}
                             onChange={(e) => {
                               if (e.target.checked) setSelectedSlides([...selectedSlides, slideId]);
                               else setSelectedSlides(selectedSlides.filter(s => s !== slideId));
                             }}
                             className="accent-art-orange"
                           />
                           {slideId === 'poster' ? 'Cover' : slideId === 'rundown' ? (layout === 'ad' ? 'Highlight' : 'Rundown') : slideId === 'gears' ? 'Fasilitas' : slideId === 'rules' ? 'S&K' : 'Promo'}
                        </label>
                     ))}
                  </div>
               </div>
            )}

            {(selectedSlides[currentSlide] || layout) === 'flag' && (
              <div className="space-y-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Opsi Desain Bendera</label>
                <div className="grid grid-cols-5 gap-1 pt-1">
                  {[1,2,3,4,5].map((d) => (
                    <button
                      key={d}
                      onClick={() => setFlagDesign(d)}
                      className={`py-2 rounded-xl text-[9px] font-black border-2 transition-all ${flagDesign === d ? 'border-art-orange bg-orange-50 text-art-orange' : 'border-gray-200 bg-white text-gray-400'}`}
                    >
                      D{d}
                    </button>
                  ))}
                </div>
                
                <div className="space-y-3 pt-2">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Tipe Background</label>
                      <div className="flex gap-1">
                        {['image', 'color'].map(bt => (
                          <button 
                            key={bt}
                            onClick={() => setFlagBgType(bt as 'image' | 'color')}
                            className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase border transition-all ${flagBgType === bt ? 'bg-art-text text-white border-art-text' : 'bg-white text-gray-400 border-gray-100'}`}
                          >
                            {bt === 'image' ? 'Foto Gunung' : 'Warna Solid'}
                          </button>
                        ))}
                      </div>
                   </div>

                   <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Transparansi Logo</label>
                        <span className="text-[9px] font-black text-art-orange">{Math.round(flagLogoOpacity * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.05" 
                        value={flagLogoOpacity} 
                        onChange={e => setFlagLogoOpacity(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-art-orange"
                      />
                   </div>

                   <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                          <input type="checkbox" checked={flagShowLogo} onChange={e => setFlagShowLogo(e.target.checked)} className="accent-art-orange" />
                          Tampilkan Logo Utama
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                          <input type="checkbox" checked={flagShowMountain} onChange={e => setFlagShowMountain(e.target.checked)} className="accent-art-orange" />
                          Tampilkan Nama Gunung/MDPL
                      </label>
                   </div>
                </div>
              </div>
            )}

            {(selectedSlides[currentSlide] || layout) === 'board' && (
              <div className="space-y-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Opsi Desain Papan</label>
                <div className="grid grid-cols-5 gap-1 pt-1">
                  {[1,2,3,4,5].map((d) => (
                    <button
                      key={d}
                      onClick={() => setBoardDesign(d)}
                      className={`py-2 rounded-xl text-[9px] font-black border-2 transition-all ${boardDesign === d ? 'border-art-orange bg-orange-50 text-art-orange' : 'border-gray-200 bg-white text-gray-400'}`}
                    >
                      D{d}
                    </button>
                  ))}
                </div>
                <div className="pt-2 space-y-2">
                   <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={boardShowMountain} onChange={e => setBoardShowMountain(e.target.checked)} className="accent-art-orange" />
                      Tampilkan Nama Gunung
                   </label>
                   <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Deskripsi Papan</label>
                   <textarea className="w-full text-xs p-2 border rounded-xl outline-none focus:border-art-orange" rows={3} value={boardDescription} onChange={e => setBoardDescription(e.target.value)} />
                </div>
              </div>
            )}
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
             className={`flex-1 bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center overflow-hidden relative ${activeMobileTab === 'preview' ? 'block' : 'hidden md:block'}`}
             style={{ touchAction: 'none' }}
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
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 text-white shadow-lg text-[9px] font-black uppercase tracking-widest z-50 flex items-center gap-2">
      <span className="text-art-orange animate-pulse">●</span> PREVIEW: {layout.toUpperCase()} MODE
   </div>

                {/* Main Row: Just the scalable canvas wrapper in an overflow-auto box */}
                <div className="flex-1 w-full h-full flex flex-col items-center justify-center relative">
                  
                  <TransformWrapper
                    ref={transformWrapperRef}
                    initialScale={1}
                    minScale={0.5}
                    maxScale={5}
                    centerOnInit={true}
                    limitToBounds={false}
                  >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                      <>
                        {/* Control Floating Panel */}
                        <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2">
                          <button onClick={() => zoomIn()} className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white shadow-xl transition-all">
                            <Plus size={20} />
                          </button>
                          <button onClick={() => zoomOut()} className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white shadow-xl transition-all">
                            <Minus size={20} />
                          </button>
                          <button onClick={() => resetTransform()} className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white shadow-xl transition-all">
                            <RotateCcw size={20} />
                          </button>
                        </div>

                        <TransformComponent
                          wrapperStyle={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                          contentStyle={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          {/* Poster Workspace Wrapper with dynamic and RIGID bounds scaling layout */}
                          <div 
                            ref={canvasWrapperRef}
                            className="relative flex-shrink-0 shadow-[0_40px_80px_rgba(0,0,0,0.9)] border border-white/10 rounded-[1.5rem] overflow-hidden"
                            style={{
                              width: `${baseDim.width * previewScale}px`,
                              height: `${baseDim.height * previewScale}px`,
                            }}
                          >
                            {/* High Resolution Render Canvas */}
                            <motion.div 
                              key={selectedSlides[currentSlide] || layout}
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3 }}
                              ref={posterRef}
                              className={`w-full h-full ${theme.color} relative overflow-hidden flex flex-col`}
                              style={{ 
                                width: `${baseDim.width}px`, 
                                height: `${baseDim.height}px`,
                                transform: `scale(${previewScale})`,
                                transformOrigin: 'top left',
                                position: 'absolute',
                                top: 0,
                                left: 0
                              }}
                            >
                    
                    {/* Background Visual Layer */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-all duration-500" 
                      style={{ 
                        backgroundImage: (layout === 'flag' && flagBgType === 'color') ? 'none' : (trip.image ? `url(${trip.image})` : 'none'),
                        backgroundColor: (layout === 'flag' && flagBgType === 'color') ? theme.primary : 'transparent',
                        opacity: layout === 'flag' && flagBgType === 'color' ? 1 : bgOpacity 
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
                    {(selectedSlides[currentSlide] || layout) === 'poster' && (
       <div className={`relative z-10 flex flex-col h-full w-full justify-between ${posterDesign === 5 ? 'border-[12px] border-white/20 p-2' : ''}`}>
                        
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
                          <div className={`my-auto space-y-3 ${posterDesign === 2 ? 'text-center flex flex-col items-center' : posterDesign === 3 ? 'text-right flex flex-col items-end' : ''}`}>
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
                    {(selectedSlides[currentSlide] || layout) === 'rundown' && (
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
                            <div className={`p-3 rounded-xl backdrop-blur-sm ${infoDesign === 2 ? 'bg-white/10 border border-white/20' : infoDesign === 3 ? 'bg-art-orange/20 border-l-4 border-art-orange' : infoDesign === 4 ? 'bg-transparent border-b-2 border-white/20 rounded-none' : infoDesign === 5 ? 'bg-black/40 border border-art-orange shadow-[0_0_15px_rgba(255,87,34,0.3)]' : 'bg-black/20 border border-white/5'}`}>
                              <p className="text-[7px] font-black uppercase tracking-wider opacity-60 mb-0.5">Destinasi Gunung</p>
                              <h4 className={`text-xl font-black uppercase tracking-tight ${theme.text}`}>{tripName}</h4>
                              <p className="text-[9px] font-bold opacity-70">Jalur: Via {customVia} • {tripDuration}</p>
                            </div>

                            <div className={`p-3.5 space-y-2 ${infoDesign === 2 ? 'bg-white/5 border border-white/20 rounded-xl backdrop-blur-md' : infoDesign === 3 ? 'bg-black/40 border border-white/10 rounded-xl' : infoDesign === 4 ? 'bg-transparent border-t-2 border-white/20' : infoDesign === 5 ? 'bg-black/60 border border-art-orange shadow-[0_0_15px_rgba(255,87,34,0.3)] rounded-xl' : 'bg-black/35 rounded-xl border border-white/10'}`}>
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
                            <div className={`p-3 flex items-center justify-between ${infoDesign === 2 ? 'bg-white/10 border border-white/20 rounded-xl backdrop-blur-md' : infoDesign === 3 ? 'bg-art-orange/10 border border-art-orange/30 rounded-xl' : infoDesign === 4 ? 'bg-transparent border-y-2 border-white/20' : infoDesign === 5 ? 'bg-black/60 border border-art-orange shadow-[0_0_15px_rgba(255,87,34,0.3)] rounded-xl' : 'bg-white/5 border border-white/10 rounded-xl'}`}>
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
                    {(selectedSlides[currentSlide] || layout) === 'ad' && (
                      <div className={`relative z-10 flex flex-col h-full ${ratio === '9:16' ? 'p-[12%]' : 'p-[8%]'} justify-between h-full w-full`}>
                        
                        {/* Custom Design Variations based on adDesign */}
                        {adDesign === 1 && (
                            <>
                                <div className="absolute inset-4 border-[3px] pointer-events-none z-20" style={{ borderColor: theme.primary }}></div>
                                <div className="absolute inset-5 border border-dashed pointer-events-none z-20 opacity-40" style={{ borderColor: theme.accent }}></div>
                            </>
                        )}
                        {adDesign === 2 && (
                            <div className="absolute inset-6 border-4 pointer-events-none z-20 shadow-[0_0_20px_rgba(255,255,255,0.2)]" style={{ borderColor: 'white', borderRadius: '2rem' }}></div>
                        )}
                        {adDesign === 3 && (
                            <div className="absolute inset-0 border-[16px] pointer-events-none z-20" style={{ borderColor: theme.primary }}></div>
                        )}
                        {adDesign === 4 && (
                            <>
                                <div className="absolute top-0 bottom-0 left-8 border-l-4 pointer-events-none z-20 opacity-30" style={{ borderColor: theme.accent }}></div>
                                <div className="absolute top-0 bottom-0 right-8 border-r-4 pointer-events-none z-20 opacity-30" style={{ borderColor: theme.accent }}></div>
                            </>
                        )}
                        {adDesign === 5 && (
                            <div className="absolute inset-2 border-[1px] pointer-events-none z-20 rounded-[2.5rem]" style={{ borderColor: theme.accent, boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)' }}></div>
                        )}

                        {/* Corners (Only on adDesign 1 and 3) */}
                        {(adDesign === 1 || adDesign === 3) && (
                            <>
                                <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4" style={{ borderColor: theme.accent }}></div>
                                <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4" style={{ borderColor: theme.accent }}></div>
                                <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4" style={{ borderColor: theme.accent }}></div>
                                <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4" style={{ borderColor: theme.accent }}></div>
                            </>
                        )}
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
                            {posterIncludes.slice(0, 2).map((inc, i) => (
                              <div key={i} className="bg-black/60 border border-white/10 px-2 py-1.5 rounded-xl text-center backdrop-blur-md">
                                <span className="block text-[7px] text-white/50 uppercase">Fasilitas</span>
                                <span className="text-[9px] font-black text-white uppercase overflow-hidden text-ellipsis whitespace-nowrap">{i === 0 ? '☕' : '🏕️'} {inc}</span>
                              </div>
                            ))}
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
                    {(selectedSlides[currentSlide] || layout) === 'gears' && (
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
                    {(selectedSlides[currentSlide] || layout) === 'rules' && (
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
                    {(selectedSlides[currentSlide] || layout) === 'flag' && (
                      <div className={`relative z-10 flex flex-col h-full p-[10%] justify-between items-center text-center w-full ${
                        flagDesign === 2 ? 'bg-gradient-to-t from-black/80 to-transparent' : 
                        flagDesign === 3 ? 'bg-black/60' : 
                        flagDesign === 4 ? 'bg-transparent' : 
                        flagDesign === 5 ? 'bg-gradient-to-br from-black/40 via-transparent to-black/40' : 
                        'bg-black/40'
                      }`}>
                        
                        {/* Flag Frame Borders */}
                        {flagDesign === 1 && (
                          <>
                            <div className="absolute inset-4 border-4 border-double opacity-40 rounded-lg" style={{ borderColor: theme.accent }}></div>
                            <div className="absolute inset-8 border border-dashed pointer-events-none opacity-20" style={{ borderColor: 'white' }}></div>
                          </>
                        )}

                        {flagDesign === 4 && (
                           <div className="absolute inset-0 border-[20px] border-white/10 pointer-events-none"></div>
                        )}

                        {flagDesign === 5 && (
                           <div className="absolute inset-4 border-2 border-art-orange/30 rounded-[3rem] pointer-events-none"></div>
                        )}
                        
                        {/* Top: Association & Title */}
                        <div className={`space-y-2 z-10 ${flagDesign === 2 ? 'order-2' : 'order-1'}`}>
                          <p className={`text-[10px] md:text-xs font-black uppercase tracking-[0.5em] drop-shadow-md ${flagDesign === 3 ? 'text-art-orange' : 'text-white/80'}`}>OFFICIAL EXPEDITION</p>
                          {flagShowMountain && (
                            <h3 className={`text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] ${
                              flagDesign === 5 ? 'text-transparent bg-clip-text bg-gradient-to-r from-white via-art-orange to-white' : 'text-white'
                            }`}>
                              {mountainName}
                            </h3>
                          )}
                        </div>

                        {/* Center Logo - LARGE & TRANSPARENT */}
                        <div 
                          className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-500 ${
                            flagDesign === 2 ? 'translate-y-[-10%]' : 
                            flagDesign === 4 ? 'scale-110' : ''
                          }`}
                          style={{ opacity: flagShowLogo ? flagLogoOpacity : 0 }}
                        >
                          <img 
                            src="https://files.catbox.moe/lubzno.png" 
                            alt="Large App Logo" 
                            className={`w-[50%] h-[50%] object-contain filter drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] ${
                                flagDesign === 3 ? 'grayscale brightness-200' : ''
                            }`}
                          />
                        </div>

                        {/* Bottom: Elevation & Branding */}
                        <div className={`space-y-4 z-10 w-full px-8 ${flagDesign === 2 ? 'order-1' : 'order-2'}`}>
                          <div className="flex items-center justify-center gap-6">
                            <div className={`h-px flex-1 ${flagDesign === 3 ? 'bg-art-orange/40' : 'bg-white/40'}`}></div>
                            {flagShowMountain && (
                              <span className={`text-2xl md:text-4xl font-black drop-shadow-xl ${flagDesign === 5 ? 'text-white' : 'text-art-orange'}`}>
                                {mountainMdpl}
                              </span>
                            )}
                            <div className={`h-px flex-1 ${flagDesign === 3 ? 'bg-art-orange/40' : 'bg-white/40'}`}></div>
                          </div>
                          
                          <div className={`pt-4 flex justify-between items-end w-full border-t border-white/10 ${flagDesign === 4 ? 'border-none' : ''}`}>
                            <div className="text-left">
                              <span className="block text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">Organized By</span>
                              <span className={`text-sm md:text-base font-black uppercase tracking-[0.2em] ${flagDesign === 3 ? 'text-art-orange' : 'text-white'}`}>NGOPI DI KETINGGIAN</span>
                            </div>
                            <div className="text-right">
                              <span className="block text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">Establishment</span>
                              <span className={`text-sm md:text-base font-black uppercase tracking-widest font-mono ${flagDesign === 3 ? 'text-art-orange' : 'text-white'}`}>2024</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* LAYOUT G: PAPAN (Summit Sign Board / Papan Puncak Foto) */}
                    {(selectedSlides[currentSlide] || layout) === 'board' && (
                      <div className={`relative z-10 flex flex-col h-full p-[8%] justify-between items-center text-center w-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ${
                        boardDesign === 2 ? 'bg-zinc-800' : 
                        boardDesign === 3 ? 'bg-stone-300' : 
                        boardDesign === 4 ? 'bg-gradient-to-br from-blue-900 to-blue-700' : 
                        boardDesign === 5 ? 'bg-red-950' : 
                        'bg-amber-950/40'
                      }`}>
                        
                        {/* THE BOARD FRAME */}
                        <div className={`absolute inset-2 border-4 rounded-2xl shadow-2xl flex flex-col justify-between p-6 overflow-hidden ${
                          boardDesign === 1 ? 'border-amber-900 bg-amber-950/90' : 
                          boardDesign === 2 ? 'border-zinc-700 bg-zinc-900' : 
                          boardDesign === 3 ? 'border-stone-400 bg-stone-100' : 
                          boardDesign === 4 ? 'border-white/20 bg-blue-950/80' : 
                          boardDesign === 5 ? 'border-red-900 bg-red-950/90' : 
                          'border-amber-900 bg-amber-950/90'
                        }`}>
                          
                          {/* Design-Specific Accents */}
                          {boardDesign === 1 && (
                            <>
                              <div className="absolute inset-0 opacity-10 bg-gradient-to-b from-transparent via-amber-500/10 to-transparent pointer-events-none"></div>
                              <div className="absolute left-0 right-0 top-1/3 h-[2px] bg-amber-900/50"></div>
                              <div className="absolute left-0 right-0 top-2/3 h-[2px] bg-amber-900/50"></div>
                            </>
                          )}

                          {boardDesign === 2 && (
                            <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]"></div>
                          )}

                          {boardDesign === 3 && (
                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
                          )}

                          {boardDesign === 5 && (
                             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/rough-cloth.png')]"></div>
                          )}

                          {/* Corner Bolts/Rivets */}
                          <div className={`absolute top-2 left-2 w-3 h-3 rounded-full border shadow-inner flex items-center justify-center text-[5px] font-bold ${boardDesign === 3 ? 'bg-stone-400 border-stone-500 text-stone-700' : 'bg-yellow-600/80 border-yellow-800 text-yellow-900'}`}>+</div>
                          <div className={`absolute top-2 right-2 w-3 h-3 rounded-full border shadow-inner flex items-center justify-center text-[5px] font-bold ${boardDesign === 3 ? 'bg-stone-400 border-stone-500 text-stone-700' : 'bg-yellow-600/80 border-yellow-800 text-yellow-900'}`}>+</div>
                          <div className={`absolute bottom-2 left-2 w-3 h-3 rounded-full border shadow-inner flex items-center justify-center text-[5px] font-bold ${boardDesign === 3 ? 'bg-stone-400 border-stone-500 text-stone-700' : 'bg-yellow-600/80 border-yellow-800 text-yellow-900'}`}>+</div>
                          <div className={`absolute bottom-2 right-2 w-3 h-3 rounded-full border shadow-inner flex items-center justify-center text-[5px] font-bold ${boardDesign === 3 ? 'bg-stone-400 border-stone-500 text-stone-700' : 'bg-yellow-600/80 border-yellow-800 text-yellow-900'}`}>+</div>

                          {/* Board Header */}
                          <div className={`flex justify-between items-center border-b pb-2 z-10 w-full ${boardDesign === 3 ? 'border-stone-300 text-stone-500' : 'border-yellow-600/30 text-yellow-500'}`}>
                            <span className="text-[7.5px] font-black uppercase tracking-[0.2em]">{boardDesign === 3 ? 'National Park' : 'Puncak Sejati'}</span>
                            <div className="flex items-center gap-1">
                              <Compass size={10} />
                              <span className="text-[7px] font-bold uppercase">{boardDesign === 2 ? 'Stealth Mode' : 'SAVER AREA'}</span>
                            </div>
                          </div>

                          {/* Main Board Content */}
                          <div className="my-auto space-y-2 z-10">
                            <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] ${boardDesign === 3 ? 'text-stone-400' : boardDesign === 4 ? 'text-blue-200' : 'text-yellow-600'}`}>WELCOME TO</h4>
                            {boardShowMountain && (
                              <h3 className={`font-extrabold uppercase text-3xl md:text-5xl tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
                                boardDesign === 3 ? 'text-stone-800' : 
                                boardDesign === 4 ? 'text-white' :
                                'text-yellow-50'
                              } ${boardDesign === 2 ? 'font-mono tracking-widest' : boardDesign === 4 ? 'font-sans font-black italic' : 'font-serif'}`}>
                                {boardDesign === 2 ? mountainName.toUpperCase() : `⛰️ ${(mountainName.toLowerCase().startsWith('gunung') ? mountainName : 'GUNUNG ' + mountainName).toUpperCase()} ⛰️`}
                              </h3>
                            )}
                            <div className={`inline-block px-5 py-2 rounded-lg text-xl md:text-2xl font-black tracking-widest shadow-lg ${
                              boardDesign === 3 ? 'bg-stone-800 text-stone-100' : 
                              boardDesign === 4 ? 'bg-art-orange text-white' : 
                              boardDesign === 2 ? 'bg-white text-black' :
                              'bg-yellow-500 text-black'
                            }`}>
                              {mountainMdpl}
                            </div>
                            <p className={`text-[8px] font-black tracking-[0.15em] uppercase ${boardDesign === 3 ? 'text-stone-500' : boardDesign === 4 ? 'text-blue-300' : 'text-yellow-500/80'}`}>
                              Jalur Pendakian Resmi Via {customVia}
                            </p>
                          </div>

                          {/* Board Footer */}
                          <div className={`flex justify-between items-center pt-2 border-t text-[7px] font-black uppercase z-10 w-full ${
                            boardDesign === 3 ? 'border-stone-300 text-stone-400' : 'border-yellow-600/30 text-yellow-600/80'
                          }`}>
                            <span>Tgl: {tripDate}</span>
                            <span>{boardDesign === 4 ? 'NGOPI DI KETINGGIAN' : '@ngopi.dketinggian'}</span>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Decor ambient light points inside canvas */}
                    <div className="absolute -bottom-24 -left-24 w-60 h-60 opacity-20 rounded-full blur-[80px]" style={{ backgroundColor: theme.primary }}></div>
                    <div className="absolute -top-24 -right-24 w-60 h-60 opacity-25 rounded-full blur-[80px]" style={{ backgroundColor: theme.accent }}></div>
                  </motion.div>
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

        {/* Slide Navigation & Dots */}
        {selectedSlides.length > 1 && (
          <div className="flex items-center gap-4 mt-5 z-20">
                  <button 
                    onClick={() => setCurrentSlide((prev) => (prev > 0 ? prev - 1 : selectedSlides.length - 1))}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center transition-all shadow-lg border border-white/10 shrink-0 hover:scale-105 active:scale-95"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex items-center gap-1.5">
                    {selectedSlides.map((s, idx) => {
                      const isActive = currentSlide === idx;
                      return (
                        <button
                          key={s}
                          onClick={() => setCurrentSlide(idx)}
                          className={`h-2 rounded-full transition-all duration-300 ${isActive ? 'w-6 bg-art-orange shadow-md' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                        />
                      );
                    })}
                  </div>
                  <button 
                    onClick={() => setCurrentSlide((prev) => (prev < selectedSlides.length - 1 ? prev + 1 : 0))}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center transition-all shadow-lg border border-white/10 shrink-0 hover:scale-105 active:scale-95"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
{/* Secondary Action Toolbar shown underneath the preview */}
                <div className="mt-8 w-full max-w-sm px-4 relative z-50 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-white/10"></div>
                    <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Download Options</span>
                    <div className="flex-1 h-px bg-white/10"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => downloadPoster('png')}
                      disabled={isDownloading}
                      className="flex-1 bg-white hover:bg-gray-100 disabled:bg-gray-600 text-black py-4 px-5 rounded-2xl font-black uppercase tracking-wider text-[10px] flex flex-col items-center justify-center gap-1 shadow-xl transition-all"
                    >
                      <Download size={16} /> 
                      <span>PNG Image</span>
                    </button>
                    <button 
                      onClick={() => downloadPoster('pdf')}
                      disabled={isDownloading}
                      className="flex-1 bg-white hover:bg-gray-100 disabled:bg-gray-600 text-black py-4 px-5 rounded-2xl font-black uppercase tracking-wider text-[10px] flex flex-col items-center justify-center gap-1 shadow-xl transition-all"
                    >
                      <FileText size={16} className="text-red-600" /> 
                      <span>PDF Document</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => downloadAllSlides('png')}
                      disabled={isDownloading}
                      className="flex-1 bg-art-orange hover:bg-orange-600 disabled:bg-gray-600 text-white py-3.5 px-5 rounded-2xl font-black uppercase tracking-wider text-[9px] flex items-center justify-center gap-2 shadow-xl transition-all"
                    >
                      <Sparkles size={14} /> All (PNG)
                    </button>
                    <button 
                      onClick={() => downloadAllSlides('pdf')}
                      disabled={isDownloading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3.5 px-5 rounded-2xl font-black uppercase tracking-wider text-[9px] flex items-center justify-center gap-2 shadow-xl transition-all"
                    >
                      <FileText size={14} /> Full Package (PDF)
                    </button>
                  </div>

                  {isDownloading && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-white/60">
                        <span>Memproses Render HD...</span>
                        <span>{downloadProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${downloadProgress}%` }}
                          className="h-full bg-art-orange"
                        />
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      setShowPreview(false);
                      if (window.innerWidth < 768) {
                        setActiveMobileTab('controls');
                      }
                    }}
                    className="w-full bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 py-3 px-5 rounded-2xl font-black uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RotateCcw size={14} /> Kembali Edit Desain
                  </button>
                </div>
              </div>
            )}
            
            {/* Image Viewer Controls removed as they are now inside TransformWrapper overlay */}
            
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
