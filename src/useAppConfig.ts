import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, writeBatch } from 'firebase/firestore';

export const WEBSITE_VERSION = "1.0.3";

export interface FacilityOption {
  name: string;
  priceInfo?: string;
  price?: number; // Added numeric price
  pricingFormat?: 'manual' | 'calculated';
  subItems?: { name: string, priceInfo?: string, price?: number }[];
  isHidden?: boolean;
}

export const DIFFICULTY_LEVELS = [
  "Pemula",
  "Menengah",
  "Mahir",
  "Ahli"
];
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
  mepoLink?: string; // Added map link
  difficulty: string;
  image: string;
  beans: string;
  path: string;
  duration: string;
  price: number;
  originalPrice: number;
  leaders?: string[];
  status?: 'draft' | 'published';
  desc?: string;
  rundownText?: string;
  rundownPdf?: string;
  groups?: { id: string, name: string, leader: string, members: string }[];
  visibility?: {
    mepo: boolean;
    difficulty: boolean;
    duration: boolean;
    leader: boolean;
    beans: boolean;
    price: boolean;
  };
}

export interface AppConfig {
  openTrips: OpenTrip[];
  visibilities: { 
    map: boolean; 
    quota: boolean; 
    beans: boolean; 
    routes: boolean;
    openTripMepo: boolean;
    openTripDifficulty: boolean;
    openTripDuration: boolean;
    openTripLeader: boolean;
  };
  facilities: { include: string[], exclude: string[], opsi: FacilityOption[] };
  destinationsData: any[];
  tripLeaders: any[];
  teamPhotos: string[];
  galleryPhotos: any[];
  ceritaVideoUrl: string;
  ceritaVideoRatio?: string;
  promoCodes: { code: string, discount: number }[];
  homepage: {
    heroSub?: string;
    heroFeatures?: string;
    heroSlogan?: string;
    heroTitlePrefix?: string;
    heroTitle: string;
    heroDescription: string;
    heroTagline?: string;
    heroPhotoUrl: string;
    heroSlides?: { name: string, height: string, image: string }[];
    ceritaTitle?: string;
    ceritaSub?: string;
    ceritaParagraph1?: string;
    ceritaParagraph2?: string;
    ceritaFeatures?: { title: string, desc: string }[];
    leaderTitle?: string;
    leaderSub?: string;
    leaderParagraph?: string;
    statHikers?: string;
    statSatisfaction?: string;
    statTrips?: string;
    logo?: string;
    logos?: { id: string, name: string, url: string }[];
    footerDesc?: string;
    officeEmail?: string;
    officePhone?: string;
    officeAddress?: string;
    officeMaps?: string;
    socialLinks?: { icon: string, url: string }[];
    paymentMethods?: { name: string, active: boolean }[];
    soundEnabled?: boolean;
    soundVolume?: number;
  };
}

