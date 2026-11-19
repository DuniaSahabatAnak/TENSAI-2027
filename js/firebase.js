/* firebase.js: koneksi Firebase (Auth + Firestore), listener data, dan fungsi tulis data */
let fs,auth,unsubReg=null,pendingProfile=null,fbError='';

const AE={'auth/invalid-credential':'Email atau kata sandi salah.','auth/wrong-password':'Email atau kata sandi salah.','auth/user-not-found':'Email atau kata sandi salah.',
'auth/invalid-email':'Format email tidak valid.','auth/email-already-in-use':'Email sudah terdaftar.','auth/weak-password':'Kata sandi terlalu lemah.',
'auth/too-many-requests':'Terlalu banyak percobaan. Coba lagi beberapa saat.','auth/network-request-failed':'Koneksi bermasalah. Coba lagi.'};
const pesanAuth=e=>AE[e?.code]||(console.error(e),'Terjadi kesalahan. Coba lagi.');
const ue=m=>Object.assign(new Error(m),{user:true}); // error yang pesannya boleh tampil ke pengguna
function pesanError(e){
  if(e?.user)return e.message;
  if(e?.code==='permission-denied')return 'Aksi ditolak server (tidak punya izin).';
  if(e?.code==='unavailable')return 'Koneksi bermasalah. Coba lagi.';
  console.error(e);return 'Terjadi kesalahan. Coba lagi.'}

/* Buat pendaftaran. Nomor urut + kuota + cek NISN ganda dilakukan dalam satu transaksi di server. */
async function buatReg(l,d){
  const cRef=fs.collection('counters').doc(l.id),F=firebase.firestore.FieldValue;
  if(d.nisn&&!/^\d{10}$/.test(d.nisn))throw ue('NISN harus 10 digit angka.');
  let data;
  await fs.runTransaction(async tx=>{
    const c=await tx.get(cRef),seq=(c.exists?c.data().seq:0)+1,aktifN=(c.exists?c.data().aktif:0)+1;
    if(l.kuota!==null&&aktifN>l.kuota)throw ue('Kuota lomba ini sudah penuh.');
    let lock=null;
    if(d.nisn){lock=fs.collection('nisnLocks').doc(l.id+'_'+d.nisn);if((await tx.get(lock)).exists)throw ue('NISN ini sudah terdaftar di lomba tersebut.')}
    const no=`TS-2027-${l.id}-${1000+seq}`;
    data={no,uid:user.uid,email:user.email,lid:l.id,lomba:`${l.nama} ${l.jenjang}`,total:l.biaya,status:'belum',hasBukti:false,...d};
    tx.set(cRef,{seq,aktif:aktifN});
    if(lock)tx.set(lock,{uid:user.uid});
    tx.set(fs.collection('registrations').doc(no),{...data,createdAt:F.serverTimestamp()});
  });
  return data}

/* Konfirmasi pembayaran: simpan bukti (jika ada) + ubah status menjadi 'menunggu' dalam satu batch. */
async function bayar(x,metode,img){
  const b=fs.batch();
  if(img)b.set(fs.collection('bukti').doc(x.no),{uid:user.uid,data:img});
  b.update(fs.collection('registrations').doc(x.no),{status:'menunggu',metode,hasBukti:!!img});
  await b.commit()}

/* Perkecil gambar bukti (maks 1400px, JPEG) agar muat di dokumen Firestore (batas 1 MiB) tanpa Firebase Storage. */
function kompres(f){return new Promise((ok,no)=>{const u=URL.createObjectURL(f),i=new Image();
  i.onerror=()=>{URL.revokeObjectURL(u);no(ue('Gambar tidak bisa dibaca.'))};
  i.onload=()=>{const s=Math.min(1,1400/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*s);c.height=Math.round(i.height*s);
    const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(i,0,0,c.width,c.height);URL.revokeObjectURL(u);
    let r=c.toDataURL('image/jpeg',.72);if(r.length>850000)r=c.toDataURL('image/jpeg',.5);
    r.length>850000?no(ue('Gambar terlalu besar. Gunakan foto yang lebih kecil.')):ok(r)};
  i.src=u})}

function mulaiReg(){
  const c=fs.collection('registrations'),q=user.role==='admin'?c:c.where('uid','==',user.uid);
  unsubReg=q.onSnapshot(s=>{
    reg=s.docs.map(d=>({...d.data(),no:d.id})).sort((a,b)=>(b.createdAt?.seconds??9e9)-(a.createdAt?.seconds??9e9));softRender()},
    e=>console.error('registrations',e))}

function startFirebase(){
  if(typeof firebase==='undefined'){fbError='<div class="ph"><h1>Gagal memuat Firebase</h1><p class="lead2">Periksa koneksi internet lalu muat ulang halaman.</p></div>';return render()}
  if(!firebaseConfig.apiKey||firebaseConfig.apiKey.startsWith('ISI')){fbError='<div class="ph"><h1>Firebase belum disetel</h1><p class="lead2">Isi <b>firebaseConfig</b> di js/config.js. Langkah lengkap ada di README.txt.</p></div>';return render()}
  firebase.initializeApp(firebaseConfig);auth=firebase.auth();fs=firebase.firestore();

  // Jumlah pendaftar per lomba (publik, hanya angka) untuk "kuota tersisa".
  fs.collection('counters').onSnapshot(s=>{cnt={};s.forEach(d=>cnt[d.id]=d.data().aktif||0);softRender()},e=>console.error('counters',e));

  auth.onAuthStateChanged(async fu=>{
    if(unsubReg){unsubReg();unsubReg=null}
    reg=[];
    if(!fu){user=null;ready=true;return render()}
    let adm=false,prof=pendingProfile;
    try{adm=(await fs.collection('admins').doc(fu.uid).get()).exists}catch(e){console.error('admins',e)}
    if(adm)user={uid:fu.uid,email:fu.email,nama:'Admin Panitia',role:'admin'};
    else{
      if(!prof){try{const s=await fs.collection('users').doc(fu.uid).get();prof=s.exists?s.data():null}catch(e){console.error('users',e)}}
      prof=prof||{};user={uid:fu.uid,email:fu.email,nama:prof.nama||fu.email,wa:prof.wa||'',sekolah:prof.sekolah||''}}
    pendingProfile=null;mulaiReg();ready=true;
    if(cur==='login'||cur==='register')go(adm?'admin':'dashboard');else render()})}
