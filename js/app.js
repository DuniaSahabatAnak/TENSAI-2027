/* app.js: router, event klik/submit, dan alur pembayaran */
function render(){
  if(fbError){$('#app').innerHTML=fbError;$('#right').innerHTML='';return}
  if(!ready){$('#app').innerHTML='<p class="mu" style="text-align:center;padding:48px 0">Memuat…</p>';$('#right').innerHTML='';return}
  let r=cur||'home';if(!P[r])r='home';cur=r;
  const adm=user?.role==='admin';
  if(r==='dashboard'&&!user)r='login';
  if(r==='dashboard'&&adm)r='admin';
  if(r==='admin'&&!adm)r=user?'dashboard':'login';
  if((r==='login'||r==='register')&&user)r=adm?'admin':'dashboard';
  $('#app').innerHTML=P[r]();
  document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.dataset.r===r));
  $('#nav').classList.remove('open');
  $('#right').innerHTML=user?`<a class="btn out sm" href="${adm?'#admin':'#dashboard'}">${adm?'Dashboard Admin':'Dashboard'}</a><button class="btn sm" id="out">Keluar</button>`:`<a class="btn out sm hide" href="#login">Masuk</a><a class="btn sm" href="#register">Daftar Akun</a>`;
  if(r!==window._last)scrollTo(0,0);window._last=r;
}
// Render ulang saat data Firebase berubah, tapi jangan menghapus isian form yang sedang diketik.
function softRender(){const a=document.activeElement;if(a&&!['aq','af'].includes(a.id)&&$('#app').contains(a)&&/^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName))return;render()}
function go(r){cur=r;try{history.replaceState(null,'','#'+r)}catch{}render()}
addEventListener('hashchange',()=>{cur=location.hash.slice(1)||'home';render()});
$('#menu').onclick=()=>$('#nav').classList.toggle('open');

/* aksi admin: semua ditulis ke Firestore; hak admin dicek lagi oleh firestore.rules di server */
async function aksiAdmin(act,no){
  const x=reg.find(d=>d.no===no);if(!x)return;
  const R=fs.collection('registrations').doc(no),B=fs.collection('bukti').doc(no),F=firebase.firestore.FieldValue;
  try{
    if(act==='ok')await R.update({status:'lunas',tolak:F.delete()});
    else if(act==='batal')await R.update({status:'menunggu'});
    else if(act==='tolak'){const r=prompt('Alasan penolakan (akan terlihat oleh peserta):');if(!r)return;
      const b=fs.batch();b.update(R,{status:'belum',tolak:r,hasBukti:false});b.delete(B);await b.commit()}
    else if(act==='bukti'){const s=await B.get(),d=s.exists?s.data().data:'';
      if(!/^data:image\/(jpeg|png);base64,/.test(d))return alert('Bukti tidak ditemukan.');$('#bImg').src=d;dImg.showModal()}
    else if(act==='hapus'){if(!confirm('Hapus '+x.no+'?'))return;
      const b=fs.batch();b.delete(R);b.delete(B);
      if(x.nisn)b.delete(fs.collection('nisnLocks').doc(x.lid+'_'+x.nisn));
      b.update(fs.collection('counters').doc(x.lid),{aktif:F.increment(-1)});await b.commit()}
  }catch(err){alert(pesanError(err))}
}

document.addEventListener('click',e=>{
  const t=e.target;
  if(t.id==='out'){auth.signOut().then(()=>go('home'));return}
  const f=t.closest('[data-filt]');if(f){filt=f.dataset.filt;render()}
  const p=t.closest('[data-pilih]');if(p)window.pre=p.dataset.pilih;
  const b=t.closest('[data-bayar]');if(b){aktif=reg.find(x=>x.no===b.dataset.bayar);if(aktif)bukaBayar()}
  const a=t.closest('[data-a]');if(a&&user?.role==='admin')aksiAdmin(a.dataset.a,a.dataset.n);
  if(t.id==='csv'&&user?.role==='admin'){
    const c=v=>{v=String(v);if(/^[=+\-@\t\r]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'},  // cegah formula injection di Excel
    rows=[['No','Nama','Email','Lomba','Total','Metode','Status'],...reg.map(x=>[x.no,x.nama,x.email,x.lomba,x.total,x.metode||'',x.status])],l=document.createElement('a');
    l.href=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(c).join(',')).join('\n')],{type:'text/csv'}));l.download='pendaftaran-tensai-2027.csv';l.click()}
  if(t.id==='salin'){navigator.clipboard?.writeText('1234567890');t.textContent='Tersalin'}
  const lk=t.closest('a[href^="#"]');if(lk){e.preventDefault();go(lk.getAttribute('href').slice(1))}
});
document.addEventListener('input',e=>{if(e.target.id==='aq'){const v=e.target.value,pos=v.length;render();const i=$('#aq');i.focus();i.setSelectionRange(pos,pos)}});
document.addEventListener('change',e=>{if(e.target.id==='af')render()});

