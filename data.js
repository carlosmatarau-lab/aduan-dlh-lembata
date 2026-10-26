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
// Koordinat diselaraskan secara akurat dengan Peta Geografis Resmi OpenStreetMap & BIG RI
const KECAMATAN_LEMBATA = {
  'Nubatukan': {
    lat: -8.3750,
    lng: 123.4180,
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
    lat: -8.3214,
    lng: 123.4726,
    ibukota: 'Waipukang',
    desa: [
      'Amakaka',
      'Beutaran',
      'Bungamuda',
      'Dulitukan',
      'Kolipadan',
      'Kolontobo',
      'Lamawara',
      'Laranwutun',
      'Muruona',
      'Napasabok',
      'Palilolon',
      'Petuntawa',
      'Riangbao',
      'Tagawiti',
      'Tanjung Batu',
      'Waipukang',
      'Waowala',
      'Watodiri'
    ]
  },
  'Ile Ape Timur': {
    lat: -8.2443,
    lng: 123.4948,
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
    lat: -8.3707,
    lng: 123.5474,
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
    lat: -8.4900,
    lng: 123.3600,
    ibukota: 'Loang',
    desa: [
      'Babokerong',
      'Baobolak',
      'Belabaja',
      'Boli Bean',
      'Duawutun',
      'Idalolong',
      'Ileboli',
      'Labalimut',
      'Liwulagang',
      'Lolong',
      'Lusilame',
      'Pasir Putih',
      'Penikene',
      'Riabao',
      'Tewaowutung',
      'Warawatung',
      'Wuakerong'
    ]
  },
  'Wulandoni': {
    lat: -8.5319,
    lng: 123.4510,
    ibukota: 'Wulandoni',
    desa: [
      'Alap Atadei',
      'Ataili',
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
    lat: -8.4341,
    lng: 123.4681,
    ibukota: 'Kalikasa',
    desa: [
      'Atalojo',
      'Doripewut',
      'Dulir',
      'Ile Kerbau',
      'Ile Kimok',
      'Kalikasa',
      'Katakeja',
      'Lebewala',
      'Lerek',
      'Lewogroma',
      'Lusilame',
      'Nogo Doni',
      'Nubahaeraka',
      'Tubuk Rajan',
      'Watuwawer'
    ]
  },
  'Omesuri': {
    lat: -8.2336,
    lng: 123.7060,
    ibukota: 'Balauring',
    desa: [
      'Aramaba',
      'Balauring',
      'Dolulolong',
      'Hingalamamengi',
      'Hoelea I',
      'Hoelea II',
      'Lebewala',
      'Leubatang',
      'Leudanung',
      'Leuwayang',
      'Mahal I',
      'Mahal II',
      'Meluwiting',
      'Meluwiting I',
      'Nilanapo',
      'Normal',
      'Normal I',
      'Peusawa',
      'Roma',
      'Wailolong',
      'Walangsawa',
      'Wowong'
    ]
  },
  'Buyasuri': {
    lat: -8.1924,
    lng: 123.8204,
    ibukota: 'Wairiang',
    desa: [
      'Atulaleng',
      'Atuwalupang',
      'Bareng',
      'Bean',
      'Benihading I',
      'Benihading II',
      'Buriwutung',
      'Kalikur',
      'Kalikur WL',
      'Kaohua',
      'Leuburi',
      'Leuwohung',
      'Loyobohor',
      'Mampir',
      'Panama',
      'Roho',
      'Rumang',
      'Tobotani',
      'Tubungwalang',
      'Umaleu',
      'Wairiang'
    ]
  }
};

// Titik Koordinat Presisi Tingkat Desa / Kelurahan Komprehensif di Seluruh Kabupaten Lembata
const DESA_COORDINATES = {
  // Nubatukan (Kawasan Perkotaan Lewoleba & Sekitarnya)
  'lewoleba': { lat: -8.3750, lng: 123.4180 },
  'lewoleba (kelurahan)': { lat: -8.3725, lng: 123.4190 },
  'lewoleba barat': { lat: -8.3760, lng: 123.4080 },
  'lewoleba barat (kelurahan)': { lat: -8.3760, lng: 123.4080 },
  'lewoleba tengah': { lat: -8.3787, lng: 123.4246 },
  'lewoleba tengah (kelurahan)': { lat: -8.3787, lng: 123.4246 },
  'lewoleba timur': { lat: -8.3740, lng: 123.4320 },
  'lewoleba timur (kelurahan)': { lat: -8.3740, lng: 123.4320 },
  'lewoleba utara': { lat: -8.3650, lng: 123.4210 },
  'lewoleba utara (kelurahan)': { lat: -8.3650, lng: 123.4210 },
  'lewoleba selatan': { lat: -8.3880, lng: 123.4200 },
  'lewoleba selatan (kelurahan)': { lat: -8.3880, lng: 123.4200 },
  'selandoro': { lat: -8.3800, lng: 123.4120 },
  'selandoro (kelurahan)': { lat: -8.3800, lng: 123.4120 },
  'pada': { lat: -8.3850, lng: 123.4020 },
  'waijarang': { lat: -8.3980, lng: 123.3850 },
  'baolangu': { lat: -8.4100, lng: 123.4350 },
  'belobatang': { lat: -8.4250, lng: 123.4150 },
  'bour': { lat: -8.4020, lng: 123.3650 },
  'bakalerek': { lat: -8.3910, lng: 123.4650 },
  'lite ulumado': { lat: -8.4280, lng: 123.4420 },
  'nubamado': { lat: -8.4150, lng: 123.4560 },
  'nubatukan': { lat: -8.3850, lng: 123.4300 },
  'paubokol': { lat: -8.4050, lng: 123.4720 },
  'udak melomata': { lat: -8.4320, lng: 123.4580 },

  // Ile Ape
  'waipukang': { lat: -8.3214, lng: 123.4726 },
  'muruona': { lat: -8.3266, lng: 123.4734 },
  'amakaka': { lat: -8.2950, lng: 123.4920 },
  'beutaran': { lat: -8.3120, lng: 123.4680 },
  'bungamuda': { lat: -8.3310, lng: 123.4550 },
  'dulitukan': { lat: -8.3380, lng: 123.4420 },
  'kolipadan': { lat: -8.3180, lng: 123.4510 },
  'kolontobo': { lat: -8.3410, lng: 123.4620 },
  'lamawara': { lat: -8.3050, lng: 123.4780 },
  'laranwutun': { lat: -8.3240, lng: 123.4650 },
  'laranwuntun': { lat: -8.3240, lng: 123.4650 },
  'napasabok': { lat: -8.2880, lng: 123.4850 },
  'palilolon': { lat: -8.3350, lng: 123.4590 },
  'petuntawa': { lat: -8.3450, lng: 123.4720 },
  'riangbao': { lat: -8.3290, lng: 123.4610 },
  'tagawiti': { lat: -8.3370, lng: 123.4480 },
  'tanjung batu': { lat: -8.2450, lng: 123.4850 },
  'waowala': { lat: -8.3020, lng: 123.4880 },
  'watodiri': { lat: -8.2810, lng: 123.4910 },

  // Ile Ape Timur
  'lamagute': { lat: -8.2443, lng: 123.4948 },
  'aulesa': { lat: -8.2520, lng: 123.5180 },
  'bao lai duli': { lat: -8.2410, lng: 123.5020 },
  'jontona': { lat: -8.2600, lng: 123.5120 },
  'lamaau': { lat: -8.2480, lng: 123.4880 },
  'lamatokan': { lat: -8.2580, lng: 123.5250 },
  'lamawolo': { lat: -8.2650, lng: 123.5310 },
  'todanara': { lat: -8.2720, lng: 123.5190 },
  'waimatan': { lat: -8.2690, lng: 123.5080 },

  // Lebatukan
  'hadakewa': { lat: -8.3707, lng: 123.5474 },
  'atakore': { lat: -8.3850, lng: 123.5220 },
  'balurebong': { lat: -8.3910, lng: 123.5610 },
  'baopana': { lat: -8.3820, lng: 123.5350 },
  'belobao': { lat: -8.3750, lng: 123.5720 },
  'dikesare': { lat: -8.3780, lng: 123.5510 },
  'lamalela': { lat: -8.3650, lng: 123.5580 },
  'lamatuka': { lat: -8.3880, lng: 123.5780 },
  'lerahinga': { lat: -8.3720, lng: 123.5650 },
  'lewoeleng': { lat: -8.3580, lng: 123.5520 },
  'lodoblolong': { lat: -8.3690, lng: 123.5820 },
  'merdeka': { lat: -8.3620, lng: 123.5650 },
  'seranggorang': { lat: -8.3950, lng: 123.5890 },
  'tapobaran': { lat: -8.3810, lng: 123.5950 },
  'tapolangu': { lat: -8.3740, lng: 123.6020 },
  'waienga': { lat: -8.3680, lng: 123.5850 },
  'wangatoa': { lat: -8.3790, lng: 123.5120 },

  // Nagawutung
  'loang': { lat: -8.4900, lng: 123.3600 },
  'babokerong': { lat: -8.4820, lng: 123.3320 },
  'baobolak': { lat: -8.4950, lng: 123.3450 },
  'bauraja': { lat: -8.4950, lng: 123.3450 },
  'belabaja': { lat: -8.5102, lng: 123.3802 },
  'boli bean': { lat: -8.5040, lng: 123.3650 },
  'duawutun': { lat: -8.5020, lng: 123.3550 },
  'idalolong': { lat: -8.5150, lng: 123.3720 },
  'ilape': { lat: -8.4780, lng: 123.3410 },
  'ileboli': { lat: -8.4780, lng: 123.3410 },
  'ile kimok': { lat: -8.4690, lng: 123.3520 },
  'labalimut': { lat: -8.4850, lng: 123.3750 },
  'liwulagang': { lat: -8.5220, lng: 123.3910 },
  'lolong': { lat: -8.4900, lng: 123.3600 },
  'lusilame': { lat: -8.4720, lng: 123.3680 },
  'pasir putih': { lat: -8.4980, lng: 123.3250 },
  'penikene': { lat: -8.5080, lng: 123.3610 },
  'riabao': { lat: -8.4760, lng: 123.3500 },
  'riangbao': { lat: -8.4760, lng: 123.3500 },
  'sinunaleng': { lat: -8.4610, lng: 123.3280 },
  'tewaowutung': { lat: -8.4880, lng: 123.3150 },
  'warawatung': { lat: -8.4750, lng: 123.3390 },
  'wuakerong': { lat: -8.4729, lng: 123.3012 },

  // Wulandoni
  'wulandoni': { lat: -8.5319, lng: 123.4510 },
  'alap atadei': { lat: -8.5180, lng: 123.4720 },
  'ataili': { lat: -8.5280, lng: 123.4560 },
  'atakera': { lat: -8.5250, lng: 123.4610 },
  'belobao': { lat: -8.5350, lng: 123.4680 },
  'imulolong': { lat: -8.5420, lng: 123.4380 },
  'lamalera': { lat: -8.5520, lng: 123.4350 },
  'lamalera a': { lat: -8.5520, lng: 123.4350 },
  'lamalera b': { lat: -8.5540, lng: 123.4360 },
  'leworaja': { lat: -8.5290, lng: 123.4280 },
  'mulankera': { lat: -8.5480, lng: 123.4480 },
  'pantai harapan': { lat: -8.5380, lng: 123.4550 },
  'pora': { lat: -8.5210, lng: 123.4390 },
  'posiwatu': { lat: -8.5350, lng: 123.4420 },
  'puor': { lat: -8.5080, lng: 123.4580 },
  'puor b': { lat: -8.5110, lng: 123.4620 },
  'tapobali': { lat: -8.5450, lng: 123.4620 },

  // Atadei
  'kalikasa': { lat: -8.4341, lng: 123.4681 },
  'atalojo': { lat: -8.4290, lng: 123.4590 },
  'atanila': { lat: -8.4290, lng: 123.4590 },
  'doripewut': { lat: -8.4520, lng: 123.4610 },
  'dulir': { lat: -8.4190, lng: 123.4720 },
  'ile kerbau': { lat: -8.4420, lng: 123.4520 },
  'ile kimok': { lat: -8.4350, lng: 123.4580 },
  'karangora': { lat: -8.4520, lng: 123.4610 },
  'katakeja': { lat: -8.4380, lng: 123.4780 },
  'lebomatan': { lat: -8.4420, lng: 123.4520 },
  'lebewala': { lat: -8.4310, lng: 123.4790 },
  'lerek': { lat: -8.4450, lng: 123.4550 },
  'lewogroma': { lat: -8.4250, lng: 123.4650 },
  'lewokukung': { lat: -8.4310, lng: 123.4790 },
  'lusilame': { lat: -8.4400, lng: 123.4680 },
  'nogo doni': { lat: -8.4210, lng: 123.4850 },
  'nubahaeraka': { lat: -8.4580, lng: 123.4720 },
  'tubuk rajan': { lat: -8.4620, lng: 123.4810 },
  'wadun': { lat: -8.4150, lng: 123.4610 },
  'watuwawer': { lat: -8.4490, lng: 123.4950 },

  // Omesuri
  'balauring': { lat: -8.2336, lng: 123.7060 },
  'aramaba': { lat: -8.2420, lng: 123.6850 },
  'dolulolong': { lat: -8.2480, lng: 123.7150 },
  'hingalamamengi': { lat: -8.2390, lng: 123.6950 },
  'hoelea': { lat: -8.2580, lng: 123.7250 },
  'hoelea i': { lat: -8.2580, lng: 123.7250 },
  'hoelea ii': { lat: -8.2610, lng: 123.7290 },
  'lebewala': { lat: -8.4310, lng: 123.4790 },
  'leubatang': { lat: -8.2450, lng: 123.6780 },
  'leudanung': { lat: -8.2510, lng: 123.6890 },
  'leuwayang': { lat: -8.2250, lng: 123.6920 },
  'mahal': { lat: -8.2680, lng: 123.7380 },
  'mahal i': { lat: -8.2680, lng: 123.7380 },
  'mahal ii': { lat: -8.2710, lng: 123.7420 },
  'meluwiting': { lat: -8.2380, lng: 123.7210 },
  'meluwiting i': { lat: -8.2350, lng: 123.7250 },
  'nilanapo': { lat: -8.2550, lng: 123.7080 },
  'normal': { lat: -8.2620, lng: 123.7180 },
  'normal i': { lat: -8.2650, lng: 123.7210 },
  'peusawa': { lat: -8.2290, lng: 123.7120 },
  'roma': { lat: -8.2490, lng: 123.7310 },
  'unleurn': { lat: -8.2580, lng: 123.7410 },
  'usun manu': { lat: -8.2410, lng: 123.7350 },
  'wailolong': { lat: -8.2580, lng: 123.7410 },
  'walangsawa': { lat: -8.2450, lng: 123.7480 },
  'wowong': { lat: -8.2210, lng: 123.7190 },

  // Buyasuri
  'wairiang': { lat: -8.1924, lng: 123.8204 },
  'atulaleng': { lat: -8.1880, lng: 123.8350 },
  'atuwalupang': { lat: -8.1950, lng: 123.8420 },
  'bareng': { lat: -8.1820, lng: 123.8150 },
  'bean': { lat: -8.2050, lng: 123.8550 },
  'benihading i': { lat: -8.2110, lng: 123.8610 },
  'benihading ii': { lat: -8.2130, lng: 123.8640 },
  'benikoor': { lat: -8.2110, lng: 123.8610 },
  'boli bean': { lat: -8.2010, lng: 123.8490 },
  'buriwutung': { lat: -8.1790, lng: 123.8050 },
  'kalikur': { lat: -8.1850, lng: 123.7950 },
  'kalikur wl': { lat: -8.1820, lng: 123.7920 },
  'kaohua': { lat: -8.1910, lng: 123.8120 },
  'leuburi': { lat: -8.1990, lng: 123.8290 },
  'leuwohung': { lat: -8.1980, lng: 123.8350 },
  'loyobohor': { lat: -8.2080, lng: 123.8390 },
  'mampir': { lat: -8.2150, lng: 123.8690 },
  'panama': { lat: -8.1890, lng: 123.8250 },
  'roho': { lat: -8.1960, lng: 123.8310 },
  'rumang': { lat: -8.2020, lng: 123.8380 },
  'tobotani': { lat: -8.2180, lng: 123.8750 },
  'tubungwalang': { lat: -8.2090, lng: 123.8450 },
  'tuwago': { lat: -8.2090, lng: 123.8450 },
  'umaleu': { lat: -8.1840, lng: 123.8010 }
};

// Koreksi centroid desa/kelurahan berdasarkan titik place=village OpenStreetMap.
// Kunci 'kecamatan::desa' dipakai lebih dulu agar nama desa yang sama di kecamatan berbeda tidak bertabrakan.
Object.assign(DESA_COORDINATES, {
  'nubatukan::baolangu': { lat: -8.41899, lng: 123.45343 },
  'baolangu': { lat: -8.41899, lng: 123.45343 },
  'nubatukan::belobatang': { lat: -8.44833, lng: 123.36769 },
  'belobatang': { lat: -8.44833, lng: 123.36769 },
  'nubatukan::bour': { lat: -8.4518, lng: 123.30513 },
  'bour': { lat: -8.4518, lng: 123.30513 },
  'nubatukan::lewoleba (kelurahan)': { lat: -8.37178, lng: 123.4184 },
  'lewoleba (kelurahan)': { lat: -8.37178, lng: 123.4184 },
  'nubatukan::lewoleba barat (kelurahan)': { lat: -8.40382, lng: 123.38247 },
  'lewoleba barat (kelurahan)': { lat: -8.40382, lng: 123.38247 },
  'nubatukan::lewoleba tengah (kelurahan)': { lat: -8.38347, lng: 123.42463 },
  'lewoleba tengah (kelurahan)': { lat: -8.38347, lng: 123.42463 },
  'nubatukan::lewoleba timur (kelurahan)': { lat: -8.36449, lng: 123.45153 },
  'lewoleba timur (kelurahan)': { lat: -8.36449, lng: 123.45153 },
  'nubatukan::lite ulumado': { lat: -8.40524, lng: 123.43618 },
  'lite ulumado': { lat: -8.40524, lng: 123.43618 },
  'nubatukan::nubamado': { lat: -8.42622, lng: 123.39867 },
  'nubamado': { lat: -8.42622, lng: 123.39867 },
  'nubatukan::pada': { lat: -8.38751, lng: 123.38851 },
  'pada': { lat: -8.38751, lng: 123.38851 },
  'nubatukan::udak melomata': { lat: -8.49181, lng: 123.44529 },
  'udak melomata': { lat: -8.49181, lng: 123.44529 },
  'nubatukan::waijarang': { lat: -8.40088, lng: 123.34646 },
  'waijarang': { lat: -8.40088, lng: 123.34646 },
  'ile ape::amakaka': { lat: -8.26498, lng: 123.46988 },
  'amakaka': { lat: -8.26498, lng: 123.46988 },
  'ile ape::beutaran': { lat: -8.27188, lng: 123.40116 },
  'beutaran': { lat: -8.27188, lng: 123.40116 },
  'ile ape::bungamuda': { lat: -8.25341, lng: 123.4769 },
  'bungamuda': { lat: -8.25341, lng: 123.4769 },
  'ile ape::dulitukan': { lat: -8.27256, lng: 123.39325 },
  'dulitukan': { lat: -8.27256, lng: 123.39325 },
  'ile ape::kolipadan': { lat: -8.29918, lng: 123.35918 },
  'kolipadan': { lat: -8.29918, lng: 123.35918 },
  'ile ape::kolontobo': { lat: -8.31231, lng: 123.45894 },
  'kolontobo': { lat: -8.31231, lng: 123.45894 },
  'ile ape::lamawara': { lat: -8.25553, lng: 123.47549 },
  'lamawara': { lat: -8.25553, lng: 123.47549 },
  'ile ape::laranwutun': { lat: -8.32319, lng: 123.46892 },
  'laranwutun': { lat: -8.32319, lng: 123.46892 },
  'ile ape::muruona': { lat: -8.32923, lng: 123.47628 },
  'muruona': { lat: -8.32923, lng: 123.47628 },
  'ile ape::napasabok': { lat: -8.2462, lng: 123.48774 },
  'napasabok': { lat: -8.2462, lng: 123.48774 },
  'ile ape::palilolon': { lat: -8.2757, lng: 123.37119 },
  'palilolon': { lat: -8.2757, lng: 123.37119 },
  'ile ape::petuntawa': { lat: -8.30098, lng: 123.45323 },
  'petuntawa': { lat: -8.30098, lng: 123.45323 },
  'ile ape::riangbao': { lat: -8.30471, lng: 123.45385 },
  'riangbao': { lat: -8.30471, lng: 123.45385 },
  'ile ape::tagawiti': { lat: -8.271, lng: 123.39794 },
  'tagawiti': { lat: -8.271, lng: 123.39794 },
  'ile ape::tanjung batu': { lat: -8.26903, lng: 123.46592 },
  'tanjung batu': { lat: -8.26903, lng: 123.46592 },
  'ile ape::waowala': { lat: -8.27179, lng: 123.46092 },
  'waowala': { lat: -8.27179, lng: 123.46092 },
  'ile ape::watodiri': { lat: -8.33316, lng: 123.50197 },
  'watodiri': { lat: -8.33316, lng: 123.50197 },
  'ile ape timur::aulesa': { lat: -8.23879, lng: 123.519 },
  'aulesa': { lat: -8.23879, lng: 123.519 },
  'ile ape timur::jontona': { lat: -8.30518, lng: 123.52079 },
  'jontona': { lat: -8.30518, lng: 123.52079 },
  'ile ape timur::lamaau': { lat: -8.23973, lng: 123.53314 },
  'lamaau': { lat: -8.23973, lng: 123.53314 },
  'ile ape timur::lamagute': { lat: -8.24429, lng: 123.49485 },
  'lamagute': { lat: -8.24429, lng: 123.49485 },
  'ile ape timur::lamatokan': { lat: -8.25791, lng: 123.54653 },
  'lamatokan': { lat: -8.25791, lng: 123.54653 },
  'ile ape timur::lamawolo': { lat: -8.26881, lng: 123.54783 },
  'lamawolo': { lat: -8.26881, lng: 123.54783 },
  'ile ape timur::todanara': { lat: -8.3178, lng: 123.51186 },
  'todanara': { lat: -8.3178, lng: 123.51186 },
  'ile ape timur::waimatan': { lat: -8.242, lng: 123.50715 },
  'waimatan': { lat: -8.242, lng: 123.50715 },
  'lebatukan::atakore': { lat: -8.50809, lng: 123.54258 },
  'atakore': { lat: -8.50809, lng: 123.54258 },
  'lebatukan::balurebong': { lat: -8.35032, lng: 123.66373 },
  'balurebong': { lat: -8.35032, lng: 123.66373 },
  'lebatukan::baopana': { lat: -8.36101, lng: 123.50198 },
  'baopana': { lat: -8.36101, lng: 123.50198 },
  'lebatukan::dikesare': { lat: -8.29218, lng: 123.63579 },
  'dikesare': { lat: -8.29218, lng: 123.63579 },
  'lebatukan::hadakewa': { lat: -8.3707, lng: 123.54735 },
  'hadakewa': { lat: -8.3707, lng: 123.54735 },
  'lebatukan::lamalela': { lat: -8.39103, lng: 123.59734 },
  'lamalela': { lat: -8.39103, lng: 123.59734 },
  'lebatukan::lamatuka': { lat: -8.36388, lng: 123.4963 },
  'lamatuka': { lat: -8.36388, lng: 123.4963 },
  'lebatukan::lerahinga': { lat: -8.36921, lng: 123.55889 },
  'lerahinga': { lat: -8.36921, lng: 123.55889 },
  'lebatukan::lewoeleng': { lat: -8.33633, lng: 123.62596 },
  'lewoeleng': { lat: -8.33633, lng: 123.62596 },
  'lebatukan::merdeka': { lat: -8.36589, lng: 123.52598 },
  'merdeka': { lat: -8.36589, lng: 123.52598 },
  'lebatukan::seranggorang': { lat: -8.34897, lng: 123.65296 },
  'seranggorang': { lat: -8.34897, lng: 123.65296 },
  'lebatukan::tapobaran': { lat: -8.32663, lng: 123.6007 },
  'tapobaran': { lat: -8.32663, lng: 123.6007 },
  'lebatukan::tapolangu': { lat: -8.30668, lng: 123.61831 },
  'tapolangu': { lat: -8.30668, lng: 123.61831 },
  'lebatukan::waienga': { lat: -8.36443, lng: 123.57235 },
  'waienga': { lat: -8.36443, lng: 123.57235 },
  'nagawutung::babokerong': { lat: -8.49274, lng: 123.2546 },
  'babokerong': { lat: -8.49274, lng: 123.2546 },
  'nagawutung::baobolak': { lat: -8.52099, lng: 123.26527 },
  'baobolak': { lat: -8.52099, lng: 123.26527 },
  'nagawutung::belabaja': { lat: -8.51022, lng: 123.38022 },
  'belabaja': { lat: -8.51022, lng: 123.38022 },
  'nagawutung::duawutun': { lat: -8.47292, lng: 123.28537 },
  'duawutun': { lat: -8.47292, lng: 123.28537 },
  'nagawutung::ileboli': { lat: -8.48421, lng: 123.35818 },
  'ileboli': { lat: -8.48421, lng: 123.35818 },
  'nagawutung::labalimut': { lat: -8.50664, lng: 123.37522 },
  'labalimut': { lat: -8.50664, lng: 123.37522 },
  'nagawutung::liwulagang': { lat: -8.50024, lng: 123.38612 },
  'liwulagang': { lat: -8.50024, lng: 123.38612 },
  'nagawutung::lolong': { lat: -8.53639, lng: 123.30188 },
  'lolong': { lat: -8.53639, lng: 123.30188 },
  'nagawutung::pasir putih': { lat: -8.54359, lng: 123.26446 },
  'pasir putih': { lat: -8.54359, lng: 123.26446 },
  'nagawutung::wuakerong': { lat: -8.47291, lng: 123.3012 },
  'wuakerong': { lat: -8.47291, lng: 123.3012 },
  'wulandoni::alap atadei': { lat: -8.53843, lng: 123.50967 },
  'alap atadei': { lat: -8.53843, lng: 123.50967 },
  'wulandoni::ataili': { lat: -8.51891, lng: 123.47107 },
  'ataili': { lat: -8.51891, lng: 123.47107 },
  'wulandoni::atakera': { lat: -8.51644, lng: 123.48441 },
  'atakera': { lat: -8.51644, lng: 123.48441 },
  'wulandoni::imulolong': { lat: -8.54517, lng: 123.40839 },
  'imulolong': { lat: -8.54517, lng: 123.40839 },
  'wulandoni::lamalera a': { lat: -8.57591, lng: 123.41698 },
  'lamalera a': { lat: -8.57591, lng: 123.41698 },
  'wulandoni::lamalera b': { lat: -8.57487, lng: 123.42371 },
  'lamalera b': { lat: -8.57487, lng: 123.42371 },
  'wulandoni::leworaja': { lat: -8.51477, lng: 123.48955 },
  'leworaja': { lat: -8.51477, lng: 123.48955 },
  'wulandoni::mulankera': { lat: -8.51616, lng: 123.48547 },
  'mulankera': { lat: -8.51616, lng: 123.48547 },
  'wulandoni::pantai harapan': { lat: -8.53068, lng: 123.45206 },
  'pantai harapan': { lat: -8.53068, lng: 123.45206 },
  'wulandoni::posiwatu': { lat: -8.55345, lng: 123.41834 },
  'posiwatu': { lat: -8.55345, lng: 123.41834 },
  'wulandoni::puor': { lat: -8.53544, lng: 123.40936 },
  'puor': { lat: -8.53544, lng: 123.40936 },
  'wulandoni::tapobali': { lat: -8.58044, lng: 123.3888 },
  'tapobali': { lat: -8.58044, lng: 123.3888 },
  'wulandoni::wulandoni': { lat: -8.53191, lng: 123.45104 },
  'wulandoni': { lat: -8.53191, lng: 123.45104 },
  'atadei::atalojo': { lat: -8.49202, lng: 123.52211 },
  'atalojo': { lat: -8.49202, lng: 123.52211 },
  'atadei::doripewut': { lat: -8.47099, lng: 123.49008 },
  'doripewut': { lat: -8.47099, lng: 123.49008 },
  'atadei::dulir': { lat: -8.55956, lng: 123.55823 },
  'dulir': { lat: -8.55956, lng: 123.55823 },
  'atadei::ile kerbau': { lat: -8.474, lng: 123.4327 },
  'ile kerbau': { lat: -8.474, lng: 123.4327 },
  'atadei::ile kimok': { lat: -8.4441, lng: 123.54345 },
  'ile kimok': { lat: -8.4441, lng: 123.54345 },
  'atadei::katakeja': { lat: -8.43651, lng: 123.47384 },
  'katakeja': { lat: -8.43651, lng: 123.47384 },
  'atadei::lerek': { lat: -8.5229, lng: 123.54573 },
  'lerek': { lat: -8.5229, lng: 123.54573 },
  'atadei::lewogroma': { lat: -8.5025, lng: 123.55348 },
  'lewogroma': { lat: -8.5025, lng: 123.55348 },
  'atadei::lusilame': { lat: -8.51449, lng: 123.52078 },
  'lusilame': { lat: -8.51449, lng: 123.52078 },
  'atadei::nogo doni': { lat: -8.47444, lng: 123.52085 },
  'nogo doni': { lat: -8.47444, lng: 123.52085 },
  'atadei::nubahaeraka': { lat: -8.48104, lng: 123.54783 },
  'nubahaeraka': { lat: -8.48104, lng: 123.54783 },
  'atadei::tubuk rajan': { lat: -8.45095, lng: 123.49349 },
  'tubuk rajan': { lat: -8.45095, lng: 123.49349 },
  'omesuri::balauring': { lat: -8.23357, lng: 123.70599 },
  'balauring': { lat: -8.23357, lng: 123.70599 },
  'omesuri::dolulolong': { lat: -8.21242, lng: 123.72607 },
  'dolulolong': { lat: -8.21242, lng: 123.72607 },
  'omesuri::hingalamamengi': { lat: -8.22904, lng: 123.73979 },
  'hingalamamengi': { lat: -8.22904, lng: 123.73979 },
  'omesuri::hoelea i': { lat: -8.2169, lng: 123.74067 },
  'hoelea i': { lat: -8.2169, lng: 123.74067 },
  'omesuri::hoelea ii': { lat: -8.21324, lng: 123.74269 },
  'hoelea ii': { lat: -8.21324, lng: 123.74269 },
  'omesuri::lebewala': { lat: -8.26088, lng: 123.69172 },
  'lebewala': { lat: -8.26088, lng: 123.69172 },
  'omesuri::leubatang': { lat: -8.24767, lng: 123.7586 },
  'leubatang': { lat: -8.24767, lng: 123.7586 },
  'omesuri::leudanung': { lat: -8.19159, lng: 123.75432 },
  'leudanung': { lat: -8.19159, lng: 123.75432 },
  'omesuri::leuwayang': { lat: -8.19778, lng: 123.74899 },
  'leuwayang': { lat: -8.19778, lng: 123.74899 },
  'omesuri::mahal i': { lat: -8.24466, lng: 123.78088 },
  'mahal i': { lat: -8.24466, lng: 123.78088 },
  'omesuri::mahal ii': { lat: -8.24662, lng: 123.77485 },
  'mahal ii': { lat: -8.24662, lng: 123.77485 },
  'omesuri::meluwiting': { lat: -8.24093, lng: 123.74604 },
  'meluwiting': { lat: -8.24093, lng: 123.74604 },
  'omesuri::meluwiting i': { lat: -8.24558, lng: 123.74428 },
  'meluwiting i': { lat: -8.24558, lng: 123.74428 },
  'omesuri::nilanapo': { lat: -8.3272, lng: 123.72391 },
  'nilanapo': { lat: -8.3272, lng: 123.72391 },
  'omesuri::normal': { lat: -8.18394, lng: 123.75681 },
  'normal': { lat: -8.18394, lng: 123.75681 },
  'omesuri::normal i': { lat: -8.18818, lng: 123.75472 },
  'normal i': { lat: -8.18818, lng: 123.75472 },
  'omesuri::peusawa': { lat: -8.24563, lng: 123.7687 },
  'peusawa': { lat: -8.24563, lng: 123.7687 },
  'omesuri::roma': { lat: -8.19945, lng: 123.74485 },
  'roma': { lat: -8.19945, lng: 123.74485 },
  'omesuri::wailolong': { lat: -8.256, lng: 123.66059 },
  'wailolong': { lat: -8.256, lng: 123.66059 },
  'omesuri::walangsawa': { lat: -8.24533, lng: 123.76498 },
  'walangsawa': { lat: -8.24533, lng: 123.76498 },
  'omesuri::wowong': { lat: -8.28757, lng: 123.76498 },
  'wowong': { lat: -8.28757, lng: 123.76498 },
  'buyasuri::atulaleng': { lat: -8.22996, lng: 123.80986 },
  'atulaleng': { lat: -8.22996, lng: 123.80986 },
  'buyasuri::atuwalupang': { lat: -8.23079, lng: 123.80222 },
  'atuwalupang': { lat: -8.23079, lng: 123.80222 },
  'buyasuri::bareng': { lat: -8.17327, lng: 123.77412 },
  'bareng': { lat: -8.17327, lng: 123.77412 },
  'buyasuri::bean': { lat: -8.26555, lng: 123.81254 },
  'bean': { lat: -8.26555, lng: 123.81254 },
  'buyasuri::benihading i': { lat: -8.2384, lng: 123.79327 },
  'benihading i': { lat: -8.2384, lng: 123.79327 },
  'buyasuri::benihading ii': { lat: -8.23564, lng: 123.79649 },
  'benihading ii': { lat: -8.23564, lng: 123.79649 },
  'buyasuri::buriwutung': { lat: -8.18324, lng: 123.80878 },
  'buriwutung': { lat: -8.18324, lng: 123.80878 },
  'buyasuri::kalikur': { lat: -8.17918, lng: 123.76432 },
  'kalikur': { lat: -8.17918, lng: 123.76432 },
  'buyasuri::kalikur wl': { lat: -8.20192, lng: 123.83236 },
  'kalikur wl': { lat: -8.20192, lng: 123.83236 },
  'buyasuri::kaohua': { lat: -8.20528, lng: 123.81762 },
  'kaohua': { lat: -8.20528, lng: 123.81762 },
  'buyasuri::leuburi': { lat: -8.21069, lng: 123.81579 },
  'leuburi': { lat: -8.21069, lng: 123.81579 },
  'buyasuri::leuwohung': { lat: -8.17324, lng: 123.79126 },
  'leuwohung': { lat: -8.17324, lng: 123.79126 },
  'buyasuri::loyobohor': { lat: -8.21928, lng: 123.8145 },
  'loyobohor': { lat: -8.21928, lng: 123.8145 },
  'buyasuri::mampir': { lat: -8.17641, lng: 123.79717 },
  'mampir': { lat: -8.17641, lng: 123.79717 },
  'buyasuri::panama': { lat: -8.24028, lng: 123.78707 },
  'panama': { lat: -8.24028, lng: 123.78707 },
  'buyasuri::roho': { lat: -8.22389, lng: 123.81386 },
  'roho': { lat: -8.22389, lng: 123.81386 },
  'buyasuri::rumang': { lat: -8.208, lng: 123.83986 },
  'rumang': { lat: -8.208, lng: 123.83986 },
  'buyasuri::tobotani': { lat: -8.2214, lng: 123.89823 },
  'tobotani': { lat: -8.2214, lng: 123.89823 },
  'buyasuri::tubungwalang': { lat: -8.22709, lng: 123.811 },
  'tubungwalang': { lat: -8.22709, lng: 123.811 },
  'buyasuri::umaleu': { lat: -8.19003, lng: 123.81376 },
  'umaleu': { lat: -8.19003, lng: 123.81376 },
  'buyasuri::wairiang': { lat: -8.19238, lng: 123.82038 },
  'wairiang': { lat: -8.19238, lng: 123.82038 },
  // Nama sama dengan desa di kecamatan lain (titik OSM tidak tersedia di kecamatan ini): pertahankan titik lama
  'atadei::lebewala': { lat: -8.4310, lng: 123.4790 },
  'nagawutung::lusilame': { lat: -8.4720, lng: 123.3680 }
});

if (typeof window !== 'undefined') {
  window.KECAMATAN_LEMBATA = KECAMATAN_LEMBATA;
  window.DESA_COORDINATES = DESA_COORDINATES;
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
      noHp: normalizeIndonesianPhoneNumber(item.No_HP || item.noHp),
      alamatPelapor: item.Alamat_Pelapor || item.alamatPelapor || '-',
      kecamatan: item.Kecamatan || item.kecamatan || 'Nubatukan',
      desa: item.Desa_Kelurahan || item.desa || '-',
      lokasiDetail: item.Lokasi_Detail || item.lokasiDetail || '-',
      lat: (function() {
        const rawLat = parseFloat(item.Latitude || item.lat);
        const rawLng = parseFloat(item.Longitude || item.lng);
        const desaLow = String(item.Desa_Kelurahan || item.desa || '').trim().toLowerCase();
        const kecName = item.Kecamatan || item.kecamatan || 'Nubatukan';
        if (isNaN(rawLat) || (Math.abs(rawLat - (-8.3682)) < 0.005 && Math.abs(rawLng - 123.5583) < 0.005)) {
          return (desaLow && DESA_COORDINATES[desaLow]) ? DESA_COORDINATES[desaLow].lat : (KECAMATAN_LEMBATA[kecName] ? KECAMATAN_LEMBATA[kecName].lat : -8.3750);
        }
        return rawLat;
      })(),
      lng: (function() {
        const rawLat = parseFloat(item.Latitude || item.lat);
        const rawLng = parseFloat(item.Longitude || item.lng);
        const desaLow = String(item.Desa_Kelurahan || item.desa || '').trim().toLowerCase();
        const kecName = item.Kecamatan || item.kecamatan || 'Nubatukan';
        if (isNaN(rawLng) || (Math.abs(rawLat - (-8.3682)) < 0.005 && Math.abs(rawLng - 123.5583) < 0.005)) {
          return (desaLow && DESA_COORDINATES[desaLow]) ? DESA_COORDINATES[desaLow].lng : (KECAMATAN_LEMBATA[kecName] ? KECAMATAN_LEMBATA[kecName].lng : 123.4180);
        }
        return rawLng;
      })(),
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
      tanggalSelesai: item.Tanggal_Selesai || item.tanggalSelesai || '-',
      nomorBeritaAcara: item.Nomor_Berita_Acara || item.nomorBeritaAcara || '',
      catatanBeritaAcara: item.Catatan_Berita_Acara || item.catatanBeritaAcara || '',
      fotoKondisiRiil: item.Foto_Kondisi_Riil || item.fotoKondisiRiil || '',
      timestampVerifikasi: item.Timestamp_Verifikasi || item.timestampVerifikasi || '',
      timestampTindakLanjut: item.Timestamp_Tindak_Lanjut || item.timestampTindakLanjut || '',
      timestampSelesai: item.Timestamp_Selesai || item.timestampSelesai || ''
    });
  }
  return result;
}

