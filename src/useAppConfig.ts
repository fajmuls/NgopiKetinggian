import { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export interface AppConfig {
  destinationsData: any[];
  tripLeaders: any[];
  galleryPhotos: any[];
  ceritaVideoUrl: string;
}

export function useAppConfig(defaultDestinations: any[], defaultLeaders: any[], defaultPhotos: any[]) {
  const [config, setConfig] = useState<AppConfig>({
    destinationsData: defaultDestinations,
    tripLeaders: defaultLeaders,
    galleryPhotos: defaultPhotos,
    ceritaVideoUrl: "https://videos.pexels.com/video-files/856172/856172-hd_1920_1080_30fps.mp4"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'appConfig', 'main');
    
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setConfig(snap.data() as AppConfig);
      } else {
        // Create default if not exists
        const defaultConfig = {
          destinationsData: defaultDestinations,
          tripLeaders: defaultLeaders,
          galleryPhotos: defaultPhotos,
          ceritaVideoUrl: "https://videos.pexels.com/video-files/856172/856172-hd_1920_1080_30fps.mp4"
        };
        setDoc(docRef, defaultConfig).catch((err) => {
           console.warn("Could not save default config to Firestore (possibly due to security rules). Using local state.", err);
        });
        setConfig(defaultConfig);
      }
      setLoading(false);
    }, (err) => {
      console.warn("Firestore access restricted via rules or not setup yet. Using default configuration.", err);
      // Fallback
      setConfig({
        destinationsData: defaultDestinations,
        tripLeaders: defaultLeaders,
        galleryPhotos: defaultPhotos,
        ceritaVideoUrl: "https://videos.pexels.com/video-files/856172/856172-hd_1920_1080_30fps.mp4"
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [defaultDestinations, defaultLeaders, defaultPhotos]);

  const updateConfig = async (newConfig: Partial<AppConfig>) => {
    const docRef = doc(db, 'appConfig', 'main');
    try {
      await setDoc(docRef, { ...config, ...newConfig }, { merge: true });
    } catch (err) {
      console.warn("Could not save to Firestore, trying local state update only", err);
      setConfig((prev) => ({ ...prev, ...newConfig }));
      alert("Perubahan hanya tersimpan lokal (sementara) karena database Firebase Anda belum diset dengan aturan yang tepat. Cek instruksi di FILE setup.");
    }
  };

  return { config, loading, updateConfig };
}
