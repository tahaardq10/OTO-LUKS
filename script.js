const FIREBASE_URL = "https://moto-luks-7e3fc-default-rtdb.firebaseio.com/.json";

let ilanlar = [];
let aktifKullanici = JSON.parse(localStorage.getItem('m_aktif')) || null;
let favoriler = JSON.parse(localStorage.getItem('m_favoriler')) || [];
let aktifKategori = 'hepsi';
let aktifProfilSekme = 'ilanlarim';

const sabitMarkalar = {
    araba: ["BMW", "Mercedes", "Audi", "Volkswagen", "Toyota", "Honda", "Fiat", "Renault", "Ford", "Hyundai"],
    motor: ["Honda", "Yamaha", "Kawasaki", "Suzuki", "Ducati", "Aprilia", "KTM", "BMW Motorrad", "Bajaj", "TVS"]
};

// --- VERİ ÇEKME VE FİLTRELEME ---
async function verileriGetir() {
    try {
        const response = await fetch(FIREBASE_URL);
        const data = await response.json();
        ilanlar = data ? Object.keys(data).map(key => ({...data[key], fireId: key})) : [];
        
        // Veri geldikten sonra mevcut filtreye veya profile göre göster
        if(aktifKategori === 'profil') {
            profilGoster();
        } else {
            kategoriSec(aktifKategori); 
        }
    } catch (e) { console.error("Veri hatası:", e); }
}

function kategoriSec(k) {
    aktifKategori = k;
    // Menüdeki aktiflik durumunu güncelle
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    const navEl = document.getElementById('nav-' + k);
    if(navEl) navEl.classList.add('active');

    // Sadece seçili kategoriye ait (veya hepsi) ilanları filtrele
    let liste = k === 'hepsi' ? ilanlar : ilanlar.filter(i => i.tip === k);
    ilanlariGoster(liste);
}

function ilanlariGoster(liste) {
    const header = document.getElementById('profilHeader');
    if(aktifKategori !== 'profil') header.innerHTML = ""; // Profil dışındaysak profil başlığını sil
    
    const grid = document.getElementById('adsGrid');
    grid.innerHTML = liste.length === 0 ? `<p style="padding:20px;">İlan bulunamadı kanka.</p>` : liste.map(i => kartOlustur(i)).join('');
    
    sidebarGuncelle();
    vitrinGuncelle(liste);
}

// --- PROFİL VE OTURUM İŞLEMLERİ ---
function oturumAc() {
    const ad = document.getElementById('uAd').value;
    const mail = document.getElementById('uMail').value;
    const tel = document.getElementById('uTel').value; // Burası artık kritik
          
    if(!ad || !mail || !tel) return alert("Kanka isim, mail ve özellikle telefon numaranı girmelisin!");
    
    aktifKullanici = { ad, mail, tel };
    localStorage.setItem('m_aktif', JSON.stringify(aktifKullanici));
    alert("Giriş başarılı, hoş geldin!");
    location.reload();
}

function cikisYap() {
    localStorage.removeItem('m_aktif');
    aktifKullanici = null;
    alert("Çıkış yapıldı. Yine bekleriz kanka!");
    location.reload();
}

function profilGoster() {
    if(!aktifKullanici) return modalAc('loginModal');
    aktifKategori = 'profil';
    
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    document.getElementById('nav-profil').classList.add('active');
    
    const header = document.getElementById('profilHeader');
    header.innerHTML = `
        <div class="user-info-card" style="background:var(--kart-arka); padding:20px; border-radius:15px; border:1px solid var(--ana-renk); margin-bottom:20px;">
            <h2 style="color:var(--ana-renk)">👤 Profilim</h2>
            <p><b>İsim:</b> ${aktifKullanici.ad}</p>
            <p><b>WhatsApp:</b> ${aktifKullanici.tel}</p>
            <button onclick="cikisYap()" class="btn-sil" style="margin-top:10px;">GÜVENLİ ÇIKIŞ</button>
        </div>
        <div class="profile-tabs" style="display:flex; gap:10px; margin-bottom:20px;">
            <button class="btn-ana" onclick="profilSekmeDegis('ilanlarim')">İlanlarım</button>
            <button class="btn-ana" onclick="profilSekmeDegis('favorilerim')">Favorilerim</button>
        </div>
    `;
    profilSekmeDegis(aktifProfilSekme);
}

