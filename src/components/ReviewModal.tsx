import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, X, Send } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { customAlert } from '../GlobalDialog';

export const ReviewModal = ({ isOpen, onClose, booking, user }: any) => {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSubmit = async () => {
    if (review.trim() === '') {
       customAlert('Mohon isi kolom cerita petualangan Anda.');
       return;
    }
    setLoading(true);
    try {
      // check if already reviewed? We can just add it.
      await addDoc(collection(db, 'reviews'), {
         bookingId: booking.id,
         tripId: booking.destinasi, // mountain name
         mountainName: booking.destinasi,
         userName: user?.displayName || booking.nama || 'Pendaki Anonim',
         userEmail: user?.email,
         rating,
         review,
         createdAt: serverTimestamp(),
         status: 'published' // by default published, admin can hide it
      });
      customAlert('Terima kasih! Cerita petualangan Anda berhasil dibagikan.');
      onClose();
    } catch (e: any) {
      customAlert('Gagal mengirim ulasan: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left text-art-text">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg rounded-3xl border-4 border-art-text relative shadow-2xl overflow-hidden p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:text-art-orange transition-colors"><X size={20} /></button>
        
        <h3 className="text-xl font-black uppercase tracking-tight mb-1 text-art-text">Cerita & Ulasan</h3>
        <p className="text-[10px] font-bold text-art-text/40 uppercase tracking-widest mb-6">Bagikan pengalamanmu mendaki {booking.destinasi}</p>

        <div className="space-y-4">
           <div>
             <label className="text-[10px] font-black uppercase tracking-widest text-art-text/40 mb-2 block">Rating Bintang</label>
             <div className="flex gap-2">
               {[1,2,3,4,5].map(s => (
                 <button key={s} onClick={() => setRating(s)} className={`p-1 transition-all \${rating >= s ? 'text-yellow-400' : 'text-gray-300'}`}>
                    <Star size={32} fill="currentColor" />
                 </button>
               ))}
             </div>
           </div>
           
           <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-art-text/40 mb-2 block">Cerita Perjalanan</label>
              <textarea 
                rows={4}
                value={review}
                onChange={e => setReview(e.target.value)}
                placeholder="Ceritakan pengalaman seru, fasilitas, atau pelayanan trip..."
                className="w-full border-2 border-art-text p-3 rounded-xl text-xs outline-none focus:border-art-orange bg-art-bg/20"
              />
           </div>

           <button 
             onClick={handleSubmit}
             disabled={loading}
             className="w-full mt-4 flex items-center justify-center gap-2 bg-art-orange text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50"
           >
              {loading ? 'Mengirim...' : <><Send size={16} /> Bagikan Cerita</>}
           </button>
        </div>
      </motion.div>
    </div>
  );
};
