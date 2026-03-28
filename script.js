const FIREBASE_URL = "https://moto-luks-7e3fc-default-rtdb.firebaseio.com/.json";

let ilanlar = [];
let aktifKullanici = JSON.parse(localStorage.getItem('m_aktif')) || null;
let favoriler = JSON.parse(localStorage.getItem('m_favoriler')) || [];
let aktifKategori = 'hepsi';

// --- VERİLERİ ÇEKME ---
async function verileriGetir() {
    try {
        const response = await fetch(FIREBASE_URL);
        const data = await response.json();
        ilanlar = data ? Object.keys(data).map(key => ({...data[key], fireId: key})) : [];
        authGuncelle();
        kategoriSec(aktifKategori);
        sliderGuncelle();
    } catch (e) { console.error("Veri çekme hatası:", e); }
}

// --- KATEGORİ VE ARAMA ---
function kategoriSec(k) {
    aktifKategori = k;
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    document.getElementById('nav-' + k)?.classList.add('active');
    
    let liste = k === 'hepsi' ? ilanlar : ilanlar.filter(i => i.tip === k);
    ilanlariGoster(liste);
    markaListesiGuncelle();
}

function aramaYap() {
    const terim = document.getElementById('searchInput').value.toLowerCase();
    const sonuclar = ilanlar.filter(i => 
        i.marka.toLowerCase().includes(terim) || 
        i.model.toLowerCase().includes(terim)
    );
    ilanlariGoster(sonuclar);
}

function ilanlariGoster(liste) {
    const grid = document.getElementById('adsGrid');
    grid.innerHTML = liste.length === 0 ? `<p style="padding:20px; color:white;">Henüz ilan yok kanka.</p>` : liste.map(i => kartOlustur(i)).join('');
}

function kartOlustur(i) {
    const isFav = favoriler.includes(i.id);
    return `
        <div class="kart" onclick="detayAc(${i.id})">
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); favoriTogle(${i.id})">
                <i class="fas fa-heart"></i>
            </button>
            <img src="${i.resim}">
            <h4>${i.marka} ${i.model}</h4>
            <div class="fiyat">${i.fiyat} TL</div>
            <div style="font-size:11px; color:#888; margin-top:5px;">${i.yil || '2023'} | ${i.km || '0'} KM | ${i.vites || 'Vites'}</div>
        </div>
    `;
}

// --- DETAY PENCERESİ ---
function detayAc(id) {
    const i = ilanlar.find(x => x.id === id);
    if(!i) return;

    let temizNo = i.tel.replace(/\D/g, ''); 
    if(temizNo.startsWith('0')) temizNo = temizNo.substring(1);
    if(!temizNo.startsWith('90')) temizNo = '90' + temizNo;

    document.getElementById('detayIcerik').innerHTML = `
        <span class="close" onclick="modalKapat('detayModal')">&times;</span>
        <img src="${i.resim}" style="width:100%; border-radius:15px; margin-bottom:15px; max-height:300px; object-fit:cover;">
        <h2 style="color:var(--ana-renk)">${i.marka} ${i.model}</h2>
        <h3 style="margin-bottom:15px; color:white;">${i.fiyat} TL</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background:#1a1a1a; padding:15px; border-radius:10px; font-size:14px; color:#ddd; border: 1px solid #333;">
            <p><b>📅 Yıl:</b> ${i.yil || '-'}</p>
            <p><b>🛣️ KM:</b> ${i.km || '0'}</p>
            <p><b>⛽ Yakıt:</b> ${i.yakit || '-'}</p>
            <p><b>⚙️ Vites:</b> ${i.vites || '-'}</p>
            <p><b>🎨 Renk:</b> ${i.renk || '-'}</p>
            <p><b>👤 Satıcı:</b> ${i.sahibi}</p>
        </div>

        <a href="https://wa.me/${temizNo}?text=Selam, ${i.marka} ${i.model} ilanı için yazıyorum." target="_blank" class="btn-wp" style="margin-top:20px; display:flex; align-items:center; justify-content:center; gap:10px; text-decoration:none;">
            <i class="fab fa-whatsapp"></i> WhatsApp'tan Yaz
        </a>
    `;
    modalAc('detayModal');
}

// --- OTURUM VE PROFİL ---
function authGuncelle() {
    const authSec = document.getElementById('authSection');
    if(aktifKullanici) {
        authSec.innerHTML = `<button onclick="profilGoster()" class="btn-profil"><i class="fas fa-user"></i> ${aktifKullanici.ad}</button>`;
    } else {
        authSec.innerHTML = `<button onclick="modalAc('loginModal')" class="btn-ana">GİRİŞ YAP</button>`;
    }
}

