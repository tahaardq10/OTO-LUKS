const FIREBASE_URL = "https://moto-luks-7e3fc-default-rtdb.firebaseio.com/.json";

let ilanlar = [];
let aktifKullanici = JSON.parse(localStorage.getItem('m_aktif')) || null;
let favoriler = JSON.parse(localStorage.getItem('m_favoriler')) || [];
let aktifKategori = 'hepsi';

// --- VERİ ÇEKME ---
async function verileriGetir() {
    try {
        const response = await fetch(FIREBASE_URL);
        const data = await response.json();
        ilanlar = data ? Object.keys(data).map(key => ({...data[key], fireId: key})) : [];
        
        // Önce arayüzü hazırla
        authGuncelle();
        kategoriSec('hepsi');
        
        // Hata vermemesi için slider kontrolü
        const track = document.getElementById('sliderTrack');
        if(track) sliderGuncelle();
        
    } catch (e) { 
        console.error("Veri çekme hatası:", e); 
    }
}

// --- GİRİŞ / ÇIKIŞ ---
function authGuncelle() {
    const authSec = document.getElementById('authSection');
    if(!authSec) return;

    if(aktifKullanici) {
        authSec.innerHTML = `<button onclick="profilGoster()" class="btn-profil"><i class="fas fa-user"></i> ${aktifKullanici.ad}</button>`;
    } else {
        authSec.innerHTML = `<button onclick="modalAc('loginModal')" class="btn-ana">GİRİŞ YAP</button>`;
    }
}

function oturumAc() {
    const ad = document.getElementById('uAd').value;
    const tel = document.getElementById('uTel').value;
    
    if(!ad || !tel) {
        alert("Kanka adını ve telefonunu yazman lazım!");
        return;
    }
    
    aktifKullanici = { ad, tel };
    localStorage.setItem('m_aktif', JSON.stringify(aktifKullanici));
    location.reload();
}

// --- İLAN İŞLEMLERİ ---
function kategoriSec(k) {
    aktifKategori = k;
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(a => a.classList.remove('active'));
    
    const aktifLink = document.getElementById('nav-' + k);
    if(aktifLink) aktifLink.classList.add('active');
    
    let liste = k === 'hepsi' ? ilanlar : ilanlar.filter(i => i.tip === k);
    ilanlariGoster(liste);
    markaListesiGuncelle();
}

function ilanlariGoster(liste) {
    const grid = document.getElementById('adsGrid');
    if(!grid) return;

    grid.innerHTML = liste.length === 0 ? `<p style="color:white; padding:20px;">İlan bulunamadı kanka.</p>` : liste.map(i => `
        <div class="kart" onclick="detayAc(${i.id})">
            <img src="${i.resim}">
            <h4>${i.marka} ${i.model}</h4>
            <div class="fiyat">${i.fiyat} TL</div>
            <div style="font-size:11px; color:#888; margin-top:5px;">${i.yil || '2024'} | ${i.km || '0'} KM</div>
        </div>
    `).join('');
}

function detayAc(id) {
    const i = ilanlar.find(x => x.id === id);
    if(!i) return;

    const detayModal = document.getElementById('detayIcerik');
    if(!detayModal) return;

    let temizNo = i.tel ? i.tel.replace(/\D/g, '') : "905526085730";
    if(!temizNo.startsWith('90')) temizNo = '90' + temizNo;

    detayModal.innerHTML = `
        <span class="close" onclick="modalKapat('detayModal')">&times;</span>
        <img src="${i.resim}" style="width:100%; border-radius:10px; margin-bottom:15px; max-height:300px; object-fit:cover;">
        <h2 style="color:var(--ana-renk)">${i.marka} ${i.model}</h2>
        <h3 style="color:white; margin-bottom:10px;">${i.fiyat} TL</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; background:#1a1a1a; padding:15px; border-radius:10px; color:#ccc; font-size:14px;">
            <p><b>Yıl:</b> ${i.yil || '-'}</p>
            <p><b>KM:</b> ${i.km || '0'}</p>
            <p><b>Yakıt:</b> ${i.yakit || '-'}</p>
            <p><b>Vites:</b> ${i.vites || '-'}</p>
            <p><b>Renk:</b> ${i.renk || '-'}</p>
            <p><b>Satıcı:</b> ${i.sahibi}</p>
        </div>
        <a href="https://wa.me/${temizNo}" target="_blank" class="btn-wp" style="margin-top:20px; display:block; text-align:center; text-decoration:none; color:white; background:#25d366; padding:10px; border-radius:5px;">
            <i class="fab fa-whatsapp"></i> WhatsApp'tan Yaz
        </a>
    `;
    modalAc('detayModal');
}

