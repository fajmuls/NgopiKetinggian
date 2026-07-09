import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, writeBatch } from 'firebase/firestore';

export const WEBSITE_VERSION = "1.4.0";

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
  showDiscountBadge?: boolean;
  leaders?: string[];
  status?: 'draft' | 'published';
  desc?: string;
  rundownText?: string;
  rundownPdf?: string;
  instagramPostUrl?: string;
  rundownMode?: 'direct' | 'whatsapp' | 'hidden';
  groups?: { id: string, name: string, leader: string, members: string }[];
  visibility?: {
    mepo: boolean;
    difficulty: boolean;
    duration: boolean;
    leader: boolean;
    beans: boolean;
    price: boolean;
    rundown?: boolean;
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
    rundown?: boolean;
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
    // ...
    soundVolume?: number;
  };
  version: string;
  patchNotes: { version: string, date: string, notes: string[] }[];
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
      { icon: 'instagram', url: 'https://instagram.com/ngopi.dketinggian' },
      { icon: 'whatsapp', url: 'https://wa.me/628123456789' },
      { icon: 'link', url: 'https://linktr.ee/ngopi.dketinggian' }
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
  },
  version: "1.4.0",
  patchNotes: [
    {
      version: "1.4.0",
      date: "2024-03-23",
      notes: [
        "Integrasi library 'react-zoom-pan-pinch' pada preview modal (Zoom, Pan, Reset).",
        "Peningkatan variasi desain Papan (Board) dengan 5 gaya unik (Kayu, Logam, Batu, Modern, Vintage).",
        "Fitur unduh dalam format PDF (Single & Bundle/Full Package).",
        "Indikator progress bar saat proses rendering dan pengunduhan.",
        "Refaktor preview modal dengan container object-fit: contain untuk visibilitas penuh."
      ]
    },
    {
      version: "1.3.0",
      date: "2024-03-22",
      notes: [
        "Revamp total layout Bendera (Flag) dengan Logo Aplikasi besar di tengah.",
        "Kontrol transparansi logo dan pilihan background (Foto/Warna) pada Bendera.",
        "Perbaikan Preview Poster agar tidak terpotong (fit-to-screen scaling).",
        "Optimasi status trip: Hanya Draft & Terbit (Selesai dihapus dari admin utama).",
        "5 desain unik & berbeda untuk setiap tipe layout (Poster, Info, Iklan, Bendera, Papan).",
        "Peningkatan resolusi hasil render download."
      ]
    },
    {
      version: "1.2.0",
      date: "2026-07-08",
      notes: [
        "Pembaruan desain unik (1-5) untuk setiap kategori layout.",
        "Penggantian ikon peta dengan logo aplikasi pada layout Bendera.",
        "Perbaikan logika render html-to-image untuk mencegah gambar terpotong."
      ]
    },
    {
      version: "1.1.1",
      date: "2026-07-08",
      notes: [
        "Sistem Testimonial & Ulasan (Cerita): Menambahkan slider testimoni dari pendaki yang telah menyelesaikan trip di section Cerita pada beranda, beserta akumulasi rating dan ulasan per destinasi gunung.",
        "Struktur Baru Poster Digital: Memisahkan poster menjadi kategori (Kreator, Info, Iklan, Bendera, Papan) dengan manajemen slide yang cerdas (contoh: Info otomatis max 5 slide, Iklan 3 slide).",
        "Perbaikan Visual Iklan: Iklan kini menggunakan fasilitas aktual (dinamis) dari dashboard, bukan lagi teks statis (seperti ngopi sepuasnya).",
        "Kustomisasi Desain Bendera & Papan: Menambahkan opsi 5 desain untuk Bendera dan Papan, kustomisasi teks deskripsi Papan, serta penyempurnaan background layout.",
        "Optimalisasi Panel Preview: Menyematkan fitur scroll lock agar layar tidak bergeser saat preview poster, memperbaiki render resolusi yang terpotong, dan memindahkan tombol action ke panel bawah agar tidak menutupi area desain."
      ]
    },
    {
      version: "1.1.0",
      date: "2026-07-07",
      notes: [
        "Interactive Carousel Slide Navigation 🎴: Menambahkan swipeable/navigasi slide menggunakan tombol Chevron (kiri & kanan) serta dot indikator di panel preview poster untuk berpindah antar slide Instagram feeds (7 slide) secara interaktif.",
        "Layout Baru: Bendera Komunitas (Community Flag) 🚩: Mengimplementasikan template desain Bendera Cetak beresolusi tinggi dengan logo ekspedisi, nama gunung kustom, MDPL kustom, dan slogan komunitas untuk kebutuhan dokumentasi.",
        "Layout Baru: Papan Puncak (Summit Sign Board) ⛰️: Mengimplementasikan template desain Papan Puncak berbahan kayu realistis lengkap dengan nama gunung kustom, MDPL kustom, dan footer tanggal keberangkatan otomatis.",
        "Bubble Diskon Solid & Non-pulsing 🏷️: Mengembalikan bubble stiker diskon circular/bulat yang miring (-rotate-12) di sudut kanan atas poster tanpa animasi kelip-kelip (non-pulsing) agar tidak menutupi informasi penting.",
        "Form Kustomisasi Gunung & MDPL 📝: Menambahkan input kustom nama gunung dan ketinggian (MDPL) di panel kontrol poster secara kondisional ketika layout Bendera atau Papan diaktifkan."
      ]
    },
    {
      version: "1.0.9",
      date: "2026-07-07",
      notes: [
        "IG Carousel Multi-Slide Generator 📸: Menambahkan generator layout multi-slide Instagram yang memungkinkan mengunduh hingga 5 slide feeds sekaligus secara berurutan.",
        "Dua Layout Desain Poster Baru ✨: Menambahkan layout 'Alat' (Gears & Inclusions) dan 'S&K' (Syarat, Ketentuan & Aturan Pendakian) untuk info detail slide Instagram.",
        "Kustomisasi Harga & Diskon Poster 🏷️: Memperbesar ukuran teks harga paket serta menyejajarkan badge diskon/potongan (misal 8% OFF) tepat di samping harga agar lebih rapi.",
        "Redesain Layout Opsi Tambahan (Optional Add-on) 🏕️: Menyusun nama opsi dan info harga secara vertikal satu kolom penuh tanpa pembagian kolom ganda untuk keterbacaan yang optimal.",
        "Sistem Pelacakan Versi & Patch Notes 🔄: Memperbarui database ke versi 1.0.9 beserta patch notes lengkap di Admin Dashboard secara real-time."
      ]
    },
    {
      version: "1.0.8",
      date: "2026-07-07",
      notes: [
        "Auto Caption Instagram 📱: Ditambahkan generator caption otomatis di panel poster yang mencakup info rute via kustom, jadwal, mepo, inclusions, exclusions, dan hashtag dinamis dengan tombol satu-klik Salin.",
        "Visual & Layout Iklan (Ad) Baru ✨: Menggunakan dual border inset neo-brutalist dengan penempatan badge diskon aman langsung di samping harga untuk visual yang rapi dan bebas crop.",
        "Navigasi Scroll Fleksibel 🔄: Memperbaiki area preview poster agar mendukung scroll 4 arah (atas, bawah, kiri, kanan) secara alami jika rasio poster melebihi batas resolusi layar.",
        "Sinkronisasi Fasilitas Admin 🔌: Bagian inklusi & eksklusi poster sekarang otomatis ditarik dari pengaturan Facilities tab Web Settings di Admin Dashboard Anda.",
        "Reduksi Redundansi Teks 🛑: Menghapus duplikasi kata 'via' yang sempat ganda pada bagian 'Via' kustom, serta mengubah label istilah 'investasi' menjadi 'harga' di seluruh layout."
      ]
    },
    {
      version: "1.0.7",
      date: "2026-07-07",
      notes: [
        "Optimasi Alur Booking (Gabung Open Trip): Menghubungkan langsung tombol booking generik di halaman utama ke tab daftar Open Trip (Join Trip) aktif agar pendaftaran lebih cepat.",
        "Studio Poster Baru (Pemisah Preview): Menambahkan tombol 'Lihat Preview Desain' sebelum poster di-render ke resolusi tinggi, menghemat performa.",
        "Visual Responsif & Bebas Crop: Menggunakan formula auto-scale dinamis & mobile tabs ('Desain' vs 'Preview') agar poster tampil proporsional tanpa terpotong di layar handphone.",
        "Spesialisasi Tiga Layout Promosi: Poster (cinematic adventure), Info (rundown detail, timeline, and fasilitas), dan Iklan (brutalist, bintang rating, trust badges, dan countdown slots)."
      ]
    },
    {
      version: "1.0.6",
      date: "2026-07-07",
      notes: [
        "Perbaikan Bug Kritis layout Booking Form: Menghapus duplikasi baris kode dan restrukturisasi kolom input nama, WhatsApp, dan email pada BookingModal.tsx.",
        "Stabilitas & Pembersihan Kode: Memperbaiki parser split rundown html dan menutup tag unclosed JSX pada BookingModal.tsx agar kompilasi sukses.",
        "Integrasi Versi Aplikasi & Patch Notes Otomatis: Sinkronisasi pembaruan versi dan patch notes ini di admin panel secara otomatis."
      ]
    },
    {
      version: "1.0.5",
      date: "2026-07-07",
      notes: [
        "Fitur Ulasan Pelanggan Terverifikasi: Menambahkan ReviewForm rating bintang 1-5 dan ulasan singkat pada destinasi khusus pendaki login & terverifikasi.",
        "Restrukturisasi UI Booking & Admin: Membagi layout form booking dan admin 'Optional/Add-on' ke dalam layout 2 kolom responsif.",
        "Peningkatan Aksesibilitas Harga: Menyejajarkan harga item/fasilitas sewa sejalan dengan kapasitas tepat di bawah nama opsi.",
        "Sistem Pelacakan Versi & Patch Notes: Menampilkan log versi dinamis saat menekan tombol versi di Admin Dashboard."
      ]
    },
    {
      version: "1.0.4",
      date: "2026-07-07",
      notes: [
        "Perbaikan error build: Menambahkan import AnimatePresence yang kurang pada komponen Admin Panel",
        "Perbaikan error build: Mendefinisikan variabel currentDurPrice yang tidak ada pada kalkulator estimasi Destination Card",
        "Peningkatan stabilitas: Sinkronisasi dan pembaruan sistem versioning dan patch notes di Admin Dashboard"
      ]
    },
    {
      version: "1.0.3",
      date: "2024-03-20",
      notes: [
        "Ditambahkan fitur kalkulator estimasi private trip dengan layout 2 kolom",
        "Ditambahkan fitur badge diskon otomatis di website dan poster",
        "Pembaruan branding Instagram dan Linktree",
        "Sistem versioning dan patch notes di Admin Dashboard"
      ]
    },
    {
      version: "1.0.2",
      date: "2024-03-15",
      notes: [
        "Pembaruan sistem filter destinasi",
        "Penambahan fitur rundown via WhatsApp",
        "Peningkatan performa load gambar"
      ]
    }
  ]
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
            const loadedVersion = data.version || "1.0.0";
            let mergedPatchNotes = data.patchNotes || [];
            
            if (loadedVersion !== WEBSITE_VERSION) {
              const defaultWebsite = getDefaultWebsiteData();
              const existingVersions = new Set(mergedPatchNotes.map((pn: any) => pn.version));
              const missingPatchNotes = defaultWebsite.patchNotes.filter((pn: any) => !existingVersions.has(pn.version));
              if (missingPatchNotes.length > 0) {
                mergedPatchNotes = [...missingPatchNotes, ...mergedPatchNotes];
              }
              data.version = WEBSITE_VERSION;
              data.patchNotes = mergedPatchNotes;
              
              setDoc(docRef, { version: WEBSITE_VERSION, patchNotes: mergedPatchNotes }, { merge: true }).catch(() => {});
            }

            currentConfig = { 
              ...currentConfig, 
              ...data,
              facilities: data.facilities || currentConfig.facilities,
              visibilities: { ...currentConfig.visibilities, ...(data.visibilities || {}) },
              homepage: { ...currentConfig.homepage, ...(data.homepage || {}) },
              version: data.version || WEBSITE_VERSION,
              patchNotes: mergedPatchNotes.length > 0 ? mergedPatchNotes : (currentConfig.patchNotes || [])
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

