import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Image as ImageIcon, Layout, Maximize, Smartphone, Monitor, Coffee, Mountain, Calendar, MapPin, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { toPng } from 'html-to-image';

interface PosterProps {
  trip: any;
  onClose: () => void;
  type: 'open' | 'private';
}

type AspectRatio = '1:1' | '4:3' | '16:9';

export const TripPosterGenerator = ({ trip, onClose, type }: PosterProps) => {
  const [ratio, setRatio] = useState<AspectRatio>('1:1');
  const [theme, setTheme] = useState<'dark' | 'light' | 'orange'>('dark');
  const posterRef = useRef<HTMLDivElement>(null);

  const downloadPoster = async () => {
    if (posterRef.current === null) return;
    try {
      const dataUrl = await toPng(posterRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `poster-${trip.name || 'trip'}-${ratio}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download poster', err);
    }
  };

  const getContainerStyles = () => {
    switch (ratio) {
      case '1:1': return 'aspect-square w-full max-w-[500px]';
      case '4:3': return 'aspect-[4/3] w-full max-w-[600px]';
      case '16:9': return 'aspect-[16/9] w-full max-w-[800px]';
      default: return 'aspect-square';
    }
  };

  const getThemeStyles = () => {
    switch (theme) {
      case 'dark': return 'bg-[#1a1a1a] text-white';
      case 'light': return 'bg-white text-[#1a1a1a]';
      case 'orange': return 'bg-[#ff5722] text-white';
      default: return 'bg-[#1a1a1a] text-white';
    }
  };

  const tripName = trip.name || 'Gunung Indonesia';
  const tripPrice = type === 'open' 
    ? `Rp ${trip.price?.toLocaleString('id-ID') || '0'}`
    : `Mulai Rp ${Math.min(...(trip.paths?.flatMap((p: any) => p.durations?.map((d: any) => d.price)) || [0])).toLocaleString('id-ID')}`;
  
  const tripDate = type === 'open' ? trip.jadwal : 'Sesuai Request';
  const tripMepo = type === 'open' ? trip.mepo : 'Jakarta / Sesuai Meeting Point';
  const tripDuration = type === 'open' ? trip.duration : (trip.paths?.[0]?.durations?.[0]?.label || '-');

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="bg-[#f8f9fa] w-full max-w-5xl rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[90vh]">
        {/* Left: Controls */}
        <div className="w-full md:w-80 p-8 border-r border-gray-200 bg-white space-y-8 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black uppercase tracking-tight text-[#1a1a1a]">Poster Editor</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Rasio Gambar</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '1:1', icon: Smartphone, label: 'Feed' },
                { id: '4:3', icon: Layout, label: '4:3' },
                { id: '16:9', icon: Monitor, label: 'Story' }
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRatio(r.id as AspectRatio)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${ratio === r.id ? 'border-[#ff5722] bg-orange-50 text-[#ff5722]' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                >
                  <r.icon size={20} />
                  <span className="text-[9px] font-bold mt-1 uppercase">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Tema Visual</label>
            <div className="flex gap-2">
              {[
                { id: 'dark', color: 'bg-[#1a1a1a]' },
                { id: 'light', color: 'bg-white border' },
                { id: 'orange', color: 'bg-[#ff5722]' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center transition-all ${theme === t.id ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''}`}
                >
                  {theme === t.id && <CheckCircle size={14} className={t.id === 'light' ? 'text-black' : 'text-white'} />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-8">
            <button 
              onClick={downloadPoster}
              className="w-full bg-[#1a1a1a] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-black transition-all active:scale-95"
            >
              <Download size={16} /> Download PNG
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="flex-1 bg-gray-200/50 p-4 md:p-12 flex items-center justify-center overflow-auto relative">
          <div 
            ref={posterRef}
            className={`${getContainerStyles()} ${getThemeStyles()} relative overflow-hidden shadow-2xl flex flex-col`}
          >
            {/* Background Image (Optional/Placeholder) */}
            <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: trip.image ? `url(${trip.image})` : 'none' }}></div>
            
            {/* Main Content Layout */}
            <div className="relative z-10 flex flex-col h-full p-[8%]">
              {/* Header */}
              <div className="flex items-center gap-3 mb-[10%]">
                <div className="w-10 h-10 bg-[#ff5722] rounded-xl flex items-center justify-center shadow-lg">
                  <Coffee size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-black uppercase tracking-widest leading-none">Ngopi di</h1>
                  <h2 className="text-sm font-black uppercase tracking-widest text-[#ff5722] leading-none">Ketinggian</h2>
                </div>
              </div>

              {/* Title Section */}
              <div className="mb-auto">
                <p className="text-[12px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Petualangan Menanti</p>
                <h3 className={`text-4xl md:text-5xl font-black uppercase leading-[0.9] tracking-tighter mb-4 ${theme === 'light' ? 'text-black' : 'text-white'}`}>
                  {tripName}
                </h3>
                <div className="h-1.5 w-24 bg-[#ff5722] rounded-full"></div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-[10%]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 opacity-50">
                    <Calendar size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Jadwal Trip</span>
                  </div>
                  <p className="text-sm font-bold">{tripDate}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 opacity-50">
                    <MapPin size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Meeting Point</span>
                  </div>
                  <p className="text-sm font-bold">{tripMepo}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 opacity-50">
                    <Clock size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Durasi</span>
                  </div>
                  <p className="text-sm font-bold">{tripDuration}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 opacity-50">
                    <CreditCard size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Investasi</span>
                  </div>
                  <p className="text-sm font-black text-[#ff5722]">{tripPrice}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-current border-opacity-10 pt-6 mt-auto">
                <div className="space-y-0.5">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">Booking di Website</p>
                  <p className="text-[10px] font-bold">ngopidiketinggian.com</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">Follow Kami</p>
                  <p className="text-[10px] font-bold">@ngopidiketinggian</p>
                </div>
              </div>

              {/* Aesthetic Decor */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#ff5722] opacity-10 rounded-full blur-3xl -mr-24 -mt-24"></div>
            </div>
          </div>
          
          <div className="absolute top-4 left-4 bg-white/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/50 flex items-center gap-2 pointer-events-none">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-[10px] font-bold uppercase tracking-tight text-gray-600">Live Poster Preview</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
