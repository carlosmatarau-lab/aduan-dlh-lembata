/**
 * SISTEM PENDATAAN DIGITAL ADUAN PENCEMARAN LINGKUNGAN
 * DINAS LINGKUNGAN HIDUP KABUPATEN LEMBATA
 * Data Store, Default Dataset & LocalStorage Management
 */

const STORAGE_KEY = 'dlh_lembata_aduan_v5';
const LEGACY_STORAGE_KEYS = ['dlh_lembata_aduan_v1', 'dlh_lembata_aduan_v2', 'dlh_lembata_aduan_v3', 'dlh_lembata_aduan_v4', 'dlh_deleted_aduan_ids', 'dlh_cleaned_v2'];

/* ===================================================================
   DLH LEMBATA REAL-TIME SYNC ENGINE (BROADCASTCHANNEL + STORAGE FALLBACK)
   Menghubungkan pembaruan data secara langsung (0-latency) antar tab & portal
   =================================================================== */
(function() {
  const CHANNEL_NAME = 'dlh_lembata_realtime_channel';
  const STORAGE_PING_KEY = 'dlh_lembata_realtime_ping';
  let bc = null;

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel(CHANNEL_NAME);
    }
  } catch (err) {
    console.warn('BroadcastChannel not supported, using storage fallback:', err);
  }

  const listeners = [];

  function broadcast(type, payload = {}) {
    const msg = {
      type: type,
      payload: payload,
      timestamp: Date.now(),
      sender: Math.random().toString(36).substring(2, 9)
    };

    if (bc) {
      try {
        bc.postMessage(msg);
      } catch (e) {}
    }

    try {
      localStorage.setItem(STORAGE_PING_KEY, JSON.stringify(msg));
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('dlhRealtimeLocalMsg', { detail: msg }));
  }

  function notify(msg) {
    if (!msg || !msg.type) return;
    listeners.forEach(fn => {
      try { fn(msg); } catch (e) { console.error('Realtime callback error:', e); }
    });
  }

  if (bc) {
    bc.onmessage = (ev) => notify(ev.data);
  }

  window.addEventListener('storage', (ev) => {
    if (ev.key === STORAGE_PING_KEY && ev.newValue) {
      try {
        const parsed = JSON.parse(ev.newValue);
        notify(parsed);
      } catch (e) {}
    } else if (ev.key === STORAGE_KEY) {
      notify({ type: 'STORAGE_RAW_UPDATED', timestamp: Date.now() });
    }
  });

  window.dlhRealtime = {
    broadcast: broadcast,
    listen: function(fn) {
      if (typeof fn === 'function') listeners.push(fn);
    }
  };
})();

// Daftar 9 Kecamatan di Kabupaten Lembata beserta titik pusat koordinat dan daftar desa/kelurahan
const KECAMATAN_LEMBATA = {
  'Nubatukan': {
    lat: -8.3682,
    lng: 123.5583,
    ibukota: 'Lewoleba',
    desa: [
      'Bakalerek',
      'Baolangu',
      'Belobatang',
      'Bour',
      'Lewoleba (Kelurahan)',
      'Lewoleba Barat (Kelurahan)',
      'Lewoleba Selatan (Kelurahan)',
      'Lewoleba Tengah (Kelurahan)',
      'Lewoleba Timur (Kelurahan)',
      'Lewoleba Utara (Kelurahan)',
      'Lite Ulumado',
      'Nubamado',
      'Nubatukan',
      'Pada',
      'Paubokol',
      'Selandoro (Kelurahan)',
      'Udak Melomata',
      'Waijarang'
    ]
  },
  'Ile Ape': {
    lat: -8.2831,
    lng: 123.5412,
    ibukota: 'Waipukang',
    desa: [
      'Amakaka',
      'Beutaran',
      'Bungamuda',
      'Dulitukan',
      'Kolipadan',
      'Kolontobo',
      'Lamawara',
      'Laranwuntun',
      'Muruona',
      'Napasabok',
      'Palilolon',
      'Petuntawa',
      'Riangbao',
      'Tagawiti',
      'Tanjung Batu',
      'Waowala',
      'Watodiri'
    ]
  },
  'Ile Ape Timur': {
    lat: -8.2915,
    lng: 123.6128,
    ibukota: 'Lamagute',
    desa: [
      'Aulesa',
      'Bao Lai Duli',
      'Jontona',
      'Lamaau',
      'Lamagute',
      'Lamatokan',
      'Lamawolo',
      'Todanara',
      'Waimatan'
    ]
  },
  'Lebatukan': {
    lat: -8.3584,
    lng: 123.6652,
    ibukota: 'Hadakewa',
    desa: [
      'Atakore',
      'Balurebong',
      'Baopana',
      'Belobao',
      'Dikesare',
      'Hadakewa',
      'Lamalela',
      'Lamatuka',
      'Lerahinga',
      'Lewoeleng',
      'Lodoblolong',
      'Merdeka',
      'Seranggorang',
      'Tapobaran',
      'Tapolangu',
      'Waienga',
      'Wangatoa'
    ]
  },
  'Nagawutung': {
    lat: -8.4902,
    lng: 123.3854,
    ibukota: 'Loang',
    desa: [
      'Babokerong',
      'Bauraja',
      'Belabaja',
      'Duawutun',
      'Idalolong',
      'Ilape',
      'Ile Kimok',
      'Labalimut',
      'Liwulagang',
      'Loang',
      'Lusilame',
      'Pasir Putih',
      'Penikene',
      'Riangbao',
      'Sinunaleng',
      'Tewaowutung',
      'Warawatung',
      'Wuakerong'
    ]
  },
  'Wulandoni': {
    lat: -8.5412,
    lng: 123.4915,
    ibukota: 'Wulandoni',
    desa: [
      'Alap Atadei',
      'Atakera',
      'Belobao',
      'Imulolong',
      'Lamalera A',
      'Lamalera B',
      'Leworaja',
      'Mulankera',
      'Pantai Harapan',
      'Pora',
      'Posiwatu',
      'Puor',
      'Puor B',
      'Tapobali',
      'Wulandoni'
    ]
  },
  'Atadei': {
    lat: -8.4550,
    lng: 123.5681,
    ibukota: 'Kalikasa',
    desa: [
      'Atakore',
      'Atanila',
      'Dulir',
      'Kalikasa',
      'Karangora',
      'Katakeja',
      'Lebomatan',
      'Lewogroma',
      'Lewokukung',
      'Lusilame',
      'Nogo Doni',
      'Nubahaeraka',
      'Tubuk Rajan',
      'Wadun',
      'Watuwawer'
    ]
  },
  'Omesuri': {
    lat: -8.2351,
    lng: 123.8224,
    ibukota: 'Balauring',
    desa: [
      'Aramaba',
      'Balauring',
      'Dolulolong',
      'Hingalamamengi',
      'Hoelea',
      'Hoelea II',
      'Leubatang',
      'Leudanung',
      'Leuwayang',
      'Mahal',
      'Mahal II',
      'Meluwiting',
      'Meluwiting I',
      'Nilanapo',
      'Normal',
      'Normal I',
      'Peusawa',
      'Roma',
      'Unleurn',
      'Usun Manu',
      'Walangsawa',
      'Wowong'
    ]
  },
  'Buyasuri': {
    lat: -8.1925,
    lng: 123.9450,
    ibukota: 'Wairiang',
    desa: [
      'Atulaleng',
      'Atuwalupang',
      'Bareng',
      'Bean',
      'Benikoor',
      'Boli Bean',
      'Buriwutung',
      'Kalikur',
      'Kalikur WL',
      'Kaohua',
      'Leuburi',
      'Loyobohor',
      'Mampir',
      'Panama',
      'Roho',
      'Rumang',
      'Tobotani',
      'Tuwago',
      'Umaleu',
      'Wairiang'
    ]
  }
};
if (typeof window !== 'undefined') {
  window.KECAMATAN_LEMBATA = KECAMATAN_LEMBATA;
}

// Data Awal Aduan (Kosong 0 aduan secara default - terhubung murni & sinkron langsung dengan Google Spreadsheet & Drive)
const INITIAL_ADUAN_DATA = [];

// Helper: Parse Google Sheets CSV Export menjadi array data aduan
function parseCsvToAduan(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];
  const lines = [];
  let row = [];
  let inQuotes = false;
  let current = '';

  for (let i = 0; i < csvText.length; i++) {
    const c = csvText[i];
    const next = csvText[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      row.push(current);
      lines.push(row);
      row = [];
      current = '';
    } else {
      current += c;
    }
  }
  if (current || row.length > 0) {
    row.push(current);
    lines.push(row);
  }

  if (lines.length < 2) return [];
  const headers = lines[0].map(h => (h || '').trim().replace(/^"|"$/g, ''));
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const r = lines[i];
    if (!r || r.length < 2) continue;
    const item = {};
    headers.forEach((h, idx) => {
      item[h] = (r[idx] || '').trim().replace(/^"|"$/g, '');
    });

    const id = item.ID_Aduan || item.id || `ADU-LMB-2026-${String(i).padStart(3, '0')}`;
    const foto = item.Link_Foto_Bukti || item.Foto_Bukti || item.fotoBukti || item.linkFoto || item.Link_Bukti || '';
    result.push({
      id: id,
      timestamp: item.Timestamp || item.timestamp || '-',
      namaPelapor: item.Nama_Pelapor || item.namaPelapor || 'Masyarakat',
      noHp: item.No_HP || item.noHp || '-',
      alamatPelapor: item.Alamat_Pelapor || item.alamatPelapor || '-',
      kecamatan: item.Kecamatan || item.kecamatan || 'Nubatukan',
      desa: item.Desa_Kelurahan || item.desa || '-',
      lokasiDetail: item.Lokasi_Detail || item.lokasiDetail || '-',
      lat: parseFloat(item.Latitude || item.lat || -8.368),
      lng: parseFloat(item.Longitude || item.lng || 123.558),
      jenisPencemaran: item.Jenis_Pencemaran || item.jenisPencemaran || 'Lainnya',
      uraian: item.Uraian_Aduan || item.uraian || '-',
      sumberDugaan: item.Sumber_Dugaan || item.sumberDugaan || '-',
      tanggalKejadian: item.Tanggal_Kejadian || item.tanggalKejadian || '-',
      fotoBukti: foto,
      linkFotoBukti: foto,
      buktiFotoList: foto ? (foto.includes(',') ? foto.split(',').map(s => s.trim()).filter(Boolean) : [foto]) : [],
      status: item.Status || item.status || 'Baru',
      petugasVerifikasi: item.Petugas_Verifikasi || item.petugasVerifikasi || '-',
      tanggalVerifikasi: item.Tanggal_Verifikasi || item.tanggalVerifikasi || '-',
      hasilVerifikasi: item.Hasil_Verifikasi || item.hasilVerifikasi || '-',
      tindakanDLH: item.Tindakan_DLH || item.tindakanDLH || '-',
      tanggalSelesai: item.Tanggal_Selesai || item.tanggalSelesai || '-'
    });
  }
  return result;
}

