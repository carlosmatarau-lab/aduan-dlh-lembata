/**
 * ===================================================================
 * SILAPOR DLH KABUPATEN LEMBATA — MAIN JAVASCRIPT CONTROLLER
 * Ringan, Cepat, Responsif & Siap Digunakan Masyarakat
 * ===================================================================
 */

// Konfigurasi Domain Web Aplikasi untuk Tautan Lacak Otomatis WhatsApp
const DOMAIN_WEB = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file'))
  ? window.location.origin
  : "https://aduan-dlh-lembata.vercel.app"; // Sesuaikan dengan domain Anda
const APP_BASE_URL = DOMAIN_WEB;

class DLHApp {
  constructor() {
    this.currentTab = 'beranda';
    this.tableFilters = {
      search: '',
      kecamatan: 'all',
      status: 'all'
    };
  }

  init() {
    try { this.setupNavigation(); } catch (e) { console.warn('setupNavigation error:', e); }
    try { this.setupCategoryChips(); } catch (e) { console.warn('setupCategoryChips error:', e); }
    try { this.setupKecamatanDesaSync(); } catch (e) { console.warn('setupKecamatanDesaSync error:', e); }
    try { this.setupPhoneValidation(); } catch (e) { console.warn('setupPhoneValidation error:', e); }
    try { this.setupDynamicRiwayatInstansi(); } catch (e) { console.warn('setupDynamicRiwayatInstansi error:', e); }
    try { this.setupFormSubmissions(); } catch (e) { console.warn('setupFormSubmissions error:', e); }
    try { this.setupGPSDetection(); } catch (e) { console.warn('setupGPSDetection error:', e); }
    try { this.setupUploadPreview(); } catch (e) { console.warn('setupUploadPreview error:', e); }
    try { this.setupTableAndFilters(); } catch (e) { console.warn('setupTableAndFilters error:', e); }
    try { this.setupQuickTracker(); } catch (e) { console.warn('setupQuickTracker error:', e); }
    try { this.setupModals(); } catch (e) { console.warn('setupModals error:', e); }
    try { this.setupCloudSync(); } catch (e) { console.warn('setupCloudSync error:', e); }
    try { this.setupRealtimeSync(); } catch (e) { console.warn('setupRealtimeSync error:', e); }
    try { this.updateKPIs(); } catch (e) { console.warn('updateKPIs error:', e); }
    try { this.renderTable(); } catch (e) { console.warn('renderTable error:', e); }

    // Set default date to today
    try {
      const dateInput = document.getElementById('inputTanggalKejadian');
      if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
      }
    } catch (e) {}

    // Init map with slight delay
    setTimeout(() => {
      try {
        if (window.lembataMap) window.lembataMap.init();
      } catch (e) { console.warn('lembataMap.init error:', e); }
    }, 150);

