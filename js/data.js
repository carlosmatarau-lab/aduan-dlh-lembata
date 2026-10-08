/**
 * SISTEM PENDATAAN DIGITAL ADUAN PENCEMARAN LINGKUNGAN
 * DINAS LINGKUNGAN HIDUP KABUPATEN LEMBATA
 * Data Store, Default Dataset & LocalStorage Management
 */

const STORAGE_KEY = 'dlh_lembata_aduan_v1';

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

// Data Awal Aduan Realistis Kabupaten Lembata
const INITIAL_ADUAN_DATA = [
  {
    id: 'ADU-LMB-2026-001',
    timestamp: '2026-09-12 09:15',
    namaPelapor: 'Fransiskus Kedang',
    noHp: '081234567890',
    alamatPelapor: 'Kel. Selandoro, Nubatukan',
    kecamatan: 'Nubatukan',
    desa: 'Lewoleba Tengah',
    lokasiDetail: 'Pesisir Dermaga Jeti Rakyat Lewoleba',
    lat: -8.3615,
    lng: 123.5512,
    jenisPencemaran: 'Laut & Pesisir',
    uraian: 'Terdapat ceceran oli bekas dan limbah bahan bakar kapal motor yang mengapung di air laut sekitar dermaga rakyat. Air laut berwarna kehitaman dan berbau menyengat.',
    sumberDugaan: 'Aktivitas bengkel perahu & kapal motor nelayan',
    tanggalKejadian: '2026-09-11',
    status: 'Selesai',
    petugasVerifikasi: 'Yohanes B. (Pengendali Dampak Lingkungan)',
    tanggalVerifikasi: '2026-09-13',
    hasilVerifikasi: 'Terbukti ada ceceran oli sekitar 15 m² dekat tambatan kapal.',
    tindakanDLH: 'Pembersihan tumpahan oli dengan absorbent pad, serta pembinaan dan surat teguran kepada pengelola kapal tambat.',
    tanggalSelesai: '2026-09-16'
  },
  {
    id: 'ADU-LMB-2026-002',
    timestamp: '2026-09-18 14:30',
    namaPelapor: 'Theresia Purek',
    noHp: '082198765432',
    alamatPelapor: 'Desa Hadakewa, Lebatukan',
    kecamatan: 'Lebatukan',
    desa: 'Hadakewa',
    lokasiDetail: 'Jalan poros dekat area pantai belakang pasar ikan',
    lat: -8.3580,
    lng: 123.6650,
    jenisPencemaran: 'Sampah Ilegal & Bau',
    uraian: 'Penumpukan sampah sisa ikan dan limbah plastik yang dibuang liar di semak pinggir pantai, menimbulkan bau busuk dan lalat banyak hingga ke permukiman warga.',
    sumberDugaan: 'Pedagang liar & oknum warga sekitar pasar',
    tanggalKejadian: '2026-09-17',
    status: 'Selesai',
    petugasVerifikasi: 'Agustinus L. (Staf Kebersihan DLH)',
    tanggalVerifikasi: '2026-09-19',
    hasilVerifikasi: 'Timbunan sampah liar volume ~2 m³ membusuk.',
    tindakanDLH: 'Pengangkutan seluruh sampah dengan armada truk sampah DLH dan pemasangan plang larangan buang sampah berkoordinasi dengan Pemdes Hadakewa.',
    tanggalSelesai: '2026-09-21'
  },
  {
    id: 'ADU-LMB-2026-003',
    timestamp: '2026-09-25 11:20',
    namaPelapor: 'Petrus Laba',
    noHp: '085233445566',
    alamatPelapor: 'Desa Waipukang, Ile Ape',
    kecamatan: 'Ile Ape',
    desa: 'Waipukang',
    lokasiDetail: 'Lembah lereng dekat jalan usaha tani',
    lat: -8.2830,
    lng: 123.5410,
    jenisPencemaran: 'Udara & Asap',
    uraian: 'Pembakaran ban bekas dan tumpukan material kabel setiap sore hari untuk mengambil kawat tembaga. Asap hitam pekat mengganggu pernapasan warga dan anak sekolah.',
    sumberDugaan: 'Aktivitas pengumpul rongsokan / besi tua liar',
    tanggalKejadian: '2026-09-24',
    status: 'Dalam Penanganan',
    petugasVerifikasi: 'Maria E. Karangora (PPNS Lingkungan Hidup)',
    tanggalVerifikasi: '2026-09-27',
    hasilVerifikasi: 'Ditemukan sisa abu pembakaran ban dan kabel tembaga.',
    tindakanDLH: 'Pemberian Surat Peringatan ke-1 kepada pelaku usaha rongsokan dan pelarangan aktivitas pembakaran terbuka (open burning). Sedang dalam masa pengawasan 14 hari.',
    tanggalSelesai: '-'
  },
  {
    id: 'ADU-LMB-2026-004',
    timestamp: '2026-10-01 08:45',
    namaPelapor: 'Kornelis Making',
    noHp: '081377889900',
    alamatPelapor: 'Desa Kalikasa, Atadei',
    kecamatan: 'Atadei',
    desa: 'Kalikasa',
    lokasiDetail: 'Aliran anak sungai Wai Henga',
    lat: -8.4555,
    lng: 123.5685,
    jenisPencemaran: 'Pencemaran Air',
    uraian: 'Air sungai yang biasa dipakai warga untuk cuci dan ternak terlihat keruh pekat berwarna keputihan dan berbau belerang tak wajar sejak pekerjaan saluran air.',
    sumberDugaan: 'Material proyek galian yang dibuang langsung ke sungai',
    tanggalKejadian: '2026-09-30',
    status: 'Sedang Diverifikasi',
    petugasVerifikasi: 'Ir. Damianus T. (Kabid Penataan DLH)',
    tanggalVerifikasi: '2026-10-03',
    hasilVerifikasi: 'Sampel air telah diambil untuk uji parameter kekeruhan (TDS & TSS). Terindikasi sedimentasi akibat erosi galian.',
    tindakanDLH: 'Menyusun rekomendasi teknis pembuatan settling pond (kolam endap) kepada pihak pelaksana proyek.',
    tanggalSelesai: '-'
  },
  {
    id: 'ADU-LMB-2026-005',
    timestamp: '2026-10-03 16:10',
    namaPelapor: 'Siti Aminah',
    noHp: '082233441122',
    alamatPelapor: 'Desa Balauring, Omesuri',
    kecamatan: 'Omesuri',
    desa: 'Balauring',
    lokasiDetail: 'Kawasan mangrove muara teluk Balauring',
    lat: -8.2355,
    lng: 123.8220,
    jenisPencemaran: 'Limbah B3 & Plastik',
    uraian: 'Ditemukan drum bekas cairan kimia/aki bekas dan tumpukan oli yang dibuang sembarangan di antara vegetasi bakau tepi muara.',
    sumberDugaan: 'Bengkel aki liar / penampung limbah tanpa izin',
    tanggalKejadian: '2026-10-02',
    status: 'Aduan Diterima',
    petugasVerifikasi: '-',
    tanggalVerifikasi: '-',
    hasilVerifikasi: 'Menunggu penugasan tim verifikasi lapangan ke Omesuri',
    tindakanDLH: 'Jadwal verifikasi lapangan direncanakan minggu ini bersama Babinsa setempat.',
    tanggalSelesai: '-'
  },
  {
    id: 'ADU-LMB-2026-006',
    timestamp: '2026-10-04 10:00',
    namaPelapor: 'Yosefina Lipat',
    noHp: '081266778899',
    alamatPelapor: 'Desa Wairiang, Buyasuri',
    kecamatan: 'Buyasuri',
    desa: 'Wairiang',
    lokasiDetail: 'Pesisir pantai desa Wairiang',
    lat: -8.1920,
    lng: 123.9455,
    jenisPencemaran: 'Laut & Pesisir',
    uraian: 'Sampah kiriman plastik kemasan dan tali jaring hanyut memenuhi garis pantai hingga 200 meter, mengancam lokasi penjemuran rumput laut.',
    sumberDugaan: 'Arus laut sampah musiman & perahu nelayan melintas',
    tanggalKejadian: '2026-10-03',
    status: 'Aduan Diterima',
    petugasVerifikasi: '-',
    tanggalVerifikasi: '-',
    hasilVerifikasi: 'Aduan masuk, koordinasi awal dengan perangkat desa Buyasuri',
    tindakanDLH: 'Rencana aksi bersih pantai (coastal clean up) bersama warga & karang taruna desa.',
    tanggalSelesai: '-'
  },
  {
    id: 'ADU-LMB-2026-007',
    timestamp: '2026-10-05 13:25',
    namaPelapor: 'Markus Belang',
    noHp: '081355443322',
    alamatPelapor: 'Desa Loang, Nagawutung',
    kecamatan: 'Nagawutung',
    desa: 'Loang',
    lokasiDetail: 'Kawasan pantai pasir putih Loang',
    lat: -8.4900,
    lng: 123.3850,
    jenisPencemaran: 'Kerusakan Lingkungan & Tanah',
    uraian: 'Pengambilan pasir laut secara masif menggunakan truk tanpa izin konservasi, menyebabkan abrasi tebing pantai dan pohon kelapa tumbang.',
    sumberDugaan: 'Oknum penambang pasir liar',
    tanggalKejadian: '2026-10-04',
    status: 'Sedang Diverifikasi',
    petugasVerifikasi: 'Petrus S. (Bidang Pengawasan LH)',
    tanggalVerifikasi: '2026-10-06',
    hasilVerifikasi: 'Terbukti terjadi lubang galian pasir pada sempadan pantai seluas ~100 m².',
    tindakanDLH: 'Koordinasi bersama Satpol PP Lembata untuk penertiban dan pemasangan plang larangan penambangan pasir sempadan pantai.',
    tanggalSelesai: '-'
  },
  {
    id: 'ADU-LMB-2026-008',
    timestamp: '2026-09-05 08:30',
    namaPelapor: 'Antonius Boli',
    noHp: '081244556677',
    alamatPelapor: 'Desa Wulandoni, Wulandoni',
    kecamatan: 'Wulandoni',
    desa: 'Wulandoni',
    lokasiDetail: 'Area pasar barter tradisional Wulandoni',
    lat: -8.5410,
    lng: 123.4910,
    jenisPencemaran: 'Pencemaran Air',
    uraian: 'Diduga air sumur warga tercemar rembesan limbah pengolahan daging paus/ikan dari tempat pemotongan tradisional.',
    sumberDugaan: 'Saluran pembuangan tradisional yang mampet',
    tanggalKejadian: '2026-09-04',
    status: 'Ditolak',
    petugasVerifikasi: 'Tim Gabungan DLH & Dinkes Lembata',
    tanggalVerifikasi: '2026-09-07',
    hasilVerifikasi: 'Uji air sumur menunjukkan parameter bakteriologis normal, bau berasal dari saluran drainase umum yang tersumbat daun dan lumpur, bukan pencemaran limbah B3/berbahaya.',
    tindakanDLH: 'Diserahkan penanganannya kepada pengelola pasar dan pemdes Wulandoni untuk pembersihan got bersama warga.',
    tanggalSelesai: '2026-09-08'
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

// Konfigurasi Kunci Penyimpanan & URL Web App Google Apps Script
const GAS_CONFIG_KEY = 'dlh_gas_api_url';
const DEFAULT_GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxm4r8QU2dv0S6csTTpmewuuvMNNrqiD2NeF_ENzXi8z7E3qDALHz6HNiBWtiEpGMruIQ/exec';

class AduanDataStore {
  constructor() {
    this.aduanList = [];
    this.gasApiUrl = localStorage.getItem(GAS_CONFIG_KEY) || (window.GAS_API_URL || DEFAULT_GAS_API_URL);
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.init();
  }

  init() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.aduanList = JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing stored aduan, fallback to default:', e);
        this.aduanList = [...INITIAL_ADUAN_DATA];
        this.save();
      }
    } else {
      this.aduanList = [...INITIAL_ADUAN_DATA];
      this.save();
    }

    // Jika URL Google Apps Script sudah disetel, lakukan sinkronisasi otomatis & polling berkala
    if (this.hasGasConfigured()) {
      setTimeout(() => this.syncFromGAS(true), 200);
      setInterval(() => this.syncFromGAS(true), 8000);
    }
  }

  hasGasConfigured() {
    return !!(this.gasApiUrl && this.gasApiUrl.trim().startsWith('http'));
  }

  getGasUrl() {
    return this.gasApiUrl || DEFAULT_GAS_API_URL;
  }

  setGasUrl(url) {
    this.gasApiUrl = (url || '').trim();
    if (this.gasApiUrl) {
      localStorage.setItem(GAS_CONFIG_KEY, this.gasApiUrl);
    } else {
      localStorage.removeItem(GAS_CONFIG_KEY);
    }
    return this.hasGasConfigured();
  }

  async syncFromGAS(silent = false) {
    if (!this.hasGasConfigured() || this.isSyncing) {
      return { success: false, reason: 'URL belum diisi. Masukkan URL Web App Google Apps Script untuk menghubungkan data cloud.' };
    }

    this.isSyncing = true;
    try {
      let endpoint = this.gasApiUrl;

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
            parsedData.forEach(p => this.mergeRemoteRecord(p));
            this.lastSyncTime = new Date();
            window.dispatchEvent(new CustomEvent('aduanDataSynced', { detail: { count: this.aduanList.length, silent: silent } }));
            return { success: true, count: this.aduanList.length };
          } else {
            throw new Error('Data di sheet kosong atau format kolom belum sesuai');
          }
        }
      }

      // Endpoint Google Apps Script Web App
      endpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}action=getAll&_t=${Date.now()}`;
      const response = await fetch(endpoint, { method: 'GET', mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      const json = await response.json();

      if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
        // Sinkronkan dan gabungkan langsung seluruh record dari Google Apps Script
        json.data.forEach(item => {
          this.mergeRemoteRecord(item);
        });

        this.lastSyncTime = new Date();
        window.dispatchEvent(new CustomEvent('aduanDataSynced', { detail: { count: this.aduanList.length, silent: silent } }));
        return { success: true, count: this.aduanList.length };
      }
      return { success: false, reason: 'Format respons tidak valid atau data masih kosong' };
    } catch (err) {
      console.warn('Sinkronisasi Google Spreadsheet offline/gagal (menggunakan data lokal):', err);
      let errMsg = err.message;
      if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
        errMsg = 'Gagal terhubung. Pastikan Web App disetel "Who has access: Anyone" dan spreadsheet dapat diakses.';
      }
      return { success: false, error: errMsg };
    } finally {
      this.isSyncing = false;
    }
  }

  async postToGAS(action, payload) {
    if (!this.hasGasConfigured()) return { success: false, offline: true };

    try {
      const response = await fetch(this.gasApiUrl, {
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
    return this.aduanList;
  }

  getById(id) {
    if (!id) return null;
    return this.aduanList.find(item => item.id.trim().toLowerCase() === id.trim().toLowerCase()) || null;
  }

  mergeRemoteRecord(remoteItem) {
    if (!remoteItem || !remoteItem.id) return null;
    const cleanId = String(remoteItem.id).trim().toUpperCase();
    const index = this.aduanList.findIndex(x => x.id.trim().toUpperCase() === cleanId);

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

    const mapped = {
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
      fotoBukti: remoteItem.linkFoto || remoteItem.fotoBukti || '',
      linkFotoBukti: remoteItem.linkFoto || remoteItem.linkFotoBukti || remoteItem.fotoBukti || '',
      buktiFotoList: Array.isArray(remoteItem.buktiFotoList) ? remoteItem.buktiFotoList : (remoteItem.linkFoto ? [remoteItem.linkFoto] : (remoteItem.fotoBukti ? [remoteItem.fotoBukti] : [])),
      status: remoteItem.status || 'Aduan Diterima',
      petugasVerifikasi: remoteItem.petugasVerifikasi || '-',
      tanggalVerifikasi: remoteItem.tanggalVerifikasi || '-',
      hasilVerifikasi: remoteItem.hasilVerifikasi || '-',
      tindakanDLH: remoteItem.tindakanDLH || '-',
      tanggalSelesai: remoteItem.tanggalSelesai || '-',
      rekamTindakanTerakhir: rekamTerakhir,
      riwayatTindakan: Array.isArray(remoteItem.riwayatTindakan) ? remoteItem.riwayatTindakan : (rekamTerakhir ? [rekamTerakhir] : [])
    };

    if (index !== -1) {
      this.aduanList[index] = { ...this.aduanList[index], ...mapped };
    } else {
      this.aduanList.unshift(mapped);
    }
    this.save();
    return mapped;
  }

  generateNewId() {
    const year = new Date().getFullYear();
    const count = this.aduanList.length + 1;
    const padded = String(count).padStart(3, '0');
    return `ADU-LMB-${year}-${padded}`;
  }

  addAduan(formData) {
    const newId = this.generateNewId();
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Lookup default lat lng from kecamatan if not provided
    const kecMeta = KECAMATAN_LEMBATA[formData.kecamatan] || { lat: -8.375, lng: 123.55 };
    const lat = formData.lat ? parseFloat(formData.lat) : (kecMeta.lat + (Math.random() - 0.5) * 0.02);
    const lng = formData.lng ? parseFloat(formData.lng) : (kecMeta.lng + (Math.random() - 0.5) * 0.02);

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
      status: 'Aduan Diterima',
      fotoBukti: formData.fotoBukti || '',
      linkFotoBukti: formData.linkFotoBukti || formData.fotoBukti || '',
      buktiFotoList: Array.isArray(formData.buktiFotoList) ? formData.buktiFotoList : (formData.fotoBukti ? [formData.fotoBukti] : []),
      petugasVerifikasi: '-',
      tanggalVerifikasi: '-',
      hasilVerifikasi: 'Menunggu penugasan verifikator lapangan.',
      tindakanDLH: 'Aduan telah dicatat ke sistem dan siap dijadwalkan verifikasi.',
      tanggalSelesai: '-'
    };

    this.aduanList.unshift(newRecord);
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

    this.aduanList[index] = {
      ...this.aduanList[index],
      status: updateData.status || this.aduanList[index].status,
      petugasVerifikasi: updateData.petugasVerifikasi || this.aduanList[index].petugasVerifikasi,
      tanggalVerifikasi: updateData.tanggalVerifikasi || this.aduanList[index].tanggalVerifikasi,
      hasilVerifikasi: updateData.hasilVerifikasi || this.aduanList[index].hasilVerifikasi,
      tindakanDLH: updateData.tindakanDLH || this.aduanList[index].tindakanDLH,
      tanggalSelesai: updateData.status === 'Selesai' ? (updateData.tanggalSelesai || new Date().toISOString().split('T')[0]) : this.aduanList[index].tanggalSelesai
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
        ...updateData
      });
    }

    return this.aduanList[index];
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
    const headers = [
      'ID Aduan',
      'Waktu Lapor',
      'Nama Pelapor',
      'No HP',
      'Kecamatan',
      'Desa',
      'Jenis Pencemaran',
      'Lokasi Detail',
      'Latitude',
      'Longitude',
      'Uraian Aduan',
      'Status',
      'Petugas Verifikasi',
      'Hasil Verifikasi',
      'Tindakan DLH',
      'Tanggal Selesai'
    ];

    const rows = this.aduanList.map(item => [
      `"${item.id}"`,
      `"${item.timestamp}"`,
      `"${item.namaPelapor}"`,
      `"${item.noHp}"`,
      `"${item.kecamatan}"`,
      `"${item.desa}"`,
      `"${item.jenisPencemaran}"`,
      `"${(item.lokasiDetail || '').replace(/"/g, '""')}"`,
      item.lat,
      item.lng,
      `"${(item.uraian || '').replace(/"/g, '""')}"`,
      `"${item.status}"`,
      `"${item.petugasVerifikasi || '-'}"`,
      `"${(item.hasilVerifikasi || '-').replace(/"/g, '""')}"`,
      `"${(item.tindakanDLH || '-').replace(/"/g, '""')}"`,
      `"${item.tanggalSelesai || '-'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Aduan_Lingkungan_DLH_Lembata_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Global instance
window.aduanStore = new AduanDataStore();
