import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, writeBatch } from 'firebase/firestore';

export const WEBSITE_VERSION = "1.0.1";

export interface FacilityOption {
  name: string;
  priceInfo?: string;
  subItems?: { name: string, priceInfo?: string }[];
}

export const DIFFICULTY_LEVELS = ["Pemula", "Pemula Menengah", "Menengah", "Menengah Ahli", "Ahli", "Sangat Ahli"];
export const DURATION_LEVELS = ["1H (Tektok)", "2H 1M", "3H 2M", "4H 3M", "5H 4M"];

import { customAlert } from './GlobalDialog';

export interface OpenTrip {
  id: string;
  name: string;
  region: string;
  jadwal: string;
  startDate?: string;
  kuota: string;
  kuotaNum: number;
  consumedKuota?: number;
  mepo: string;
  difficulty: string;
  image: string;
  beans: string;
  path: string;
  duration: string;
  price: number;
  originalPrice: number;
  leader?: string;
  status?: 'draft' | 'published';
}

export interface AppConfig {
  openTrips: OpenTrip[];
  visibilities: { map: boolean, quota: boolean, beans: boolean, routes: boolean };
  facilities: { include: string[], exclude: string[], opsi: FacilityOption[] };
  destinationsData: any[];
  tripLeaders: any[];
  teamPhotos: string[];
  galleryPhotos: any[];
  ceritaVideoUrl: string;
  promoCodes: { code: string, discount: number }[];
  homepage: {
    heroTitle: string;
    heroDescription: string;
    heroPhotoUrl: string;
    heroSlides?: { name: string, height: string, image: string }[];
  };
}

const getDefaultWebsiteData = () => ({
  visibilities: { map: true, quota: true, beans: true, routes: true },
  facilities: {
    include: [
      "Tiket masuk & asuransi pendakian resmi (Simaksi)",
      "Tenda premium kapasitas 2-3 orang",
      "Matras & Sleeping bag hangat",
      "Makan selama pendakian (Sesuai durasi)",
      "Peralatan masak & makan",
      "Guide & Porter kelompok"
    ],
    exclude: [
      "Transportasi dari kota asal ke Meeting Point",
      "Pengeluaran pribadi & jajan selama perjalanan",
      "Perlengkapan pribadi (Jaket, Sepatu, Pakaian ganti)",
      "Obat-obatan pribadi yang spesifik",
      "Porter pribadi (bisa dipesan terpisah)"
    ],
    opsi: [
      { name: "Penjemputan / Transportasi", priceInfo: "Harga menyesuaikan jarak", subItems: [] },
      { 
        name: "Sewa Perlengkapan", 
        priceInfo: "Harga per item/hari", 
        subItems: [
          { name: "Jaket Gunung", priceInfo: "Rp 50rb" },
          { name: "Sepatu Trekking", priceInfo: "Rp 75rb" },
          { name: "Ransel (Carrier)", priceInfo: "Rp 60rb" },
          { name: "Headlamp", priceInfo: "Rp 15rb" }
        ]
      },
      { 
        name: "Sewa Pakaian", 
        priceInfo: "Harga per item/hari", 
        subItems: [
          { name: "Pakaian Tebal", priceInfo: "Rp 30rb" },
          { name: "Sarung Tangan Extra", priceInfo: "Rp 10rb" },
          { name: "Kupluk / Topi Gunung", priceInfo: "Rp 10rb" }
        ]
      },
      { name: "Upgrade Tenda Privat", priceInfo: "Rp 100rb / Tenda", subItems: [] }
    ]
  },
  teamPhotos: [
    "https://images.unsplash.com/photo-1510525009512-ad7fc13eefab?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550983570-5b65df05eaca?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517400508440-20dc951dc84d?w=600&auto=format&fit=crop"
  ],
  ceritaVideoUrl: "https://videos.pexels.com/video-files/856172/856172-hd_1920_1080_30fps.mp4",
  promoCodes: [
    { code: "Ari ganteng", discount: 50 },
    { code: "Emikari", discount: 10 }
  ],
  homepage: {
    heroTitle: "Trip Ngopi di Ketinggian",
    heroDescription: "Rasakan sensasi ngopi di atas awan.",
    heroPhotoUrl: "",
    heroSlides: [
      {
         name: "Gunung Gede Pangrango",
         height: "2.958",
         image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2671&auto=format&fit=crop"
      },
      {
         name: "Gunung Salak",
         height: "2.211",
         image: "https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?q=80&w=2070&auto=format&fit=crop"
      },
      {
         name: "Gunung Semeru",
         height: "3.676",
         image: "https://images.unsplash.com/photo-1543884487-7359df37db0d?q=80&w=2070&auto=format&fit=crop"
      },
      {
         name: "Gunung Rinjani",
         height: "3.726",
         image: "https://images.unsplash.com/photo-1571365893322-921319c5c163?q=80&w=2659&auto=format&fit=crop"
      }
    ]
  }
});