document.addEventListener('submit',async e=>{
  e.preventDefault();const id=e.target.id,m=$('#msg'),btn=e.target.querySelector('button:not([type=button])');
  if(id==='fLogin'){
    btn.disabled=true;m.textContent='';
    try{await auth.signInWithEmailAndPassword($('#e').value.trim().toLowerCase(),$('#p').value)}   // halaman berpindah otomatis lewat onAuthStateChanged
    catch(err){m.textContent=pesanAuth(err);btn.disabled=false}
  }
  if(id==='fReg'){
    const p=$('#p').value,em=$('#e').value.trim().toLowerCase();
    if(p.length<8||!/[a-z]/i.test(p)||!/\d/.test(p))return m.textContent='Kata sandi minimal 8 karakter, kombinasi huruf dan angka.';
    if(p!==$('#p2').value)return m.textContent='Konfirmasi kata sandi tidak sama.';
    const prof={nama:$('#n').value.trim(),email:em,wa:$('#w').value.replace(/\D/g,''),sekolah:$('#s').value.trim()};
    btn.disabled=true;m.textContent='';pendingProfile=prof;
    try{const c=await auth.createUserWithEmailAndPassword(em,p);await fs.collection('users').doc(c.user.uid).set(prof)}
    catch(err){pendingProfile=null;m.textContent=pesanAuth(err);btn.disabled=false}
  }
  if(id==='fNew'){
    const l=LOMBA.find(x=>x.id===$('#lm').value);btn.disabled=true;
    try{aktif=await buatReg(l,{nama:$('#tm').value.trim(),sekolah:user.sekolah||'',hp:user.wa||''});window.pre='';bukaBayar()}
    catch(err){alert(pesanError(err))}finally{btn.disabled=false}
  }
  if(id==='fDL'){
    const l=LOMBA.find(x=>x.id===$('#dlLomba').value),dm=$('#dlMsg');btn.disabled=true;dm.textContent='';
    try{aktif=await buatReg(l,{nama:$('#dlNama').value.trim(),nisn:$('#dlNisn').value.trim(),sekolah:$('#dlSek').value.trim(),jk:$('#dlJk').value,lahir:$('#dlLahir').value,hp:$('#dlHp').value.replace(/\D/g,'')});
      dReg.close();e.target.reset();bukaBayar()}
    catch(err){dm.textContent=pesanError(err)}finally{btn.disabled=false}
  }
});

function bukaBayar(){$('#bNo').textContent=aktif.no;$('#bInfo').textContent=aktif.lomba+' · '+aktif.nama;$('#bTotal').textContent=rp(aktif.total);
  $('#bMet').value='transfer';met();$('#bMsg').textContent='';$('#bFile').value='';$('#prev').style.display='none';dBayar.showModal()}
function met(){const t=$('#bMet').value==='tunai';$('#bTr').style.display=t?'none':'block';$('#bTu').style.display=t?'block':'none';$('#bUp').style.display=t?'none':'block'}
$('#bMet').onchange=met;
$('#bFile').onchange=e=>{const f=e.target.files[0],m=$('#bMsg');m.textContent='';$('#prev').style.display='none';if(!f)return;
  if(!/^image\/(png|jpeg)$/.test(f.type)){e.target.value='';return m.textContent='Format harus JPG atau PNG.'}
  if(f.size>1048576){e.target.value='';return m.textContent='Ukuran file melebihi 1 MB.'}
  $('#prev').src=URL.createObjectURL(f);$('#prev').style.display='block'};
$('#bOk').onclick=async()=>{const tr=$('#bMet').value==='transfer',f=$('#bFile').files[0],m=$('#bMsg'),btn=$('#bOk');
  if(tr&&!f)return m.textContent='Unggah bukti transfer terlebih dahulu.';
  btn.disabled=true;m.textContent='';
  try{await bayar(aktif,$('#bMet').value,tr?await kompres(f):null);dBayar.close()}
  catch(err){m.textContent=pesanError(err)}finally{btn.disabled=false}};

/* tombol "Daftar" di halaman Perlombaan: buka modal pendaftaran */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-reg]');if(!b)return;
  if(!user)return go('login');
  if(user.role==='admin')return alert('Akun admin tidak dipakai untuk mendaftar lomba.');
  $('#dlSekList').innerHTML=SEKOLAH.map(s=>`<option value="${esc(s)}">`).join('');
  $('#dlLomba').innerHTML=LOMBA.map(x=>`<option value="${x.id}"${x.id===b.dataset.reg?' selected':''}>${x.nama} (${x.jenjang}, ${x.tipe})</option>`).join('');
  $('#dlNama').value=user.nama;$('#dlHp').value=user.wa||'';$('#dlSek').value=user.sekolah||'';$('#dlMsg').textContent='';
  dReg.showModal();
});

render();
startFirebase();
