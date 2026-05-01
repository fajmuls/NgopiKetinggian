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
        setDoc(docRef, defaultConfig).catch(console.error);
        setConfig(defaultConfig);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [defaultDestinations, defaultLeaders, defaultPhotos]);

  const updateConfig = async (newConfig: Partial<AppConfig>) => {
    const docRef = doc(db, 'appConfig', 'main');
    await setDoc(docRef, { ...config, ...newConfig }, { merge: true });
  };

  return { config, loading, updateConfig };
}
