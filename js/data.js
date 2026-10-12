/**
 * SISTEM PENDATAAN DIGITAL ADUAN PENCEMARAN LINGKUNGAN
 * DINAS LINGKUNGAN HIDUP KABUPATEN LEMBATA
 * Data Store, Default Dataset & LocalStorage Management
 */

const STORAGE_KEY = 'dlh_lembata_aduan_v3';
const LEGACY_STORAGE_KEYS = ['dlh_lembata_aduan_v1', 'dlh_lembata_aduan_v2', 'dlh_deleted_aduan_ids', 'dlh_cleaned_v2'];

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

// Data Awal Aduan Riil Terverifikasi (Sinkron dengan Database Cloud DLH Lembata)
const INITIAL_ADUAN_DATA = [
  {
    id: 'ADU-LMB-2026-001',
    timestamp: '12/10/2026 04:15',
    namaPelapor: 'Carlos Matarau',
    noHp: '08555699888',
    alamatPelapor: 'Abbaa',
    kecamatan: 'Ile Ape',
    desa: 'Muruona',
    lokasiDetail: 'Hhh',
    lat: -8.329127,
    lng: 123.474487,
    jenisPencemaran: 'Kerusakan Lingkungan & Tanah',
    uraian: 'Babab',
    sumberDugaan: 'Bbabbab',
    tanggalKejadian: '01/10/2026',
    fotoBukti: '',
    linkFotoBukti: '',
    buktiFotoList: [],
    status: 'Sedang Diverifikasi',
    petugasVerifikasi: 'Tim Lapangan DLH',
    tanggalVerifikasi: '12/10/2026',
    hasilVerifikasi: 'Sedang dalam penanganan verifikasi lapangan',
    tindakanDLH: 'Verifikasi lapangan telah dijadwalkan oleh Tim Pengawas DLH Lembata.',
    tanggalSelesai: '-'
  }
];

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
  const remotePhotos = Array.isArray(remoteItem.buktiFotoList) && remoteItem.buktiFotoList.length > 0
    ? remoteItem.buktiFotoList
    : (remoteItem.linkFoto && remoteItem.linkFoto !== '-' ? [remoteItem.linkFoto] : (remoteItem.fotoBukti && remoteItem.fotoBukti !== '-' ? [remoteItem.fotoBukti] : []));

  let finalPhotos = [];
  if (existingPhotos.length > 0 && existingPhotos.some(p => typeof p === 'string' && (p.startsWith('data:image') || p.startsWith('http')))) {
    finalPhotos = existingPhotos;
  } else if (remotePhotos.length > 0 && remotePhotos.some(p => typeof p === 'string' && p.trim() && p !== '-')) {
    finalPhotos = remotePhotos;
  } else {
    finalPhotos = existingPhotos;
  }
  const finalFoto = finalPhotos[0] || '';

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
    petugasVerifikasi: remoteItem.petugasVerifikasi || '-',
    tanggalVerifikasi: remoteItem.tanggalVerifikasi || '-',
    hasilVerifikasi: remoteItem.hasilVerifikasi || '-',
    tindakanDLH: remoteItem.tindakanDLH || '-',
    tanggalSelesai: remoteItem.tanggalSelesai || '-',
    nomorBeritaAcara: remoteItem.nomorBeritaAcara || (existing ? existing.nomorBeritaAcara : '') || '',
    catatanBeritaAcara: remoteItem.catatanBeritaAcara || (existing ? existing.catatanBeritaAcara : '') || '',
    fotoKondisiRiil: remoteItem.fotoKondisiRiil || (existing ? existing.fotoKondisiRiil : '') || '',
    fotoVerifikasiList: Array.isArray(remoteItem.fotoVerifikasiList) ? remoteItem.fotoVerifikasiList : (existing && existing.fotoVerifikasiList ? existing.fotoVerifikasiList : []),
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
    this.deletedIds = this.loadDeletedIds();
    this.init();
  }

  loadDeletedIds() {
    try {
      const raw = localStorage.getItem(DELETED_STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw).map(id => String(id).trim().toUpperCase())) : new Set();
    } catch (e) {
      return new Set();
    }
  }

  saveDeletedIds() {
    try {
      localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify([...this.deletedIds]));
    } catch (e) {}
  }

  isDeleted(id) {
    if (!id) return false;
    return this.deletedIds.has(String(id).trim().toUpperCase());
  }

  init() {
    // 1. Bersihkan seluruh penyimpanan lokal usang & cache sebelumnya
    LEGACY_STORAGE_KEYS.forEach(key => {
      try { localStorage.removeItem(key); } catch (e) {}
    });

    this.deletedIds = this.loadDeletedIds();
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.aduanList = Array.isArray(parsed) ? parsed.filter(item => item && item.id && !this.isDeleted(item.id)) : [];
      } catch (e) {
        this.aduanList = [...INITIAL_ADUAN_DATA];
      }
    } else {
      this.aduanList = [...INITIAL_ADUAN_DATA];
    }
    this.save();

    // Jika URL Google Apps Script sudah disetel, lakukan sinkronisasi otomatis
    if (this.hasGasConfigured() && !this._pollIntervalStarted) {
      this._pollIntervalStarted = true;
      setTimeout(() => this.syncFromGAS(true), 300);
      setInterval(() => this.syncFromGAS(true), 15000);
    }
  }

  hasGasConfigured() {
    const url = this.getGasUrl();
    return !!(url && url.trim().startsWith('http'));
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
            // Sinkronkan seluruh data dari Google Apps Script sebagai Single Source of Truth
            const validItems = json.data.filter(item => !this.isDeleted(item.id));
            const mapFn = typeof this.mapRemoteRecord === 'function'
              ? (item) => this.mapRemoteRecord(item)
              : (item) => mapRemoteAduanRecord(item, this.aduanList, (id) => this.isDeleted(id));
            this.aduanList = validItems.map(mapFn).filter(Boolean);
            this.save();

            this.lastSyncTime = new Date();
            window.dispatchEvent(new CustomEvent('aduanDataSynced', { detail: { count: this.aduanList.length, silent: silent } }));
            return { success: true, count: this.aduanList.length, remoteCount: validItems.length, message: `Berhasil sinkronisasi ${validItems.length} aduan dari Google Spreadsheet.` };
          } else {
            // Spreadsheet kosong (0 data aduan) -> Jadikan data lokal di HP & Laptop juga 0 aduan (Satu Kesatuan Data)
            this.aduanList = [];
            this.save();
            this.lastSyncTime = new Date();
            window.dispatchEvent(new CustomEvent('aduanDataSynced', { detail: { count: 0, silent: silent, emptyRemote: true } }));
            return {
              success: true,
              count: 0,
              remoteCount: 0,
              emptyRemote: true,
              message: 'Terhubung ke Google Spreadsheet! Database kosong (0 aduan). Sistem siap pengujian baru.'
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
      if (item && (item.nomorBeritaAcara || item.fotoKondisiRiil || item.catatanBeritaAcara)) {
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
            timestampVerifikasi: item.timestampVerifikasi,
            timestampTindakLanjut: item.timestampTindakLanjut,
            timestampSelesai: item.timestampSelesai
          });
          pushedCount++;
        } catch (e) {}
      }
    }
    return pushedCount;
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

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.aduanList));
  }

  getAll() {
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

    const existingPhotos = existing ? (Array.isArray(existing.buktiFotoList) ? existing.buktiFotoList : (existing.fotoBukti ? [existing.fotoBukti] : [])) : [];
    const remotePhotos = Array.isArray(remoteItem.buktiFotoList) && remoteItem.buktiFotoList.length > 0
      ? remoteItem.buktiFotoList
      : (remoteItem.linkFoto && remoteItem.linkFoto !== '-' ? [remoteItem.linkFoto] : (remoteItem.fotoBukti && remoteItem.fotoBukti !== '-' ? [remoteItem.fotoBukti] : []));

    // Jika record lokal sudah memiliki foto valid (termasuk Data URL base64), jangan ditimpa dengan remote kosong
    let finalPhotos = [];
    if (existingPhotos.length > 0 && existingPhotos.some(p => typeof p === 'string' && (p.startsWith('data:image') || p.startsWith('http')))) {
      finalPhotos = existingPhotos;
    } else if (remotePhotos.length > 0 && remotePhotos.some(p => typeof p === 'string' && p.trim() && p !== '-')) {
      finalPhotos = remotePhotos;
    } else {
      finalPhotos = existingPhotos;
    }
    const finalFoto = finalPhotos[0] || '';

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
      petugasVerifikasi: remoteItem.petugasVerifikasi || '-',
      tanggalVerifikasi: remoteItem.tanggalVerifikasi || '-',
      hasilVerifikasi: remoteItem.hasilVerifikasi || '-',
      tindakanDLH: remoteItem.tindakanDLH || '-',
      tanggalSelesai: remoteItem.tanggalSelesai || '-',
      nomorBeritaAcara: remoteItem.nomorBeritaAcara || (existing ? existing.nomorBeritaAcara : '') || '',
      catatanBeritaAcara: remoteItem.catatanBeritaAcara || (existing ? existing.catatanBeritaAcara : '') || '',
      fotoKondisiRiil: remoteItem.fotoKondisiRiil || (existing ? existing.fotoKondisiRiil : '') || '',
      fotoVerifikasiList: (Array.isArray(remoteItem.fotoVerifikasiList) && remoteItem.fotoVerifikasiList.length > 0)
        ? remoteItem.fotoVerifikasiList
        : (existing && existing.fotoVerifikasiList ? existing.fotoVerifikasiList : (remoteItem.fotoKondisiRiil ? [remoteItem.fotoKondisiRiil] : [])),
      rekamTindakanTerakhir: rekamTerakhir,
      riwayatTindakan: Array.isArray(remoteItem.riwayatTindakan) ? remoteItem.riwayatTindakan : (rekamTerakhir ? [rekamTerakhir] : [])
    };

    // Auto-Sync: Jika perangkat ini (misal HP) memiliki BAST / Foto Riil lokal yang belum tercatat di spreadsheet remote,
    // otomatis unggah ke Google Apps Script agar PC/Web dan semua perangkat lain langsung sinkron identik!
    if (existing && (existing.nomorBeritaAcara || existing.fotoKondisiRiil || existing.catatanBeritaAcara) && (!remoteItem.nomorBeritaAcara && !remoteItem.fotoKondisiRiil)) {
      setTimeout(() => {
        try {
          this.postToGAS('updateVerifikasi', {
            id: cleanId,
            status: existing.status,
            petugasVerifikasi: existing.petugasVerifikasi,
            tanggalVerifikasi: existing.tanggalVerifikasi,
            hasilVerifikasi: existing.hasilVerifikasi,
            tindakanDLH: existing.tindakanDLH,
            tanggalSelesai: existing.tanggalSelesai,
            nomorBeritaAcara: existing.nomorBeritaAcara,
            catatanBeritaAcara: existing.catatanBeritaAcara,
            fotoKondisiRiil: existing.fotoKondisiRiil,
            timestampVerifikasi: existing.timestampVerifikasi,
            timestampTindakLanjut: existing.timestampTindakLanjut,
            timestampSelesai: existing.timestampSelesai
          });
        } catch (e) {}
      }, 500);
    }

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

  generateNewId() {
    const year = new Date().getFullYear();
    let maxSeq = 0;
    (this.aduanList || []).forEach(item => {
      if (item && item.id) {
        const match = String(item.id).trim().match(new RegExp(`^ADU-LMB-${year}-(\\d+)$`, 'i'));
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    });
    const nextNum = maxSeq + 1;
    const padded = String(nextNum).padStart(3, '0');
    return `ADU-LMB-${year}-${padded}`;
  }

  resetToOfficialDefaults() {
    this.deletedIds = new Set();
    this.saveDeletedIds();
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
    this.deletedIds = new Set();
    this.saveDeletedIds();
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


  addAduan(formData) {
    const customId = (formData && formData.id && String(formData.id).trim().toUpperCase().startsWith('ADU-'))
      ? String(formData.id).trim().toUpperCase()
      : null;
    const newId = customId || this.generateNewId();
    const now = new Date();
    const formattedDate = formData.timestamp || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Lookup default lat lng from kecamatan if not provided
    const kecDict = (typeof KECAMATAN_LEMBATA !== 'undefined' ? KECAMATAN_LEMBATA : (window.KECAMATAN_LEMBATA || {}));
    const kecMeta = (formData.kecamatan && kecDict[formData.kecamatan]) ? kecDict[formData.kecamatan] : { lat: -8.375, lng: 123.55 };
    const lat = (formData.lat !== undefined && formData.lat !== '' && !isNaN(parseFloat(formData.lat))) ? parseFloat(formData.lat) : (kecMeta.lat + (Math.random() - 0.5) * 0.02);
    const lng = (formData.lng !== undefined && formData.lng !== '' && !isNaN(parseFloat(formData.lng))) ? parseFloat(formData.lng) : (kecMeta.lng + (Math.random() - 0.5) * 0.02);

    const newRecord = {
      id: newId,
      timestamp: formattedDate,
      namaPelapor: formData.namaPelapor || 'Masyarakat (Anonim)',
      noHp: formData.noHp || '-',
      alamatPelapor: formData.alamatPelapor || '-',
      kecamatan: formData.kecamatan || 'Nubatukan',
      desa: formData.desa || '-',
      lokasiDetail: formData.lokasiDetail || '-',
      lat: lat,
      lng: lng,
      jenisPencemaran: formData.jenisPencemaran || 'Lainnya',
      uraian: formData.uraian || '-',
      sumberDugaan: formData.sumberDugaan || '-',
      tanggalKejadian: formData.tanggalKejadian || formattedDate.split(' ')[0],
      status: formData.status || 'Aduan Diterima',
      fotoBukti: formData.fotoBukti || '',
      linkFotoBukti: formData.linkFotoBukti || formData.fotoBukti || '',
      buktiFotoList: Array.isArray(formData.buktiFotoList) ? formData.buktiFotoList : (formData.fotoBukti ? [formData.fotoBukti] : []),
      petugasVerifikasi: formData.petugasVerifikasi || '-',
      tanggalVerifikasi: formData.tanggalVerifikasi || '-',
      hasilVerifikasi: formData.hasilVerifikasi || 'Menunggu penugasan verifikator lapangan.',
      tindakanDLH: formData.tindakanDLH || 'Aduan telah dicatat ke sistem dan siap dijadwalkan verifikasi.',
      tanggalSelesai: formData.tanggalSelesai || '-',
      nomorBeritaAcara: formData.nomorBeritaAcara || '',
      catatanBeritaAcara: formData.catatanBeritaAcara || '',
      fotoKondisiRiil: formData.fotoKondisiRiil || '',
      fotoVerifikasiList: formData.fotoVerifikasiList || [],
      timestampVerifikasi: formData.timestampVerifikasi || '',
      timestampTindakLanjut: formData.timestampTindakLanjut || '',
      timestampSelesai: formData.timestampSelesai || ''
    };

    const existingIndex = this.aduanList.findIndex(x => x.id === newId);
    if (existingIndex !== -1) {
      this.aduanList[existingIndex] = { ...this.aduanList[existingIndex], ...newRecord };
    } else {
      this.aduanList.unshift(newRecord);
    }
    this.save();

    // Broadcast Real-Time ke tab/portal petugas secara langsung
    if (window.dlhRealtime) {
      window.dlhRealtime.broadcast('ADUAN_BARU', { id: newRecord.id, item: newRecord });
    }

    // Kirim asinkron ke Google Apps Script jika terhubung
    if (this.hasGasConfigured()) {
      this.postToGAS('addAduan', newRecord);
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
      timestampSelesai: timestampSelesai
    };

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
        timestampVerifikasi: this.aduanList[index].timestampVerifikasi,
        timestampSelesai: this.aduanList[index].timestampSelesai
      });
    }

    return this.aduanList[index];
  }

  deleteAduan(id) {
    if (!id) return false;
    const cleanId = String(id).trim().toUpperCase();

    // 1. Catat ke blacklist permanen agar tidak pernah dipulihkan lagi oleh sync berkala
    this.deletedIds.add(cleanId);
    this.saveDeletedIds();

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
    const total = this.aduanList.length;
    let aduanDiterima = 0;
    let verifAdmin = 0;
    let menungguVerif = 0;
    let sedangDiverif = 0;
    let dalamPenanganan = 0;
    let selesai = 0;
    let ditolak = 0;

    const perKecamatan = {};
    const perJenis = {};

    this.aduanList.forEach(item => {
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
