import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, X, Send, Camera, Image as ImageIcon } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { customAlert } from '../GlobalDialog';

export const ReviewModal = ({ isOpen, onClose, booking, user }: any) => {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [mountainName, setMountainName] = useState(booking?.destinasi || '');
  const [climbYear, setClimbYear] = useState(new Date().getFullYear().toString());
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
    if (mountainName.trim() === '') {
       customAlert('Mohon isi nama gunung yang didaki.');
       return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'reviews'), {
         bookingId: booking.id,
         tripId: booking.destinasi, 
         mountainName: mountainName,
         climbYear: climbYear,
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
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 text-left text-art-text">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white w-full max-w-lg rounded-3xl border-4 border-art-text relative shadow-[16px_16px_0px_0px_rgba(26,26,26,1)] overflow-hidden flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-art-bg rounded-xl transition-all z-10"><X size={20} /></button>
        
        <div className="p-6 pb-0">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-1 text-art-text">Kesan Pendakian</h3>
          <p className="text-[10px] font-bold text-art-text/40 uppercase tracking-widest">Abadikan jejak langkahmu di {booking.destinasi}</p>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-art-text/40 mb-1.5 block">Gunung</label>
                <input 
                  type="text" 
                  value={mountainName}
                  onChange={e => setMountainName(e.target.value)}
                  className="w-full border-2 border-art-text p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-art-orange bg-art-bg/20"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-art-text/40 mb-1.5 block">Tahun Pendakian</label>
                <select 
                  value={climbYear}
                  onChange={e => setClimbYear(e.target.value)}
                  className="w-full border-2 border-art-text p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-art-orange bg-art-bg/20 appearance-none cursor-pointer"
                >
                   {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                     <option key={year} value={year}>{year}</option>
                   ))}
                </select>
              </div>
           </div>

           <div>
             <label className="text-[9px] font-black uppercase tracking-widest text-art-text/40 mb-1.5 block">Rating Pengalaman</label>
             <div className="flex gap-2">
               {[1,2,3,4,5].map(s => (
                 <button key={s} onClick={() => setRating(s)} className={`p-1.5 transition-all transform hover:scale-110 ${rating >= s ? 'text-yellow-400' : 'text-gray-200'}`}>
                    <Star size={36} fill={rating >= s ? "currentColor" : "none"} strokeWidth={3} />
                 </button>
               ))}
             </div>
           </div>
           
           <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-art-text/40 mb-1.5 block">Cerita Petualangan</label>
              <textarea 
                rows={4}
                value={review}
                onChange={e => setReview(e.target.value)}
                placeholder="Bagaimana treknya? Bagaimana pelayanan kami? Ceritakan semuanya..."
                className="w-full border-2 border-art-text p-4 rounded-xl text-[11px] font-bold leading-relaxed outline-none focus:border-art-orange bg-art-bg/10 placeholder:text-art-text/20"
              />
           </div>

           <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-art-text/40 mb-1.5 block">Upload Foto Momen</label>
              <div className="flex items-center gap-4 p-3 bg-art-bg/20 rounded-2xl border-2 border-dashed border-art-text/10 hover:border-art-orange/30 transition-all group">
                <label className="cursor-pointer flex flex-col items-center justify-center w-28 h-28 border-2 border-art-text rounded-xl hover:bg-art-bg transition-all bg-white relative overflow-hidden shrink-0">
                  {photoUrl ? (
                    <>
                      <img src={photoUrl} className="w-full h-full object-cover" alt="Preview" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={24} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon size={32} className="text-art-text/10 mb-2" />
                      <span className="text-[8px] font-black uppercase text-art-text/30">Pilih Foto</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
                <div className="flex-1">
                   <p className="text-[10px] font-black text-art-text/60 leading-tight uppercase tracking-tighter mb-1">Upload Bukti Keseruan!</p>
                   <p className="text-[8px] font-medium text-art-text/40 leading-relaxed uppercase tracking-tighter">
                     Foto ini akan muncul di galeri testimoni.<br/>
                     <span className="font-black text-art-orange/50">Maksimal 2MB • JPG/PNG</span>
                   </p>
                </div>
              </div>
           </div>
        </div>

        <div className="p-6 bg-art-bg/30 border-t-2 border-art-text/5 mt-auto">
          <button 
            onClick={handleSubmit}
            disabled={loading || uploading}
            className="w-full flex items-center justify-center gap-3 bg-art-orange text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
          >
            {loading ? 'Mengirim Data...' : uploading ? 'Mengupload Foto...' : <><Send size={18} /> Bagikan Sekarang</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
