/**
 * ==================================================================================
 * GOOGLE APPS SCRIPT — WEB API BACKEND
 * SISTEM PENDATAAN DIGITAL ADUAN PENCEMARAN LINGKUNGAN
 * DINAS LINGKUNGAN HIDUP KABUPATEN LEMBATA
 * ==================================================================================
 *
 * PETUNJUK PENGGUNAAN:
 * 1. Buka Google Spreadsheet Anda.
 * 2. Klik menu Extensions > Apps Script.
 * 3. Hapus semua kode default di editor, lalu PASTE (tempel) seluruh isi file ini.
 * 4. Klik tombol 💾 Save (Ctrl+S).
 * 5. Klik menu Deploy > New deployment.
 *    - Pilih Type: "Web app"
 *    - Description: "API Aduan DLH Lembata v1"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 6. Klik Deploy > Salin URL Web App yang diberikan.
 * 7. Tempel URL tersebut ke file js/data.js pada variabel API_BASE_URL.
 *
 * ENDPOINT API:
 *   GET  ?action=getAll                  → Ambil seluruh data aduan
 *   GET  ?action=getById&id=ADU-LMB-... → Ambil 1 aduan berdasarkan ID
 *   GET  ?action=getStats               → Ambil statistik ringkasan
 *   POST  body: { action: "addAduan", data: {...} }       → Tambah aduan baru
 *   POST  body: { action: "updateVerifikasi", data: {...} } → Update status verifikasi
 *
 * NAMA SHEET YANG DIBUTUHKAN DI SPREADSHEET:
 *   - "Data_Aduan"       → Sheet utama data aduan masuk
 *   - "Log_Aktivitas"    → Sheet pencatatan log perubahan (opsional, otomatis dibuat)
 *
 * ==================================================================================
 */

// ===== KONFIGURASI =====
const SHEET_NAME_ADUAN = 'Data_Aduan';
const SHEET_NAME_LOG = 'Log_Aktivitas';

// Kolom-kolom header pada sheet "Data_Aduan" (urutan HARUS sesuai)
const HEADERS_ADUAN = [
  'ID_Aduan',
  'Timestamp',
  'Nama_Pelapor',
  'No_HP',
  'Alamat_Pelapor',
  'Kecamatan',
  'Desa_Kelurahan',
  'Lokasi_Detail',
  'Latitude',
  'Longitude',
  'Jenis_Pencemaran',
  'Uraian_Aduan',
  'Sumber_Dugaan',
  'Tanggal_Kejadian',
  'Link_Foto_Bukti',
  'Status',
  'Petugas_Verifikasi',
  'Tanggal_Verifikasi',
  'Hasil_Verifikasi',
  'Tindakan_DLH',
  'Tanggal_Selesai'
];


// ==================================================================================
// HANDLER HTTP GET (Dipanggil browser/fetch saat request GET)
// ==================================================================================
function doGet(e) {
  try {
    const action = e.parameter.action || 'getAll';

    let result;

    switch (action) {
      case 'getAll':
        result = handleGetAll();
        break;

      case 'getById':
        const id = e.parameter.id || '';
        result = handleGetById(id);
        break;

      case 'getStats':
        result = handleGetStats();
        break;

      case 'delete':
      case 'deleteAduan':
        result = handleDeleteAduan({ id: e.parameter.id || '' });
        break;

      case 'sendResetPin':
      case 'forgotPassword':
        result = handleSendResetPin({ email: e.parameter.email || '' });
        break;

      case 'verifyResetPin':
        result = handleVerifyResetPin({
          email: e.parameter.email || '',
          otp: e.parameter.otp || '',
          newPin: e.parameter.newPin || ''
        });
        break;

      case 'resetData':
      case 'resetToZero':
        result = handleResetToZero();
        break;

      default:
        result = { success: false, error: 'Aksi tidak dikenali: ' + action };
    }

    return createJsonResponse(result);

  } catch (err) {
    return createJsonResponse({ success: false, error: err.message });
  }
}


// ==================================================================================
// HANDLER HTTP POST (Dipanggil fetch saat request POST / submit form)
// ==================================================================================
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action || '';

    let result;

    switch (action) {
      case 'addAduan':
        result = handleAddAduan(body.data || {});
        break;

      case 'updateVerifikasi':
        result = handleUpdateVerifikasi(body.data || {});
        break;

      case 'deleteAduan':
        result = handleDeleteAduan(body.data || {});
        break;

      case 'sendResetPin':
      case 'forgotPassword':
        result = handleSendResetPin(body.data || body);
        break;

      case 'verifyResetPin':
        result = handleVerifyResetPin(body.data || body);
        break;

      case 'resetData':
      case 'resetToZero':
        result = handleResetToZero();
        break;

      default:
        result = { success: false, error: 'Aksi POST tidak dikenali: ' + action };
    }

    return createJsonResponse(result);

  } catch (err) {
    return createJsonResponse({ success: false, error: err.message });
  }
}


