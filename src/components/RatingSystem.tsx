import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageCircle, Send, X, Check, User } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, setDoc, serverTimestamp, onSnapshot, orderBy } from 'firebase/firestore';
import { Button } from './Button';
import { useAuthState } from 'react-firebase-hooks/auth';
import { customAlert } from '../GlobalDialog';

interface RatingSystemProps {
  mountainName: string;
  onClose?: () => void;
  showOnlyRating?: boolean;
}

export const RatingSystem: React.FC<RatingSystemProps> = ({ mountainName, onClose, showOnlyRating = false }) => {
  const [user] = useAuthState(auth);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [hasUserRated, setHasUserRated] = useState(false);
  const [showTestimonials, setShowTestimonials] = useState(false);

  const mountainId = mountainName.toLowerCase().replace(/\s+/g, '-');

  useEffect(() => {
    // Fetch all reviews for this mountain
    const q = query(
      collection(db, 'mountainReviews'),
      where('mountainId', '==', mountainId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const revs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(revs);

      if (revs.length > 0) {
        const total = revs.reduce((acc, curr: any) => acc + curr.rating, 0);
        setAverageRating(total / revs.length);
      } else {
        setAverageRating(5.0); // Default to 5.0 for fresh mountains
      }

      if (user) {
        const userRated = revs.some((r: any) => r.userId === user.uid);
        setHasUserRated(userRated);
      }
    });

    return () => unsubscribe();
  }, [mountainId, user]);

  const handleSubmit = async () => {
    if (!user) {
      customAlert('Silakan login terlebih dahulu untuk memberikan rating.');
      return;
    }
    if (rating === 0) {
      customAlert('Pilih jumlah bintang terlebih dahulu.');
      return;
    }
    if (hasUserRated) {
      customAlert('Anda sudah memberikan rating untuk gunung ini.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'mountainReviews'), {
        mountainId,
        mountainName,
        userId: user.uid,
        userName: user.displayName || 'Anonim',
        userAvatar: user.photoURL || '',
        rating,
        review: reviewText,
        createdAt: serverTimestamp(),
        status: 'published'
      });
      setRating(0);
      setReviewText('');
      customAlert('Terima kasih atas penilaian Anda!');
    } catch (error) {
      console.error('Error adding review:', error);
      customAlert('Gagal mengirim penilaian.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showOnlyRating) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5 text-yellow-400">
          <Star size={12} fill="currentColor" />
        </div>
        <span className="text-[10px] font-black text-art-text">{averageRating.toFixed(1)}</span>
        <span className="text-[8px] font-bold text-art-text/40 uppercase tracking-tighter">({reviews.length} Review)</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] border-2 border-art-text overflow-hidden shadow-2xl flex flex-col max-h-[85vh] w-full max-w-md">
      <div className="p-6 border-b-2 border-art-text flex justify-between items-center bg-art-bg">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tight text-art-text">Rating & Testimoni</h3>
          <p className="text-[10px] font-black text-art-orange uppercase tracking-widest">{mountainName}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* Rating Summary */}
        <div className="text-center bg-white border-2 border-art-text/10 p-6 rounded-3xl shadow-sm">
          <div className="text-5xl font-black text-art-text mb-2 tracking-tighter">{averageRating.toFixed(1)}</div>
          <div className="flex justify-center gap-1 text-yellow-400 mb-2">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} size={24} fill={s <= Math.round(averageRating) ? "currentColor" : "none"} className={s <= Math.round(averageRating) ? "" : "text-gray-200"} />
            ))}
          </div>
          <p className="text-[10px] font-black text-art-text/40 uppercase tracking-widest">Berdasarkan {reviews.length} Penilaian</p>
        </div>

        {/* User Input Section */}
        {!hasUserRated ? (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm font-bold text-art-text mb-3">Berikan Penilaian Anda</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(s)}
                    className="transition-transform active:scale-90"
                  >
                    <Star 
                      size={32} 
                      fill={(hoverRating || rating) >= s ? "#facc15" : "none"} 
                      className={(hoverRating || rating) >= s ? "text-yellow-400" : "text-gray-200"} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <textarea
                placeholder="Tulis testimoni atau pengalaman Anda mendaki gunung ini..."
                className="w-full h-24 p-4 border-2 border-art-text/10 rounded-2xl text-xs font-medium focus:border-art-orange outline-none resize-none transition-all"
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
              />
              <button
                disabled={isSubmitting || !user}
                onClick={handleSubmit}
                className="absolute bottom-3 right-3 bg-art-text text-white p-2 rounded-xl hover:bg-art-orange transition-all disabled:bg-gray-200"
              >
                {isSubmitting ? <Check size={16} className="animate-pulse" /> : <Send size={16} />}
              </button>
            </div>
            {!user && (
              <p className="text-[10px] text-center text-red-500 font-bold uppercase tracking-widest animate-pulse">Login untuk memberikan rating</p>
            )}
          </div>
        ) : (
          <div className="bg-art-green/10 border-2 border-art-green/20 p-4 rounded-2xl text-center">
            <p className="text-[10px] font-black text-art-green uppercase tracking-widest">Terima kasih! Anda sudah menilai gunung ini.</p>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-art-text/50">Apa Kata Mereka?</h4>
            <span className="text-[10px] font-bold text-art-orange">{reviews.length} Terkirim</span>
          </div>
          
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-art-bg/50 border border-art-text/5 p-4 rounded-2xl flex gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-art-text/10 overflow-hidden shrink-0 flex items-center justify-center">
                   {r.userAvatar ? <img src={r.userAvatar} alt="" className="w-full h-full object-cover" /> : <User size={20} className="text-gray-300" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[11px] font-black uppercase text-art-text">{r.userName}</span>
                    <div className="flex gap-0.5 text-yellow-400">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={8} fill={s <= r.rating ? "currentColor" : "none"} className={s <= r.rating ? "" : "text-gray-300"} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] font-medium text-art-text/70 italic">"{r.review || 'Trip yang sangat luar biasa!'}"</p>
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="text-center py-10 opacity-30">
                <MessageCircle size={40} className="mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">Belum ada review</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