    // Dukungan deep link tab via URL hash (#pane-form / #pane-lacak) atau query (?tab=form)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const targetTab = urlParams.get('tab') || window.location.hash.replace('#', '').replace('pane-', '');
      if (targetTab && ['beranda', 'form', 'lapor', 'lacak', 'peta'].includes(targetTab)) {
        setTimeout(() => this.switchTab(targetTab), 100);
      }
    } catch(e) {}

    // Buka otomatis detail/foto aduan jika dibuka dari tautan WhatsApp (?lihatFoto=ADU-LMB-...)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const targetFoto = urlParams.get('lihatFoto') || urlParams.get('foto');
      if (targetFoto) {
        setTimeout(async () => {
          let item = window.aduanStore.getById(targetFoto);
          if (!item && window.aduanStore && window.aduanStore.hasGasConfigured()) {
            this.showToast(`Mengambil data aduan ${targetFoto} dari server DLH...`, 'info');
            await window.aduanStore.syncFromGAS(true);
            item = window.aduanStore.getById(targetFoto);
          }
          if (item) {
            this.showDetailModal(targetFoto);
          } else {
            this.showToast(`Nomor aduan ${targetFoto} sedang diproses di sistem DLH.`, 'info');
          }
        }, 350);
      }
    } catch (e) {}
  }

  getStatusBadgeClass(status) {
    if (!status) return 'badge-aduan-diterima';
    return 'badge-' + status.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  }

  /* ===================================================================
     1. NAVIGATION TABS
     =================================================================== */
  setupNavigation() {
    const tabs = document.querySelectorAll('.nav-tab-btn[data-tab]');
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        this.switchTab(target);
      });
    });
  }

  switchTab(tabName) {
    // Dukungan alias tab untuk kompatibilitas
    if (tabName === 'lapor' || tabName === 'aduan') tabName = 'form';
    if (tabName === 'tracker') tabName = 'lacak';
    this.currentTab = tabName;

    // Update active nav buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      const btnTab = btn.getAttribute('data-tab');
      if (btnTab === tabName || (tabName === 'form' && btnTab === 'lapor')) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update active content panes
    document.querySelectorAll('.tab-content').forEach(pane => {
      pane.classList.remove('active');
    });

    const targetPane = document.getElementById(`pane-${tabName}`) || (tabName === 'form' ? document.getElementById('pane-lapor') : null);
    if (targetPane) {
      targetPane.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Refresh pin map pemilih lokasi jika masuk ke tab form
    if (tabName === 'form') {
      setTimeout(() => {
        if (typeof this.initCitizenPinMap === 'function') {
          this.initCitizenPinMap();
        }
      }, 150);
    }

    // Refresh mini map jika kembali ke tab beranda
    if (tabName === 'beranda' && window.lembataMap && window.lembataMap.miniMapInstance) {
      setTimeout(() => {
        try { window.lembataMap.miniMapInstance.invalidateSize(); } catch(e) {}
      }, 100);
    }

    // Refresh map when entering peta tab
    if (tabName === 'peta' && window.lembataMap) {
      setTimeout(() => {
        if (window.lembataMap.map) {
          window.lembataMap.map.invalidateSize();
          if (typeof window.lembataMap.resetMapView === 'function') {
            window.lembataMap.resetMapView();
          }
          window.lembataMap.renderMarkers();
        } else {
          window.lembataMap.init();
        }
      }, 100);
    }
  }

  /* ===================================================================
     2. CATEGORY CHIPS SELECTION
     =================================================================== */
  setupCategoryChips() {
    const chips = document.querySelectorAll('.chip-item');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const radio = chip.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      });
    });
  }

  /* ===================================================================
     2B. KECAMATAN & DESA/KELURAHAN CASCADE SELECTOR
     =================================================================== */
  setupKecamatanDesaSync() {
    const kecSelect = document.getElementById('inputKecamatan');
    const desaSelect = document.getElementById('inputDesa');
    if (!kecSelect || !desaSelect) return;

    // Sumber data wilayah komprehensif 9 Kecamatan Kabupaten Lembata (fail-safe)
    const LEMBATA_VILLAGES_FALLBACK = {
      'Nubatukan': ['Bakalerek', 'Baolangu', 'Belobatang', 'Bour', 'Lewoleba (Kelurahan)', 'Lewoleba Barat (Kelurahan)', 'Lewoleba Selatan (Kelurahan)', 'Lewoleba Tengah (Kelurahan)', 'Lewoleba Timur (Kelurahan)', 'Lewoleba Utara (Kelurahan)', 'Lite Ulumado', 'Nubamado', 'Nubatukan', 'Pada', 'Paubokol', 'Selandoro (Kelurahan)', 'Udak Melomata', 'Waijarang'],
      'Ile Ape': ['Amakaka', 'Beutaran', 'Bungamuda', 'Dulitukan', 'Kolipadan', 'Kolontobo', 'Lamawara', 'Laranwutun', 'Muruona', 'Napasabok', 'Palilolon', 'Petuntawa', 'Riangbao', 'Tagawiti', 'Tanjung Batu', 'Waipukang', 'Waowala', 'Watodiri'],
      'Ile Ape Timur': ['Aulesa', 'Bao Lai Duli', 'Jontona', 'Lamaau', 'Lamagute', 'Lamatokan', 'Lamawolo', 'Todanara', 'Waimatan'],
      'Lebatukan': ['Atakore', 'Balurebong', 'Baopana', 'Belobao', 'Dikesare', 'Hadakewa', 'Lamalela', 'Lamatuka', 'Lerahinga', 'Lewoeleng', 'Lodoblolong', 'Merdeka', 'Seranggorang', 'Tapobaran', 'Tapolangu', 'Waienga', 'Wangatoa'],
      'Nagawutung': ['Babokerong', 'Baobolak', 'Belabaja', 'Boli Bean', 'Duawutun', 'Idalolong', 'Ileboli', 'Labalimut', 'Liwulagang', 'Lolong', 'Lusilame', 'Pasir Putih', 'Penikene', 'Riabao', 'Tewaowutung', 'Warawatung', 'Wuakerong'],
      'Wulandoni': ['Alap Atadei', 'Ataili', 'Atakera', 'Belobao', 'Imulolong', 'Lamalera A', 'Lamalera B', 'Leworaja', 'Mulankera', 'Pantai Harapan', 'Pora', 'Posiwatu', 'Puor', 'Puor B', 'Tapobali', 'Wulandoni'],
      'Atadei': ['Atalojo', 'Doripewut', 'Dulir', 'Ile Kerbau', 'Ile Kimok', 'Kalikasa', 'Katakeja', 'Lebewala', 'Lerek', 'Lewogroma', 'Lusilame', 'Nogo Doni', 'Nubahaeraka', 'Tubuk Rajan', 'Watuwawer'],
      'Omesuri': ['Aramaba', 'Balauring', 'Dolulolong', 'Hingalamamengi', 'Hoelea I', 'Hoelea II', 'Lebewala', 'Leubatang', 'Leudanung', 'Leuwayang', 'Mahal I', 'Mahal II', 'Meluwiting', 'Meluwiting I', 'Nilanapo', 'Normal', 'Normal I', 'Peusawa', 'Roma', 'Wailolong', 'Walangsawa', 'Wowong'],
      'Buyasuri': ['Atulaleng', 'Atuwalupang', 'Bareng', 'Bean', 'Benihading I', 'Benihading II', 'Buriwutung', 'Kalikur', 'Kalikur WL', 'Kaohua', 'Leuburi', 'Leuwohung', 'Loyobohor', 'Mampir', 'Panama', 'Roho', 'Rumang', 'Tobotani', 'Tubungwalang', 'Umaleu', 'Wairiang']
    };

    this.populateDesaDropdown = (kecamatanName, selectedDesa = '') => {
      desaSelect.innerHTML = '<option value="">-- Pilih Desa / Kelurahan --</option>';
      
      const kecMap = (typeof KECAMATAN_LEMBATA !== 'undefined' ? KECAMATAN_LEMBATA : (window.KECAMATAN_LEMBATA || null));
      let desaList = [];

      if (kecMap && kecMap[kecamatanName] && Array.isArray(kecMap[kecamatanName].desa)) {
        desaList = kecMap[kecamatanName].desa;
      } else if (LEMBATA_VILLAGES_FALLBACK[kecamatanName]) {
        desaList = LEMBATA_VILLAGES_FALLBACK[kecamatanName];
      }

      if (Array.isArray(desaList) && desaList.length > 0) {
        // Otomatis pilih desa pertama di kecamatan tersebut jika belum ada desa yang dipilih
        if (!selectedDesa || selectedDesa === '' || selectedDesa === '-- Pilih Desa / Kelurahan --' || selectedDesa.startsWith('--')) {
          selectedDesa = desaList[0];
        }

        desaList.forEach(namaDesa => {
          const opt = document.createElement('option');
          opt.value = namaDesa;
          opt.textContent = namaDesa;
          if (selectedDesa && namaDesa.toLowerCase() === selectedDesa.toLowerCase()) {
            opt.selected = true;
          }
          desaSelect.appendChild(opt);
        });

        desaSelect.value = selectedDesa;
      }

      // Langsung sesuaikan pin lokasi peta ke kecamatan atau desa terpilih
      if (typeof this.updateCitizenPinForLocation === 'function') {
        this.updateCitizenPinForLocation(kecamatanName, selectedDesa);
      }
    };

    window.populateDesaDropdown = this.populateDesaDropdown.bind(this);
    window.updateCitizenPinForLocation = this.updateCitizenPinForLocation.bind(this);

    // Populasi awal berdasarkan nilai awal kecamatan
    const initialKec = kecSelect.value || 'Nubatukan';
    this.populateDesaDropdown(initialKec, desaSelect.value || '');

    // Event saat kecamatan diubah
    kecSelect.addEventListener('change', (e) => {
      this.populateDesaDropdown(e.target.value);
    });

    // Event saat desa dipilih
    desaSelect.addEventListener('change', (e) => {
      if (typeof this.updateCitizenPinForLocation === 'function') {
        this.updateCitizenPinForLocation(kecSelect.value, e.target.value);
      }
    });
  }

  /* ===================================================================
     2C. VALIDASI INPUT NOMOR WHATSAPP / HP
     =================================================================== */
  validatePhoneNumber(phoneStr) {
    if (!phoneStr) {
      return { valid: false, message: 'Nomor WhatsApp wajib diisi.' };
    }

    // Bersihkan spasi, tanda strip, titik, dan kurung
    const clean = phoneStr.trim().replace(/[\s\-\.\(\)]/g, '');

    // Cek apakah diawali 08, +628, 628, atau 8 (seluler Indonesia)
    const startsWith08 = /^08\d+$/.test(clean);
    const startsWithPlus62 = /^\+628\d+$/.test(clean);
    const startsWith62 = /^628\d+$/.test(clean);
    const startsWith8 = /^8\d+$/.test(clean);

    if (!startsWith08 && !startsWithPlus62 && !startsWith62 && !startsWith8) {
      return {
        valid: false,
        message: 'Nomor wajib diawali angka 08 atau +62 (contoh: 081234567890)'
      };
    }

    // Hitung total digit angka murni
    const digitsOnly = clean.replace(/\D/g, '');
    const minDigits = startsWith8 ? 9 : 10;
    if (digitsOnly.length < minDigits) {
      return {
        valid: false,
        message: `Nomor terlalu pendek (${digitsOnly.length} digit). Minimal ${minDigits} digit angka.`
      };
    }

    if (digitsOnly.length > 15) {
      return {
        valid: false,
        message: `Nomor terlalu panjang (${digitsOnly.length} digit). Maksimal 15 digit angka.`
      };
    }

    return {
      valid: true,
      message: '✓ Nomor WhatsApp valid dan siap digunakan.',
      cleanNumber: clean
    };
  }

  setupPhoneValidation() {
    const inputNoHp = document.getElementById('inputNoHp');
    const msgEl = document.getElementById('noHpValidationMsg');
    if (!inputNoHp) return;

    const runValidation = (isBlur = false) => {
      const val = inputNoHp.value.trim();
      if (!val) {
        inputNoHp.classList.remove('input-invalid', 'input-valid');
        if (msgEl) {
          msgEl.style.display = isBlur ? 'block' : 'none';
          msgEl.className = 'input-validation-msg msg-error';
          msgEl.textContent = isBlur ? 'Nomor WhatsApp wajib diisi agar petugas dapat menghubungi Anda.' : '';
        }
        return false;
      }

      const res = this.validatePhoneNumber(val);
      if (res.valid) {
        inputNoHp.classList.remove('input-invalid');
        inputNoHp.classList.add('input-valid');
        if (msgEl) {
          msgEl.style.display = 'block';
          msgEl.className = 'input-validation-msg msg-success';
          msgEl.textContent = res.message;
        }
        return true;
      } else {
        inputNoHp.classList.remove('input-valid');
        inputNoHp.classList.add('input-invalid');
        if (msgEl) {
          msgEl.style.display = 'block';
          msgEl.className = 'input-validation-msg msg-error';
          msgEl.textContent = res.message;
        }
        return false;
      }
    };

    inputNoHp.addEventListener('input', () => runValidation(false));
    inputNoHp.addEventListener('blur', () => runValidation(true));
  }

  /* ===================================================================
     2D. SISTEM DINAMIS RIWAYAT PENGADUAN INSTANSI (+ TAMBAH / HAPUS)
     =================================================================== */
  setupDynamicRiwayatInstansi() {
    const container = document.getElementById('riwayatCardsContainer');
    const btnAdd = document.getElementById('btnAddRiwayat');
    const countHint = document.getElementById('riwayatCountHint');
    if (!container || !btnAdd) return;

    const MAX_RIWAYAT = 5;

    const getCardTitle = (idx) => {
      if (idx === 1) return 'Instansi Pertama';
      if (idx === 2) return 'Instansi Kedua';
      if (idx === 3) return 'Instansi Ketiga';
      if (idx === 4) return 'Instansi Keempat';
      if (idx === 5) return 'Instansi Kelima';
      return `Instansi Ke-${idx}`;
    };

    const updateState = () => {
      const cards = container.querySelectorAll('.riwayat-card-item');
      const count = cards.length;

      cards.forEach((card, idx) => {
        const num = idx + 1;
        const badgeNum = card.querySelector('.riwayat-badge-num');
        const badgeTitle = card.querySelector('.riwayat-badge-title');
        const removeBtn = card.querySelector('.btn-remove-riwayat');
        const nameInput = card.querySelector('.riwayat-instansi-nama');
        const tglInput = card.querySelector('.riwayat-instansi-tgl');

        if (badgeNum) badgeNum.textContent = num;
        if (badgeTitle) badgeTitle.textContent = getCardTitle(num);
        if (nameInput) {
          nameInput.id = `inputInstansi${num}`;
          nameInput.placeholder = num === 1
            ? 'Contoh: Kantor Desa / Polsek / DLH Provinsi'
            : `Nama instansi ke-${num} (jika ada)`;
        }
        if (tglInput) tglInput.id = `inputTglInstansi${num}`;

        // Kartu pertama tidak menampilkan tombol hapus
        if (removeBtn) {
          removeBtn.style.display = (num > 1) ? 'inline-flex' : 'none';
        }
      });

      if (countHint) {
        if (count >= MAX_RIWAYAT) {
          countHint.textContent = `Maksimal ${MAX_RIWAYAT} instansi tercapai`;
          countHint.style.color = '#059669';
        } else {
          countHint.textContent = `Dapat menambahkan hingga ${MAX_RIWAYAT} instansi (${count}/${MAX_RIWAYAT})`;
          countHint.style.color = '#64748b';
        }
      }

      if (btnAdd) {
        if (count >= MAX_RIWAYAT) {
          btnAdd.style.display = 'none';
        } else {
          btnAdd.style.display = 'inline-flex';
          btnAdd.disabled = false;
        }
      }
    };

    this.addRiwayatCard = () => {
      const currentCards = container.querySelectorAll('.riwayat-card-item');
      if (currentCards.length >= MAX_RIWAYAT) return;

      const newIndex = currentCards.length + 1;
      const cardEl = document.createElement('div');
      cardEl.className = 'riwayat-card-item animate-card-in';
      cardEl.innerHTML = `
        <div class="riwayat-card-header">
          <div class="riwayat-card-badge">
            <span class="riwayat-badge-num">${newIndex}</span>
            <span class="riwayat-badge-title">${getCardTitle(newIndex)}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button type="button" class="btn-remove-riwayat" title="Hapus baris instansi ini">✕ Hapus</button>
            <span class="riwayat-badge-hint">Opsional</span>
          </div>
        </div>
        <div class="riwayat-card-body">
          <div class="riwayat-field-group riwayat-field-instansi">
            <label class="riwayat-sublabel" for="inputInstansi${newIndex}">Nama Instansi</label>
            <input type="text" id="inputInstansi${newIndex}" class="input-text riwayat-instansi-nama riwayat-instansi" placeholder="Nama instansi ke-${newIndex} (jika ada)">
          </div>
          <div class="riwayat-field-group riwayat-field-tanggal">
            <label class="riwayat-sublabel" for="inputTglInstansi${newIndex}">Tanggal / Bulan / Tahun</label>
            <input type="date" id="inputTglInstansi${newIndex}" class="input-text riwayat-instansi-tgl riwayat-tanggal">
          </div>
        </div>
      `;

      const removeBtn = cardEl.querySelector('.btn-remove-riwayat');
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          cardEl.remove();
          updateState();
        });
      }

      container.appendChild(cardEl);
      updateState();

      // Focus ke input instansi baru
      setTimeout(() => {
        const input = cardEl.querySelector('.riwayat-instansi-nama');
        if (input) input.focus();
      }, 50);
    };

    btnAdd.addEventListener('click', (e) => {
      e.preventDefault();
      this.addRiwayatCard();
    });

    // Pasang listener pada remove button kartu bawaan jika ada
    container.querySelectorAll('.btn-remove-riwayat').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const card = btn.closest('.riwayat-card-item');
        if (card) {
          card.remove();
          updateState();
        }
      });
    });

    this.resetRiwayatCards = () => {
      const cards = container.querySelectorAll('.riwayat-card-item');
      cards.forEach((card, idx) => {
        if (idx === 0) {
          const nm = card.querySelector('.riwayat-instansi-nama');
          const tg = card.querySelector('.riwayat-instansi-tgl');
          if (nm) nm.value = '';
          if (tg) tg.value = '';
        } else {
          card.remove();
        }
      });
      updateState();
    };

    updateState();
  }

  /* ===================================================================
     3. GPS DETECTION & INTERACTIVE PIN LOCATION MAP
     =================================================================== */
  initCitizenPinMap() {
    const mapContainer = document.getElementById('citizenPinMap');
    if (!mapContainer || typeof L === 'undefined') return;

    if (this.citizenPinMap) {
      try {
        this.citizenPinMap.invalidateSize();
      } catch (e) {}
      return;
    }

    const latInput = document.getElementById('inputLat');
    const lngInput = document.getElementById('inputLng');
    const badge = document.getElementById('pinCoordsBadge');

    let initialLat = parseFloat(latInput?.value) || -8.375000;
    let initialLng = parseFloat(lngInput?.value) || 123.418000;

    this.citizenPinMap = L.map('citizenPinMap', {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([initialLat, initialLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> kontributor'
    }).addTo(this.citizenPinMap);

    const pinIcon = L.divIcon({
      className: 'custom-citizen-pin',
      html: `
        <div style="position: relative; width: 34px; height: 34px; transform: translate(-50%, -100%);">
          <div style="background: #ef4444; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4); border: 2.5px solid #ffffff;">
            <div style="width: 10px; height: 10px; background: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
          </div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 34]
    });

    this.citizenPinMarker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: pinIcon
    }).addTo(this.citizenPinMap);

    const updateCoords = (lat, lng, doPan = false) => {
      const fixedLat = Number(lat.toFixed(6));
      const fixedLng = Number(lng.toFixed(6));
      if (latInput) latInput.value = fixedLat;
      if (lngInput) lngInput.value = fixedLng;
      if (badge) badge.textContent = `${fixedLat}, ${fixedLng}`;
      if (doPan && this.citizenPinMap) {
        this.citizenPinMap.setView([fixedLat, fixedLng], Math.max(this.citizenPinMap.getZoom(), 15));
      }
    };

    updateCoords(initialLat, initialLng);

    this.citizenPinMarker.on('drag', (e) => {
      const pos = e.target.getLatLng();
      updateCoords(pos.lat, pos.lng, false);
    });

    this.citizenPinMarker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      updateCoords(pos.lat, pos.lng, false);
      const gpsMsg = document.getElementById('gpsStatusMessage');
      if (gpsMsg) {
        gpsMsg.style.display = 'block';
        gpsMsg.style.color = '#15803d';
        gpsMsg.textContent = `📍 Pin digeser ke titik: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
      }
    });

    this.citizenPinMap.on('click', (e) => {
      this.citizenPinMarker.setLatLng(e.latlng);
      updateCoords(e.latlng.lat, e.latlng.lng, false);
      const gpsMsg = document.getElementById('gpsStatusMessage');
      if (gpsMsg) {
        gpsMsg.style.display = 'block';
        gpsMsg.style.color = '#15803d';
        gpsMsg.textContent = `📍 Titik ditandai di: ${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`;
      }
    });

    // Sinkronisasi saat dropdown kecamatan atau desa diubah
    const selectKec = document.getElementById('inputKecamatan');
    const selectDesa = document.getElementById('inputDesa');

    if (selectKec) {
      selectKec.addEventListener('change', () => {
        this.updateCitizenPinForLocation(selectKec.value, selectDesa ? selectDesa.value : '');
      });
    }

    if (selectDesa) {
      selectDesa.addEventListener('change', () => {
        this.updateCitizenPinForLocation(selectKec ? selectKec.value : '', selectDesa.value);
      });
    }

    // Input manual koordinat
    const handleManualCoordInput = () => {
      const latVal = parseFloat(latInput?.value);
      const lngVal = parseFloat(lngInput?.value);
      if (!isNaN(latVal) && !isNaN(lngVal)) {
        this.citizenPinMarker.setLatLng([latVal, lngVal]);
        this.citizenPinMap.panTo([latVal, lngVal]);
        if (badge) badge.textContent = `${latVal.toFixed(6)}, ${lngVal.toFixed(6)}`;
      }
    };
    if (latInput) latInput.addEventListener('input', handleManualCoordInput);
    if (lngInput) lngInput.addEventListener('input', handleManualCoordInput);
  }

  /* ===================================================================
     3A. AUTO-ALIGNMENT PIN PETA BERDASARKAN KECAMATAN & DESA (PRESISI TINGGI)
     =================================================================== */
  updateCitizenPinForLocation(kec, desa) {
    const coordsMap = {
      'Nubatukan': [-8.375000, 123.418000],
      'Ile Ape': [-8.321400, 123.472600],
      'Ile Ape Timur': [-8.244300, 123.494800],
      'Lebatukan': [-8.370700, 123.547400],
      'Nagawutung': [-8.490000, 123.360000],
      'Wulandoni': [-8.531900, 123.451000],
      'Atadei': [-8.434100, 123.468100],
      'Omesuri': [-8.233600, 123.706000],
      'Buyasuri': [-8.192400, 123.820400]
    };

    const desaDict = (typeof window !== 'undefined' && window.DESA_COORDINATES) ? window.DESA_COORDINATES : (typeof DESA_COORDINATES !== 'undefined' ? DESA_COORDINATES : {});
    const rawDesa = String(desa || '').trim();
    const cleanDesa = rawDesa.toLowerCase().replace(/\s*\(kelurahan\)|\s*\(desa\)/gi, '').trim();

    let target = null;
    let locationLabel = '';
    let targetZoom = 14;

    if (rawDesa && rawDesa !== '-- Pilih Desa / Kelurahan --' && !rawDesa.startsWith('--')) {
      const lowerRaw = rawDesa.toLowerCase();
      const scopedKey = String(kec || '').trim().toLowerCase() + '::' + lowerRaw;
      // 0. Kunci terikat kecamatan (menghindari tabrakan nama desa yang sama di kecamatan berbeda)
      if (desaDict[scopedKey]) {
        target = [desaDict[scopedKey].lat, desaDict[scopedKey].lng];
      // 1. Exact match ke DESA_COORDINATES terlebih dahulu (tanpa .includes())
      } else if (desaDict[lowerRaw]) {
        target = [desaDict[lowerRaw].lat, desaDict[lowerRaw].lng];
      } else if (cleanDesa && desaDict[cleanDesa]) {
        target = [desaDict[cleanDesa].lat, desaDict[cleanDesa].lng];
      } else {
        // Fallback parsial HANYA jika exact match benar-benar tidak ditemukan
        for (const [key, val] of Object.entries(desaDict)) {
          if (cleanDesa && (key.includes(cleanDesa) || cleanDesa.includes(key))) {
            target = [val.lat, val.lng];
            break;
          }
        }
      }

      if (target) {
        locationLabel = `Desa/Kel. ${rawDesa}, Kec. ${kec || 'Lembata'}`;
        targetZoom = 16; // Tingkat ketelitian sangat tinggi (skala desa)
      }
    }

    if (!target && kec && coordsMap[kec]) {
      target = coordsMap[kec];
      locationLabel = `Pusat Kecamatan ${kec}`;
      targetZoom = 14;
    }

    if (!target) {
      target = coordsMap['Nubatukan'];
      locationLabel = 'Kota Lewoleba (Nubatukan)';
      targetZoom = 14;
    }

    const latInput = document.getElementById('inputLat');
    const lngInput = document.getElementById('inputLng');
    const badge = document.getElementById('pinCoordsBadge');
    const gpsMsg = document.getElementById('gpsStatusMessage');

    const fixedLat = Number(target[0].toFixed(6));
    const fixedLng = Number(target[1].toFixed(6));

    if (latInput) latInput.value = fixedLat;
    if (lngInput) lngInput.value = fixedLng;
    if (badge) badge.textContent = `${fixedLat}, ${fixedLng}`;

    if (gpsMsg) {
      gpsMsg.style.display = 'block';
      gpsMsg.style.color = '#15803d';
      gpsMsg.textContent = `🎯 Presisi Tinggi: Pin diselaraskan otomatis ke ${locationLabel} (${fixedLat}, ${fixedLng})`;
    }

    if (!this.citizenPinMap && typeof this.initCitizenPinMap === 'function') {
      try { this.initCitizenPinMap(); } catch(e) {}
    }

    if (this.citizenPinMap) {
      if (this.citizenPinMarker) {
        try {
          this.citizenPinMarker.setLatLng([fixedLat, fixedLng]);
          const popupHtml = `<div style="font-family: inherit; font-size: 12px; font-weight: 700; color: #064e3b; text-align: center; padding: 2px 4px;">📍 ${locationLabel}</div>`;
          this.citizenPinMarker.bindPopup(popupHtml).openPopup();
        } catch (e) {}
      }
      try {
        const size = this.citizenPinMap.getSize();
        if (size && size.x > 30 && size.y > 30) {
          this.citizenPinMap.flyTo([fixedLat, fixedLng], targetZoom, { duration: 0.8 });
        } else {
          this.citizenPinMap.setView([fixedLat, fixedLng], targetZoom);
        }
      } catch (err) {
        try { this.citizenPinMap.setView([fixedLat, fixedLng], targetZoom); } catch(e) {}
      }
      setTimeout(() => {
        if (this.citizenPinMap) {
          try { this.citizenPinMap.invalidateSize(); } catch(e) {}
        }
      }, 200);
    }
  }

  setupGPSDetection() {
    const btnGps = document.getElementById('btnDetectGps');
    const gpsMsg = document.getElementById('gpsStatusMessage');
    if (!btnGps) return;

    btnGps.addEventListener('click', () => {
      if (!navigator.geolocation) {
        if (gpsMsg) {
          gpsMsg.style.display = 'block';
          gpsMsg.style.color = '#e11d48';
          gpsMsg.textContent = 'Perangkat Anda belum mendukung sensor satelit GPS.';
        }
        return;
      }

      btnGps.disabled = true;
      btnGps.innerHTML = '<span>⏳</span> Mengunci Satelit GPS Presisi Tinggi...';
      if (gpsMsg) {
        gpsMsg.style.display = 'block';
        gpsMsg.style.color = '#0284c7';
        gpsMsg.textContent = 'Menghubungkan satelit GPS & meningkatkan ketepatan koordinat...';
      }

      let bestPosition = null;
      let watchId = null;

      const finishGps = (pos) => {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
        }

        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy || 10);

        document.getElementById('inputLat').value = lat;
        document.getElementById('inputLng').value = lng;

        const badge = document.getElementById('pinCoordsBadge');
        if (badge) badge.textContent = `${lat}, ${lng}`;

        if (this.citizenPinMarker && this.citizenPinMap) {
          this.citizenPinMarker.setLatLng([lat, lng]);
          this.citizenPinMap.setView([lat, lng], 16);
          try { this.citizenPinMap.invalidateSize(); } catch(e) {}
        } else if (typeof this.initCitizenPinMap === 'function') {
          this.initCitizenPinMap();
          if (this.citizenPinMarker && this.citizenPinMap) {
            this.citizenPinMarker.setLatLng([lat, lng]);
            this.citizenPinMap.setView([lat, lng], 16);
          }
        }

        btnGps.disabled = false;
        btnGps.innerHTML = '<span>✅</span> Titik GPS Terkunci';
        btnGps.style.background = '#dcfce7';
        btnGps.style.borderColor = '#16a34a';
        btnGps.style.color = '#15803d';

        if (gpsMsg) {
          gpsMsg.style.color = '#15803d';
          gpsMsg.textContent = `🎯 Sangat Akurat! Koordinat: ${lat}, ${lng} (Tingkat Presisi: ±${accuracy} meter)`;
        }
      };

      // Coba watchPosition selama 4.5 detik untuk mengambil sinyal akurasi terbaik
      try {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            if (!bestPosition || (pos.coords.accuracy && pos.coords.accuracy < bestPosition.coords.accuracy)) {
              bestPosition = pos;
            }
            if (pos.coords.accuracy && pos.coords.accuracy <= 15) {
              finishGps(pos);
            }
          },
          (err) => {
            console.warn('GPS watch error:', err);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } catch (e) {}

      setTimeout(() => {
        if (bestPosition) {
          finishGps(bestPosition);
        } else {
          // Fallback ke getCurrentPosition satu kali
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              finishGps(pos);
            },
            (err) => {
              if (watchId !== null) navigator.geolocation.clearWatch(watchId);
              btnGps.disabled = false;
              btnGps.innerHTML = '<span>🎯</span> Kunci GPS Presisi Tinggi';
              btnGps.style.background = '';
              btnGps.style.borderColor = '';
              btnGps.style.color = '';
              if (gpsMsg) {
                gpsMsg.style.color = '#d97706';
                gpsMsg.textContent = 'Sinyal satelit belum terkunci atau izin lokasi ditolak. Anda tetap dapat menggeser pin merah di peta untuk menentukan lokasi persis.';
              }
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
          );
        }
      }, 3500);
    });
  }

  /* ===================================================================
     3.4 PENGOMPRES & OPTIMASI MEDIA HANDAL (KAMERA & GALERI)
     Mendukung foto beresolusi tinggi (12-50MP) tanpa blocking & tanpa timeout 2 detik
     =================================================================== */
  async compressMediaFile(mediaItem, maxDim = 640, quality = 0.58) {
    if (!mediaItem) return null;
    if (typeof mediaItem === 'string') return mediaItem;

    // Jika sudah memiliki hasil kompresi dataUrl valid
    if (mediaItem.dataUrl && typeof mediaItem.dataUrl === 'string' && mediaItem.dataUrl.startsWith('data:image')) {
      return mediaItem.dataUrl;
    }

    // Jika sedang dalam proses kompresi background, tunggu promise-nya
    if (mediaItem.compressPromise) {
      try {
        const res = await mediaItem.compressPromise;
        if (res && typeof res === 'string' && res.startsWith('data:image')) {
          mediaItem.dataUrl = res;
          return res;
        }
      } catch (e) {}
    }

    const file = mediaItem.file || (mediaItem instanceof Blob ? mediaItem : null);
    if (!file || !(file instanceof Blob)) {
      return (typeof mediaItem === 'string') ? mediaItem : null;
    }

    // 1. Tangani file video jika ada (ambil thumbnail frame pada detik 0.5)
    if (file.type && file.type.startsWith('video/')) {
      return new Promise((resolve) => {
        try {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.muted = true;
          video.playsInline = true;
          const vUrl = URL.createObjectURL(file);
          video.src = vUrl;
          const timer = setTimeout(() => {
            try { URL.revokeObjectURL(vUrl); } catch (e) {}
            resolve(null);
          }, 8000);
          video.onloadeddata = () => { video.currentTime = 0.5; };
          video.onseeked = () => {
            clearTimeout(timer);
            try {
              const canvas = document.createElement('canvas');
              let width = video.videoWidth || 640;
              let height = video.videoHeight || 480;
              const maxV = 720;
              if (width > maxV || height > maxV) {
                if (width > height) { height = Math.round((height * maxV) / width); width = maxV; }
                else { width = Math.round((width * maxV) / height); height = maxV; }
              }
              canvas.width = width;
              canvas.height = height;
              canvas.getContext('2d').drawImage(video, 0, 0, width, height);
              URL.revokeObjectURL(vUrl);
              const vResult = canvas.toDataURL('image/jpeg', 0.7);
              if (mediaItem && typeof mediaItem === 'object') mediaItem.dataUrl = vResult;
              resolve(vResult);
            } catch (e) {
              URL.revokeObjectURL(vUrl);
              resolve(null);
            }
          };
          video.onerror = () => {
            clearTimeout(timer);
            URL.revokeObjectURL(vUrl);
            resolve(null);
          };
        } catch (e) {
          resolve(null);
        }
      });
    }

    // 2. Pendekatan Utama: createImageBitmap (Cepat, non-blocking di main thread)
    if (typeof window.createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(file);
        let width = bitmap.width;
        let height = bitmap.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0, width, height);
          bitmap.close();
          const dUrl = canvas.toDataURL('image/jpeg', quality);
          if (dUrl && dUrl.length > 50) {
            if (mediaItem && typeof mediaItem === 'object') mediaItem.dataUrl = dUrl;
            return dUrl;
          }
        }
      } catch (bmErr) {
        console.warn('createImageBitmap fallback ke Image/FileReader:', bmErr);
      }
    }

    // 3. Pendekatan Kedua & Ketiga: HTMLImageElement via URL.createObjectURL + Fail-safe FileReader
    return new Promise((resolve) => {
      let resolved = false;

      const finishOnce = (result) => {
        if (resolved) return;
        resolved = true;
        if (result && mediaItem && typeof mediaItem === 'object') {
          mediaItem.dataUrl = result;
        }
        resolve(result);
      };

      const fallbackToFileReader = () => {
        this._fallbackFileReader(file, (frResult) => {
          if (frResult && frResult.startsWith('data:image')) {
            // Coba kompresi kanvas sederhana dari DataURL
            try {
              const imgFallback = new Image();
              imgFallback.onload = () => {
                try {
                  const cv = document.createElement('canvas');
                  let w = imgFallback.naturalWidth || imgFallback.width || 640;
                  let h = imgFallback.naturalHeight || imgFallback.height || 480;
                  if (w > maxDim || h > maxDim) {
                    if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
                    else { w = Math.round((w * maxDim) / h); h = maxDim; }
                  }
                  cv.width = w;
                  cv.height = h;
                  const c = cv.getContext('2d');
                  c.drawImage(imgFallback, 0, 0, w, h);
                  finishOnce(cv.toDataURL('image/jpeg', quality));
                } catch (cvErr) {
                  finishOnce(frResult);
                }
              };
              imgFallback.onerror = () => finishOnce(frResult);
              imgFallback.src = frResult;
            } catch (e) {
              finishOnce(frResult);
            }
          } else {
            finishOnce(frResult);
          }
        });
      };

      try {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        const loadTimer = setTimeout(() => {
          try { URL.revokeObjectURL(objectUrl); } catch (e) {}
          fallbackToFileReader();
        }, 4000);

        img.onload = () => {
          clearTimeout(loadTimer);
          try {
            const canvas = document.createElement('canvas');
            let width = img.naturalWidth || img.width || 640;
            let height = img.naturalHeight || img.height || 480;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(objectUrl);
            finishOnce(canvas.toDataURL('image/jpeg', quality));
          } catch (cvErr) {
            URL.revokeObjectURL(objectUrl);
            fallbackToFileReader();
          }
        };

        img.onerror = () => {
          clearTimeout(loadTimer);
          URL.revokeObjectURL(objectUrl);
          fallbackToFileReader();
        };

        img.src = objectUrl;
      } catch (err) {
        fallbackToFileReader();
      }
    });
  }

  _fallbackFileReader(file, callback) {
    try {
      const reader = new FileReader();
      const t = setTimeout(() => callback(null), 6000);
      reader.onload = (ev) => {
        clearTimeout(t);
        callback(ev.target ? ev.target.result : null);
      };
      reader.onerror = () => {
        clearTimeout(t);
        callback(null);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      callback(null);
    }
  }

  formatPhotoUrl(src) {
    if (!src || typeof src !== 'string') return '';
    let clean = src.trim();
    if (clean.startsWith('=HYPERLINK')) {
      const m = clean.match(/=HYPERLINK\("([^"]+)"/i);
      if (m) clean = m[1];
    }
    if (clean.includes('Buka') && clean.includes('Foto Bukti')) return '';
    if (clean.startsWith('📸')) return '';
    if (clean.startsWith('data:image')) return clean;
    const driveMatch = clean.match(/(?:\/file\/d\/|[?&]id=)([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1200`;
    }
    if (clean.startsWith('http')) return clean;
    return '';
  }

  /* ===================================================================
     3.5 UPLOAD PREVIEW & LIVE CAMERA CAPTURE (DENGAN ANIMASI PROGRESS)
     =================================================================== */
  setupUploadPreview() {
    this.selectedMediaFiles = [];
    this.cameraStream = null;
    this.currentFacingMode = 'environment'; // Default kamera belakang

    const fileInput = document.getElementById('inputBuktiFoto');
    const cameraInput = document.getElementById('inputCameraCapture');
    const btnUpload = document.getElementById('btnUploadFoto');
    const btnOpenCam = document.getElementById('btnOpenLiveCamera');
    const previewList = document.getElementById('uploadPreviewList');
    const uploadZone = document.getElementById('uploadZone');
    const modalCamera = document.getElementById('modalLiveCamera');
    const videoView = document.getElementById('cameraVideoView');
    const btnSnap = document.getElementById('btnSnapPhoto');
    const btnSwitchCam = document.getElementById('btnSwitchCameraDirection');

    const animCard = document.getElementById('uploadAnimationCard');
    const animTitle = document.getElementById('uploadAnimTitle');
    const animStep = document.getElementById('uploadAnimStep');
    const animPercent = document.getElementById('uploadAnimPercent');
    const progressFill = document.getElementById('uploadProgressFill');
    const successBanner = document.getElementById('uploadSuccessBanner');
    const successDesc = document.getElementById('uploadSuccessDesc');

    let uploadAnimTimer = null;
    const triggerUploadAnimation = (count, onComplete) => {
      this.isUploadingPhotos = true;
      renderPreviews();

      if (!animCard) {
        this.isUploadingPhotos = false;
        renderPreviews();
        if (onComplete) onComplete();
        return;
      }

      if (uploadAnimTimer) clearInterval(uploadAnimTimer);
      if (successBanner) successBanner.style.display = 'none';

      animCard.style.display = 'block';
      try {
        animCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (e) {}

      let progress = 0;
      if (animPercent) animPercent.textContent = '0%';
      if (progressFill) progressFill.style.width = '0%';
      if (animTitle) animTitle.textContent = `Mengunggah & Memproses ${count} Bukti Foto...`;
      if (animStep) animStep.textContent = 'Menghubungkan berkas dari perangkat...';

      const startTime = Date.now();
      const totalDuration = 2400; // 2.4 detik durasi animasi upload mulus & realistis

      uploadAnimTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        progress = Math.min(100, Math.round((elapsed / totalDuration) * 100));

        if (progressFill) progressFill.style.width = `${progress}%`;
        if (animPercent) animPercent.textContent = `${progress}%`;

        if (progress < 25) {
          if (animStep) animStep.textContent = '📥 Membaca data gambar & metadata GPS...';
        } else if (progress < 60) {
          if (animStep) animStep.textContent = '⚙️ Mengompresi resolusi visual untuk kecepatan pelaporan...';
        } else if (progress < 90) {
          if (animStep) animStep.textContent = '🔒 Mengamankan data bukti digital ke sistem DLH...';
        } else {
          if (animStep) animStep.textContent = '✅ Memverifikasi integritas berkas foto...';
        }

        if (progress >= 100) {
          clearInterval(uploadAnimTimer);
          uploadAnimTimer = null;
          this.isUploadingPhotos = false;
          setTimeout(() => {
            animCard.style.display = 'none';
            if (successBanner) {
              successBanner.style.display = 'flex';
              if (successDesc) {
                successDesc.textContent = `${this.selectedMediaFiles.length} bukti foto berhasil diunggah dengan status sukses (siap dilampirkan).`;
              }
            }
            renderPreviews();
            this.showToast(`✅ ${count} Foto bukti berhasil diunggah! Status: Sukses.`, 'success');
            if (onComplete) onComplete();
          }, 350);
        }
      }, 45);
    };

    const renderPreviews = () => {
      if (!previewList) return;
      previewList.innerHTML = '';

      if (this.selectedMediaFiles.length === 0) {
        if (successBanner) successBanner.style.display = 'none';
        return;
      }

      this.selectedMediaFiles.forEach((media, idx) => {
        const item = document.createElement('div');
        item.className = 'upload-preview-item';

        const fileObj = media.file || (media instanceof Blob ? media : null);
        const isVideo = fileObj ? (fileObj.type && fileObj.type.startsWith('video/')) : false;

        if (!isVideo) {
          const img = document.createElement('img');
          img.src = media.previewUrl || media.dataUrl || (fileObj ? URL.createObjectURL(fileObj) : '');
          img.alt = 'Pratinjau Bukti Foto';
          item.appendChild(img);
        } else {
          item.innerHTML = '<span class="file-icon">🎥</span>';
        }

        // Badge Status: Mengunggah vs Sukses di tiap thumbnail
        const badgeSuccess = document.createElement('span');
        badgeSuccess.className = 'upload-preview-badge-success';
        if (this.isUploadingPhotos) {
          badgeSuccess.textContent = '⏳ Mengunggah...';
          badgeSuccess.style.background = 'rgba(2, 132, 199, 0.9)';
        } else {
          badgeSuccess.textContent = '✓ Sukses';
          badgeSuccess.style.background = 'rgba(5, 150, 105, 0.9)';
        }
        item.appendChild(badgeSuccess);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove-preview';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = 'Hapus';
        removeBtn.onclick = (e) => {
          e.stopPropagation();
          if (media.previewUrl && String(media.previewUrl).startsWith('blob:')) {
            try { URL.revokeObjectURL(media.previewUrl); } catch (e) {}
          }
          this.selectedMediaFiles.splice(idx, 1);
          renderPreviews();
          if (this.selectedMediaFiles.length > 0 && successBanner && successDesc) {
            successDesc.textContent = `${this.selectedMediaFiles.length} bukti foto terlampir dengan status sukses.`;
          }
        };
        item.appendChild(removeBtn);
        previewList.appendChild(item);
      });
    };

    const addFiles = (files) => {
      const incoming = Array.from(files);
      if (incoming.length === 0) return;

      let addedCount = 0;
      incoming.forEach(f => {
        if (this.selectedMediaFiles.length < 5) {
          const previewUrl = (f instanceof Blob) ? URL.createObjectURL(f) : (typeof f === 'string' ? f : '');
          const mediaItem = {
            file: f,
            dataUrl: null,
            previewUrl: previewUrl,
            isCompressing: true
          };

          // Optimasi otomatis langsung di latar belakang saat foto dipilih dari galeri/kamera
          mediaItem.compressPromise = this.compressMediaFile(mediaItem)
            .then(res => {
              if (res) mediaItem.dataUrl = res;
              mediaItem.isCompressing = false;
              renderPreviews();
              return res;
            })
            .catch(async (err) => {
              console.warn('Gagal optimasi foto latar belakang, fallback ke FileReader:', err);
              try {
                const recovered = await new Promise((r) => {
                  const reader = new FileReader();
                  reader.onload = (e) => r(e.target ? e.target.result : null);
                  reader.onerror = () => r(null);
                  reader.readAsDataURL(f);
                });
                if (recovered) mediaItem.dataUrl = recovered;
              } catch(e) {}
              mediaItem.isCompressing = false;
              renderPreviews();
              return mediaItem.dataUrl;
            });

          this.selectedMediaFiles.push(mediaItem);
          addedCount++;
        } else {
          this.showToast('Batas maksimal 5 foto bukti tercapai.', 'warning');
        }
      });

      renderPreviews();

      if (addedCount > 0) {
        triggerUploadAnimation(addedCount, () => {
          renderPreviews();
        });
      }
    };

    // 1. Pilih dari Galeri / Dokumen
    if (btnUpload && fileInput) {
      btnUpload.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
          addFiles(fileInput.files);
          fileInput.value = '';
        }
      });
    }

    // 2. Native Camera Capture (Fallback HP)
    if (cameraInput) {
      cameraInput.addEventListener('change', () => {
        if (cameraInput.files.length) {
          addFiles(cameraInput.files);
          cameraInput.value = '';
          this.showToast('Foto dari kamera berhasil ditambahkan!', 'success');
        }
      });
    }

    // 3. Live Web Camera Handler
    const stopCamera = () => {
      if (this.cameraStream) {
        this.cameraStream.getTracks().forEach(t => t.stop());
        this.cameraStream = null;
      }
      if (modalCamera) modalCamera.classList.remove('show');
    };

    const startCamera = async () => {
      if (this.selectedMediaFiles.length >= 5) {
        this.showToast('Maksimal 5 foto bukti sudah tercapai.', 'warning');
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback langsung ke input kamera bawaan HP
        if (cameraInput) cameraInput.click();
        return;
      }

      try {
        if (this.cameraStream) {
          this.cameraStream.getTracks().forEach(t => t.stop());
        }

        modalCamera.classList.add('show');
        const constraints = {
          video: {
            facingMode: { ideal: this.currentFacingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };

        this.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoView) {
          videoView.srcObject = this.cameraStream;
          await videoView.play();
        }
      } catch (err) {
        console.warn('Gagal membuka kamera via getUserMedia, beralih ke kamera native:', err);
        stopCamera();
        if (cameraInput) cameraInput.click();
      }
    };

    if (btnOpenCam) {
      btnOpenCam.addEventListener('click', startCamera);
    }

    if (btnSwitchCam) {
      btnSwitchCam.addEventListener('click', () => {
        this.currentFacingMode = (this.currentFacingMode === 'environment') ? 'user' : 'environment';
        startCamera();
      });
    }

    if (btnSnap) {
      btnSnap.addEventListener('click', () => {
        if (!videoView) return;
        const canvas = document.getElementById('cameraCanvasSnap') || document.createElement('canvas');
        canvas.width = videoView.videoWidth || 640;
        canvas.height = videoView.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoView, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            const snapFile = new File([blob], `bukti_kamera_${Date.now()}.jpg`, { type: 'image/jpeg' });
            addFiles([snapFile]);
            this.showToast('Foto bukti berhasil diambil dari kamera!', 'success');
          }
          stopCamera();
        }, 'image/jpeg', 0.88);
      });
    }

    // Tutup kamera saat tombol close/batal diklik
    document.querySelectorAll('.btn-close-camera').forEach(btn => {
      btn.addEventListener('click', stopCamera);
    });

    // Drag and Drop
    if (uploadZone) {
      ['dragenter', 'dragover'].forEach(name => {
        uploadZone.addEventListener(name, (e) => {
          e.preventDefault();
          uploadZone.classList.add('dragover');
        });
      });
      ['dragleave', 'drop'].forEach(name => {
        uploadZone.addEventListener(name, (e) => {
          e.preventDefault();
          uploadZone.classList.remove('dragover');
        });
      });
      uploadZone.addEventListener('drop', (e) => {
        if (e.dataTransfer && e.dataTransfer.files.length) {
          addFiles(e.dataTransfer.files);
        }
      });
    }
  }

  /* ===================================================================
     4. FORM SUBMISSION (LANGSUNG TERHUBUNG KE WHATSAPP RESMI DLH LEMBATA)
     =================================================================== */
  setupFormSubmissions() {
    const form = document.getElementById('formAduanWarga');
    if (!form) return;

    form.addEventListener('reset', () => {
      if (typeof this.resetRiwayatCards === 'function') {
        this.resetRiwayatCards();
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (this._isSubmittingAduan) return;
      this._isSubmittingAduan = true;

      // 1. Validasi Input Nomor WhatsApp
      const inputNoHp = document.getElementById('inputNoHp');
      const noHpRaw = (inputNoHp?.value || '').trim();
      const phoneValidation = this.validatePhoneNumber(noHpRaw);

      if (!phoneValidation.valid) {
        this._isSubmittingAduan = false;
        if (inputNoHp) {
          inputNoHp.classList.add('input-invalid');
          inputNoHp.focus();
          inputNoHp.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        const msgEl = document.getElementById('noHpValidationMsg');
        if (msgEl) {
          msgEl.style.display = 'block';
          msgEl.className = 'input-validation-msg msg-error';
          msgEl.textContent = phoneValidation.message;
        }
        this.showToast('Periksa Nomor WhatsApp: ' + phoneValidation.message, 'warning');
        return;
      }

      // 2. Indikator Proses Pengiriman & Animasi Upload Loading
      const btnSubmit = document.getElementById('btnSubmitAduan');
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="btn-spinner"></span> <span>Mengunggah Bukti Foto &amp; Mengirim...</span>';
      }

      // Tampilkan Modal Animasi Upload Loading Berputar Nyata
      const modalSubmitting = document.getElementById('modalSubmittingUpload');
      const submitUploadTitle = document.getElementById('submitUploadTitle');
      const submitUploadStep = document.getElementById('submitUploadStep');
      const submitUploadProgress = document.getElementById('submitUploadProgressFill');
      const submitUploadPercent = document.getElementById('submitUploadPercent');
      const submitUploadSubtext = document.getElementById('submitUploadSubtext');
      const submitUploadIcon = document.getElementById('submitUploadIcon');

      let currentPercent = 0;
      let animProgressInterval = null;

      const updateSubmitProgress = (pct, step, subtext) => {
        currentPercent = Math.min(100, Math.max(currentPercent, pct));
        if (submitUploadProgress) submitUploadProgress.style.width = `${currentPercent}%`;
        if (submitUploadPercent) submitUploadPercent.textContent = `${currentPercent}%`;
        if (step && submitUploadStep) submitUploadStep.textContent = step;
        if (subtext && submitUploadSubtext) submitUploadSubtext.textContent = subtext;
      };

      if (modalSubmitting) {
        if (submitUploadIcon) submitUploadIcon.textContent = '📤';
        if (submitUploadTitle) submitUploadTitle.textContent = 'Mengunggah Bukti Foto & Mengirim Aduan...';
        modalSubmitting.style.display = 'flex';
        updateSubmitProgress(10, 'Menghubungkan berkas ke server DLH Lembata...', 'Memeriksa kelengkapan laporan...');
        animProgressInterval = setInterval(() => {
          if (currentPercent < 70) {
            updateSubmitProgress(currentPercent + 4);
          }
        }, 110);
      }

      this.showToast('⏳ Mengunggah bukti foto & mengamankan data ke sistem DLH Lembata...', 'info');

      try {
        // Kumpulkan dan sinkronkan seluruh file bukti foto sesuai yang dikirim pengadu (2, 3, atau hingga 5 foto)
        const expectedCount = (this.selectedMediaFiles || []).length;
        updateSubmitProgress(30, 'Menyelaraskan seluruh berkas bukti foto...', `Memeriksa ${expectedCount} bukti foto...`);
        
        const mediaPromises = (this.selectedMediaFiles || []).map(async (item) => {
          if (!item) return null;
          if (item.dataUrl && typeof item.dataUrl === 'string' && item.dataUrl.startsWith('data:image')) {
            return item.dataUrl;
          }
          if (item.compressPromise) {
            try {
              const res = await item.compressPromise;
              if (res && typeof res === 'string' && res.startsWith('data:image')) {
                item.dataUrl = res;
                return res;
              }
            } catch (e) {}
          }
          return await this.compressMediaFile(item);
        });

        // Periksa juga jika ada file yang belum terindeks di selectedMediaFiles dari input file / kamera
        const fileInput = document.getElementById('inputBuktiFoto');
        if (fileInput && fileInput.files && fileInput.files.length) {
          Array.from(fileInput.files).forEach(f => {
            if (!this.selectedMediaFiles.some(m => m && (m.file === f || m === f))) {
              mediaPromises.push(this.compressMediaFile(f));
            }
          });
        }
        const cameraInput = document.getElementById('inputCameraCapture');
        if (cameraInput && cameraInput.files && cameraInput.files.length) {
          Array.from(cameraInput.files).forEach(f => {
            if (!this.selectedMediaFiles.some(m => m && (m.file === f || m === f))) {
              mediaPromises.push(this.compressMediaFile(f));
            }
          });
        }

        const rawResults = await Promise.all(mediaPromises);

        // Jaminan pemulihan 100%: Jangan biarkan ada foto pengadu yang hilang/terpangkas
        for (let i = 0; i < (this.selectedMediaFiles || []).length; i++) {
          if (!rawResults[i]) {
            const rawFile = this.selectedMediaFiles[i].file || (this.selectedMediaFiles[i] instanceof Blob ? this.selectedMediaFiles[i] : null);
            if (rawFile instanceof Blob) {
              try {
                const recovered = await new Promise((res) => {
                  const r = new FileReader();
                  r.onload = (ev) => res(ev.target ? ev.target.result : null);
                  r.onerror = () => res(null);
                  r.readAsDataURL(rawFile);
                });
                if (recovered) {
                  rawResults[i] = recovered;
                  this.selectedMediaFiles[i].dataUrl = recovered;
                }
              } catch (e) {}
            }
          }
        }

        const buktiList = rawResults.filter(Boolean);
        console.log(`Sinkronisasi Bukti Foto Pengadu: ${expectedCount} dipilih -> ${buktiList.length} terdata.`);

        // Kategori pencemaran
        const selectedRadio = document.querySelector('input[name="radioJenis"]:checked');
        const jenisPencemaran = selectedRadio ? selectedRadio.value : 'Lainnya';

        const namaPelapor = (document.getElementById('inputNama')?.value || '').trim();
        let noHp = (document.getElementById('inputNoHp')?.value || '').trim();
        const dHp = noHp.replace(/[^0-9]/g, '');
        if (dHp.startsWith('8') && dHp.length >= 9 && dHp.length <= 13) {
          noHp = '0' + dHp;
        } else if (dHp.startsWith('628') && dHp.length >= 11 && dHp.length <= 15) {
          noHp = '0' + dHp.slice(2);
        } else if (dHp.startsWith('6208')) {
          noHp = '0' + dHp.slice(4);
        } else if (dHp.startsWith('08')) {
          noHp = dHp;
        }
        const alamatPelapor = (document.getElementById('inputAlamat')?.value || '').trim();
        const kecamatan = document.getElementById('inputKecamatan')?.value || 'Nubatukan';
        const desa = (document.getElementById('inputDesa')?.value || '').trim();
        const lokasiDetail = (document.getElementById('inputLokasiDetail')?.value || '').trim();
        const tanggalKejadian = document.getElementById('inputTanggalKejadian')?.value || new Date().toISOString().split('T')[0];
        const sumberDugaan = (document.getElementById('inputSumberDugaan')?.value || '').trim();
        const uraian = (document.getElementById('inputUraian')?.value || '').trim();
        const penyelesaian = (document.getElementById('inputPenyelesaian')?.value || '').trim();

        // Riwayat Pernah Menyampaikan Pengaduan (Bagian 6)
        const formatTglRiwayat = (tg) => {
          if (!tg || tg === '-' || String(tg).trim() === '') return 'Tanggal tidak dicantumkan';
          const str = String(tg).trim();
          const parts = str.split('-');
          if (parts.length === 3 && parts[0].length === 4) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
          return str;
        };

        const containerCards = document.querySelectorAll('#riwayatCardsContainer .riwayat-card-item');
        const riwayatList = [];
        if (containerCards && containerCards.length > 0) {
          containerCards.forEach((card) => {
            const nmEl = card.querySelector('.riwayat-instansi-nama, .riwayat-instansi');
            const tgEl = card.querySelector('.riwayat-instansi-tgl, .riwayat-tanggal');
            const nm = (nmEl?.value || '').trim();
            const tg = (tgEl?.value || '').trim();
            if (nm) {
              riwayatList.push({
                no: riwayatList.length + 1,
                instansi: nm,
                tanggal: tg || '-'
              });
            }
          });
        } else {
          const instansiRows = document.querySelectorAll('.riwayat-instansi-nama, .riwayat-instansi');
          const tglRows = document.querySelectorAll('.riwayat-instansi-tgl, .riwayat-tanggal');
          instansiRows.forEach((el, idx) => {
            const nm = (el?.value || '').trim();
            const tg = (tglRows[idx]?.value || '').trim();
            if (nm) {
              riwayatList.push({
                no: riwayatList.length + 1,
                instansi: nm,
                tanggal: tg || '-'
              });
            }
          });
        }

        const riwayatSummary = riwayatList.length > 0
          ? riwayatList.map(r => `${r.no}. ${r.instansi} (${formatTglRiwayat(r.tanggal)})`).join('; ')
          : '-';

        const riwayatWaText = riwayatList.length > 0
          ? riwayatList.map(r => `• ${r.no}. ${r.instansi} (${formatTglRiwayat(r.tanggal)})`).join('\n')
          : 'Belum pernah';

        const lat = (document.getElementById('inputLat')?.value || '').trim();
        const lng = (document.getElementById('inputLng')?.value || '').trim();

        const formData = {
          namaPelapor: namaPelapor,
          noHp: noHp,
          alamatPelapor: alamatPelapor,
          kecamatan: kecamatan,
          desa: desa,
          lokasiDetail: lokasiDetail,
          jenisPencemaran: jenisPencemaran,
          tanggalKejadian: tanggalKejadian,
          sumberDugaan: sumberDugaan,
          uraian: uraian,
          penyelesaian: penyelesaian || '-',
          riwayatPengaduan: riwayatSummary,
          riwayatPengaduanList: riwayatList,
          lat: lat,
          lng: lng,
          fotoBukti: buktiList[0] || '',
          linkFotoBukti: (buktiList[0] || ''),
          buktiFotoList: [...buktiList]
        };

        // Simpan ke database lokal & cloud
        let newRecord = null;
        let store = window.aduanStore;
        if (!store && typeof AduanDataStore !== 'undefined') {
          store = new AduanDataStore();
          window.aduanStore = store;
        }

        if (store && typeof store.addAduan === 'function') {
          newRecord = await store.addAduan(formData);
        } else {
          // Fallback aman jika store belum terpasang
          const now = new Date();
          const year = now.getFullYear();
          const formattedDate = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          let maxSeq = 8;
          let arr = [];
          try {
            const rawStored = localStorage.getItem('dlh_lembata_aduan_v2') || localStorage.getItem('dlh_lembata_aduan_v1');
            arr = rawStored ? JSON.parse(rawStored) : [];
            arr.forEach(x => {
              if (x && x.id) {
                const m = String(x.id).match(new RegExp(`ADU-LMB-${year}-(\\d+)`, 'i'));
                if (m) {
                  const n = parseInt(m[1], 10);
                  if (!isNaN(n) && n > maxSeq) maxSeq = n;
                }
              }
            });
          } catch(e) {}
          const newId = `ADU-LMB-${year}-${String(maxSeq + 1).padStart(3, '0')}`;
          newRecord = {
            id: newId,
            timestamp: formattedDate,
            ...formData,
            status: 'Aduan Diterima',
            petugasVerifikasi: '-',
            tanggalVerifikasi: '-',
            hasilVerifikasi: 'Menunggu penugasan verifikator lapangan.',
            tindakanDLH: 'Aduan telah dicatat ke sistem dan siap dijadwalkan verifikasi.',
            tanggalSelesai: '-'
          };
          try {
            arr.unshift(newRecord);
            localStorage.setItem('dlh_lembata_aduan_v2', JSON.stringify(arr));
          } catch(e) {}
        }

        this.showToast(`💾 Laporan ${newRecord.id} tersimpan di arsip database DLH Lembata!`, 'success');

        // Link Google Maps koordinat presisi
        const finalLat = newRecord.lat || lat;
        const finalLng = newRecord.lng || lng;
        const mapsLink = (finalLat && finalLng)
          ? `https://maps.google.com/?q=${finalLat},${finalLng}`
          : 'Koordinat belum disetel';

        // Susun Format Pesan WhatsApp: LAYANAN PENGADUAN LINGKUNGAN MASYARAKAT KABUPATEN LEMBATA
        const waMessage = 
`*LAYANAN PENGADUAN LINGKUNGAN MASYARAKAT KABUPATEN LEMBATA*
--------------------------------------------------
📌 *NOMOR REGISTER:* ${newRecord.id}
📅 *WAKTU LAPOR:* ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
🔍 TAUTAN LACAK OTOMATIS: ${DOMAIN_WEB}/?tiket=${encodeURIComponent(newRecord.id)}

👤 *DATA PELAPOR:*
• *Nama Pelapor:* ${namaPelapor}
• *Nomor WhatsApp / HP:* ${noHp}
• *Alamat Domisili:* ${alamatPelapor || '-'}

📍 *LOKASI KEJADIAN PENCEMARAN:*
• *Kecamatan:* ${kecamatan}
• *Desa / Kelurahan:* ${desa}
• *Patokan Lokasi Detail:* ${lokasiDetail || '-'}
• *Titik Koordinat GPS:* ${finalLat}, ${finalLng}
• *Tautan Peta Google Maps:* ${mapsLink}

⚠️ *RINCIAN MASALAH:*
• *Jenis Pencemaran:* *${jenisPencemaran}*
• *Tanggal Kejadian:* ${tanggalKejadian}
• *Dugaan Sumber:* ${sumberDugaan || '-'}

📝 *URAIAN KRONOLOGI:*
${uraian}

*PENYELESAIAN YANG DIINGINKAN:*
${penyelesaian || 'Sesuai dengan ketentuan peraturan perundang-undangan lingkungan hidup yang berlaku.'}

*PERNAH MENYAMPAIKAN PENGADUAN:*
${riwayatWaText}

📸 *BUKTI FOTO KEJADIAN:*
${buktiList.length > 0 
  ? `• Status: ${buktiList.length} Foto Bukti Terlampir Bersama Laporan Ini` 
  : '• Status: Pelapor tidak melampirkan foto bukti.'}
--------------------------------------------------
_Laporan resmi dikirim melalui formulir Layanan Pengaduan Lingkungan Masyarakat Kabupaten Lembata._
_Mohon bantuan tindak lanjut dari Petugas Layanan Pengaduan. Terima kasih!_`;

        // Tautan langsung ke room chat nomor kontak layanan pengaduan (+62 822-3458-2769)
        const waUrl = `https://api.whatsapp.com/send?phone=6282234582769&text=${encodeURIComponent(waMessage)}`;

        // Helper konversi Base64 DataURL menjadi File objek JPEG standar untuk lampiran visual WhatsApp
        const dataUrlToJpegFile = (dataUrl, fileName) => {
          try {
            if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.includes(',')) return null;
            const parts = dataUrl.split(',');
            const bstr = atob(parts[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            const safeName = (fileName && fileName.endsWith('.jpg')) ? fileName : `${fileName || 'bukti'}.jpg`;
            return new File([u8arr], safeName, { type: 'image/jpeg', lastModified: Date.now() });
          } catch (e) {
            console.error('Gagal konversi DataURL ke File:', e);
            return null;
          }
        };

        const shareFiles = [];
        if (buktiList.length >= 1) {
          buktiList.forEach((fotoDataUrl, idx) => {
            const f = dataUrlToJpegFile(fotoDataUrl, `bukti_${newRecord.id}_foto_${idx + 1}.jpg`);
            if (f) shareFiles.push(f);
          });
        }
        let shareFile = shareFiles[0] || null;

        // Reset form
        form.reset();
        (this.selectedMediaFiles || []).forEach(m => {
          if (m && m.previewUrl && String(m.previewUrl).startsWith('blob:')) {
            try { URL.revokeObjectURL(m.previewUrl); } catch (e) {}
          }
        });
        this.selectedMediaFiles = [];
        if (fileInput) fileInput.value = '';
        if (cameraInput) cameraInput.value = '';
        const previewList = document.getElementById('uploadPreviewList');
        if (previewList) previewList.innerHTML = '';
        const inputPenyelesaianEl = document.getElementById('inputPenyelesaian');
        if (inputPenyelesaianEl) inputPenyelesaianEl.value = '';
        if (typeof this.resetRiwayatCards === 'function') {
          this.resetRiwayatCards();
        } else {
          document.querySelectorAll('.riwayat-instansi-nama, .riwayat-instansi').forEach(el => { el.value = ''; });
          document.querySelectorAll('.riwayat-instansi-tgl, .riwayat-tanggal').forEach(el => { el.value = ''; });
        }
        const dateInput = document.getElementById('inputTanggalKejadian');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        if (this.populateDesaDropdown) this.populateDesaDropdown('Nubatukan');
        const msgNoHp = document.getElementById('noHpValidationMsg');
        if (msgNoHp) msgNoHp.style.display = 'none';
        if (inputNoHp) inputNoHp.classList.remove('input-valid', 'input-invalid');

        // Update UI components
        this.updateKPIs();
        this.renderTable();
        if (window.lembataMap) window.lembataMap.renderMarkers();

        // 🌟 TAMPILKAN STATUS UPLOAD SUKSES & SELESAIKAN ANIMASI LOADING
        if (animProgressInterval) clearInterval(animProgressInterval);
        updateSubmitProgress(100, '✅ Status: Upload Sukses!', 'Bukti foto & berkas laporan berhasil diunggah.');
        if (submitUploadIcon) submitUploadIcon.textContent = '✓';
        if (submitUploadTitle) submitUploadTitle.textContent = 'Status: Upload Sukses!';
        await new Promise(resolve => setTimeout(resolve, 750));
        if (modalSubmitting) modalSubmitting.style.display = 'none';

        // Tampilkan Modal Sukses Aduan
        const modalSuccess = document.getElementById('modalSuccessAduan');
        const ticketDisplay = document.getElementById('successTicketId');
        const btnWa = document.getElementById('btnWaConfirmation');
        const btnCopyTicket = document.getElementById('btnCopyTicket');
        const btnSuccessTrack = document.getElementById('btnSuccessTrack');
        const redirectNotice = document.getElementById('waRedirectLoadingNotice');
        if (redirectNotice) redirectNotice.style.display = 'none';

        // Batalkan pengalihan otomatis dari laporan sebelumnya (jika masih menunggu)
        if (this._waRedirectTimer) {
          clearTimeout(this._waRedirectTimer);
          this._waRedirectTimer = null;
        }
        const cancelAutoRedirect = () => {
          if (this._waRedirectTimer) {
            clearTimeout(this._waRedirectTimer);
            this._waRedirectTimer = null;
          }
          if (redirectNotice) redirectNotice.style.display = 'none';
        };

        if (ticketDisplay) ticketDisplay.textContent = newRecord.id;
        const trackingUrlEl = document.getElementById('successTrackingUrl');
        if (trackingUrlEl) {
          const directTrackUrl = `${DOMAIN_WEB}/?tiket=${encodeURIComponent(newRecord.id)}`;
          trackingUrlEl.href = directTrackUrl;
          trackingUrlEl.textContent = directTrackUrl;
        }

        // Tombol Salin Nomor Tiket
        if (btnCopyTicket) {
          btnCopyTicket.onclick = async (evt) => {
            if (evt) evt.preventDefault();
            const ticketText = String(newRecord.id || '');
            let copied = false;
            try {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(ticketText);
                copied = true;
              }
            } catch (clipErr) {}
            if (!copied) {
              try {
                const ta = document.createElement('textarea');
                ta.value = ticketText;
                ta.setAttribute('readonly', '');
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                copied = document.execCommand('copy');
                document.body.removeChild(ta);
              } catch (copyErr) {}
            }
            const origCopyLabel = '📋 Salin Nomor Tiket';
            btnCopyTicket.textContent = copied ? '✓ Nomor Tiket Disalin' : 'Tekan lama nomor tiket untuk menyalin';
            setTimeout(() => { btnCopyTicket.textContent = origCopyLabel; }, 2200);
          };
        }

        // Tombol Lacak Tiket
        if (btnSuccessTrack) {
          btnSuccessTrack.onclick = (evt) => {
            if (evt) evt.preventDefault();
            cancelAutoRedirect();
            document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('show'));
            this.switchTab('lacak');
            const quickInput = document.getElementById('quickTrackInput');
            if (quickInput) {
              quickInput.value = newRecord.id;
              setTimeout(() => document.getElementById('btnQuickTrack')?.click(), 200);
            }
          };
        }

        // Tombol manual: Buka WhatsApp Sekarang (cadangan bila pengalihan otomatis diblokir browser)
        if (btnWa) {
          btnWa.onclick = async (evt) => {
            if (evt) evt.preventDefault();
            cancelAutoRedirect();
            btnWa.disabled = true;
            const origText = btnWa.innerHTML;
            btnWa.innerHTML = '<span class="btn-spinner"></span> <span>Membuka WhatsApp...</span>';
            if (redirectNotice) {
              redirectNotice.style.display = 'block';
              const noticeText = document.getElementById('waRedirectNoticeText');
              if (noticeText) noticeText.textContent = 'Mengarahkan Anda ke Room Chat WhatsApp Layanan Pengaduan...';
            }

            setTimeout(async () => {
              if (shareFiles.length > 0 && navigator.share && navigator.canShare && navigator.canShare({ files: shareFiles })) {
                try {
                  await navigator.share({
                    title: `Pengaduan Lingkungan ${newRecord.id}`,
                    text: waMessage,
                    files: shareFiles
                  });
                  this.showToast(`${shareFiles.length} foto bukti & laporan berhasil dibagikan ke WhatsApp!`, 'success');
                  btnWa.disabled = false;
                  btnWa.innerHTML = origText;
                  return;
                } catch (shareErr) {
                  if (shareErr.name === 'AbortError') {
                    btnWa.disabled = false;
                    btnWa.innerHTML = origText;
                    if (redirectNotice) redirectNotice.style.display = 'none';
                    return;
                  }
                }
              } else if (shareFile && navigator.share && navigator.canShare && navigator.canShare({ files: [shareFile] })) {
                try {
                  await navigator.share({
                    title: `Pengaduan Lingkungan ${newRecord.id}`,
                    text: waMessage,
                    files: [shareFile]
                  });
                  this.showToast('Laporan & foto bukti berhasil dibagikan ke WhatsApp!', 'success');
                  btnWa.disabled = false;
                  btnWa.innerHTML = origText;
                  return;
                } catch (shareErr) {
                  if (shareErr.name === 'AbortError') {
                    btnWa.disabled = false;
                    btnWa.innerHTML = origText;
                    if (redirectNotice) redirectNotice.style.display = 'none';
                    return;
                  }
                }
              }
              window.location.href = waUrl;
              setTimeout(() => {
                btnWa.disabled = false;
                btnWa.innerHTML = origText;
              }, 2500);
            }, 300);
          };
        }


        // Kembalikan tombol submit ke posisi aktif semula
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = '<span>📲</span> KIRIM LAPORAN KE KONTAK LAYANAN PENGADUAN';
        }

        // Buka modal konfirmasi sukses
        if (modalSuccess) modalSuccess.classList.add('show');

        // Jeda ~1,8 detik agar warga sempat membaca "Laporan Sudah Masuk" & melihat nomor tiket,
        // lalu arahkan otomatis ke WhatsApp petugas. Dibatalkan jika modal ditutup / tombol manual diklik.
        if (redirectNotice) {
          redirectNotice.style.display = 'block';
          const noticeText = document.getElementById('waRedirectNoticeText');
          if (noticeText) noticeText.textContent = 'Membuka WhatsApp petugas...';
        }
        this._waRedirectTimer = setTimeout(() => {
          this._waRedirectTimer = null;
          if (!modalSuccess || !modalSuccess.classList.contains('show')) return;
          try {
            window.location.href = waUrl;
          } catch (e) {
            window.open(waUrl, '_blank');
          }
          // Bila WhatsApp tidak terbuka (mis. diblokir), ubah pesan agar warga memakai tombol manual
          setTimeout(() => {
            const noticeText = document.getElementById('waRedirectNoticeText');
            if (noticeText && redirectNotice && redirectNotice.style.display !== 'none') {
              noticeText.textContent = 'Jika WhatsApp belum terbuka, tekan tombol "Buka WhatsApp Sekarang" di bawah.';
            }
          }, 2500);
        }, 1800);

      } catch (submitErr) {
        if (animProgressInterval) clearInterval(animProgressInterval);
        if (modalSubmitting) modalSubmitting.style.display = 'none';
        console.error('Error saat memproses aduan:', submitErr);
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = '<span>📲</span> KIRIM LAPORAN KE KONTAK LAYANAN PENGADUAN';
        }

        // Susun Format Lengkap agar pesan WhatsApp TIDAK PERNAH BERUBAH meskipun offline
        const fallbackNama = (document.getElementById('inputNama')?.value || '').trim() || 'Warga Lembata';
        let fallbackNoHp = (document.getElementById('inputNoHp')?.value || '').trim();
        const fbDigits = fallbackNoHp.replace(/[^0-9]/g, '');
        if (fbDigits.startsWith('8') && fbDigits.length >= 9 && fbDigits.length <= 13) {
          fallbackNoHp = '0' + fbDigits;
        } else if (fbDigits.startsWith('628') && fbDigits.length >= 11 && fbDigits.length <= 15) {
          fallbackNoHp = '0' + fbDigits.slice(2);
        } else if (fbDigits.startsWith('6208')) {
          fallbackNoHp = '0' + fbDigits.slice(4);
        } else if (fbDigits.startsWith('08')) {
          fallbackNoHp = fbDigits;
        }
        const fallbackAlamat = (document.getElementById('inputAlamat')?.value || '').trim();
        const fallbackKec = document.getElementById('inputKecamatan')?.value || 'Nubatukan';
        const fallbackDesa = (document.getElementById('inputDesa')?.value || '').trim();
        const fallbackLokasi = (document.getElementById('inputLokasiDetail')?.value || '').trim();
        const fallbackRadio = document.querySelector('input[name="radioJenis"]:checked');
        const fallbackJenis = fallbackRadio ? fallbackRadio.value : 'Lainnya';
        const fallbackTgl = document.getElementById('inputTanggalKejadian')?.value || new Date().toISOString().split('T')[0];
        const fallbackSumber = (document.getElementById('inputSumberDugaan')?.value || '').trim();
        const fallbackUraian = (document.getElementById('inputUraian')?.value || '').trim();
        const fallbackPenyelesaian = (document.getElementById('inputPenyelesaian')?.value || '').trim();
        const fbContainerCards = document.querySelectorAll('#riwayatCardsContainer .riwayat-card-item');
        const fbRiwayatList = [];
        if (fbContainerCards && fbContainerCards.length > 0) {
          fbContainerCards.forEach((card) => {
            const nmEl = card.querySelector('.riwayat-instansi-nama, .riwayat-instansi');
            const tgEl = card.querySelector('.riwayat-instansi-tgl, .riwayat-tanggal');
            const nm = (nmEl?.value || '').trim();
            const tg = (tgEl?.value || '').trim();
            if (nm) {
              fbRiwayatList.push({ no: fbRiwayatList.length + 1, instansi: nm, tanggal: tg || '-' });
            }
          });
        } else {
          const fbInstansiRows = document.querySelectorAll('.riwayat-instansi-nama, .riwayat-instansi');
          const fbTglRows = document.querySelectorAll('.riwayat-instansi-tgl, .riwayat-tanggal');
          fbInstansiRows.forEach((el, idx) => {
            const nm = (el?.value || '').trim();
            const tg = (fbTglRows[idx]?.value || '').trim();
            if (nm) {
              fbRiwayatList.push({ no: fbRiwayatList.length + 1, instansi: nm, tanggal: tg || '-' });
            }
          });
        }
        const fallbackRiwayatWaText = fbRiwayatList.length > 0
          ? fbRiwayatList.map(r => `• ${r.no}. ${r.instansi} (${formatTglRiwayat(r.tanggal)})`).join('\n')
          : 'Belum pernah';

        const fallbackLat = (document.getElementById('inputLat')?.value || '').trim();
        const fallbackLng = (document.getElementById('inputLng')?.value || '').trim();
        const fallbackMapsLink = (fallbackLat && fallbackLng) ? `https://maps.google.com/?q=${fallbackLat},${fallbackLng}` : 'Koordinat belum disetel';
        const fallbackId = `ADU-LMB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

        const safeWaMessage = 
`*LAYANAN PENGADUAN LINGKUNGAN MASYARAKAT KABUPATEN LEMBATA*
--------------------------------------------------
📌 *NOMOR REGISTER:* ${fallbackId}
📅 *WAKTU LAPOR:* ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
🔍 TAUTAN LACAK OTOMATIS: ${DOMAIN_WEB}/?tiket=${encodeURIComponent(fallbackId)}

👤 *DATA PELAPOR:*
• *Nama Pelapor:* ${fallbackNama}
• *Nomor WhatsApp / HP:* ${fallbackNoHp}
• *Alamat Domisili:* ${fallbackAlamat || '-'}

📍 *LOKASI KEJADIAN PENCEMARAN:*
• *Kecamatan:* ${fallbackKec}
• *Desa / Kelurahan:* ${fallbackDesa || '-'}
• *Patokan Lokasi Detail:* ${fallbackLokasi || '-'}
• *Titik Koordinat GPS:* ${fallbackLat || '-'}, ${fallbackLng || '-'}
• *Tautan Peta Google Maps:* ${fallbackMapsLink}

⚠️ *RINCIAN MASALAH:*
• *Jenis Pencemaran:* *${fallbackJenis}*
• *Tanggal Kejadian:* ${fallbackTgl}
• *Dugaan Sumber:* ${fallbackSumber || '-'}

📝 *URAIAN KRONOLOGI:*
${fallbackUraian || 'Laporan pengaduan warga via portal web.'}

*PENYELESAIAN YANG DIINGINKAN:*
${fallbackPenyelesaian || 'Sesuai dengan ketentuan peraturan perundang-undangan lingkungan hidup yang berlaku.'}

*PERNAH MENYAMPAIKAN PENGADUAN:*
${fallbackRiwayatWaText}
--------------------------------------------------
_Laporan resmi dikirim melalui formulir Layanan Pengaduan Lingkungan Masyarakat Kabupaten Lembata._
_Mohon bantuan tindak lanjut dari Petugas Layanan Pengaduan. Terima kasih!_`;

        const fallbackWaUrl = `https://api.whatsapp.com/send?phone=6282234582769&text=${encodeURIComponent(safeWaMessage)}`;
        this.showToast('Mengarahkan ke WhatsApp resmi...', 'info');
        setTimeout(() => {
          window.location.href = fallbackWaUrl;
        }, 500);
      } finally {
        this._isSubmittingAduan = false;
      }
    });
  }

  /* ===================================================================
     5. REAL-TIME SYNCHRONIZATION LISTENER (PORTAL WARGA)
     =================================================================== */
  setupRealtimeSync() {
    if (!window.dlhRealtime) return;

    window.dlhRealtime.listen((msg) => {
      if (!msg || !msg.type) return;

      if (msg.type === 'ADUAN_BARU' || msg.type === 'STORAGE_RAW_UPDATED' || msg.type === 'TINDAK_LANJUT_UPDATED') {
        if (window.aduanStore) {
          window.aduanStore.init();
        }
        this.updateKPIs();
        this.renderTable();
        if (window.lembataMap) {
          window.lembataMap.renderMarkers();
          window.lembataMap.initMiniMap('miniMapPreview');
        }
      }
    });
  }

  /* ===================================================================
     6. TABLE & RECAP
     =================================================================== */
  setupTableAndFilters() {
    const searchInput = document.getElementById('tableSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.tableFilters.search = e.target.value.toLowerCase();
        this.renderTable();
      });
    }

    // Map filters
    const mapFilterKec = document.getElementById('mapFilterKecamatan');
    const mapFilterSt = document.getElementById('mapFilterStatus');
    const mapFilterJenis = document.getElementById('mapFilterJenis');
    const btnResetMap = document.getElementById('btnResetMapFilters');

    const handleMapFilter = () => {
      const kec = mapFilterKec ? mapFilterKec.value : 'all';
      const st = mapFilterSt ? mapFilterSt.value : 'all';
      const jenis = mapFilterJenis ? mapFilterJenis.value : 'all';
      if (window.lembataMap) {
        window.lembataMap.setFilters(st, kec, jenis);
        if (kec !== 'all') window.lembataMap.focusToRegion(kec);
      }
    };

    if (mapFilterKec) mapFilterKec.addEventListener('change', handleMapFilter);
    if (mapFilterSt) mapFilterSt.addEventListener('change', handleMapFilter);
    if (mapFilterJenis) mapFilterJenis.addEventListener('change', handleMapFilter);

    if (btnResetMap) {
      btnResetMap.addEventListener('click', () => {
        if (mapFilterKec) mapFilterKec.value = 'all';
        if (mapFilterSt) mapFilterSt.value = 'all';
        if (mapFilterJenis) mapFilterJenis.value = 'all';
        document.querySelectorAll('.pill-region').forEach(p => p.classList.remove('active'));
        const allPill = document.querySelector('.pill-region[data-region="all"]');
        if (allPill) allPill.classList.add('active');
        if (window.lembataMap) {
          window.lembataMap.setFilters('all', 'all', 'all');
          window.lembataMap.focusToRegion('all');
        }
        this.showToast('Filter peta dikembalikan ke tampilan awal.', 'info');
      });
    }

    // Export CSV
    const btnExport = document.getElementById('btnExportCsv');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        window.aduanStore.exportToCSV();
        this.showToast('Data aduan berhasil diunduh dalam format CSV!', 'success');
      });
    }
  }

  renderTable() {
    const tbody = document.getElementById('aduanTableBody');
    if (!tbody) return;

    const data = window.aduanStore ? window.aduanStore.getAll() : [];
    const filtered = data.filter(item => {
      const q = this.tableFilters.search;
      const matchSearch = !q || 
        item.id.toLowerCase().includes(q) ||
        item.namaPelapor.toLowerCase().includes(q) ||
        item.kecamatan.toLowerCase().includes(q) ||
        item.desa.toLowerCase().includes(q) ||
        item.jenisPencemaran.toLowerCase().includes(q) ||
        item.uraian.toLowerCase().includes(q);

      return matchSearch;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 28px; color: #64748b;">
            Tidak ada data aduan yang cocok dengan pencarian.
          </td>
        </tr>
      `;
      return;
    }

    // Urutkan data tabel agar aduan terbaru berada di baris teratas
    const sortedFiltered = [...filtered].reverse().sort((a, b) => {
      const timeA = Date.parse(a.timestamp || '') || 0;
      const timeB = Date.parse(b.timestamp || '') || 0;
      if (timeA && timeB && timeA !== timeB) return timeB - timeA;
      if (a.id && b.id && a.id !== b.id) return String(b.id).localeCompare(String(a.id), undefined, { numeric: true });
      return 0;
    });

    tbody.innerHTML = sortedFiltered.map(item => `
      <tr>
        <td><strong style="color: #065f46; font-family: monospace;">${item.id}</strong></td>
        <td style="color: #64748b; font-size: 0.8rem; white-space: nowrap;">${item.timestamp.split(' ')[0]}</td>
        <td><strong>${item.namaPelapor}</strong></td>
        <td>Kec. ${item.kecamatan}<br><small style="color: #64748b;">Desa: ${item.desa}</small></td>
        <td><span style="font-weight: 600; color: #059669;">${item.jenisPencemaran}</span></td>
        <td style="text-align: center; white-space: nowrap;">
          <button class="btn btn-outline btn-sm" onclick="window.app.showDetailModal('${item.id}')" title="Lihat Rincian Aduan">
            Lihat Rincian
          </button>
          <a class="btn btn-sm" style="background: #16a34a; color: white; text-decoration: none; border-radius: 6px; padding: 5px 10px; font-weight: 600; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 4px;" href="https://wa.me/6282234582769?text=${encodeURIComponent('Halo DLH Kabupaten Lembata, saya ingin menanyakan tindak lanjut pengaduan lingkungan nomor tiket: ' + item.id + ' (Lokasi: Desa ' + item.desa + ', Kec. ' + item.kecamatan + ')')}" target="_blank" title="Hubungi Petugas DLH via WhatsApp">
            💬 Chat WA
          </a>
        </td>
      </tr>
    `).join('');

    const footer = document.getElementById('tablePagination');
    if (footer) {
      footer.textContent = `Menampilkan ${filtered.length} dari total ${data.length} laporan aduan`;
    }
  }

  updateKPIs() {
    const stats = window.aduanStore ? window.aduanStore.getStats() : { total: 0, baru: 0, dalamProses: 0, selesai: 0 };
    
    const elTotal = document.getElementById('kpiTotal');
    const elBaru = document.getElementById('kpiBaru');
    const elProses = document.getElementById('kpiProses');
    const elSelesai = document.getElementById('kpiSelesai');

    if (elTotal) elTotal.textContent = stats.total;
    if (elBaru) elBaru.textContent = stats.baru;
    if (elProses) elProses.textContent = stats.dalamProses;
    if (elSelesai) elSelesai.textContent = stats.selesai;

    // Metrik Dashboard Publik Masyarakat & Hero Section (100% Sinkron Data Real Aduan)
    const userTotal = document.getElementById('userKpiTotal');
    const userProses = document.getElementById('userKpiProses');
    const userSelesai = document.getElementById('userKpiSelesai');
    if (userTotal) userTotal.textContent = (stats.total || 0).toLocaleString('id-ID');
    if (userProses) userProses.textContent = (stats.dalamProses || 0).toLocaleString('id-ID');
    if (userSelesai) userSelesai.textContent = (stats.selesai || 0).toLocaleString('id-ID');

    // Hero Section Stat Card (Sinkron Murni dengan Data Real Database/Spreadsheet)
    const heroTotal = document.getElementById('heroStatTotal');
    const heroProses = document.getElementById('heroStatProses');
    const heroSelesai = document.getElementById('heroStatSelesai');
    if (heroTotal) heroTotal.textContent = (stats.total || 0).toLocaleString('id-ID');
    if (heroProses) heroProses.textContent = (stats.dalamProses || 0).toLocaleString('id-ID');
    if (heroSelesai) heroSelesai.textContent = (stats.selesai || 0).toLocaleString('id-ID');
  }

  scrollToForm() {
    this.switchTab('form');
    const firstInput = document.getElementById('inputNama');
    if (firstInput) setTimeout(() => firstInput.focus(), 300);
  }

  scrollToTracker() {
    this.switchTab('lacak');
    const input = document.getElementById('quickTrackInput');
    if (input) {
      setTimeout(() => {
        input.focus();
        input.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.4)';
        setTimeout(() => { input.style.boxShadow = ''; }, 2200);
      }, 300);
    }
  }

  /**
   * Controller Pencarian & Pelacakan Status Aduan via ID Tiket
   * @param {string} ticketId - Nomor ID registrasi tiket aduan (misal: ADU-LMB-2026-001)
   */
  lacakTiket(ticketId) {
    if (!ticketId) return;
    this.switchTab('lacak');
    const inputTrack = document.getElementById('quickTrackInput');
    const btnTrack = document.getElementById('btnQuickTrack');
    if (inputTrack) {
      inputTrack.value = ticketId.trim();
    }
    if (btnTrack) {
      btnTrack.click();
    }
    const targetSection = document.getElementById('quickTrackSection') || document.getElementById('pane-lacak');
    if (targetSection && typeof targetSection.scrollIntoView === 'function') {
      setTimeout(() => {
        try {
          targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (e) {
          targetSection.scrollIntoView();
        }
      }, 250);
    }
  }

  cariAduan(ticketId) {
    return this.lacakTiket(ticketId);
  }

  /* ===================================================================
     6B. DASHBOARD MASYARAKAT: QUICK TRACKER & CATEGORY PICKER
     =================================================================== */
  setupQuickTracker() {
    const btnTrack = document.getElementById('btnQuickTrack');
    const inputTrack = document.getElementById('quickTrackInput');
    const resultBox = document.getElementById('quickTrackResult');
    if (!btnTrack || !inputTrack || !resultBox) return;

    const doTrack = async () => {
      const q = inputTrack.value.trim().toUpperCase();
      if (!q) {
        this.showToast('⚠️ Masukkan nomor ID tiket yang ingin dilacak.', 'warning');
        inputTrack.focus();
        return;
      }

      btnTrack.disabled = true;
      btnTrack.innerHTML = '<span>⏳</span> Melacak...';

      if (window.aduanStore && window.aduanStore.hasGasConfigured()) {
        try { await window.aduanStore.syncFromGAS(true); } catch(e) {}
      }

      btnTrack.disabled = false;
      btnTrack.innerHTML = '<span>Lacak Tiket</span>';

      const item = window.aduanStore ? window.aduanStore.getById(q) : null;
      if (!item) {
        resultBox.style.display = 'block';
        resultBox.innerHTML = `
          <div style="text-align: center; padding: 12px 8px; color: #64748b;">
            <div style="font-size: 1.5rem; margin-bottom: 4px;">🔍</div>
            <strong style="color: #334155; font-size: 0.9rem;">Tiket "${q}" Belum Ditemukan</strong>
            <p style="font-size: 0.78rem; margin-top: 4px; color: #64748b;">Pastikan nomor ID tiket sudah tepat (contoh: ADU-LMB-2026-001) atau laporan baru saja dibuat dan sedang disinkronkan.</p>
          </div>
        `;
        return;
      }

      resultBox.style.display = 'block';
      resultBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 8px;">
          <div>
            <span style="font-size: 0.7rem; color: #64748b; font-weight: 700;">NO. TIKET RESMI:</span>
            <div style="font-family: monospace; font-weight: 900; color: #059669; font-size: 1.15rem;">${item.id}</div>
          </div>
          <span class="badge ${this.getStatusBadgeClass(item.status)}">${item.status || 'Aduan Masuk'}</span>
        </div>
        <div style="font-size: 0.82rem; color: #334155; line-height: 1.5;">
          <div><strong>Jenis:</strong> <span style="color:#059669; font-weight:700;">${item.jenisPencemaran}</span></div>
          <div><strong>Lokasi:</strong> Kec. ${item.kecamatan}, Desa ${item.desa}</div>
          <div><strong>Waktu Lapor:</strong> ${item.timestamp}</div>
          ${item.petugasVerifikasi && item.petugasVerifikasi !== '-' ? `<div style="margin-top: 4px; color: #047857;"><strong>Petugas DLH:</strong> ${item.petugasVerifikasi}</div>` : '<div style="margin-top: 4px; color: #d97706;"><em>Menunggu penugasan tim verifikator lapangan DLH.</em></div>'}
          ${item.tindakanDLH && item.tindakanDLH !== '-' ? `<div style="margin-top: 2px; color: #0284c7;"><strong>Tindak Lanjut:</strong> ${item.tindakanDLH}</div>` : ''}
        </div>
      `;
    };

    btnTrack.addEventListener('click', doTrack);
    inputTrack.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        doTrack();
      }
    });
  }

  selectCategoryFromDashboard(categoryName) {
    const chips = document.querySelectorAll('.chip-item');
    chips.forEach(chip => {
      const radio = chip.querySelector('input[type="radio"]');
      if (radio && radio.value.toLowerCase().includes(categoryName.toLowerCase())) {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        radio.checked = true;
      }
    });

    const formCard = document.querySelector('.form-card');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    this.showToast(`🎯 Kategori "${categoryName}" dipilih! Silakan lengkapi formulir laporan di bawah.`, 'info');
  }

  /* ===================================================================
     7. MODALS
     =================================================================== */
  setupModals() {
    const clearWaRedirect = () => {
      if (this._waRedirectTimer) {
        clearTimeout(this._waRedirectTimer);
        this._waRedirectTimer = null;
      }
      const notice = document.getElementById('waRedirectLoadingNotice');
      if (notice) notice.style.display = 'none';
    };

    document.querySelectorAll('.modal-close, .btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        clearWaRedirect();
        document.querySelectorAll('.modal-backdrop').forEach(modal => modal.classList.remove('show'));
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          clearWaRedirect();
          backdrop.classList.remove('show');
        }
      });
    });
  }

  showDetailModal(id) {
    const item = window.aduanStore.getById(id);
    if (!item) return;

    const modal = document.getElementById('modalDetailAduan');
    const body = document.getElementById('detailModalContent');
    if (!modal || !body) return;

    // 1. Kumpulan Seluruh Foto Bukti Pelapor (Mendukung Multi-Foto, Drive, & Base64)
    let photoList = [];
    const extractPhotos = (val) => {
      if (!val) return;
      if (Array.isArray(val)) {
        val.forEach(extractPhotos);
        return;
      }
      if (typeof val === 'object' && val.dataUrl) {
        extractPhotos(val.dataUrl);
        return;
      }
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (!trimmed || trimmed === '-' || trimmed.includes('#ERROR')) return;
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              parsed.forEach(extractPhotos);
              return;
            }
          } catch(e) {}
        }
        if (trimmed.includes('Buka') && trimmed.includes('Foto Bukti')) return;
        if (trimmed.startsWith('📸')) return;
        const matches = trimmed.match(/(data:image\/[^;]+;base64,[^,\s]+|https?:\/\/[^\s,]+)/g);
        if (matches && matches.length > 0) {
          matches.forEach(m => {
            const cleanM = m.trim();
            if (cleanM && !photoList.includes(cleanM)) photoList.push(cleanM);
          });
        } else if ((trimmed.startsWith('data:image') || trimmed.startsWith('http')) && !photoList.includes(trimmed)) {
          photoList.push(trimmed);
        }
      }
    };

    const cleanAduanId = String(item.id || '').trim().toUpperCase();

    extractPhotos(item.buktiFotoList);
    if (photoList.length === 0) {
      ['fotoBukti', 'linkFotoBukti', 'buktiFoto', 'linkFoto'].forEach(field => {
        extractPhotos(item[field]);
      });
    }

    // Sinkronkan cache lokal HANYA untuk indeks foto yang memang valid (TIDAK menyisipkan foto hantu/lama)
    for (let cIdx = 0; cIdx < photoList.length; cIdx++) {
      try {
        const cVal = localStorage.getItem('dlh_photo_cache_' + cleanAduanId + '_' + cIdx) ||
                     localStorage.getItem('dlh_photo_cache_' + cleanAduanId.toLowerCase() + '_' + cIdx) ||
                     (cIdx === 0 ? (localStorage.getItem('dlh_photo_cache_' + cleanAduanId) || localStorage.getItem('dlh_photo_cache_' + cleanAduanId.toLowerCase())) : null);
        if (cVal && cVal.startsWith('data:image')) {
          if (!photoList[cIdx] || !photoList[cIdx].startsWith('data:image')) {
            photoList[cIdx] = cVal;
          }
        }
      } catch (e) {}
    }

    // Periksa juga jika ada foto tambahan ke-2, ke-3, dst. yang tersimpan di cache lokal
    for (let extraIdx = photoList.length; extraIdx < 6; extraIdx++) {
      try {
        const extraVal = localStorage.getItem('dlh_photo_cache_' + cleanAduanId + '_' + extraIdx) ||
                         localStorage.getItem('dlh_photo_cache_' + cleanAduanId.toLowerCase() + '_' + extraIdx);
        if (extraVal && extraVal.startsWith('data:image') && !photoList.includes(extraVal)) {
          photoList.push(extraVal);
        }
      } catch (e) {}
    }

    // Resolusi awal: Ganti tautan non-Base64 dengan data gambar jernih dari cache lokal jika tersedia
    photoList = photoList.map((rawP, pIdx) => {
      if (typeof rawP === 'string' && rawP.startsWith('data:image')) return rawP;
      try {
        const cached = localStorage.getItem('dlh_photo_cache_' + cleanAduanId + '_' + pIdx) ||
                       localStorage.getItem('dlh_photo_cache_' + cleanAduanId.toLowerCase() + '_' + pIdx) ||
                       (pIdx === 0 ? localStorage.getItem('dlh_photo_cache_' + cleanAduanId) : null);
        if (cached && cached.startsWith('data:image')) return cached;
      } catch (e) {}
      return rawP;
    });

    // 2. Foto Dokumentasi Tindak Lanjut Petugas DLH (Jika Laporan Sudah Diverifikasi)
    const isUnverified = (!item.status || item.status === 'Baru' || item.status === 'Aduan Diterima' || item.status === 'Verifikasi Administrasi');
    let officerPhotos = [];
    if (!isUnverified) {
      if (Array.isArray(item.fotoVerifikasiList)) {
        item.fotoVerifikasiList.forEach(p => {
          if (p && !officerPhotos.includes(p)) officerPhotos.push(p);
        });
      }
      if (item.fotoKondisiRiil && item.fotoKondisiRiil !== '-' && !officerPhotos.includes(item.fotoKondisiRiil)) {
        officerPhotos.push(item.fotoKondisiRiil);
      }
      officerPhotos = officerPhotos.map((rawP, pIdx) => {
        if (typeof rawP === 'string' && rawP.startsWith('data:image')) return rawP;
        try {
          const cached = localStorage.getItem('dlh_photo_cache_' + cleanAduanId + '_PETUGAS_' + pIdx) ||
                         localStorage.getItem('dlh_photo_cache_' + cleanAduanId + '_PETUGAS');
          if (cached && cached.startsWith('data:image')) return cached;
        } catch (e) {}
        return rawP;
      });
    }

    this._currentModalItem = item;
    this._currentCitizenPhotos = photoList;
    this._currentOfficerPhotos = officerPhotos;

    const mapsUrl = (item.lat && item.lng) ? `https://maps.google.com/?q=${item.lat},${item.lng}` : '';

    body.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
        <div>
          <span style="font-size: 0.75rem; color: #64748b;">KODE REGISTER:</span>
          <h2 style="font-size: 1.3rem; color: #059669; font-weight: 800;">${item.id}</h2>
        </div>
        <span class="badge ${this.getStatusBadgeClass(item.status)}">${item.status || 'Aduan Masuk'}</span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; font-size: 0.85rem;">
        <div style="background: #f0fdf4; border: 1.5px solid #bbf7d0; padding: 10px; border-radius: 8px;">
          <div style="color: #047857; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.3px;">KERAHASIAAN IDENTITAS PELAPOR</div>
          <strong style="color: #065f46; display: flex; align-items: center; gap: 5px; font-size: 0.88rem; margin-top: 2px;">
            🔒 Data Pelapor Dirahasiakan
          </strong>
          <span style="font-size: 0.72rem; color: #166534; display: block; margin-top: 2px;">Identitas dilindungi guna menjamin kerahasiaan &amp; keamanan pelapor</span>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px;">
          <div style="color: #64748b; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.3px;">LOKASI KEJADIAN</div>
          <strong style="color: #0f172a; font-size: 0.88rem; display: block; margin-top: 2px;">Kec. ${item.kecamatan}</strong>
          <span style="color: #475569; font-size: 0.8rem;">Desa/Kel. ${item.desa}</span>
        </div>
      </div>

      <div style="margin-bottom: 12px; font-size: 0.88rem;">
        <strong>Jenis Pencemaran:</strong> <span style="color: #059669; font-weight: 700;">${item.jenisPencemaran}</span>
      </div>

      <div style="margin-bottom: 14px; font-size: 0.85rem; color: #475569;">
        <strong>Patokan Lokasi:</strong> ${item.lokasiDetail || '-'}<br>
        <span style="font-family: monospace; font-size: 0.78rem; color: #059669;">🌐 Koordinat: ${item.lat}, ${item.lng}</span>
        ${mapsUrl ? `<br><a href="${mapsUrl}" target="_blank" style="color: #0284c7; text-decoration: underline; font-size: 0.8rem; font-weight: 600;">📍 Buka Titik Lokasi di Google Maps ↗</a>` : ''}
      </div>

      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 8px; margin-bottom: 14px; font-size: 0.88rem; color: #14532d;">
        <strong>Uraian Aduan:</strong><br>${item.uraian}
      </div>

      ${(item.penyelesaian && item.penyelesaian !== '-') ? `
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; margin-bottom: 14px; font-size: 0.85rem; color: #1e293b;">
          <strong>⚖️ Harapan / Penyelesaian yang Diinginkan:</strong><br>${item.penyelesaian}
        </div>
      ` : ''}

      ${(item.riwayatPengaduan && item.riwayatPengaduan !== 'Belum pernah' && item.riwayatPengaduan !== '-') ? `
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; margin-bottom: 14px; font-size: 0.85rem; color: #1e293b;">
          <strong>🏛️ Riwayat Pengaduan ke Instansi Lain:</strong><br>${item.riwayatPengaduan}
        </div>
      ` : ''}

      ${(!isUnverified && ((item.hasilVerifikasi && item.hasilVerifikasi !== '-') || (item.tindakanDLH && item.tindakanDLH !== '-') || item.nomorBeritaAcara)) ? `
        <div style="background: #f0fdf4; border: 1.5px solid #86efac; padding: 14px; border-radius: 10px; margin-bottom: 14px; font-size: 0.86rem; color: #14532d;">
          <div style="font-weight: 800; font-size: 0.9rem; color: #166534; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <span>📋</span> HASIL PEMERIKSAAN &amp; TINDAK LANJUT RESMI DLH:
          </div>
          ${(item.hasilVerifikasi && item.hasilVerifikasi !== '-') ? `
            <div style="margin-bottom: 6px;">
              <strong>Hasil Pemeriksaan Lapangan:</strong><br>${item.hasilVerifikasi}
            </div>
          ` : ''}
          ${(item.tindakanDLH && item.tindakanDLH !== '-') ? `
            <div style="margin-bottom: 6px;">
              <strong>Tindakan &amp; Rekomendasi DLH:</strong><br>${item.tindakanDLH}
            </div>
          ` : ''}
          ${(item.nomorBeritaAcara) ? `
            <div style="margin-bottom: 6px; font-family: monospace; font-size: 0.8rem; background: #dcfce7; padding: 4px 8px; border-radius: 4px; display: inline-block;">
              <strong>No. Berita Acara:</strong> ${item.nomorBeritaAcara}
            </div>
          ` : ''}
          <div style="font-size: 0.76rem; color: #15803d; margin-top: 6px; border-top: 1px dashed #bbf7d0; padding-top: 6px;">
            Verifikator: <strong>${item.petugasVerifikasi || 'Tim Verifikasi DLH'}</strong> &bull; Tanggal: ${item.tanggalVerifikasi || '-'}
          </div>
        </div>
      ` : ''}

      ${photoList.length > 0 ? `
        <div style="background: #ffffff; padding: 14px; border-radius: 12px; border: 1.5px solid #cbd5e1; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="font-size: 0.82rem; font-weight: 800; color: #1e293b;">📸 FOTO BUKTI DARI WARGA PELAPOR (${photoList.length} Foto):</div>
            <span style="font-size: 0.72rem; color: #059669; font-weight: 700;">🔍 Klik foto untuk memperbesar</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px;">
            ${photoList.map((rawSrc, i) => {
              const displaySrc = this.formatPhotoUrl(rawSrc);
              const safeSrc = (displaySrc || rawSrc).replace(/'/g, "\\'");
              const origSafe = (rawSrc || '').replace(/'/g, "\\'");
              const photoDomId = `imgDetailCitizen_${cleanAduanId}_${i}`;
              return `
                <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 6px;">
                  <div onclick="window.app.openLightboxByIndex('citizen', ${i})"
                       style="cursor: pointer; border-radius: 8px; overflow: hidden; border: 2px solid #059669; background: #0f172a; position: relative; height: 125px; transition: transform 0.2s;"
                       onmouseover="this.style.transform='scale(1.02)';"
                       onmouseout="this.style.transform='scale(1)';"
                       title="Klik foto untuk melihat ukuran penuh & perbesar">
                    <img id="${photoDomId}"
                         src="${displaySrc}"
                         data-original="${origSafe}"
                         data-aduan-id="${cleanAduanId}"
                         data-photo-idx="${i}"
                         alt="Bukti Foto ${i+1}"
                         referrerpolicy="no-referrer"
                         loading="eager"
                         onerror="window.handleAduanPhotoError(this, '${cleanAduanId}', ${i});"
                         style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;">
                    <div style="display: none; width: 100%; height: 100%; background: #0f172a; color: #f8fafc; flex-direction: column; align-items: center; justify-content: center; padding: 8px; text-align: center;">
                      <span style="font-size: 1.4rem;">📸</span>
                      <span style="font-size: 0.72rem; font-weight: 700; color: #34d399; margin-top: 4px;">Buka di Google Drive</span>
                    </div>
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.85)); color: #fff; font-size: 0.7rem; font-weight: 700; padding: 4px; text-align: center; pointer-events: none;">
                      🔍 Klik Perbesar
                    </div>
                  </div>
                  <button type="button" onclick="window.app.openLightboxByIndex('citizen', ${i})"
                          style="width: 100%; background: #059669; color: #ffffff; border: none; border-radius: 6px; padding: 5px 8px; font-size: 0.74rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;"
                          title="Buka foto ukuran penuh">
                    <span>🔍 Buka Foto</span>
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      ${officerPhotos.length > 0 ? `
        <div style="background: #f0fdf4; padding: 14px; border-radius: 12px; border: 1.5px solid #86efac; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="font-size: 0.82rem; font-weight: 800; color: #166534;">📸 FOTO HASIL CEK FISIK LAPANGAN PETUGAS DLH (${officerPhotos.length} Foto):</div>
            <span style="font-size: 0.72rem; color: #15803d; font-weight: 700;">🔍 Klik foto untuk memperbesar</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px;">
            ${officerPhotos.map((rawSrc, i) => {
              const displaySrc = this.formatPhotoUrl(rawSrc);
              const safeSrc = (displaySrc || rawSrc).replace(/'/g, "\\'");
              const origSafe = (rawSrc || '').replace(/'/g, "\\'");
              const photoDomId = `imgDetailOfficer_${cleanAduanId}_${i}`;
              return `
                <div style="background: #ffffff; border: 1.5px solid #86efac; border-radius: 10px; padding: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 6px;">
                  <div onclick="window.app.openLightboxByIndex('officer', ${i})"
                       style="cursor: pointer; border-radius: 8px; overflow: hidden; border: 2px solid #16a34a; background: #0f172a; position: relative; height: 125px; transition: transform 0.2s;"
                       onmouseover="this.style.transform='scale(1.02)';"
                       onmouseout="this.style.transform='scale(1)';"
                       title="Klik foto untuk melihat ukuran penuh & perbesar">
                    <img id="${photoDomId}"
                         src="${displaySrc}"
                         data-original="${origSafe}"
                         data-aduan-id="${cleanAduanId}"
                         data-photo-idx="${i}"
                         alt="Foto Fisik ${i+1}"
                         referrerpolicy="no-referrer"
                         loading="eager"
                         data-is-officer="true"
                         onerror="window.handleAduanPhotoError(this, '${cleanAduanId}', ${i}, true);"
                         style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;">
                    <div style="display: none; width: 100%; height: 100%; background: #0f172a; color: #f8fafc; flex-direction: column; align-items: center; justify-content: center; padding: 8px; text-align: center;">
                      <span style="font-size: 1.4rem;">📸</span>
                      <span style="font-size: 0.72rem; font-weight: 700; color: #4ade80; margin-top: 4px;">Buka di Google Drive</span>
                    </div>
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.85)); color: #fff; font-size: 0.7rem; font-weight: 700; padding: 4px; text-align: center; pointer-events: none;">
                      🔍 Klik Perbesar
                    </div>
                  </div>
                  <button type="button" onclick="window.app.openLightboxByIndex('officer', ${i})"
                          style="width: 100%; background: #16a34a; color: #ffffff; border: none; border-radius: 6px; padding: 5px 8px; font-size: 0.74rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;"
                          title="Buka foto ukuran penuh">
                    <span>🔍 Buka Foto</span>
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <div style="margin-top: 14px; text-align: right;">
        <a href="https://wa.me/6282234582769?text=${encodeURIComponent('Halo DLH Kabupaten Lembata, saya ingin menanyakan tindak lanjut aduan dengan nomor register: ' + item.id)}" target="_blank" class="btn btn-primary btn-sm" style="background: #16a34a; border-color: #16a34a; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
          <span>💬</span> Chat WhatsApp Petugas DLH
        </a>
      </div>
    `;

    modal.classList.add('show');
  }

  openLightboxByIndex(type, index) {
    const rawList = (type === 'officer') ? (this._currentOfficerPhotos || []) : (this._currentCitizenPhotos || []);
    const cleanAduanId = (this._currentModalItem && this._currentModalItem.id) ? String(this._currentModalItem.id).trim().toUpperCase() : '';
    
    // Buat daftar URL foto yang sudah terformat dan terhubung dengan elemen DOM jika ada
    const resolvedList = rawList.map((raw, i) => {
      const domId = (type === 'officer') ? `imgDetailOfficer_${cleanAduanId}_${i}` : `imgDetailCitizen_${cleanAduanId}_${i}`;
      const el = document.getElementById(domId);
      if (el && el.src && el.style.display !== 'none' && !el.src.includes('error-placeholder')) {
        return el.src;
      }
      return this.formatPhotoUrl(raw) || raw;
    }).filter(Boolean);

    const safeIndex = Math.max(0, Math.min(index, resolvedList.length - 1));
    const currentSrc = resolvedList[safeIndex] || '';
    const baseCaption = (type === 'officer' ? 'Dokumentasi Petugas' : 'Bukti Foto Pelapor') + (this._currentModalItem ? ' • ' + this._currentModalItem.id : '');
    
    this.openLightbox(currentSrc, baseCaption, resolvedList, safeIndex);
  }

  openLightboxFromElement(imgId, fallbackSrc, caption) {
    let chosenSrc = fallbackSrc;
    const el = document.getElementById(imgId);
    if (el && el.src && el.style.display !== 'none') {
      chosenSrc = el.src;
    }
    this.openLightbox(chosenSrc, caption, [chosenSrc], 0);
  }

  openLightbox(src, caption = 'Bukti Foto Aduan Lingkungan', photoList = [], activeIndex = 0) {
    this.currentLightboxSrc = src;
    this.currentLightboxCaption = caption;
    this.lightboxPhotos = (Array.isArray(photoList) && photoList.length > 0) ? photoList : [src];
    this.lightboxCurrentIndex = Math.max(0, Math.min(activeIndex, this.lightboxPhotos.length - 1));

    this.lightboxScale = 1;
    this.lightboxTranslateX = 0;
    this.lightboxTranslateY = 0;
    this.isPanningLightbox = false;

    const modal = document.getElementById('modalPhotoLightbox');
    const img = document.getElementById('lightboxPhotoImg');
    const cap = document.getElementById('lightboxPhotoCaption');
    const counter = document.getElementById('lightboxPhotoCounter');
    const navControls = document.getElementById('lightboxNavControls');

    if (img) {
      img.referrerPolicy = 'no-referrer';
      img.src = this.formatPhotoUrl(this.lightboxPhotos[this.lightboxCurrentIndex]) || this.lightboxPhotos[this.lightboxCurrentIndex];
    }

    if (cap) {
      const numLabel = this.lightboxPhotos.length > 1 ? ` #${this.lightboxCurrentIndex + 1}` : '';
      cap.textContent = `${caption}${numLabel}`;
    }

    if (counter) {
      counter.textContent = `${this.lightboxCurrentIndex + 1}/${this.lightboxPhotos.length}`;
    }

    if (navControls) {
      navControls.style.display = this.lightboxPhotos.length > 1 ? 'inline-flex' : 'none';
    }

    this.updateLightboxTransform();

    if (modal) {
      modal.style.zIndex = '999999';
      modal.style.display = 'flex';
      modal.classList.add('show');
    }

    this.setupLightboxInteractions();
  }

  updateLightboxTransform() {
    const container = document.getElementById('lightboxTransformContainer');
    const zoomBadge = document.getElementById('lightboxZoomLevel');
    const viewport = document.getElementById('lightboxViewport');

    if (container) {
      container.style.transform = `translate(${this.lightboxTranslateX}px, ${this.lightboxTranslateY}px) scale(${this.lightboxScale})`;
    }
    if (zoomBadge) {
      zoomBadge.textContent = `${Math.round(this.lightboxScale * 100)}%`;
    }
    if (viewport) {
      if (this.lightboxScale > 1) {
        viewport.style.cursor = this.isPanningLightbox ? 'grabbing' : 'grab';
      } else {
        viewport.style.cursor = 'default';
      }
    }
  }

  zoomInLightbox(step = 0.25) {
    this.lightboxScale = Math.min(5, Number((this.lightboxScale + step).toFixed(2)));
    this.updateLightboxTransform();
  }

  zoomOutLightbox(step = 0.25) {
    this.lightboxScale = Math.max(0.5, Number((this.lightboxScale - step).toFixed(2)));
    if (this.lightboxScale <= 1) {
      this.lightboxTranslateX = 0;
      this.lightboxTranslateY = 0;
    }
    this.updateLightboxTransform();
  }

  resetZoomLightbox() {
    this.lightboxScale = 1;
    this.lightboxTranslateX = 0;
    this.lightboxTranslateY = 0;
    this.updateLightboxTransform();
  }

  nextLightboxPhoto() {
    if (!this.lightboxPhotos || this.lightboxPhotos.length <= 1) return;
    this.lightboxCurrentIndex = (this.lightboxCurrentIndex + 1) % this.lightboxPhotos.length;
    this.displayCurrentLightboxPhoto();
  }

  prevLightboxPhoto() {
    if (!this.lightboxPhotos || this.lightboxPhotos.length <= 1) return;
    this.lightboxCurrentIndex = (this.lightboxCurrentIndex - 1 + this.lightboxPhotos.length) % this.lightboxPhotos.length;
    this.displayCurrentLightboxPhoto();
  }

  displayCurrentLightboxPhoto() {
    const img = document.getElementById('lightboxPhotoImg');
    const cap = document.getElementById('lightboxPhotoCaption');
    const counter = document.getElementById('lightboxPhotoCounter');

    this.currentLightboxSrc = this.lightboxPhotos[this.lightboxCurrentIndex];
    if (img) {
      img.src = this.formatPhotoUrl(this.currentLightboxSrc) || this.currentLightboxSrc;
    }
    if (counter) {
      counter.textContent = `${this.lightboxCurrentIndex + 1}/${this.lightboxPhotos.length}`;
    }
    if (cap) {
      const baseCap = (this.currentLightboxCaption || 'Bukti Foto').replace(/\s*#\d+.*$/, '');
      const idInfo = this._currentModalItem ? ` • ${this._currentModalItem.id}` : '';
      cap.textContent = `${baseCap} #${this.lightboxCurrentIndex + 1}${idInfo}`;
    }
    this.resetZoomLightbox();
  }

  setupLightboxInteractions() {
    if (this._lightboxListenersBound) return;
    this._lightboxListenersBound = true;

    const btnZoomIn = document.getElementById('btnLightboxZoomIn');
    const btnZoomOut = document.getElementById('btnLightboxZoomOut');
    const btnReset = document.getElementById('btnLightboxZoomReset');
    const btnPrev = document.getElementById('btnLightboxPrev');
    const btnNext = document.getElementById('btnLightboxNext');
    const viewport = document.getElementById('lightboxViewport');
    const img = document.getElementById('lightboxPhotoImg');

    if (btnZoomIn) btnZoomIn.onclick = () => this.zoomInLightbox();
    if (btnZoomOut) btnZoomOut.onclick = () => this.zoomOutLightbox();
    if (btnReset) btnReset.onclick = () => this.resetZoomLightbox();
    if (btnPrev) btnPrev.onclick = () => this.prevLightboxPhoto();
    if (btnNext) btnNext.onclick = () => this.nextLightboxPhoto();

    // Dobel klik untuk zoom cepat 2.5x atau reset 1x
    if (img) {
      img.ondblclick = (e) => {
        e.stopPropagation();
        if (this.lightboxScale > 1) {
          this.resetZoomLightbox();
        } else {
          this.lightboxScale = 2.5;
          this.updateLightboxTransform();
        }
      };
    }

    // Roda mouse untuk zoom halus
    if (viewport) {
      viewport.onwheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.25 : -0.25;
        if (delta > 0) {
          this.zoomInLightbox(0.2);
        } else {
          this.zoomOutLightbox(0.2);
        }
      };

      // Drag / Pan interaktif (Pointer Events untuk mouse & touch)
      let startX = 0, startY = 0;
      let initialTranslateX = 0, initialTranslateY = 0;

      viewport.onpointerdown = (e) => {
        if (this.lightboxScale <= 1) return;
        this.isPanningLightbox = true;
        startX = e.clientX;
        startY = e.clientY;
        initialTranslateX = this.lightboxTranslateX;
        initialTranslateY = this.lightboxTranslateY;
        viewport.setPointerCapture(e.pointerId);
        this.updateLightboxTransform();
      };

      viewport.onpointermove = (e) => {
        if (!this.isPanningLightbox) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        this.lightboxTranslateX = initialTranslateX + dx;
        this.lightboxTranslateY = initialTranslateY + dy;
        this.updateLightboxTransform();
      };

      const endPan = (e) => {
        if (this.isPanningLightbox) {
          this.isPanningLightbox = false;
          try { viewport.releasePointerCapture(e.pointerId); } catch(err) {}
          this.updateLightboxTransform();
        }
      };

      viewport.onpointerup = endPan;
      viewport.onpointercancel = endPan;
    }

    // Keyboard navigation (Esc, +, -, Panah Kiri, Panah Kanan)
    window.addEventListener('keydown', (e) => {
      const modal = document.getElementById('modalPhotoLightbox');
      if (!modal || !modal.classList.contains('show')) return;

      if (e.key === 'Escape') {
        this.closeLightbox();
      } else if (e.key === 'ArrowRight') {
        this.nextLightboxPhoto();
      } else if (e.key === 'ArrowLeft') {
        this.prevLightboxPhoto();
      } else if (e.key === '+' || e.key === '=') {
        this.zoomInLightbox();
      } else if (e.key === '-' || e.key === '_') {
        this.zoomOutLightbox();
      } else if (e.key === '0') {
        this.resetZoomLightbox();
      }
    });
  }

  closeLightbox() {
    const modal = document.getElementById('modalPhotoLightbox');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
    this.resetZoomLightbox();
  }

  toggleZoomPhoto(imgElem) {
    if (this.lightboxScale > 1) {
      this.resetZoomLightbox();
    } else {
      this.lightboxScale = 2;
      this.updateLightboxTransform();
    }
  }

  openPhotoInNewWindow() {
    const src = this.currentLightboxSrc;
    if (!src) return;
    const caption = this.currentLightboxCaption || 'Bukti Foto Aduan Lingkungan';
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${caption} - DLH Lembata</title><style>body{margin:0;background:#0b1120;color:#f8fafc;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:20px;box-sizing:border-box;}.topbar{margin-bottom:14px;text-align:center;}.topbar h3{margin:0 0 4px;color:#10b981;font-size:1.15rem;}.img-wrap{max-width:96vw;max-height:82vh;border-radius:10px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.8);border:2px solid #334155;}img{max-width:100%;max-height:82vh;object-fit:contain;display:block;}.btn-dl{margin-top:14px;display:inline-block;background:#059669;color:white;padding:8px 18px;border-radius:8px;text-decoration:none;font-weight:700;font-size:0.85rem;}</style></head><body><div class="topbar"><h3>📸 ${caption}</h3><p>Dinas Lingkungan Hidup Kabupaten Lembata</p></div><div class="img-wrap"><img src="${src}" alt="${caption}"></div><a href="${src}" download="Bukti_Foto_DLH_${Date.now()}.jpg" class="btn-dl">⬇️ Unduh Foto Ini</a></body></html>`);
      w.document.close();
    }
  }

  downloadCurrentPhoto() {
    const src = this.currentLightboxSrc;
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = `Bukti_Foto_DLH_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /* ===================================================================
     8. CLOUD SYNC SETTINGS
     =================================================================== */
  setupCloudSync() {
    this.updateCloudUI();

    window.addEventListener('aduanDataSynced', (e) => {
      this.updateKPIs();
      this.renderTable();
      if (window.lembataMap) {
        window.lembataMap.renderMarkers();
        window.lembataMap.initMiniMap('miniMapPreview');
      }
      this.updateCloudUI();
      if (!e.detail?.silent) {
        const count = e.detail && e.detail.count ? e.detail.count : window.aduanStore.getAll().length;
        this.showToast(`Berhasil sinkron ${count} data dari Google Apps Script!`, 'success');
      }
    });

    const btnOpen = document.getElementById('btnOpenCloudModal');
    const modal = document.getElementById('modalCloudSync');
    const inputUrl = document.getElementById('inputGasUrl');

    if (btnOpen && modal) {
      btnOpen.addEventListener('click', () => {
        if (inputUrl) inputUrl.value = window.aduanStore.getGasUrl();
        this.updateCloudUI();
        modal.classList.add('show');
      });
    }

    const btnSave = document.getElementById('btnSaveGasUrl');
    if (btnSave) {
      btnSave.addEventListener('click', async () => {
        const urlVal = inputUrl ? inputUrl.value.trim() : '';
        window.aduanStore.setGasUrl(urlVal);
        if (inputUrl) inputUrl.value = window.aduanStore.getGasUrl();
        this.updateCloudUI();

        this.showToast('Menghubungkan ke Google Apps Script...', 'info');
        const res = await window.aduanStore.syncFromGAS();
        modal.classList.remove('show');
        if (res && res.success) {
          this.showToast('Berhasil terhubung ke Google Apps Script DLH!', 'success');
        } else {
          this.showToast(`Pengaturan disimpan. ${res?.error || res?.reason || ''}`, 'info');
        }
      });
    }

    const btnSyncNow = document.getElementById('btnTriggerSyncNow');
    if (btnSyncNow) {
      btnSyncNow.addEventListener('click', async () => {
        btnSyncNow.disabled = true;
        btnSyncNow.textContent = '⏳ Mengambil...';
        const res = await window.aduanStore.syncFromGAS();
        btnSyncNow.disabled = false;
        btnSyncNow.textContent = '🔄 Sinkronkan Data';
        this.updateCloudUI();
        if (res.success) {
          if (res.emptyRemote) {
            this.showToast('✅ Terhubung ke Google Spreadsheet! Lembar kerja saat ini masih kosong (0 aduan).', 'info');
          } else {
            this.showToast(res.message || 'Data berhasil disinkronkan dari Google Spreadsheet!', 'success');
          }
        } else {
          this.showToast(`Sinkronisasi: ${res.error || res.reason}`, 'warning');
        }
      });
    }

    const btnReset = document.getElementById('btnResetDefaultData');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Muat ulang dataset simulasi default Kabupaten Lembata?')) {
          window.aduanStore.resetToDefault();
          this.updateKPIs();
          this.renderTable();
          if (window.lembataMap) window.lembataMap.renderMarkers();
          this.updateCloudUI();
          this.showToast('Data dikembalikan ke standar awal Lembata.', 'info');
        }
      });
    }
  }

  updateCloudUI() {
    const isConfigured = window.aduanStore.hasGasConfigured();
    const dot = document.getElementById('cloudStatusDot');
    const text = document.getElementById('cloudStatusText');
    const detail = document.getElementById('cloudStatusDetail');
    const lastSync = document.getElementById('cloudLastSyncText');

    if (dot) dot.style.background = isConfigured ? '#10b981' : '#94a3b8';
    if (text) text.textContent = isConfigured ? 'Sheets Cloud' : 'Mode Lokal';
    if (detail) {
      detail.innerHTML = isConfigured 
        ? '<span style="color: #059669;">🟢 Terhubung ke Google Spreadsheet API</span>'
        : '⚪ Mode Lokal (LocalStorage)';
    }
    if (lastSync) {
      lastSync.textContent = window.aduanStore.lastSyncTime 
        ? `Sinkron terakhir: ${window.aduanStore.lastSyncTime.toLocaleTimeString('id-ID')}`
        : (isConfigured ? 'Siap mengirim & menerima data' : 'Dataset lokal browser');
    }
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : (type === 'warning' ? '⚠️' : 'ℹ️');

    toast.innerHTML = `<span>${icon}</span><div style="flex: 1;">${message}</div>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }
}

