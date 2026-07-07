
import { BookingsAdmin } from './admin/BookingsAdmin';
import { DestinationsAdmin } from './admin/DestinationsAdmin';
import { OpenTripsAdmin } from './admin/OpenTripsAdmin';
import { TeamPhotosAdmin, LeadersAdmin } from './admin/TeamAndLeadersAdmin';
import { GalleryAdmin, CeritaAdmin, HomepageAdmin, SplashAdmin, LogoAudioAdmin, CleanupPhotosAdmin, FacilitiesAdmin, PromoCodesAdmin, FooterAdmin, PatchNotesAdmin } from './admin/WebSettingsAdmin';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadFile } from './lib/storage-utils';
import { X, Trash2, Plus, GripVertical, Users, Calendar, MapPin, Coffee, Mountain, Info, AlertCircle, FileText, Download, CheckCircle, Send, Globe, Map, Edit2, ChevronDown, Clock, TrendingUp, CreditCard, User, Clipboard, ChevronRight, ShoppingBag, MessageCircle, Eye } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from './firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestore-error';
import { AppConfig, FacilityOption, DIFFICULTY_LEVELS, DURATION_LEVELS, OpenTrip, WEBSITE_VERSION } from './useAppConfig';
import { jsPDF } from 'jspdf';
import { generateRundownPdf } from './lib/pdf-utils';
import { useSound } from './hooks/useSound';

import { customConfirm, customAlert } from './GlobalDialog';