export function useAppConfig(defaultDestinations: any[], defaultLeaders: any[], defaultPhotos: any[]) {
  const [config, setConfig] = useState<AppConfig>({
    destinationsData: defaultDestinations,
    tripLeaders: defaultLeaders,
    galleryPhotos: defaultPhotos,
    openTrips: [],
    ...getDefaultWebsiteData()
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    
    const collections = [
      { name: 'website', defaultData: getDefaultWebsiteData() },
      { name: 'destinations', defaultData: { items: defaultDestinations } },
      { name: 'leaders', defaultData: { items: defaultLeaders } },
      { name: 'gallery', defaultData: { items: defaultPhotos } },
      { name: 'openTrips', defaultData: { items: [] } }
    ];

    let currentConfig: any = {
      destinationsData: defaultDestinations,
      tripLeaders: defaultLeaders,
      galleryPhotos: defaultPhotos,
      openTrips: [],
      ...getDefaultWebsiteData()
    };

    let loadedCount = 0;

    collections.forEach(({ name, defaultData }) => {
      const docRef = doc(db, name, 'data');
      const unsub = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (name === 'website') {
            currentConfig = { ...currentConfig, ...data };
          } else if (name === 'destinations') {
            currentConfig.destinationsData = data.items || [];
          } else if (name === 'leaders') {
            currentConfig.tripLeaders = data.items || [];
          } else if (name === 'gallery') {
            currentConfig.galleryPhotos = data.items || [];
          } else if (name === 'openTrips') {
            currentConfig.openTrips = data.items || [];
          }
        } else if (auth.currentUser) {
          // Initialize default if not exists, but only if someone is logged in 
          // (They still need admin email to succeed, but this hides it for guests)
          setDoc(docRef, defaultData).catch(e => {
            if (!e.message.includes('permission')) {
              console.warn("Failed to set default doc for " + name, e);
            }
          });
        }
        loadedCount++;
        if (loadedCount >= collections.length) {
          setConfig({ ...currentConfig } as AppConfig);
          setLoading(false);
        } else if (!loading) {
          setConfig({ ...currentConfig } as AppConfig);
        }
      }, err => {
        console.warn(`Error loading ${name} config:`, err);
        loadedCount++;
        if (loadedCount >= collections.length) {
          setLoading(false);
        }
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach(u => u());
  }, [defaultDestinations, defaultLeaders, defaultPhotos]);

  const updateConfig = async (newConfig: Partial<AppConfig>) => {
    try {
      const batch = writeBatch(db);
      
      const websiteUpdates: any = {};
      
      Object.keys(newConfig).forEach(key => {
        const val = (newConfig as any)[key];
        if (key === 'destinationsData') {
          batch.set(doc(db, 'destinations', 'data'), { items: val }, { merge: true });
        } else if (key === 'tripLeaders') {
          batch.set(doc(db, 'leaders', 'data'), { items: val }, { merge: true });
        } else if (key === 'galleryPhotos') {
          batch.set(doc(db, 'gallery', 'data'), { items: val }, { merge: true });
        } else if (key === 'openTrips') {
          batch.set(doc(db, 'openTrips', 'data'), { items: val }, { merge: true });
        } else {
          websiteUpdates[key] = val;
        }
      });

      if (Object.keys(websiteUpdates).length > 0) {
        batch.set(doc(db, 'website', 'data'), websiteUpdates, { merge: true });
      }

      await batch.commit();
      
      // We will also update appConfig/default with the single document if "set to default" wants it
      // but "set to default" is handled in AdminPanel.tsx. Wait! In AdminPanel.tsx it does:
      // await updateDoc(doc(db, 'appConfig', 'default'), config as any);
      // Let's modify AdminPanel.tsx separately.
      
    } catch (err) {
      console.warn("Could not save to Firestore, trying local state update only", err);
      setConfig((prev) => ({ ...prev, ...newConfig }));
      customAlert("Perubahan hanya tersimpan lokal (sementara) karena database Firebase Anda belum diset dengan aturan yang tepat.");
    }
  };

  const revertToDefault = async () => {
    try {
      // Try to get from defaults collection first
      const defaultDoc = await getDoc(doc(db, 'defaults', 'data'));
      
      let destinations = defaultDestinations;
      let leaders = defaultTripLeaders;
      let gallery = defaultGalleryPhotos;
      let website = getDefaultWebsiteData();
      let openTripsData: any[] = [];

      if (defaultDoc.exists()) {
        const d = defaultDoc.data();
        if (d.destinations) destinations = d.destinations;
        if (d.leaders) leaders = d.leaders;
        if (d.gallery) gallery = d.gallery;
        if (d.website) website = d.website;
        if (d.openTrips) openTripsData = d.openTrips;
      }

      const batch = writeBatch(db);
      batch.set(doc(db, 'destinations', 'data'), { items: destinations });
      batch.set(doc(db, 'leaders', 'data'), { items: leaders });
      batch.set(doc(db, 'gallery', 'data'), { items: gallery });
      batch.set(doc(db, 'openTrips', 'data'), { items: openTripsData });
      batch.set(doc(db, 'website', 'data'), website);
      
      await batch.commit();
    } catch (err) {
      console.warn("Could not revert to default in Firestore", err);
      customAlert("Pembalikan ke default hanya bekerja di sesi ini (sementara) karena database Firebase Anda belum diset dengan aturan yang tepat.");
    }
  };

  return { config, loading, updateConfig, revertToDefault };
}