// Inisialisasi Aplikasi secara Handal (Mendukung DOMContentLoaded & readyState Interactive/Complete)
function startDLHApp() {
  if (!window.app) {
    window.app = new DLHApp();
    window.app.init();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startDLHApp);
} else {
  startDLHApp();
}

/* ===================================================================
   7. AUTO-HYDRATION & AUTOMATED TRACKING VIA URL PARAMETER (?tiket=)
   Terisolasi secara mandiri & aman dari proses initialization modul lain.
   =================================================================== */
window.addEventListener('DOMContentLoaded', () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const tiketParam = (urlParams.get('tiket') || urlParams.get('id') || '').trim();

    if (!tiketParam) return;

    // Tunggu jeda singkat agar seluruh komponen DOM & modul selesai terinisialisasi
    setTimeout(() => {
      // 1. Arahkan tab aktif ke antarmuka Pelacakan Tiket ('lacak')
      if (window.app && typeof window.app.switchTab === 'function') {
        window.app.switchTab('lacak');
      } else {
        const tabBtn = document.querySelector('.nav-tab-btn[data-tab="lacak"]');
        if (tabBtn) tabBtn.click();
      }

      // 2. Cari elemen input pencarian nomor tiket di halaman
      const inputElement = document.getElementById('quickTrackInput')
        || document.getElementById('cari-tiket')
        || document.querySelector('input[name="tiket"]')
        || document.getElementById('tableSearch');

      if (inputElement) {
        inputElement.value = tiketParam;
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Sinkronkan juga ke input pencarian tabel jika tersedia
      const tableSearchInput = document.getElementById('tableSearch');
      if (tableSearchInput && tableSearchInput !== inputElement) {
        tableSearchInput.value = tiketParam;
        if (window.app && window.app.tableFilters) {
          window.app.tableFilters.search = tiketParam.toLowerCase();
          if (typeof window.app.renderTable === 'function') {
            window.app.renderTable();
          }
        }
      }

      // 3. Trigger otomatis tombol cari / pelacakan status tiket
      const btnCari = document.getElementById('btnQuickTrack')
        || document.getElementById('btn-cari')
        || document.querySelector('.btn-track');

      if (window.app && typeof window.app.lacakTiket === 'function') {
        window.app.lacakTiket(tiketParam);
      } else if (btnCari) {
        btnCari.click();
      }

      // 4. Scroll otomatis ke bagian kontainer hasil pelacakan tiket
      const targetScroll = document.getElementById('quickTrackResult')
        || document.getElementById('quickTrackSection')
        || document.getElementById('pane-lacak');

      if (targetScroll && typeof targetScroll.scrollIntoView === 'function') {
        setTimeout(() => {
          try {
            targetScroll.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } catch (e) {
            targetScroll.scrollIntoView();
          }
        }, 200);
      }
    }, 200);
  } catch (err) {
    console.warn('Gagal memproses auto-hydration tiket via URL:', err);
  }
});

// Fallback jika skrip dimuat saat DOM sudah ready
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  window.dispatchEvent(new Event('DOMContentLoaded'));
}
