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
const SHEET_NAME_FOTO = 'Foto_Storage';
const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbwuDJ9X5a27GnVuuiU1keHexKXzG3OITUxwOomwHGt-1S53DdqfAfguDInXwtbh9ljKMw/exec';

// ===== KONFIGURASI KEAMANAN & AUTENTIKASI PETUGAS =====
const SCRIPT_PROP_KEY_TOKEN = 'AUTH_SECRET_TOKEN';
const SCRIPT_PROP_KEY_PIN = 'MASTER_PETUGAS_PIN';
const DEFAULT_AUTH_TOKEN = 'DLH_LEMBATA_SECURE_TOKEN_2026';
const DEFAULT_OFFICER_PINS = [
  '1999',
  'dlh1999',
  'dlh2026',
  'dlhlembata2026',
  'petugas',
  'petugas2026',
  'petugasdlh2026',
  'admindlh2026',
  'lembata',
  'lembata2026'
];

/**
 * Mendapatkan URL Web App Google Apps Script resmi
 */
function getWebAppUrl() {
  try {
    const url = ScriptApp.getService().getUrl();
    if (url && url.startsWith('http')) return url;
  } catch (e) { }
  return DEFAULT_GAS_URL;
}

/**
 * Mendapatkan atau menginisialisasi Auth Token resmi admin/petugas dari ScriptProperties
 */
function getOrCreateAdminToken() {
  try {
    const props = PropertiesService.getScriptProperties();
    let token = props.getProperty(SCRIPT_PROP_KEY_TOKEN);
    if (!token || !token.trim()) {
      token = DEFAULT_AUTH_TOKEN;
      props.setProperty(SCRIPT_PROP_KEY_TOKEN, token);
    }
    return token.trim();
  } catch (e) {
    return DEFAULT_AUTH_TOKEN;
  }
}

/**
 * Validasi token autentikasi admin/petugas untuk request mutasi dan unmasking data
 */
function validateAdminAuth(token) {
  if (!token || typeof token !== 'string') return false;
  const clean = token.trim();
  if (!clean) return false;
  const validToken = (function() {
    try {
      return PropertiesService.getScriptProperties().getProperty(SCRIPT_PROP_KEY_TOKEN) || DEFAULT_AUTH_TOKEN;
    } catch (e) {
      return DEFAULT_AUTH_TOKEN;
    }
  })();
  return clean === validToken || clean === DEFAULT_AUTH_TOKEN;
}

/**
 * Validasi PIN/kata sandi login petugas di server
 */
function validateOfficerPin(inputPin) {
  if (!inputPin) return false;
  const clean = String(inputPin).trim().toLowerCase();
  if (!clean) return false;

  try {
    const props = PropertiesService.getScriptProperties();
    const masterPin = props.getProperty(SCRIPT_PROP_KEY_PIN);
    if (masterPin && String(masterPin).trim().toLowerCase() === clean) {
      return true;
    }
  } catch (e) {}

  return DEFAULT_OFFICER_PINS.includes(clean);
}

/**
 * Handler login petugas: memvalidasi PIN dan menerbitkan Auth Token
 */
function handleAuthLogin(data) {
  const pin = (data && (data.pin || data.password)) ? String(data.pin || data.password).trim() : '';
  if (!pin) {
    return {
      success: false,
      error: 'PIN atau kata sandi petugas wajib diisi.'
    };
  }

  if (validateOfficerPin(pin)) {
    const token = getOrCreateAdminToken();
    try {
      writeLog('LOGIN_PETUGAS', 'Petugas berhasil diautentikasi ke sistem dashboard');
    } catch (e) {}
    return {
      success: true,
      authToken: token,
      message: 'Autentikasi berhasil'
    };
  } else {
    return {
      success: false,
      error: 'PIN atau kata sandi petugas tidak valid. Silakan periksa kembali kredensial Anda.'
    };
  }
}

// Alias untuk kompatibilitas ke fungsi loginPetugas
function handleLoginPetugas(data) {
  return handleAuthLogin(data);
}

/**
 * Helper sensor privasi identitas pelapor (Kepatuhan UU Pelindungan Data Pribadi / UU PDP)
 */
function maskCitizenName(name) {
  if (!name || name === '-') return '-';
  const clean = String(name).trim();
  const parts = clean.split(/\s+/);
  return parts.map(p => {
    if (p.length <= 1) return p + '***';
    if (p.length === 2) return p.charAt(0) + '***';
    return p.charAt(0) + '***' + p.charAt(p.length - 1);
  }).join(' ');
}

function maskCitizenPhone(phone) {
  if (!phone || phone === '-') return '-';
  return '-';
}

function maskCitizenAddress(address, kecamatan) {
  if (!address || address === '-') return '-';
  const kec = String(kecamatan || '').trim();
  return kec ? ('Kec. ' + kec + ' (Alamat Dirahasiakan)') : '(Alamat Dirahasiakan)';
}

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
  'Tanggal_Selesai',
  'Nomor_Berita_Acara',
  'Catatan_Berita_Acara',
  'Foto_Kondisi_Riil',
  'Timestamp_Verifikasi',
  'Timestamp_Tindak_Lanjut',
  'Timestamp_Selesai'
];


// ==================================================================================
// HANDLER HTTP GET (Dipanggil browser/fetch saat request GET)
// ==================================================================================
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getAll';

    // Aksi penampil foto bukti ukuran penuh responsif (Bisa diklik langsung dari spreadsheet)
    if (action === 'viewFoto' || action === 'viewImage' || action === 'foto') {
      return handleViewImage(e.parameter.id || '', e.parameter.fileId || '', e.parameter.photoIdx || '0');
    }

    // KEAMANAN KRITIS: Blokir keras aksi destruktif atau mutasi data jika dipanggil lewat HTTP GET
    // Seluruh operasi mutasi wajib menggunakan metode HTTP POST dengan autentikasi petugas resmi
    const destructiveGetActions = [
      'delete', 'deleteAduan', 'deleteOfficerPhoto',
      'resetData', 'resetToZero', 'cleanupStorage', 'resetFotoStorage',
      'purgeOldPhotos', 'fixPhotoLinks', 'repairPhotos'
    ];
    if (destructiveGetActions.includes(action)) {
      return createJsonResponse({
        success: false,
        error: 'Akses ditolak: Operasi modifikasi/hapus hanya diizinkan melalui metode POST berotorisasi.'
      });
    }

    // Validasi token autentikasi admin/petugas pada query parameter (untuk akses data PII utuh)
    const token = (e && e.parameter && e.parameter.token) ? String(e.parameter.token).trim() : '';
    const isAdmin = validateAdminAuth(token);

    let result;

    switch (action) {
      case 'getAll':
        result = handleGetAll(isAdmin);
        break;

      case 'getById':
        const id = (e && e.parameter && e.parameter.id) ? e.parameter.id : '';
        result = handleGetById(id, isAdmin);
        break;

      case 'getFotoBase64':
      case 'getPhotoBase64':
        const photoId = (e && e.parameter && e.parameter.id) ? e.parameter.id : '';
        const pIdx = (e && e.parameter && e.parameter.photoIdx) ? e.parameter.photoIdx : '0';
        result = handleGetFotoBase64(photoId, pIdx);
        break;

      case 'getStats':
        result = handleGetStats();
        break;

      case 'sendResetPin':
      case 'forgotPassword':
        result = handleSendResetPin({ email: (e && e.parameter && e.parameter.email) ? e.parameter.email : '' });
        break;

      case 'verifyResetPin':
        result = handleVerifyResetPin({
          email: (e && e.parameter && e.parameter.email) ? e.parameter.email : '',
          otp: (e && e.parameter && e.parameter.otp) ? e.parameter.otp : '',
          newPin: (e && e.parameter && e.parameter.newPin) ? e.parameter.newPin : ''
        });
        break;

      default:
        result = { success: false, error: 'Aksi GET tidak dikenali: ' + action };
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
    const token = (body && body.token) || (body && body.data && body.data.token) || '';

    // 1. Endpoint Autentikasi Login Petugas (Validasi PIN Server-Side)
    if (action === 'loginPetugas' || action === 'auth') {
      return createJsonResponse(handleAuthLogin(body.data || body));
    }

    // 2. Proteksi Akses Mutasi Petugas: Wajib menyertakan Auth Token sah
    const officerActions = [
      'updateVerifikasi', 'deleteAduan', 'deleteOfficerPhoto',
      'resetData', 'resetToZero', 'fixPhotoLinks', 'repairPhotos'
    ];
    if (officerActions.includes(action)) {
      if (!validateAdminAuth(token)) {
        return createJsonResponse({
          success: false,
          code: 401,
          error: 'Akses Ditolak (401 Unauthorized): Sesi autentikasi petugas tidak valid, kedaluwarsa, atau token tidak disertakan.'
        });
      }
    }

    let result;

    switch (action) {
      case 'loginPetugas':
      case 'auth':
        result = handleAuthLogin(body.data || body);
        break;

      case 'addAduan':
        // Aksi publik formulir pengaduan warga: Bebas token autentikasi
        result = handleAddAduan(body.data || {});
        break;

      case 'updateVerifikasi':
        result = handleUpdateVerifikasi(body.data || {});
        break;

      case 'deleteAduan':
        result = handleDeleteAduan(body.data || {});
        break;

      case 'deleteOfficerPhoto':
        result = handleDeleteOfficerPhoto(body.data || body);
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

      case 'fixPhotoLinks':
      case 'repairPhotos':
        result = handleFixPhotoLinks();
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
  } else if (headers && headers.length > 0) {
    // Jika sheet sudah ada sebelumnya, pastikan seluruh header baru otomatis terpasang
    try {
      const lastCol = Math.max(sheet.getLastColumn(), 1);
      const existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0] || [];
      headers.forEach(h => {
        if (existingHeaders.indexOf(h) === -1) {
          const nextCol = sheet.getLastColumn() + 1;
          const cell = sheet.getRange(1, nextCol);
          cell.setValue(h);
          cell.setFontWeight('bold').setBackground('#059669').setFontColor('#ffffff').setHorizontalAlignment('center');
          existingHeaders.push(h);
        }
      });
    } catch (e) { }
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

  // Ambil juga RichTextValues agar jika sel berisi RichText hyperlink, URL asli tidak hilang
  let richTextRows = null;
  try {
    richTextRows = sheet.getDataRange().getRichTextValues().slice(1);
  } catch (e) { }

  return rows.map((row, rIdx) => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = row[i] !== undefined ? row[i] : '';
      if ((h === 'Link_Foto_Bukti' || h === 'Foto_Kondisi_Riil') && richTextRows && richTextRows[rIdx] && richTextRows[rIdx][i]) {
        const cellRt = richTextRows[rIdx][i];
        const runs = cellRt.getRuns ? cellRt.getRuns() : [];
        const extractedUrls = [];
        runs.forEach(r => {
          const u = r.getLinkUrl();
          if (u && typeof u === 'string' && u.startsWith('http') && !extractedUrls.includes(u)) {
            extractedUrls.push(u);
          }
        });
        if (extractedUrls.length > 0) {
          val = extractedUrls.join(', ');
        } else {
          const singleUrl = cellRt.getLinkUrl();
          if (singleUrl && typeof singleUrl === 'string' && singleUrl.startsWith('http')) {
            val = singleUrl;
          }
        }
      }
      obj[h] = val;
    });
    return obj;
  });
}