// Helper pemetaan aduan remote Google Spreadsheet ke model data aplikasi
function mapRemoteAduanRecord(remoteItem, currentList = [], isDeletedFn = null) {
  if (!remoteItem || !remoteItem.id) return null;
  const cleanId = String(remoteItem.id).trim().toUpperCase();

  if (typeof isDeletedFn === 'function' && isDeletedFn(cleanId)) return null;

  const existing = Array.isArray(currentList) ? currentList.find(x => x && x.id && x.id.trim().toUpperCase() === cleanId) : null;

  const rekamTerakhir = remoteItem.rekamTindakanTerakhir || (
    (remoteItem.tindakanDLH && remoteItem.tindakanDLH !== '-') ? {
      waktu: remoteItem.tanggalVerifikasi && remoteItem.tanggalVerifikasi !== '-' ? `${remoteItem.tanggalVerifikasi} 10:00` : (remoteItem.timestamp || '-'),
      petugas: remoteItem.petugasVerifikasi && remoteItem.petugasVerifikasi !== '-' ? remoteItem.petugasVerifikasi : 'Tim Lapangan DLH',
      kategori: remoteItem.status === 'Selesai' ? 'Penyelesaian Kasus' : (remoteItem.status === 'Ditindaklanjuti' || remoteItem.status === 'Dalam Penanganan' ? 'Tindakan Lapangan' : 'Verifikasi Lapangan'),
      status: remoteItem.status || 'Dalam Penanganan',
      tindakan: remoteItem.tindakanDLH,
      hasil: remoteItem.hasilVerifikasi !== '-' ? remoteItem.hasilVerifikasi : '',
      catatan: remoteItem.catatan || ''
    } : null
  );

  const existingPhotos = existing ? (Array.isArray(existing.buktiFotoList) ? existing.buktiFotoList : (existing.fotoBukti ? [existing.fotoBukti] : [])) : [];
  
  let remotePhotos = [];
  if (Array.isArray(remoteItem.buktiFotoList) && remoteItem.buktiFotoList.length > 0) {
    remotePhotos = remoteItem.buktiFotoList;
  } else {
    const rawPhotoStr = (remoteItem.linkFoto && remoteItem.linkFoto !== '-') ? remoteItem.linkFoto : (remoteItem.fotoBukti && remoteItem.fotoBukti !== '-' ? remoteItem.fotoBukti : '');
    if (rawPhotoStr && typeof rawPhotoStr === 'string') {
      const matches = rawPhotoStr.match(/(data:image\/[a-zA-Z0-9\+\/\-\.]+;base64,[A-Za-z0-9\+\/\=]+|https?:\/\/[^\s,]+)/g);
      if (matches && matches.length > 0) {
        remotePhotos = matches;
      } else if (rawPhotoStr.startsWith('data:') || rawPhotoStr.startsWith('http')) {
        remotePhotos = [rawPhotoStr.trim()];
      }
    }
  }

  // Format tautan drive dan pastikan hanya item foto valid yang disertakan
  const validRemote = remotePhotos.map(p => {
    if (typeof p !== 'string') return '';
    let tr = p.trim();
    if (!tr || tr === '-' || tr.includes('#ERROR')) return '';
    if (tr.includes('Buka') && tr.includes('Foto Bukti')) return '';
    const dMatch = tr.match(/(?:\/file\/d\/|[?&]id=)([a-zA-Z0-9_-]+)/);
    if (dMatch && dMatch[1] && !tr.startsWith('data:image')) {
      return `https://lh3.googleusercontent.com/d/${dMatch[1]}`;
    }
    return tr;
  }).filter(Boolean);

  // Penentuan finalPhotos: Pertahankan seluruh multi-foto valid dari remote, lokal, dan cache
  let finalPhotos = [];
  if (validRemote.length > 0) {
    finalPhotos = validRemote.map((remPhoto, idx) => {
      // Jika remote sudah Base64 kualitas penuh, pakai remote
      if (remPhoto && remPhoto.startsWith('data:image')) return remPhoto;
      // Gunakan Base64 lokal HANYA jika ada di index yang bersangkutan untuk meningkatkan ketajaman visual
      const localBase64 = (existingPhotos[idx] && typeof existingPhotos[idx] === 'string' && existingPhotos[idx].startsWith('data:image'))
        ? existingPhotos[idx]
        : null;
      if (localBase64) return localBase64;
      try {
        const cached = localStorage.getItem('dlh_photo_cache_' + cleanId + '_' + idx) ||
                       localStorage.getItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_' + idx);
        if (cached && cached.startsWith('data:image')) return cached;
      } catch (e) {}
      return remPhoto;
    });

    // Pertahankan multi-foto dari rekaman lokal jika server mengembalikan foto lebih sedikit
    if (existingPhotos.length > finalPhotos.length) {
      for (let k = finalPhotos.length; k < existingPhotos.length; k++) {
        if (existingPhotos[k] && !finalPhotos.includes(existingPhotos[k])) {
          finalPhotos.push(existingPhotos[k]);
        }
      }
    }
    // Periksa juga cache lokal untuk indeks multi-foto (foto 2, 3, dst)
    for (let k = finalPhotos.length; k < 6; k++) {
      try {
        const cached = localStorage.getItem('dlh_photo_cache_' + cleanId + '_' + k) ||
                       localStorage.getItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_' + k);
        if (cached && cached.startsWith('data:image') && !finalPhotos.includes(cached)) {
          finalPhotos.push(cached);
        }
      } catch (e) {}
    }
  } else if (existingPhotos.length > 0) {
    finalPhotos = [...existingPhotos];
  } else {
    for (let k = 0; k < 6; k++) {
      try {
        const cached = localStorage.getItem('dlh_photo_cache_' + cleanId + '_' + k) ||
                       localStorage.getItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_' + k);
        if (cached && cached.startsWith('data:image') && !finalPhotos.includes(cached)) {
          finalPhotos.push(cached);
        }
      } catch (e) {}
    }
  }

  // Perbarui cache lokal untuk index aktif dan bersihkan cache kadaluarsa HANYA di luar jumlah foto aktif
  for (let i = 0; i < finalPhotos.length; i++) {
    if (finalPhotos[i] && finalPhotos[i].startsWith('data:image')) {
      try {
        localStorage.setItem('dlh_photo_cache_' + cleanId + '_' + i, finalPhotos[i]);
      } catch (e) {}
    }
  }
  for (let i = finalPhotos.length; i < 6; i++) {
    try {
      localStorage.removeItem('dlh_photo_cache_' + cleanId + '_' + i);
      localStorage.removeItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_' + i);
    } catch (e) {}
  }
  const finalFoto = finalPhotos[0] || '';

  const isUnverified = (!remoteItem.status || remoteItem.status === 'Baru' || remoteItem.status === 'Aduan Diterima' || remoteItem.status === 'Verifikasi Administrasi' || remoteItem.status === '-');

  // Multi-foto dokumentasi fisik riil petugas
  let resolvedOfficerPhotos = [];
  if (Array.isArray(remoteItem.fotoVerifikasiList) && remoteItem.fotoVerifikasiList.length > 0) {
    remoteItem.fotoVerifikasiList.forEach(p => {
      const s = (p && p.dataUrl) ? p.dataUrl : (typeof p === 'string' ? p : '');
      if (s && s.trim() && s.trim() !== '-' && !resolvedOfficerPhotos.includes(s.trim())) {
        resolvedOfficerPhotos.push(s.trim());
      }
    });
  } else if (remoteItem.fotoKondisiRiil && remoteItem.fotoKondisiRiil !== '-') {
    const rawRiil = String(remoteItem.fotoKondisiRiil).trim();
    const matchesRiil = rawRiil.match(/(data:image\/[a-zA-Z0-9\+\/\-\.]+;base64,[A-Za-z0-9\+\/\=]+|https?:\/\/[^\s,]+)/g);
    if (matchesRiil && matchesRiil.length > 0) {
      matchesRiil.forEach(s => {
        if (s.trim() && !resolvedOfficerPhotos.includes(s.trim())) resolvedOfficerPhotos.push(s.trim());
      });
    } else if (rawRiil) {
      resolvedOfficerPhotos.push(rawRiil);
    }
  }

  // Jika item lokal sebelumnya memiliki foto petugas yang lebih lengkap, pertahankan
  if (existing && Array.isArray(existing.fotoVerifikasiList) && existing.fotoVerifikasiList.length > resolvedOfficerPhotos.length) {
    existing.fotoVerifikasiList.forEach(p => {
      if (p && !resolvedOfficerPhotos.includes(p)) resolvedOfficerPhotos.push(p);
    });
  }

  // Cek cache foto lokal petugas jika ada Base64
  for (let k = 0; k < 6; k++) {
    try {
      const cached = localStorage.getItem('dlh_photo_cache_' + cleanId + '_PETUGAS_' + k) ||
                     localStorage.getItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_PETUGAS_' + k) ||
                     (k === 0 ? localStorage.getItem('dlh_photo_cache_' + cleanId + '_PETUGAS') : null);
      if (cached && cached.startsWith('data:image')) {
        if (k < resolvedOfficerPhotos.length) {
          if (!resolvedOfficerPhotos[k] || !resolvedOfficerPhotos[k].startsWith('http')) {
            resolvedOfficerPhotos[k] = cached;
          }
        } else if (!resolvedOfficerPhotos.includes(cached)) {
          resolvedOfficerPhotos.push(cached);
        }
      }
    } catch (e) {}
  }

  // Simpan / perbarui cache lokal foto petugas yang berupa Base64
  for (let i = 0; i < resolvedOfficerPhotos.length; i++) {
    if (resolvedOfficerPhotos[i] && resolvedOfficerPhotos[i].startsWith('data:image')) {
      try {
        localStorage.setItem('dlh_photo_cache_' + cleanId + '_PETUGAS_' + i, resolvedOfficerPhotos[i]);
        if (i === 0) localStorage.setItem('dlh_photo_cache_' + cleanId + '_PETUGAS', resolvedOfficerPhotos[i]);
      } catch (e) {}
    }
  }

  const finalOfficerPhotos = isUnverified ? [] : resolvedOfficerPhotos;

  return {
    id: cleanId,
    timestamp: remoteItem.timestamp || '-',
    namaPelapor: remoteItem.namaPelapor || 'Masyarakat',
    noHp: remoteItem.noHp || '-',
    alamatPelapor: remoteItem.alamatPelapor || '-',
    kecamatan: remoteItem.kecamatan || 'Nubatukan',
    desa: remoteItem.desa || '-',
    lokasiDetail: remoteItem.lokasiDetail || '-',
    lat: parseFloat(remoteItem.lat || -8.368),
    lng: parseFloat(remoteItem.lng || 123.558),
    jenisPencemaran: remoteItem.jenisPencemaran || 'Lainnya',
    uraian: remoteItem.uraian || '-',
    sumberDugaan: remoteItem.sumberDugaan || '-',
    tanggalKejadian: remoteItem.tanggalKejadian || '-',
    fotoBukti: finalFoto,
    linkFotoBukti: finalFoto,
    buktiFotoList: finalPhotos,
    status: remoteItem.status || 'Baru',
    petugasVerifikasi: isUnverified ? '-' : (remoteItem.petugasVerifikasi || '-'),
    tanggalVerifikasi: isUnverified ? '-' : (remoteItem.tanggalVerifikasi || '-'),
    hasilVerifikasi: isUnverified ? '-' : (remoteItem.hasilVerifikasi || '-'),
    tindakanDLH: isUnverified ? '-' : (remoteItem.tindakanDLH || '-'),
    tanggalSelesai: isUnverified ? '-' : (remoteItem.tanggalSelesai || '-'),
    nomorBeritaAcara: isUnverified ? '' : (remoteItem.nomorBeritaAcara || ''),
    catatanBeritaAcara: isUnverified ? '' : (remoteItem.catatanBeritaAcara || ''),
    fotoKondisiRiil: isUnverified ? '' : (finalOfficerPhotos[0] || ''),
    fotoVerifikasiList: finalOfficerPhotos,
    rekamTindakanTerakhir: rekamTerakhir,
    riwayatTindakan: Array.isArray(remoteItem.riwayatTindakan) ? remoteItem.riwayatTindakan : (rekamTerakhir ? [rekamTerakhir] : [])
  };
}

