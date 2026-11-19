/* config.js: data yang sering diubah (lomba, kontak, konfigurasi Firebase) */
/* ===== PENGATURAN: sesuaikan dengan juknis TENSAI 2027 ===== */
// Konfigurasi Firebase (Project settings > Your apps > Web app). Nilai ini BUKAN rahasia:
// keamanan data dijaga oleh Authentication + firestore.rules, bukan oleh kerahasiaan config ini.
// Akun admin TIDAK lagi ada di sini. Admin dibuat di Firebase Console (lihat README.txt).
const firebaseConfig={
  apiKey:'AIzaSyBYe5Mxtxp4MCXtLzFZxJEk9hv2bFjCw3w',
  authDomain:'tensai-a0caa.firebaseapp.com',
  projectId:'tensai-a0caa',
  appId:'1:1077529027736:web:6a0d26ad0f906fec7a5ced'
};
const WA='6281200000000'; // nomor WhatsApp panitia tanpa tanda +
const PERIODE='1 Des 2026 - 15 Feb 2027';
const SEKOLAH=['SMA Negeri 10 Padang','SMA Negeri 1 Padang','SMA Negeri 3 Padang','SMP Negeri 1 Padang','SMP Negeri 5 Padang']; // contoh, ganti
const LOMBA=[ // contoh, ganti dengan cabang lomba resmi. kuota: angka atau null (tanpa batas)
 {id:'IPA',nama:'IPA',ico:'🧪',jenjang:'SMP',mode:'Offline',tipe:'Individu',kuota:300,biaya:70000},
 {id:'MTKP',nama:'MATEMATIKA',ico:'➗',jenjang:'SMP',mode:'Offline',tipe:'Individu',kuota:200,biaya:70000},
 {id:'MTK',nama:'MATEMATIKA',ico:'📐',jenjang:'SMA',mode:'Offline',tipe:'Individu',kuota:100,biaya:75000},
 {id:'FIS',nama:'FISIKA',ico:'⚛️',jenjang:'SMA',mode:'Offline',tipe:'Individu',kuota:100,biaya:75000},
 {id:'KIM',nama:'KIMIA',ico:'⚗️',jenjang:'SMA',mode:'Offline',tipe:'Individu',kuota:100,biaya:75000},
 {id:'BIO',nama:'BIOLOGI',ico:'🧬',jenjang:'SMA',mode:'Offline',tipe:'Individu',kuota:100,biaya:75000},
 {id:'LKTI',nama:'LKTI',ico:'📝',jenjang:'SMA',mode:'Online',tipe:'Team',kuota:null,biaya:150000}
];
const KONTAK='0812-0000-0000 (contoh)';
/* ======================================================== */
