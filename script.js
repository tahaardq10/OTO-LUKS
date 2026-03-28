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
        kategoriSec(aktifKategori); 
    } catch (e) { console.error("Veri çekme hatası:", e); }
}

function kategoriSec(k) {
    aktifKategori = k;
    let liste = k === 'hepsi' ? ilanlar : ilanlar.filter(i => i.tip === k);
    ilanlariGoster(liste);
}

function ilanlariGoster(liste) {
    const grid = document.getElementById('adsGrid');
    grid.innerHTML = liste.length === 0 ? `<p style="padding:20px;">Henüz ilan yok kanka.</p>` : liste.map(i => kartOlustur(i)).join('');
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

// --- DETAY PENCERESİ (SAHİBİNDEN TARZI TABLO) ---
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
        <h3 style="margin-bottom:15px;">${i.fiyat} TL</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background:#1a1a1a; padding:15px; border-radius:10px; font-size:14px; color:#ddd; border: 1px solid #333;">
            <p><b>📅 Yıl:</b> ${i.yil || '-'}</p>
            <p><b>🛣️ KM:</b> ${i.km || '0'}</p>
            <p><b>⛽ Yakıt:</b> ${i.yakit || '-'}</p>
            <p><b>⚙️ Vites:</b> ${i.vites || '-'}</p>
            <p><b>🎨 Renk:</b> ${i.renk || '-'}</p>
            <p><b>👤 Satıcı:</b> ${i.sahibi}</p>
        </div>

        <a href="https://wa.me/${temizNo}?text=Selam, ${i.marka} ${i.model} ilanı için yazıyorum." target="_blank" class="btn-wp" style="margin-top:20px; display:flex; align-items:center; justify-content:center; gap:10px;">
            <i class="fab fa-whatsapp"></i> WhatsApp'tan Yaz
        </a>
    `;
    modalAc('detayModal');
}

// --- İLAN YAYINLAMA (YENİ ALANLAR DAHİL) ---
async function ilanYayinla() {
    if(!aktifKullanici) return modalAc('loginModal');
    
    const marka = document.getElementById('iMarka').value;
    const model = document.getElementById('iModel').value;
    const fiyat = document.getElementById('iFiyat').value;
    const yil = document.getElementById('iYil').value;
    const km = document.getElementById('iKm').value;
    const yakit = document.getElementById('iYakit').value;
    const vites = document.getElementById('iVites').value;
    const renk = document.getElementById('iRenk').value;
    const tip = document.getElementById('iTip').value;
    const file = document.getElementById('iResim').files[0];

    if(!marka || !file || !fiyat || !yil) return alert("Kanka tüm alanları doldur!");

    const resimData = await resmiSikistir(file);
    const yeniIlan = { 
        id: Date.now(), marka, model, fiyat, yil, km, yakit, vites, renk, tip, resim: resimData, 
        sahibi: aktifKullanici.ad, mail: aktifKullanici.mail, tel: aktifKullanici.tel 
    };

    await fetch(FIREBASE_URL, { method: 'POST', body: JSON.stringify(yeniIlan) });
    location.reload();
}

// --- YARDIMCI FONKSİYONLAR ---
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

window.onload = () => { verileriGetir(); };