// Konfigurasi Kunci Penyimpanan & URL Web App Google Apps Script
const GAS_CONFIG_KEY = 'dlh_gas_api_url';
const DELETED_STORAGE_KEY = 'dlh_deleted_aduan_ids';
const DEFAULT_GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwuDJ9X5a27GnVuuiU1keHexKXzG3OITUxwOomwHGt-1S53DdqfAfguDInXwtbh9ljKMw/exec';

class AduanDataStore {
  constructor() {
    this.mapRemoteRecord = this.mapRemoteRecord.bind(this);
    this.aduanList = [];
    const saved = localStorage.getItem(GAS_CONFIG_KEY);
    // Otomatis sinkronkan dan migrasikan URL lama ke URL deployment baru yang aktif
    if (saved && !saved.includes('AKfycbwuDJ9X5a27GnVuuiU1keHexKXzG3OITUxwOomwHGt-1S53DdqfAfguDInXwtbh9ljKMw')) {
      localStorage.setItem(GAS_CONFIG_KEY, DEFAULT_GAS_API_URL);
      this.gasApiUrl = DEFAULT_GAS_API_URL;
    } else {
      this.gasApiUrl = (saved && saved.trim().startsWith('http')) ? saved.trim() : DEFAULT_GAS_API_URL;
    }
    this.isSyncing = false;
    this.currentSyncPromise = null;
    this.lastSyncTime = null;
    this.pendingDeletions = {};
    this._activeSyncIds = new Set();
    this.init();
  }

  isDeleted(id) {
    if (!id) return false;
    const cleanId = String(id).trim().toUpperCase();
    if (!this.pendingDeletions) this.pendingDeletions = {};
    const delTime = this.pendingDeletions[cleanId];
    if (!delTime) return false;
    // TTL 60 detik: cegah flickering saat request delete sedang berjalan ke cloud
    if (Date.now() - delTime > 60000) {
      delete this.pendingDeletions[cleanId];
      return false;
    }
    return true;
  }

  markDeleted(id) {
    if (!id) return;
    const cleanId = String(id).trim().toUpperCase();
    if (!this.pendingDeletions) this.pendingDeletions = {};
    this.pendingDeletions[cleanId] = Date.now();
  }

