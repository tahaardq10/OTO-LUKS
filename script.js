const FIREBASE_URL = "https://moto-luks-7e3fc-default-rtdb.firebaseio.com/.json";

let ilanlar = [];
let aktifKullanici = JSON.parse(localStorage.getItem('m_aktif')) || null;
let favoriler = JSON.parse(localStorage.getItem('m_favoriler')) || [];
let aktifKategori = 'hepsi';

async function verileriGetir() {
    try {
        const response = await fetch(FIREBASE_URL);
        const data = await response.json();
        ilanlar = data ? Object.keys(data).map(key => ({...data[key], fireId: key})) : [];
        authGuncelle();
        kategoriSec('hepsi');
        sliderGuncelle();
    } catch (e) { console.error("Hata:", e); }
}

function authGuncelle() {
    const authSec = document.getElementById('authSection');
    if(aktifKullanici) {
        authSec.innerHTML = `<button onclick="profilGoster()" class="btn-profil"><i class="fas fa-user"></i> ${aktifKullanici.ad}</button>`;
    } else {
        authSec.innerHTML = `<button onclick="modalAc('loginModal')" class="btn-ana">GİRİŞ YAP</button>`;
    }
}

function kategoriSec(k) {
    aktifKategori = k;
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    document.getElementById('nav-' + k)?.classList.add('active');
    let liste = k === 'hepsi' ? ilanlar : ilanlar.filter(i => i.tip === k);
    ilanlariGoster(liste);
    markaListesiGuncelle();
}

function ilanlariGoster(liste) {
    const grid = document.getElementById('adsGrid');
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
    let temizNo = i.tel ? i.tel.replace(/\D/g, '') : "905526085730";
    if(!temizNo.startsWith('90')) temizNo = '90' + temizNo;

    document.getElementById('detayIcerik').innerHTML = `
        <span class="close" onclick="modalKapat('detayModal')">&times;</span>
        <img src="${i.resim}" style="width:100%; border-radius:10px; margin-bottom:15px;">
        <h2 style="color:var(--ana-renk)">${i.marka} ${i.model}</h2>
        <h3 style="color:white;">${i.fiyat} TL</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; background:#1a1a1a; padding:15px; border-radius:10px; margin-top:15px; color:#ccc;">
            <p><b>Yıl:</b> ${i.yil || '-'}</p>
            <p><b>KM:</b> ${i.km || '0'}</p>
            <p><b>Yakıt:</b> ${i.yakit || '-'}</p>
            <p><b>Vites:</b> ${i.vites || '-'}</p>
            <p><b>Renk:</b> ${i.renk || '-'}</p>
            <p><b>Satıcı:</b> ${i.sahibi}</p>
        </div>
        <a href="https://wa.me/${temizNo}" target="_blank" class="btn-wp" style="margin-top:20px; display:block; text-align:center; text-decoration:none;">WhatsApp'tan Yaz</a>
    `;
    modalAc('detayModal');
}

async function ilanYayinla() {
    const btn = document.getElementById('yayinBtn');
    const marka = document.getElementById('iMarka').value;
    const file = document.getElementById('iResim').files[0];
    if(!marka || !file) return alert("Eksikleri doldur kanka!");

    btn.disabled = true;
    document.getElementById('yuklemeDurumu').style.display = 'block';

    const reader = new FileReader();
    reader.readAsDataURL(file);
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
            sahibi: aktifKullanici.ad,
            tel: aktifKullanici.tel
        };
        await fetch(FIREBASE_URL, { method: 'POST', body: JSON.stringify(yeniIlan) });
        location.reload();
    };
}

function oturumAc() {
    const ad = document.getElementById('uAd').value;
    const tel = document.getElementById('uTel').value;
    if(!ad || !tel) return alert("Ad ve Tel lazım kanka!");
    aktifKullanici = { ad, tel };
    localStorage.setItem('m_aktif', JSON.stringify(aktifKullanici));
    location.reload();
}

function profilGoster() {
    document.getElementById('profilHeader').innerHTML = `
        <div style="background:#222; padding:20px; border-radius:10px; margin-bottom:20px;">
            <h3>Hoş geldin ${aktifKullanici.ad}</h3>
            <button onclick="localStorage.removeItem('m_aktif'); location.reload();" class="btn-ana" style="background:red;">ÇIKIŞ YAP</button>
        </div>
    `;
    const benimkiler = ilanlar.filter(i => i.sahibi === aktifKullanici.ad);
    ilanlariGoster(benimkiler);
}

function aramaYap() {
    const t = document.getElementById('searchInput').value.toLowerCase();
    ilanlariGoster(ilanlar.filter(i => i.marka.toLowerCase().includes(t) || i.model.toLowerCase().includes(t)));
}

function markaListesiGuncelle() {
    const list = document.getElementById('brandList');
    const markalar = [...new Set(ilanlar.map(i => i.marka))];
    list.innerHTML = markalar.map(m => `<li onclick="ilanlariGoster(ilanlar.filter(x=>x.marka==='${m}'))">${m}</li>`).join('');
}

function sliderGuncelle() {
    document.getElementById('sliderTrack').innerHTML = ilanlar.slice(-3).map(i => `<img src="${i.resim}" onclick="detayAc(${i.id})">`).join('');
}

function ilanVerKontrol() { aktifKullanici ? modalAc('ilanVerModal') : modalAc('loginModal'); }
function modalAc(id) { document.getElementById(id).style.display = 'block'; }
function modalKapat(id) { document.getElementById(id).style.display = 'none'; }

window.onload = verileriGetir;