// ==================================================================================
// FUNGSI UTILITAS
// ==================================================================================

/**
 * Membuat respons JSON dengan header CORS untuk dipanggil dari web manapun
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Mendapatkan atau membuat sheet berdasarkan nama.
 * Jika sheet belum ada, akan dibuatkan baru secara otomatis beserta header.
 */
function getOrCreateSheet(sheetName, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

      // Format header: tebal, warna background hijau DLH
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#059669');
      headerRange.setFontColor('#ffffff');
      headerRange.setHorizontalAlignment('center');

      // Freeze baris header
      sheet.setFrozenRows(1);

      // Auto-resize kolom
      for (let i = 1; i <= headers.length; i++) {
        sheet.autoResizeColumn(i);
      }
    }
  }

  return sheet;
}

/**
 * Mengambil semua data dari sheet sebagai array of objects
 */
function getSheetDataAsObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Hanya header, belum ada data

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] !== undefined ? row[i] : '';
    });
    return obj;
  });
}

/**
 * Konversi object dari sheet menjadi format yang sesuai dengan frontend (camelCase)
 */
function mapSheetRowToFrontend(row) {
  return {
    id: String(row['ID_Aduan'] || ''),
    timestamp: String(row['Timestamp'] || ''),
    namaPelapor: String(row['Nama_Pelapor'] || ''),
    noHp: String(row['No_HP'] || ''),
    alamatPelapor: String(row['Alamat_Pelapor'] || ''),
    kecamatan: String(row['Kecamatan'] || ''),
    desa: String(row['Desa_Kelurahan'] || ''),
    lokasiDetail: String(row['Lokasi_Detail'] || ''),
    lat: parseFloat(row['Latitude']) || 0,
    lng: parseFloat(row['Longitude']) || 0,
    jenisPencemaran: String(row['Jenis_Pencemaran'] || ''),
    uraian: String(row['Uraian_Aduan'] || ''),
    sumberDugaan: String(row['Sumber_Dugaan'] || '-'),
    tanggalKejadian: String(row['Tanggal_Kejadian'] || ''),
    linkFoto: String(row['Link_Foto_Bukti'] || ''),
    status: String(row['Status'] || 'Baru'),
    petugasVerifikasi: String(row['Petugas_Verifikasi'] || '-'),
    tanggalVerifikasi: String(row['Tanggal_Verifikasi'] || '-'),
    hasilVerifikasi: String(row['Hasil_Verifikasi'] || '-'),
    tindakanDLH: String(row['Tindakan_DLH'] || '-'),
    tanggalSelesai: String(row['Tanggal_Selesai'] || '-')
  };
}

/**
 * Generate ID aduan baru secara berurutan: ADU-LMB-YYYY-NNN
 * Menjamin tidak terjadi tumpang tindih antar nomor aduan.
 */
function generateNewId(sheet) {
  const year = new Date().getFullYear();
  const data = sheet.getDataRange().getValues();
  let maxSeq = 0;

  for (let i = 1; i < data.length; i++) {
    const rawId = String(data[i][0] || '').trim();
    const regex = new RegExp('^ADU-LMB-' + year + '-(\\d+)$', 'i');
    const match = rawId.match(regex);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }

  const nextNum = maxSeq + 1;
  const padded = String(nextNum).padStart(3, '0');
  return 'ADU-LMB-' + year + '-' + padded;
}

/**
 * Menulis log aktivitas ke sheet Log_Aktivitas
 */
function writeLog(action, details) {
  const logSheet = getOrCreateSheet(SHEET_NAME_LOG, ['Timestamp', 'Aksi', 'Detail']);
  const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  logSheet.appendRow([now, action, details]);
}


// ==================================================================================
// HANDLER AKSI: GET ALL DATA
// ==================================================================================
function handleGetAll() {
  const sheet = getOrCreateSheet(SHEET_NAME_ADUAN, HEADERS_ADUAN);
  const rawData = getSheetDataAsObjects(sheet);

  const result = rawData.map(row => mapSheetRowToFrontend(row));

  return {
    success: true,
    count: result.length,
    data: result
  };
}


