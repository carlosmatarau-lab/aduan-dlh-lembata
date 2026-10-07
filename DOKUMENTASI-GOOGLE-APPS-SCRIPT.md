# 📖 DOKUMENTASI TEKNIS GOOGLE APPS SCRIPT (WEB API)
## Sistem Pendataan Digital Aduan Pencemaran Lingkungan
### Dinas Lingkungan Hidup Kabupaten Lembata

---

## 📌 Ringkasan Eksekutif

Dalam rancangan sistem aktualisasi ini:
- **Google Spreadsheet** bertindak sebagai **Database Relasional Cloud** yang menyimpan seluruh riwayat laporan aduan dan log verifikasi penanganan petugas DLH.
- **Google Apps Script (GAS)** bertindak sebagai **Serverless Backend Web API (Microservices)** yang menyediakan antarmuka REST-like API melalui protokol HTTP (JSON).
- **Web Portal DLH Lembata** (HTML5/CSS/JavaScript) bertindak sebagai **Frontend Client** yang menyajikan peta spasial, grafik analitik, formulir pelaporan, dan modul verifikasi langsung kepada masyarakat serta pimpinan DLH.

Kode sumber skrip backend tersimpan di root proyek: [`google-apps-script.js`](file:///d:/app/google-apps-script.js).

---

## 🏗️ 1. Arsitektur Aliran Data

```
+-----------------------------------------------------------------------------------+
|                            MASYARAKAT / PETUGAS DLH                               |
+-----------------------------------------------------------------------------------+
             |                                                  |
             | (Opsi A: Isi Form Web)                           | (Opsi B: Isi Google Form)
             v                                                  v
+-------------------------------+             +-------------------------------------+
|   PORTAL WEB DLH LEMBATA      |             |     GOOGLE FORM RESMI DLH           |
| (Frontend Client - HTML/JS)   |             | (Formulir Aduan Publik 12 Field)    |
+-------------------------------+             +-------------------------------------+
             |                                                  |
             | HTTP POST / GET (JSON)                           | Jawaban tersimpan otomatis
             v                                                  v
+-----------------------------------------------------------------------------------+
|               GOOGLE APPS SCRIPT WEB API (google-apps-script.js)                 |
|               - Handler doGet(e)   : Ambil data aduan, statistik, ID             |
|               - Handler doPost(e)  : Tambah aduan, update status verifikasi       |
|               - Format Output      : application/json (CORS Enabled)              |
+-----------------------------------------------------------------------------------+
                                        |
                             Query & Transaksi Baris
                                        v
+-----------------------------------------------------------------------------------+
|                     GOOGLE SPREADSHEET (CLOUD DATABASE)                           |
|  Sheet 1: [Data_Aduan]      -> 21 Kolom atribut aduan & status verifikasi         |
|  Sheet 2: [Log_Aktivitas]   -> Riwayat jejak audit (waktu, aksi, status lama/baru)|
+-----------------------------------------------------------------------------------+
```

---

## 📋 2. Struktur Kolom Database (Google Spreadsheet)

### Sheet 1: `Data_Aduan`
Skrip Google Apps Script akan **secara otomatis membuat sheet dan 21 baris header** ini apabila belum tersedia pada spreadsheet Anda:

| No | Nama Kolom Header | Tipe Data | Deskripsi / Contoh |
|:---:|---|---|---|
| 1 | `ID_Aduan` | Teks | ID unik otomatis, misal: `ADU-LMB-2026-001` |
| 2 | `Timestamp` | Teks / Tanggal | Waktu lapor dibuat, misal: `2026-10-07 14:30:00` |
| 3 | `Nama_Pelapor` | Teks | Nama lengkap warga pelapor |
| 4 | `No_HP` | Teks / Angka | Nomor WhatsApp / kontak warga |
| 5 | `Alamat_Pelapor` | Teks | Alamat domisili pelapor di Lembata |
| 6 | `Kecamatan` | Teks | Salah satu dari 9 Kecamatan di Kab. Lembata |
| 7 | `Desa_Kelurahan` | Teks | Nama desa / kelurahan lokasi dugaan |
| 8 | `Lokasi_Detail` | Teks | Patokan lokasi, misal: *Dermaga Jeti Lewoleba* |
| 9 | `Latitude` | Desimal | Titik koordinat Lintang (misal: `-8.3615`) |
| 10 | `Longitude` | Desimal | Titik koordinat Bujur (misal: `123.5512`) |
| 11 | `Jenis_Pencemaran` | Teks | Air, Udara, Sampah, B3, Laut & Pesisir, dll. |
| 12 | `Uraian_Aduan` | Teks Paragraf | Kronologi dan penjelasan pencemaran |
| 13 | `Sumber_Dugaan` | Teks | Pihak / industri / oknum sumber pencemaran |
| 14 | `Tanggal_Kejadian`| Tanggal | Tanggal saat pencemaran terpantau |
| 15 | `Link_Foto_Bukti` | URL | URL bukti foto (Google Drive / Cloud Storage) |
| 16 | `Status` | Teks | `Baru`, `Diverifikasi`, `Ditindaklanjuti`, `Selesai`, `Ditolak` |
| 17 | `Petugas_Verifikasi`| Teks | Nama & jabatan verifikator DLH Lembata |
| 18 | `Tanggal_Verifikasi`| Tanggal | Waktu pemeriksaan fisik lapangan |
| 19 | `Hasil_Verifikasi`| Teks | Temuan faktual di lokasi kejadian |
| 20 | `Tindakan_DLH` | Teks | Upaya nyata DLH (teguran, pembersihan, lab) |
| 21 | `Tanggal_Selesai`| Tanggal | Waktu penanganan dinyatakan tuntas |

### Sheet 2: `Log_Aktivitas`
Digunakan untuk merekam jejak audit (*audit trail*) setiap kali ada aduan baru atau perubahan status verifikasi:
- `Timestamp`: Waktu aktivitas terjadi
- `ID_Aduan`: ID aduan yang mengalami pembaruan
- `Aktivitas`: Jenis aktivitas (`INSERT_ADUAN`, `UPDATE_VERIFIKASI`)
- `Keterangan`: Rincian perubahan status lama menjadi status baru

---

## 🚀 3. Panduan Instalasi & Deployment (Step-by-Step)

Ikuti langkah-langkah mudah berikut untuk mengaktifkan API:

### Langkah 1: Buat Google Spreadsheet Baru
1. Buka browser dan kunjungi [Google Sheets](https://sheets.new).
2. Beri nama spreadsheet Anda, contohnya:  
   `Database Aduan Pencemaran DLH Lembata 2026`.

### Langkah 2: Buka Editor Apps Script
1. Pada menu navigasi Google Sheets, klik **Extensions** (Ekstensi) > **Apps Script**.
2. Anda akan diarahkan ke antarmuka editor kode Google Apps Script.
3. Hapus seluruh baris kode contoh `myFunction()` yang ada di editor.

### Langkah 3: Tempel Kode API
1. Buka file [`google-apps-script.js`](file:///d:/app/google-apps-script.js) dari proyek ini di teks editor Anda.
2. Salin (**Copy**) seluruh isi kode tersebut.
3. Tempel (**Paste**) ke dalam editor Google Apps Script.
4. Klik tombol **Save Project** 💾 (atau tekan `Ctrl + S`).

### Langkah 4: Inisialisasi Database (Opsional tapi Direkomendasikan)
1. Di bilah atas editor Apps Script, pada dropdown fungsi, pilih fungsi **`setupDatabase`**.
2. Klik tombol **▷ Run** (Jalankan).
3. Jika Google meminta izin akses (*Authorization Required*):
   - Klik **Review permissions** (Tinjau Izin).
   - Pilih akun Google Anda.
   - Klik **Advanced** (Lanjutan) > Klik **Go to Untitled project (unsafe)**.
   - Klik **Allow** (Izinkan).
4. Cek Google Sheets Anda: Sheet `Data_Aduan` dan `Log_Aktivitas` beserta header hijau DLH dan sampel data otomatis terbentuk!

### Langkah 5: Deploy Sebagai Web App (Publikasikan API)
1. Di pojok kanan atas editor Apps Script, klik tombol biru **Deploy** > pilih **New deployment**.
2. Klik ikon gerigi ⚙️ di sebelah *Select type*, pilih **Web app**.
3. Isi parameter deployment:
   - **Description**: `API Aduan DLH Lembata v1`
   - **Execute as**: **`Me (email anda)`** *(Sangat penting)*
   - **Who has access**: **`Anyone`** *(Sangat penting agar portal web dapat mengakses data tanpa login Google)*
4. Klik tombol **Deploy**.
5. Salin (**Copy**) teks **Web app URL** yang muncul.  
   Format URL terlihat seperti:  
   `https://script.google.com/macros/s/AKfycbx.../exec`

---

## 📡 4. Spesifikasi Endpoint REST API

Semua respons dikembalikan dalam format standar JSON:
```json
{
  "success": true,
  "data": { ... },
  "message": "Pesan status"
}
```

### 1. Ambil Seluruh Data Aduan
- **Method**: `GET`
- **URL Parameter**: `?action=getAll`
- **Contoh Request**:
  ```http
  GET https://script.google.com/macros/s/AKfycbxm4r8QU2dv0S6csTTpmewuuvMNNrqiD2NeF_ENzXi8z7E3qDALHz6HNiBWtiEpGMruIQ/exec?action=getAll
  ```
- **Contoh Respons**:
  ```json
  {
    "success": true,
    "total": 6,
    "data": [
      {
        "id": "ADU-LMB-2026-001",
        "timestamp": "2026-09-12 09:15:00",
        "namaPelapor": "Fransiskus Kedang",
        "noHp": "081234567890",
        "kecamatan": "Nubatukan",
        "desa": "Lewoleba Tengah",
        "lat": -8.3615,
        "lng": 123.5512,
        "jenisPencemaran": "Laut & Pesisir",
        "status": "Selesai"
      }
    ]
  }
  ```

---

### 2. Ambil Rincian 1 Aduan Berdasarkan ID
- **Method**: `GET`
- **URL Parameter**: `?action=getById&id=ADU-LMB-2026-001`
- **Contoh Request**:
  ```http
  GET https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec?action=getById&id=ADU-LMB-2026-001
  ```
- **Contoh Respons**:
  ```json
  {
    "success": true,
    "data": {
      "id": "ADU-LMB-2026-001",
      "namaPelapor": "Fransiskus Kedang",
      "hasilVerifikasi": "Terbukti ada ceceran oli sekitar 15 m²",
      "tindakanDLH": "Pembersihan tumpahan oli dengan absorbent pad",
      "status": "Selesai"
    }
  }
  ```

---

### 3. Ambil Ringkasan Statistik KPI
- **Method**: `GET`
- **URL Parameter**: `?action=getStats`
- **Contoh Request**:
  ```http
  GET https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec?action=getStats
  ```
- **Contoh Respons**:
  ```json
  {
    "success": true,
    "data": {
      "total": 6,
      "baru": 1,
      "diverifikasi": 1,
      "ditindaklanjuti": 1,
      "selesai": 3,
      "ditolak": 0,
      "tingkatPenyelesaian": 50.0,
      "byKecamatan": { "Nubatukan": 2, "Lebatukan": 1, "Atadei": 1 },
      "byJenis": { "Laut & Pesisir": 1, "Sampah Ilegal & Bau": 2 }
    }
  }
  ```

---

### 4. Kirim Laporan Aduan Baru (Submit Form)
- **Method**: `POST`
- **Request Body** (JSON):
  ```json
  {
    "action": "addAduan",
    "data": {
      "namaPelapor": "Antonius Bala",
      "noHp": "081234567899",
      "alamatPelapor": "Desa Balauring, Omesuri",
      "kecamatan": "Omesuri",
      "desa": "Balauring",
      "lokasiDetail": "Dekat muara kali Balauring",
      "lat": -8.2350,
      "lng": 123.8220,
      "jenisPencemaran": "Pencemaran Air & Sungai",
      "uraian": "Air muara berbusa dan ikan-ikan kecil mati mendadak.",
      "sumberDugaan": "Pembuangan limbah sisa pengolahan rumput laut",
      "tanggalKejadian": "2026-10-06"
    }
  }
  ```
- **Respons**:
  ```json
  {
    "success": true,
    "message": "Aduan berhasil disimpan ke Google Spreadsheet",
    "id": "ADU-LMB-2026-007",
    "data": { ... }
  }
  ```

---

### 5. Update Status Verifikasi Petugas DLH
- **Method**: `POST`
- **Request Body** (JSON):
  ```json
  {
    "action": "updateVerifikasi",
    "data": {
      "id": "ADU-LMB-2026-007",
      "status": "Selesai",
      "petugasVerifikasi": "Yohanes B. (PPNS DLH Lembata)",
      "tanggalVerifikasi": "2026-10-07",
      "hasilVerifikasi": "Telah dilakukan penetralan dan pengambilan sampel uji air.",
      "tindakanDLH": "Pembersihan muara dan sosialisasi kepada kelompok pengolah.",
      "tanggalSelesai": "2026-10-07"
    }
  }
  ```
- **Respons**:
  ```json
  {
    "success": true,
    "message": "Data verifikasi aduan ADU-LMB-2026-007 berhasil diperbarui",
    "data": { ... }
  }
  ```

---

## 🔗 5. Cara Menghubungkan ke Portal Web DLH (`js/data.js`)

Pada file [`js/data.js`](file:///d:/app/js/data.js), cukup ubah konstanta konfigurasi di bagian paling atas:

```javascript
// Ganti string kosong dengan URL Web App Anda:
window.GAS_API_URL = 'https://script.google.com/macros/s/AKfycbx.../exec';
```

Aplikasi portal web DLH secara otomatis akan:
1. Mengambil data real-time dari Google Spreadsheet setiap kali dibuka.
2. Menyimpan form aduan baru langsung ke baris Google Spreadsheet.
3. Memperbarui status verifikasi petugas langsung ke Google Spreadsheet.
4. Jika koneksi internet terputus atau URL belum disetel, aplikasi otomatis beralih (*fallback*) ke penyimpanan lokal (**LocalStorage**) tanpa terjadi crash / error.

---

## 🛡️ 6. Catatan Keamanan, Limitasi & Rekomendasi

1. **Kuota Gratis Google Apps Script**:
   - Panggilan URL Fetch / Web App: Hingga 20.000 request per hari (sangat memadai untuk operasional instansi kabupaten).
   - Waktu eksekusi maksimum: 6 menit per trigger.
2. **Kerahasiaan Data**:
   - Kolom nomor telepon dan identitas pelapor tersimpan aman di Google Drive akun DLH dan tidak terekspos ke halaman publik tanpa otorisasi.
3. **Backup Data Otomatis**:
   - Google Spreadsheet memiliki riwayat versi bawaan (*Version History*), sehingga data aman dari risiko terhapus secara tidak sengaja.
