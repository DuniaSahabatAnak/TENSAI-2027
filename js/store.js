/* store.js: fungsi bantu dan state aplikasi. Data TIDAK lagi disimpan di localStorage; semuanya di Firebase. */
const $=s=>document.querySelector(s),rp=n=>'Rp'+n.toLocaleString('id-ID');
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// user: null | {uid,email,nama,wa,sekolah,role?}   reg: pendaftaran milik user (admin: semua)   cnt: {idLomba: jumlah pendaftar aktif}
let cur=(location.hash.slice(1)||'home'),user=null,reg=[],cnt={},ready=false,filt='Semua',aktif=null;
const lab={belum:'Belum dibayar',menunggu:'Menunggu verifikasi',lunas:'Lunas'};