// ==================================================================================
// HANDLER AKSI: GET BY ID
// ==================================================================================
function handleGetById(id) {
  if (!id) {
    return { success: false, error: 'Parameter "id" wajib diisi.' };
  }

  const sheet = getOrCreateSheet(SHEET_NAME_ADUAN, HEADERS_ADUAN);
  const rawData = getSheetDataAsObjects(sheet);

  const found = rawData.find(row =>
    String(row['ID_Aduan']).trim().toLowerCase() === id.trim().toLowerCase()
  );

  if (!found) {
    return { success: false, error: 'Aduan dengan ID "' + id + '" tidak ditemukan.' };
  }

  return {
    success: true,
    data: mapSheetRowToFrontend(found)
  };
}


// ==================================================================================
// HANDLER AKSI: GET STATS (Statistik Ringkasan)
// ==================================================================================
function handleGetStats() {
  const sheet = getOrCreateSheet(SHEET_NAME_ADUAN, HEADERS_ADUAN);
  const rawData = getSheetDataAsObjects(sheet);

  let total = rawData.length;
  let baru = 0, diverifikasi = 0, ditindak = 0, selesai = 0, ditolak = 0;
  const perKecamatan = {};
  const perJenis = {};

  rawData.forEach(row => {
    const status = String(row['Status'] || '');
    const kec = String(row['Kecamatan'] || '');
    const jenis = String(row['Jenis_Pencemaran'] || '');

    if (status === 'Baru') baru++;
    else if (status === 'Diverifikasi') diverifikasi++;
    else if (status === 'Ditindaklanjuti') ditindak++;
    else if (status === 'Selesai') selesai++;
    else if (status === 'Ditolak') ditolak++;

    perKecamatan[kec] = (perKecamatan[kec] || 0) + 1;
    perJenis[jenis] = (perJenis[jenis] || 0) + 1;
  });

  const tingkatPenyelesaian = total > 0 ? Math.round(((selesai + ditolak) / total) * 100) : 0;

  return {
    success: true,
    data: {
      total: total,
      baru: baru,
      diverifikasi: diverifikasi,
      ditindak: ditindak,
      selesai: selesai,
      ditolak: ditolak,
      dalamProses: diverifikasi + ditindak,
      tingkatPenyelesaian: tingkatPenyelesaian,
      perKecamatan: perKecamatan,
      perJenis: perJenis
    }
  };
}


// ==================================================================================
// HANDLER AKSI: TAMBAH ADUAN BARU (POST)
// ==================================================================================
function handleAddAduan(formData) {
  const sheet = getOrCreateSheet(SHEET_NAME_ADUAN, HEADERS_ADUAN);

  // Gunakan ID dari formulir jika ada, atau generate baru
  const newId = (formData.id && String(formData.id).trim()) ? String(formData.id).trim() : generateNewId(sheet);

  // Generate timestamp saat ini
  const now = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'yyyy-MM-dd HH:mm'
  );

  // Tentukan koordinat default dari kecamatan jika tidak disediakan
  const KECAMATAN_COORDS = {
    'Nubatukan': { lat: -8.3682, lng: 123.5583 },
    'Ile Ape': { lat: -8.2831, lng: 123.5412 },
    'Ile Ape Timur': { lat: -8.2915, lng: 123.6128 },
    'Lebatukan': { lat: -8.3584, lng: 123.6652 },
    'Nagawutung': { lat: -8.4902, lng: 123.3854 },
    'Wulandoni': { lat: -8.5412, lng: 123.4915 },
    'Atadei': { lat: -8.4550, lng: 123.5681 },
    'Omesuri': { lat: -8.2351, lng: 123.8224 },
    'Buyasuri': { lat: -8.1925, lng: 123.9450 }
  };

  const kecCoord = KECAMATAN_COORDS[formData.kecamatan] || { lat: -8.375, lng: 123.55 };
  const lat = formData.lat ? parseFloat(formData.lat) : (kecCoord.lat + (Math.random() - 0.5) * 0.02);
  const lng = formData.lng ? parseFloat(formData.lng) : (kecCoord.lng + (Math.random() - 0.5) * 0.02);

  // Ambil data foto bukti dan pastikan tidak melampaui limit sel Google Sheets (50.000 karakter)
  let fotoData = formData.fotoBukti || formData.linkFotoBukti || formData.linkFoto || (Array.isArray(formData.buktiFotoList) ? formData.buktiFotoList[0] : '') || '';
  if (typeof fotoData === 'string' && fotoData.length > 49000) {
    fotoData = fotoData.substring(0, 49000);
  }

  // Susun baris data baru sesuai urutan HEADERS_ADUAN
  const newRow = [
    newId,                                        // ID_Aduan
    now,                                          // Timestamp
    formData.namaPelapor || 'Anonim',             // Nama_Pelapor
    formData.noHp || '-',                         // No_HP
    formData.alamatPelapor || '-',                // Alamat_Pelapor
    formData.kecamatan || 'Nubatukan',            // Kecamatan
    formData.desa || '-',                         // Desa_Kelurahan
    formData.lokasiDetail || '-',                 // Lokasi_Detail
    lat,                                          // Latitude
    lng,                                          // Longitude
    formData.jenisPencemaran || 'Lainnya',        // Jenis_Pencemaran
    formData.uraian || '-',                       // Uraian_Aduan
    formData.sumberDugaan || '-',                 // Sumber_Dugaan
    formData.tanggalKejadian || now.split(' ')[0],// Tanggal_Kejadian
    fotoData,                                     // Link_Foto_Bukti
    'Baru',                                       // Status
    '-',                                          // Petugas_Verifikasi
    '-',                                          // Tanggal_Verifikasi
    'Menunggu penugasan verifikator lapangan.',    // Hasil_Verifikasi
    'Aduan telah dicatat ke sistem.',              // Tindakan_DLH
    '-'                                           // Tanggal_Selesai
  ];

  // Tambahkan baris ke sheet
  sheet.appendRow(newRow);

  // Tulis log
  writeLog('ADUAN_BARU', 'ID: ' + newId + ' | Pelapor: ' + (formData.namaPelapor || 'Anonim') + ' | Kec: ' + (formData.kecamatan || '-'));

  return {
    success: true,
    message: 'Aduan berhasil disimpan ke Google Spreadsheet.',
    data: {
      id: newId,
      timestamp: now,
      status: 'Baru'
    }
  };
}