export const AdminPanelModal = ({ 
  isOpen, 
  onClose, 
  config, 
  updateConfig,
  revertToDefault,
  defaultLists,
  showToast
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  config: AppConfig,
  updateConfig: (c: Partial<AppConfig>) => void,
  revertToDefault: () => void,
  defaultLists: any,
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void
}) => {
  const { playClick, playBack } = useSound();
  const [activeCategory, setActiveCategory] = useState<'booking' | 'trip' | 'website'>('booking');
  const [activeTab, setActiveTab] = useState<string>('bookings');
  const [openTripPrefill, setOpenTripPrefill] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !user || !((user as any).email === 'mrachmanfm@gmail.com' || (user as any).email === 'mrahmanfm@gmail.com')) return;
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [isOpen, user]);

  const [showPatchNotes, setShowPatchNotes] = useState(false);

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const requestCount = bookings.filter(b => b.type === 'open_request' && b.status === 'pending').length;
  
  if (!isOpen || !config) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 text-left text-art-text overflow-x-hidden overflow-y-auto">
      <AnimatePresence>
        {showPatchNotes && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] border-2 border-art-text overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-art-text/10 flex justify-between items-center bg-art-bg/30">
                <h3 className="font-black uppercase tracking-tight text-art-text">Website Patch Notes</h3>
                <button onClick={() => setShowPatchNotes(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X size={20}/></button>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto space-y-8 custom-scrollbar">
                {(config.patchNotes || []).map((pn: any, idx: number) => (
                  <div key={idx} className="relative pl-6 border-l-2 border-art-orange/20">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-art-orange rounded-full border-4 border-white shadow-sm"></div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-black text-art-text">v{pn.version}</span>
                      <span className="text-[10px] font-bold text-art-text/40 bg-art-bg px-2 py-0.5 rounded-full">{pn.date}</span>
                    </div>
                    <ul className="space-y-2">
                      {(pn.notes || []).map((note: string, nIdx: number) => (
                        <li key={nIdx} className="text-[11px] font-bold text-art-text/60 flex items-start gap-2">
                          <CheckCircle size={12} className="text-art-green mt-0.5 shrink-0" />
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-art-text text-white text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Ngopi di Ketinggian • Built with Passion</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-art-section w-full h-[100dvh] sm:h-auto sm:max-w-5xl sm:min-h-[80vh] sm:max-h-[95vh] flex flex-col rounded-none sm:rounded-2xl border-0 sm:border-2 border-art-text relative shadow-2xl"
      >
        <div className="flex flex-col border-b border-art-text bg-white">
          <div className="flex justify-between items-center p-3 sm:p-6 pb-0 sm:pb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-art-text">Admin Dashboard</h2>
              <button 
                onClick={() => setShowPatchNotes(true)}
                className="text-[9px] sm:text-[10px] font-black text-art-orange bg-art-orange/10 px-2 py-0.5 rounded-full hover:bg-art-orange hover:text-white transition-all animate-pulse"
              >
                v{config.version || WEBSITE_VERSION}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  playClick();
                  customConfirm("Jadikan pengaturan saat ini sebagai default global? Tindakan ini tidak bisa dibatalkan.", async () => {
                    try {
                      const { writeBatch, doc } = await import('firebase/firestore');
                      const batch = writeBatch(db);
                      batch.set(doc(db, 'destinations', 'data'), { items: config.destinationsData });
                      batch.set(doc(db, 'leaders', 'data'), { items: config.tripLeaders });
                      batch.set(doc(db, 'gallery', 'data'), { items: config.galleryPhotos });
                      batch.set(doc(db, 'openTrips', 'data'), { items: config.openTrips });
                      
                      const websiteData = { ...config };
                      delete (websiteData as any).destinationsData;
                      delete (websiteData as any).tripLeaders;
                      delete (websiteData as any).galleryPhotos;
                      delete (websiteData as any).openTrips;
 
                      batch.set(doc(db, 'website', 'data'), websiteData);

                      // Save snapshot for "Reset Default" functionality
                      batch.set(doc(db, 'defaults', 'data'), {
                        destinations: config.destinationsData,
                        leaders: config.tripLeaders,
                        gallery: config.galleryPhotos,
                        openTrips: config.openTrips,
                        website: websiteData
                      });

                      await batch.commit();
                      showToast("Berhasil di-set sebagai default!", "success");
                    } catch (e) {
                      console.error(e);
                      showToast("Gagal menyimpan ke default", "error");
                    }
                  });
                }} 
                className="text-[10px] bg-art-green text-white px-3 py-1.5 font-bold uppercase rounded-md tracking-widest hover:bg-green-600 transition-colors shadow-sm"
              >
                Set Default
              </button>
              <button 
                onClick={() => {
                  playClick();
                  customConfirm("Kembalikan ke pengaturan awal tersimpan?", async () => {
                    await revertToDefault();
                    showToast("Direset ke default!", "success");
                  });
                }} 
                className="text-[10px] bg-red-100 text-red-600 px-3 py-1.5 font-bold uppercase rounded-md tracking-widest hover:bg-red-200 transition-colors shadow-sm"
              >
                Reset Default
              </button>
              <div className="w-[1px] h-6 bg-art-text/10 mx-1"></div>
              <button onClick={() => { playBack(); onClose(); }} className="p-2 hover:text-art-orange transition-colors"><X size={24} /></button>
            </div>
          </div>
          <div className="flex gap-1.5 sm:gap-2 px-3 sm:px-4 pb-0 pt-2 bg-art-bg/30 border-t border-art-text/10 overflow-x-auto no-scrollbar">
            <button onClick={() => { setActiveCategory('booking'); setActiveTab('bookings'); }} className={`shrink-0 text-[9px] sm:text-xs font-black uppercase py-2.5 px-4 sm:py-3 sm:px-6 rounded-t-xl transition-all ${activeCategory === 'booking' ? 'bg-art-text text-white shadow-[0_-4px_0_0_#1a1a1a_inset]' : 'bg-white text-art-text/40 hover:text-art-text border border-b-0 border-art-text/10'}`}>Booking Management</button>
            <button onClick={() => { setActiveCategory('trip'); setActiveTab('openTrips'); }} className={`shrink-0 text-[9px] sm:text-xs font-black uppercase py-2.5 px-4 sm:py-3 sm:px-6 rounded-t-xl transition-all ${activeCategory === 'trip' ? 'bg-art-text text-white shadow-[0_-4px_0_0_#1a1a1a_inset]' : 'bg-white text-art-text/40 hover:text-art-text border border-b-0 border-art-text/10'}`}>Trip Content</button>
            <button onClick={() => { setActiveCategory('website'); setActiveTab('cerita'); }} className={`shrink-0 text-[9px] sm:text-xs font-black uppercase py-2.5 px-4 sm:py-3 sm:px-6 rounded-t-xl transition-all ${activeCategory === 'website' ? 'bg-art-text text-white shadow-[0_-4px_0_0_#1a1a1a_inset]' : 'bg-white text-art-text/40 hover:text-art-text border border-b-0 border-art-text/10'}`}>Web Design</button>
          </div>
        </div>


        <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-y-auto sm:overflow-y-visible">

          {/* Sub Sidebar Tabs */}
          <div className="flex sm:flex-col gap-2 p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-art-text/10 bg-white overflow-x-auto sm:overflow-x-visible w-full sm:w-48 shrink-0 no-scrollbar">
            <div className="flex sm:flex-col gap-1.5 w-max sm:w-full">
              {activeCategory === 'booking' && (
                <>
                  <button onClick={() => setActiveTab('bookings')} className={`relative text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'bookings' ? 'bg-art-green text-white' : 'hover:bg-art-text/10'}`}>
                    Daftar Booking {pendingCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] px-1.5 rounded-full animate-pulse">{pendingCount}</span>}
                  </button>
                  <button onClick={() => setActiveTab('promoCodes')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'promoCodes' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Kode Promo</button>
                </>
              )}
              {activeCategory === 'trip' && (
                <>
                  <button onClick={() => setActiveTab('openTrips')} className={`relative text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'openTrips' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>
                    Open Trip & Req {requestCount > 0 && <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] px-1.5 rounded-full animate-pulse">{requestCount}</span>}
                  </button>
                  <button onClick={() => setActiveTab('destinations')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'destinations' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Destinasi & Durasi</button>
                </>
              )}
              {activeCategory === 'website' && (
                <>
                  <button onClick={() => setActiveTab('logoAudio')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'logoAudio' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Logo & Audio</button>
                  <button onClick={() => setActiveTab('homepage')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'homepage' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Branding & Homepage</button>
                  <button onClick={() => setActiveTab('splash')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'splash' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Awalan (Splash)</button>
                  <button onClick={() => setActiveTab('cerita')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'cerita' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Story</button>
                  <button onClick={() => setActiveTab('facilities')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'facilities' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Facilities</button>
                  <button onClick={() => setActiveTab('gallery')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'gallery' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Gallery</button>
                  <button onClick={() => setActiveTab('leaders')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'leaders' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Trip Leaders</button>
                  <button onClick={() => setActiveTab('footerAdmin')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'footerAdmin' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>About & Footer</button>
                  <button onClick={() => setActiveTab('patchNotes')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'patchNotes' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Patch Notes</button>
                  <button onClick={() => setActiveTab('cleanupPhotos')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'cleanupPhotos' ? 'bg-red-600 text-white' : 'hover:bg-red-50 text-red-600'}`}>Cleanup Foto</button>
                </>
              )}
            </div>

            {/* ADMIN ALERT SYSTEM */}
            <div className="hidden sm:flex flex-col gap-2 pt-6 mt-6 border-t border-art-text/5 items-center">
              <div className="w-10 h-10 bg-white rounded-xl border border-art-text/20 flex items-center justify-center p-2 relative">
                 <AlertCircle size={20} className="text-art-orange" />
                 {(pendingCount > 0 || requestCount > 0) && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />}
              </div>
              <p className="text-[7px] font-black uppercase tracking-widest text-art-text/30 text-center">Admin Alert<br/>System</p>
            </div>
          </div>

          
          {/* Content */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-art-bg/50">
            {activeTab === 'bookings' && <BookingsAdmin bookings={bookings} showToast={showToast} config={config} updateConfig={updateConfig} onNavigateToOpenTrip={(prefillData: any) => { setOpenTripPrefill(prefillData); setActiveCategory('trip'); setActiveTab('openTrips'); }} />}

            {activeTab === 'openTrips' && <OpenTripsAdmin config={config} updateConfig={updateConfig} showToast={showToast} prefillData={openTripPrefill} clearPrefill={() => setOpenTripPrefill(null)} />}
            {activeTab === 'destinations' && <DestinationsAdmin config={config} updateConfig={updateConfig} showToast={showToast} defaultList={defaultLists.destinations} />}
            {activeTab === 'leaders' && <LeadersAdmin config={config} updateConfig={updateConfig} showToast={showToast} defaultList={defaultLists.leaders} />}
            {activeTab === 'gallery' && <GalleryAdmin config={config} updateConfig={updateConfig} showToast={showToast} defaultList={defaultLists.gallery} />}
            {activeTab === 'facilities' && <FacilitiesAdmin config={config} updateConfig={updateConfig} showToast={showToast} defaultList={defaultLists.facilities} />}
            {activeTab === 'promoCodes' && <PromoCodesAdmin config={config} updateConfig={updateConfig} showToast={showToast} />}
            {activeTab === 'cerita' && <CeritaAdmin config={config} updateConfig={updateConfig} showToast={showToast} defaultVideo={defaultLists.cerita} />}
            {activeTab === 'logoAudio' && <LogoAudioAdmin config={config} updateConfig={updateConfig} showToast={showToast} />}
            {activeTab === 'homepage' && <HomepageAdmin config={config} updateConfig={updateConfig} showToast={showToast} />}
            {activeTab === 'splash' && <SplashAdmin config={config} updateConfig={updateConfig} showToast={showToast} />}
            {activeTab === 'footerAdmin' && <FooterAdmin config={config} updateConfig={updateConfig} showToast={showToast} />}
            {activeTab === 'patchNotes' && <PatchNotesAdmin config={config} updateConfig={updateConfig} showToast={showToast} />}
            {activeTab === 'cleanupPhotos' && <CleanupPhotosAdmin config={config} updateConfig={updateConfig} showToast={showToast} />}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