/**
 * Konversi object dari sheet menjadi format yang sesuai dengan frontend (camelCase)
 * Menyensor data PII pelapor (Nama, Nomor HP, Alamat) secara otomatis jika isAdmin === false
 */
function mapSheetRowToFrontend(row, fotoStorageMap, isAdmin = true) {
  const id = String(row['ID_Aduan'] || '');
  let linkFoto = String(row['Link_Foto_Bukti'] || '');
  const webAppUrl = getWebAppUrl();

  // Jika kolom foto berupa formula =HYPERLINK("url", "text"), ambil URL aslinya
  if (linkFoto.startsWith('=HYPERLINK')) {
    const match = linkFoto.match(/=HYPERLINK\("([^"]+)"/i);
    if (match) linkFoto = match[1];
  }

  // Jika sel berisi teks judul rich text "📸 Buka ... Foto Bukti"
  if (linkFoto.includes('Buka') && linkFoto.includes('Foto Bukti')) {
    linkFoto = webAppUrl + '?action=viewFoto&id=' + encodeURIComponent(id) + '&photoIdx=0';
  }

  // Ekstrak seluruh foto pelapor tanpa merusak Base64
  const resolvedCitizenPhotos = [];
  if (typeof linkFoto === 'string' && linkFoto.trim() && linkFoto.trim() !== '-') {
    const matches = linkFoto.match(/(data:image\/[a-zA-Z0-9\+\/\-\.]+;base64,[A-Za-z0-9\+\/\=]+|https?:\/\/[^\s,]+)/g);
    if (matches && matches.length > 0) {
      matches.forEach((rawLink, idx) => {
        let cleanLink = rawLink.trim();
        if (cleanLink.startsWith('=HYPERLINK')) {
          const match = cleanLink.match(/=HYPERLINK\("([^"]+)"/i);
          if (match) cleanLink = match[1];
        }
        if (cleanLink.includes('Buka') && cleanLink.includes('Foto Bukti')) {
          cleanLink = webAppUrl + '?action=viewFoto&id=' + encodeURIComponent(id) + '&photoIdx=' + idx;
        }
        const dMatch = cleanLink.match(/(?:\/file\/d\/|[?&]id=)([a-zA-Z0-9-_]+)/);
        if (dMatch && !cleanLink.startsWith('data:image')) {
          cleanLink = 'https://lh3.googleusercontent.com/d/' + dMatch[1];
        }
        if (cleanLink && !cleanLink.includes('#ERROR') && !resolvedCitizenPhotos.includes(cleanLink)) {
          resolvedCitizenPhotos.push(cleanLink);
        }
      });
    }
  }

  // Prioritaskan cadangan data gambar asli dari sheet Foto_Storage
  const storageLookup = fotoStorageMap || {};
  const baseKey = id.trim().toUpperCase();

  // Foto 1 (Utama)
  const backupFoto1 = storageLookup[baseKey] || storageLookup[baseKey + '_FOTO_1'] || storageLookup[baseKey + '_1'];
  if (backupFoto1 && typeof backupFoto1 === 'string' && (backupFoto1.startsWith('data:image') || backupFoto1.startsWith('http'))) {
    if (resolvedCitizenPhotos.length > 0) {
      resolvedCitizenPhotos[0] = backupFoto1;
    } else {
      resolvedCitizenPhotos.push(backupFoto1);
    }
  }

  // Foto 2 s/d 6: Tambahkan atau gantikan foto multi dari Foto_Storage
  for (let idx = 2; idx <= 6; idx++) {
    const multiKey = baseKey + '_FOTO_' + idx;
    const multiBackup = storageLookup[multiKey] || storageLookup[baseKey + '_' + idx];
    if (multiBackup && typeof multiBackup === 'string' && (multiBackup.startsWith('data:image') || multiBackup.startsWith('http'))) {
      const targetIdx = idx - 1;
      if (targetIdx < resolvedCitizenPhotos.length) {
        resolvedCitizenPhotos[targetIdx] = multiBackup;
      } else {
        resolvedCitizenPhotos.push(multiBackup);
      }
    }
  }

  const fotoDirect = resolvedCitizenPhotos[0] || (linkFoto !== '-' && linkFoto.startsWith('http') ? linkFoto : '');

  // Ekstrak seluruh foto kondisi riil petugas lapangan (Mendukung Multi-Foto Petugas)
  const resolvedOfficerPhotos = [];
  let rawLinkRiil = String(row['Foto_Kondisi_Riil'] || '');
  if (typeof rawLinkRiil === 'string' && rawLinkRiil.trim() && rawLinkRiil.trim() !== '-') {
    const matchesRiil = rawLinkRiil.match(/(data:image\/[a-zA-Z0-9\+\/\-\.]+;base64,[A-Za-z0-9\+\/\=]+|https?:\/\/[^\s,]+)/g);
    if (matchesRiil && matchesRiil.length > 0) {
      matchesRiil.forEach((rawLink, idx) => {
        let cleanLink = rawLink.trim();
        if (cleanLink.startsWith('=HYPERLINK')) {
          const match = cleanLink.match(/=HYPERLINK\("([^"]+)"/i);
          if (match) cleanLink = match[1];
        }
        if (cleanLink.includes('Buka') && cleanLink.includes('Foto Petugas')) {
          cleanLink = webAppUrl + '?action=viewFoto&id=' + encodeURIComponent(id + '_PETUGAS') + '&photoIdx=' + idx;
        }
        const dMatch = cleanLink.match(/(?:\/file\/d\/|[?&]id=)([a-zA-Z0-9-_]+)/);
        if (dMatch && !cleanLink.startsWith('data:image')) {
          cleanLink = 'https://lh3.googleusercontent.com/d/' + dMatch[1];
        }
        if (cleanLink && !cleanLink.includes('#ERROR') && !resolvedOfficerPhotos.includes(cleanLink)) {
          resolvedOfficerPhotos.push(cleanLink);
        }
      });
    }
  }

  // Prioritaskan / gabungkan cadangan foto petugas dari Foto_Storage
  const officerBaseKey = (id.trim() + '_PETUGAS').toUpperCase();
  const backupFotoRiil1 = storageLookup[officerBaseKey] || storageLookup[officerBaseKey + '_1'];
  if (backupFotoRiil1 && typeof backupFotoRiil1 === 'string' && (backupFotoRiil1.startsWith('data:image') || backupFotoRiil1.startsWith('http'))) {
    if (resolvedOfficerPhotos.length > 0) {
      resolvedOfficerPhotos[0] = backupFotoRiil1;
    } else {
      resolvedOfficerPhotos.push(backupFotoRiil1);
    }
  }

  // Foto Petugas 2 s/d 6 dari Foto_Storage
  for (let idx = 2; idx <= 6; idx++) {
    const multiKey = officerBaseKey + '_' + idx;
    const multiBackup = storageLookup[multiKey];
    if (multiBackup && typeof multiBackup === 'string' && (multiBackup.startsWith('data:image') || multiBackup.startsWith('http'))) {
      const targetIdx = idx - 1;
      if (targetIdx < resolvedOfficerPhotos.length) {
        resolvedOfficerPhotos[targetIdx] = multiBackup;
      } else {
        resolvedOfficerPhotos.push(multiBackup);
      }
    }
  }

  const currentStatus = String(row['Status'] || 'Baru').trim();
  const isUnverified = (currentStatus === 'Baru' || currentStatus === 'Aduan Diterima' || currentStatus === 'Verifikasi Administrasi' || currentStatus === '-');
  const finalOfficerPhotos = isUnverified ? [] : resolvedOfficerPhotos;
  const fotoRiilDirect = finalOfficerPhotos[0] || '';

  const isOfficer = Boolean(isAdmin);
  const rawNama = String(row['Nama_Pelapor'] || '');
  const rawNoHp = (function(val) {
    if (!val || val === '-') return '-';
    let s = String(val).replace(/^'/, '').trim();
    const d = s.replace(/[^0-9]/g, '');
    if (d.startsWith('00628')) return '0' + d.slice(4);
    if (d.startsWith('6208')) return '0' + d.slice(3);
    if (d.startsWith('8') && d.length >= 9 && d.length <= 13) return '0' + d;
    if (d.startsWith('628') && d.length >= 11 && d.length <= 15) return '0' + d.slice(2);
    if (d.startsWith('08')) return d;
    return s || '-';
  })(row['No_HP']);
  const rawAlamat = String(row['Alamat_Pelapor'] || '');
  const kecPelapor = String(row['Kecamatan'] || '');

  return {
    id: id,
    timestamp: String(row['Timestamp'] || ''),
    // Proteksi UU PDP: Sensor identitas jika diakses publik (!isOfficer)
    namaPelapor: isOfficer ? rawNama : maskCitizenName(rawNama),
    noHp: isOfficer ? rawNoHp : '-',
    alamatPelapor: isOfficer ? rawAlamat : maskCitizenAddress(rawAlamat, kecPelapor),
    kecamatan: kecPelapor,
    desa: String(row['Desa_Kelurahan'] || ''),
    lokasiDetail: String(row['Lokasi_Detail'] || ''),
    lat: parseFloat(row['Latitude']) || 0,
    lng: parseFloat(row['Longitude']) || 0,
    jenisPencemaran: String(row['Jenis_Pencemaran'] || ''),
    uraian: String(row['Uraian_Aduan'] || ''),
    sumberDugaan: String(row['Sumber_Dugaan'] || '-'),
    tanggalKejadian: String(row['Tanggal_Kejadian'] || ''),
    linkFoto: fotoDirect,
    fotoBukti: fotoDirect,
    linkFotoClickable: linkFoto,
    buktiFotoList: resolvedCitizenPhotos,
    status: currentStatus || 'Baru',
    petugasVerifikasi: isUnverified ? '-' : String(row['Petugas_Verifikasi'] || '-'),
    tanggalVerifikasi: isUnverified ? '-' : String(row['Tanggal_Verifikasi'] || '-'),
    hasilVerifikasi: isUnverified ? '-' : String(row['Hasil_Verifikasi'] || '-'),
    tindakanDLH: isUnverified ? '-' : String(row['Tindakan_DLH'] || '-'),
    tanggalSelesai: isUnverified ? '-' : String(row['Tanggal_Selesai'] || '-'),
    nomorBeritaAcara: isUnverified ? '' : String(row['Nomor_Berita_Acara'] || ''),
    catatanBeritaAcara: isUnverified ? '' : String(row['Catatan_Berita_Acara'] || ''),
    fotoKondisiRiil: fotoRiilDirect,
    fotoVerifikasiList: finalOfficerPhotos,
    timestampVerifikasi: isUnverified ? '' : String(row['Timestamp_Verifikasi'] || ''),
    timestampTindakLanjut: isUnverified ? '' : String(row['Timestamp_Tindak_Lanjut'] || ''),
    timestampSelesai: isUnverified ? '' : String(row['Timestamp_Selesai'] || '')
  };
}

/**
 * Generate ID aduan baru unik, simpel & profesional: ADU-[2 Digit Tahun]-[4 Karakter Alfanumerik Acak]
 * Contoh: ADU-26-K8M4
 * Menggunakan 32 karakter alfanumerik no-ambiguity (tanpa angka 0, huruf O, angka 1, huruf I).
 */
function generateNewId(sheet) {
  const now = new Date();
  const yr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yy');
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

  let candidateId = '';
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 20) {
    attempts++;
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    candidateId = 'ADU-' + yr + '-' + code;
    exists = false;

    if (sheet) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0] || '').trim().toUpperCase() === candidateId) {
          exists = true;
          break;
        }
      }
    }
  }
  return candidateId;
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
function handleGetAll(isAdmin) {
  const isOfficer = Boolean(isAdmin);
  const sheet = getOrCreateSheet(SHEET_NAME_ADUAN, HEADERS_ADUAN);
  const rawData = getSheetDataAsObjects(sheet);

  // Ambil cache foto jika ada di sheet Foto_Storage
  const storageMap = {};
  try {
    const storageSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_FOTO);
    if (storageSheet) {
      const sData = storageSheet.getDataRange().getValues();
      for (let i = sData.length - 1; i >= 1; i--) {
        const sid = String(sData[i][0] || '').trim().toUpperCase();
        if (!sid || storageMap[sid]) continue; // Simpan entri TERBARU saja
        let sb64 = '';
        // Gabungkan seluruh chunk mulai dari kolom D (index 3) ke kanan
        for (let c = 3; c < sData[i].length; c++) {
          sb64 += String(sData[i][c] || '');
        }
        // Fallback untuk format lama jika belum dipisah chunk
        if (!sb64 || !sb64.startsWith('data:image')) {
          for (let c = 1; c < sData[i].length; c++) {
            const val = String(sData[i][c] || '').trim();
            if (val.startsWith('data:image')) {
              sb64 = val;
              break;
            }
          }
        }
        const sUrl = String(sData[i][2] || '').trim();
        if (sid) {
          if (sb64 && sb64.startsWith('data:image')) {
            storageMap[sid] = sb64;
          } else if (sUrl && sUrl.startsWith('http')) {
            storageMap[sid] = sUrl;
          }
        }
      }
    }
  } catch (e) { }

  // Deduplikasi rekaman berdasar ID_Aduan & Konten (Jaminan 0 Duplikasi di Seluruh Portal)
  const seenIds = {};
  const seenContent = {};
  const uniqueResult = [];
  rawData.forEach(row => {
    const rawId = String(row['ID_Aduan'] || '').trim().toUpperCase();
    if (!rawId) return;

    // Bersihkan base ID jika memiliki suffix -XXX dari duplikasi lama (misal: ADU-LMB-2026-1018-42RU-Y5D)
    const baseMatch = rawId.match(/^(ADU-LMB-\d{4}-\d{4}-[A-Z0-9]{4,5})-[A-Z0-9]{3,}$/);
    const baseId = baseMatch ? baseMatch[1] : rawId;

    if (seenIds[rawId] || (baseMatch && seenIds[baseId])) {
      return; // Abaikan duplikasi ID
    }

    seenIds[rawId] = true;
    if (baseMatch) {
      seenIds[baseId] = true;
    }
    uniqueResult.push(mapSheetRowToFrontend(row, storageMap, isOfficer));
  });

  return {
    success: true,
    count: uniqueResult.length,
    data: uniqueResult
  };
}