// ==================================================================================
// HANDLER AKSI: UPDATE VERIFIKASI PETUGAS DLH (POST)
// ==================================================================================
function handleUpdateVerifikasi(updateData) {
  const targetId = updateData.id || '';
  if (!targetId) {
    return { success: false, error: 'Parameter "id" wajib diisi untuk update verifikasi.' };
  }

  const sheet = getOrCreateSheet(SHEET_NAME_ADUAN, HEADERS_ADUAN);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Cari kolom index
  const colId = headers.indexOf('ID_Aduan');
  const colStatus = headers.indexOf('Status');
  const colPetugas = headers.indexOf('Petugas_Verifikasi');
  const colTglVerif = headers.indexOf('Tanggal_Verifikasi');
  const colHasil = headers.indexOf('Hasil_Verifikasi');
  const colTindakan = headers.indexOf('Tindakan_DLH');
  const colTglSelesai = headers.indexOf('Tanggal_Selesai');

  // Cari baris yang sesuai ID
  let targetRowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colId]).trim().toLowerCase() === targetId.trim().toLowerCase()) {
      targetRowIndex = i + 1; // +1 karena getRange 1-indexed
      break;
    }
  }

  if (targetRowIndex === -1) {
    return { success: false, error: 'Aduan dengan ID "' + targetId + '" tidak ditemukan di spreadsheet.' };
  }

  // Update sel-sel yang relevan
  if (updateData.status) {
    sheet.getRange(targetRowIndex, colStatus + 1).setValue(updateData.status);
  }
  if (updateData.petugasVerifikasi) {
    sheet.getRange(targetRowIndex, colPetugas + 1).setValue(updateData.petugasVerifikasi);
  }
  if (updateData.tanggalVerifikasi) {
    sheet.getRange(targetRowIndex, colTglVerif + 1).setValue(updateData.tanggalVerifikasi);
  }
  if (updateData.hasilVerifikasi) {
    sheet.getRange(targetRowIndex, colHasil + 1).setValue(updateData.hasilVerifikasi);
  }
  if (updateData.tindakanDLH) {
    sheet.getRange(targetRowIndex, colTindakan + 1).setValue(updateData.tindakanDLH);
  }

  // Jika status Selesai, isi tanggal selesai
  if (updateData.status === 'Selesai') {
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    sheet.getRange(targetRowIndex, colTglSelesai + 1).setValue(updateData.tanggalSelesai || today);
  }

  // Tulis log
  writeLog('UPDATE_VERIFIKASI', 'ID: ' + targetId + ' → Status: ' + (updateData.status || '-') + ' | Petugas: ' + (updateData.petugasVerifikasi || '-'));

  return {
    success: true,
    message: 'Status aduan ' + targetId + ' berhasil diperbarui menjadi "' + (updateData.status || '-') + '".',
    data: {
      id: targetId,
      status: updateData.status || '-'
    }
  };
}


