import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Coffee, Mountain, Users, MessageCircle, AlertCircle, ShoppingBag, Eye, Download, FileText, Globe, CheckCircle, Smartphone, LogOut, Clock, TrendingUp, CreditCard, CheckCircle2, Trash2, Tent, Info, Send, User, ChevronRight, BellRing, ChevronDown, ExternalLink } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth, loginWithGoogle, logout } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { generateRundownPdf, generateInvoice } from '../lib/pdf-utils';
import { customConfirm, customAlert } from '../GlobalDialog';
import { useSound } from '../hooks/useSound';
import { Button } from './Button';


export const SettingsModal = ({ isOpen, onClose, theme, setTheme, setIsHistoryOpen }: { isOpen: boolean, onClose: () => void, theme: string, setTheme: (t: string) => void, setIsHistoryOpen: (v: boolean) => void }) => {
  const { playClick, playHover, playBack, playPop } = useSound();
  const [user] = useAuthState(auth);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [localVolume, setLocalVolume] = useState(() => {
    const saved = localStorage.getItem('appVolume');
    return saved ? parseFloat(saved) : 1.0;
  });

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setLocalVolume(newVol);
    localStorage.setItem('appVolume', newVol.toString());
    window.dispatchEvent(new Event('volumeChange'));
  };

  const themes = [
    { id: 'default', name: 'Rush (Default)', color: '#421404' },
    { id: 'matcha', name: 'Matcha (Hijau)', color: '#afa231' },
    { id: 'wine', name: 'Wine (Merah)', color: '#4c0004' },
    { id: 'wasabi', name: 'Wasabi (Kuning)', color: '#dcd189' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left text-art-text">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-art-section w-full max-w-sm rounded-2xl p-6 md:p-8 border-2 border-art-text relative shadow-2xl">
        <button onClick={(e) => { playClick(); onClose(); e.preventDefault(); }} className="absolute top-4 right-4 text-art-text hover:text-art-orange transition-colors" type="button">
          <X size={24} />
        </button>
        <h3 className="text-xl font-black uppercase tracking-tight text-art-text mb-6">Pengaturan</h3>
        
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-widest text-art-text/80 mb-3">Volume Suara Tombol</label>
          <div className="flex items-center gap-4 border-b border-art-text/10 pb-6 mb-6">
            <span className="text-xs font-bold w-12">{Math.round(localVolume * 100)}%</span>
            <input 
              type="range" 
              min="0" max="3" step="0.1" 
              value={localVolume} 
              onChange={handleVolumeChange}
              className="flex-1 accent-art-orange"
            />
          </div>

          <label className="block text-xs font-bold uppercase tracking-widest text-art-text/80 mb-3">Tema Tampilan</label>
          <div className="grid grid-cols-2 gap-2 border-b border-art-text/10 pb-6 mb-6">
            {themes.map(t => (
              <button 
                key={t.id} 
                onClick={() => { playClick(); setTheme(t.id); }} 
                onMouseEnter={playHover}
                className={`flex flex-col gap-1 items-start p-2 rounded border-2 transition-all ${theme === t.id ? 'border-art-orange bg-white/50 shadow-sm' : 'border-art-text/10 hover:border-art-text/30'}`}
              >
                <div className="w-full h-6 rounded flex" style={{ backgroundColor: t.color }}></div>
                <span className="text-[10px] font-bold uppercase w-full text-center leading-tight mt-1">{t.name}</span>
              </button>
            ))}
          </div>

          <label className="block text-xs font-bold uppercase tracking-widest text-art-text/80 mb-3">Akun</label>
          <div className="flex flex-col gap-3">
            {!user ? (
              <button onClick={() => { playClick(); loginWithGoogle(); }} className="flex items-center justify-center gap-2 border-2 border-art-text py-3 px-4 rounded-lg hover:bg-art-text hover:text-white transition-colors" onMouseEnter={playHover}>
                <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg>
                <span className="text-xs uppercase font-bold tracking-widest">Login via Google</span>
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border border-art-text/30 p-3 rounded-lg bg-white/50">
                   <div className="flex items-center gap-3">
                     <img src={user.photoURL || ''} alt="Avatar" className="w-8 h-8 rounded-full border border-art-text" />
                     <span className="text-xs font-bold text-art-text">{user.displayName}</span>
                   </div>
                   <button onClick={() => { playClick(); logout(); }} className="text-[10px] bg-red-100 hover:bg-red-200 text-red-600 font-bold uppercase tracking-widest px-3 py-1.5 rounded-md transition-colors" title="Logout" onMouseEnter={playHover}>Logout</button>
                </div>
              </div>
            )}
            
            {showTokenInput ? (
              <div className="flex gap-2 w-full mt-2">
                <input 
                  type="password"
                  id="adminTokenInput"
                  placeholder="Masukkan Token Admin"
                  className="w-full border border-art-text/30 px-3 py-2 rounded-lg text-xs outline-none focus:border-art-orange"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (e.currentTarget.value === 'Fajmuls22' || user?.email === 'mrachmanfm@gmail.com' || user?.email === 'mrahmanfm@gmail.com') {
                        localStorage.setItem('isAdminValid', 'true');
                        window.dispatchEvent(new Event('adminModeToggled'));
                        onClose();
                      } else {
                        customAlert('Token salah!');
                      }
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    playClick();
                    const inputElement = document.getElementById('adminTokenInput') as HTMLInputElement;
                    if (inputElement) {
                      if (inputElement.value === 'Fajmuls22' || user?.email === 'mrachmanfm@gmail.com' || user?.email === 'mrahmanfm@gmail.com') {
                        localStorage.setItem('isAdminValid', 'true');
                        window.dispatchEvent(new Event('adminModeToggled'));
                        onClose();
                      } else {
                        customAlert('Token salah!');
                      }
                    }
                  }}
                  className="bg-art-text text-white px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap"
                >
                  Go
                </button>
              </div>
            ) : (
              <button 
                onClick={(e) => { 
                  playClick(); 
                  if (user?.email === 'mrachmanfm@gmail.com' || user?.email === 'mrahmanfm@gmail.com') {
                    localStorage.setItem('isAdminValid', 'true');
                    window.dispatchEvent(new Event('adminModeToggled'));
                    onClose();
                  } else {
                    setShowTokenInput(true);
                  }
                }} 
                className="flex items-center justify-center gap-2 border border-art-text/30 py-2 px-4 rounded-lg hover:bg-art-text/10 transition-colors mt-2 text-art-text/50 w-full"
                onMouseEnter={playHover}
              >
                <span className="font-bold text-[10px] uppercase tracking-widest">Mode Admin</span>
              </button>
            )}
          </div>
        </div>
        
        <Button onClick={() => { playClick(); onClose(); }} variant="primary" className="w-full text-[10px] uppercase font-bold tracking-widest py-3 rounded-lg mt-8">
          Tutup
        </Button>
      </motion.div>
    </div>
  );
};