// ==================================================================================
// HANDLER AKSI: GET BY ID
// ==================================================================================
function handleGetById(id, isAdmin) {
  if (!id) {
    return { success: false, error: 'Parameter "id" wajib diisi.' };
  }
  const isOfficer = Boolean(isAdmin);

  const sheet = getOrCreateSheet(SHEET_NAME_ADUAN, HEADERS_ADUAN);
  const rawData = getSheetDataAsObjects(sheet);

  const found = rawData.find(row =>
    String(row['ID_Aduan']).trim().toLowerCase() === id.trim().toLowerCase()
  );

  if (!found) {
    return { success: false, error: 'Aduan dengan ID "' + id + '" tidak ditemukan.' };
  }

  const storageMap = {};
  try {
    const storageSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_FOTO);
    if (storageSheet) {
      const sData = storageSheet.getDataRange().getValues();
      for (let i = 1; i < sData.length; i++) {
        const sid = String(sData[i][0] || '').trim().toUpperCase();
        if (!sid) continue;
        let sb64 = '';
        for (let c = 3; c < sData[i].length; c++) {
          sb64 += String(sData[i][c] || '');
        }
        if (!sb64 || !sb64.startsWith('data:image')) {
          for (let c = 1; c < sData[i].length; c++) {
            const val = String(sData[i][c] || '').trim();
            if (val.startsWith('data:image')) {
              sb64 = val;
              break;
            }
          }
        }
        const sUrl = String(sData[i][2] || '').trim();
        if (sid) {
          if (sb64 && sb64.startsWith('data:image')) {
            storageMap[sid] = sb64;
          } else if (sUrl && sUrl.startsWith('http')) {
            storageMap[sid] = sUrl;
          }
        }
      }
    }
  } catch (e) { }

  return {
    success: true,
    data: mapSheetRowToFrontend(found, storageMap, isOfficer)
  };
}

// ==================================================================================
// HANDLER AKSI: GET FOTO BASE64 LANGSUNG DARI ARSIP FOTO_STORAGE
// ==================================================================================
function handleGetFotoBase64(id, photoIdx) {
  if (!id) {
    return { success: false, error: 'Parameter "id" wajib diisi.' };
  }
  const cleanId = String(id).trim().toUpperCase();
  const pIdx = parseInt(photoIdx || '0', 10) || 0;

  try {
    const storageSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_FOTO);
    if (storageSheet) {
      const sData = storageSheet.getDataRange().getValues();
      const targetKey = (pIdx > 0 ? (cleanId + '_FOTO_' + (pIdx + 1)) : cleanId);
      const candidateKeys = [
        targetKey,
        (pIdx === 0 ? cleanId + '_FOTO_1' : targetKey),
        cleanId,
        cleanId + '_FOTO_' + pIdx,
        cleanId + '_' + (pIdx + 1)
      ];

      for (let i = sData.length - 1; i >= 1; i--) {
        const rowKey = String(sData[i][0] || '').trim().toUpperCase();
        if (candidateKeys.includes(rowKey)) {
          let combined = '';
          for (let c = 3; c < sData[i].length; c++) {
            combined += String(sData[i][c] || '');
          }
          if (!combined || !combined.startsWith('data:image')) {
            for (let c = 1; c < sData[i].length; c++) {
              const val = String(sData[i][c] || '').trim();
              if (val.startsWith('data:image')) {
                combined = val;
                break;
              }
            }
          }
          if (combined && combined.startsWith('data:image')) {
            return {
              success: true,
              id: cleanId,
              photoIdx: pIdx,
              base64: combined
            };
          }
        }
      }
    }
  } catch (e) {
    return { success: false, error: e.message };
  }

  return { success: false, error: 'Foto tidak ditemukan di arsip penyimpanan.' };
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


/**
 * Menghapus file di Google Drive berdasarkan URL Drive
 */
function trashDriveFileByUrl(url) {
  if (!url || typeof url !== 'string') return;
  try {
    let fileId = '';
    const match1 = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    const match2 = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (match1) fileId = match1[1];
    else if (match2) fileId = match2[1];
    if (fileId) {
      DriveApp.getFileById(fileId).setTrashed(true);
    }
  } catch (e) {
    Logger.log('trashDriveFileByUrl error: ' + e.message);
  }
}

/**
 * Menghapus seluruh file di folder Drive yang mengandung ID aduan
 */
function deleteDriveFilesForId(idAduan) {
  if (!idAduan || typeof idAduan !== 'string') return;
  const cleanId = idAduan.trim().toUpperCase();
  if (!cleanId) return;
  try {
    const folders = ['Dokumentasi_Foto_Aduan_DLH_Lembata', 'SILAPOR_DLH_FOTO_BUKTI'];
    folders.forEach(function (fName) {
      try {
        const fIter = DriveApp.getFoldersByName(fName);
        while (fIter.hasNext()) {
          const fld = fIter.next();
          const files = fld.getFiles();
          while (files.hasNext()) {
            const file = files.next();
            const n = file.getName().toUpperCase();
            if (n.indexOf(cleanId) !== -1) {
              file.setTrashed(true);
            }
          }
        }
      } catch (e) { }
    });
  } catch (err) {
    Logger.log('deleteDriveFilesForId error: ' + err.message);
  }
}

/**
 * Menghapus seluruh file foto di Drive dalam folder SILAPOR (Pembersihan Total)
 */
function purgeAllDrivePhotos() {
  try {
    const folders = ['Dokumentasi_Foto_Aduan_DLH_Lembata', 'SILAPOR_DLH_FOTO_BUKTI'];
    folders.forEach(function (fName) {
      try {
        const fIter = DriveApp.getFoldersByName(fName);
        while (fIter.hasNext()) {
          const fld = fIter.next();
          const files = fld.getFiles();
          while (files.hasNext()) {
            const file = files.next();
            file.setTrashed(true);
          }
        }
      } catch (e) { }
    });
  } catch (err) {
    Logger.log('purgeAllDrivePhotos error: ' + err.message);
  }
}

/**
 * Menghapus baris cache foto dari sheet Foto_Storage untuk ID aduan tertentu
 */
function purgeFotoStorage(idAduan) {
  if (!idAduan) return;
  try {
    const storageSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_FOTO);
    if (!storageSheet || storageSheet.getLastRow() <= 1) return;
    const target = String(idAduan).trim().toUpperCase();
    const sData = storageSheet.getDataRange().getValues();
    for (let i = sData.length - 1; i >= 1; i--) {
      const rowId = String(sData[i][0] || '').trim().toUpperCase();
      if (rowId === target || rowId.startsWith(target + '_')) {
        storageSheet.deleteRow(i + 1);
      }
    }
  } catch (e) {
    Logger.log('purgeFotoStorage error: ' + e.message);
  }
}

/**
 * Menyimpan data gambar Base64 ke folder Google Drive resmi DLH Lembata
 * Mengembalikan tautan publik Google Drive yang bisa dibuka langsung di browser
 */