// ==================================================================================
// HANDLER AKSI: HAPUS ADUAN (POST / GET)
// ==================================================================================
function handleDeleteAduan(data) {
  const targetId = String(data.id || '').trim().toLowerCase();
  if (!targetId) {
    return { success: false, error: 'Parameter "id" wajib diisi untuk menghapus aduan.' };
  }

  const sheet = getOrCreateSheet(SHEET_NAME_ADUAN, HEADERS_ADUAN);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    return { success: true, message: 'Sheet kosong atau hanya ada header.', deletedCount: 0 };
  }

  const headers = rows[0];
  const colId = headers.indexOf('ID_Aduan');
  if (colId === -1) {
    return { success: false, error: 'Kolom ID_Aduan tidak ditemukan di spreadsheet.' };
  }

  let deletedCount = 0;
  // Telusuri dari baris terbawah ke atas untuk menghapus dengan aman
  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][colId]).trim().toLowerCase() === targetId) {
      sheet.deleteRow(i + 1);
      deletedCount++;
    }
  }

  writeLog('ADUAN_DIHAPUS', 'ID: ' + targetId + ' | Baris dihapus: ' + deletedCount);

  return {
    success: true,
    message: 'Aduan ' + targetId + ' berhasil dihapus dari spreadsheet (' + deletedCount + ' baris dihapus).',
    deletedCount: deletedCount
  };
}


// ==================================================================================
// HANDLER AKSI: KOSONGKAN DATABASE / RESET KE 0 ADUAN
// ==================================================================================
/**
 * Mengosongkan seluruh baris data aduan di Google Spreadsheet (menyisakan baris header).
 * Digunakan untuk penyegaran data total (Fresh Start / 0 Aduan).
 */
function handleResetToZero() {
  const sheet = getOrCreateSheet(SHEET_NAME_ADUAN, HEADERS_ADUAN);
  const lastRow = sheet.getLastRow();
  let deletedRows = 0;

  if (lastRow > 1) {
    deletedRows = lastRow - 1;
    // Hapus seluruh baris data mulai dari baris 2
    sheet.deleteRows(2, deletedRows);
  }

  writeLog('RESET_DATABASE', 'Seluruh data aduan dibersihkan (reset ke 0 aduan). Siap pengujian baru.');

  return {
    success: true,
    message: 'Database Google Spreadsheet berhasil dikosongkan (0 aduan). Sistem siap menerima pengujian baru.',
    deletedRows: deletedRows,
    count: 0
  };
}

/**
 * Jalankan fungsi ini langsung dari editor Apps Script untuk mengosongkan spreadsheet (0 aduan)
 */
function resetDatabaseToZero() {
  const res = handleResetToZero();
  SpreadsheetApp.getUi().alert(
    '✅ Database Berhasil Direset ke 0 Aduan!\n\n' +
    'Seluruh data lama (' + res.deletedRows + ' baris) telah dibersihkan.\n' +
    'Spreadsheet kini dalam kondisi awal yang bersih untuk pengujian.'
  );
}


// ==================================================================================
// FUNGSI PEMBANTU: INISIALISASI SPREADSHEET (Jalankan 1x untuk setup awal)
// ==================================================================================
/**
 * Jalankan fungsi ini secara manual (1 kali saja) dari menu Run di Apps Script Editor
 * untuk mempersiapkan sheet "Data_Aduan" dan "Log_Aktivitas" beserta header-nya (0 aduan).
 */
function setupSpreadsheet() {
  // Buat sheet Data_Aduan
  const sheetAduan = getOrCreateSheet(SHEET_NAME_ADUAN, HEADERS_ADUAN);

  // Buat sheet Log_Aktivitas
  const sheetLog = getOrCreateSheet(SHEET_NAME_LOG, ['Timestamp', 'Aksi', 'Detail']);

  // Tambahkan validasi dropdown untuk kolom Status
  const lastRow = sheetAduan.getMaxRows();
  const colStatus = HEADERS_ADUAN.indexOf('Status') + 1;
  if (colStatus > 0 && lastRow > 1) {
    const statusRange = sheetAduan.getRange(2, colStatus, lastRow - 1, 1);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Baru', 'Diverifikasi', 'Ditindaklanjuti', 'Selesai', 'Ditolak'])
      .setAllowInvalid(false)
      .build();
    statusRange.setDataValidation(rule);
  }

  // Tambahkan validasi dropdown untuk kolom Kecamatan
  const colKec = HEADERS_ADUAN.indexOf('Kecamatan') + 1;
  if (colKec > 0 && lastRow > 1) {
    const kecRange = sheetAduan.getRange(2, colKec, lastRow - 1, 1);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList([
        'Nubatukan', 'Ile Ape', 'Ile Ape Timur', 'Lebatukan',
        'Nagawutung', 'Wulandoni', 'Atadei', 'Omesuri', 'Buyasuri'
      ])
      .setAllowInvalid(true)
      .build();
    kecRange.setDataValidation(rule);
  }

  // Tulis log
  writeLog('SETUP', 'Spreadsheet berhasil diinisialisasi. Sheet: Data_Aduan, Log_Aktivitas');

  // Feedback ke user
  SpreadsheetApp.getUi().alert(
    '✅ Setup Berhasil!\n\n' +
    'Sheet "Data_Aduan" dan "Log_Aktivitas" telah siap.\n' +
    'Silakan lanjutkan dengan Deploy > New deployment > Web app.'
  );
}


