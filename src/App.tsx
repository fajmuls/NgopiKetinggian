import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Coffee, Map, Calendar, Users, ChevronRight, Tent, Mountain, CheckCircle2, User, Camera, X, PlusCircle, LogIn, LogOut, MoreVertical, Search, Settings, Mic, TrendingUp, BellRing, MapPin, ChevronDown, ExternalLink, AlertCircle, ShoppingBag, Send, Globe, FileText, Download, Info, Clock, Receipt, CreditCard, Trash2, Eye, Menu, History, CheckCircle } from 'lucide-react';
import { useSound } from './hooks/useSound';
import React, { useState, useEffect, useMemo } from 'react';
import { auth, db, loginWithGoogle, logout } from './firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { handleFirestoreError, OperationType } from './lib/firestore-error';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { GlobalDialogProvider, customAlert, customConfirm } from './GlobalDialog';
import { DIFFICULTY_LEVELS, DURATION_LEVELS, OpenTrip, useAppConfig } from './useAppConfig';
import { AdminPanelModal } from './AdminPanel';
import { generateRundownPdf, generateInvoice } from './lib/pdf-utils';

import { Button } from './components/Button';
import { BookingModal } from './components/BookingModal';
import { RundownPreviewModal } from './components/RundownPreviewModal';
import { OpenTripCard } from './components/OpenTripCard';
import { DestinationCard } from './components/DestinationCard';
import { SettingsModal } from './components/SettingsModal';
import { BookingHistoryModal } from './components/BookingHistoryModal';
import { destinationsData, defaultTripLeaders } from './data';

// Import New Sections
import { Header } from './sections/Header';
import { Hero } from './sections/Hero';
import { TripSection } from './sections/Trips';
import { DestinationSection } from './sections/Destinations';
import { Footer } from './sections/Footer';