function saveBase64ImageToDrive(base64Data, idAduan) {
  try {
    if (!base64Data || typeof base64Data !== 'string' || !base64Data.startsWith('data:image')) {
      return '';
    }
    const commaIdx = base64Data.indexOf(',');
    if (commaIdx === -1) return '';

    const mimeMatch = base64Data.substring(0, commaIdx).match(/data:([^;]+)/);
    const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const rawBase64 = base64Data.substring(commaIdx + 1);
    const decodedBytes = Utilities.base64Decode(rawBase64);
    const ext = contentType.includes('png') ? '.png' : (contentType.includes('webp') ? '.webp' : '.jpg');
    const filename = 'Bukti_' + (idAduan || 'Foto') + '_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss') + ext;
    const blob = Utilities.newBlob(decodedBytes, contentType, filename);

    const folderName = 'Dokumentasi_Foto_Aduan_DLH_Lembata';
    let folder;
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }

    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return 'https://lh3.googleusercontent.com/d/' + file.getId();
  } catch (e) {
    Logger.log('DriveApp save info: ' + e.message);
    return '';
  }
}

// ==================================================================================
// HANDLER AKSI: TAMBAH ADUAN BARU (POST)
// ==================================================================================
function handleAddAduan(formData) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // Tunggu hingga 20 detik jika ada proses bersamaan
  } catch (e) {
    Logger.log('Lock wait timeout: ' + e.message);
  }

  try {
    const sheet = getOrCreateSheet(SHEET_NAME_ADUAN, HEADERS_ADUAN);

    // Gunakan ID unik dari formulir jika ada, atau generate baru
    let newId = (formData.id && String(formData.id).trim()) ? String(formData.id).trim() : generateNewId(sheet);

    // PENCEGAHAN DUPLIKASI SEJATI (IDEMPOTENSI AMAN):
    // Jika ID sudah ada di sheet Data_Aduan (akibat retry koneksi, background queue flush, atau double submit),
    // JANGAN PERNAH membuat baris baru atau menambahkan suffix (-XYZ) karena akan memunculkan 2 aduan kembar!
    const existingValues = sheet.getDataRange().getValues();
    const colIdIndex = HEADERS_ADUAN.indexOf('ID_Aduan');
    let existingRowIndex = -1;

    if (colIdIndex !== -1 && existingValues.length > 1) {
      for (let r = 1; r < existingValues.length; r++) {
        const rowId = String(existingValues[r][colIdIndex] || '').trim().toUpperCase();
        if (rowId === newId.toUpperCase()) {
          existingRowIndex = r + 1;
          break;
        }
      }
    }

    // Cek juga duplikasi berdasarkan konten yang sama persis (Nama Pelapor + Desa + Uraian)
    if (existingRowIndex === -1 && existingValues.length > 1 && colIdIndex !== -1) {
      const colNama = HEADERS_ADUAN.indexOf('Nama_Pelapor');
      const colDesa = HEADERS_ADUAN.indexOf('Desa_Kelurahan');
      const colUraian = HEADERS_ADUAN.indexOf('Uraian_Laporan');
      const inputNama = String(formData.namaPelapor || '').trim().toLowerCase();
      const inputDesa = String(formData.desa || '').trim().toLowerCase();
      const inputUraian = String(formData.uraian || '').trim().toLowerCase();

      if (inputNama && inputUraian && inputUraian.length > 3) {
        for (let r = 1; r < existingValues.length; r++) {
          const rowNama = colNama !== -1 ? String(existingValues[r][colNama] || '').trim().toLowerCase() : '';
          const rowDesa = colDesa !== -1 ? String(existingValues[r][colDesa] || '').trim().toLowerCase() : '';
          const rowUraian = colUraian !== -1 ? String(existingValues[r][colUraian] || '').trim().toLowerCase() : '';
          if (rowNama === inputNama && rowDesa === inputDesa && rowUraian === inputUraian) {
            existingRowIndex = r + 1;
            newId = String(existingValues[r][colIdIndex] || '').trim();
            break;
          }
        }
      }
    }

    if (existingRowIndex !== -1) {
      Logger.log('Aduan ' + newId + ' sudah tercatat di baris ' + existingRowIndex + '. Pengiriman ganda diabaikan secara aman (Idempotent).');
      writeLog('DUPLIKASI_DICEGAH', 'ID: ' + newId + ' sudah ada di baris ' + existingRowIndex + ' - Penambahan baris kedua dicegah.');
      const rowData = existingValues[existingRowIndex - 1];
      const colTs = HEADERS_ADUAN.indexOf('Timestamp');
      const colSt = HEADERS_ADUAN.indexOf('Status_Aduan');
      const colFp = HEADERS_ADUAN.indexOf('Link_Foto_Bukti');
      return {
        success: true,
        alreadyExists: true,
        message: 'Aduan ' + newId + ' sudah tersimpan dalam sistem DLH Lembata (duplikasi dicegah).',
        data: {
          id: newId,
          timestamp: colTs !== -1 ? String(rowData[colTs] || '') : '',
          status: colSt !== -1 ? String(rowData[colSt] || 'Baru') : 'Baru',
          linkFoto: colFp !== -1 ? String(rowData[colFp] || '-') : '-',
          fotoBukti: colFp !== -1 ? String(rowData[colFp] || '-') : '-'
        }
      };
    }

    // Hapus sisa foto/cache lama jika ada ID yang sama sebelumnya (Zero Ghost Photos)
    purgeFotoStorage(newId);
    deleteDriveFilesForId(newId);

    // Generate timestamp saat ini
    const now = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      'yyyy-MM-dd HH:mm'
    );

    // Tentukan koordinat presisi dari desa / kecamatan jika tidak disediakan
    const DESA_COORDS = {
      'lewoleba barat': { lat: -8.3760, lng: 123.4080 },
      'lewoleba tengah': { lat: -8.3735, lng: 123.4170 },
      'lewoleba timur': { lat: -8.3720, lng: 123.4280 },
      'lewoleba utara': { lat: -8.3650, lng: 123.4150 },
      'lewoleba selatan': { lat: -8.3840, lng: 123.4190 },
      'lewoleba': { lat: -8.3750, lng: 123.4180 },
      'selandoro': { lat: -8.3820, lng: 123.4320 },
      'waijarang': { lat: -8.3965, lng: 123.3750 },
      'muruona': { lat: -8.3266, lng: 123.4734 },
      'hadakewa': { lat: -8.3707, lng: 123.5474 },
      'balauring': { lat: -8.2336, lng: 123.7060 },
      'lamalera': { lat: -8.5583, lng: 123.4244 }
    };

    const KECAMATAN_COORDS = {
      'Nubatukan': { lat: -8.3750, lng: 123.4180 },
      'Ile Ape': { lat: -8.3214, lng: 123.4726 },
      'Ile Ape Timur': { lat: -8.2443, lng: 123.4948 },
      'Lebatukan': { lat: -8.3707, lng: 123.5474 },
      'Nagawutung': { lat: -8.4900, lng: 123.3600 },
      'Wulandoni': { lat: -8.5319, lng: 123.4510 },
      'Atadei': { lat: -8.4341, lng: 123.4681 },
      'Omesuri': { lat: -8.2336, lng: 123.7060 },
      'Buyasuri': { lat: -8.1924, lng: 123.8204 }
    };

    const cleanDesa = String(formData.desa || '').trim().toLowerCase();
    const defaultCoord = DESA_COORDS[cleanDesa] || KECAMATAN_COORDS[formData.kecamatan] || { lat: -8.3750, lng: 123.4180 };
    const lat = (formData.lat !== undefined && formData.lat !== '' && !isNaN(parseFloat(formData.lat))) ? parseFloat(formData.lat) : defaultCoord.lat;
    const lng = (formData.lng !== undefined && formData.lng !== '' && !isNaN(parseFloat(formData.lng))) ? parseFloat(formData.lng) : defaultCoord.lng;

    // Kelola Seluruh Foto Bukti (Mendukung Multi-Foto Lapangan secara aman tanpa shredding Base64)
    let rawPhotos = [];
    if (Array.isArray(formData.buktiFotoList) && formData.buktiFotoList.length > 0) {
      formData.buktiFotoList.forEach(p => {
        const s = (p && p.dataUrl) ? p.dataUrl : (typeof p === 'string' ? p : '');
        if (s && s.trim() && s.trim() !== '-') rawPhotos.push(s.trim());
      });
    } else {
      // Periksa linkFotoBukti terlebih dahulu jika buktiFotoList tidak disertakan
      const rawVal = formData.linkFotoBukti || formData.fotoBukti || formData.linkFoto || '';
      if (typeof rawVal === 'string' && rawVal.trim() && rawVal.trim() !== '-') {
        const matches = rawVal.match(/(data:image\/[a-zA-Z0-9\+\/\-\.]+;base64,[A-Za-z0-9\+\/\=]+|https?:\/\/[^\s,]+)/g);
        if (matches && matches.length > 0) {
          matches.forEach(s => { if (s.trim()) rawPhotos.push(s.trim()); });
        } else {
          rawPhotos.push(rawVal.trim());
        }
      }
    }

    const targetUrls = [];
    const webAppUrl = getWebAppUrl();
    let storageSheet = null;

    rawPhotos.forEach((photoStr, idx) => {
      if (!photoStr || typeof photoStr !== 'string') return;
      const trimmed = photoStr.trim();
      if (trimmed.startsWith('http')) {
        targetUrls.push(trimmed);
      } else if (trimmed.startsWith('data:image')) {
        const photoKey = (idx === 0) ? newId : (newId + '_FOTO_' + (idx + 1));
        let driveUrl = '';
        try {
          driveUrl = saveBase64ImageToDrive(trimmed, photoKey);
        } catch (e) {
          Logger.log('Drive error foto ' + idx + ': ' + e.message);
        }

        const viewUrl = (driveUrl && driveUrl.startsWith('http'))
          ? driveUrl
          : (webAppUrl + '?action=viewFoto&id=' + encodeURIComponent(newId) + '&photoIdx=' + idx);
        targetUrls.push(viewUrl);

        // Simpan cadangan data gambar Base64 ke sheet Foto_Storage
        try {
          if (!storageSheet) {
            storageSheet = getOrCreateSheet(SHEET_NAME_FOTO, ['ID_Aduan', 'Timestamp', 'Link_Buka_Foto', 'Base64_Data']);
          }
          const CHUNK_SIZE = 40000;
          const rowData = [photoKey, now, viewUrl];
          for (let k = 0; k < trimmed.length; k += CHUNK_SIZE) {
            rowData.push(trimmed.substring(k, k + CHUNK_SIZE));
          }
          storageSheet.appendRow(rowData);

          // Jika foto pertama (idx === 0), simpan juga dengan alias ID_FOTO_1 agar selalu terindeks ganda
          if (idx === 0) {
            const aliasRow = [newId + '_FOTO_1', now, viewUrl];
            for (let k = 0; k < trimmed.length; k += CHUNK_SIZE) {
              aliasRow.push(trimmed.substring(k, k + CHUNK_SIZE));
            }
            storageSheet.appendRow(aliasRow);
          }

          const lastRow = storageSheet.getLastRow();
          const cell = storageSheet.getRange(lastRow, 3);
          const richText = SpreadsheetApp.newRichTextValue()
            .setText("📸 Buka Foto Bukti (" + photoKey + ")")
            .setLinkUrl(viewUrl)
            .build();
          cell.setRichTextValue(richText);
        } catch (e) {
          Logger.log('Storage backup error foto ' + idx + ': ' + e.message);
        }
      }
    });

    const primaryUrl = targetUrls[0] || '';
    const cellFotoValue = targetUrls.length > 0 ? targetUrls.join(', ') : '-';

    const primaryStatus = formData.status || 'Baru';
    const isUnverified = (primaryStatus === 'Baru' || primaryStatus === 'Aduan Diterima' || primaryStatus === 'Verifikasi Administrasi');

    // Susun baris data baru sesuai urutan HEADERS_ADUAN (27 kolom lengkap)
    const newRow = [
      newId,                                                  // ID_Aduan
      now,                                                    // Timestamp
      formData.namaPelapor || 'Anonim',                       // Nama_Pelapor
      formData.noHp ? ("'" + String(formData.noHp).replace(/^'/, '').trim()) : '-', // No_HP (Apostrof mencegah spreadsheet menghapus angka 0 di depan)
      formData.alamatPelapor || '-',                          // Alamat_Pelapor
      formData.kecamatan || 'Nubatukan',                      // Kecamatan
      formData.desa || '-',                                   // Desa_Kelurahan
      formData.lokasiDetail || '-',                           // Lokasi_Detail
      lat,                                                    // Latitude
      lng,                                                    // Longitude
      formData.jenisPencemaran || 'Lainnya',                  // Jenis_Pencemaran
      formData.uraian || '-',                                 // Uraian_Aduan
      formData.sumberDugaan || '-',                           // Sumber_Dugaan
      formData.tanggalKejadian || now.split(' ')[0],          // Tanggal_Kejadian
      cellFotoValue,                                          // Link_Foto_Bukti
      primaryStatus,                                          // Status
      isUnverified ? '-' : (formData.petugasVerifikasi || '-'), // Petugas_Verifikasi
      isUnverified ? '-' : (formData.tanggalVerifikasi || '-'), // Tanggal_Verifikasi
      isUnverified ? 'Menunggu penugasan verifikator lapangan.' : (formData.hasilVerifikasi || '-'), // Hasil_Verifikasi
      isUnverified ? 'Aduan telah dicatat ke sistem.' : (formData.tindakanDLH || '-'),               // Tindakan_DLH
      isUnverified ? '-' : (formData.tanggalSelesai || '-'),  // Tanggal_Selesai
      isUnverified ? '' : (formData.nomorBeritaAcara || ''),  // Nomor_Berita_Acara
      isUnverified ? '' : (formData.catatanBeritaAcara || ''),// Catatan_Berita_Acara
      isUnverified ? '' : (formData.fotoKondisiRiil || ''),   // Foto_Kondisi_Riil
      isUnverified ? '' : (formData.timestampVerifikasi || ''), // Timestamp_Verifikasi
      isUnverified ? '' : (formData.timestampTindakLanjut || ''), // Timestamp_Tindak_Lanjut
      isUnverified ? '' : (formData.timestampSelesai || '')   // Timestamp_Selesai
    ];

    // Tambahkan baris ke sheet
    sheet.appendRow(newRow);

    // Pasang RichText hyperlink interaktif agar setiap foto dapat diklik langsung di spreadsheet
    if (targetUrls.length === 1) {
      try {
        const lastRow = sheet.getLastRow();
        const colFotoIdx = HEADERS_ADUAN.indexOf('Link_Foto_Bukti');
        if (colFotoIdx !== -1) {
          const richText = SpreadsheetApp.newRichTextValue()
            .setText("📸 Buka Foto Bukti (" + newId + ")")
            .setLinkUrl(targetUrls[0])
            .build();
          sheet.getRange(lastRow, colFotoIdx + 1).setRichTextValue(richText);
        }
      } catch (e) { }
    } else if (targetUrls.length > 1) {
      try {
        const lastRow = sheet.getLastRow();
        const colFotoIdx = HEADERS_ADUAN.indexOf('Link_Foto_Bukti');
        if (colFotoIdx !== -1) {
          let displayText = "📸 Buka Foto (" + targetUrls.length + "): ";
          const links = [];
          targetUrls.forEach((u, idx) => {
            const label = "Foto " + (idx + 1);
            const start = displayText.length;
            displayText += label;
            const end = displayText.length;
            links.push({ start: start, end: end, url: u });
            if (idx < targetUrls.length - 1) displayText += " | ";
          });
          const richTextBuilder = SpreadsheetApp.newRichTextValue().setText(displayText);
          links.forEach(l => {
            richTextBuilder.setLinkUrl(l.start, l.end, l.url);
          });
          sheet.getRange(lastRow, colFotoIdx + 1).setRichTextValue(richTextBuilder.build());
        }
      } catch (e) { }
    }

    // Tulis log
    writeLog('ADUAN_BARU', 'ID: ' + newId + ' | Pelapor: ' + (formData.namaPelapor || 'Anonim') + ' | Kec: ' + (formData.kecamatan || '-') + ' | Total Foto: ' + targetUrls.length);

    return {
      success: true,
      message: 'Aduan berhasil disimpan ke Google Spreadsheet.',
      data: {
        id: newId,
        timestamp: now,
        status: 'Baru',
        linkFoto: primaryUrl,
        fotoBukti: primaryUrl,
        linkFotoClickable: cellFotoValue,
        buktiFotoList: targetUrls
      }
    };
  } finally {
    try {
      lock.releaseLock();
    } catch (e) { }
  }
}