// ==================================================================================
// FUNGSI PEMBANTU: ISI DATA SAMPEL RESMI BERSIH (Opsional, untuk uji coba)
// ==================================================================================
/**
 * Jalankan fungsi ini untuk mengisi 8 baris data aduan resmi Kabupaten Lembata.
 * Data tersusun rapi berurutan ADU-LMB-2026-001 s/d ADU-LMB-2026-008.
 */
function insertSampleData() {
  const sheet = getOrCreateSheet(SHEET_NAME_ADUAN, HEADERS_ADUAN);

  const samples = [
    [
      'ADU-LMB-2026-001', '2026-09-12 09:15', 'Fransiskus Kedang', '081234567890',
      'Kel. Selandoro, Nubatukan', 'Nubatukan', 'Lewoleba Tengah',
      'Pesisir Dermaga Jeti Rakyat Lewoleba', -8.3615, 123.5512,
      'Laut & Pesisir', 'Terdapat ceceran oli bekas dan limbah bahan bakar kapal motor yang mengapung di dermaga.',
      'Aktivitas bengkel perahu & nelayan', '2026-09-11', 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=700&q=80',
      'Selesai', 'Yohanes B. (Pengendali Dampak Lingkungan)', '2026-09-13',
      'Terbukti ada ceceran oli sekitar 15 m² dekat tambatan kapal.',
      'Pembersihan tumpahan oli dengan absorbent pad', '2026-09-16'
    ],
    [
      'ADU-LMB-2026-002', '2026-09-18 14:30', 'Theresia Purek', '082198765432',
      'Desa Hadakewa, Lebatukan', 'Lebatukan', 'Hadakewa',
      'Jalan poros dekat area pantai belakang pasar ikan', -8.3580, 123.6650,
      'Sampah Ilegal & Bau', 'Penumpukan sampah sisa ikan dan plastik dibuang liar di semak pantai.',
      'Pedagang liar & oknum warga sekitar pasar', '2026-09-17', 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=700&q=80',
      'Selesai', 'Agustinus L. (Staf Kebersihan DLH)', '2026-09-19',
      'Timbunan sampah liar volume ~2 m³ membusuk.',
      'Pengangkutan seluruh sampah dengan armada truk DLH', '2026-09-21'
    ],
    [
      'ADU-LMB-2026-003', '2026-09-25 11:20', 'Petrus Laba', '085233445566',
      'Desa Waipukang, Ile Ape', 'Ile Ape', 'Waipukang',
      'Lembah lereng dekat road usaha tani', -8.2830, 123.5410,
      'Udara & Asap', 'Pembakaran ban bekas dan tumpukan material kabel setiap sore hari.',
      'Aktivitas pengumpul rongsokan liar', '2026-09-24', 'https://images.unsplash.com/photo-1569163139599-0f4517e36f51?auto=format&fit=crop&w=700&q=80',
      'Dalam Penanganan', 'Maria E. Karangora (PPNS LH)', '2026-09-27',
      'Ditemukan sisa abu pembakaran ban dan kabel tembaga.',
      'Pemberian Surat Peringatan ke-1', '-'
    ],
    [
      'ADU-LMB-2026-004', '2026-10-01 08:45', 'Kornelis Making', '081377889900',
      'Desa Kalikasa, Atadei', 'Atadei', 'Kalikasa',
      'Aliran anak sungai Wai Henga', -8.4555, 123.5685,
      'Pencemaran Air', 'Air sungai keruh pekat akibat pembuangan material proyek galian.',
      'Material proyek galian dibuang langsung ke sungai', '2026-09-30', 'https://images.unsplash.com/photo-1574482620826-40685ca5ebd2?auto=format&fit=crop&w=700&q=80',
      'Sedang Diverifikasi', 'Ir. Damianus T. (Kabid Penataan DLH)', '2026-10-03',
      'Sampel air telah diambil untuk uji parameter kekeruhan.',
      'Menyusun rekomendasi teknis kolam endap', '-'
    ],
    [
      'ADU-LMB-2026-005', '2026-10-03 16:10', 'Siti Aminah', '082233441122',
      'Desa Balauring, Omesuri', 'Omesuri', 'Balauring',
      'Kawasan mangrove muara teluk Balauring', -8.2355, 123.8220,
      'Limbah B3 & Plastik', 'Drum bekas cairan kimia/aki bekas di antara vegetasi bakau tepi muara.',
      'Bengkel aki liar / penampung tanpa izin', '2026-10-02', 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=700&q=80',
      'Aduan Diterima', '-', '-',
      'Menunggu penugasan verifikator lapangan.',
      'Aduan telah dicatat ke sistem.', '-'
    ],
    [
      'ADU-LMB-2026-006', '2026-10-04 10:00', 'Yosefina Lipat', '081266778899',
      'Desa Wairiang, Buyasuri', 'Buyasuri', 'Wairiang',
      'Pesisir pantai desa Wairiang', -8.1920, 123.9455,
      'Laut & Pesisir', 'Sampah kiriman plastik kemasan dan tali jaring hanyut memenuhi garis pantai.',
      'Arus laut sampah musiman & perahu nelayan', '2026-10-03', 'https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?auto=format&fit=crop&w=700&q=80',
      'Aduan Diterima', '-', '-',
      'Aduan masuk dan koordinasi dengan pemdes.',
      'Rencana aksi bersih pantai (clean up).', '-'
    ],
    [
      'ADU-LMB-2026-007', '2026-10-05 13:25', 'Markus Belang', '081355443322',
      'Desa Loang, Nagawutung', 'Nagawutung', 'Loang',
      'Kawasan pantai pasir putih Loang', -8.4900, 123.3850,
      'Kerusakan Lingkungan & Tanah', 'Pengambilan pasir laut secara masif menggunakan truk tanpa izin.',
      'Oknum penambang pasir liar', '2026-10-04', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80',
      'Sedang Diverifikasi', 'Petrus S. (Bidang Pengawasan LH)', '2026-10-06',
      'Terbukti terjadi lubang galian pasir sempadan pantai.',
      'Koordinasi Satpol PP untuk penertiban.', '-'
    ],
    [
      'ADU-LMB-2026-008', '2026-09-05 08:30', 'Antonius Boli', '081244556677',
      'Desa Wulandoni, Wulandoni', 'Wulandoni', 'Wulandoni',
      'Area pasar barter tradisional Wulandoni', -8.5410, 123.4910,
      'Pencemaran Air', 'Diduga air sumur warga tercemar rembesan limbah pengolahan daging paus/ikan.',
      'Saluran drainase tradisional mampet', '2026-09-04', 'https://images.unsplash.com/photo-1584555613497-9ecf9dd06f68?auto=format&fit=crop&w=700&q=80',
      'Ditolak', 'Tim Gabungan DLH & Dinkes', '2026-09-07',
      'Bukan limbah B3 melainkan drainase umum tersumbat.',
      'Diserahkan kepada pengelola pasar.', '2026-09-08'
    ]
  ];

  samples.forEach(row => {
    sheet.appendRow(row);
  });

  writeLog('SAMPLE_DATA', 'Data sampel resmi sebanyak ' + samples.length + ' baris (001 s/d 008) berhasil ditambahkan.');

  SpreadsheetApp.getUi().alert(
    '✅ Data Bersih Berhasil Ditambahkan!\n\n' +
    samples.length + ' baris data aduan terstruktur rapi (ADU-LMB-2026-001 s/d 008) telah disisipkan ke sheet "Data_Aduan".'
  );
}