async function ilanYayinla() {
    const btn = document.getElementById('yayinBtn');
    const fileInput = document.getElementById('iResim');
    const marka = document.getElementById('iMarka').value;

    if(!marka || !fileInput.files[0]) {
        alert("Marka ve resim şart kanka!");
        return;
    }

    btn.disabled = true;
    const durum = document.getElementById('yuklemeDurumu');
    if(durum) durum.style.display = 'block';

    const reader = new FileReader();
    reader.readAsDataURL(fileInput.files[0]);
    reader.onload = async (e) => {
        const yeniIlan = {
            id: Date.now(),
            marka,
            model: document.getElementById('iModel').value,
            fiyat: document.getElementById('iFiyat').value,
            yil: document.getElementById('iYil').value,
            km: document.getElementById('iKm').value,
            yakit: document.getElementById('iYakit').value,
            vites: document.getElementById('iVites').value,
            renk: document.getElementById('iRenk').value,
            tip: document.getElementById('iTip').value,
            resim: e.target.result,
            sahibi: aktifKullanici ? aktifKullanici.ad : "Anonim",
            tel: aktifKullanici ? aktifKullanici.tel : "905526085730"
        };

        try {
            await fetch(FIREBASE_URL, { method: 'POST', body: JSON.stringify(yeniIlan) });
            location.reload();
        } catch (error) {
            alert("Hata oluştu kanka!");
            btn.disabled = false;
        }
    };
}

// --- DİĞER FONKSİYONLAR ---
function aramaYap() {
    const t = document.getElementById('searchInput').value.toLowerCase();
    const filtrelenmis = ilanlar.filter(i => 
        i.marka.toLowerCase().includes(t) || 
        i.model.toLowerCase().includes(t)
    );
    ilanlariGoster(filtrelenmis);
}

function markaListesiGuncelle() {
    const list = document.getElementById('brandList');
    if(!list) return;
    const markalar = [...new Set(ilanlar.map(i => i.marka))];
    list.innerHTML = markalar.map(m => `<li onclick="ilanlariGoster(ilanlar.filter(x=>x.marka==='${m}'))">${m}</li>`).join('');
}

function sliderGuncelle() {
    const track = document.getElementById('sliderTrack');
    if(!track) return;
    track.innerHTML = ilanlar.slice(-5).map(i => `<img src="${i.resim}" onclick="detayAc(${i.id})" style="cursor:pointer;">`).join('');
}

function profilGoster() {
    const header = document.getElementById('profilHeader');
    if(!header) return;
    header.innerHTML = `
        <div style="background:#222; padding:20px; border-radius:10px; margin-bottom:20px; border: 1px solid var(--ana-renk);">
            <h3>Hoş geldin, ${aktifKullanici.ad}!</h3>
            <button onclick="localStorage.removeItem('m_aktif'); location.reload();" class="btn-ana" style="background:#ff4444; width:auto; padding:5px 15px;">ÇIKIŞ YAP</button>
        </div>
    `;
    const benimkiler = ilanlar.filter(i => i.sahibi === aktifKullanici.ad);
    ilanlariGoster(benimkiler);
}

function ilanVerKontrol() { aktifKullanici ? modalAc('ilanVerModal') : modalAc('loginModal'); }
function modalAc(id) { 
    const m = document.getElementById(id);
    if(m) m.style.display = 'block'; 
}
function modalKapat(id) { 
    const m = document.getElementById(id);
    if(m) m.style.display = 'none'; 
}

window.onload = verileriGetir;