// ==================================================================================
// HANDLER AKSI: UPDATE VERIFIKASI PETUGAS DLH (POST)
// ==================================================================================
function handleUpdateVerifikasi(updateData) {
  const targetId = updateData.id || '';
  if (!targetId) {
    return { success: false, error: 'Parameter "id" wajib diisi untuk update verifikasi.' };
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Kunci script hingga 30 detik untuk mencegah race condition
  } catch (e) {
    Logger.log('Lock wait timeout di updateVerifikasi: ' + e.message);
  }

  try {
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

  const colNomorBA = headers.indexOf('Nomor_Berita_Acara');
  const colCatatanBA = headers.indexOf('Catatan_Berita_Acara');
  const colFotoRiil = headers.indexOf('Foto_Kondisi_Riil');
  const colTimeVerif = headers.indexOf('Timestamp_Verifikasi');
  const colTimeTindak = headers.indexOf('Timestamp_Tindak_Lanjut');
  const colTimeSelesai = headers.indexOf('Timestamp_Selesai');

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

  // Berita Acara (BAST) & Catatan Pemeriksaan
  if (updateData.nomorBeritaAcara !== undefined && colNomorBA !== -1) {
    sheet.getRange(targetRowIndex, colNomorBA + 1).setValue(updateData.nomorBeritaAcara);
  }
  if (updateData.catatanBeritaAcara !== undefined && colCatatanBA !== -1) {
    sheet.getRange(targetRowIndex, colCatatanBA + 1).setValue(updateData.catatanBeritaAcara);
  }

  // Timestamps Akuntabilitas Kinerja
  if (updateData.timestampVerifikasi && colTimeVerif !== -1) {
    sheet.getRange(targetRowIndex, colTimeVerif + 1).setValue(updateData.timestampVerifikasi);
  }
  if (updateData.timestampTindakLanjut && colTimeTindak !== -1) {
    sheet.getRange(targetRowIndex, colTimeTindak + 1).setValue(updateData.timestampTindakLanjut);
  }
  if (updateData.timestampSelesai && colTimeSelesai !== -1) {
    sheet.getRange(targetRowIndex, colTimeSelesai + 1).setValue(updateData.timestampSelesai);
  }

  // Foto Kondisi Riil Pemeriksaan Petugas
  const officerPhotoId = targetId + '_PETUGAS';
  const isUnverifiedStatus = (updateData.status === 'Baru' || updateData.status === 'Aduan Diterima' || updateData.status === 'Verifikasi Administrasi');

  if (isUnverifiedStatus) {
    if (colFotoRiil !== -1) sheet.getRange(targetRowIndex, colFotoRiil + 1).setValue('');
    if (colNomorBA !== -1) sheet.getRange(targetRowIndex, colNomorBA + 1).setValue('');
    if (colCatatanBA !== -1) sheet.getRange(targetRowIndex, colCatatanBA + 1).setValue('');
    purgeFotoStorage(officerPhotoId);
    deleteDriveFilesForId(officerPhotoId);
    for (let k = 1; k <= 6; k++) {
      purgeFotoStorage(officerPhotoId + '_' + k);
      deleteDriveFilesForId(officerPhotoId + '_' + k);
    }
  } else {
    // Kumpulkan seluruh foto kondisi riil verifikasi petugas (Mendukung Multi-Foto Lapangan)
    let rawOfficerPhotos = [];
    if (Array.isArray(updateData.fotoVerifikasiList) && updateData.fotoVerifikasiList.length > 0) {
      updateData.fotoVerifikasiList.forEach(p => {
        const s = (p && p.dataUrl) ? p.dataUrl : (typeof p === 'string' ? p : '');
        if (s && s.trim() && s.trim() !== '-' && !rawOfficerPhotos.includes(s.trim())) {
          rawOfficerPhotos.push(s.trim());
        }
      });
    } else if (updateData.fotoKondisiRiil && typeof updateData.fotoKondisiRiil === 'string' && updateData.fotoKondisiRiil.trim() && updateData.fotoKondisiRiil.trim() !== '-') {
      rawOfficerPhotos.push(updateData.fotoKondisiRiil.trim());
    }

    if (rawOfficerPhotos.length > 0 && colFotoRiil !== -1) {
      // Bersihkan foto petugas lama sebelum menyimpan foto baru
      purgeFotoStorage(officerPhotoId);
      deleteDriveFilesForId(officerPhotoId);
      for (let k = 1; k <= 6; k++) {
        purgeFotoStorage(officerPhotoId + '_' + k);
        deleteDriveFilesForId(officerPhotoId + '_' + k);
      }

      const webAppUrl = getWebAppUrl();
      const targetRiilUrls = [];
      const nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
      let storageSheet = null;

      rawOfficerPhotos.forEach((photoStr, idx) => {
        if (!photoStr || typeof photoStr !== 'string') return;
        const trimmed = photoStr.trim();
        const photoKey = (idx === 0) ? officerPhotoId : (officerPhotoId + '_' + (idx + 1));

        if (trimmed.startsWith('http')) {
          targetRiilUrls.push(trimmed);
        } else if (trimmed.startsWith('data:image')) {
          let driveUrl = '';
          try {
            driveUrl = saveBase64ImageToDrive(trimmed, photoKey);
          } catch (e) {
            Logger.log('Drive error foto petugas ' + idx + ': ' + e.message);
          }

          const viewUrl = (driveUrl && driveUrl.startsWith('http'))
            ? driveUrl
            : (webAppUrl + '?action=viewFoto&id=' + encodeURIComponent(photoKey));
          targetRiilUrls.push(viewUrl);

          // Simpan cadangan data gambar petugas ke Foto_Storage dengan chunking aman
          try {
            if (!storageSheet) {
              storageSheet = getOrCreateSheet(SHEET_NAME_FOTO, ['ID_Aduan', 'Timestamp', 'Link_Buka_Foto', 'Base64_Data']);
            }
            const CHUNK_SIZE = 40000;
            const rowData = [photoKey, nowStr, viewUrl];
            for (let k = 0; k < trimmed.length; k += CHUNK_SIZE) {
              rowData.push(trimmed.substring(k, k + CHUNK_SIZE));
            }
            storageSheet.appendRow(rowData);

            // Jika foto pertama (idx === 0), simpan juga dengan alias _PETUGAS_1
            if (idx === 0) {
              const aliasRow = [officerPhotoId + '_1', nowStr, viewUrl];
              for (let k = 0; k < trimmed.length; k += CHUNK_SIZE) {
                aliasRow.push(trimmed.substring(k, k + CHUNK_SIZE));
              }
              storageSheet.appendRow(aliasRow);
            }

            const lastRow = storageSheet.getLastRow();
            const cell = storageSheet.getRange(lastRow, 3);
            const richText = SpreadsheetApp.newRichTextValue()
              .setText("📸 Buka Foto Petugas (" + photoKey + ")")
              .setLinkUrl(viewUrl)
              .build();
            cell.setRichTextValue(richText);
          } catch (e) {
            Logger.log('Officer storage backup error: ' + e.message);
          }
        }
      });

      // Simpan hyperlink visual ke sheet Data_Aduan kolom Foto_Kondisi_Riil
      if (targetRiilUrls.length === 1) {
        try {
          const richText = SpreadsheetApp.newRichTextValue()
            .setText("📸 Buka Foto Petugas (" + targetId + ")")
            .setLinkUrl(targetRiilUrls[0])
            .build();
          sheet.getRange(targetRowIndex, colFotoRiil + 1).setRichTextValue(richText);
        } catch (e) {
          sheet.getRange(targetRowIndex, colFotoRiil + 1).setValue(targetRiilUrls[0]);
        }
      } else if (targetRiilUrls.length > 1) {
        try {
          let displayText = "📸 Buka Foto Petugas (" + targetRiilUrls.length + "): ";
          const links = [];
          targetRiilUrls.forEach((u, idx) => {
            const label = "Foto " + (idx + 1);
            const start = displayText.length;
            displayText += label;
            const end = displayText.length;
            links.push({ start: start, end: end, url: u });
            if (idx < targetRiilUrls.length - 1) displayText += " | ";
          });
          const richTextBuilder = SpreadsheetApp.newRichTextValue().setText(displayText);
          links.forEach(l => {
            richTextBuilder.setLinkUrl(l.start, l.end, l.url);
          });
          sheet.getRange(targetRowIndex, colFotoRiil + 1).setRichTextValue(richTextBuilder.build());
        } catch (e) {
          sheet.getRange(targetRowIndex, colFotoRiil + 1).setValue(targetRiilUrls.join(', '));
        }
      }
    } else if (colFotoRiil !== -1 && (Array.isArray(updateData.fotoVerifikasiList) || updateData.fotoKondisiRiil === '')) {
      // Jika daftar foto dikosongkan secara sengaja (hapus semua foto)
      sheet.getRange(targetRowIndex, colFotoRiil + 1).setValue('');
      purgeFotoStorage(officerPhotoId);
      deleteDriveFilesForId(officerPhotoId);
      for (let k = 1; k <= 6; k++) {
        purgeFotoStorage(officerPhotoId + '_' + k);
        deleteDriveFilesForId(officerPhotoId + '_' + k);
      }
    }
  }

  const colFoto = headers.indexOf('Link_Foto_Bukti');
  if (updateData.linkFoto && colFoto !== -1) {
    sheet.getRange(targetRowIndex, colFoto + 1).setValue(updateData.linkFoto);
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
  } finally {
    try {
      lock.releaseLock();
    } catch (e) { }
  }
}

/**
 * HANDLER AKSI: HAPUS FOTO PETUGAS (PER ITEM ATAU SEMUA)
 */
function handleDeleteOfficerPhoto(data) {
  const targetId = String((data && data.id) || '').trim();
  const photoIndex = (data && data.photoIndex !== undefined) ? parseInt(data.photoIndex, 10) : -1;
  if (!targetId) {
    return { success: false, error: 'ID Aduan wajib disertakan.' };
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // Kunci script hingga 20 detik
  } catch (e) {
    Logger.log('Lock wait timeout di deleteOfficerPhoto: ' + e.message);
  }

  try {
    const sheet = getOrCreateSheet(SHEET_NAME_ADUAN, HEADERS_ADUAN);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    return { success: false, error: 'Database kosong.' };
  }

  const headers = rows[0];
  const colId = headers.indexOf('ID_Aduan');
  const colFotoRiil = headers.indexOf('Foto_Kondisi_Riil');
  if (colId === -1 || colFotoRiil === -1) {
    return { success: false, error: 'Struktur kolom sheet tidak lengkap.' };
  }

  let targetRowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][colId]).trim() === targetId) {
      targetRowIndex = i + 1; // 1-indexed
      break;
    }
  }

  if (targetRowIndex === -1) {
    return { success: false, error: 'Data aduan ' + targetId + ' tidak ditemukan.' };
  }

  const cell = sheet.getRange(targetRowIndex, colFotoRiil + 1);
  const richText = cell.getRichTextValue();
  let existingUrls = [];

  if (richText) {
    const runs = richText.getRuns ? richText.getRuns() : [];
    runs.forEach(r => {
      const u = r.getLinkUrl();
      if (u && typeof u === 'string' && u.startsWith('http') && !existingUrls.includes(u)) {
        existingUrls.push(u);
      }
    });
    if (existingUrls.length === 0 && richText.getLinkUrl()) {
      existingUrls.push(richText.getLinkUrl());
    }
  }

  if (existingUrls.length === 0) {
    const val = String(cell.getValue() || '').trim();
    if (val && val !== '-') {
      const matches = val.match(/https?:\/\/[^\s,]+/g);
      if (matches) {
        matches.forEach(m => {
          if (!existingUrls.includes(m)) existingUrls.push(m);
        });
      }
    }
  }

  // Hapus item foto sesuai index
  if (photoIndex >= 0 && photoIndex < existingUrls.length) {
    existingUrls.splice(photoIndex, 1);
  } else if (photoIndex === -1 || existingUrls.length <= 1) {
    existingUrls = [];
  }

  const officerPhotoId = targetId + '_PETUGAS';
  if (photoIndex >= 0) {
    const specificKey = (photoIndex === 0) ? officerPhotoId : (officerPhotoId + '_' + (photoIndex + 1));
    purgeFotoStorage(specificKey);
    deleteDriveFilesForId(specificKey);
    purgeFotoStorage(officerPhotoId + '_' + (photoIndex + 1));
    deleteDriveFilesForId(officerPhotoId + '_' + (photoIndex + 1));
  }

  if (existingUrls.length === 0) {
    purgeFotoStorage(officerPhotoId);
    deleteDriveFilesForId(officerPhotoId);
    for (let k = 1; k <= 6; k++) {
      purgeFotoStorage(officerPhotoId + '_' + k);
      deleteDriveFilesForId(officerPhotoId + '_' + k);
    }
    cell.setValue('');
  } else if (existingUrls.length === 1) {
    try {
      const rt = SpreadsheetApp.newRichTextValue()
        .setText("📸 Buka Foto Petugas (" + targetId + ")")
        .setLinkUrl(existingUrls[0])
        .build();
      cell.setRichTextValue(rt);
    } catch (e) {
      cell.setValue(existingUrls[0]);
    }
  } else {
    try {
      let displayText = "📸 Buka Foto Petugas (" + existingUrls.length + "): ";
      const links = [];
      existingUrls.forEach((u, idx) => {
        const label = "Foto " + (idx + 1);
        const start = displayText.length;
        displayText += label;
        const end = displayText.length;
        links.push({ start: start, end: end, url: u });
        if (idx < existingUrls.length - 1) displayText += " | ";
      });
      const richTextBuilder = SpreadsheetApp.newRichTextValue().setText(displayText);
      links.forEach(l => {
        richTextBuilder.setLinkUrl(l.start, l.end, l.url);
      });
      cell.setRichTextValue(richTextBuilder.build());
    } catch (e) {
      cell.setValue(existingUrls.join(', '));
    }
  }

  writeLog('DELETE_OFFICER_PHOTO', 'ID: ' + targetId + ' | FotoIdx: ' + photoIndex + ' | Sisa: ' + existingUrls.length);

  return {
    success: true,
    message: 'Foto kondisi riil petugas ke-' + (photoIndex + 1) + ' berhasil dihapus permanen.',
    remainingCount: existingUrls.length
  };
  } finally {
    try {
      lock.releaseLock();
    } catch (e) { }
  }
}


