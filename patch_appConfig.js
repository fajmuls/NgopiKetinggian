import fs from 'fs';
let code = fs.readFileSync('src/useAppConfig.ts', 'utf8');

code = code.replace(/export interface AppConfig \{/g, `export interface AppConfig {
  facilities?: { include: string[], exclude: string[], opsi: string[] };`);

code = code.replace(/ceritaVideoUrl: "https:\/\/videos\.pexels\.com\/video-files\/856172\/856172-hd_1920_1080_30fps\.mp4"/g, `ceritaVideoUrl: "https://videos.pexels.com/video-files/856172/856172-hd_1920_1080_30fps.mp4",
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
        "Sewa Porter Pribadi: Rp 250.000 / Hari",
        "Sewa Perlengkapan Pribadi (Sepatu, Jaket): Hubungi Admin",
        "Upgrade Tenda Privat (1-2 orang): Rp 100.000 / Tenda",
        "Layanan Antar Jemput Kota/Bandara: Harga menyesuaikan jarak"
      ]
    }`);

fs.writeFileSync('src/useAppConfig.ts', code);