// ==================================================================================
// HANDLER PEMULIHAN SANDI & KONFIRMASI EMAIL PETUGAS
// ==================================================================================

/**
 * Mengirimkan kode OTP pemulihan sandi ke email resmi petugas
 */
function handleSendResetPin(data) {
  const email = String(data.email || '').trim();
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Alamat email petugas tidak valid.' };
  }

  // Generate 6 digit angka OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const timestamp = new Date().getTime();

  // Simpan ke script properties (berlaku 15 menit)
  const props = PropertiesService.getScriptProperties();
  props.setProperty('RESET_OTP_' + email.toLowerCase(), JSON.stringify({
    otp: otp,
    expires: timestamp + (15 * 60 * 1000)
  }));

  const subject = '🔐 Kode Konfirmasi Pemulihan Sandi Dashboard Petugas DLH Lembata';
  const body = 
    'Halo Petugas Verifikator DLH Lembata,\n\n' +
    'Permintaan pemulihan PIN / Kata Sandi untuk Dashboard Petugas SILAPOR DLH Lembata telah diterima.\n\n' +
    '👉 KODE KONFIRMASI (OTP) ANDA: ' + otp + '\n\n' +
    'Kode ini berlaku selama 15 menit.\n' +
    'Silakan masukkan kode konfirmasi ini pada layar Lupa Sandi untuk membuat PIN baru.\n\n' +
    'Jika Anda tidak merasa mengajukan pemulihan ini, abaikan email ini.\n\n' +
    'Salam Hormat,\n' +
    'Sistem SILAPOR & Pengawasan Lingkungan Hidup\n' +
    'Dinas Lingkungan Hidup Kabupaten Lembata';

  try {
    MailApp.sendEmail(email, subject, body);
    writeLog('RESET_PIN_SENT', 'Kode OTP dikirimkan ke email: ' + email);
    return {
      success: true,
      message: 'Kode konfirmasi telah dikirim ke email ' + email + '. Silakan periksa kotak masuk atau spam.',
      email: email
    };
  } catch (err) {
    writeLog('RESET_PIN_FAIL', 'Gagal kirim email ke ' + email + ': ' + err.message);
    // Berikan kode cadangan jika kuota Google Workspace/Personal dibatasi
    return {
      success: true,
      message: 'Permintaan diproses. Kode konfirmasi cadangan disiapkan: ' + otp,
      fallbackOtp: otp,
      email: email
    };
  }
}