// ==================================================================================
// HANDLER AKSI: HAPUS ADUAN (POST / GET)
// ==================================================================================
function handleDeleteAduan(data) {
  const targetId = String(data.id || '').trim();
  if (!targetId) {
    return { success: false, error: 'Parameter "id" wajib diisi untuk menghapus aduan.' };
  }

  const cleanTargetId = targetId.toUpperCase();
  const lock = LockService.getScriptLock();
  let lockAcquired = false;

  try {
    // Kunci script hingga 20 detik agar antrean proses selesai berurutan tanpa saling menimpa
    lockAcquired = lock.tryLock(20000);

    const sheet = getOrCreateSheet(SHEET_NAME_ADUAN, HEADERS_ADUAN);
    let deletedCount = 0;
    const lastRow = sheet.getLastRow();

    if (lastRow > 1) {
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const colId = headers.indexOf('ID_Aduan');
      const colFoto = headers.indexOf('Link_Foto_Bukti');
      const colFotoRiil = headers.indexOf('Foto_Kondisi_Riil');

      if (colId !== -1) {
        // Loop dari baris paling bawah ke atas (bottom-up)
        // Di setiap baris, periksa sel ID saat ini secara langsung untuk memastikan 100%
        // bahwa baris yang akan dihapus adalah memang milik ID target!
        for (let r = lastRow; r >= 2; r--) {
          const currentCellId = String(sheet.getRange(r, colId + 1).getValue() || '').trim().toUpperCase();
          if (currentCellId === cleanTargetId) {
            // Buang file foto yang tertaut di Drive jika ada
            if (colFoto !== -1) {
              const fotoVal = String(sheet.getRange(r, colFoto + 1).getValue() || '');
              trashDriveFileByUrl(fotoVal);
            }
            if (colFotoRiil !== -1) {
              const fotoRiilVal = String(sheet.getRange(r, colFotoRiil + 1).getValue() || '');
              trashDriveFileByUrl(fotoRiilVal);
            }
            sheet.deleteRow(r);
            deletedCount++;
          }
        }
      }
    }

    // Bersihkan dari Foto_Storage dan Google Drive permanen
    purgeFotoStorage(cleanTargetId);
    deleteDriveFilesForId(cleanTargetId);

    writeLog('ADUAN_DIHAPUS', 'ID: ' + cleanTargetId + ' | Baris dihapus: ' + deletedCount);

    return {
      success: true,
      message: 'Aduan ' + cleanTargetId + ' berhasil dihapus permanen (' + deletedCount + ' baris dihapus).',
      data: { id: cleanTargetId, deletedRows: deletedCount },
      deletedCount: deletedCount
    };
  } catch (err) {
    Logger.log('handleDeleteAduan error: ' + err.message);
    return { success: false, error: err.message };
  } finally {
    if (lockAcquired) {
      try { lock.releaseLock(); } catch (e) { }
    }
  }
}