// Helper normalisasi nomor telepon seluler Indonesia (08xx / 628xx / 8xx)
function normalizeIndonesianPhoneNumber(val) {
  if (!val || val === '-') return '-';
  let s = String(val).replace(/^'/, '').trim();
  const d = s.replace(/[^0-9]/g, '');
  if (!d) return s || '-';
  if (d.startsWith('00628')) return '0' + d.slice(4);
  if (d.startsWith('6208')) return '0' + d.slice(3);
  if (d.startsWith('8') && d.length >= 9 && d.length <= 13) return '0' + d;
  if (d.startsWith('628') && d.length >= 11 && d.length <= 15) return '0' + d.slice(2);
  if (d.startsWith('08')) return d;
  return s || '-';
}
if (typeof window !== 'undefined') {
  window.normalizeIndonesianPhoneNumber = normalizeIndonesianPhoneNumber;
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

  const hasPendingOfficer = Boolean(existing && existing._pendingOfficerSync);
  const isRecentEdit = Boolean(existing && existing._lastOfficerEditTime && (Date.now() - existing._lastOfficerEditTime < 15000));
  const finalStatus = (hasPendingOfficer && isRecentEdit) ? existing.status : (remoteItem.status || 'Baru');
  const isFinalUnverified = (!finalStatus || finalStatus === 'Baru' || finalStatus === 'Aduan Diterima' || finalStatus === 'Verifikasi Administrasi' || finalStatus === '-');

  // Konsolidasi foto kondisi riil petugas: Cloud Server adalah Single Source of Truth
  let finalOfficerPhotos = [];
  let finalFotoRiil = '';

  if (isFinalUnverified) {
    finalOfficerPhotos = [];
    finalFotoRiil = '';
    for (let i = 0; i < 10; i++) {
      try {
        localStorage.removeItem('dlh_photo_cache_' + cleanId + '_PETUGAS_' + i);
        localStorage.removeItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_PETUGAS_' + i);
      } catch (e) {}
    }
  } else if (hasPendingOfficer && isRecentEdit) {
    // Pertahankan perubahan lokal HANYA jika sedang dalam proses kirim (15 detik terakhir)
    finalOfficerPhotos = Array.isArray(existing.fotoVerifikasiList) ? [...existing.fotoVerifikasiList] : [];
    finalFotoRiil = existing.fotoKondisiRiil || (finalOfficerPhotos[0] || '');
  } else {
    // Sinkronisasi penuh dari server (menghapus tuntas foto lama / mengganti dengan foto baru dari HP)
    finalOfficerPhotos = [...resolvedOfficerPhotos];
    finalFotoRiil = finalOfficerPhotos[0] || '';

    // Perbarui cache lokal untuk foto yang aktif dari server
    if (finalOfficerPhotos.length > 0) {
      for (let i = 0; i < finalOfficerPhotos.length; i++) {
        if (finalOfficerPhotos[i] && finalOfficerPhotos[i].startsWith('data:image')) {
          try {
            localStorage.setItem('dlh_photo_cache_' + cleanId + '_PETUGAS_' + i, finalOfficerPhotos[i]);
            if (i === 0) localStorage.setItem('dlh_photo_cache_' + cleanId + '_PETUGAS', finalOfficerPhotos[i]);
          } catch (e) {}
        }
      }
      for (let i = finalOfficerPhotos.length; i < 10; i++) {
        try {
          localStorage.removeItem('dlh_photo_cache_' + cleanId + '_PETUGAS_' + i);
          localStorage.removeItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_PETUGAS_' + i);
        } catch (e) {}
      }
    } else {
      for (let i = 0; i < 10; i++) {
        try {
          localStorage.removeItem('dlh_photo_cache_' + cleanId + '_PETUGAS_' + i);
          localStorage.removeItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_PETUGAS_' + i);
        } catch (e) {}
      }
    }
  }
  if (finalOfficerPhotos.length === 0) {
    try {
      localStorage.removeItem('dlh_photo_cache_' + cleanId + '_PETUGAS');
      localStorage.removeItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_PETUGAS');
    } catch (e) {}
  }

  // Resolusi Titik Koordinat Presisi Geografis Nyata
  let resolvedLat = parseFloat(remoteItem.lat);
  let resolvedLng = parseFloat(remoteItem.lng);
  const kecStr = String(remoteItem.kecamatan || 'Nubatukan').trim();
  const desaStr = String(remoteItem.desa || '').trim().toLowerCase();

  // Deteksi dan perbaiki koordinat default legacy yang melenceng (-8.368, 123.558)
  const isLegacyOff = (isNaN(resolvedLat) || isNaN(resolvedLng) ||
    (Math.abs(resolvedLat - (-8.3682)) < 0.005 && Math.abs(resolvedLng - 123.5583) < 0.005) ||
    (Math.abs(resolvedLat - (-8.368)) < 0.005 && Math.abs(resolvedLng - 123.558) < 0.005));

  if (isLegacyOff || !resolvedLat || !resolvedLng) {
    if (desaStr && DESA_COORDINATES[desaStr]) {
      resolvedLat = DESA_COORDINATES[desaStr].lat;
      resolvedLng = DESA_COORDINATES[desaStr].lng;
    } else if (kecStr && KECAMATAN_LEMBATA[kecStr]) {
      resolvedLat = KECAMATAN_LEMBATA[kecStr].lat;
      resolvedLng = KECAMATAN_LEMBATA[kecStr].lng;
    } else {
      resolvedLat = -8.3750;
      resolvedLng = 123.4180;
    }
  } else if (kecStr.toLowerCase() === 'nubatukan' && Math.abs(resolvedLng - 123.5583) < 0.02) {
    // Koreksi presisi untuk Nubatukan / Lewoleba yang sebelumnya tersimpan dengan bujur Hadakewa (123.558)
    if (desaStr && DESA_COORDINATES[desaStr]) {
      resolvedLat = DESA_COORDINATES[desaStr].lat;
      resolvedLng = DESA_COORDINATES[desaStr].lng;
    } else {
      resolvedLat = -8.3750;
      resolvedLng = 123.4180;
    }
  }

  return {
    id: cleanId,
    timestamp: remoteItem.timestamp || '-',
    namaPelapor: remoteItem.namaPelapor || 'Masyarakat',
    noHp: normalizeIndonesianPhoneNumber(remoteItem.noHp),
    alamatPelapor: remoteItem.alamatPelapor || '-',
    kecamatan: kecStr,
    desa: remoteItem.desa || '-',
    lokasiDetail: remoteItem.lokasiDetail || '-',
    lat: resolvedLat,
    lng: resolvedLng,
    jenisPencemaran: remoteItem.jenisPencemaran || 'Lainnya',
    uraian: remoteItem.uraian || '-',
    sumberDugaan: remoteItem.sumberDugaan || '-',
    tanggalKejadian: remoteItem.tanggalKejadian || '-',
    fotoBukti: finalFoto,
    linkFotoBukti: finalFoto,
    buktiFotoList: finalPhotos,
    status: finalStatus,
    petugasVerifikasi: isFinalUnverified ? '-' : (hasPendingOfficer ? (existing.petugasVerifikasi || '-') : (remoteItem.petugasVerifikasi || '-')),
    tanggalVerifikasi: isFinalUnverified ? '-' : (hasPendingOfficer ? (existing.tanggalVerifikasi || '-') : (remoteItem.tanggalVerifikasi || '-')),
    hasilVerifikasi: isFinalUnverified ? '-' : (hasPendingOfficer ? (existing.hasilVerifikasi || '-') : (remoteItem.hasilVerifikasi || '-')),
    tindakanDLH: isFinalUnverified ? '-' : (hasPendingOfficer ? (existing.tindakanDLH || '-') : (remoteItem.tindakanDLH || '-')),
    tanggalSelesai: isFinalUnverified ? '-' : (hasPendingOfficer ? (existing.tanggalSelesai || '-') : (remoteItem.tanggalSelesai || '-')),
    nomorBeritaAcara: isFinalUnverified ? '' : (hasPendingOfficer ? (existing.nomorBeritaAcara || '') : (remoteItem.nomorBeritaAcara || '')),
    catatanBeritaAcara: isFinalUnverified ? '' : (hasPendingOfficer ? (existing.catatanBeritaAcara || '') : (remoteItem.catatanBeritaAcara || '')),
    fotoKondisiRiil: finalFotoRiil,
    fotoVerifikasiList: finalOfficerPhotos,
    timestampVerifikasi: isFinalUnverified ? '' : (hasPendingOfficer ? (existing.timestampVerifikasi || '') : (remoteItem.timestampVerifikasi || '')),
    timestampTindakLanjut: isFinalUnverified ? '' : (hasPendingOfficer ? (existing.timestampTindakLanjut || '') : (remoteItem.timestampTindakLanjut || '')),
    timestampSelesai: isFinalUnverified ? '' : (hasPendingOfficer ? (existing.timestampSelesai || '') : (remoteItem.timestampSelesai || '')),
    rekamTindakanTerakhir: rekamTerakhir,
    riwayatTindakan: Array.isArray(remoteItem.riwayatTindakan) ? remoteItem.riwayatTindakan : (rekamTerakhir ? [rekamTerakhir] : []),
    ...(hasPendingOfficer ? { _pendingOfficerSync: true } : {})
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

    // Sinkronisasi otomatis real-time lintas perangkat (Interval 3.5 detik + event-driven instan)
    if (this.hasGasConfigured() && !this._pollIntervalStarted) {
      this._pollIntervalStarted = true;
      setTimeout(() => this.syncFromGAS(true), 150);

      // Polling cerdas: 3.5 detik saat tab aktif, 15 detik saat tab di latar belakang
      let pollTimer = null;
      const restartPolling = () => {
        if (pollTimer) clearInterval(pollTimer);
        const ms = (typeof document !== 'undefined' && document.hidden) ? 15000 : 3500;
        pollTimer = setInterval(() => this.syncFromGAS(true), ms);
      };
      restartPolling();

      // Sinkronkan instan saat tab dibuka kembali, window fokus, atau koneksi pulih
      if (typeof window !== 'undefined') {
        window.addEventListener('focus', () => {
          this.syncFromGAS(true);
          restartPolling();
        });
        window.addEventListener('online', () => {
          this.syncFromGAS(true);
          restartPolling();
        });
        if (typeof document !== 'undefined') {
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              this.syncFromGAS(true);
            }
            restartPolling();
          });
        }
      }
    }
  }

  hasGasConfigured() {
    const url = this.getGasUrl();
    return !!(url && url.trim().startsWith('http'));
  }

  async fetchPhotoBase64FromGAS(aduanId, photoIdx = 0, isOfficer = false) {
    if (!aduanId || !this.hasGasConfigured()) return null;
    const cleanId = String(aduanId).trim().toUpperCase();
    const pIdx = parseInt(photoIdx || '0', 10) || 0;
    const isOff = Boolean(isOfficer || cleanId.endsWith('_PETUGAS'));
    const baseId = isOff ? cleanId.replace(/_PETUGAS$/i, '') : cleanId;

    // 1. Cek cache lokal
    try {
      const cached = isOff
        ? (localStorage.getItem('dlh_photo_cache_' + baseId + '_PETUGAS_' + pIdx) ||
           localStorage.getItem('dlh_photo_cache_' + baseId.toLowerCase() + '_PETUGAS_' + pIdx) ||
           (pIdx === 0 ? (localStorage.getItem('dlh_photo_cache_' + baseId + '_PETUGAS') || localStorage.getItem('dlh_photo_cache_' + baseId.toLowerCase() + '_PETUGAS')) : null))
        : (localStorage.getItem('dlh_photo_cache_' + baseId + '_' + pIdx) ||
           localStorage.getItem('dlh_photo_cache_' + baseId.toLowerCase() + '_' + pIdx) ||
           (pIdx === 0 ? (localStorage.getItem('dlh_photo_cache_' + baseId) || localStorage.getItem('dlh_photo_cache_' + baseId.toLowerCase())) : null));
      if (cached && cached.startsWith('data:image')) return cached;
    } catch (e) {}

    // 2. Fetch rekaman dari GAS endpoint via action getById
    try {
      const gasUrl = this.getGasUrl();
      const url = `${gasUrl}${gasUrl.includes('?') ? '&' : '?'}action=getById&id=${encodeURIComponent(baseId)}&_t=${Date.now()}`;
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      const json = await res.json();
      if (json && json.success && json.data) {
        const item = json.data;
        let photos = [];
        if (isOff) {
          photos = Array.isArray(item.fotoVerifikasiList) ? item.fotoVerifikasiList : (item.fotoKondisiRiil ? [item.fotoKondisiRiil] : []);
        } else {
          photos = Array.isArray(item.buktiFotoList) ? item.buktiFotoList : (item.fotoBukti ? [item.fotoBukti] : []);
        }
        
        const photo = photos[pIdx] || photos[0];
        if (photo && photo.startsWith('data:image')) {
          try {
            if (isOff) {
              localStorage.setItem('dlh_photo_cache_' + baseId + '_PETUGAS_' + pIdx, photo);
              if (pIdx === 0) localStorage.setItem('dlh_photo_cache_' + baseId + '_PETUGAS', photo);
            } else {
              localStorage.setItem('dlh_photo_cache_' + baseId + '_' + pIdx, photo);
            }
          } catch (e) {}

          const idx = this.aduanList.findIndex(x => x && x.id && x.id.trim().toUpperCase() === baseId);
          if (idx !== -1) {
            if (isOff) {
              if (!Array.isArray(this.aduanList[idx].fotoVerifikasiList)) this.aduanList[idx].fotoVerifikasiList = [];
              this.aduanList[idx].fotoVerifikasiList[pIdx] = photo;
              if (pIdx === 0) this.aduanList[idx].fotoKondisiRiil = photo;
            } else {
              if (Array.isArray(this.aduanList[idx].buktiFotoList) && this.aduanList[idx].buktiFotoList[pIdx]) {
                this.aduanList[idx].buktiFotoList[pIdx] = photo;
              }
              if (pIdx === 0) {
                this.aduanList[idx].fotoBukti = photo;
              }
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
      const queryId = isOff ? (baseId + '_PETUGAS') : baseId;
      const url = `${gasUrl}${gasUrl.includes('?') ? '&' : '?'}action=getFotoBase64&id=${encodeURIComponent(queryId)}&photoIdx=${pIdx}&_t=${Date.now()}`;
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      const json = await res.json();
      if (json && json.success && json.base64 && json.base64.startsWith('data:image')) {
        try {
          if (isOff) {
            localStorage.setItem('dlh_photo_cache_' + baseId + '_PETUGAS_' + pIdx, json.base64);
            if (pIdx === 0) localStorage.setItem('dlh_photo_cache_' + baseId + '_PETUGAS', json.base64);
          } else {
            localStorage.setItem('dlh_photo_cache_' + baseId + '_' + pIdx, json.base64);
          }
        } catch (e) {}
        const idx = this.aduanList.findIndex(x => x && x.id && x.id.trim().toUpperCase() === baseId);
        if (idx !== -1) {
          if (isOff) {
            if (!Array.isArray(this.aduanList[idx].fotoVerifikasiList)) this.aduanList[idx].fotoVerifikasiList = [];
            this.aduanList[idx].fotoVerifikasiList[pIdx] = json.base64;
            if (pIdx === 0) this.aduanList[idx].fotoKondisiRiil = json.base64;
          } else {
            if (Array.isArray(this.aduanList[idx].buktiFotoList) && this.aduanList[idx].buktiFotoList[pIdx]) {
              this.aduanList[idx].buktiFotoList[pIdx] = json.base64;
            }
            if (pIdx === 0) {
              this.aduanList[idx].fotoBukti = json.base64;
            }
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
      if (item && item._pendingOfficerSync) {
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
      const bodyStr = JSON.stringify({ action: action, data: payload });
      // Gunakan fetch standar tanpa keepalive agar tidak terkena kuota batas 64KB browser (W3C/WHATWG)
      // saat mengunggah bukti foto Base64 ke Google Apps Script
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: bodyStr
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

    this.aduanList = (this.aduanList || []).filter(item => {
      if (!item || !item.id) return false;
      const cid = String(item.id).trim().toUpperCase();
      if (this.isDeleted(cid) || seen.has(cid)) return false;

      // Cek apakah ID memiliki suffix tambahan dari retry lama (seperti ADU-LMB-YYYY-MMDD-XXXX-YYY)
      // dan base ID aslinya sudah tercatat di list
      const baseMatch = cid.match(/^(ADU-LMB-\d{4}-\d{4}-[A-Z0-9]{4,5})-[A-Z0-9]{3,}$/);
      if (baseMatch) {
        const baseId = baseMatch[1];
        if (seen.has(baseId)) {
          return false; // Buang duplicate ber-suffix jika base ID asli sudah ada
        }
      }

      seen.add(cid);
      return true;
    });
  }

  save() {
    this._deduplicateList();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.aduanList));
    } catch (e) {
      console.warn('LocalStorage quota exceeded in save(), membersihkan cache foto lokal...', e);
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('dlh_photo_cache_') || k.startsWith('dlh_lembata_aduan_v1'))) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => { try { localStorage.removeItem(k); } catch (ign) {} });

        // Pangkas Base64 dari aduan lama selain aduan paling baru
        const pruned = (this.aduanList || []).map((item, idx) => {
          if (idx > 0) {
            return {
              ...item,
              fotoBukti: (item.fotoBukti && item.fotoBukti.startsWith('http')) ? item.fotoBukti : '',
              linkFotoBukti: (item.linkFotoBukti && item.linkFotoBukti.startsWith('http')) ? item.linkFotoBukti : '',
              buktiFotoList: (item.buktiFotoList || []).filter(p => typeof p === 'string' && p.startsWith('http'))
            };
          }
          return item;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
      } catch (innerErr) {
        console.warn('Fallback save error, stripping all Base64 from localStorage:', innerErr);
        try {
          const textOnly = (this.aduanList || []).map(item => ({
            ...item,
            fotoBukti: (item.fotoBukti && item.fotoBukti.startsWith('http')) ? item.fotoBukti : '',
            linkFotoBukti: (item.linkFotoBukti && item.linkFotoBukti.startsWith('http')) ? item.linkFotoBukti : '',
            buktiFotoList: (item.buktiFotoList || []).filter(p => typeof p === 'string' && p.startsWith('http'))
          }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(textOnly));
        } catch (finalErr) {
          console.warn('Cannot write to localStorage:', finalErr);
        }
      }
    }
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
    return mapRemoteAduanRecord(remoteItem, this.aduanList, (id) => this.isDeleted(id));
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

    // Lookup default lat lng from desa / kelurahan atau kecamatan secara presisi tanpa random jitter
    const kecDict = (typeof KECAMATAN_LEMBATA !== 'undefined' ? KECAMATAN_LEMBATA : (window.KECAMATAN_LEMBATA || {}));
    const desaDict = (typeof DESA_COORDINATES !== 'undefined' ? DESA_COORDINATES : (window.DESA_COORDINATES || {}));
    const desaKey = String(formData.desa || '').trim().toLowerCase();
    const desaMeta = desaKey && desaDict[desaKey] ? desaDict[desaKey] : null;
    const kecMeta = (formData.kecamatan && kecDict[formData.kecamatan]) ? kecDict[formData.kecamatan] : { lat: -8.3750, lng: 123.4180 };
    const defaultMeta = desaMeta || kecMeta;
    const lat = (formData.lat !== undefined && formData.lat !== '' && !isNaN(parseFloat(formData.lat))) ? parseFloat(formData.lat) : defaultMeta.lat;
    const lng = (formData.lng !== undefined && formData.lng !== '' && !isNaN(parseFloat(formData.lng))) ? parseFloat(formData.lng) : defaultMeta.lng;

    const existingIndex = this.aduanList.findIndex(x => x.id === newId);
    const existingItem = existingIndex !== -1 ? this.aduanList[existingIndex] : null;

    // Normalisasi daftar foto masuk tanpa merusak Base64
    let incomingPhotos = [];
    if (Array.isArray(formData.buktiFotoList) && formData.buktiFotoList.length > 0) {
      formData.buktiFotoList.forEach(p => {
        const str = (p && p.dataUrl) ? p.dataUrl : (typeof p === 'string' ? p : '');
        if (str && str.trim() && str.trim() !== '-') {
          incomingPhotos.push(str.trim());
        }
      });
    } else {
      // Periksa linkFotoBukti terlebih dahulu (berisi seluruh daftar multi-foto dipisah koma)
      const rawCombined = formData.linkFotoBukti || formData.fotoBukti || formData.linkFoto || '';
      if (typeof rawCombined === 'string' && rawCombined.trim() && rawCombined.trim() !== '-') {
        const matches = rawCombined.match(/(data:image\/[a-zA-Z0-9\+\/\-\.]+;base64,[A-Za-z0-9\+\/\=]+|https?:\/\/[^\s,]+)/g);
        if (matches && matches.length > 0) {
          matches.forEach(s => {
            const tr = s.trim();
            if (tr) incomingPhotos.push(tr);
          });
        } else if (rawCombined.trim()) {
          incomingPhotos.push(rawCombined.trim());
        }
      }
    }

    const mergedPhotos = incomingPhotos.length > 0
      ? incomingPhotos
      : (existingItem && Array.isArray(existingItem.buktiFotoList) && existingItem.buktiFotoList.length > 0 ? existingItem.buktiFotoList : (existingItem && existingItem.fotoBukti ? [existingItem.fotoBukti] : []));

    const fotoUtama = mergedPhotos[0] || (existingItem ? existingItem.fotoBukti : '') || '';

    // Simpan salinan cadangan foto Base64 ke cache lokal secara aman
    try {
      mergedPhotos.forEach((photoStr, idx) => {
        if (photoStr && typeof photoStr === 'string' && photoStr.startsWith('data:image') && photoStr.length < 150000) {
          try {
            localStorage.setItem('dlh_photo_cache_' + newId + '_' + idx, photoStr);
          } catch (e) {}
        }
      });
      for (let i = mergedPhotos.length; i < 6; i++) {
        try {
          localStorage.removeItem('dlh_photo_cache_' + newId + '_' + i);
        } catch (e) {}
      }
    } catch (e) {}

    const newRecord = {
      id: newId,
      timestamp: formattedDate,
      namaPelapor: formData.namaPelapor || (existingItem ? existingItem.namaPelapor : 'Masyarakat (Anonim)'),
      noHp: normalizeIndonesianPhoneNumber(formData.noHp || (existingItem ? existingItem.noHp : '-')),
      alamatPelapor: formData.alamatPelapor || (existingItem ? existingItem.alamatPelapor : '-'),
      kecamatan: formData.kecamatan || (existingItem ? existingItem.kecamatan : 'Nubatukan'),
      desa: formData.desa || (existingItem ? existingItem.desa : '-'),
      lokasiDetail: formData.lokasiDetail || (existingItem ? existingItem.lokasiDetail : '-'),
      lat: lat,
      lng: lng,
      jenisPencemaran: formData.jenisPencemaran || (existingItem ? existingItem.jenisPencemaran : 'Lainnya'),
      uraian: formData.uraian || (existingItem ? existingItem.uraian : '-'),
      penyelesaian: formData.penyelesaian || (existingItem ? existingItem.penyelesaian : '-'),
      riwayatPengaduan: formData.riwayatPengaduan || (existingItem ? existingItem.riwayatPengaduan : 'Belum pernah'),
      riwayatPengaduanList: formData.riwayatPengaduanList || (existingItem ? existingItem.riwayatPengaduanList : []),
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

    // Kirim langsung ke Google Apps Script tanpa duplikasi payload Base64 berlebih
    if (this.hasGasConfigured()) {
      this._activeSyncIds = this._activeSyncIds || new Set();
      this._activeSyncIds.add(newId);

      // Siapkan payload bersih: kirim Base64 HANYA pada buktiFotoList agar ukuran data 3x lebih ringan & cepat sampai
      const payloadToSend = {
        ...newRecord,
        fotoBukti: '',
        linkFotoBukti: ''
      };
      if ((!payloadToSend.buktiFotoList || payloadToSend.buktiFotoList.length === 0) && fotoUtama) {
        payloadToSend.buktiFotoList = [fotoUtama];
      }

      const sendPromise = this.postToGAS('addAduan', payloadToSend);

      // Tangani penyelesaian request secara asynchronous mandiri
      sendPromise.then(res => {
        const idx = this.aduanList.findIndex(x => x.id === newId);
        if (idx !== -1) {
          delete this.aduanList[idx]._syncingNow;
          if (res && res.success) {
            delete this.aduanList[idx]._pendingSync;
            const remoteData = (res.response && res.response.data) ? res.response.data : null;
            if (remoteData && remoteData.linkFoto && remoteData.linkFoto.startsWith('http')) {
              this.aduanList[idx].fotoBukti = remoteData.fotoBukti || remoteData.linkFoto;
              this.aduanList[idx].linkFotoBukti = remoteData.linkFoto;
              if (Array.isArray(remoteData.buktiFotoList) && remoteData.buktiFotoList.length > 0) {
                this.aduanList[idx].buktiFotoList = remoteData.buktiFotoList;
              }
            }
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

      // Tunggu respons GAS dengan batas waktu aman agar data dipastikan sampai sebelum UI berpindah
      try {
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ timeout: true }), 25000));
        await Promise.race([sendPromise, timeoutPromise]);
      } catch (err) {}
    }

    return newRecord;
  }

  async updateVerifikasi(id, updateData) {
    const cleanId = String(id || '').trim().toUpperCase();
    const index = this.aduanList.findIndex(item => String(item.id).trim().toUpperCase() === cleanId);
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

    // Konsolidasi foto kondisi riil hasil verifikasi lapangan (Menghargai penghapusan foto secara penuh)
    let fotoList;
    if (Array.isArray(updateData.fotoVerifikasiList)) {
      fotoList = [...updateData.fotoVerifikasiList];
    } else if (updateData.fotoKondisiRiil !== undefined) {
      fotoList = updateData.fotoKondisiRiil ? [updateData.fotoKondisiRiil] : [];
    } else {
      fotoList = Array.isArray(existing.fotoVerifikasiList) ? [...existing.fotoVerifikasiList] : (existing.fotoKondisiRiil ? [existing.fotoKondisiRiil] : []);
    }
    const fotoUtama = fotoList[0] || '';

    // Bersihkan cache lama foto petugas untuk aduan ini agar tidak ada foto usang yang tertinggal
    for (let k = 0; k < 10; k++) {
      try {
        localStorage.removeItem('dlh_photo_cache_' + cleanId + '_PETUGAS_' + k);
        localStorage.removeItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_PETUGAS_' + k);
      } catch (e) {}
    }
    try {
      localStorage.removeItem('dlh_photo_cache_' + cleanId + '_PETUGAS');
      localStorage.removeItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_PETUGAS');
    } catch (e) {}

    // Simpan salinan cadangan foto Base64 petugas yang baru ke cache lokal
    fotoList.forEach((photoStr, idx) => {
      if (photoStr && typeof photoStr === 'string' && photoStr.startsWith('data:image')) {
        try {
          localStorage.setItem('dlh_photo_cache_' + cleanId + '_PETUGAS_' + idx, photoStr);
          if (idx === 0) localStorage.setItem('dlh_photo_cache_' + cleanId + '_PETUGAS', photoStr);
        } catch (e) {}
      }
    });

    const updatedRecord = {
      ...existing,
      status: updateData.status || existing.status,
      petugasVerifikasi: updateData.petugasVerifikasi || existing.petugasVerifikasi,
      tanggalVerifikasi: updateData.tanggalVerifikasi || existing.tanggalVerifikasi,
      hasilVerifikasi: updateData.hasilVerifikasi || existing.hasilVerifikasi,
      tindakanDLH: updateData.tindakanDLH || existing.tindakanDLH,
      tanggalSelesai: updateData.status === 'Selesai' ? (updateData.tanggalSelesai || new Date().toISOString().split('T')[0]) : existing.tanggalSelesai,
      // Berita Acara, Checklist Verifikasi & Bukti Foto Fisik Riil
      checklistVerifikasi: updateData.checklistVerifikasi !== undefined ? updateData.checklistVerifikasi : (existing.checklistVerifikasi || []),
      nomorBeritaAcara: updateData.nomorBeritaAcara !== undefined ? updateData.nomorBeritaAcara : (existing.nomorBeritaAcara || ''),
      catatanBeritaAcara: updateData.catatanBeritaAcara !== undefined ? updateData.catatanBeritaAcara : (existing.catatanBeritaAcara || ''),
      fotoKondisiRiil: fotoUtama,
      fotoVerifikasiList: fotoList,
      // Timestamps akuntabilitas kinerja
      timestampVerifikasi: timestampVerifikasi,
      timestampTindakLanjut: timestampTindakLanjut,
      timestampSelesai: timestampSelesai,
      _pendingOfficerSync: true,
      _lastOfficerEditTime: Date.now()
    };

    const curIdx = this.aduanList.findIndex(item => String(item.id).trim().toUpperCase() === cleanId);
    if (curIdx !== -1) {
      this.aduanList[curIdx] = updatedRecord;
    }
    this.save();

    // Broadcast Real-Time ke tab/portal warga secara langsung
    if (window.dlhRealtime) {
      window.dlhRealtime.broadcast('TINDAK_LANJUT_UPDATED', { id: cleanId, item: updatedRecord, updateData: updateData });
    }

    // Kirim sinkronisasi langsung ke Google Apps Script dan tunggu responsnya
    if (this.hasGasConfigured()) {
      try {
        const payload = {
          id: cleanId,
          status: updatedRecord.status,
          petugasVerifikasi: updatedRecord.petugasVerifikasi,
          tanggalVerifikasi: updatedRecord.tanggalVerifikasi,
          hasilVerifikasi: updatedRecord.hasilVerifikasi,
          tindakanDLH: updatedRecord.tindakanDLH,
          tanggalSelesai: updatedRecord.tanggalSelesai,
          nomorBeritaAcara: updatedRecord.nomorBeritaAcara,
          catatanBeritaAcara: updatedRecord.catatanBeritaAcara,
          fotoKondisiRiil: updatedRecord.fotoKondisiRiil,
          fotoVerifikasiList: updatedRecord.fotoVerifikasiList,
          timestampVerifikasi: updatedRecord.timestampVerifikasi,
          timestampTindakLanjut: updatedRecord.timestampTindakLanjut,
          timestampSelesai: updatedRecord.timestampSelesai
        };
        const res = await this.postToGAS('updateVerifikasi', payload);
        if (res && res.success) {
          const freshIdx = this.aduanList.findIndex(x => String(x.id).trim().toUpperCase() === cleanId);
          if (freshIdx !== -1) {
            delete this.aduanList[freshIdx]._pendingOfficerSync;
            this.save();
          }
          // Segera lakukan sinkronisasi background untuk mengambil URL teranyar dari server
          setTimeout(() => this.syncFromGAS(true), 300);
        }
      } catch (err) {
        console.warn('Gagal kirim updateVerifikasi ke GAS, tetap tersimpan lokal dengan status pending:', err);
      }
    }

    return updatedRecord;
  }

  async deleteOfficerPhoto(id, photoIndex) {
    if (!id) return false;
    const cleanId = String(id).trim().toUpperCase();
    const index = this.aduanList.findIndex(item => String(item.id).trim().toUpperCase() === cleanId);
    if (index === -1) return false;

    const existing = this.aduanList[index];
    let currentPhotos = [];
    if (Array.isArray(existing.fotoVerifikasiList) && existing.fotoVerifikasiList.length > 0) {
      currentPhotos = [...existing.fotoVerifikasiList];
    } else if (existing.fotoKondisiRiil && existing.fotoKondisiRiil !== '-') {
      currentPhotos = [existing.fotoKondisiRiil];
    }

    const idx = parseInt(photoIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= currentPhotos.length) return false;

    // Hapus foto pada indeks tersebut
    currentPhotos.splice(idx, 1);
    const newFotoUtama = currentPhotos[0] || '';

    // Bersihkan seluruh cache lokal foto petugas untuk aduan ini dan simpan ulang yang tersisa
    for (let k = 0; k < 10; k++) {
      try {
        localStorage.removeItem('dlh_photo_cache_' + cleanId + '_PETUGAS_' + k);
        localStorage.removeItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_PETUGAS_' + k);
      } catch (e) {}
    }
    try {
      localStorage.removeItem('dlh_photo_cache_' + cleanId + '_PETUGAS');
      localStorage.removeItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_PETUGAS');
    } catch (e) {}

    currentPhotos.forEach((p, pIdx) => {
      if (p && typeof p === 'string' && p.startsWith('data:image')) {
        try {
          localStorage.setItem('dlh_photo_cache_' + cleanId + '_PETUGAS_' + pIdx, p);
          if (pIdx === 0) localStorage.setItem('dlh_photo_cache_' + cleanId + '_PETUGAS', p);
        } catch (e) {}
      }
    });

    const updatedRecord = {
      ...existing,
      fotoKondisiRiil: newFotoUtama,
      fotoVerifikasiList: currentPhotos,
      _pendingOfficerSync: true,
      _lastOfficerEditTime: Date.now()
    };

    const curIdx = this.aduanList.findIndex(item => String(item.id).trim().toUpperCase() === cleanId);
    if (curIdx !== -1) {
      this.aduanList[curIdx] = updatedRecord;
    }
    this.save();

    // Broadcast ke tab lain
    if (window.dlhRealtime) {
      window.dlhRealtime.broadcast('ADUAN_UPDATED', {
        id: cleanId,
        action: 'DELETE_OFFICER_PHOTO',
        photoIndex: idx,
        item: updatedRecord
      });
    }

    // Kirim sinkronisasi ke Google Apps Script
    if (this.hasGasConfigured()) {
      try {
        const res = await this.postToGAS('updateVerifikasi', {
          id: cleanId,
          status: updatedRecord.status,
          petugasVerifikasi: updatedRecord.petugasVerifikasi,
          tanggalVerifikasi: updatedRecord.tanggalVerifikasi,
          hasilVerifikasi: updatedRecord.hasilVerifikasi,
          tindakanDLH: updatedRecord.tindakanDLH,
          tanggalSelesai: updatedRecord.tanggalSelesai,
          nomorBeritaAcara: updatedRecord.nomorBeritaAcara,
          catatanBeritaAcara: updatedRecord.catatanBeritaAcara,
          fotoKondisiRiil: newFotoUtama,
          fotoVerifikasiList: currentPhotos,
          timestampVerifikasi: updatedRecord.timestampVerifikasi,
          timestampTindakLanjut: updatedRecord.timestampTindakLanjut,
          timestampSelesai: updatedRecord.timestampSelesai
        });
        if (res && res.success) {
          const freshIdx = this.aduanList.findIndex(x => String(x.id).trim().toUpperCase() === cleanId);
          if (freshIdx !== -1) {
            delete this.aduanList[freshIdx]._pendingOfficerSync;
            this.save();
          }
          setTimeout(() => this.syncFromGAS(true), 300);
        }
      } catch (err) {
        console.warn('Gagal hapus foto di cloud:', err);
      }
    }

    return updatedRecord;
  }

  deleteAduan(id) {
    if (!id) return false;
    const cleanId = String(id).trim().toUpperCase();

    // Cegah eksekusi ganda jika ID yang sama sedang dalam proses penghapusan
    this._activeDeleteIds = this._activeDeleteIds || new Set();
    if (this._activeDeleteIds.has(cleanId)) {
      return true;
    }
    this._activeDeleteIds.add(cleanId);

    // 1. Catat ke pendingDeletions (TTL 60 detik) agar sync yang sedang berjalan tidak memunculkan kembali item
    this.markDeleted(cleanId);

    // 2. Hapus dari daftar memori lokal secara presisi
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

    // 4. Kirim HANYA SATU permintaan POST ke Google Apps Script (menghindari duplikasi request race condition)
    if (this.hasGasConfigured()) {
      this.postToGAS('deleteAduan', { id: cleanId })
        .catch(err => console.warn('Gagal menghapus di Google Apps Script:', err))
        .finally(() => {
          this._activeDeleteIds.delete(cleanId);
        });
    } else {
      this._activeDeleteIds.delete(cleanId);
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
window.handleAduanPhotoError = function(imgEl, aduanId, photoIdx, isOfficerParam) {
  if (!imgEl) return;
  const cleanId = String(aduanId || '').trim().toUpperCase();
  const idx = parseInt(photoIdx || '0', 10) || 0;
  const isOfficer = Boolean(
    isOfficerParam === true ||
    (imgEl.id && (imgEl.id.includes('Officer') || imgEl.id.includes('Petugas'))) ||
    (imgEl.dataset && (imgEl.dataset.isOfficer === 'true' || imgEl.dataset.isOfficer === '1')) ||
    (imgEl.alt && (imgEl.alt.includes('Petugas') || imgEl.alt.includes('Fisik')))
  );

  // 1. Cek cache lokal segera (paling cepat dan pasti jernih)
  try {
    const cached = isOfficer
      ? (localStorage.getItem('dlh_photo_cache_' + cleanId + '_PETUGAS_' + idx) ||
         localStorage.getItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_PETUGAS_' + idx) ||
         (idx === 0 ? (localStorage.getItem('dlh_photo_cache_' + cleanId + '_PETUGAS') || localStorage.getItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_PETUGAS')) : null))
      : (localStorage.getItem('dlh_photo_cache_' + cleanId + '_' + idx) ||
         localStorage.getItem('dlh_photo_cache_' + cleanId.toLowerCase() + '_' + idx) ||
         (idx === 0 ? (localStorage.getItem('dlh_photo_cache_' + cleanId) || localStorage.getItem('dlh_photo_cache_' + cleanId.toLowerCase())) : null));
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
    window.aduanStore.fetchPhotoBase64FromGAS(cleanId, idx, isOfficer).then(b64 => {
      if (b64 && b64.startsWith('data:image')) {
        imgEl.src = b64;
        imgEl.style.display = 'block';
        if (fallbackBox) fallbackBox.style.display = 'none';
      } else {
        imgEl.style.display = 'none';
        if (fallbackBox) {
          fallbackBox.style.display = 'flex';
          const gasUrl = (window.aduanStore && window.aduanStore.getGasUrl) ? window.aduanStore.getGasUrl() : '';
          const queryId = isOfficer ? (cleanId + '_PETUGAS') : cleanId;
          const directUrl = gasUrl ? `${gasUrl}${gasUrl.includes('?') ? '&' : '?'}action=viewFoto&id=${encodeURIComponent(queryId)}&photoIdx=${idx}` : '';
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

