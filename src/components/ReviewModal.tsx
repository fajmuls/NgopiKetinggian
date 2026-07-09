import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, X, Send, Camera, Image as ImageIcon } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { customAlert } from '../GlobalDialog';

export const ReviewModal = ({ isOpen, onClose, booking, user }: any) => {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!isOpen || !booking) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      customAlert('Ukuran foto maksimal 2MB');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrl(reader.result as string);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (review.trim() === '') {
       customAlert('Mohon isi kolom cerita petualangan Anda.');
       return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'reviews'), {
         bookingId: booking.id,
         tripId: booking.destinasi, 
         mountainName: booking.destinasi,
         userName: user?.displayName || booking.nama || 'Pendaki Anonim',
         userEmail: user?.email,
         rating,
         review,
         photoUrl,
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
                 <button key={s} onClick={() => setRating(s)} className={`p-1 transition-all ${rating >= s ? 'text-yellow-400' : 'text-gray-300'}`}>
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

           <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-art-text/40 mb-2 block">Upload Foto Momen (Opsional)</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-art-text/20 rounded-xl hover:bg-art-bg/30 transition-all bg-art-bg/10 relative overflow-hidden group">
                  {photoUrl ? (
                    <>
                      <img src={photoUrl} className="w-full h-full object-cover" alt="Preview" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={20} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon size={24} className="text-art-text/20 mb-1" />
                      <span className="text-[8px] font-black uppercase text-art-text/40">Upload</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
                <div className="flex-1">
                   <p className="text-[9px] font-medium text-art-text/40 leading-relaxed uppercase tracking-tighter">
                     Berikan bukti keseruanmu di atas awan. Foto ini akan muncul di testimoni website.<br/>
                     <span className="font-black">Format: JPG, PNG • Maks: 2MB</span>
                   </p>
                </div>
              </div>
           </div>

           <button 
             onClick={handleSubmit}
             disabled={loading || uploading}
             className="w-full mt-4 flex items-center justify-center gap-2 bg-art-orange text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50"
           >
              {loading ? 'Mengirim...' : uploading ? 'Memproses Foto...' : <><Send size={16} /> Bagikan Cerita</>}
           </button>
        </div>
      </motion.div>
    </div>
  );
};