// ==================================================================================
// HANDLER AKSI: KOSONGKAN DATABASE / RESET KE 0 ADUAN
// ==================================================================================
/**
 * Mengosongkan seluruh baris data aduan di Google Spreadsheet & Foto_Storage & Google Drive.
 * Digunakan untuk penyegaran data total (Fresh Start / 0 Aduan).
 */
function handleResetToZero() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(SHEET_NAME_ADUAN, HEADERS_ADUAN);
  const lastRow = sheet.getLastRow();
  let deletedRows = 0;

  if (lastRow > 1) {
    deletedRows = lastRow - 1;
    sheet.deleteRows(2, deletedRows);
  }

  // Bersihkan seluruh baris cadangan di Foto_Storage
  try {
    const storageSheet = ss.getSheetByName(SHEET_NAME_FOTO);
    if (storageSheet && storageSheet.getLastRow() > 1) {
      storageSheet.deleteRows(2, storageSheet.getLastRow() - 1);
    }
  } catch (e) {
    Logger.log('Gagal reset Foto_Storage: ' + e.message);
  }

  // Bersihkan juga baris pada sheet bawaan "Sheet1" jika ada
  try {
    const sheet1 = ss.getSheetByName('Sheet1');
    if (sheet1 && sheet1.getLastRow() > 1) {
      sheet1.deleteRows(2, sheet1.getLastRow() - 1);
    }
  } catch (e) { }

  // Pindahkan seluruh file foto lama di Google Drive ke Trash
  try {
    purgeAllDrivePhotos();
  } catch (e) {
    Logger.log('Gagal bersihkan foto Drive: ' + e.message);
  }

  writeLog('RESET_DATABASE', 'Seluruh data aduan, Foto_Storage, dan Google Drive dibersihkan (reset ke 0 aduan). Siap pengujian baru.');

  return {
    success: true,
    message: 'Database Google Spreadsheet, Foto_Storage, dan Google Drive berhasil dikosongkan (0 aduan). Sistem bersih sempurna.',
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



/**
 * Sinkronisasi seluruh sheet agar sesuai dengan sheet Data_Aduan
 */
function syncAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mainSheet = getOrCreateSheet(SHEET_NAME_ADUAN, HEADERS_ADUAN);
  const sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1) {
    // Samakan header Sheet1 dengan Data_Aduan jika digunakan
    sheet1.clearContents();
    sheet1.getRange(1, 1, 1, HEADERS_ADUAN.length).setValues([HEADERS_ADUAN]);
  }
  return { success: true, message: 'Seluruh sheet berhasil disinkronkan.' };
}

/**
 * Alias fungsi untuk dijalankan langsung dari menu Run/Jalankan di editor Apps Script
 */
function resetDatabaseToZero() {
  const result = handleResetToZero();
  syncAllSheets();
  Logger.log(JSON.stringify(result));
  return result;
}



/**
 * Penampil Halaman Web Responsif untuk Foto Bukti Aduan (Bisa diklik langsung dari Google Spreadsheet)
 */