  init() {
    // 1. Bersihkan seluruh penyimpanan lokal usang & blacklist masa lalu agar sinkron 100% antar perangkat
    LEGACY_STORAGE_KEYS.forEach(key => {
      try { localStorage.removeItem(key); } catch (e) {}
    });
    try {
      localStorage.removeItem(DELETED_STORAGE_KEY);
      localStorage.removeItem('dlh_deleted_aduan_ids');
    } catch (e) {}
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.aduanList = Array.isArray(parsed) ? parsed.filter(item => {
          if (!item || !item.id) return false;
          // Hapus sisa cache dummy Carlos Matarau jika tersimpan dari sesi lama
          if (String(item.id).toUpperCase() === 'ADU-LMB-2026-001' && (item.namaPelapor === 'Carlos Matarau' || item.status === 'Ditolak')) {
            return false;
          }
          return !this.isDeleted(item.id);
        }) : [];
      } catch (e) {
        this.aduanList = [];
      }
    } else {
      this.aduanList = [];
    }

    // Bersihkan foto petugas lama jika ada pada aduan baru / belum diverifikasi
    this.aduanList.forEach(item => {
      const st = String(item.status || 'Baru').trim().toLowerCase();
      if (!st || st === 'baru' || st === 'aduan diterima' || st === 'verifikasi administrasi' || st === '-') {
        item.fotoKondisiRiil = '';
        item.fotoVerifikasiList = [];
        item.nomorBeritaAcara = '';
        item.catatanBeritaAcara = '';
      }

      // Pulihkan foto yang tersimpan link Drive dengan data Base64 asli dari cache
      if (item && item.id) {
        const cId = String(item.id).trim().toUpperCase();
        if (Array.isArray(item.buktiFotoList)) {
          item.buktiFotoList = item.buktiFotoList.map((p, pIdx) => {
            if (typeof p === 'string' && !p.startsWith('data:image')) {
              try {
                const cached = localStorage.getItem('dlh_photo_cache_' + cId + '_' + pIdx);
                if (cached && cached.startsWith('data:image')) return cached;
              } catch (e) {}
            }
            return p;
          });
          if (item.buktiFotoList[0] && item.buktiFotoList[0].startsWith('data:image')) {
            item.fotoBukti = item.buktiFotoList[0];
          }
        }
      }
    });

    this._deduplicateList();
    this.save();

    // Sinkronisasi otomatis real-time lintas perangkat (Interval 5 detik + event-driven)
    if (this.hasGasConfigured() && !this._pollIntervalStarted) {
      this._pollIntervalStarted = true;
      setTimeout(() => this.syncFromGAS(true), 150);
      setInterval(() => this.syncFromGAS(true), 5000);

      // Sinkronkan instan saat tab dibuka kembali, window fokus, atau koneksi pulih
      if (typeof window !== 'undefined') {
        window.addEventListener('focus', () => this.syncFromGAS(true));
        window.addEventListener('online', () => this.syncFromGAS(true));
        if (typeof document !== 'undefined') {
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              this.syncFromGAS(true);
            }
          });
        }
      }
    }
  }

  hasGasConfigured() {
    const url = this.getGasUrl();
    return !!(url && url.trim().startsWith('http'));
  }

  async fetchPhotoBase64FromGAS(aduanId, photoIdx = 0) {
    if (!aduanId || !this.hasGasConfigured()) return null;
    const cleanId = String(aduanId).trim().toUpperCase();
    const pIdx = parseInt(photoIdx || '0', 10) || 0;

    // 1. Cek cache lokal
    try {
      const cached = localStorage.getItem('dlh_photo_cache_' + cleanId + '_' + pIdx) ||
                     localStorage.getItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_' + pIdx) ||
                     (pIdx === 0 ? localStorage.getItem('dlh_photo_cache_' + cleanId) : null);
      if (cached && cached.startsWith('data:image')) return cached;
    } catch (e) {}

    // 2. Fetch rekaman dari GAS endpoint via action getById
    try {
      const gasUrl = this.getGasUrl();
      const url = `${gasUrl}${gasUrl.includes('?') ? '&' : '?'}action=getById&id=${encodeURIComponent(cleanId)}&_t=${Date.now()}`;
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      const json = await res.json();
      if (json && json.success && json.data) {
        const item = json.data;
        let photos = Array.isArray(item.buktiFotoList) ? item.buktiFotoList : [];
        if (photos.length === 0 && item.fotoBukti) photos = [item.fotoBukti];
        
        const photo = photos[pIdx] || photos[0];
        if (photo && photo.startsWith('data:image')) {
          try {
            localStorage.setItem('dlh_photo_cache_' + cleanId + '_' + pIdx, photo);
          } catch (e) {}

          const idx = this.aduanList.findIndex(x => x && x.id && x.id.trim().toUpperCase() === cleanId);
          if (idx !== -1) {
            if (Array.isArray(this.aduanList[idx].buktiFotoList) && this.aduanList[idx].buktiFotoList[pIdx]) {
              this.aduanList[idx].buktiFotoList[pIdx] = photo;
            }
            if (pIdx === 0) {
              this.aduanList[idx].fotoBukti = photo;
            }
            this.save();
          }
          return photo;
        }
      }
    } catch (err) {
      console.warn('Gagal fetch getById dari GAS:', err);
    }

    // 3. Fallback direct storage lookup via action getFotoBase64
    try {
      const gasUrl = this.getGasUrl();
      const url = `${gasUrl}${gasUrl.includes('?') ? '&' : '?'}action=getFotoBase64&id=${encodeURIComponent(cleanId)}&photoIdx=${pIdx}&_t=${Date.now()}`;
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      const json = await res.json();
      if (json && json.success && json.base64 && json.base64.startsWith('data:image')) {
        try {
          localStorage.setItem('dlh_photo_cache_' + cleanId + '_' + pIdx, json.base64);
        } catch (e) {}
        const idx = this.aduanList.findIndex(x => x && x.id && x.id.trim().toUpperCase() === cleanId);
        if (idx !== -1) {
          if (Array.isArray(this.aduanList[idx].buktiFotoList) && this.aduanList[idx].buktiFotoList[pIdx]) {
            this.aduanList[idx].buktiFotoList[pIdx] = json.base64;
          }
          if (pIdx === 0) {
            this.aduanList[idx].fotoBukti = json.base64;
          }
          this.save();
        }
        return json.base64;
      }
    } catch (err) {
      console.warn('Gagal fetch getFotoBase64 dari GAS:', err);
    }

    return null;
  }

  getGasUrl() {
    if (this.gasApiUrl && this.gasApiUrl.trim().startsWith('http') && this.gasApiUrl.includes('AKfycbwuDJ9X5a27GnVuuiU1keHexKXzG3OITUxwOomwHGt-1S53DdqfAfguDInXwtbh9ljKMw')) {
      return this.gasApiUrl.trim();
    }
    const stored = (localStorage.getItem(GAS_CONFIG_KEY) || '').trim();
    if (stored && stored.startsWith('http') && stored.includes('AKfycbwuDJ9X5a27GnVuuiU1keHexKXzG3OITUxwOomwHGt-1S53DdqfAfguDInXwtbh9ljKMw')) {
      return stored;
    }
    if (window.GAS_API_URL && String(window.GAS_API_URL).trim().startsWith('http')) {
      return String(window.GAS_API_URL).trim();
    }
    return DEFAULT_GAS_API_URL;
  }

  setGasUrl(url) {
    const cleanUrl = (url || '').trim();
    if (cleanUrl && cleanUrl.startsWith('http')) {
      this.gasApiUrl = cleanUrl;
      localStorage.setItem(GAS_CONFIG_KEY, cleanUrl);
    } else {
      // Kembalikan ke URL default resmi Google Apps Script
      this.gasApiUrl = DEFAULT_GAS_API_URL;
      localStorage.removeItem(GAS_CONFIG_KEY);
    }
    return this.hasGasConfigured();
  }

  async syncFromGAS(silent = false) {
    if (!this.hasGasConfigured()) {
      return { success: false, reason: 'URL Web App Google Apps Script belum disetel.' };
    }

    // Jika sedang dalam proses sinkronisasi, tunggu promise yang sedang aktif daripada tumpang tindih
    if (this.isSyncing) {
      if (this.currentSyncPromise) {
        return await this.currentSyncPromise;
      }
      return { success: true, silent: true, message: 'Sinkronisasi cloud sedang berjalan...' };
    }

    this.isSyncing = true;
    this.currentSyncPromise = (async () => {
      try {
        let endpoint = this.getGasUrl();

        // Dukungan jika pengguna memasukkan link Google Spreadsheet langsung
        if (endpoint.includes('docs.google.com/spreadsheets')) {
          const match = endpoint.match(/\/d\/([a-zA-Z0-9-_]+)/);
          if (match) {
            const sheetId = match[1];
            endpoint = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Data_Aduan`;
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`Gagal membaca sheet (HTTP ${response.status})`);
            const csvText = await response.text();
            const parsedData = parseCsvToAduan(csvText);
            if (parsedData.length > 0) {
              const valid = parsedData.filter(p => !this.isDeleted(p.id));
              const mapFn = typeof this.mapRemoteRecord === 'function'
                ? (item) => this.mapRemoteRecord(item)
                : (item) => mapRemoteAduanRecord(item, this.aduanList, (id) => this.isDeleted(id));
              this.aduanList = valid.map(mapFn).filter(Boolean);
              this.save();
              this.lastSyncTime = new Date();
              window.dispatchEvent(new CustomEvent('aduanDataSynced', { detail: { count: this.aduanList.length, silent: silent } }));
              return { success: true, count: this.aduanList.length };
            } else {
              // Sheet kosong 0 baris
              this.aduanList = [];
              this.save();
              this.lastSyncTime = new Date();
              window.dispatchEvent(new CustomEvent('aduanDataSynced', { detail: { count: 0, silent: silent, emptyRemote: true } }));
              return { success: true, count: 0, emptyRemote: true };
            }
          }
        }

        // Endpoint resmi Google Apps Script Web App
        endpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}action=getAll&_t=${Date.now()}`;
        const response = await fetch(endpoint, { method: 'GET', mode: 'cors' });
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        const json = await response.json();

        if (json && json.success && Array.isArray(json.data)) {
          if (json.data.length > 0) {
            // Sinkronkan data dari Google Apps Script sebagai Single Source of Truth
            const validItems = json.data.filter(item => !this.isDeleted(item.id));
            const serverIdSet = new Set(validItems.map(item => String(item.id).trim().toUpperCase()));

            const mapFn = typeof this.mapRemoteRecord === 'function'
              ? (item) => this.mapRemoteRecord(item)
              : (item) => mapRemoteAduanRecord(item, this.aduanList, (id) => this.isDeleted(id));
            const mappedServerItems = validItems.map(mapFn).filter(Boolean);
            // Deduplikasi item dari server (Cegah kemunculan 2 laporan untuk 1 aduan)
            const seenIds = new Set();
            const uniqueServerItems = [];
            for (const item of mappedServerItems) {
              if (!item || !item.id) continue;
              const cid = String(item.id).trim().toUpperCase();
              if (!seenIds.has(cid)) {
                seenIds.add(cid);
                uniqueServerItems.push(item);
              }
            }

            // Bersihkan flag pending untuk item yang telah berhasil terindeks di server
            (this.aduanList || []).forEach(localItem => {
              if (localItem && localItem.id) {
                const cid = String(localItem.id).trim().toUpperCase();
                if (seenIds.has(cid)) {
                  delete localItem._pendingSync;
                  delete localItem._syncingNow;
                  if (this._activeSyncIds) this._activeSyncIds.delete(localItem.id);
                }
              }
            });

            // Pertahankan HANYA aduan lokal yang secara eksplisit _pendingSync (belum terindeks di server)
            // Item tanpa _pendingSync yang tidak ada di server berarti sudah dihapus di server / perangkat lain
            const localPending = (this.aduanList || []).filter(item => {
              if (!item || !item.id) return false;
              const cid = String(item.id).trim().toUpperCase();
              return Boolean(item._pendingSync) && !this.isDeleted(cid) && !seenIds.has(cid);
            });

            this.aduanList = [...uniqueServerItems, ...localPending];
            this._deduplicateList();
            this.save();

            this.lastSyncTime = new Date();
            window.dispatchEvent(new CustomEvent('aduanDataSynced', { detail: { count: this.aduanList.length, silent: silent } }));

            // Otomatis dorong item lokal pending ke server jika ada
            if (localPending.length > 0) {
              setTimeout(() => this.flushPendingQueue(), 500);
            }

            return { success: true, count: this.aduanList.length, remoteCount: validItems.length, message: `Berhasil sinkronisasi ${validItems.length} aduan dari Google Spreadsheet.` };
          } else {
            // Server kosong: jika ada item lokal pending, dorong ke server; jika tidak ada, reset 0
            const localPending = (this.aduanList || []).filter(item => item && item.id && !this.isDeleted(item.id) && item._pendingSync);
            if (localPending.length > 0) {
              this.aduanList = localPending;
              this.save();
              setTimeout(() => this.flushPendingQueue(), 500);
            } else {
              this.aduanList = [];
              this.save();
            }
            this.lastSyncTime = new Date();
            window.dispatchEvent(new CustomEvent('aduanDataSynced', { detail: { count: this.aduanList.length, silent: silent, emptyRemote: true } }));
            return {
              success: true,
              count: this.aduanList.length,
              remoteCount: 0,
              emptyRemote: true,
              message: 'Terhubung ke Google Spreadsheet!'
            };
          }
        }
        return { success: false, reason: 'Format respons tidak valid dari Google Apps Script' };
      } catch (err) {
        console.warn('Sinkronisasi Google Spreadsheet offline/gagal (menggunakan data lokal):', err);
        let errMsg = err.message;
        if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
          errMsg = 'Gagal terhubung. Pastikan Web App disetel "Who has access: Anyone" dan spreadsheet dapat diakses.';
        }
        return { success: false, error: errMsg };
      } finally {
        this.isSyncing = false;
        this.currentSyncPromise = null;
      }
    })();

    return await this.currentSyncPromise;
  }

  async pushPendingVerifications() {
    if (!this.hasGasConfigured()) return 0;
    let pushedCount = 0;
    for (const item of (this.aduanList || [])) {
      if (item && item._pendingOfficerSync && (item.nomorBeritaAcara || item.fotoKondisiRiil || item.catatanBeritaAcara)) {
        try {
          await this.postToGAS('updateVerifikasi', {
            id: item.id,
            status: item.status,
            petugasVerifikasi: item.petugasVerifikasi,
            tanggalVerifikasi: item.tanggalVerifikasi,
            hasilVerifikasi: item.hasilVerifikasi,
            tindakanDLH: item.tindakanDLH,
            tanggalSelesai: item.tanggalSelesai,
            nomorBeritaAcara: item.nomorBeritaAcara,
            catatanBeritaAcara: item.catatanBeritaAcara,
            fotoKondisiRiil: item.fotoKondisiRiil,
            fotoVerifikasiList: item.fotoVerifikasiList,
            timestampVerifikasi: item.timestampVerifikasi,
            timestampTindakLanjut: item.timestampTindakLanjut,
            timestampSelesai: item.timestampSelesai
          });
          delete item._pendingOfficerSync;
          pushedCount++;
        } catch (e) {}
      }
    }
    if (pushedCount > 0) this.save();
    return pushedCount;
  }

  async flushPendingQueue() {
    if (!this.hasGasConfigured() || this._isFlushing) return;
    this._isFlushing = true;
    try {
      this._activeSyncIds = this._activeSyncIds || new Set();
      // 1. Flush aduan baru pending (hindari item yang sedang dalam proses kirim instan)
      const pendingItems = (this.aduanList || []).filter(item => 
        item && item.id && item._pendingSync && !item._syncingNow && !this._activeSyncIds.has(item.id)
      );
      for (const item of pendingItems) {
        try {
          this._activeSyncIds.add(item.id);
          item._syncingNow = true;
          const res = await this.postToGAS('addAduan', item);
          if (res && res.success) {
            delete item._pendingSync;
          }
        } catch (e) {
        } finally {
          delete item._syncingNow;
          this._activeSyncIds.delete(item.id);
        }
      }

      // 2. Flush update verifikasi petugas pending
      await this.pushPendingVerifications();

      this.save();
    } finally {
      this._isFlushing = false;
    }
  }

  async uploadAllLocalToGAS() {
    if (!this.hasGasConfigured()) {
      return { success: false, error: 'URL Google Apps Script belum disetel.' };
    }
    const list = this.getAll();
    if (!list || list.length === 0) {
      return { success: false, error: 'Tidak ada data aduan lokal untuk diunggah.' };
    }

    let successCount = 0;
    for (const item of list) {
      try {
        const res = await this.postToGAS('addAduan', item);
        if (res && res.success) successCount++;
      } catch (e) {
        console.warn('Gagal unggah baris aduan:', item.id, e);
      }
    }

    // Refresh sync setelah unggah selesai
    await this.syncFromGAS(true);
    return { success: true, uploaded: successCount, total: list.length };
  }

  async postToGAS(action, payload) {
    const endpoint = this.getGasUrl();
    if (!endpoint || !endpoint.startsWith('http')) return { success: false, offline: true };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: action, data: payload })
      });
      const data = await response.json();
      return { success: true, response: data };
    } catch (err) {
      console.warn(`Gagal kirim '${action}' ke Google Apps Script:`, err);
      return { success: false, error: err.message };
    }
  }

  _deduplicateList() {
    const seen = new Set();
    const seenBaseIds = new Set();
    const seenContentSigs = new Set();

    this.aduanList = (this.aduanList || []).filter(item => {
      if (!item || !item.id) return false;
      const cid = String(item.id).trim().toUpperCase();
      if (this.isDeleted(cid) || seen.has(cid)) return false;

      // Cek apakah ID memiliki suffix tambahan (seperti ADU-LMB-YYYY-MMDD-XXXX-YYY)
      // dan base ID aslinya sudah tercatat di list
      const baseMatch = cid.match(/^(ADU-LMB-\d{4}-\d{4}-[A-Z0-9]{4})-[A-Z0-9]{3,}$/);
      if (baseMatch) {
        const baseId = baseMatch[1];
        if (seen.has(baseId) || seenBaseIds.has(baseId)) {
          return false; // Buang duplicate ber-suffix
        }
      }

      // Cek signature konten identik (Nama Pelapor + Desa + Uraian)
      const nama = String(item.namaPelapor || '').trim().toLowerCase();
      const desa = String(item.desa || '').trim().toLowerCase();
      const uraian = String(item.uraian || '').trim().toLowerCase();
      if (nama && uraian && uraian.length > 3) {
        const sig = `${nama}|${desa}|${uraian}`;
        if (seenContentSigs.has(sig)) {
          return false; // Buang duplicate konten identik
        }
        seenContentSigs.add(sig);
      }

      seen.add(cid);
      const cleanBase = cid.replace(/-[A-Z0-9]{3,}$/, '');
      if (cleanBase !== cid) seenBaseIds.add(cleanBase);
      return true;
    });
  }

  save() {
    this._deduplicateList();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.aduanList));
  }

  getAll() {
    this._deduplicateList();
    return this.aduanList.filter(item => !this.isDeleted(item.id));
  }

  getById(id) {
    if (!id || this.isDeleted(id)) return null;
    return this.aduanList.find(item => item.id.trim().toLowerCase() === id.trim().toLowerCase()) || null;
  }

  mapRemoteRecord(remoteItem) {
    if (!remoteItem || !remoteItem.id) return null;
    const cleanId = String(remoteItem.id).trim().toUpperCase();

    // Jangan pernah mengembalikan aduan yang sudah dihapus oleh pengguna
    if (this.isDeleted(cleanId)) return null;

    const existing = this.aduanList.find(x => x && x.id && x.id.trim().toUpperCase() === cleanId);

    const rekamTerakhir = remoteItem.rekamTindakanTerakhir || (
      (remoteItem.tindakanDLH && remoteItem.tindakanDLH !== '-') ? {
        waktu: remoteItem.tanggalVerifikasi && remoteItem.tanggalVerifikasi !== '-' ? `${remoteItem.tanggalVerifikasi} 10:00` : (remoteItem.timestamp || '-'),
        petugas: remoteItem.petugasVerifikasi && remoteItem.petugasVerifikasi !== '-' ? remoteItem.petugasVerifikasi : 'Tim Lapangan DLH',
        kategori: remoteItem.status === 'Selesai' ? 'Penyelesaian Kasus' : (remoteItem.status === 'Ditindaklanjuti' || remoteItem.status === 'Dalam Penanganan' ? 'Tindakan Lapangan' : 'Verifikasi Lapangan'),
        status: remoteItem.status || 'Dalam Penanganan',
        tindakan: remoteItem.tindakanDLH,
        hasil: remoteItem.hasilVerifikasi !== '-' ? remoteItem.hasilVerifikasi : '',
        catatan: remoteItem.catatan || ''
      } : null
    );

    const formatDriveUrl = (url) => {
      if (!url || typeof url !== 'string') return '';
      let clean = url.trim();
      if (clean.startsWith('=HYPERLINK')) {
        const m = clean.match(/=HYPERLINK\("([^"]+)"/i);
        if (m) clean = m[1];
      }
      if (clean.startsWith('data:image')) return clean;
      const dMatch = clean.match(/(?:\/file\/d\/|[?&]id=)([a-zA-Z0-9_-]+)/);
      if (dMatch && dMatch[1]) {
        return `https://lh3.googleusercontent.com/d/${dMatch[1]}`;
      }
      return clean;
    };

    const existingPhotos = existing ? (Array.isArray(existing.buktiFotoList) ? existing.buktiFotoList : (existing.fotoBukti ? [existing.fotoBukti] : [])) : [];
    
    let remotePhotos = [];
    if (Array.isArray(remoteItem.buktiFotoList) && remoteItem.buktiFotoList.length > 0) {
      remotePhotos = remoteItem.buktiFotoList;
    } else {
      const rawPhotoStr = (remoteItem.linkFoto && remoteItem.linkFoto !== '-') ? remoteItem.linkFoto : (remoteItem.fotoBukti && remoteItem.fotoBukti !== '-' ? remoteItem.fotoBukti : '');
      if (rawPhotoStr && typeof rawPhotoStr === 'string') {
        const matches = rawPhotoStr.match(/(data:image\/[a-zA-Z0-9\+\/\-\.]+;base64,[A-Za-z0-9\+\/\=]+|https?:\/\/[^\s,]+)/g);
        if (matches && matches.length > 0) {
          remotePhotos = matches;
        } else if (rawPhotoStr.startsWith('data:') || rawPhotoStr.startsWith('http')) {
          remotePhotos = [rawPhotoStr.trim()];
        }
      }
    }

    // Format tautan drive dan pastikan hanya item foto valid yang disertakan
    const validRemote = remotePhotos
      .map(formatDriveUrl)
      .filter(p => typeof p === 'string' && p.trim() && p !== '-' && !p.includes('#ERROR') && !p.includes('Buka') && !p.startsWith('📸'));

    // Penentuan finalPhotos: Pertahankan seluruh multi-foto valid dari remote, lokal, dan cache
    let finalPhotos = [];
    if (validRemote.length > 0) {
      finalPhotos = validRemote.map((remPhoto, idx) => {
        if (remPhoto && remPhoto.startsWith('data:image')) return remPhoto;
        const localBase64 = (existingPhotos[idx] && typeof existingPhotos[idx] === 'string' && existingPhotos[idx].startsWith('data:image'))
          ? existingPhotos[idx]
          : null;
        if (localBase64) return localBase64;
        try {
          const cached = localStorage.getItem('dlh_photo_cache_' + cleanId + '_' + idx) ||
                         localStorage.getItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_' + idx);
          if (cached && cached.startsWith('data:image')) return cached;
        } catch (e) {}
        return remPhoto;
      });

      // Pertahankan multi-foto dari rekaman lokal jika server mengembalikan foto lebih sedikit
      if (existingPhotos.length > finalPhotos.length) {
        for (let k = finalPhotos.length; k < existingPhotos.length; k++) {
          if (existingPhotos[k] && !finalPhotos.includes(existingPhotos[k])) {
            finalPhotos.push(existingPhotos[k]);
          }
        }
      }
      // Periksa juga cache lokal untuk indeks multi-foto (foto 2, 3, dst)
      for (let k = finalPhotos.length; k < 6; k++) {
        try {
          const cached = localStorage.getItem('dlh_photo_cache_' + cleanId + '_' + k) ||
                         localStorage.getItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_' + k);
          if (cached && cached.startsWith('data:image') && !finalPhotos.includes(cached)) {
            finalPhotos.push(cached);
          }
        } catch (e) {}
      }
    } else if (existingPhotos.length > 0) {
      finalPhotos = [...existingPhotos];
    } else {
      for (let k = 0; k < 6; k++) {
        try {
          const cached = localStorage.getItem('dlh_photo_cache_' + cleanId + '_' + k) ||
                         localStorage.getItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_' + k);
          if (cached && cached.startsWith('data:image') && !finalPhotos.includes(cached)) {
            finalPhotos.push(cached);
          }
        } catch (e) {}
      }
    }

    // Perbarui cache lokal untuk index aktif dan bersihkan cache kadaluarsa HANYA di luar jumlah foto aktif
    for (let i = 0; i < finalPhotos.length; i++) {
      if (finalPhotos[i] && finalPhotos[i].startsWith('data:image')) {
        try {
          localStorage.setItem('dlh_photo_cache_' + cleanId + '_' + i, finalPhotos[i]);
        } catch (e) {}
      }
    }
    for (let i = finalPhotos.length; i < 6; i++) {
      try {
        localStorage.removeItem('dlh_photo_cache_' + cleanId + '_' + i);
        localStorage.removeItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_' + i);
      } catch (e) {}
    }

    const finalFoto = finalPhotos[0] || '';

    const isUnverified = (!remoteItem.status || remoteItem.status === 'Baru' || remoteItem.status === 'Aduan Diterima' || remoteItem.status === 'Verifikasi Administrasi' || remoteItem.status === '-');

    // Multi-foto dokumentasi fisik riil petugas
    let resolvedOfficerPhotos = [];
    if (Array.isArray(remoteItem.fotoVerifikasiList) && remoteItem.fotoVerifikasiList.length > 0) {
      remoteItem.fotoVerifikasiList.forEach(p => {
        const s = (p && p.dataUrl) ? p.dataUrl : (typeof p === 'string' ? p : '');
        if (s && s.trim() && s.trim() !== '-' && !resolvedOfficerPhotos.includes(s.trim())) {
          resolvedOfficerPhotos.push(s.trim());
        }
      });
    } else if (remoteItem.fotoKondisiRiil && remoteItem.fotoKondisiRiil !== '-') {
      const rawRiil = String(remoteItem.fotoKondisiRiil).trim();
      const matchesRiil = rawRiil.match(/(data:image\/[a-zA-Z0-9\+\/\-\.]+;base64,[A-Za-z0-9\+\/\=]+|https?:\/\/[^\s,]+)/g);
      if (matchesRiil && matchesRiil.length > 0) {
        matchesRiil.forEach(s => {
          if (s.trim() && !resolvedOfficerPhotos.includes(s.trim())) resolvedOfficerPhotos.push(s.trim());
        });
      } else if (rawRiil) {
        resolvedOfficerPhotos.push(rawRiil);
      }
    }

    // Jika item lokal sebelumnya memiliki foto petugas yang lebih lengkap, pertahankan
    if (existing && Array.isArray(existing.fotoVerifikasiList) && existing.fotoVerifikasiList.length > resolvedOfficerPhotos.length) {
      existing.fotoVerifikasiList.forEach(p => {
        if (p && !resolvedOfficerPhotos.includes(p)) resolvedOfficerPhotos.push(p);
      });
    }

    // Cek cache foto lokal petugas jika ada Base64
    for (let k = 0; k < 6; k++) {
      try {
        const cached = localStorage.getItem('dlh_photo_cache_' + cleanId + '_PETUGAS_' + k) ||
                       localStorage.getItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_PETUGAS_' + k) ||
                       (k === 0 ? localStorage.getItem('dlh_photo_cache_' + cleanId + '_PETUGAS') : null);
        if (cached && cached.startsWith('data:image')) {
          if (k < resolvedOfficerPhotos.length) {
            if (!resolvedOfficerPhotos[k] || !resolvedOfficerPhotos[k].startsWith('http')) {
              resolvedOfficerPhotos[k] = cached;
            }
          } else if (!resolvedOfficerPhotos.includes(cached)) {
            resolvedOfficerPhotos.push(cached);
          }
        }
      } catch (e) {}
    }

    // Simpan / perbarui cache lokal foto petugas yang berupa Base64
    for (let i = 0; i < resolvedOfficerPhotos.length; i++) {
      if (resolvedOfficerPhotos[i] && resolvedOfficerPhotos[i].startsWith('data:image')) {
        try {
          localStorage.setItem('dlh_photo_cache_' + cleanId + '_PETUGAS_' + i, resolvedOfficerPhotos[i]);
          if (i === 0) localStorage.setItem('dlh_photo_cache_' + cleanId + '_PETUGAS', resolvedOfficerPhotos[i]);
        } catch (e) {}
      }
    }

    const finalOfficerPhotos = isUnverified ? [] : resolvedOfficerPhotos;

    const mappedObj = {
      id: cleanId,
      timestamp: remoteItem.timestamp || '-',
      namaPelapor: remoteItem.namaPelapor || 'Masyarakat',
      noHp: remoteItem.noHp || '-',
      alamatPelapor: remoteItem.alamatPelapor || '-',
      kecamatan: remoteItem.kecamatan || 'Nubatukan',
      desa: remoteItem.desa || '-',
      lokasiDetail: remoteItem.lokasiDetail || '-',
      lat: parseFloat(remoteItem.lat || -8.368),
      lng: parseFloat(remoteItem.lng || 123.558),
      jenisPencemaran: remoteItem.jenisPencemaran || 'Lainnya',
      uraian: remoteItem.uraian || '-',
      sumberDugaan: remoteItem.sumberDugaan || '-',
      tanggalKejadian: remoteItem.tanggalKejadian || '-',
      fotoBukti: finalFoto,
      linkFotoBukti: finalFoto,
      buktiFotoList: finalPhotos,
      status: remoteItem.status || 'Baru',
      petugasVerifikasi: isUnverified ? '-' : (remoteItem.petugasVerifikasi || '-'),
      tanggalVerifikasi: isUnverified ? '-' : (remoteItem.tanggalVerifikasi || '-'),
      hasilVerifikasi: isUnverified ? '-' : (remoteItem.hasilVerifikasi || '-'),
      tindakanDLH: isUnverified ? '-' : (remoteItem.tindakanDLH || '-'),
      tanggalSelesai: isUnverified ? '-' : (remoteItem.tanggalSelesai || '-'),
      nomorBeritaAcara: isUnverified ? '' : (remoteItem.nomorBeritaAcara || ''),
      catatanBeritaAcara: isUnverified ? '' : (remoteItem.catatanBeritaAcara || ''),
      fotoKondisiRiil: isUnverified ? '' : (finalOfficerPhotos[0] || ''),
      fotoVerifikasiList: finalOfficerPhotos,
      rekamTindakanTerakhir: rekamTerakhir,
      riwayatTindakan: Array.isArray(remoteItem.riwayatTindakan) ? remoteItem.riwayatTindakan : (rekamTerakhir ? [rekamTerakhir] : [])
    };

    return mappedObj;
  }

  mergeRemoteRecord(remoteItem) {
    const mapped = this.mapRemoteRecord(remoteItem);
    if (!mapped) return null;
    const cleanId = mapped.id;

    const index = this.aduanList.findIndex(x => x.id.trim().toUpperCase() === cleanId);
    if (index !== -1) {
      this.aduanList.splice(index, 1);
    }
    this.aduanList.unshift(mapped);
    this.save();
    return mapped;
  }

  /**
   * Generate Nomor Tiket Unik Bebas Tumpang Tindih
   * Format: ADU-LMB-YYYY-MMDD-XXXX (contoh: ADU-LMB-2026-1017-8K4F)
   * Menjamin keunikan 100% antar perangkat, offline/online, dan bebas tubrukan
   */
  generateNewId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let entropy = '';
    for (let i = 0; i < 4; i++) {
      entropy += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const candidateId = `ADU-LMB-${year}-${month}${day}-${entropy}`;
    const exists = (this.aduanList || []).some(x => x && x.id && x.id.toUpperCase() === candidateId);
    if (exists) {
      const extra = chars.charAt(Math.floor(Math.random() * chars.length));
      return `ADU-LMB-${year}-${month}${day}-${entropy}${extra}`;
    }
    return candidateId;
  }

  resetToOfficialDefaults() {
    this.pendingDeletions = {};
    this.aduanList = [];
    this.save();
    LEGACY_STORAGE_KEYS.forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });
    if (window.dlhRealtime) {
      window.dlhRealtime.broadcast('DATA_RESET', { count: 0 });
    }
    return this.aduanList;
  }

  async resetDatabaseToZero() {
    // 1. Kosongkan memori & penyimpanan lokal (0 aduan)
    this.pendingDeletions = {};
    this.aduanList = [];
    this.save();
    LEGACY_STORAGE_KEYS.forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });

    // 2. Broadcast ke semua tab & perangkat lokal secara instan (0-latency)
    if (window.dlhRealtime) {
      window.dlhRealtime.broadcast('DATA_RESET', { count: 0 });
    }

    // 3. Panggil API Google Apps Script untuk mengosongkan sheet Data_Aduan menjadi 0 baris
    let gasSuccess = false;
    let gasMsg = '';
    if (this.hasGasConfigured()) {
      try {
        const postRes = await this.postToGAS('resetToZero', {});
        if (postRes && postRes.success) {
          gasSuccess = true;
          gasMsg = (postRes.response && postRes.response.message) ? postRes.response.message : 'Spreadsheet berhasil dikosongkan (0 aduan)';
        } else {
          // Fallback via GET
          const getUrl = `${this.gasApiUrl}${this.gasApiUrl.includes('?') ? '&' : '?'}action=resetToZero&_t=${Date.now()}`;
          const getRes = await fetch(getUrl, { method: 'GET', mode: 'cors' });
          const getJson = await getRes.json();
          if (getJson && getJson.success) {
            gasSuccess = true;
            gasMsg = getJson.message;
          }
        }
      } catch (err) {
        console.warn('Gagal reset remote Google Apps Script:', err);
      }
    }

    // 4. Picu event lokal agar tampilan tabel & dashboard langsung kosong 0 aduan
    window.dispatchEvent(new CustomEvent('aduanDataSynced', { detail: { count: 0, silent: false, emptyRemote: true } }));

    return {
      success: true,
      gasSynced: gasSuccess,
      message: gasSuccess ? `Google Spreadsheet dan seluruh portal petugas berhasil dikosongkan (0 aduan). Siap untuk pengujian baru.` : `Data lokal berhasil dikosongkan menjadi 0 aduan.`
    };
  }


  async addAduan(formData) {
    const customId = (formData && formData.id && String(formData.id).trim().toUpperCase().startsWith('ADU-'))
      ? String(formData.id).trim().toUpperCase()
      : null;
    const newId = customId || this.generateNewId();
    const now = new Date();
    const formattedDate = formData.timestamp || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Lookup default lat lng from kecamatan secara presisi tanpa random jitter
    const kecDict = (typeof KECAMATAN_LEMBATA !== 'undefined' ? KECAMATAN_LEMBATA : (window.KECAMATAN_LEMBATA || {}));
    const kecMeta = (formData.kecamatan && kecDict[formData.kecamatan]) ? kecDict[formData.kecamatan] : { lat: -8.375, lng: 123.55 };
    const lat = (formData.lat !== undefined && formData.lat !== '' && !isNaN(parseFloat(formData.lat))) ? parseFloat(formData.lat) : kecMeta.lat;
    const lng = (formData.lng !== undefined && formData.lng !== '' && !isNaN(parseFloat(formData.lng))) ? parseFloat(formData.lng) : kecMeta.lng;

    const existingIndex = this.aduanList.findIndex(x => x.id === newId);
    const existingItem = existingIndex !== -1 ? this.aduanList[existingIndex] : null;

    // Normalisasi daftar foto masuk tanpa merusak Base64
    let incomingPhotos = [];
    if (Array.isArray(formData.buktiFotoList) && formData.buktiFotoList.length > 0) {
      formData.buktiFotoList.forEach(p => {
        const str = (p && p.dataUrl) ? p.dataUrl : (typeof p === 'string' ? p : '');
        if (str && str.trim() && str.trim() !== '-' && !incomingPhotos.includes(str.trim())) {
          incomingPhotos.push(str.trim());
        }
      });
    } else if (formData.fotoBukti && formData.fotoBukti !== '-') {
      const raw = String(formData.fotoBukti).trim();
      const matches = raw.match(/(data:image\/[a-zA-Z0-9\+\/\-\.]+;base64,[A-Za-z0-9\+\/\=]+|https?:\/\/[^\s,]+)/g);
      if (matches && matches.length > 0) {
        matches.forEach(s => {
          const tr = s.trim();
          if (tr && !incomingPhotos.includes(tr)) incomingPhotos.push(tr);
        });
      } else if (raw) {
        incomingPhotos.push(raw);
      }
    }

    const mergedPhotos = incomingPhotos.length > 0
      ? incomingPhotos
      : (existingItem && Array.isArray(existingItem.buktiFotoList) && existingItem.buktiFotoList.length > 0 ? existingItem.buktiFotoList : (existingItem && existingItem.fotoBukti ? [existingItem.fotoBukti] : []));

    const fotoUtama = mergedPhotos[0] || (existingItem ? existingItem.fotoBukti : '') || '';

    // Simpan salinan cadangan foto Base64 ke cache lokal untuk index foto ini
    mergedPhotos.forEach((photoStr, idx) => {
      if (photoStr && typeof photoStr === 'string' && photoStr.startsWith('data:image')) {
        try {
          localStorage.setItem('dlh_photo_cache_' + newId + '_' + idx, photoStr);
        } catch (e) {}
      }
    });
    for (let i = mergedPhotos.length; i < 6; i++) {
      try {
        localStorage.removeItem('dlh_photo_cache_' + newId + '_' + i);
        localStorage.removeItem('dlh_photo_cache_' + newId.toLowerCase() + '_' + i);
      } catch (e) {}
    }

    const newRecord = {
      id: newId,
      timestamp: formattedDate,
      namaPelapor: formData.namaPelapor || (existingItem ? existingItem.namaPelapor : 'Masyarakat (Anonim)'),
      noHp: formData.noHp || (existingItem ? existingItem.noHp : '-'),
      alamatPelapor: formData.alamatPelapor || (existingItem ? existingItem.alamatPelapor : '-'),
      kecamatan: formData.kecamatan || (existingItem ? existingItem.kecamatan : 'Nubatukan'),
      desa: formData.desa || (existingItem ? existingItem.desa : '-'),
      lokasiDetail: formData.lokasiDetail || (existingItem ? existingItem.lokasiDetail : '-'),
      lat: lat,
      lng: lng,
      jenisPencemaran: formData.jenisPencemaran || (existingItem ? existingItem.jenisPencemaran : 'Lainnya'),
      uraian: formData.uraian || (existingItem ? existingItem.uraian : '-'),
      sumberDugaan: formData.sumberDugaan || (existingItem ? existingItem.sumberDugaan : '-'),
      tanggalKejadian: formData.tanggalKejadian || (existingItem ? existingItem.tanggalKejadian : formattedDate.split(' ')[0]),
      status: formData.status || (existingItem ? existingItem.status : 'Aduan Diterima'),
      fotoBukti: fotoUtama,
      linkFotoBukti: mergedPhotos.length > 1 ? mergedPhotos.join(', ') : fotoUtama,
      buktiFotoList: mergedPhotos,
      petugasVerifikasi: formData.petugasVerifikasi || (existingItem ? existingItem.petugasVerifikasi : '-'),
      tanggalVerifikasi: formData.tanggalVerifikasi || (existingItem ? existingItem.tanggalVerifikasi : '-'),
      hasilVerifikasi: formData.hasilVerifikasi || (existingItem ? existingItem.hasilVerifikasi : 'Menunggu penugasan verifikator lapangan.'),
      tindakanDLH: formData.tindakanDLH || (existingItem ? existingItem.tindakanDLH : 'Aduan telah dicatat ke sistem dan siap dijadwalkan verifikasi.'),
      tanggalSelesai: formData.tanggalSelesai || (existingItem ? existingItem.tanggalSelesai : '-'),
      nomorBeritaAcara: formData.nomorBeritaAcara || (existingItem ? existingItem.nomorBeritaAcara : ''),
      catatanBeritaAcara: formData.catatanBeritaAcara || (existingItem ? existingItem.catatanBeritaAcara : ''),
      fotoKondisiRiil: formData.fotoKondisiRiil || (existingItem ? existingItem.fotoKondisiRiil : ''),
      fotoVerifikasiList: formData.fotoVerifikasiList || (existingItem ? existingItem.fotoVerifikasiList : []),
      timestampVerifikasi: formData.timestampVerifikasi || (existingItem ? existingItem.timestampVerifikasi : ''),
      timestampTindakLanjut: formData.timestampTindakLanjut || (existingItem ? existingItem.timestampTindakLanjut : ''),
      timestampSelesai: formData.timestampSelesai || (existingItem ? existingItem.timestampSelesai : ''),
      _pendingSync: true,
      _syncingNow: true
    };

    if (existingIndex !== -1) {
      this.aduanList[existingIndex] = { ...this.aduanList[existingIndex], ...newRecord };
    } else {
      this.aduanList.unshift(newRecord);
    }
    this._deduplicateList();
    this.save();

    // Broadcast Real-Time ke tab/portal petugas secara langsung
    if (window.dlhRealtime) {
      window.dlhRealtime.broadcast('ADUAN_BARU', { id: newRecord.id, item: newRecord });
    }

    // Kirim langsung ke Google Apps Script dan tangani idempotensi tanpa duplikasi antrean
    if (this.hasGasConfigured()) {
      this._activeSyncIds = this._activeSyncIds || new Set();
      this._activeSyncIds.add(newId);

      const sendPromise = this.postToGAS('addAduan', newRecord);

      // Handle penyelesaian network request secara mandiri (terlepas dari batas tunggu UI)
      sendPromise.then(res => {
        const idx = this.aduanList.findIndex(x => x.id === newId);
        if (idx !== -1) {
          delete this.aduanList[idx]._syncingNow;
          if (res && res.success) {
            delete this.aduanList[idx]._pendingSync;
            this.save();
          }
        }
      }).catch(err => {
        console.warn('Gagal sinkron instan ke Google Apps Script, antrean pending aktif:', err);
        const idx = this.aduanList.findIndex(x => x.id === newId);
        if (idx !== -1) {
          delete this.aduanList[idx]._syncingNow;
        }
      }).finally(() => {
        this._activeSyncIds.delete(newId);
      });

      // Tunggu respons dengan batas waktu aman agar animasi submit UI responsif
      try {
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ timeout: true }), 6500));
        await Promise.race([sendPromise, timeoutPromise]);
      } catch (err) {}
    }

    return newRecord;
  }

  updateVerifikasi(id, updateData) {
    const index = this.aduanList.findIndex(item => item.id === id);
    if (index === -1) return false;

    const existing = this.aduanList[index];
    const now = new Date();
    const formattedNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Perhitungan otomatis jejak timestamp akuntabilitas kinerja bulanan DLH
    let timestampVerifikasi = existing.timestampVerifikasi || '';
    if (!timestampVerifikasi && (updateData.tanggalVerifikasi || (updateData.status && updateData.status !== 'Baru' && updateData.status !== 'Aduan Diterima'))) {
      timestampVerifikasi = updateData.tanggalVerifikasi ? `${updateData.tanggalVerifikasi} 09:30` : formattedNow;
    }

    let timestampTindakLanjut = existing.timestampTindakLanjut || '';
    if (!timestampTindakLanjut && (updateData.status === 'Ditindaklanjuti' || updateData.status === 'Dalam Penanganan' || updateData.status === 'Selesai')) {
      timestampTindakLanjut = formattedNow;
    }

    let timestampSelesai = existing.timestampSelesai || '';
    if (updateData.status === 'Selesai' && !timestampSelesai) {
      timestampSelesai = updateData.tanggalSelesai ? `${updateData.tanggalSelesai} 16:30` : formattedNow;
    }

    // Konsolidasi foto kondisi riil hasil verifikasi lapangan
    let fotoList = Array.isArray(updateData.fotoVerifikasiList) && updateData.fotoVerifikasiList.length > 0
      ? updateData.fotoVerifikasiList
      : (existing.fotoVerifikasiList || []);
    if (updateData.fotoKondisiRiil && !fotoList.includes(updateData.fotoKondisiRiil)) {
      fotoList = [updateData.fotoKondisiRiil, ...fotoList];
    }
    const fotoUtama = updateData.fotoKondisiRiil || (fotoList[0] || existing.fotoKondisiRiil || '');

    this.aduanList[index] = {
      ...existing,
      status: updateData.status || existing.status,
      petugasVerifikasi: updateData.petugasVerifikasi || existing.petugasVerifikasi,
      tanggalVerifikasi: updateData.tanggalVerifikasi || existing.tanggalVerifikasi,
      hasilVerifikasi: updateData.hasilVerifikasi || existing.hasilVerifikasi,
      tindakanDLH: updateData.tindakanDLH || existing.tindakanDLH,
      tanggalSelesai: updateData.status === 'Selesai' ? (updateData.tanggalSelesai || new Date().toISOString().split('T')[0]) : existing.tanggalSelesai,
      // Berita Acara & Bukti Foto Fisik Riil
      nomorBeritaAcara: updateData.nomorBeritaAcara !== undefined ? updateData.nomorBeritaAcara : (existing.nomorBeritaAcara || ''),
      catatanBeritaAcara: updateData.catatanBeritaAcara !== undefined ? updateData.catatanBeritaAcara : (existing.catatanBeritaAcara || ''),
      fotoKondisiRiil: fotoUtama,
      fotoVerifikasiList: fotoList,
      // Timestamps akuntabilitas kinerja
      timestampVerifikasi: timestampVerifikasi,
      timestampTindakLanjut: timestampTindakLanjut,
      timestampSelesai: timestampSelesai,
      _pendingOfficerSync: true
    };

    // Simpan salinan cadangan foto Base64 petugas ke cache lokal
    fotoList.forEach((photoStr, idx) => {
      if (photoStr && typeof photoStr === 'string' && photoStr.startsWith('data:image')) {
        try {
          localStorage.setItem('dlh_photo_cache_' + id + '_PETUGAS_' + idx, photoStr);
          if (idx === 0) localStorage.setItem('dlh_photo_cache_' + id + '_PETUGAS', photoStr);
        } catch (e) {}
      }
    });
    for (let i = fotoList.length; i < 6; i++) {
      try {
        localStorage.removeItem('dlh_photo_cache_' + id + '_PETUGAS_' + i);
        localStorage.removeItem('dlh_photo_cache_' + id.toLowerCase() + '_PETUGAS_' + i);
      } catch (e) {}
    }

    this.save();

    // Broadcast Real-Time ke tab/portal warga secara langsung
    if (window.dlhRealtime) {
      window.dlhRealtime.broadcast('TINDAK_LANJUT_UPDATED', { id: id, item: this.aduanList[index], updateData: updateData });
    }

    // Kirim asinkron ke Google Apps Script jika terhubung
    if (this.hasGasConfigured()) {
      this.postToGAS('updateVerifikasi', {
        id: id,
        ...updateData,
        nomorBeritaAcara: this.aduanList[index].nomorBeritaAcara,
        catatanBeritaAcara: this.aduanList[index].catatanBeritaAcara,
        fotoKondisiRiil: this.aduanList[index].fotoKondisiRiil,
        fotoVerifikasiList: this.aduanList[index].fotoVerifikasiList,
        timestampVerifikasi: this.aduanList[index].timestampVerifikasi,
        timestampTindakLanjut: this.aduanList[index].timestampTindakLanjut,
        timestampSelesai: this.aduanList[index].timestampSelesai
      }).then(res => {
        if (res && res.success && this.aduanList[index]) {
          delete this.aduanList[index]._pendingOfficerSync;
          this.save();
        }
      }).catch(() => {});
    }

    return this.aduanList[index];
  }

  deleteAduan(id) {
    if (!id) return false;
    const cleanId = String(id).trim().toUpperCase();

    // 1. Catat ke pendingDeletions (TTL 60 detik) agar sync yang sedang berjalan tidak memunculkan kembali item
    this.markDeleted(cleanId);

    // 2. Hapus dari daftar memori lokal
    const index = this.aduanList.findIndex(item => String(item.id).trim().toUpperCase() === cleanId);
    let deleted = null;
    if (index !== -1) {
      deleted = this.aduanList.splice(index, 1)[0];
    }
    this.aduanList = this.aduanList.filter(item => String(item.id).trim().toUpperCase() !== cleanId);
    this.save();

    // 3. Broadcast Real-Time ke tab / jendela lain
    if (window.dlhRealtime) {
      window.dlhRealtime.broadcast('ADUAN_DELETED', { id: cleanId });
    }

    // 4. Kirim ke Google Apps Script (POST & GET fallback)
    if (this.hasGasConfigured()) {
      this.postToGAS('deleteAduan', { id: cleanId });
      try {
        const getUrl = `${this.gasApiUrl}${this.gasApiUrl.includes('?') ? '&' : '?'}action=deleteAduan&id=${encodeURIComponent(cleanId)}&_t=${Date.now()}`;
        fetch(getUrl, { method: 'GET', mode: 'no-cors' }).catch(() => {});
      } catch (e) {}
    }

    return deleted || true;
  }

  resetToDefault() {
    this.aduanList = [...INITIAL_ADUAN_DATA];
    this.save();
  }

  getStats() {
    this._deduplicateList();
    const cleanList = (this.aduanList || []).filter(item => item && item.id && !this.isDeleted(item.id));
    const total = cleanList.length;
    let aduanDiterima = 0;
    let verifAdmin = 0;
    let menungguVerif = 0;
    let sedangDiverif = 0;
    let dalamPenanganan = 0;
    let selesai = 0;
    let ditolak = 0;

    const perKecamatan = {};
    const perJenis = {};

    cleanList.forEach(item => {
      // By Status
      if (item.status === 'Aduan Diterima') aduanDiterima++;
      else if (item.status === 'Verifikasi Administrasi') verifAdmin++;
      else if (item.status === 'Menunggu Verifikasi Lapangan') menungguVerif++;
      else if (item.status === 'Sedang Diverifikasi') sedangDiverif++;
      else if (item.status === 'Dalam Penanganan') dalamPenanganan++;
      else if (item.status === 'Selesai') selesai++;
      else if (item.status === 'Ditolak') ditolak++;
      // Backward compat: map old status names
      else if (item.status === 'Baru') aduanDiterima++;
      else if (item.status === 'Diverifikasi') sedangDiverif++;
      else if (item.status === 'Ditindaklanjuti') dalamPenanganan++;

      // By Kecamatan
      perKecamatan[item.kecamatan] = (perKecamatan[item.kecamatan] || 0) + 1;

      // By Jenis
      perJenis[item.jenisPencemaran] = (perJenis[item.jenisPencemaran] || 0) + 1;
    });

    const baru = aduanDiterima; // alias for KPI
    const dalamProses = verifAdmin + menungguVerif + sedangDiverif + dalamPenanganan;
    const tingkatPenyelesaian = total > 0 ? Math.round(((selesai + ditolak) / total) * 100) : 0;

    return {
      total,
      baru,
      aduanDiterima,
      verifAdmin,
      menungguVerif,
      sedangDiverif,
      dalamPenanganan,
      diverifikasi: sedangDiverif,
      ditindak: dalamPenanganan,
      selesai,
      ditolak,
      dalamProses,
      tingkatPenyelesaian,
      perKecamatan,
      perJenis
    };
  }

  exportToCSV() {
    // Header kolom resmi yang persis sama dengan Google Spreadsheet DLH Lembata
    const headers = [
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
      'Catatan_Berita_Acara'
    ];

    // Helper sanitasi sel CSV agar rapi dan tidak merusak baris di Excel / Google Sheets
    const cleanCell = (val, isPhone = false) => {
      if (val === null || val === undefined) return '""';
      let str = String(val).trim();
      if (isPhone && str && str !== '-') {
        // Format teks khusus nomor HP agar angka 0 di depan tidak hilang saat dibuka di Excel
        return `="${str}"`;
      }
      // Ganti enter / baris baru internal dengan spasi agar tidak membuat baris tabel berantakan
      str = str.replace(/[\r\n]+/g, ' ').trim();
      // Escape tanda petik ganda
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = this.aduanList.map(item => [
      cleanCell(item.id),
      cleanCell(item.timestamp),
      cleanCell(item.namaPelapor),
      cleanCell(item.noHp, true),
      cleanCell(item.alamatPelapor || '-'),
      cleanCell(item.kecamatan),
      cleanCell(item.desa),
      cleanCell(item.lokasiDetail || '-'),
      cleanCell(item.lat !== undefined ? item.lat : ''),
      cleanCell(item.lng !== undefined ? item.lng : ''),
      cleanCell(item.jenisPencemaran),
      cleanCell(item.uraian || '-'),
      cleanCell(item.sumberDugaan || '-'),
      cleanCell(item.tanggalKejadian || '-'),
      cleanCell(item.linkFotoBukti || item.fotoBukti || '-'),
      cleanCell(item.status || 'Baru'),
      cleanCell(item.petugasVerifikasi || '-'),
      cleanCell(item.tanggalVerifikasi || '-'),
      cleanCell(item.hasilVerifikasi || '-'),
      cleanCell(item.tindakanDLH || '-'),
      cleanCell(item.tanggalSelesai || '-'),
      cleanCell(item.nomorBeritaAcara || '-'),
      cleanCell(item.catatanBeritaAcara || '-')
    ]);

    // Tambahkan UTF-8 Byte Order Mark (\uFEFF) untuk kompatibilitas penuh Excel & Google Sheets
    const csvContent = '\uFEFF' + [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(r => r.join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `Rekap_Resmi_Aduan_DLH_Lembata_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Global instance & prototype safeguards
AduanDataStore.prototype.mapRemoteRecord = function(remoteItem) {
  return mapRemoteAduanRecord(remoteItem, this.aduanList, (id) => this.isDeleted(id));
};
window.mapRemoteAduanRecord = mapRemoteAduanRecord;
window.AduanDataStore = AduanDataStore;
window.aduanStore = new AduanDataStore();

/**
 * Global Self-Healing Handler untuk kegagalan load gambar foto bukti
 * Mencari cadangan thumbnail Drive, local cache Base64, dan fetch async dari GAS
 */
window.handleAduanPhotoError = function(imgEl, aduanId, photoIdx) {
  if (!imgEl) return;
  const cleanId = String(aduanId || '').trim().toUpperCase();
  const idx = parseInt(photoIdx || '0', 10) || 0;

  // 1. Cek cache lokal segera (paling cepat dan pasti jernih)
  try {
    const cached = localStorage.getItem('dlh_photo_cache_' + cleanId + '_' + idx) ||
                   localStorage.getItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_' + idx) ||
                   (idx === 0 ? (localStorage.getItem('dlh_photo_cache_' + cleanId) || localStorage.getItem('dlh_photo_cache_' + cleanId.toLowerCase())) : null);
    if (cached && cached.startsWith('data:image')) {
      imgEl.src = cached;
      imgEl.style.display = 'block';
      if (imgEl.nextElementSibling) imgEl.nextElementSibling.style.display = 'none';
      return;
    }
  } catch(e) {}

  // 2. Coba alternatif Google Drive URL tanpa referrer jika ada fileId terdeteksi
  const orig = imgEl.dataset.original || imgEl.src || '';
  const m = orig.match(/(?:\/file\/d\/|[?&]id=|\/d\/)([a-zA-Z0-9_-]+)/);

  if (m && m[1]) {
    if (!imgEl.dataset.retryStep) {
      imgEl.dataset.retryStep = '1';
      imgEl.referrerPolicy = 'no-referrer';
      imgEl.src = 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1200';
      return;
    } else if (imgEl.dataset.retryStep === '1') {
      imgEl.dataset.retryStep = '2';
      imgEl.referrerPolicy = 'no-referrer';
      imgEl.src = 'https://drive.google.com/uc?export=view&id=' + m[1];
      return;
    }
  }

  // 3. Tampilkan visual loading ringan berputar sementara mencari data Base64
  const fallbackBox = imgEl.nextElementSibling;
  if (fallbackBox && !imgEl.dataset.fetchingFromGAS) {
    fallbackBox.style.display = 'flex';
    fallbackBox.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px;">
        <span style="display:inline-block; width:22px; height:22px; border:2.5px solid rgba(110,231,183,0.3); border-top-color:#34d399; border-radius:50%; animation:spin 0.8s linear infinite;"></span>
        <span style="font-size:0.74rem; color:#6ee7b7; font-weight:700;">Memulihkan Foto...</span>
      </div>
    `;
  }

  // 4. Fetch dari Google Apps Script secara asynchronous
  if (!imgEl.dataset.fetchingFromGAS && window.aduanStore && typeof window.aduanStore.fetchPhotoBase64FromGAS === 'function') {
    imgEl.dataset.fetchingFromGAS = '1';
    window.aduanStore.fetchPhotoBase64FromGAS(cleanId, idx).then(b64 => {
      if (b64 && b64.startsWith('data:image')) {
        imgEl.src = b64;
        imgEl.style.display = 'block';
        if (fallbackBox) fallbackBox.style.display = 'none';
      } else {
        imgEl.style.display = 'none';
        if (fallbackBox) {
          fallbackBox.style.display = 'flex';
          const gasUrl = (window.aduanStore && window.aduanStore.getGasUrl) ? window.aduanStore.getGasUrl() : '';
          const directUrl = gasUrl ? `${gasUrl}${gasUrl.includes('?') ? '&' : '?'}action=viewFoto&id=${encodeURIComponent(cleanId)}&photoIdx=${idx}` : '';
          fallbackBox.innerHTML = `
            <span style="font-size: 1.4rem;">📸</span>
            <span style="font-size: 0.74rem; font-weight: 700; color: #34d399; margin-top: 4px;">Buka Foto di Drive</span>
            ${directUrl ? `<a href="${directUrl}" target="_blank" style="font-size:0.68rem; color:#a7f3d0; text-decoration:underline; margin-top:2px;">Buka Tab Baru ↗</a>` : ''}
          `;
        }
      }
    }).catch(() => {
      imgEl.style.display = 'none';
      if (fallbackBox) {
        fallbackBox.style.display = 'flex';
        fallbackBox.innerHTML = '<span style="font-size: 1.4rem;">📸</span><span style="font-size: 0.74rem; font-weight: 700; color: #34d399; margin-top: 4px;">Buka di Google Drive</span>';
      }
    });
    return;
  }

  imgEl.style.display = 'none';
  if (fallbackBox) {
    fallbackBox.style.display = 'flex';
    fallbackBox.innerHTML = '<span style="font-size: 1.4rem;">📸</span><span style="font-size: 0.74rem; font-weight: 700; color: #34d399; margin-top: 4px;">Buka di Google Drive</span>';
  }
};