function oturumAc() {
    const ad = document.getElementById('uAd').value;
    const mail = document.getElementById('uMail').value;
    const tel = document.getElementById('uTel').value;
    if(!ad || !tel) return alert("İsim ve telefon şart kanka!");
    
    aktifKullanici = { ad, mail, tel };
    localStorage.setItem('m_aktif', JSON.stringify(aktifKullanici));
    location.reload();
}

function profilGoster() {
    if(!aktifKullanici) return modalAc('loginModal');
    document.getElementById('profilHeader').innerHTML = `
        <div class="profil-kart" style="background:var(--kart-arka); padding:20px; border-radius:15px; margin-bottom:20px; border:1px solid var(--ana-renk);">
            <h2>Hoş geldin, ${aktifKullanici.ad}!</h2>
            <p>Telefon: ${aktifKullanici.tel}</p>
            <button onclick="cikisYap()" class="btn-ana" style="background:#ff4444; margin-top:10px;">ÇIKIŞ YAP</button>
        </div>
        <h3 style="color:var(--ana-renk); margin-bottom:15px;">İlanların ve Favorilerin</h3>
    `;
    const benimkiler = ilanlar.filter(i => i.sahibi === aktifKullanici.ad || favoriler.includes(i.id));
    ilanlariGoster(benimkiler);
}

function cikisYap() {
    localStorage.removeItem('m_aktif');
    location.reload();
}

function ilanVerKontrol() {
    aktifKullanici ? modalAc('ilanVerModal') : modalAc('loginModal');
}

// --- İLAN YAYINLAMA ---
async function ilanYayinla() {
    const btn = document.getElementById('yayinBtn');
    const durum = document.getElementById('yuklemeDurumu');
    
    const veriler = {
        marka: document.getElementById('iMarka').value,
        model: document.getElementById('iModel').value,
        fiyat: document.getElementById('iFiyat').value,
        yil: document.getElementById('iYil').value,
        km: document.getElementById('iKm').value,
        yakit: document.getElementById('iYakit').value,
        vites: document.getElementById('iVites').value,
        renk: document.getElementById('iRenk').value,
        tip: document.getElementById('iTip').value,
        file: document.getElementById('iResim').files[0]
    };

    if(!veriler.marka || !veriler.file || !veriler.fiyat) return alert("Eksikleri doldur kanka!");

    btn.disabled = true;
    durum.style.display = 'block';

    const resimData = await resmiSikistir(veriler.file);
    const yeniIlan = { 
        ...veriler, 
        id: Date.now(), 
        resim: resimData, 
        sahibi: aktifKullanici.ad, 
        tel: aktifKullanici.tel,
        file: null // Dosya objesini siliyoruz
    };

    await fetch(FIREBASE_URL, { method: 'POST', body: JSON.stringify(yeniIlan) });
    location.reload();
}

// --- YAN MENÜ VE SLIDER ---
function markaListesiGuncelle() {
    const list = document.getElementById('brandList');
    const markalar = [...new Set(ilanlar.filter(i => aktifKategori === 'hepsi' || i.tip === aktifKategori).map(i => i.marka))];
    list.innerHTML = markalar.map(m => `<li onclick="markaFiltrele('${m}')">${m}</li>`).join('');
}

function markaFiltrele(m) {
    const sonuclar = ilanlar.filter(i => i.marka === m);
    ilanlariGoster(sonuclar);
}

function sliderGuncelle() {
    const track = document.getElementById('sliderTrack');
    const slaytlar = ilanlar.slice(-5); // Son 5 ilan
    track.innerHTML = slaytlar.map(i => `<img src="${i.resim}" onclick="detayAc(${i.id})" title="${i.marka}">`).join('');
}

// --- ARAÇLAR ---
async function resmiSikistir(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 500;
                const scale = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
        };
    });
}

function modalAc(id) { document.getElementById(id).style.display = 'block'; }
function modalKapat(id) { document.getElementById(id).style.display = 'none'; }
function favoriTogle(id) {
    const idx = favoriler.indexOf(id);
    idx > -1 ? favoriler.splice(idx, 1) : favoriler.push(id);
    localStorage.setItem('m_favoriler', JSON.stringify(favoriler));
    verileriGetir();
}

window.onload = verileriGetir;
