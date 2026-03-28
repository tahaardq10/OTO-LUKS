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

// Verileri Buluttan Çek
async function verileriGetir() {
    try {
        const response = await fetch(FIREBASE_URL);
        const data = await response.json();
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

async function ilanYayinla() {
    const marka = document.getElementById('iMarka').value, 
          model = document.getElementById('iModel').value, 
          fiyat = document.getElementById('iFiyat').value, 
          tip = document.getElementById('iTip').value, 
          file = document.getElementById('iResim').files[0];

    if(!marka || !file || !fiyat || !aktifKullanici) return alert("Eksikleri doldur kanka!");
    
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

function ilanlariGoster(liste) {
    const grid = document.getElementById('adsGrid');
    if(!grid) return;
    document.getElementById('profilHeader').innerHTML = ""; 
    grid.innerHTML = liste.length === 0 ? `<p style="color:#666">Henüz ilan yok kanka.</p>` : liste.map(i => kartOlustur(i)).join('');
    sidebarGuncelle();
    vitrinGuncelle(liste);
}

function kartOlustur(i) {
    const isFav = favoriler.includes(i.id);
    return `
        <div class="kart" onclick="detayAc(${i.id})">
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); favoriTogle(${i.id})">
                <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
            </button>
            <img src="${i.resim}">
            <h4>${i.marka} ${i.model}</h4>
            <div class="fiyat">${i.fiyat} TL</div>
        </div>
    `;
}

function oturumAc() {
    const ad = document.getElementById('uAd').value, mail = document.getElementById('uMail').value, tel = document.getElementById('uTel').value;
    if(!ad || !mail || !tel) return alert("Eksik bilgi!");
    aktifKullanici = { ad, mail, tel };
    localStorage.setItem('m_aktif', JSON.stringify(aktifKullanici));
    location.reload();
}

function authKontrol() {
    const div = document.getElementById('authSection');
    if(!div) return;
    div.innerHTML = aktifKullanici 
        ? `<span onclick="profilGoster()" style="color:var(--ana-renk); cursor:pointer;">${aktifKullanici.ad}</span>` 
        : `<button onclick="modalAc('loginModal')" class="btn-ana" style="padding:10px 20px;">Giriş Yap</button>`;
}

function favoriTogle(id) {
    if(!aktifKullanici) return modalAc('loginModal');
    const idx = favoriler.indexOf(id);
    if(idx > -1) favoriler.splice(idx, 1);
    else favoriler.push(id);
    localStorage.setItem('m_favoriler', JSON.stringify(favoriler));
    verileriGetir();
}

function kategoriSec(k) {
    aktifKategori = k;
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    document.getElementById('nav-' + k).classList.add('active');
    verileriGetir();
}

function sidebarGuncelle() {
    const list = document.getElementById('brandList');
    if(!list) return;
    let mList = aktifKategori === 'araba' ? sabitMarkalar.araba : (aktifKategori === 'motor' ? sabitMarkalar.motor : [...sabitMarkalar.araba, ...sabitMarkalar.motor].slice(0,10));
    list.innerHTML = mList.map(m => `<li onclick="markaFiltrele('${m}')">${m}</li>`).join('');
}

function markaFiltrele(m) {
    const s = ilanlar.filter(i => i.marka.toLowerCase() === m.toLowerCase());
    ilanlariGoster(s);
}

function detayAc(id) {
    const i = ilanlar.find(x => x.id === id);
    document.getElementById('detayIcerik').innerHTML = `
        <span class="close" onclick="modalKapat('detayModal')">&times;</span>
        <img src="${i.resim}" style="width:100%; border-radius:15px; border:1px solid var(--ana-renk);">
        <h2 style="color:var(--ana-renk)">${i.marka} ${i.model}</h2>
        <h3>${i.fiyat} TL</h3>
        <p>Satıcı: ${i.sahibi}</p>
        <a href="https://wa.me/${i.tel}?text=Selam%20${i.sahibi},%20OTOLUKS%20ilanın%20için%20yazıyorum." target="_blank" class="btn-wp">WhatsApp'tan Yaz</a>
    `;
    modalAc('detayModal');
}

function vitrinGuncelle(liste) {
    const track = document.getElementById('sliderTrack');
    if(!track) return;
    track.innerHTML = liste.slice(0, 10).map(i => `<div class="slider-item"><img src="${i.resim}"></div>`).join('');
}

function modalAc(id) { document.getElementById(id).style.display = 'block'; }
function modalKapat(id) { document.getElementById(id).style.display = 'none'; }
function ilanVerKontrol() { if(!aktifKullanici) modalAc('loginModal'); else modalAc('ilanVerModal'); }

window.onload = () => { authKontrol(); verileriGetir(); };
