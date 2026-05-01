# Panduan Setup Firebase untuk Tektok Trip "Ngopi di Ketinggian"

Aplikasi ini menggunakan layanan Firebase untuk fungsi Login (Google) dan fitur Mode Admin yang dinamis. Jika Anda mengalami kendala "Error: Website ini belum mendapatkan izin dari Firebase" atau Mode Admin tidak tersimpan, Anda perlu menambahkan konfigurasi ke project Firebase Anda.

## 1. Setup Google Login & Authentication (Auth)

Agar fitur login Google dan Mode Admin berfungsi dengan baik saat website sudah di-hosting (seperti di GitHub Pages atau domain kustom):

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project Firebase aplikasi ini.
3. Di menu sebelah kiri, masuk ke menu **Build** > **Authentication**.
4. Klik tab **Settings** (Pengaturan).
5. Pilih menu **Authorized domains** (Domain yang diotorisasi) di sebelah kiri layar.
6. Klik tombol **Add domain** (Tambahkan domain).
7. Masukkan link URL website/aplikasi Anda.
   - Contoh untuk GitHub Pages: `username.github.io`
   - Contoh untuk Domain Kustom: `ngopidiketinggian.com`
   - *(Penting: Jangan cantumkan `https://` atau garis miring `/` di ujung)*
8. Klik **Add** (Tambahkan).

Sekarang fitur login Google telah ditambahkan dan pengguna seharusnya bisa masuk tanpa hambatan.

---

## 2. Setup Mode Admin & Firestore

Aplikasi ini memiliki Dashboard Admin untuk mengubah Harga Trip, Menyesuaikan Destinasi, Trip Leaders, Gallery, dll tanpa harus koding ulang. Untuk menggunakannya, Firestore Database perlu diaktifkan:

1. Di Firebase Console, navigasikan ke **Build** > **Firestore Database**.
2. Jika belum membuat, klik **Create database**.
3. Pilih lokasi database Anda dan ikuti panduan setup-nya.
4. Agar admin (email Anda) memiliki akses yang valid untuk mengedit, Anda perlu mengatur **Rules**. Masuk ke tab **Rules** (Aturan) di dalam menu Firestore Database, lalu klik tombol **Edit rules**.
5. Ganti `mrachmanfm@gmail.com` dengan email Google (admin) Anda jika Anda menginginkan akun yang lain, atau gunakan aturan bawaan berikut:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    function isSignedIn() {
      return request.auth != null;
    }
    
    // GANTI EMAIL INI DENGAN EMAIL ADMIN:
    function isAdmin() { 
      return isSignedIn() && request.auth.token.email == 'mrachmanfm@gmail.com'; 
    }

    match /appConfig/{document=**} {
      allow read: if true; // Semua orang bisa lihat configurasi trip web
      allow write: if isAdmin(); // Hanya email admin yang bisa edit 
    }
  }
}
```

6. Klik **Publish**.

*(Catatan: `appConfig` diaktifkan secara otomatis dari website Anda ke Firebase jika dokumen belum dibuat oleh sistem saat web direfresh oleh pengguna pertama kalinya)*.

## 3. Tambahan Aksesibilitas Admin

Jika Anda ingin pengguna bisa otomatis membuka mode Admin tanpa harus login Google terlebih dulu, sistem pada web ini dirancang agar pengguna yang memasukkan "Token rahasia" bisa masuk mode admin secara independen, walaupun tanpa verifikasi database. Kode standar yang telah diatur (jika pengaturan bypass ini dipakai) adalah "Fajmuls22".

Selamat Mengkonfigurasi! 

