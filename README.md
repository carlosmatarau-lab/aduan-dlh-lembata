# 🌿 SILAPOR-DLH LEMBATA
## Sistem Informasi & Pendataan Digital Aduan Pencemaran Lingkungan
### Dinas Lingkungan Hidup Kabupaten Lembata

Aplikasi ini dikembangkan untuk mendukung rancangan aktualisasi ASN:
> **"OPTIMALISASI PENANGANAN DAN VERIFIKASI ADUAN MASYARAKAT TERKAIT DUGAAN PENCEMARAN LINGKUNGAN MELALUI SISTEM PENDATAAN DIGITAL BERBASIS GOOGLE FORM, GOOGLE SPREADSHEET, DAN GOOGLE MAPS PADA DINAS LINGKUNGAN HIDUP KABUPATEN LEMBATA"**

---

## 🌐 Akses Aplikasi Online (Production Vercel)

- **Portal Pengaduan Publik:** [https://aduan-dlh-lembata.vercel.app](https://aduan-dlh-lembata.vercel.app)
- **Portal Khusus Petugas DLH:** [https://aduan-dlh-lembata.vercel.app/petugas](https://aduan-dlh-lembata.vercel.app/petugas)
- **Poster & Generator QR Code:** [https://aduan-dlh-lembata.vercel.app/qr-code](https://aduan-dlh-lembata.vercel.app/qr-code)

---

## 🚀 Cara Menjalankan Aplikasi Secara Lokal (Offline)

Aplikasi ini dibangun murni menggunakan **HTML5, CSS3 Modern, dan Vanilla JavaScript**.
**Tidak memerlukan instalasi server atau dependensi tambahan apa pun.**

1. Cukup buka folder `d:\app\`.
2. Klik ganda (double click) pada file **`index.html`**.
3. Aplikasi akan langsung terbuka di browser Anda (Google Chrome, Microsoft Edge, Mozilla Firefox, dll.) dengan tampilan responsif dan interaktif.

---

## 🌟 Fitur Utama Aplikasi

1. **📲 Pengiriman Pengaduan Langsung ke WhatsApp DLH (+62 822-3458-2769)**
   - Aduan warga secara otomatis diformat rapi dan diteruskan langsung ke WhatsApp resmi DLH Lembata.
   - Dilengkapi dukungan lampiran bukti foto via Web Share API native (di HP) dan clipboard copy / download di desktop.
   - Menyertakan titik GPS otomatis dan tautan navigasi Google Maps akurat.

2. **🗺️ Peta Spasial Sebaran Titik Aduan (GIS Interaktif)**
   - Peta interaktif berbasis Leaflet dengan pilihan layer Peta Standar, Citra Satelit Nyata, dan Topografi.
   - Mencakup seluruh 9 kecamatan di Kabupaten Lembata (*Nubatukan/Lewoleba, Ile Ape, Ile Ape Timur, Lebatukan, Nagawutung, Wulandoni, Atadei, Omesuri, Buyasuri*).
   - Filter dinamis berdasarkan kecamatan, jenis pencemaran, dan status.

3. **📝 Formulir Pengaduan Digital Cepat & Akurat**
   - Mendukung deteksi GPS otomatis satu klik untuk koordinat akurat di lapangan.
   - Upload bukti foto langsung dari kamera HP atau galeri file (maks. 3 berkas).
   - Pilihan kategori pencemaran: Laut & Pesisir, Sampah Ilegal, Air & Sungai, Udara & Asap, Limbah B3, dan Kerusakan Lingkungan.

---

## 📁 Struktur Berkas

```
d:\app/
├── index.html                           # File utama aplikasi portal aduan & peta publik
├── qr-code.html                         # Poster cetak & generator QR Code publik
├── petugas.html                         # Pengalihan resmi ke WhatsApp Helpline DLH
├── vercel.json                          # Konfigurasi deployment & security headers Vercel
├── check-vercel.ps1                     # Script diagnostik deployment Vercel
├── perencanaan.md                       # Dokumen rencana aktualisasi lengkap
├── README.md                            # Petunjuk penggunaan aplikasi
├── google-apps-script.js                # Web API Serverless (Google Apps Script)
├── DOKUMENTASI-GOOGLE-APPS-SCRIPT.md    # Panduan setup & deployment Web API Google Spreadsheet
├── css/
│   └── style.css                        # Desain antarmuka modern, glassmorphism, & palet DLH
└── js/
    ├── app.js                           # Kontroler navigasi tab, filter, modal, & tracker
    ├── data.js                          # Database lokal/GAS API, data sampel realistis Lembata, ekspor CSV
    ├── map.js                           # Sistem pemetaan interaktif Leaflet & fallback spasial
    └── charts.js                        # Engine grafik statistik Chart.js & fallback Canvas
```

---

## 🇮🇩 Wilayah Cakupan (9 Kecamatan Kabupaten Lembata)
1. **Nubatukan** (Ibukota Lewoleba)
2. **Ile Ape** (Waipukang)
3. **Ile Ape Timur** (Bungamuda)
4. **Lebatukan** (Hadakewa)
5. **Nagawutung** (Loang)
6. **Wulandoni** (Wulandoni)
7. **Atadei** (Kalikasa)
8. **Omesuri** (Balauring)
9. **Buyasuri** (Wairiang)
