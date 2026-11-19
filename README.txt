TENSAI 2027 - Portal pendaftaran (versi Firebase)

Struktur:
  index.html        kerangka halaman, header, footer, dialog pembayaran
  css/style.css     semua tampilan
  js/config.js      DATA YANG SERING DIUBAH: firebaseConfig, daftar lomba, kontak
  js/store.js       fungsi bantu dan state aplikasi
  js/firebase.js    koneksi Firebase: login, baca/tulis data, pembayaran
  js/pages.js       isi tiap halaman
  js/app.js         navigasi, tombol, form, aksi admin
  firestore.rules   aturan keamanan database (WAJIB dipasang, lihat langkah 4)

SETUP (sekali saja)
1. Buka console.firebase.google.com > Add project (Google Analytics boleh dimatikan).
2. Project settings (ikon roda gigi) > Your apps > ikon Web (</>) > daftarkan app.
   Salin objek firebaseConfig ke js/config.js (apiKey, authDomain, projectId, appId).
   Nilai ini bukan rahasia; yang menjaga keamanan adalah aturan di langkah 4.
3. Build > Authentication > Get started > Sign-in method > aktifkan "Email/Password".
   (Opsional: Settings > Password policy, wajibkan minimal 8 karakter.)
4. Build > Firestore Database > Create database > pilih lokasi (mis. asia-southeast2 Jakarta)
   > mulai dalam "production mode". Buka tab Rules, hapus isinya, tempel seluruh isi
   firestore.rules, lalu Publish.
5. Buat akun admin: Authentication > Users > Add user (email + sandi KUAT, baru, jangan pakai
   sandi lama). Salin User UID-nya.
   Lalu Firestore > Start collection, Collection ID: admins, Document ID: (tempel UID tadi),
   tambahkan satu field apa saja, misalnya aktif = true. Simpan.
   Hanya akun yang UID-nya ada di koleksi "admins" yang menjadi admin. Ini tidak bisa
   diubah dari aplikasi, hanya dari Console.
6. Jalankan lewat Live Server (VS Code) atau server lokal apa pun (http://localhost).
   Klik dua kali index.html (file://) TIDAK bisa dipakai lagi karena Firebase Auth butuh http/https.
7. Saat dipasang online (mis. Firebase Hosting, Netlify, GitHub Pages): tambahkan domainnya di
   Authentication > Settings > Authorized domains.

CATATAN KEAMANAN
- Sandi tidak ada lagi di kode. Sandi disimpan Firebase (di-hash), bukan di browser.
- Peserta hanya bisa membaca pendaftaran dan bukti transfer miliknya sendiri. Admin ditentukan server.
- Batasan yang masih ada: kuota dan nominal biaya dihitung dari js/config.js (sisi browser), jadi
  pengguna yang paham teknis bisa mengakalinya. Admin tetap memverifikasi nominal pada bukti transfer.
  Untuk perlindungan lebih, pertimbangkan Firebase App Check dan Cloud Functions.
- Bukti transfer disimpan sebagai gambar terkompres di Firestore (tanpa Firebase Storage, supaya
  cukup dengan paket gratis Spark). Jika nanti ingin file asli, pindahkan ke Firebase Storage.
- Ganti nomor rekening dan data contoh di index.html dan js/config.js sebelum dipakai.
