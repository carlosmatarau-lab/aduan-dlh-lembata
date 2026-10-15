# 🌿 ECOADU LEMBATA
## Sistem Informasi Digital Berbasis Web Spasial Penanganan dan Verifikasi Lapangan Aduan Lingkungan Hidup
### Dinas Lingkungan Hidup Kabupaten Lembata

Aplikasi ini dikembangkan sebagai wujud inovasi dan aksi perubahan dalam rangka Aktualisasi Pelatihan Dasar CPNS Golongan III BPSDMD Provinsi Nusa Tenggara Timur Tahun 2026:

> **"PENGUATAN TATA KELOLA PENANGANAN DAN VERIFIKASI LAPANGAN ATAS ADUAN MASYARAKAT MENGENAI DUGAAN PENCEMARAN LINGKUNGAN MELALUI SISTEM INFORMASI DIGITAL BERBASIS WEB SPASIAL (ECOADU) PADA DINAS LINGKUNGAN HIDUP KABUPATEN LEMBATA"**

---

### Profil Pelaksana & Pembimbing
- **Nama Peserta** : Yohanes Kepitan Rau, S.T.
- **NIP** : 19950624 202506 1 006
- **Jabatan** : Pengawas Lingkungan Hidup Ahli Pertama
- **Unit Kerja** : Bidang Pengendalian Pencemaran dan Kerusakan Lingkungan Hidup (PPKLH)
- **Instansi** : Dinas Lingkungan Hidup Kabupaten Lembata
- **Coach** : Katarina nikmat, SE., M.A.P (NIP. 19780618 201001 2 010)
- **Mentor** : Rasyid Abd. Jalal, S.Si (NIP. 19790515 200604 1 031) - Kepala Bidang PPKLH DLH Lembata
- **Penguji** : Rizhard N. A. Sanam, SE (NIP. 19681123 199203 1 008)

---

## 🌐 Akses Aplikasi Online (Production Vercel)

- **Portal Pengaduan Publik:** [https://aduan-dlh-lembata.vercel.app](https://aduan-dlh-lembata.vercel.app)
- **Dashboard Petugas DLH:** [https://aduan-dlh-lembata.vercel.app/petugas](https://aduan-dlh-lembata.vercel.app/petugas)
- **Poster & Generator QR Code:** [https://aduan-dlh-lembata.vercel.app/qr-code](https://aduan-dlh-lembata.vercel.app/qr-code)

---

## ⚡ Cara Menjalankan Aplikasi Secara Lokal (Offline)

Aplikasi ini dibangun menggunakan arsitektur **HTML5, CSS3 Modern, dan Vanilla JavaScript**.
**Dapat berjalan secara mandiri tanpa dependensi runtime tambahan.**

1. Buka folder `d:\app\`.
2. Klik ganda pada file **`index.html`** untuk Portal Publik / Form Pengaduan Warga.
3. Klik ganda pada file **`petugas.html`** untuk Dashboard Pengawasan & Verifikasi Lapangan Petugas DLH.
4. Klik ganda pada file **`qr-code.html`** untuk Cetak Poster QR Code Sosialisasi.

---

## 🚀 Fitur Utama Sistem ECOADU

1. **📍 Peta Spasial Interaktif Sebaran Titik Aduan (GIS Mini)**
   - Peta interaktif berbasis Leaflet yang memetakan seluruh titik kejadian pencemaran di 9 kecamatan se-Kabupaten Lembata:
     1. Nubatukan (Kota Lewoleba)
     2. Ile Ape (Waipukang)
     3. Ile Ape Timur (Bungamuda)
     4. Lebatukan (Hadakewa)
     5. Nagawutung (Loang)
     6. Wulandoni (Wulandoni)
     7. Atadei (Kalikasa)
     8. Omesuri (Balauring)
     9. Buyasuri (Wairiang)
   - Indikator pin warna dinamis: Merah (Aduan Masuk), Kuning (Verifikasi Lapangan), Hijau (Selesai Ditangani), Abu-abu (Ditolak/Tidak Terbukti).

2. **📸 Form Aduan Publik dengan Deteksi Koordinat GPS & Kamera Langsung**
   - Tangkapan lokasi presisi satu klik via Geolocation API.
   - Ambil foto bukti langsung kamera HP maupun unggah berkas dari galeri.
   - Penerbitan otomatis Nomor Registrasi Tiket Aduan resmi format `ADU-LMB-YYYY-XXX`.

3. **📋 Modul Verifikasi Lapangan & Checklist Standar Pengawas LH**
   - Instrumen verifikasi langsung di lapangan sesuai Uraian Tugas Jabatan Pengawas Lingkungan Hidup Ahli Pertama (Kepala Bidang PPKLH DLH Lembata).
   - Penilaian parameter ketaatan lingkungan (Air & Laut, Udara & Emisi, Limbah Padat & Sampah TPA/TPST, B3, serta Kerusakan Lahan).
   - Pembuatan Berita Acara Pemeriksaan Fisik Lapangan (BAST/BAP) otomatis yang siap cetak / PDF.

4. **📊 Rekapitulasi & Integrasi Google Spreadsheet API**
   - Sinkronisasi real-time dua arah ke Cloud Google Spreadsheet (Sheet `Data_Aduan` 21 kolom dan Sheet `Log_Aktivitas`).
   - Ekspor data laporan akuntabilitas ke format CSV / Excel sekali klik.

---

## 📂 Struktur Berkas

```
d:\app/
├── index.html                           # Portal Aduan & Peta Spasial Publik
├── petugas.html                         # Dashboard Pengawas & Modul Verifikasi Lapangan
├── qr-code.html                         # Media Sosialisasi Poster & QR Code Publik
├── perencanaan.md                       # Dokumen Rancangan Aktualisasi Latsar CPNS 2026 Lengkap
├── README.md                            # Dokumentasi & Panduan Operasional Sistem
├── google-apps-script.js                # Serverless Backend Web API Google Apps Script
├── DOKUMENTASI-GOOGLE-APPS-SCRIPT.md    # Panduan Instalasi Google Sheets & Script API
├── css/
│   └── style.css                        # Desain Antarmuka Glassmorphism & UI Emerald DLH
└── js/
    ├── app.js                           # Logika Kontrol Navigasi, Form, & Pelacakan
    ├── data.js                          # Database Lokal & Sinkronisasi API GAS
    ├── map.js                           # Engine Pemetaan Spasial Leaflet
    └── charts.js                        # Visualisasi Statistik & Grafik
```
