import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageCircle, X, User, MapPin } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy, onSnapshot, limit } from 'firebase/firestore';

interface TestimonialsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestimonialsModal: React.FC<TestimonialsModalProps> = ({ isOpen, onClose }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const q = query(
      collection(db, 'mountainReviews'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-[2.5rem] border-4 border-art-text overflow-hidden shadow-[20px_20px_0px_0px_rgba(26,26,26,1)] w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        <div className="p-6 md:p-10 border-b-4 border-art-text flex justify-between items-center bg-art-bg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-art-orange/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-art-text leading-none">Cerita & Testimoni</h2>
            <p className="text-xs md:text-sm font-bold text-art-orange uppercase tracking-[0.3em] mt-2">Dengarkan kisah para pendaki kami</p>
          </div>
          <button onClick={onClose} className="relative z-10 p-3 hover:bg-art-text/5 rounded-full transition-colors group">
            <X size={32} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-art-orange border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-art-text/40">Memuat Cerita Terbaik...</p>
            </div>
          ) : reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {reviews.map((r, idx) => (
                <motion.div 
                  key={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-art-bg/30 border-2 border-art-text/5 p-6 rounded-[2rem] flex flex-col gap-4 hover:border-art-orange/20 transition-colors group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-2xl bg-white border-2 border-art-text shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                         {r.userAvatar ? <img src={r.userAvatar} alt="" className="w-full h-full object-cover" /> : <User size={24} className="text-art-text/20" />}
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase text-art-text tracking-tight group-hover:text-art-orange transition-colors">{r.userName}</p>
                        <div className="flex gap-0.5 text-yellow-400 mt-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={10} fill={s <= r.rating ? "currentColor" : "none"} className={s <= r.rating ? "" : "text-gray-200"} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[9px] font-black uppercase text-art-orange bg-art-orange/10 px-2 py-0.5 rounded-full border border-art-orange/20 mb-1 flex items-center gap-1">
                          <MapPin size={8} /> {r.mountainName}
                       </span>
                       <span className="text-[8px] font-bold text-art-text/30 uppercase">
                         {r.createdAt?.toDate?.() ? r.createdAt.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Baru Saja'}
                       </span>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <span className="absolute -top-4 -left-2 text-4xl text-art-orange/10 font-serif">"</span>
                    <p className="text-xs md:text-sm font-medium text-art-text/80 leading-relaxed italic relative z-10 px-2">
                      {r.review || "Pengalaman mendaki yang sangat luar biasa bersama tim Ngopi di Ketinggian! Fasilitas mantap dan kopinya juara."}
                    </p>
                    <span className="absolute -bottom-6 -right-2 text-4xl text-art-orange/10 font-serif">"</span>
                  </div>

                  {r.photos && r.photos.length > 0 && (
                    <div className={`grid gap-2 mt-2 ${r.photos.length === 1 ? 'grid-cols-1' : r.photos.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                      {r.photos.map((photo: string, pIdx: number) => (
                        <div key={pIdx} className="aspect-square rounded-xl overflow-hidden border border-art-text/10 bg-art-bg group/photo">
                          <img 
                            src={photo} 
                            alt={`Photo ${pIdx + 1}`} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/photo:scale-110 cursor-zoom-in"
                            onClick={() => window.open(photo, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 opacity-20 flex flex-col items-center">
               <MessageCircle size={80} strokeWidth={1} className="mb-4" />
               <p className="text-lg font-black uppercase tracking-widest text-art-text">Belum ada cerita yang dibagikan</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t-4 border-art-text bg-art-bg/30 text-center">
           <p className="text-[10px] font-black uppercase tracking-widest text-art-text/40 italic">Ngopi Di Ketinggian — Seduhan Kopi Terbaik di Atas Awan</p>
        </div>
      </motion.div>
    </div>
  );
};
