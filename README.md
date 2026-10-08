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
2. Klik ganda (double click) pada file **`index.html`** atau **`petugas.html`**.
3. Aplikasi akan langsung terbuka di browser Anda (Google Chrome, Microsoft Edge, Mozilla Firefox, dll.) dengan tampilan responsif dan interaktif.

---

## 🌟 Fitur Utama Aplikasi

1. **🏠 Beranda & Ringkasan KPI Real-Time**
   - Menampilkan total aduan masuk, aduan baru (menunggu verifikasi), aduan dalam proses, dan tingkat penyelesaian perkara.
   - Banner sambutan dengan visualisasi branding instansi pemerintah DLH Lembata.

2. **🗺️ Peta Spasial Sebaran Titik Aduan (GIS Mini)**
   - Peta interaktif berbasis koordinat geografis wilayah 9 kecamatan di Kabupaten Lembata (*Nubatukan/Lewoleba, Ile Ape, Ile Ape Timur, Lebatukan, Nagawutung, Wulandoni, Atadei, Omesuri, Buyasuri*).
   - Marker penanda lokasi dengan warna berdasar status penanganan (🔴 Baru, 🟡 Diverifikasi, 🔵 Ditindaklanjuti, 🟢 Selesai, ⚪ Ditolak).
   - Filter peta dinamis berdasar status dan kecamatan.
   - Dilengkapi *fallback vector engine* jika perangkat dibuka saat offline tanpa jaringan internet.

3. **📋 Tabel Data & Modul Verifikasi Petugas DLH**
   - Pencarian instan (search) berdasarkan nama pelapor, desa, nomor ID, dan uraian masalah.
   - Filter multi-kategori (Status, Kecamatan, Jenis Pencemaran).
   - **Fitur Verifikasi Petugas:** Petugas DLH dapat memperbarui status aduan, menginput tanggal pemeriksaan lapangan, nama verifikator, temuan fisik, serta tindakan nyata DLH. Perubahan otomatis tersimpan (*persistent storage*).
   - **Fitur Ekspor CSV:** Unduh rekapitulasi data pengaduan ke format spreadsheet Excel/CSV dalam satu klik.

4. **📊 Dashboard Statistik & Grafik KPI Lingkungan**
   - Grafik Donut: Komposisi status penanganan aduan.
   - Grafik Batang: Klasifikasi kategori pencemaran (Air, Udara, Sampah, B3, Laut & Pesisir, Kerusakan Lingkungan).
   - Grafik Horizontal: Sebaran intensitas aduan per kecamatan di Lembata.

5. **🔍 Portal Pelacakan Status Aduan (Tracking Publik)**
   - Warga pelapor dapat memasukkan nomor tiket aduan (contoh: `ADU-LMB-2026-001`).
   - Menampilkan garis waktu (*timeline*) proses mulai dari penerimaan form, verifikasi lapangan, tindak lanjut, hingga tuntas.

6. **📝 Formulir Aduan Daring**
   - Formulir pengaduan dengan 12 parameter terstandar sesuai SOP DLH.
   - Otomatis menerbitkan Nomor Register ID unik dan menempatkan titik koordinat di peta.

---

## 📁 Struktur Berkas

```
d:\app/
├── index.html                           # File utama aplikasi portal aduan publik
├── petugas.html                         # Portal khusus petugas & verifikator DLH
├── qr-code.html                         # Poster & generator QR Code publik
├── vercel.json                          # Konfigurasi deployment & security headers Vercel
├── netlify.toml                         # Konfigurasi deployment Netlify (opsional)
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
