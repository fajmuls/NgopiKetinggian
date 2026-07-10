import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ArrowRight, Mountain, Shield, Clock, MapPin, TrendingUp } from 'lucide-react';
import { useCompare } from '../CompareContext';
import { Button } from './Button';
import { formatPrice } from '../useAppConfig';

export const ComparisonModal = ({ isOpen, onClose, onBook }: { isOpen: boolean, onClose: () => void, onBook: (item: any) => void }) => {
  const { selectedItems, toggleItem, clearItems } = useCompare();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-art-text/80 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-art-bg rounded-[2rem] shadow-2xl border-4 border-art-text overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-art-text p-6 md:p-8 text-white flex justify-between items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Perbandingan Trip</h2>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">Bandingkan fitur dan harga terbaik</p>
            </div>
            <button 
              onClick={onClose}
              className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all border border-white/20"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-6 md:p-8">
            {selectedItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="w-20 h-20 bg-art-text/5 rounded-full flex items-center justify-center mb-6">
                  <TrendingUp size={32} className="text-art-text/20" />
                </div>
                <h3 className="text-xl font-black uppercase text-art-text mb-2">Belum ada pilihan</h3>
                <p className="text-art-text/60 text-sm max-w-xs mx-auto font-medium">Pilih hingga 3 destinasi atau open trip untuk dibandingkan di sini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-[150px_repeat(auto-fit,minmax(200px,1fr))] gap-4 md:gap-0">
                {/* Specs Column (Hidden on Mobile) */}
                <div className="hidden md:flex flex-col pt-[280px] border-r border-art-text/5 pr-4 space-y-12">
                   <div className="h-10 flex items-center text-[10px] font-black uppercase tracking-widest text-art-text/40">Harga</div>
                   <div className="h-10 flex items-center text-[10px] font-black uppercase tracking-widest text-art-text/40">Durasi</div>
                   <div className="h-10 flex items-center text-[10px] font-black uppercase tracking-widest text-art-text/40">Kesulitan</div>
                   <div className="h-10 flex items-center text-[10px] font-black uppercase tracking-widest text-art-text/40">Wilayah</div>
                   <div className="h-10 flex items-center text-[10px] font-black uppercase tracking-widest text-art-text/40">Layanan</div>
                </div>

                {/* Items Grid */}
                <div className={`grid grid-cols-1 md:grid-cols-${selectedItems.length} flex-1`}>
                  {selectedItems.map((item, idx) => (
                    <div key={item.id} className={`flex flex-col p-4 md:p-6 ${idx < selectedItems.length - 1 ? 'md:border-r border-art-text/5' : ''}`}>
                      {/* Image & Title */}
                      <div className="relative aspect-video rounded-2xl overflow-hidden mb-6 border-2 border-art-text/10">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2">
                           <button 
                             onClick={() => toggleItem(item)}
                             className="bg-white/90 backdrop-blur-sm p-2 rounded-xl text-red-500 hover:bg-red-50 transition-all border border-red-100"
                           >
                             <X size={16} />
                           </button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                           <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase text-white ${item.type === 'open' ? 'bg-art-orange' : 'bg-art-green'}`}>
                             {item.type === 'open' ? 'Open Trip' : 'Private'}
                           </span>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-black uppercase tracking-tight text-art-text mb-8 min-h-[48px] leading-tight">{item.name}</h3>

                      {/* Specs Detail (Mobile View) */}
                      <div className="space-y-6 flex-1">
                        <div className="md:h-10 flex flex-col md:justify-center">
                          <span className="md:hidden text-[9px] font-black uppercase text-art-text/40 tracking-widest mb-1">Harga</span>
                          <p className="text-xl font-black text-art-orange">Rp {formatPrice(item.price)}K</p>
                        </div>

                        <div className="md:h-10 flex flex-col md:justify-center">
                          <span className="md:hidden text-[9px] font-black uppercase text-art-text/40 tracking-widest mb-1">Durasi</span>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-art-text/40" />
                            <p className="text-sm font-bold text-art-text">{item.duration || '2H 1M'}</p>
                          </div>
                        </div>

                        <div className="md:h-10 flex flex-col md:justify-center">
                          <span className="md:hidden text-[9px] font-black uppercase text-art-text/40 tracking-widest mb-1">Kesulitan</span>
                          <div className="flex items-center gap-2">
                            <TrendingUp size={14} className="text-art-text/40" />
                            <p className="text-sm font-bold text-art-text">{item.difficulty}</p>
                          </div>
                        </div>

                        <div className="md:h-10 flex flex-col md:justify-center">
                          <span className="md:hidden text-[9px] font-black uppercase text-art-text/40 tracking-widest mb-1">Wilayah</span>
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-art-text/40" />
                            <p className="text-sm font-bold text-art-text">{item.region}</p>
                          </div>
                        </div>

                        <div className="md:h-10 flex flex-col md:justify-center">
                          <span className="md:hidden text-[9px] font-black uppercase text-art-text/40 tracking-widest mb-1">Layanan</span>
                          <div className="flex items-center gap-2">
                            <Shield size={14} className="text-art-green" />
                            <p className="text-[10px] font-black text-art-green uppercase tracking-widest">Premium Care</p>
                          </div>
                        </div>

                        <div className="pt-8 mt-auto">
                          <Button 
                            variant={item.type === 'open' ? 'primary' : 'secondary'} 
                            className="w-full py-4 text-xs font-black uppercase tracking-widest"
                            onClick={() => onBook(item)}
                          >
                            Pesan Sekarang <ArrowRight size={14} className="ml-2" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {selectedItems.length > 0 && (
            <div className="bg-art-text/5 p-4 border-t border-art-text/10 flex justify-center">
               <button 
                 onClick={clearItems}
                 className="text-[10px] font-black uppercase tracking-widest text-art-text/40 hover:text-red-500 transition-colors"
               >
                 Hapus Semua Pilihan
               </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
