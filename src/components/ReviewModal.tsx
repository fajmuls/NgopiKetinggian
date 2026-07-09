import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, X, Send, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { customAlert } from '../GlobalDialog';
import { InputWithPaste } from '../admin/WebSettingsAdmin';

export const ReviewModal = ({ isOpen, onClose, booking, user }: any) => {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !booking) return null;

  const handleAddPhoto = () => {
    setPhotos([...photos, '']);
  };

  const handleRemovePhoto = (idx: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(idx, 1);
    setPhotos(newPhotos);
  };

  const handlePhotoChange = (idx: number, val: string) => {
    const newPhotos = [...photos];
    newPhotos[idx] = val;
    setPhotos(newPhotos);
  };

  const handleSubmit = async () => {
    if (review.trim() === '') {
       customAlert('Mohon isi kolom cerita petualangan Anda.');
       return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'mountainReviews'), {
         mountainId: booking.destinasi, // Use destination name as ID for simplicity or if you have real IDs
         mountainName: booking.destinasi,
         userId: user?.uid || 'anonymous',
         userName: user?.displayName || booking.nama || 'Pendaki Anonim',
         userAvatar: user?.photoURL || '',
         rating,
         review,
         photos: photos.filter(p => p.trim() !== ''),
         createdAt: serverTimestamp(),
         status: 'published' 
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left text-art-text">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-white w-full max-w-lg rounded-[2rem] border-4 border-art-text relative shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b-2 border-art-text/10 flex justify-between items-center bg-art-bg/20">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-art-text leading-none">Cerita & Ulasan</h3>
            <p className="text-[10px] font-bold text-art-text/40 uppercase tracking-widest mt-2">Bagikan pengalamanmu mendaki {booking.destinasi}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:text-art-orange transition-colors"><X size={24} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
           <div>
             <label className="text-[10px] font-black uppercase tracking-widest text-art-text/40 mb-3 block">Beri Rating Bintang</label>
             <div className="flex gap-2 justify-center py-2">
               {[1,2,3,4,5].map(s => (
                 <button key={s} onClick={() => setRating(s)} className={`p-1 transition-all transform hover:scale-110 \${rating >= s ? 'text-yellow-400' : 'text-gray-200'}`}>
                    <Star size={40} fill={rating >= s ? "currentColor" : "none"} />
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
                className="w-full border-2 border-art-text/10 p-4 rounded-2xl text-sm outline-none focus:border-art-orange bg-art-bg/20 min-h-[120px] transition-all"
              />
           </div>

           <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-art-text/40">Foto Petualangan (URL)</label>
                <button 
                  onClick={handleAddPhoto}
                  className="flex items-center gap-1 text-[10px] font-black uppercase text-art-orange hover:opacity-80 transition-opacity"
                >
                  <Plus size={14} /> Tambah Foto
                </button>
              </div>
              <div className="space-y-3">
                {photos.map((p, idx) => (
                  <div key={idx} className="flex gap-2 items-center group">
                    <div className="flex-1">
                      <InputWithPaste 
                        value={p}
                        onChange={(e: any) => handlePhotoChange(idx, e.target.value)}
                        placeholder="Link URL Foto (Contoh: Google Drive/Unsplash)"
                        className="w-full border-2 border-art-text/10 p-2 rounded-xl text-[10px] outline-none focus:border-art-orange bg-white"
                      />
                    </div>
                    <button 
                      onClick={() => handleRemovePhoto(idx)}
                      className="p-2 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {photos.length === 0 && (
                   <div className="py-4 border-2 border-dashed border-art-text/5 rounded-2xl flex flex-col items-center justify-center opacity-30">
                      <ImageIcon size={24} className="mb-2" />
                      <p className="text-[9px] font-bold uppercase">Belum ada foto</p>
                   </div>
                )}
              </div>
           </div>
        </div>

        <div className="p-6 bg-art-bg/30 border-t-2 border-art-text/10">
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-art-orange text-white py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50"
          >
             {loading ? 'Mengirim Cerita...' : <><Send size={18} /> Bagikan Cerita Petualangan</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