const getDefaultWebsiteData = () => ({
  visibilities: { 
    map: true, 
    quota: true, 
    beans: true, 
    routes: true,
    openTripMepo: true,
    openTripDifficulty: true,
    openTripDuration: true,
    openTripLeader: true
  },
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
      { name: "Penjemputan / Transportasi", priceInfo: "Harga menyesuaikan jarak", pricingFormat: 'manual', subItems: [] },
      { 
        name: "Sewa Perlengkapan", 
        priceInfo: "Harga per item/hari", 
        pricingFormat: 'calculated',
        subItems: [
          { name: "Jaket Gunung", price: 50, priceInfo: "50.000" },
          { name: "Sepatu Trekking", price: 75, priceInfo: "75.000" },
          { name: "Ransel (Carrier)", price: 60, priceInfo: "60.000" },
          { name: "Headlamp", price: 15, priceInfo: "15.000" }
        ]
      },
      { 
        name: "Sewa Pakaian", 
        priceInfo: "Harga per item/hari", 
        pricingFormat: 'calculated',
        subItems: [
          { name: "Pakaian Tebal", price: 30, priceInfo: "30.000" },
          { name: "Sarung Tangan Extra", price: 10, priceInfo: "10.000" },
          { name: "Kupluk / Topi Gunung", price: 10, priceInfo: "10.000" }
        ]
      },
      { name: "Upgrade Tenda Privat", price: 100, priceInfo: "Rp 100rb / Tenda", pricingFormat: 'calculated', subItems: [] }
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
    logo: "",
    logos: [],
    heroSub: "Open Trip Eksklusif",
    heroFeatures: "Fasilitas Premium • Pemandu Ahli • Keamanan Terjamin",
    heroSlogan: "Ngopi Trip Kami",
    heroTitlePrefix: "Trip",
    heroTitle: "Ngopi Di\nKetinggian",
    heroDescription: "Harga terjangkau dengan pengalaman trip profesional. Nikmati secangkir kopi manual brew terbaik, hangatnya kebersamaan, dan magisnya lautan awan dari puncak gunung.",
    heroTagline: "Sederhana tapi berkesan",
    heroPhotoUrl: "",
    footerDesc: "Provider layanan pendakian gunung premium dengan standar keamanan tinggi dan kenyamanan maksimal.",
    officeEmail: "siliwangiputra1510@gmail.com",
    officePhone: "628123456789",
    officeAddress: "Jl. Raya Puncak, Bogor, Jawa Barat",
    officeMaps: "https://goo.gl/maps/example",
    socialLinks: [
      { icon: 'instagram', url: 'https://instagram.com' },
      { icon: 'whatsapp', url: 'https://wa.me/628123456789' },
      { icon: 'telegram', url: 'https://t.me' }
    ],
    paymentMethods: [
      { name: 'BCA', active: true },
      { name: 'BNI', active: true },
      { name: 'MANDIRI', active: true },
      { name: 'GOPAY', active: true },
      { name: 'DANA', active: true },
      { name: 'QRIS', active: true }
    ],
    soundEnabled: true,
    soundVolume: 0.8,
    ceritaTitle: "Secangkir Cerita",
    ceritaSub: "di Atas Awan",
    ceritaParagraph1: "Selama lebih dari 10 tahun, kami telah menemani ribuan langkah menapaki puncak-puncak tertinggi di Nusantara. Mengarungi samudra awan dan dinginnya udara gunung mengajarkan kami satu hal: mendaki bukan sekadar tentang seberapa cepat Anda tiba di puncak, melainkan bagaimana Anda meresapi setiap detik perjalanannya. Ya... dan tentunya dengan secangkir kopi hangat di genggaman.",
    ceritaParagraph2: "Berbekal pengalaman panjang ini, meracik kopi di alam terbuka tak lagi sekadar ritual bagi kami, ia menjelma jadi perayaan kebersamaan. Lupakan sejenak semrawutnya ibukota. Kami siapkan ritme perjalanan yang santai, aman, penuh cerita, dan tentu saja... kopi rindu tebal yang diseduh di waktu yang paling tepat. Sesuatu yang tak akan pernah Anda temukan walau di coffee shop semewah apa pun di tengah kota.",
    ceritaFeatures: [
      { title: "Manual Brew Experience", desc: "Nikmati V60, Chemex, atau Aeropress dari barista kami." },
      { title: "Grup Eksklusif", desc: "Maksimal 12 orang per perjalanan untuk keintiman." },
      { title: "Peralatan Premium", desc: "Tenda The North Face dll untuk kenyamanan istirahat." }
    ],
    leaderTitle: "Kenalan dengan",
    leaderSub: "Trip Leader Kami",
    leaderParagraph: "Beberapa kawan daki yang akan memandu dan memastikan keamanan serta kenyamanan perjalananmu ke puncak.",
    statHikers: "100+",
    statSatisfaction: "99%",
    statTrips: "50+",
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
            currentConfig = { 
              ...currentConfig, 
              ...data,
              facilities: data.facilities || currentConfig.facilities,
              visibilities: { ...currentConfig.visibilities, ...(data.visibilities || {}) },
              homepage: { ...currentConfig.homepage, ...(data.homepage || {}) }
            };
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
      customAlert("Gagal menyimpan ke Database Cloud. Perubahan akan disimpan sementara di memori browser.");
    }
  };

  const revertToDefault = async () => {
    try {
      // Try to get from defaults collection first
      const defaultDoc = await getDoc(doc(db, 'defaults', 'data'));
      
      let destinations = defaultDestinations;
      let leaders = defaultLeaders;
      let gallery = defaultPhotos;
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
      customAlert("Gagal mereset ke default di Cloud. Reset hanya berlaku untuk sesi ini.");
    }
  };

  return { config, loading, updateConfig, revertToDefault };
}

