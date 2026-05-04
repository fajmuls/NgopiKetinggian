import { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export interface AppConfig {
  openTrips: any[];
  visibilities: { map: boolean, quota: boolean, beans: boolean, routes: boolean };
  facilities?: { include: string[], exclude: string[], opsi: string[] };
  destinationsData: any[];
  tripLeaders: any[];
  teamPhotos?: string[];
  galleryPhotos: any[];
  ceritaVideoUrl: string;
}

export function useAppConfig(defaultDestinations: any[], defaultLeaders: any[], defaultPhotos: any[]) {
  const [config, setConfig] = useState<AppConfig>({
    destinationsData: defaultDestinations,
    tripLeaders: defaultLeaders,
    teamPhotos: [
      "https://images.unsplash.com/photo-1510525009512-ad7fc13eefab?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1550983570-5b65df05eaca?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517400508440-20dc951dc84d?w=600&auto=format&fit=crop"
    ],
    galleryPhotos: defaultPhotos,
    ceritaVideoUrl: "https://videos.pexels.com/video-files/856172/856172-hd_1920_1080_30fps.mp4",
    openTrips: [], visibilities: { map: true, quota: true, beans: true, routes: true }, facilities: {
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
        "Sewa Porter Pribadi: Rp 250.000 / Hari",
        "Sewa Perlengkapan Pribadi (Sepatu, Jaket): Hubungi Admin",
        "Upgrade Tenda Privat (1-2 orang): Rp 100.000 / Tenda",
        "Layanan Antar Jemput Kota/Bandara: Harga menyesuaikan jarak"
      ]
    }
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
          teamPhotos: [
            "https://images.unsplash.com/photo-1510525009512-ad7fc13eefab?w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1550983570-5b65df05eaca?w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1517400508440-20dc951dc84d?w=600&auto=format&fit=crop"
          ],
          ceritaVideoUrl: "https://videos.pexels.com/video-files/856172/856172-hd_1920_1080_30fps.mp4",
          openTrips: [], visibilities: { map: true, quota: true, beans: true, routes: true }, facilities: {
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
        "Sewa Porter Pribadi: Rp 250.000 / Hari",
        "Sewa Perlengkapan Pribadi (Sepatu, Jaket): Hubungi Admin",
        "Upgrade Tenda Privat (1-2 orang): Rp 100.000 / Tenda",
        "Layanan Antar Jemput Kota/Bandara: Harga menyesuaikan jarak"
      ]
    }
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
        teamPhotos: [
          "https://images.unsplash.com/photo-1510525009512-ad7fc13eefab?w=600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1550983570-5b65df05eaca?w=600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1517400508440-20dc951dc84d?w=600&auto=format&fit=crop"
        ],
        ceritaVideoUrl: "https://videos.pexels.com/video-files/856172/856172-hd_1920_1080_30fps.mp4",
          openTrips: [], visibilities: { map: true, quota: true, beans: true, routes: true }, facilities: {
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
        "Sewa Porter Pribadi: Rp 250.000 / Hari",
        "Sewa Perlengkapan Pribadi (Sepatu, Jaket): Hubungi Admin",
        "Upgrade Tenda Privat (1-2 orang): Rp 100.000 / Tenda",
        "Layanan Antar Jemput Kota/Bandara: Harga menyesuaikan jarak"
      ]
    }
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

  const revertToDefault = async () => {
    const defaultConfig = {
      destinationsData: defaultDestinations,
      tripLeaders: defaultLeaders,
      galleryPhotos: defaultPhotos,
      teamPhotos: [
        "https://images.unsplash.com/photo-1510525009512-ad7fc13eefab?w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1550983570-5b65df05eaca?w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1517400508440-20dc951dc84d?w=600&auto=format&fit=crop"
      ],
      ceritaVideoUrl: "https://videos.pexels.com/video-files/856172/856172-hd_1920_1080_30fps.mp4",
          openTrips: [], visibilities: { map: true, quota: true, beans: true, routes: true }, facilities: {
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
        "Sewa Porter Pribadi: Rp 250.000 / Hari",
        "Sewa Perlengkapan Pribadi (Sepatu, Jaket): Hubungi Admin",
        "Upgrade Tenda Privat (1-2 orang): Rp 100.000 / Tenda",
        "Layanan Antar Jemput Kota/Bandara: Harga menyesuaikan jarak"
      ]
    }
    };
    const docRef = doc(db, 'appConfig', 'main');
    try {
      await setDoc(docRef, defaultConfig);
      setConfig(defaultConfig);
    } catch (err) {
      console.warn("Could not save to Firestore, trying local state update only", err);
      setConfig(defaultConfig);
      alert("Pembalikan ke default hanya bekerja di sesi ini (sementara) karena database Firebase Anda belum diset dengan aturan yang tepat.");
    }
  };

  return { config, loading, updateConfig, revertToDefault };
}