// --- WHATSAPP VE DETAYLAR ---
function detayAc(id) {
    const i = ilanlar.find(x => x.id === id);
    if(!i) return;

    // Numaranın başındaki 0'ı atıp 90 ekleyen güvenli format
    let temizNo = i.tel.replace(/\D/g, ''); 
    if(temizNo.startsWith('0')) temizNo = temizNo.substring(1);
    if(!temizNo.startsWith('90')) temizNo = '90' + temizNo;

    document.getElementById('detayIcerik').innerHTML = `
        <span class="close" onclick="modalKapat('detayModal')">&times;</span>
        <img src="${i.resim}" style="width:100%; max-height:400px; object-fit:cover; border-radius:15px;">
        <h2 style="color:var(--ana-renk); margin-top:15px;">${i.marka} ${i.model}</h2>
        <h3 style="color:#fff;">${i.fiyat} TL</h3>
        <p style="color:#bbb;">Satıcı: <b>${i.sahibi}</b></p>
        <a href="https://wa.me/${temizNo}?text=Selam, ${i.marka} ${i.model} ilanınız için MotoLÜKS üzerinden ulaşıyorum." target="_blank" class="btn-wp">
            <i class="fab fa-whatsapp"></i> WhatsApp'tan Yaz
        </a>
    `;
    modalAc('detayModal');
}

// --- DİĞER FONKSİYONLAR ---
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
        </div>
    `;
}

function sidebarGuncelle() {
    const list = document.getElementById('brandList');
    if(!list) return;
    let mList = aktifKategori === 'araba' ? sabitMarkalar.araba : (aktifKategori === 'motor' ? sabitMarkalar.motor : [...sabitMarkalar.araba, ...sabitMarkalar.motor].slice(0,10));
    list.innerHTML = mList.map(m => `<li onclick="markaFiltrele('${m}')">${m}</li>`).join('');
}

function markaFiltrele(m) {
    const filtrelenmis = ilanlar.filter(i => i.marka === m);
    ilanlariGoster(filtrelenmis);
}

function vitrinGuncelle(liste) {
    const track = document.getElementById('sliderTrack');
    if(!track) return;
    track.innerHTML = liste.slice(0, 10).map(i => `<div class="slider-item"><img src="${i.resim}"></div>`).join('');
}

function profilSekmeDegis(sekme) {
    aktifProfilSekme = sekme;
    let liste = sekme === 'ilanlarim' 
        ? ilanlar.filter(i => i.mail === aktifKullanici.mail)
        : ilanlar.filter(i => favoriler.includes(i.id));
    
    const grid = document.getElementById('adsGrid');
    grid.innerHTML = liste.length === 0 ? `<p style="text-align:center; width:100%;">Henüz bir kayıt yok.</p>` : liste.map(i => kartOlustur(i)).join('');
}

function favoriTogle(id) {
    if(!aktifKullanici) return modalAc('loginModal');
    const idx = favoriler.indexOf(id);
    idx > -1 ? favoriler.splice(idx, 1) : favoriler.push(id);
    localStorage.setItem('m_favoriler', JSON.stringify(favoriler));
    verileriGetir();
}

function authKontrol() {
    const div = document.getElementById('authSection');
    div.innerHTML = aktifKullanici ? `<span onclick="profilGoster()" style="color:var(--ana-renk); cursor:pointer; font-weight:bold;">👤 ${aktifKullanici.ad}</span>` : `<button onclick="modalAc('loginModal')" class="btn-ana" style="padding:10px 20px;">Giriş Yap</button>`;
}

async function ilanYayinla() {
    const marka = document.getElementById('iMarka').value, model = document.getElementById('iModel').value, fiyat = document.getElementById('iFiyat').value, tip = document.getElementById('iTip').value, file = document.getElementById('iResim').files[0];
    if(!marka || !file || !fiyat) return alert("Eksikleri doldur!");
    
    document.getElementById('yayinBtn').disabled = true;
    document.getElementById('yuklemeDurumu').style.display = 'block';
    
    const resimData = await resmiSikistir(file);
    const yeniIlan = { 
        id: Date.now(), marka, model, fiyat, tip, resim: resimData, 
        sahibi: aktifKullanici.ad, mail: aktifKullanici.mail, tel: aktifKullanici.tel 
    };
    
    await fetch(FIREBASE_URL, { method: 'POST', body: JSON.stringify(yeniIlan) });
    location.reload();
}

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

function aramaYap() {
    const metin = document.getElementById('searchInput').value.toLowerCase();
    const sonuc = ilanlar.filter(i => i.marka.toLowerCase().includes(metin) || i.model.toLowerCase().includes(metin));
    ilanlariGoster(sonuc);
}

function modalAc(id) { document.getElementById(id).style.display = 'block'; }
function modalKapat(id) { document.getElementById(id).style.display = 'none'; }
function ilanVerKontrol() { if(!aktifKullanici) modalAc('loginModal'); else modalAc('ilanVerModal'); }

window.onload = () => { authKontrol(); verileriGetir(); };
