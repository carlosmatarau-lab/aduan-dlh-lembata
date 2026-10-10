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
if (typeof window !== 'undefined') {
  window.KECAMATAN_LEMBATA = KECAMATAN_LEMBATA;
}

// Data Awal Aduan Realistis Kabupaten Lembata
const INITIAL_ADUAN_DATA = [
  {
    id: 'ADU-LMB-2026-001',
    timestamp: '2026-10-11 02:18',
    namaPelapor: 'Bahanna',
    noHp: '08555699888',
    alamatPelapor: 'B',
    kecamatan: 'Omesuri',
    desa: 'Nualela',
    lokasiDetail: 'Bhbb',
    lat: -8.329107,
    lng: 123.475804,
    jenisPencemaran: 'Pencemaran Air & Sungai',
    uraian: 'Laporan pengaduan warga via WhatsApp terkait pencemaran air & sungai di Nualela, Omesuri.',
    sumberDugaan: '-',
    tanggalKejadian: '2026-10-01',
    fotoBukti: '',
    linkFotoBukti: '',
    buktiFotoList: [],
    status: 'Baru',
    petugasVerifikasi: '-',
    tanggalVerifikasi: '-',
    hasilVerifikasi: 'Menunggu penugasan verifikator lapangan.',
    tindakanDLH: 'Aduan telah dicatat ke sistem.',
    tanggalSelesai: '-',
    nomorBeritaAcara: '',
    catatanBeritaAcara: '',
    fotoKondisiRiil: '',
    fotoVerifikasiList: [],
    timestampVerifikasi: '',
    timestampTindakLanjut: '',
    timestampSelesai: ''
  },
  {
    id: 'ADU-LMB-2026-002',
    timestamp: '2026-10-11 02:26',
    namaPelapor: 'Carlos Matarau',
    noHp: '08646499499',
    alamatPelapor: 'Muruona',
    kecamatan: 'Ile Ape',
    desa: 'Muruona',
    lokasiDetail: 'Tepi jalan',
    lat: -8.329107,
    lng: 123.475803,
    jenisPencemaran: 'Sampah Ilegal & Bau',
    uraian: 'Sampah sepanjang jalan',
    sumberDugaan: 'Oknum',
    tanggalKejadian: '2026-10-02',
    fotoBukti: '',
    linkFotoBukti: '',
    buktiFotoList: [],
    status: 'Baru',
    petugasVerifikasi: '-',
    tanggalVerifikasi: '-',
    hasilVerifikasi: 'Menunggu penugasan verifikator lapangan.',
    tindakanDLH: 'Aduan telah dicatat ke sistem.',
    tanggalSelesai: '-',
    nomorBeritaAcara: '',
    catatanBeritaAcara: '',
    fotoKondisiRiil: '',
    fotoVerifikasiList: [],
    timestampVerifikasi: '',
    timestampTindakLanjut: '',
    timestampSelesai: ''
  },
  {
    id: 'ADU-LMB-2026-010',
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
    fotoBukti: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=700&q=80',
    linkFotoBukti: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=700&q=80',
    buktiFotoList: [
      'https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=700&q=80'
    ],
    status: 'Selesai',
    petugasVerifikasi: 'Yohanes B. (Pengendali Dampak Lingkungan)',
    tanggalVerifikasi: '2026-09-13',
    hasilVerifikasi: 'Terbukti ada ceceran oli sekitar 15 m² dekat tambatan kapal.',
    tindakanDLH: 'Pembersihan tumpahan oli dengan absorbent pad, serta pembinaan dan surat teguran kepada pengelola kapal tambat.',
    tanggalSelesai: '2026-09-16',
    nomorBeritaAcara: 'BA-01/DLH-LMB/IX/2026',
    catatanBeritaAcara: 'Pemeriksaan bersama Syahbandar & Polairud Lewoleba. Pelaku kooperatif menandatangani Berita Acara dan bersedia membersihkan sisa ceceran dalam tempo 2x24 jam.',
    fotoKondisiRiil: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=700&q=80',
    fotoVerifikasiList: ['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=700&q=80'],
    timestampVerifikasi: '2026-09-13 10:15',
    timestampTindakLanjut: '2026-09-14 08:30',
    timestampSelesai: '2026-09-16 16:45'
  },
  {
    id: 'ADU-LMB-2026-003',
    timestamp: '2026-09-25 11:20',
    namaPelapor: 'Petrus Laba',
    noHp: '085233445566',
    alamatPelapor: 'Desa Waipukang, Ile Ape',
    kecamatan: 'Ile Ape',
    desa: 'Waipukang',
    lokasiDetail: 'Lembah lereng dekat road usaha tani',
    lat: -8.2830,
    lng: 123.5410,
    jenisPencemaran: 'Udara & Asap',
    uraian: 'Pembakaran ban bekas dan tumpukan material kabel setiap sore hari untuk mengambil kawat tembaga. Asap hitam pekat mengganggu pernapasan warga dan anak sekolah.',
    sumberDugaan: 'Aktivitas pengumpul rongsokan / besi tua liar',
    tanggalKejadian: '2026-09-24',
    fotoBukti: 'https://images.unsplash.com/photo-1569163139599-0f4517e36f51?auto=format&fit=crop&w=700&q=80',
    linkFotoBukti: 'https://images.unsplash.com/photo-1569163139599-0f4517e36f51?auto=format&fit=crop&w=700&q=80',
    buktiFotoList: [
      'https://images.unsplash.com/photo-1569163139599-0f4517e36f51?auto=format&fit=crop&w=700&q=80'
    ],
    status: 'Dalam Penanganan',
    petugasVerifikasi: 'Maria E. Karangora (PPNS Lingkungan Hidup)',
    tanggalVerifikasi: '2026-09-27',
    hasilVerifikasi: 'Ditemukan sisa abu pembakaran ban dan kabel tembaga.',
    tindakanDLH: 'Pemberian Surat Peringatan ke-1 kepada pelaku usaha rongsokan dan pelarangan aktivitas pembakaran terbuka (open burning). Sedang dalam masa pengawasan 14 hari.',
    tanggalSelesai: '-',
    nomorBeritaAcara: 'BA-03/DLH-LMB/IX/2026',
    catatanBeritaAcara: 'Pemeriksaan lapangan bersama Babinsa Koramil Ile Ape. Pelaku usaha menandatangani surat pernyataan tidak mengulangi pembakaran kabel terbuka.',
    fotoKondisiRiil: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=700&q=80',
    fotoVerifikasiList: ['https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=700&q=80'],
    timestampVerifikasi: '2026-09-27 10:30',
    timestampTindakLanjut: '2026-09-28 14:00',
    timestampSelesai: ''
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
    fotoBukti: 'https://images.unsplash.com/photo-1574482620826-40685ca5ebd2?auto=format&fit=crop&w=700&q=80',
    linkFotoBukti: 'https://images.unsplash.com/photo-1574482620826-40685ca5ebd2?auto=format&fit=crop&w=700&q=80',
    buktiFotoList: [
      'https://images.unsplash.com/photo-1574482620826-40685ca5ebd2?auto=format&fit=crop&w=700&q=80'
    ],
    status: 'Sedang Diverifikasi',
    petugasVerifikasi: 'Ir. Damianus T. (Kabid Penataan DLH)',
    tanggalVerifikasi: '2026-10-03',
    hasilVerifikasi: 'Sampel air telah diambil untuk uji parameter kekeruhan (TDS & TSS). Terindikasi sedimentasi akibat erosi galian.',
    tindakanDLH: 'Menyusun rekomendasi teknis pembuatan settling pond (kolam endap) kepada pihak pelaksana proyek.',
    tanggalSelesai: '-',
    nomorBeritaAcara: 'BA-04/DLH-LMB/X/2026',
    catatanBeritaAcara: 'Pengambilan sampel air di 3 titik aliran sungai bersama Kepala Desa Kalikasa. Berita Acara pengambilan sampel ditandatangani bersama.',
    fotoKondisiRiil: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=700&q=80',
    fotoVerifikasiList: ['https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=700&q=80'],
    timestampVerifikasi: '2026-10-03 11:20',
    timestampTindakLanjut: '',
    timestampSelesai: ''
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
    fotoBukti: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=700&q=80',
    linkFotoBukti: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=700&q=80',
    buktiFotoList: [
      'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=700&q=80'
    ],
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
    fotoBukti: 'https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?auto=format&fit=crop&w=700&q=80',
    linkFotoBukti: 'https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?auto=format&fit=crop&w=700&q=80',
    buktiFotoList: [
      'https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?auto=format&fit=crop&w=700&q=80'
    ],
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
    fotoBukti: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80',
    linkFotoBukti: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80',
    buktiFotoList: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80'
    ],
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
    fotoBukti: 'https://images.unsplash.com/photo-1584555613497-9ecf9dd06f68?auto=format&fit=crop&w=700&q=80',
    linkFotoBukti: 'https://images.unsplash.com/photo-1584555613497-9ecf9dd06f68?auto=format&fit=crop&w=700&q=80',
    buktiFotoList: [
      'https://images.unsplash.com/photo-1584555613497-9ecf9dd06f68?auto=format&fit=crop&w=700&q=80'
    ],
    status: 'Ditolak',
    petugasVerifikasi: 'Tim Gabungan DLH & Dinkes Lembata',
    tanggalVerifikasi: '2026-09-07',
    hasilVerifikasi: 'Uji air sumur menunjukkan parameter bakteriologis normal, bau berasal dari saluran drainase umum yang tersumbat daun dan lumpur, bukan pencemaran limbah B3/berbahaya.',
    tindakanDLH: 'Diserahkan penanganannya kepada pengelola pasar dan pemdes Wulandoni untuk pembersihan got bersama warga.',
    tanggalSelesai: '2026-09-08'
  },
  {
    id: 'ADU-LMB-2026-480',
    timestamp: '2026-10-11 01:58',
    namaPelapor: 'Bahanna',
    noHp: '08555699888',
    alamatPelapor: 'B',
    kecamatan: 'Omesuri',
    desa: 'Nualela',
    lokasiDetail: 'Bhbb',
    lat: -8.329107,
    lng: 123.475804,
    jenisPencemaran: 'Pencemaran Air & Sungai',
    uraian: 'Laporan pengaduan warga terkait pencemaran air & sungai di Nualela, Omesuri melalui pesan WhatsApp resmi.',
    sumberDugaan: '-',
    tanggalKejadian: '2026-10-01',
    fotoBukti: '',
    linkFotoBukti: '',
    buktiFotoList: [],
    status: 'Aduan Diterima',
    petugasVerifikasi: '-',
    tanggalVerifikasi: '-',
    hasilVerifikasi: 'Menunggu jadwal penugasan verifikator lapangan DLH.',
    tindakanDLH: 'Aduan warga terdaftar dalam antrean verifikasi lapangan.',
    tanggalSelesai: '-',
    nomorBeritaAcara: '',
    catatanBeritaAcara: '',
    fotoKondisiRiil: '',
    fotoVerifikasiList: [],
    timestampVerifikasi: '',
    timestampTindakLanjut: '',
    timestampSelesai: ''
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

// Konfigurasi Kunci Penyimpanan & URL Web App Google Apps Script
const GAS_CONFIG_KEY = 'dlh_gas_api_url';
const DELETED_STORAGE_KEY = 'dlh_deleted_aduan_ids';
const DEFAULT_GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxm4r8QU2dv0S6csTTpmewuuvMNNrqiD2NeF_ENzXi8z7E3qDALHz6HNiBWtiEpGMruIQ/exec';

class AduanDataStore {
  constructor() {
    this.aduanList = [];
    const saved = localStorage.getItem(GAS_CONFIG_KEY);
    this.gasApiUrl = (saved && saved.trim().startsWith('http')) ? saved.trim() : DEFAULT_GAS_API_URL;
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
    this.deletedIds = this.loadDeletedIds();
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Pastikan tidak ada aduan yang ada dalam daftar blacklist terhapus
        this.aduanList = parsed.filter(item => item && item.id && !this.isDeleted(item.id));
        // Backfill bidang baru jika belum ada di cache browser lokal
        this.aduanList = this.aduanList.map(item => {
          const matchInitial = INITIAL_ADUAN_DATA.find(x => x.id === item.id);
          return {
            ...item,
            nomorBeritaAcara: item.nomorBeritaAcara || (matchInitial ? matchInitial.nomorBeritaAcara : '') || '',
            catatanBeritaAcara: item.catatanBeritaAcara || (matchInitial ? matchInitial.catatanBeritaAcara : '') || '',
            fotoKondisiRiil: item.fotoKondisiRiil || (matchInitial ? matchInitial.fotoKondisiRiil : '') || '',
            fotoVerifikasiList: Array.isArray(item.fotoVerifikasiList) && item.fotoVerifikasiList.length > 0
              ? item.fotoVerifikasiList
              : (matchInitial && matchInitial.fotoVerifikasiList ? matchInitial.fotoVerifikasiList : (item.fotoKondisiRiil ? [item.fotoKondisiRiil] : [])),
            timestampVerifikasi: item.timestampVerifikasi || (matchInitial ? matchInitial.timestampVerifikasi : '') || (item.tanggalVerifikasi && item.tanggalVerifikasi !== '-' ? `${item.tanggalVerifikasi} 09:30` : ''),
            timestampTindakLanjut: item.timestampTindakLanjut || (matchInitial ? matchInitial.timestampTindakLanjut : '') || ((item.status === 'Ditindaklanjuti' || item.status === 'Dalam Penanganan' || item.status === 'Selesai') && item.tanggalVerifikasi && item.tanggalVerifikasi !== '-' ? `${item.tanggalVerifikasi} 14:00` : ''),
            timestampSelesai: item.timestampSelesai || (matchInitial ? matchInitial.timestampSelesai : '') || (item.tanggalSelesai && item.tanggalSelesai !== '-' ? `${item.tanggalSelesai} 16:30` : '')
          };
        });

        // Migrasi cache lokal: pastikan 001 dan 002 mengikuti data riil spreadsheet
        const match001 = this.aduanList.find(x => x.id === 'ADU-LMB-2026-001');
        if (match001 && match001.namaPelapor === 'Fransiskus Kedang') {
          match001.namaPelapor = 'Bahanna';
          match001.noHp = '08555699888';
          match001.alamatPelapor = 'B';
          match001.kecamatan = 'Omesuri';
          match001.desa = 'Nualela';
          match001.lokasiDetail = 'Bhbb';
          match001.lat = -8.329107;
          match001.lng = 123.475804;
          match001.jenisPencemaran = 'Pencemaran Air & Sungai';
          match001.uraian = 'Laporan pengaduan warga via WhatsApp terkait pencemaran air & sungai di Nualela, Omesuri.';
          match001.status = 'Baru';
        }
        const match002 = this.aduanList.find(x => x.id === 'ADU-LMB-2026-002');
        if (match002 && match002.namaPelapor === 'Theresia Purek') {
          match002.namaPelapor = 'Carlos Matarau';
          match002.noHp = '08646499499';
          match002.alamatPelapor = 'Muruona';
          match002.kecamatan = 'Ile Ape';
          match002.desa = 'Muruona';
          match002.lokasiDetail = 'Tepi jalan';
          match002.lat = -8.329107;
          match002.lng = 123.475803;
          match002.jenisPencemaran = 'Sampah Ilegal & Bau';
          match002.uraian = 'Sampah sepanjang jalan';
          match002.status = 'Baru';
        }

        // Pastikan tiket aduan terbaru tersinkronisasi ke daftar lokal
        let hasNewInitial = false;
        INITIAL_ADUAN_DATA.forEach(initItem => {
          if (!this.aduanList.some(x => x.id === initItem.id) && !this.isDeleted(initItem.id)) {
            this.aduanList.unshift(initItem);
            hasNewInitial = true;
          }
        });
        if (hasNewInitial || match001 || match002) {
          this.save();
        }
      } catch (e) {
        console.error('Error parsing stored aduan, fallback to default:', e);
        this.aduanList = INITIAL_ADUAN_DATA.filter(item => !this.isDeleted(item.id));
        this.save();
      }
    } else {
      this.aduanList = INITIAL_ADUAN_DATA.filter(item => !this.isDeleted(item.id));
      this.save();
    }

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
    if (this.gasApiUrl && this.gasApiUrl.trim().startsWith('http')) {
      return this.gasApiUrl.trim();
    }
    const stored = (localStorage.getItem(GAS_CONFIG_KEY) || '').trim();
    if (stored && stored.startsWith('http')) {
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

    // Jika sedang dalam proses sinkronisasi, tunggu promise yang sedang aktif daripada gagal
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
            parsedData.filter(p => !this.isDeleted(p.id)).forEach(p => this.mergeRemoteRecord(p));
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

      if (json && json.success && Array.isArray(json.data)) {
        if (json.data.length > 0) {
          // Sinkronkan dan gabungkan seluruh record dari Google Apps Script (abaikan yang sudah dihapus)
          const validItems = json.data.filter(item => !this.isDeleted(item.id));
          validItems.forEach(item => {
            this.mergeRemoteRecord(item);
          });

          this.lastSyncTime = new Date();
          window.dispatchEvent(new CustomEvent('aduanDataSynced', { detail: { count: this.aduanList.length, silent: silent } }));
          return { success: true, count: this.aduanList.length, remoteCount: validItems.length, message: `Berhasil sinkronisasi ${validItems.length} aduan dari Google Spreadsheet.` };
        } else {
          // Spreadsheet kosong (0 data baris), namun koneksi API terbukti SUKSES
          this.lastSyncTime = new Date();
          window.dispatchEvent(new CustomEvent('aduanDataSynced', { detail: { count: this.aduanList.length, silent: silent, emptyRemote: true } }));
          return {
            success: true,
            count: this.aduanList.length,
            remoteCount: 0,
            emptyRemote: true,
            message: 'Terhubung ke Google Spreadsheet! Database spreadsheet saat ini masih kosong (0 data aduan).'
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

  mergeRemoteRecord(remoteItem) {
    if (!remoteItem || !remoteItem.id) return null;
    const cleanId = String(remoteItem.id).trim().toUpperCase();

    // Jangan pernah mengembalikan aduan yang sudah dihapus oleh pengguna
    if (this.isDeleted(cleanId)) return null;

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

    const existing = index !== -1 ? this.aduanList[index] : null;
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
      fotoBukti: finalFoto,
      linkFotoBukti: finalFoto,
      buktiFotoList: finalPhotos,
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
      this.aduanList.splice(index, 1);
    }
    this.aduanList.unshift(mapped);
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
      'Tanggal Selesai',
      'Nomor Berita Acara',
      'Catatan Berita Acara',
      'Foto Fisik Lapangan',
      'Timestamp Verifikasi',
      'Timestamp Tindak Lanjut',
      'Timestamp Selesai'
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
      `"${item.tanggalSelesai || '-'}"`,
      `"${(item.nomorBeritaAcara || '-').replace(/"/g, '""')}"`,
      `"${(item.catatanBeritaAcara || '-').replace(/"/g, '""')}"`,
      `"${(item.fotoKondisiRiil || '-').replace(/"/g, '""')}"`,
      `"${item.timestampVerifikasi || '-'}"`,
      `"${item.timestampTindakLanjut || '-'}"`,
      `"${item.timestampSelesai || '-'}"`
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