const defaultGalleryPhotos = [
  { src: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=2070&auto=format&fit=crop", desc: "Momen ngopi pagi" },
  { src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop", desc: "Suasana sunrise" },
  { src: "https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?q=80&w=2070&auto=format&fit=crop", desc: "Trekking bersama" },
  { src: "https://images.unsplash.com/photo-1498855926480-d98e83099315?q=80&w=2070&auto=format&fit=crop", desc: "Istirahat di camp" }
];

export default function App() {
  const [user] = useAuthState(auth);
  const [showSplash, setShowSplash] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState<any>(undefined);
  const [bookingType, setBookingType] = useState<'open' | 'private'>('open');
  const [filterDifficulty, setFilterDifficulty] = useState('Semua');
  const [filterRegion, setFilterRegion] = useState('Semua');
  const [openFilterRegion, setOpenFilterRegion] = useState('Semua');
  const [openFilterDifficulty, setOpenFilterDifficulty] = useState('Semua');
  const difficultyOptions = ["Semua", ...DIFFICULTY_LEVELS];
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'info' | 'error' } | null>(null);
  const getSisaKuota = (ot: any) => {
    const total = ot.maxKuota || ot.kuotaNum || 15;
    const consumed = ot.consumedKuota || 0;
    return Math.max(0, total - consumed);
  };

  const showToastMsg = (msg: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('appTheme') || 'default';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length > 0) {
      setShowSearchDropdown(true);
    } else {
      setShowSearchDropdown(false);
    }
  };

  const getSearchResults = () => {
     if (!searchQuery) return [];
     const q = searchQuery.toLowerCase();
     const results: any[] = [];
     if ('fasilitas'.includes(q) || 'premium'.includes(q) || 'trip'.includes(q)) {
        results.push({ type: 'section', id: 'trip', name: 'Fasilitas Trip' });
     }
     if ('gunung'.includes(q) || 'destinasi'.includes(q)) {
        results.push({ type: 'section', id: 'destinasi', name: 'Destinasi Gunung' });
     }
     
     // Search in destinations
     config.destinationsData.forEach((d: any) => {
        if (d.isActive !== false && (d.name.toLowerCase().includes(q) || (d.desc && d.desc.toLowerCase().includes(q)))) {
           results.push({ type: 'mountain', subType: 'private', id: d.id || d.name, name: d.name, image: d.image });
        }
     });

     // Search in open trips
     (config.openTrips || []).forEach((ot: any) => {
        if (ot.status === 'published' && ot.name.toLowerCase().includes(q)) {
           results.push({ type: 'mountain', subType: 'open', id: ot.id || ot.name, name: ot.name, image: ot.image });
        }
     });
     
     return results;
  };

  const executeSearch = (item: any) => {
    setShowSearchDropdown(false);
    if (item.type === 'section') {
       setSearchQuery('');
       scrollToSection({ preventDefault: () => {} } as any, item.id);
    } else {
       setSearchQuery('');
       setTimeout(() => {
           scrollToSection({ preventDefault: () => {} } as any, `dest-card-${item.id}`);
           window.dispatchEvent(new CustomEvent('highlight-dest', { detail: item.id }));
       }, 300);
    }
  };

  const handleOpenBooking = (dest: any = null, path: any = null, dur: any = null, type: 'open' | 'private' = 'private', jadwal: string = '') => {
    playClick();
    const prefill = dest ? { 
      destinasi: typeof dest === 'string' ? dest : dest.name,
      jalur: typeof path === 'string' ? path : path?.name || '',
      durasi: typeof dur === 'string' ? dur : dur?.label || '',
      type,
      jadwal
    } : undefined;
    
    setBookingPrefill(prefill);
    setBookingType(type);
    setIsBookingOpen(true);
    if (dest) showToastMsg(`Membuka Booking: ${typeof dest === 'string' ? dest : dest.name}`);
  };
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const { playHover, playClick, playPop } = useSound();
  const { scrollY } = useScroll();

  // Lock scroll when splash is active
  useEffect(() => {
    if (showSplash) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [showSplash]);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [userBookings, setUserBookings] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      setUserBookings([]);
      return;
    }
    const q = query(
      collection(db, 'bookings'), 
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserBookings(data);
    }, (error) => {
      console.error("App bookings fetch error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const { config, updateConfig, revertToDefault, loading } = useAppConfig(destinationsData, defaultTripLeaders, defaultGalleryPhotos);
  
  // Sync sound volume to localStorage for useSound hook
  useEffect(() => {
    if (config?.homepage?.soundVolume !== undefined) {
      localStorage.setItem('appVolume', config.homepage.soundVolume.toString());
      window.dispatchEvent(new Event('volumeChange'));
    }
  }, [config?.homepage?.soundVolume]);

  const currentDestinations = config.destinationsData;
  const currentTripLeaders = config.tripLeaders;
  const galleryPhotos = (config.galleryPhotos || []).filter((p: any) => !p.isHidden);

  const filteredOpenTrips = (config.openTrips || []).filter((ot: any) => {
    const matchesRegion = openFilterRegion === 'Semua' || ot.region === openFilterRegion;
    const matchesDifficulty = openFilterDifficulty === 'Semua' || 
                             ot.difficulty === openFilterDifficulty;
    const matchesSearch = ot.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRegion && matchesDifficulty && matchesSearch;
  });

  useEffect(() => {
    const onAdminToggle = () => setIsAdminPanelOpen(true);
    window.addEventListener('adminModeToggled', onAdminToggle);
    return () => window.removeEventListener('adminModeToggled', onAdminToggle);
  }, []);

const heroSlidesConfig = config.homepage?.heroSlides && config.homepage.heroSlides.length > 0 
    ? config.homepage.heroSlides 
    : [
        { name: "Gunung Gede Pangrango", height: "2.958", image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2671&auto=format&fit=crop" },
        { name: "Gunung Salak", height: "2.211", image: "https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?q=80&w=2070&auto=format&fit=crop" }
      ];

  // Hero slideshow auto-play
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % heroSlidesConfig.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroSlidesConfig.length]);

  const filteredDestinations = currentDestinations.filter(dest => {
    if (dest.isActive === false) return false;
    const matchesDifficulty = filterDifficulty === 'Semua' || 
                             dest.difficulty === filterDifficulty;
    const matchesRegion = filterRegion === 'Semua' || dest.region === filterRegion;
    const matchesSearch = !searchQuery || 
                          dest.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (dest.desc && dest.desc.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDifficulty && matchesRegion && matchesSearch;
  });

  const scrollToSection = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement> | { preventDefault: () => void }, id: string) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsMobileMenuOpen(false);
    
    // Allow a small delay for menu to close and state to settle
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        // Use scrollIntoView as primary
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  useEffect(() => {
    const handleContinueReg = (e: any) => {
      const b = e.detail;
      handleOpenBooking(b.destinasi, b.jalur, b.durasi, b.type, b.jadwal);
      setIsHistoryOpen(false);
    };
    window.addEventListener('continueRegistration', handleContinueReg);
    return () => window.removeEventListener('continueRegistration', handleContinueReg);
  }, []);

  return (
    <>
      <GlobalDialogProvider />
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: '-100%' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[200] bg-art-bg flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="w-48 h-48 rounded-full overflow-hidden border-4 border-art-text mb-8 mx-auto shadow-2xl relative bg-white flex items-center justify-center"
            >
              {loading ? (
                <Coffee size={48} className="animate-pulse text-art-orange" />
              ) : (
                <img src={config?.homepage?.logo || "https://files.catbox.moe/lubzno.png"} alt="Logo Ngopi Ketinggian" className="w-full h-full object-cover" />
              )}
            </motion.div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-4xl md:text-5xl font-black uppercase tracking-tight text-art-text mb-4"
            >
              Ngopi Ketinggian
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="text-art-text/80 font-medium max-w-md mx-auto mb-12 text-lg"
            >
              Open trip eksklusif yang menyediakan pengalaman mendaki dengan fasilitas lengkap dan secangkir kopi terbaik di atas awan.
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="flex flex-col gap-3 w-full max-w-sm mx-auto"
            >
              <Button 
                variant="primary" 
                className="w-full py-4 text-sm tracking-widest uppercase font-bold group" 
                onClick={() => { playClick(); setShowSplash(false); }}
                disabled={loading}
              >
                {loading ? "Memuat Data..." : "Mulai Melihat Tour"} {!loading && <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" className="w-full text-[10px] tracking-widest uppercase font-bold" onClick={() => window.open('https://www.instagram.com/ngopi.dketinggian?igsh=Y3JtN3Y2eXIya29y', '_blank')}>
                  Kunjungi IG
                </Button>
                <Button variant="secondary" className="w-full text-[10px] tracking-widest uppercase font-bold" onClick={() => window.open('https://tiktok.com/@ngopidiketinggian', '_blank')}>
                  Kunjungi TikTok
                </Button>
              </div>
              {!user ? (
                <div className="mt-2 text-center">
                   <p className="text-[10px] text-art-text/60 italic mb-2 uppercase tracking-widest font-bold">*Opsional: Login untuk kemudahan akses</p>
                   <Button variant="glass" className="w-full border-art-text border bg-white flex items-center justify-center gap-2 text-[10px] tracking-widest uppercase font-bold" onClick={() => loginWithGoogle()}>
                     <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg> Login via Google
                   </Button>
                </div>
              ) : (
                <div className="mt-2 text-center">
                   <p className="text-[10px] text-art-green italic mb-2 uppercase tracking-widest font-bold">Halo, {user.displayName}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
        destinationOptions={currentDestinations.filter(d => d.isActive !== false)} 
        prefill={bookingPrefill} 
        facilities={config.facilities}
        config={config}
        updateConfig={updateConfig}
        setIsHistoryOpen={setIsHistoryOpen}
        userBookings={userBookings}
      />
      <BookingHistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        showToast={showToastMsg}
        bookings={userBookings}
      />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} theme={theme} setTheme={setTheme} setIsHistoryOpen={setIsHistoryOpen} />
      <AdminPanelModal isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} config={config} updateConfig={updateConfig} revertToDefault={revertToDefault} showToast={showToastMsg} defaultLists={{ destinations: destinationsData, leaders: defaultTripLeaders, gallery: defaultGalleryPhotos, cerita: "https://videos.pexels.com/video-files/856172/856172-hd_1920_1080_30fps.mp4" }} />
      <div className="min-h-screen selection:bg-art-orange selection:text-white overflow-x-hidden">
      
      {/* Navigation */}
      <Header 
        config={config}
        user={user}
        onLogin={loginWithGoogle}
        onLogout={logout}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenBooking={() => handleOpenBooking()}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchResults={getSearchResults()}
        onExecuteSearch={executeSearch}
        showSearchDropdown={showSearchDropdown}
        setShowSearchDropdown={setShowSearchDropdown}
      />

      {/* Hero Section */}
      <Hero 
        config={config}
        onExplore={() => {
          const el = document.getElementById('destinasi');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }} 
        onBooking={() => handleOpenBooking()}
      />

      {/* The Concept Section */}
      <section id="cerita" className="pt-36 pb-20 md:py-32 bg-art-section relative border-y border-art-text overflow-hidden">
        {/* Scroll Indicator Moved Here */}
        <motion.div 
          animate={{ y: [0, 12, 0] }} 
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute top-8 md:top-12 left-1/2 -translate-x-1/2 text-art-text/40 flex flex-col items-center gap-2 md:gap-3 z-[60]"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.6em] text-art-orange drop-shadow-sm whitespace-nowrap">Discover More</span>
          <div className="w-[3px] h-8 md:h-16 bg-gradient-to-b from-art-orange via-art-orange/50 to-transparent rounded-full shadow-[0_0_20px_rgba(255,107,0,0.4)]" />
        </motion.div>
        <div className="absolute inset-0 z-0 pointer-events-none mix-blend-overlay">
          <img src="https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=2076&auto=format&fit=crop" className="w-full h-full object-cover opacity-[0.25] grayscale" alt="Mountain bg" />
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-art-text mb-6 md:mb-8 leading-tight">{config.homepage?.ceritaTitle || "Secangkir Cerita"} <br/><span className="text-art-green font-serif italic normal-case font-normal text-3xl md:text-5xl">{config.homepage?.ceritaSub || "di Atas Awan"}</span></h2>
              <div className="w-12 h-1 bg-art-orange mb-8"></div>
              <p className="text-sm md:text-base font-medium text-art-text/80 mb-6 leading-relaxed">
                {config.homepage?.ceritaParagraph1 || "Selama lebih dari 10 tahun..."}
              </p>
              
              {/* Dynamic Stats Row */}
              <div className="mt-12 grid grid-cols-3 gap-6 pt-10 border-t-2 border-art-text/10 bg-white/50 backdrop-blur-sm rounded-3xl p-6 shadow-sm mb-10">
                <div className="text-center group hover:scale-105 transition-transform">
                  <p className="text-2xl md:text-4xl font-black text-art-text tracking-tighter mb-1">{config.homepage?.statHikers || '100+'}</p>
                  <p className="text-[8px] md:text-[10px] font-black uppercase text-art-text/40 tracking-[0.2em]">Happy Hikers</p>
                </div>
                <div className="text-center border-x-2 border-art-text/10 group hover:scale-105 transition-transform">
                  <p className="text-2xl md:text-4xl font-black text-art-text tracking-tighter mb-1">{config.homepage?.statSatisfaction || '99%'}</p>
                  <p className="text-[8px] md:text-[10px] font-black uppercase text-art-text/40 tracking-[0.2em]">Satisfaction</p>
                </div>
                <div className="text-center group hover:scale-105 transition-transform">
                  <p className="text-2xl md:text-4xl font-black text-art-text tracking-tighter mb-1">{config.homepage?.statTrips || '50+'}</p>
                  <p className="text-[8px] md:text-[10px] font-black uppercase text-art-text/40 tracking-[0.2em]">Destinations</p>
                </div>
              </div>

              <div className="space-y-6 border-l-2 border-art-text/10 pl-6">
                {(config.homepage?.ceritaFeatures || []).map((item: any, i: number) => (
                  <div key={i} className="flex gap-4 items-start" onMouseEnter={playHover}>
                    <div>
                      <h4 className="font-bold text-art-text uppercase text-sm tracking-widest">{item.title}</h4>
                      <p className="text-sm font-medium text-art-text/60 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-art-orange rounded-3xl transform rotate-3 scale-105 z-0" />
              {config.ceritaVideoUrl.includes('youtube.com') || config.ceritaVideoUrl.includes('youtu.be') ? (
                <iframe 
                  src={config.ceritaVideoUrl}
                  style={config.ceritaVideoRatio && config.ceritaVideoRatio !== 'auto' ? { aspectRatio: config.ceritaVideoRatio } : {}}
                  className={`relative z-10 rounded-3xl shadow-2xl w-full ${!config.ceritaVideoRatio || config.ceritaVideoRatio === 'auto' ? 'aspect-video' : ''} grayscale-[10%] border-8 border-white`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video 
                  autoPlay loop muted playsInline controls
                  style={config.ceritaVideoRatio && config.ceritaVideoRatio !== 'auto' ? { aspectRatio: config.ceritaVideoRatio } : {}}
                  src={config.ceritaVideoUrl} 
                  className="relative z-10 rounded-3xl shadow-2xl w-full h-auto max-h-[75vh] grayscale-[10%] border-8 border-white shadow-[12px_12px_0px_0px_rgba(26,26,26,1)]"
                />
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trip Leader Section */}
      <section id="leader" className="py-20 md:py-24 bg-white border-y border-art-text relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none mix-blend-multiply">
          <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover opacity-[0.25] grayscale" alt="Mountain bg" />
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-art-text mb-4 leading-tight">{config.homepage?.leaderTitle || "Kenalan dengan"} <br/><span className="text-art-green font-serif italic normal-case font-normal text-3xl md:text-5xl">{config.homepage?.leaderSub || "Trip Leader Kami"}</span></h2>
            <div className="w-12 h-1 bg-art-orange mx-auto mb-8"></div>
            <p className="text-sm md:text-base font-medium text-art-text/80 mb-6 leading-relaxed">
              {config.homepage?.leaderParagraph || "Tim profesional kami yang siap memandu perjalanan Anda agar lebih aman, menyenangkan, dan tentunya memastikan seduhan kopi Anda sempurna."}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {currentTripLeaders.map((leader, i) => (
              <div key={i} className="border border-art-text/10 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow bg-art-bg flex flex-col items-center p-6 text-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md mb-4 relative">
                   <img src={leader.avatar || undefined} alt={leader.name} className="w-full h-full object-cover grayscale-[20%]" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-widest text-art-text">{leader.name}</h3>
                <p className="text-[10px] uppercase tracking-widest font-bold text-art-orange mt-2 mb-4">{leader.age}</p>
                <p className="text-xs text-art-text/70 mb-4 h-12 flex items-center justify-center">{leader.description}</p>
                {leader.voiceLine ? (
                  <audio controls className="w-full h-8 mt-auto rounded-full" src={leader.voiceLine}></audio>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-art-orange/20 text-art-orange flex items-center justify-center mt-auto">
                    <Mic size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tim Lapangan Gallery */}
          <div className="mt-20">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-black uppercase tracking-tight text-art-text">Tim Lapangan Kami</h3>
              <p className="text-art-text/60 font-medium mt-2">Momen kebersamaan dan dedikasi tim di alam bebas</p>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-8 snap-x scrollbar-hide px-4">
              {(config.teamPhotos || []).filter((url: string) => url && url.trim() !== '').map((url: string, idx: number) => (
                <img 
                  key={idx}
                  src={url} 
                  alt={`Tim Lapangan ${idx + 1}`} 
                  className="w-80 h-64 object-cover rounded-2xl snap-center flex-shrink-0 grayscale-[20%] border-2 border-art-text hover:grayscale-0 hover:shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] transition-all" 
                />
              ))}
              {(!config.teamPhotos || config.teamPhotos.filter((url: string) => url && url.trim() !== '').length === 0) && (
                <p className="text-xs font-bold text-art-text/40 italic mx-auto">Upload foto tim di dashboard admin.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Fasilitas / Include Paket Section */}
      <section id="trip" className="py-24 bg-art-green text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none mix-blend-overlay">
          <img src="https://images.unsplash.com/photo-1542385151-efd9000785a0?q=80&w=2074&auto=format&fit=crop" className="w-full h-full object-cover opacity-40 shrink-0" alt="Mountain bg" />
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16 md:mb-20">
            <motion.div 
               initial={{ opacity: 0, scale: 0.8 }}
               whileInView={{ opacity: 1, scale: 1 }}
               className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 mb-6 rotate-3 shadow-2xl"
            >
               <Mountain className="text-white" size={32} />
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-4 drop-shadow-2xl">Fasilitas Trip</h2>
            <div className="w-24 h-2 bg-art-orange rounded-full mb-8 shadow-[0_0_20px_#ff6b00]"></div>
            <p className="font-bold text-white/90 leading-relaxed uppercase tracking-widest text-[10px] md:text-sm">
              Kami memberikan pelayanan terbaik untuk setiap seduhan kopi di puncak tertinggi.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-6 md:gap-10">
            {/* INCLUDE BOX */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="bg-art-bg p-1 rounded-3xl border-2 border-art-text shadow-[16px_16px_0px_0px_#1a1a1a] overflow-hidden group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[20px_20px_0px_0px_#1a1a1a] transition-all"
            >
              <div className="bg-white rounded-[1.25rem] p-8 h-full text-art-text border-2 border-art-text/10">
                <div className="flex justify-between items-start mb-8">
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-art-text flex items-center gap-3">
                    <div className="w-10 h-10 bg-art-orange rounded-xl flex items-center justify-center shadow-lg"><CheckCircle2 size={20} className="text-white" /></div>
                    Include
                  </h3>
                  <div className="px-3 py-1 bg-art-orange/20 rounded-full border border-art-orange/30 text-[8px] font-black uppercase tracking-widest text-art-orange">Gratis</div>
                </div>
                <ul className="space-y-4">
                  {(config.facilities?.include || []).map((item: any, i: number) => {
                    const isHidden = typeof item === 'object' ? item.isHidden : false;
                    const name = typeof item === 'object' ? item.name : item;
                    if (isHidden) return null;
                    return (
                    <li key={i} className="flex items-start gap-4 group/li">
                      <div className="w-4 h-4 mt-0.5 rounded-full bg-art-orange flex items-center justify-center flex-shrink-0 group-hover/li:scale-125 transition-transform"><CheckCircle size={10} className="text-white" /></div>
                      <span className="text-xs md:text-sm font-bold uppercase tracking-wide text-art-text/90">{name}</span>
                    </li>
                  )})}
                </ul>
              </div>
            </motion.div>
            
            {/* EXCLUDE BOX */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-art-bg p-1 rounded-3xl border-2 border-art-text shadow-[16px_16px_0px_0px_#1a1a1a] overflow-hidden group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[20px_20px_0px_0px_#1a1a1a] transition-all"
            >
              <div className="bg-white rounded-[1.25rem] p-8 h-full text-art-text">
                <div className="flex justify-between items-start mb-8">
                  <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shadow-lg"><X size={20} className="text-red-500" /></div>
                    Exclude
                  </h3>
                  <div className="px-3 py-1 bg-red-100/50 rounded-full border border-red-200 text-[8px] font-black uppercase tracking-widest text-red-500">Pribadi</div>
                </div>
                <ul className="space-y-4">
                  {(config.facilities?.exclude || []).map((item: any, i: number) => {
                    const isHidden = typeof item === 'object' ? item.isHidden : false;
                    const name = typeof item === 'object' ? item.name : item;
                    if (isHidden) return null;
                    return (
                    <li key={i} className="flex items-start gap-4 group/li">
                      <div className="w-4 h-4 mt-0.5 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 group-hover/li:scale-125 transition-transform"><X size={10} className="text-red-500" /></div>
                      <span className="text-xs md:text-sm font-bold uppercase tracking-wide text-art-text/80">{name}</span>
                    </li>
                  )})}
                </ul>
              </div>
            </motion.div>

            {/* OPTIONAL BOX */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-art-bg p-1 rounded-3xl border-2 border-art-text shadow-[16px_16px_0px_0px_#1a1a1a] overflow-hidden group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[20px_20px_0px_0px_#1a1a1a] transition-all"
            >
               <div className="bg-art-bg/20 rounded-[1.25rem] p-8 h-full text-art-text">
                 <div className="flex justify-between items-start mb-8">
                    <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shadow-lg"><PlusCircle size={20} className="text-indigo-500" /></div>
                      Optional
                    </h3>
                    <div className="px-3 py-1 bg-indigo-100/50 rounded-full border border-indigo-200 text-[8px] font-black uppercase tracking-widest text-indigo-500">Add-On</div>
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-art-text/80 mb-6 leading-relaxed italic border-b border-art-text/10 pb-4">
                    Upgrade kenyamanan Anda dengan layanan tambahan premium.
                 </p>
                 <ul className="space-y-4">
                  {(config.facilities?.opsi || []).map((opt: any, i: number) => {
                    if (opt.isHidden) return null;
                    return (
                    <li key={i} className="flex flex-col gap-2 items-start bg-art-bg/30 p-4 rounded-xl border border-art-text/5 hover:border-art-orange hover:bg-art-orange/5 transition-colors">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <PlusCircle size={14} className="text-art-orange" />
                          <span className="text-[11px] md:text-xs font-black uppercase tracking-widest text-art-text">{opt.name}</span>
                        </div>
                        {opt.priceInfo && <span className="text-[10px] font-black text-white bg-art-orange px-2 py-0.5 rounded-lg">{opt.priceInfo.toString().toLowerCase().includes('rp') ? opt.priceInfo : `Rp ${opt.priceInfo}`}</span>}
                      </div>
                      {opt.subItems && opt.subItems.length > 0 && (
                        <div className="ml-6 flex flex-wrap gap-2">
                          {opt.subItems.map((sub: any, subIdx: number) => (
                             <span key={subIdx} className="text-[9px] font-bold text-art-text/60 bg-white px-2 py-1 rounded-md border border-art-text/10 shadow-sm">
                               {sub.name} {sub.priceInfo ? `- ${sub.priceInfo.toString().toLowerCase().includes('rp') ? sub.priceInfo : `Rp ${sub.priceInfo}`}` : ''}
                             </span>
                          ))}
                        </div>
                      )}
                    </li>
                  )})}
                 </ul>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Destination Section - Separated Open & Private */}
      <section id="destinasi" className="py-20 md:py-32 bg-[#F3F4F6] relative overflow-hidden">
        {/* Background image same as hero section */}
        <div className="absolute inset-0 z-0 pointer-events-none mix-blend-multiply flex">
          {config.homepage?.heroPhotoUrl ? (
             <img src={config.homepage.heroPhotoUrl} className="w-full h-full object-cover opacity-[0.25] grayscale-[80%]" alt="Destinasi bg" />
          ) : (
             <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover opacity-[0.25] grayscale-[80%]" alt="Destinasi bg" />
          )}
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          
          {/* OPEN TRIP SECTION */}
          <TripSection 
            openTrips={filteredOpenTrips}
            onJoin={(ot: any) => handleOpenBooking(ot.name, ot.path, ot.duration, 'open', ot.jadwal)}
            getSisaKuota={getSisaKuota}
            visibilities={config.visibilities}
            tripLeaders={config.tripLeaders}
            config={config}
          />

          {/* PRIVATE TRIP SECTION */}
          <DestinationSection 
            destinations={filteredDestinations}
            onBook={(dest: any, path: any, dur: any) => handleOpenBooking(dest, path, dur, 'private')}
            visibilities={config.visibilities}
            filterDifficulty={filterDifficulty}
            setFilterDifficulty={setFilterDifficulty}
            filterRegion={filterRegion}
            setFilterRegion={setFilterRegion}
            difficultyOptions={difficultyOptions}
          />
        </div>
      </section>

      {/* Gallery Section */}
      <section id="galeri" className="py-20 md:py-24 bg-art-text text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none mix-blend-overlay">
          <img src="https://images.unsplash.com/photo-1543884487-7359df37db0d?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover opacity-[0.15]" alt="Mountain bg" />
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-6">Galeri Pendakian</h2>
            <div className="w-12 h-1 bg-art-orange mx-auto mb-6"></div>
            <p className="font-medium text-white/60">Beberapa momen seru dari para peserta open trip kami bersama tim.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {galleryPhotos.map((photo, index) => (
              <img 
                key={index}
                src={photo.src} 
                alt={photo.desc} 
                onClick={() => { setGalleryIndex(index); setGalleryOpen(true); }}
                className={`w-full aspect-square object-cover rounded-2xl grayscale-[20%] hover:grayscale-0 transition-all border-4 border-transparent hover:border-art-orange cursor-pointer ${index % 2 !== 0 ? 'md:mt-8' : ''}`} 
              />
            ))}
          </div>

          <Lightbox
            open={galleryOpen}
            close={() => setGalleryOpen(false)}
            index={galleryIndex}
            slides={galleryPhotos.map((p: any) => ({ src: p.src, alt: p.desc }))}
          />
        </div>
      </section>

      {/* Promo Banner */}
      <section className="bg-art-bg flex flex-col items-center justify-center border-t border-art-text">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-12 py-12 flex items-center justify-center relative">
          <div className="absolute top-0 right-12 w-24 h-24 bg-art-orange rounded-full mix-blend-multiply blur-xl opacity-50 pointer-events-none"></div>
          <div className="absolute bottom-0 left-12 w-32 h-32 bg-art-green rounded-full mix-blend-multiply blur-xl opacity-50 pointer-events-none"></div>
          <a href={config.homepage?.promoBannerLink || "#destinasi"} onClick={(e) => scrollToSection(e, config.homepage?.promoBannerLink?.replace('#', '') || 'destinasi')} className="w-full block hover:scale-[1.02] transition-transform duration-500 z-10 flex justify-center">
            <img src={config.homepage?.promoBannerImg || "https://files.catbox.moe/lbf6xr.png"} alt="Promo Promo Trip Ngopi" className="w-full max-w-4xl h-auto object-contain rounded-3xl shadow-2xl border-[6px] md:border-[10px] border-white" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <Footer config={config} />

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] bg-art-text text-white px-8 py-4 rounded-2xl border-4 border-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 min-w-[300px]"
          >
             <div className="w-8 h-8 rounded-full bg-art-orange flex items-center justify-center text-white shrink-0"><BellRing size={16} /></div>
             <p className="text-sm font-black uppercase tracking-widest leading-none">{toast.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}