/**
 * Memverifikasi kode OTP dan menetapkan PIN baru
 */
function handleVerifyResetPin(data) {
  const email = String(data.email || '').trim().toLowerCase();
  const enteredOtp = String(data.otp || '').trim();
  const newPin = String(data.newPin || '').trim();

  if (!email || !enteredOtp || !newPin) {
    return { success: false, error: 'Email, kode konfirmasi (OTP), dan PIN baru wajib diisi.' };
  }

  const props = PropertiesService.getScriptProperties();
  const rawData = props.getProperty('RESET_OTP_' + email);

  if (!rawData) {
    return { success: false, error: 'Permintaan reset tidak ditemukan atau telah kedaluwarsa. Silakan ajukan ulang.' };
  }

  try {
    const parsed = JSON.parse(rawData);
    if (new Date().getTime() > parsed.expires) {
      props.deleteProperty('RESET_OTP_' + email);
      return { success: false, error: 'Kode konfirmasi telah kedaluwarsa. Silakan ajukan ulang.' };
    }

    if (parsed.otp !== enteredOtp) {
      return { success: false, error: 'Kode konfirmasi (OTP) yang Anda masukkan tidak sesuai.' };
    }

    // Sukses verifikasi, hapus token
    props.deleteProperty('RESET_OTP_' + email);
    writeLog('RESET_PIN_SUCCESS', 'Sandi petugas untuk ' + email + ' berhasil diperbarui.');

    return {
      success: true,
      message: 'Konfirmasi email berhasil! PIN baru telah aktif.',
      newPin: newPin
    };
  } catch (err) {
    return { success: false, error: 'Terjadi kesalahan pemrosesan kode: ' + err.message };
  }
}

// ==================================================================================
// HANDLER AKSI: RESET KE 0 ADUAN (FRESH START / PENYEGARAN PENUH)
// ==================================================================================

/**
 * Mengosongkan seluruh baris data aduan (Fresh Start: 0 Aduan)
 * Menyisakan baris header saja pada sheet Data_Aduan.
 * Dipanggil via Web App API (GET/POST ?action=resetToZero) atau tombol petugas.
 */
function handleResetToZero() {
  const sheet = getOrCreateSheet(SHEET_NAME_ADUAN, HEADERS_ADUAN);
  const lastRow = sheet.getLastRow();
  let deletedCount = 0;

  if (lastRow > 1) {
    deletedCount = lastRow - 1;
    sheet.deleteRows(2, deletedCount);
  }

  writeLog('RESET_TO_ZERO', 'Seluruh data aduan (' + deletedCount + ' baris) dikosongkan. Database 0 aduan siap untuk pengujian awal baru.');

  return {
    success: true,
    message: 'Data spreadsheet berhasil dikosongkan menjadi 0 aduan. Sistem siap untuk pengujian awal baru.',
    deletedCount: deletedCount,
    remainingRows: 0
  };
}

/**
 * Alias fungsi untuk dijalankan langsung dari menu Run/Jalankan di editor Apps Script
 */
function resetDatabaseToZero() {
  const result = handleResetToZero();
  Logger.log(JSON.stringify(result));
  return result;
}

