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

// Verileri Buluttan Çek (Hoca için kritik kısım)
async function verileriGetir() {
    try {
        const response = await fetch(FIREBASE_URL);
        const data = await response.json();
        // Firebase veriyi obje olarak verir, diziye çeviriyoruz
        ilanlar = data ? Object.keys(data).map(key => ({...data[key], fireId: key})) : [];
        if(aktifKategori === 'profil') profilGoster();
        else ilanlariGoster(ilanlar);
    } catch (e) { console.error("Veri hatası:", e); }
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
                const MAX_WIDTH = 500; // Firebase kotası için boyutu optimize ettik
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
            <p><b>E-posta:</b> ${aktifKullanici.mail}</p>
            <p><b>WhatsApp:</b> ${aktifKullanici.tel}</p>
            <button onclick="cikisYap()" class="btn-sil" style="position:static;">Çıkış Yap</button>
        </div>
        <div class="profile-tabs">
            <div class="tab-link ${aktifProfilSekme === 'ilanlarim' ? 'active' : ''}" onclick="profilSekmeDegis('ilanlarim')">İlanlarım</div>
            <div class="tab-link ${aktifProfilSekme === 'favorilerim' ? 'active' : ''}" onclick="profilSekmeDegis('favorilerim')">Favorilerim</div>
        </div>
    `;
    profilSekmeDegis(aktifProfilSekme);
}

function profilSekmeDegis(sekme) {
    aktifProfilSekme = sekme;
    let liste = sekme === 'ilanlarim' 
        ? ilanlar.filter(i => i.mail === aktifKullanici.mail)
        : ilanlar.filter(i => favoriler.includes(i.id));
    
    const grid = document.getElementById('adsGrid');
    grid.innerHTML = liste.length === 0 ? `<p>Henüz bir şey yok kanka.</p>` : liste.map(i => kartOlustur(i)).join('');
}

function kartOlustur(i) {
    const isFav = favoriler.includes(i.id);
    return `
        <div class="kart" onclick="detayAc(${i.id})">
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); favoriTogle(${i.id})"><i class="fas fa-heart"></i></button>
            <img src="${i.resim}">
            <h4>${i.marka} ${i.model}</h4>
            <div class="fiyat">${i.fiyat} TL</div>
        </div>
    `;
}

function ilanlariGoster(liste) {
    document.getElementById('profilHeader').innerHTML = "";
    const grid = document.getElementById('adsGrid');
    grid.innerHTML = liste.map(i => kartOlustur(i)).join('');
    sidebarGuncelle();
    vitrinGuncelle(liste);
}

function authKontrol() {
    const div = document.getElementById('authSection');
    div.innerHTML = aktifKullanici ? `<span onclick="profilGoster()" style="color:var(--ana-renk); cursor:pointer;">${aktifKullanici.ad}</span>` : `<button onclick="modalAc('loginModal')" class="btn-ana" style="padding:10px 20px;">Giriş Yap</button>`;
}

function oturumAc() {
    const ad = document.getElementById('uAd').value, mail = document.getElementById('uMail').value, tel = document.getElementById('uTel').value;
    if(!ad || !mail || !tel) return alert("Eksik bilgi!");
    aktifKullanici = { ad, mail, tel };
    localStorage.setItem('m_aktif', JSON.stringify(aktifKullanici));
    location.reload();
}

function favoriTogle(id) {
    if(!aktifKullanici) return modalAc('loginModal');
    const idx = favoriler.indexOf(id);
    idx > -1 ? favoriler.splice(idx, 1) : favoriler.push(id);
    localStorage.setItem('m_favoriler', JSON.stringify(favoriler));
    verileriGetir();
}

function kategoriSec(k) {
    aktifKategori = k;
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    document.getElementById('nav-' + k).classList.add('active');
    let liste = k === 'hepsi' ? ilanlar : ilanlar.filter(i => i.tip === k);
    ilanlariGoster(liste);
}

function sidebarGuncelle() {
    const list = document.getElementById('brandList');
    let mList = aktifKategori === 'araba' ? sabitMarkalar.araba : (aktifKategori === 'motor' ? sabitMarkalar.motor : [...sabitMarkalar.araba, ...sabitMarkalar.motor].slice(0,10));
    list.innerHTML = mList.map(m => `<li onclick="markaFiltrele('${m}')">${m}</li>`).join('');
}

function markaFiltrele(m) {
    ilanlariGoster(ilanlar.filter(i => i.marka === m));
}

function vitrinGuncelle(liste) {
    const track = document.getElementById('sliderTrack');
    track.innerHTML = liste.slice(0, 10).map(i => `<div class="slider-item"><img src="${i.resim}"></div>`).join('');
}

function detayAc(id) {
    const i = ilanlar.find(x => x.id === id);
    document.getElementById('detayIcerik').innerHTML = `
        <span class="close" onclick="modalKapat('detayModal')">&times;</span>
        <img src="${i.resim}" style="width:100%; border-radius:15px;">
        <h2 style="color:var(--ana-renk)">${i.marka} ${i.model}</h2>
        <h3>${i.fiyat} TL</h3>
        <p>Satıcı: ${i.sahibi}</p>
        <a href="https://wa.me/${i.tel}" target="_blank" class="btn-wp">WhatsApp'tan Yaz</a>
    `;
    modalAc('detayModal');
}

function modalAc(id) { document.getElementById(id).style.display = 'block'; }
function modalKapat(id) { document.getElementById(id).style.display = 'none'; }
function cikisYap() { localStorage.removeItem('m_aktif'); location.reload(); }
function ilanVerKontrol() { if(!aktifKullanici) modalAc('loginModal'); else modalAc('ilanVerModal'); }

window.onload = () => { authKontrol(); verileriGetir(); };