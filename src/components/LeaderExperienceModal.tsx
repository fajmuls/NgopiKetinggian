import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mountain, Calendar, ChevronLeft, ChevronRight, Eye, Camera } from 'lucide-react';

interface Experience {
  mountain: string;
  years: string;
  description: string;
  photos?: string[];
}

interface LeaderExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderName: string;
  experiences: Experience[];
}

export const LeaderExperienceModal = ({ isOpen, onClose, leaderName, experiences }: LeaderExperienceModalProps) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [activeExpIdx, setActiveExpIdx] = useState<number>(0);

  if (!isOpen) return null;

  const currentExp = experiences[activeExpIdx] || null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose} 
          className="absolute inset-0 bg-art-text/80 backdrop-blur-md" 
        />

        {/* Modal Panel */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white border-2 border-art-text rounded-[32px] overflow-hidden shadow-2xl z-10 flex flex-col md:flex-row h-[90vh] md:h-[650px]"
        >
          {/* Close Button */}
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-50 p-2 bg-white/90 backdrop-blur-sm hover:bg-art-orange hover:text-white rounded-full border border-art-text/10 shadow transition-all"
          >
            <X size={18} />
          </button>

          {/* Left Sidebar: List of Climbs */}
          <div className="w-full md:w-80 bg-art-bg/30 border-b md:border-b-0 md:border-r border-art-text/10 p-6 flex flex-col shrink-0 overflow-y-auto">
            <div className="mb-6">
              <span className="text-[9px] font-black uppercase text-art-orange tracking-widest block mb-1">Portofolio Pendaki</span>
              <h3 className="text-xl font-black text-art-text uppercase tracking-tight">{leaderName}</h3>
              <p className="text-[10px] font-bold text-art-text/40 uppercase mt-0.5">{experiences.length} Ekspedisi Terdaftar</p>
            </div>

            <div className="space-y-2 flex-1">
              {experiences.map((exp, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveExpIdx(idx);
                    setSelectedPhoto(null);
                  }}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${activeExpIdx === idx ? 'bg-art-text border-art-text text-white shadow-md' : 'bg-white border-art-text/10 text-art-text hover:border-art-orange hover:bg-art-bg/20'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeExpIdx === idx ? 'bg-art-orange text-white' : 'bg-art-bg text-art-text/60 border border-art-text/10'}`}>
                    <Mountain size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-black uppercase truncate leading-snug ${activeExpIdx === idx ? 'text-white' : 'text-art-text'}`}>{exp.mountain || "Tanpa Nama"}</p>
                    <p className={`text-[9px] font-bold uppercase tracking-wider ${activeExpIdx === idx ? 'text-white/60' : 'text-art-text/40'}`}>{exp.years || "Tahun Tidak Disebut"}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Main Content: Expedition Details & Gallery */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col bg-white">
            {currentExp ? (
              <div className="space-y-6 flex-1 flex flex-col">
                {/* Header */}
                <div className="border-b-2 border-dashed border-art-text/10 pb-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="flex items-center gap-1 bg-art-orange/10 px-2.5 py-1 rounded-lg border border-art-orange/20 text-art-orange text-[9px] font-black uppercase tracking-wider">
                      <Mountain size={12} /> {currentExp.mountain}
                    </span>
                    {currentExp.years && (
                      <span className="flex items-center gap-1 bg-art-text/5 px-2.5 py-1 rounded-lg border border-art-text/10 text-art-text/60 text-[9px] font-black uppercase tracking-wider">
                        <Calendar size={12} /> Waktu: {currentExp.years}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xl font-black uppercase text-art-text tracking-tight">Ekspedisi Gunung {currentExp.mountain}</h4>
                </div>

                {/* Description */}
                <div className="bg-art-bg/30 p-5 rounded-2xl border border-art-text/5">
                  <p className="text-[10px] font-bold text-art-text/40 uppercase tracking-widest mb-2 block">Catatan Perjalanan & Aktivitas</p>
                  <p className="text-xs md:text-sm text-art-text/80 leading-relaxed font-medium whitespace-pre-wrap">
                    {currentExp.description || "Tidak ada detail cerita perjalanan yang diisikan untuk pendakian ini."}
                  </p>
                </div>

                {/* Photo Gallery (Detailed View) */}
                <div className="space-y-3 mt-auto">
                  <div className="flex items-center gap-2 border-t border-art-text/10 pt-4">
                    <Camera size={14} className="text-art-orange" />
                    <span className="text-[10px] font-black uppercase text-art-text/40 tracking-wider">Galeri Foto Dokumentasi (Klik untuk detail)</span>
                  </div>
                  
                  {currentExp.photos && currentExp.photos.filter(p => p && p.trim() !== "").length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {currentExp.photos.filter(p => p && p.trim() !== "").map((photo, pIdx) => (
                        <div 
                          key={pIdx}
                          onClick={() => setSelectedPhoto(photo)}
                          className="group/photo relative aspect-square rounded-xl overflow-hidden border-2 border-art-text/10 hover:border-art-orange cursor-pointer shadow-sm transition-all hover:scale-[1.02]"
                        >
                          <img src={photo} alt={`${currentExp.mountain} doc ${pIdx + 1}`} className="w-full h-full object-cover transition-transform group-hover/photo:scale-110" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="bg-white text-art-text p-2 rounded-full shadow border border-art-text/10 hover:scale-115 transition-transform">
                              <Eye size={12} />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 border border-dashed border-art-text/10 rounded-2xl text-center bg-art-bg/10">
                      <p className="text-[10px] font-bold text-art-text/30 uppercase tracking-wider">Belum ada foto dokumentasi diunggah</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <Mountain size={48} className="text-art-text/20 mb-3" />
                <p className="text-xs font-bold text-art-text/40 uppercase tracking-widest">Pilih ekspedisi di sebelah kiri untuk melihat detail</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Full-Screen Detailed Image Lightbox/Viewer */}
        <AnimatePresence>
          {selectedPhoto && (
            <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setSelectedPhoto(null)} 
                className="absolute inset-0 bg-black/90 backdrop-blur-md" 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative max-w-4xl max-h-[85vh] z-10 flex flex-col items-center"
              >
                <img 
                  src={selectedPhoto} 
                  alt="Detailed View" 
                  className="max-w-full max-h-[80vh] object-contain rounded-2xl border-4 border-white shadow-2xl bg-black" 
                />
                <div className="mt-3 text-center bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                  <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Mountain size={12} className="text-art-orange" /> {currentExp?.mountain} ({currentExp?.years})
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedPhoto(null)} 
                  className="absolute -top-12 right-0 text-white hover:text-art-orange transition-colors flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full border border-white/20"
                >
                  <X size={16} /> <span className="text-[10px] font-black uppercase tracking-wider">Tutup</span>
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};