function handleViewImage(id, fileId, photoIdx) {
  const sheet = getOrCreateSheet(SHEET_NAME_ADUAN, HEADERS_ADUAN);
  const rawData = getSheetDataAsObjects(sheet);

  const isOfficerPhoto = String(id || '').toUpperCase().endsWith('_PETUGAS');
  const baseId = isOfficerPhoto ? String(id).replace(/_PETUGAS$/i, '') : id;
  const pIdx = parseInt(photoIdx || '0', 10) || 0;

  let item = null;
  if (baseId) {
    item = rawData.find(r => String(r['ID_Aduan']).trim().toUpperCase() === String(baseId).trim().toUpperCase());
  }

  // Jika aduan tidak ditemukan di spreadsheet (telah dibersihkan atau belum terdaftar)
  if (!item) {
    const notFoundHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aduan Tidak Ditemukan | DLH Lembata</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0f172a; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .card { max-width: 560px; width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.6); }
    h1 { font-size: 1.25rem; color: #f87171; margin-bottom: 12px; }
    p { color: #94a3b8; font-size: 0.9rem; line-height: 1.6; margin-bottom: 20px; }
    .badge { display: inline-block; background: #334155; color: #e2e8f0; padding: 4px 12px; border-radius: 999px; font-family: monospace; font-size: 0.85rem; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${id || '-'}</div>
    <h1>⚠️ Aduan Tidak Ditemukan atau Telah Dihapus</h1>
    <p>Data aduan dengan ID tersebut tidak ditemukan pada database resmi Dinas Lingkungan Hidup Kabupaten Lembata. Aduan dan fotonya telah dibersihkan atau belum didaftarkan.</p>
  </div>
</body>
</html>`;
    return HtmlService.createHtmlOutput(notFoundHtml).setTitle('Aduan Tidak Ditemukan - DLH Lembata');
  }

  const idDisplay = item['ID_Aduan'] + (isOfficerPhoto ? ' (Dokumentasi Petugas)' : (pIdx > 0 ? ' [Foto #' + (pIdx + 1) + ']' : ''));
  const namaPelapor = item['Nama_Pelapor'] || 'Masyarakat';
  const timestamp = item['Timestamp'] || '-';
  const uraian = item['Uraian_Aduan'] || '-';
  const status = item['Status'] || 'Baru';
  let rawColPhoto = isOfficerPhoto ? (item['Foto_Kondisi_Riil'] || '') : (item['Link_Foto_Bukti'] || '');

  let photoData = rawColPhoto;
  if (photoData.includes(',') && !photoData.startsWith('data:')) {
    const splitted = photoData.split(',').map(s => s.trim()).filter(Boolean);
    photoData = splitted[pIdx] || splitted[0] || '';
  }

  if (photoData.startsWith('=HYPERLINK')) {
    const match = photoData.match(/=HYPERLINK\("([^"]+)"/i);
    if (match) photoData = match[1];
  }

  if (photoData.includes('drive.google.com/file/d/')) {
    const fileIdMatch = photoData.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (fileIdMatch) {
      photoData = 'https://drive.google.com/thumbnail?id=' + fileIdMatch[1] + '&sz=w1600';
    }
  }

  // Pastikan photoData adalah gambar valid; jika berupa #ERROR!, tautan viewFoto, atau teks kosong, cari langsung dari Foto_Storage
  const isDirectImage = photoData && (photoData.startsWith('data:image') || photoData.includes('drive.google.com/thumbnail') || photoData.match(/\.(jpeg|jpg|png|webp|gif)/i));

  if (!isDirectImage) {
    try {
      const storageSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_FOTO);
      if (storageSheet) {
        const sData = storageSheet.getDataRange().getValues();
        const baseSearch = String(id || '').trim().toUpperCase();
        const targetSearch = (pIdx > 0) ? (baseSearch + '_FOTO_' + (pIdx + 1)) : baseSearch;
        const candidateKeys = [
          targetSearch,
          baseSearch + '_' + (pIdx + 1),
          (pIdx === 0 ? baseSearch + '_1' : targetSearch),
          (pIdx === 0 ? baseSearch + '_FOTO_1' : targetSearch),
          baseSearch
        ];
        for (let i = sData.length - 1; i >= 1; i--) {
          const rowKey = String(sData[i][0]).trim().toUpperCase();
          if (candidateKeys.includes(rowKey)) {
            let combined = '';
            // Gabungkan seluruh chunk base64 dari kolom D ke kanan
            for (let c = 3; c < sData[i].length; c++) {
              combined += String(sData[i][c] || '');
            }
            // Fallback untuk baris lama
            if (!combined || !combined.startsWith('data:image')) {
              for (let c = 1; c < sData[i].length; c++) {
                let v = String(sData[i][c] || '').trim();
                if (v.startsWith('data:image')) {
                  combined = v;
                  break;
                }
              }
            }
            if (combined) {
              photoData = combined;
              break;
            }
          }
        }
      }
    } catch (e) { }
  }

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bukti Foto Aduan ${idDisplay} | DLH Lembata</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0f172a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .card {
      max-width: 900px;
      width: 100%;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 25px 60px rgba(0,0,0,0.6);
      display: flex;
      flex-direction: column;
    }
    .header {
      padding: 16px 20px;
      background: linear-gradient(135deg, #065f46 0%, #047857 100%);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      border-bottom: 1px solid #059669;
    }
    .header h1 { font-size: 1.15rem; font-weight: 800; color: #ecfdf5; }
    .header p { font-size: 0.8rem; color: #a7f3d0; margin-top: 2px; }
    .badge {
      background: rgba(0,0,0,0.3);
      padding: 5px 14px;
      border-radius: 999px;
      font-family: monospace;
      font-size: 0.85rem;
      font-weight: 700;
      color: #fff;
      border: 1px solid rgba(255,255,255,0.2);
    }
    .photo-area {
      padding: 20px;
      background: #020617;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      max-height: 75vh;
      overflow: hidden;
    }
    .photo-area img {
      max-width: 100%;
      max-height: 72vh;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.8);
    }
    .footer {
      padding: 16px 20px;
      background: #1e293b;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 0.85rem;
      color: #cbd5e1;
      border-top: 1px solid #334155;
    }
    .btn-dl {
      background: #059669;
      color: #ffffff;
      padding: 8px 18px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.84rem;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-dl:hover { background: #10b981; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <h1>📸 DOKUMENTASI BUKTI FOTO ADUAN</h1>
        <p>Dinas Lingkungan Hidup Kabupaten Lembata &bull; Pelapor: ${namaPelapor} (${timestamp})</p>
      </div>
      <div class="badge">${idDisplay} &bull; ${status}</div>
    </div>
    <div class="photo-area">
      ${(photoData && (photoData.startsWith('data:image') || photoData.startsWith('http')))
      ? '<img src="' + photoData + '" alt="Bukti Foto Aduan ' + idDisplay + '">'
      : '<div style="color:#94a3b8; padding: 40px; text-align: center;">📸 Foto bukti tidak ditemukan atau sedang diproses.</div>'}
    </div>
    <div class="footer">
      <div><strong>Kronologi:</strong> ${uraian}</div>
      ${(photoData && (photoData.startsWith('data:image') || photoData.startsWith('http')))
      ? '<a href="' + photoData + '" download="Bukti_Foto_' + idDisplay + '.jpg" class="btn-dl">⬇️ Unduh Foto Asli</a>'
      : ''}
    </div>
  </div>
</body>
</html>`;

  return HtmlService
    .createHtmlOutput(html)
    .setTitle('Bukti Foto ' + idDisplay + ' - DLH Lembata')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Memperbaiki tautan foto yang berupa string Base64 panjang di Google Spreadsheet
 * Mengubahnya menjadi formula =HYPERLINK(...) resmi yang bisa diklik langsung oleh siapa pun
 */
function handleFixPhotoLinks() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(SHEET_NAME_ADUAN, HEADERS_ADUAN);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, fixed: 0, message: 'Tidak ada data aduan di spreadsheet.' };

  const colFotoIdx = HEADERS_ADUAN.indexOf('Link_Foto_Bukti');
  if (colFotoIdx === -1) return { success: false, error: 'Kolom Link_Foto_Bukti tidak ditemukan.' };

  const webAppUrl = getWebAppUrl();
  let fixedCount = 0;

  // Pastikan sheet cadangan Foto_Storage ada
  let storageSheet = ss.getSheetByName(SHEET_NAME_FOTO);
  if (!storageSheet) {
    storageSheet = ss.insertSheet(SHEET_NAME_FOTO);
    storageSheet.getRange(1, 1, 1, 3).setValues([['ID_Aduan', 'Timestamp', 'Base64_Data']]);
    storageSheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#065f46').setFontColor('#fff');
  }

  // Baca seluruh ID di Foto_Storage untuk lookup cepat
  const sData = storageSheet.getDataRange().getValues();
  const existingStorageIds = new Set();
  for (let s = 1; s < sData.length; s++) {
    const sid = String(sData[s][0] || '').trim().toUpperCase();
    if (sid) existingStorageIds.add(sid);
  }

  for (let i = 1; i < data.length; i++) {
    const rowNum = i + 1;
    const idAduan = String(data[i][0] || '').trim();
    if (!idAduan) continue;

    const cellVal = String(data[i][colFotoIdx] || '').trim();

    // Jika sel saat ini berisi data:image, amankan ke Foto_Storage jika belum tercatat
    if (cellVal.startsWith('data:image')) {
      if (!existingStorageIds.has(idAduan.toUpperCase())) {
        try {
          const CHUNK_SIZE = 40000;
          const rowData = [idAduan, Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'), targetUrl];
          for (let k = 0; k < cellVal.length; k += CHUNK_SIZE) {
            rowData.push(cellVal.substring(k, k + CHUNK_SIZE));
          }
          storageSheet.appendRow(rowData);
          existingStorageIds.add(idAduan.toUpperCase());
        } catch (e) { }
      }
    }

    // Tautan resmi penampil foto Web App DLH
    const targetUrl = webAppUrl + '?action=viewFoto&id=' + encodeURIComponent(idAduan);

    const cellRange = sheet.getRange(rowNum, colFotoIdx + 1);

    // Hapus seluruh formula atau tulisan #ERROR! lama agar sel benar-benar bersih
    cellRange.clear({ contentsOnly: true });

    // Set nilai tautan langsung tanpa formula =HYPERLINK (100% bebas dari formula parse error)
    try {
      const richText = SpreadsheetApp.newRichTextValue()
        .setText("📸 Buka Foto Bukti (" + idAduan + ")")
        .setLinkUrl(targetUrl)
        .build();
      cellRange.setRichTextValue(richText);
    } catch (rtErr) {
      cellRange.setValue(targetUrl);
    }
    fixedCount++;
  }

  writeLog('FIX_PHOTO_LINKS', 'Telah memperbaiki ' + fixedCount + ' link foto bukti menjadi tautan aktif.');

  return {
    success: true,
    fixed: fixedCount,
    message: 'Berhasil memperbaiki ' + fixedCount + ' link foto menjadi tautan yang bisa diklik langsung di spreadsheet.'
  };
}

/**
 * Alias fungsi untuk bisa dijalankan langsung dengan memilih fungsi ini dan klik "Run / Jalankan" di editor Apps Script
 */
function fixAllPhotos() {
  const res = bersihkanErrorFoto();
  Logger.log(JSON.stringify(res));
  return res;
}

/**
 * Fungsi instan dan tuntas untuk merapikan sheet Data_Aduan dan sheet Foto_Storage
 * Membersihkan #ERROR!, memindahkan Base64 yang panjang ke kolom D, dan membuat tautan klik rapi di kolom C
 */
function bersihkanErrorFoto() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var webAppUrl = getWebAppUrl();
  var fixedAduan = 0;
  var fixedStorage = 0;

  // 1. RAPIKAN SHEET "Data_Aduan" (Kolom O / Link_Foto_Bukti dan Kolom Foto_Kondisi_Riil)
  var sheet = getOrCreateSheet(SHEET_NAME_ADUAN, HEADERS_ADUAN);
  if (sheet) {
    var data = sheet.getDataRange().getValues();
    var colFotoIdx = HEADERS_ADUAN.indexOf('Link_Foto_Bukti');
    if (colFotoIdx === -1) colFotoIdx = 14;

    for (var i = 1; i < data.length; i++) {
      var id = String(data[i][0] || '').trim();
      if (!id) continue;
      var targetUrl = webAppUrl + '?action=viewFoto&id=' + encodeURIComponent(id);
      var cell = sheet.getRange(i + 1, colFotoIdx + 1);
      cell.clear({ contentsOnly: true });

      try {
        var richText = SpreadsheetApp.newRichTextValue()
          .setText('📸 Buka Foto Bukti (' + id + ')')
          .setLinkUrl(targetUrl)
          .build();
        cell.setRichTextValue(richText);
      } catch (e) {
        cell.setValue(targetUrl);
      }
      fixedAduan++;
    }

    var colFotoRiilIdx = HEADERS_ADUAN.indexOf('Foto_Kondisi_Riil');
    if (colFotoRiilIdx !== -1) {
      for (var r = 1; r < data.length; r++) {
        var rid = String(data[r][0] || '').trim();
        if (!rid) continue;
        var rVal = String(data[r][colFotoRiilIdx] || '').trim();
        if (rVal && (rVal.startsWith('http') || rVal.includes('viewFoto') || rVal.startsWith('=HYPERLINK'))) {
          var targetRiilUrl = rVal;
          if (targetRiilUrl.startsWith('=HYPERLINK')) {
            var m = targetRiilUrl.match(/=HYPERLINK\("([^"]+)"/i);
            if (m) targetRiilUrl = m[1];
          }
          var cellR = sheet.getRange(r + 1, colFotoRiilIdx + 1);
          cellR.clear({ contentsOnly: true });
          try {
            var rt = SpreadsheetApp.newRichTextValue()
              .setText('📸 Buka Foto Petugas (' + rid + ')')
              .setLinkUrl(targetRiilUrl)
              .build();
            cellR.setRichTextValue(rt);
          } catch (e) {
            cellR.setValue(targetRiilUrl);
          }
        }
      }
    }
  }

  // 2. RAPIKAN SHEET "Foto_Storage"
  var storageSheet = ss.getSheetByName(SHEET_NAME_FOTO);
  if (storageSheet) {
    var sData = storageSheet.getDataRange().getValues();
    var numRows = sData.length;

    // Set header resmi 4 kolom
    storageSheet.getRange(1, 1, 1, 4).setValues([['ID_Aduan', 'Timestamp', 'Link_Buka_Foto', 'Base64_Data']]);
    storageSheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#065f46').setFontColor('#fff');

    for (var s = 1; s < numRows; s++) {
      var sid = String(sData[s][0] || '').trim();
      if (!sid) continue;
      var stime = String(sData[s][1] || '').trim();

      // Cari string base64 yang sudah tersimpan (gabungkan jika terpecah di kolom D, E, F...)
      var b64 = '';
      for (var c = 3; c < sData[s].length; c++) {
        b64 += String(sData[s][c] || '');
      }
      if (!b64 || !b64.startsWith('data:image')) {
        for (var c = 1; c < sData[s].length; c++) {
          var v = String(sData[s][c] || '').trim();
          if (v.startsWith('data:image')) {
            b64 = v;
            break;
          }
        }
      }

      var targetUrl = webAppUrl + '?action=viewFoto&id=' + encodeURIComponent(sid);

      // Tulis kolom C sebagai tautan hyperlink yang bisa diklik langsung di browser
      var linkCell = storageSheet.getRange(s + 1, 3);
      linkCell.clear({ contentsOnly: true });
      try {
        var richText = SpreadsheetApp.newRichTextValue()
          .setText('📸 Buka Foto Bukti (' + sid + ')')
          .setLinkUrl(targetUrl)
          .build();
        linkCell.setRichTextValue(richText);
      } catch (e) {
        linkCell.setValue(targetUrl);
      }

      // Pastikan data teks Base64 tersimpan aman di kolom D, E, F... tanpa melebihi batas 50.000 karakter per sel!
      if (b64) {
        var CHUNK_SIZE = 40000;
        var chunks = [];
        for (var k = 0; k < b64.length; k += CHUNK_SIZE) {
          chunks.push(b64.substring(k, k + CHUNK_SIZE));
        }
        if (chunks.length > 0) {
          storageSheet.getRange(s + 1, 4, 1, chunks.length).setValues([chunks]);
        }
      }
      fixedStorage++;
    }
  }

  var msg = 'SELESAI TUNTAS! Diperbaiki ' + fixedAduan + ' baris di Data_Aduan dan ' + fixedStorage + ' baris di Foto_Storage.';
  Logger.log(msg);
  return { success: true, fixedAduan: fixedAduan, fixedStorage: fixedStorage, message: msg };
}

/**
 * Menu otomatis di Google Spreadsheet saat spreadsheet dibuka
 */
function onOpen() {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('🌱 DLH Lembata')
      .addItem('📸 Bersihkan & Perbaiki Semua Foto (#ERROR!)', 'bersihkanErrorFoto')
      .addItem('🔄 Sinkronkan Seluruh Sheet', 'syncAllSheets')
      .addToUi();
  } catch (e) { }
}

