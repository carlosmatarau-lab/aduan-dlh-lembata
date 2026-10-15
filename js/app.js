/**
 * ===================================================================
 * SILAPOR DLH KABUPATEN LEMBATA — MAIN JAVASCRIPT CONTROLLER
 * Ringan, Cepat, Responsif & Siap Digunakan Masyarakat
 * ===================================================================
 */

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
    this.setupNavigation();
    this.setupCategoryChips();
    this.setupKecamatanDesaSync();
    this.setupPhoneValidation();
    this.setupFormSubmissions();
    this.setupGPSDetection();
    this.setupUploadPreview();
    this.setupTableAndFilters();
    this.setupQuickTracker();
    this.setupModals();
    this.setupCloudSync();
    this.setupRealtimeSync();
    this.updateKPIs();
    this.renderTable();

    // Set default date to today
    const dateInput = document.getElementById('inputTanggalKejadian');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Init map with slight delay
    setTimeout(() => {
      if (window.lembataMap) window.lembataMap.init();
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
      const targetFoto = urlParams.get('lihatFoto') || urlParams.get('foto') || urlParams.get('tiket');
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
          window.lembataMap.renderMarkers();
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
      'Ile Ape': ['Amakaka', 'Beutaran', 'Bungamuda', 'Dulitukan', 'Kolipadan', 'Kolontobo', 'Lamawara', 'Laranwuntun', 'Muruona', 'Napasabok', 'Palilolon', 'Petuntawa', 'Riangbao', 'Tagawiti', 'Tanjung Batu', 'Waowala', 'Watodiri'],
      'Ile Ape Timur': ['Aulesa', 'Bao Lai Duli', 'Jontona', 'Lamaau', 'Lamagute', 'Lamatokan', 'Lamawolo', 'Todanara', 'Waimatan'],
      'Lebatukan': ['Atakore', 'Balurebong', 'Baopana', 'Belobao', 'Dikesare', 'Hadakewa', 'Lamalela', 'Lamatuka', 'Lerahinga', 'Lewoeleng', 'Lodoblolong', 'Merdeka', 'Seranggorang', 'Tapobaran', 'Tapolangu', 'Waikomo', 'Wangatoa'],
      'Nagawutung': ['Babokerong', 'Boba', 'Duablolong', 'Ile Bale', 'Labalimut', 'Liwulagang', 'Loang', 'Pasir Putih', 'Penikene', 'Sinunmang', 'Tewowutung', 'Warawatung'],
      'Wulandoni': ['Alap Atadei', 'Atakera', 'Belobao', 'Imulolong', 'Lamalera A', 'Lamalera B', 'Lelata', 'Leworaja', 'Puuor A', 'Puuor B', 'South Puuor', 'Tapobali', 'Wulandoni'],
      'Atadei': ['Atakore', 'Dulir', 'Ile Kimok', 'Katakeja', 'Lerek', 'Lusilame', 'Mogoteta', 'Nogodoni', 'Nubahaeraka', 'Tubuk Rajan', 'Watuwawer'],
      'Omesuri': ['Balauring', 'Dolulolong', 'Hingalamamengi', 'Hoelea', 'Hoelea II', 'Leuwayang', 'Leubatang', 'Meluwiting', 'Nualela', 'Peusawa', 'Roma', 'Unleurn', 'Usun Manu', 'Walangsawa', 'Wowong'],
      'Buyasuri': ['Atulaleng', 'Atuwalupang', 'Bareng', 'Bean', 'Benikoor', 'Boli Bean', 'Buriwutung', 'Kalikur', 'Kalikur WL', 'Kaohua', 'Leuburi', 'Loyobohor', 'Mampir', 'Panama', 'Roho', 'Rumang', 'Tobotani', 'Tuwago', 'Umaleu', 'Wairiang']
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
        desaList.forEach(namaDesa => {
          const opt = document.createElement('option');
          opt.value = namaDesa;
          opt.textContent = namaDesa;
          if (selectedDesa && namaDesa.toLowerCase() === selectedDesa.toLowerCase()) {
            opt.selected = true;
          }
          desaSelect.appendChild(opt);
        });
      }
    };

    window.populateDesaDropdown = this.populateDesaDropdown.bind(this);

    // Populasi awal berdasarkan nilai awal kecamatan
    const initialKec = kecSelect.value || 'Nubatukan';
    this.populateDesaDropdown(initialKec);

    // Event saat kecamatan diubah
    kecSelect.addEventListener('change', (e) => {
      this.populateDesaDropdown(e.target.value);
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

    // Cek apakah diawali 08, +628, atau 628
    const startsWith08 = /^08\d+$/.test(clean);
    const startsWithPlus62 = /^\+628\d+$/.test(clean);
    const startsWith62 = /^628\d+$/.test(clean);

    if (!startsWith08 && !startsWithPlus62 && !startsWith62) {
      return {
        valid: false,
        message: 'Nomor wajib diawali angka 08 atau +62 (contoh: 081234567890)'
      };
    }

    // Hitung total digit angka murni
    const digitsOnly = clean.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return {
        valid: false,
        message: `Nomor terlalu pendek (${digitsOnly.length} digit). Minimal 10 digit angka.`
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
     3. GPS DETECTION
     =================================================================== */
  setupGPSDetection() {
    const btnGps = document.getElementById('btnDetectGps');
    const gpsMsg = document.getElementById('gpsStatusMessage');
    if (!btnGps) return;

    btnGps.addEventListener('click', () => {
      if (!navigator.geolocation) {
        if (gpsMsg) {
          gpsMsg.style.display = 'block';
          gpsMsg.style.color = '#e11d48';
          gpsMsg.textContent = 'Perangkat Anda belum mendukung deteksi GPS.';
        }
        return;
      }

      btnGps.disabled = true;
      btnGps.textContent = '⏳ Mengakses Titik Satelit GPS...';
      if (gpsMsg) {
        gpsMsg.style.display = 'block';
        gpsMsg.style.color = '#0284c7';
        gpsMsg.textContent = 'Sedang mencari koordinat akurat di lokasi Anda...';
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          
          document.getElementById('inputLat').value = lat;
          document.getElementById('inputLng').value = lng;

          btnGps.disabled = false;
          btnGps.textContent = '✅ Titik Lokasi GPS Terkunci';
          btnGps.style.background = '#dcfce7';
          btnGps.style.borderColor = '#16a34a';

          if (gpsMsg) {
            gpsMsg.style.color = '#15803d';
            gpsMsg.textContent = `Akurat! Koordinat: ${lat}, ${lng} (Akurasi: ±${Math.round(pos.coords.accuracy)}m)`;
          }
        },
        (err) => {
          btnGps.disabled = false;
          btnGps.textContent = '📍 Dapatkan Titik Lokasi GPS Saya Saat Ini';
          if (gpsMsg) {
            gpsMsg.style.color = '#d97706';
            gpsMsg.textContent = 'Izin lokasi tidak diberikan atau offline. Titik default kecamatan akan digunakan.';
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
  }

  /* ===================================================================
     3.4 PENGOMPRES & OPTIMASI MEDIA HANDAL (KAMERA & GALERI)
     Mendukung foto beresolusi tinggi (12-50MP) tanpa blocking & tanpa timeout 2 detik
     =================================================================== */
  async compressMediaFile(mediaItem, maxDim = 840, quality = 0.72) {
    if (!mediaItem) return null;
    if (typeof mediaItem === 'string') return mediaItem;

    // Jika sudah memiliki hasil kompresi dataUrl
    if (mediaItem.dataUrl && typeof mediaItem.dataUrl === 'string') {
      return mediaItem.dataUrl;
    }

    // Jika sedang dalam proses kompresi background, tunggu promise-nya
    if (mediaItem.compressPromise) {
      try {
        const res = await mediaItem.compressPromise;
        if (res) return res;
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
              resolve(canvas.toDataURL('image/jpeg', 0.7));
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

    // 2. Pendekatan Utama: createImageBitmap (Sangat cepat, non-blocking di main thread, instan untuk foto galeri puluhan megapixel)
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
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();
        return canvas.toDataURL('image/jpeg', quality);
      } catch (bmErr) {
        console.warn('createImageBitmap tidak didukung format gambar ini, beralih ke Image loading:', bmErr);
      }
    }

    // 3. Pendekatan Kedua: URL.createObjectURL + HTMLImageElement (Jauh lebih cepat dari FileReader, hemat RAM)
    return new Promise((resolve) => {
      let objectUrl = null;
      let safetyTimer = null;

      const finish = (result) => {
        if (safetyTimer) clearTimeout(safetyTimer);
        if (objectUrl) {
          try { URL.revokeObjectURL(objectUrl); } catch (e) {}
        }
        resolve(result);
      };

      // Safety timer 20 detik (cukup untuk smartphone lambat sekalipun)
      safetyTimer = setTimeout(() => {
        this._fallbackFileReader(file, finish);
      }, 20000);

      try {
        objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
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
            finish(canvas.toDataURL('image/jpeg', quality));
          } catch (cvErr) {
            this._fallbackFileReader(file, finish);
          }
        };
        img.onerror = () => {
          this._fallbackFileReader(file, finish);
        };
        img.src = objectUrl;
      } catch (err) {
        this._fallbackFileReader(file, finish);
      }
    });
  }

  _fallbackFileReader(file, callback) {
    try {
      const reader = new FileReader();
      const t = setTimeout(() => callback(null), 10000);
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
    if (clean.startsWith('data:image')) return clean;
    const driveMatch = clean.match(/(?:\/file\/d\/|[?&]id=)([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
    }
    return clean;
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
      if (!animCard) {
        if (onComplete) onComplete();
        return;
      }

      if (uploadAnimTimer) clearInterval(uploadAnimTimer);
      if (successBanner) successBanner.style.display = 'none';

      animCard.style.display = 'block';
      let progress = 0;
      if (animPercent) animPercent.textContent = '0%';
      if (progressFill) progressFill.style.width = '0%';
      if (animTitle) animTitle.textContent = `Mengunggah & Memproses ${count} Bukti Foto...`;
      if (animStep) animStep.textContent = 'Menghubungkan berkas dari perangkat...';

      const startTime = Date.now();
      const totalDuration = 2200; // 2.2 detik durasi animasi upload mulus

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
          setTimeout(() => {
            animCard.style.display = 'none';
            if (successBanner) {
              successBanner.style.display = 'flex';
              if (successDesc) {
                successDesc.textContent = `${this.selectedMediaFiles.length} bukti foto berhasil diunggah dengan status sukses (siap dilampirkan).`;
              }
            }
            this.showToast(`✅ ${count} Foto bukti berhasil diunggah! Status: Sukses.`, 'success');
            if (onComplete) onComplete();
          }, 300);
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

        // Badge Status Sukses di tiap thumbnail
        const badgeSuccess = document.createElement('span');
        badgeSuccess.className = 'upload-preview-badge-success';
        badgeSuccess.textContent = '✓ Sukses';
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
          mediaItem.compressPromise = this.compressMediaFile(f)
            .then(res => {
              mediaItem.dataUrl = res;
              mediaItem.isCompressing = false;
              renderPreviews();
              return res;
            })
            .catch(err => {
              console.warn('Gagal optimasi foto latar belakang:', err);
              mediaItem.isCompressing = false;
              renderPreviews();
              return null;
            });

          this.selectedMediaFiles.push(mediaItem);
          addedCount++;
        } else {
          this.showToast('Batas maksimal 5 bukti foto/video tercapai.', 'warning');
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
        this.showToast('Maksimal 5 foto/video sudah tercapai.', 'warning');
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

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (this._isSubmittingAduan) return;
      this._isSubmittingAduan = true;

      // 1. Validasi Input Nomor WhatsApp
      const inputNoHp = document.getElementById('inputNoHp');
      const noHpRaw = (inputNoHp?.value || '').trim();
      const phoneValidation = this.validatePhoneNumber(noHpRaw);

      if (!phoneValidation.valid) {
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

      // 2. Indikator Proses Pengiriman (Loading State)
      const btnSubmit = document.getElementById('btnSubmitAduan');
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="btn-spinner"></span> <span>Menyusun Laporan &amp; Mengarahkan ke WhatsApp...</span>';
      }

      this.showToast('⏳ Menyusun rekapan aduan & mengamankan data ke sistem DLH Lembata...', 'info');

      try {
        // Kumpulkan semua file bukti foto (dari selectedMediaFiles, input file, atau kamera)
        // Tunggu jika ada media yang masih dalam proses kompresi background
        for (const item of (this.selectedMediaFiles || [])) {
          if (item && item.isCompressing && item.compressPromise) {
            try {
              await Promise.race([
                item.compressPromise,
                new Promise(r => setTimeout(r, 4000))
              ]);
            } catch (e) {}
          }
        }

        const mediaPromises = (this.selectedMediaFiles || []).map(item => this.compressMediaFile(item));

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

        const buktiList = (await Promise.all(mediaPromises)).filter(Boolean);

        // Kategori pencemaran
        const selectedRadio = document.querySelector('input[name="radioJenis"]:checked');
        const jenisPencemaran = selectedRadio ? selectedRadio.value : 'Lainnya';

        const namaPelapor = (document.getElementById('inputNama')?.value || '').trim();
        const noHp = (document.getElementById('inputNoHp')?.value || '').trim();
        const alamatPelapor = (document.getElementById('inputAlamat')?.value || '').trim();
        const kecamatan = document.getElementById('inputKecamatan')?.value || 'Nubatukan';
        const desa = (document.getElementById('inputDesa')?.value || '').trim();
        const lokasiDetail = (document.getElementById('inputLokasiDetail')?.value || '').trim();
        const tanggalKejadian = document.getElementById('inputTanggalKejadian')?.value || new Date().toISOString().split('T')[0];
        const sumberDugaan = (document.getElementById('inputSumberDugaan')?.value || '').trim();
        const uraian = (document.getElementById('inputUraian')?.value || '').trim();
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
          lat: lat,
          lng: lng,
          fotoBukti: buktiList[0] || '',
          linkFotoBukti: buktiList.length > 1 ? buktiList.join(', ') : (buktiList[0] || ''),
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

        // 🌟 TAMPILKAN ANIMASI PENGIRIMAN LAPORAN (FLIGHT & PULSE EFFECT)
        const animOverlay = document.getElementById('submitAnimOverlay');
        if (animOverlay) {
          animOverlay.classList.add('active');
          await new Promise(resolve => setTimeout(resolve, 1300));
          animOverlay.classList.remove('active');
        }

        // Tampilkan Modal Sukses Aduan
        const modalSuccess = document.getElementById('modalSuccessAduan');
        const ticketDisplay = document.getElementById('successTicketId');
        const btnWa = document.getElementById('btnWaConfirmation');
        const btnDirectRoom = document.getElementById('btnWaDirectRoom');
        const photoBox = document.getElementById('waPhotoAttachmentBox');
        const photoThumbContainer = document.getElementById('waPhotoThumbContainer');
        const photoCountBadge = document.getElementById('waPhotoCount');
        const redirectNotice = document.getElementById('waRedirectLoadingNotice');
        if (redirectNotice) redirectNotice.style.display = 'none';

        if (ticketDisplay) ticketDisplay.textContent = newRecord.id;

        // Tombol 1 di Modal: Kirim Foto & Laporan ke WhatsApp
        if (btnWa) {
          btnWa.onclick = async (evt) => {
            if (evt) evt.preventDefault();
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

        // Tombol 2 di Modal: Buka Langsung Room Chat
        if (btnDirectRoom) {
          btnDirectRoom.onclick = (evt) => {
            if (evt) evt.preventDefault();
            btnDirectRoom.disabled = true;
            const origDirect = btnDirectRoom.innerHTML;
            btnDirectRoom.innerHTML = '<span class="btn-spinner" style="border-top-color: #059669; border-color: rgba(5,150,105,0.25);"></span> <span>Membuka Chat Room WhatsApp...</span>';
            if (redirectNotice) {
              redirectNotice.style.display = 'block';
              const noticeText = document.getElementById('waRedirectNoticeText');
              if (noticeText) noticeText.textContent = 'Membuka room chat WhatsApp nomor +62 822-3458-2769...';
            }
            setTimeout(() => {
              window.location.href = waUrl;
              setTimeout(() => {
                btnDirectRoom.disabled = false;
                btnDirectRoom.innerHTML = origDirect;
              }, 2500);
            }, 300);
          };
        }

        // Tampilkan Bukti Foto di Modal WhatsApp
        if (photoBox && photoThumbContainer) {
          if (buktiList.length > 0) {
            photoBox.style.display = 'block';
            if (photoCountBadge) photoCountBadge.textContent = buktiList.length;

            photoThumbContainer.innerHTML = buktiList.map((foto, idx) => `
              <div style="position: relative; flex-shrink: 0; width: 68px; height: 68px; border-radius: 8px; overflow: hidden; border: 2px solid #10b981; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <img src="${foto}" alt="Bukti ${idx + 1}" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
            `).join('');
          } else {
            photoBox.style.display = 'none';
          }
        }

        // Kembalikan tombol submit ke posisi aktif semula
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = '<span>📲</span> KIRIM LAPORAN KE KONTAK LAYANAN PENGADUAN';
        }

        // Buka modal konfirmasi sukses
        if (modalSuccess) modalSuccess.classList.add('show');

        // Otomatis arahkan dan buka WhatsApp langsung!
        this.showToast('✅ Laporan tersimpan! Membuka WhatsApp...', 'success');
        setTimeout(() => {
          try {
            window.location.href = waUrl;
          } catch (e) {
            window.open(waUrl, '_blank');
          }
        }, 450);

      } catch (submitErr) {
        console.error('Error saat memproses aduan:', submitErr);
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = '<span>📲</span> KIRIM LAPORAN KE KONTAK LAYANAN PENGADUAN';
        }
        this.showToast('Mengarahkan ke WhatsApp resmi...', 'info');
        const fallbackNoHp = (document.getElementById('inputNoHp')?.value || '').trim();
        const fallbackWaUrl = `https://api.whatsapp.com/send?phone=6282234582769&text=${encodeURIComponent('Halo Kontak Layanan Pengaduan DLH Kabupaten Lembata, saya warga Lembata (No HP: ' + fallbackNoHp + ') ingin menyampaikan aduan lingkungan hidup.')}`;
        setTimeout(() => {
          window.location.href = fallbackWaUrl;
        }, 600);
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

    tbody.innerHTML = filtered.map(item => `
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
    document.querySelectorAll('.modal-close, .btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-backdrop').forEach(modal => modal.classList.remove('show'));
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.classList.remove('show');
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
    const photoList = [];
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
        const matches = trimmed.match(/(data:image\/[^;]+;base64,[^,\s]+|https?:\/\/[^\s,]+)/g);
        if (matches && matches.length > 0) {
          matches.forEach(m => {
            const cleanM = m.trim();
            if (cleanM && !photoList.includes(cleanM)) photoList.push(cleanM);
          });
        } else if (!photoList.includes(trimmed)) {
          photoList.push(trimmed);
        }
      }
    };

    extractPhotos(item.buktiFotoList);
    ['fotoBukti', 'linkFotoBukti', 'buktiFoto', 'linkFoto'].forEach(field => {
      extractPhotos(item[field]);
    });

    // 2. Foto Dokumentasi Tindak Lanjut Petugas DLH (Jika Laporan Sudah Diverifikasi)
    const isUnverified = (!item.status || item.status === 'Baru' || item.status === 'Aduan Diterima' || item.status === 'Verifikasi Administrasi');
    const officerPhotos = [];
    if (!isUnverified) {
      if (Array.isArray(item.fotoVerifikasiList)) {
        item.fotoVerifikasiList.forEach(p => {
          if (p && !officerPhotos.includes(p)) officerPhotos.push(p);
        });
      }
      if (item.fotoKondisiRiil && item.fotoKondisiRiil !== '-' && !officerPhotos.includes(item.fotoKondisiRiil)) {
        officerPhotos.push(item.fotoKondisiRiil);
      }
    }

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
              return `
                <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 6px;">
                  <div onclick="window.app.openLightbox('${safeSrc}', 'Bukti Foto Pelapor #${i+1} &bull; ${item.id}')"
                       style="cursor: pointer; border-radius: 8px; overflow: hidden; border: 2px solid #059669; background: #0f172a; position: relative; height: 125px; transition: transform 0.2s;"
                       onmouseover="this.style.transform='scale(1.02)';"
                       onmouseout="this.style.transform='scale(1)';"
                       title="Klik foto untuk melihat ukuran penuh">
                    <img src="${displaySrc}"
                         data-original="${origSafe}"
                         alt="Bukti Foto ${i+1}"
                         onerror="
                           if (!this.dataset.fallbackDone) {
                             this.dataset.fallbackDone = '1';
                             const m = (this.dataset.original || this.src).match(/(?:\\/file\\/d\\/|[?&]id=|\\/d\\/)([a-zA-Z0-9_-]+)/);
                             if (m && m[1]) {
                               this.src = 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1200';
                               return;
                             }
                           }
                           this.style.display = 'none';
                           if (this.nextElementSibling) this.nextElementSibling.style.display = 'flex';
                         "
                         style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;">
                    <div style="display: none; width: 100%; height: 100%; background: #0f172a; color: #f8fafc; flex-direction: column; align-items: center; justify-content: center; padding: 8px; text-align: center;">
                      <span style="font-size: 1.4rem;">📸</span>
                      <span style="font-size: 0.72rem; font-weight: 700; color: #34d399; margin-top: 4px;">Buka di Google Drive</span>
                    </div>
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.85)); color: #fff; font-size: 0.7rem; font-weight: 700; padding: 4px; text-align: center; pointer-events: none;">
                      🔍 Klik Perbesar
                    </div>
                  </div>
                  <button type="button" onclick="window.app.openLightbox('${safeSrc}', 'Bukti Foto Pelapor #${i+1} &bull; ${item.id}')"
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
              return `
                <div style="background: #ffffff; border: 1.5px solid #86efac; border-radius: 10px; padding: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 6px;">
                  <div onclick="window.app.openLightbox('${safeSrc}', 'Foto Fisik Petugas #${i+1} &bull; ${item.id}')"
                       style="cursor: pointer; border-radius: 8px; overflow: hidden; border: 2px solid #16a34a; background: #0f172a; position: relative; height: 125px; transition: transform 0.2s;"
                       onmouseover="this.style.transform='scale(1.02)';"
                       onmouseout="this.style.transform='scale(1)';"
                       title="Klik foto untuk melihat ukuran penuh">
                    <img src="${displaySrc}"
                         data-original="${origSafe}"
                         alt="Foto Fisik ${i+1}"
                         onerror="
                           if (!this.dataset.fallbackDone) {
                             this.dataset.fallbackDone = '1';
                             const m = (this.dataset.original || this.src).match(/(?:\\/file\\/d\\/|[?&]id=|\\/d\\/)([a-zA-Z0-9_-]+)/);
                             if (m && m[1]) {
                               this.src = 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1200';
                               return;
                             }
                           }
                           this.style.display = 'none';
                           if (this.nextElementSibling) this.nextElementSibling.style.display = 'flex';
                         "
                         style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;">
                    <div style="display: none; width: 100%; height: 100%; background: #0f172a; color: #f8fafc; flex-direction: column; align-items: center; justify-content: center; padding: 8px; text-align: center;">
                      <span style="font-size: 1.4rem;">📸</span>
                      <span style="font-size: 0.72rem; font-weight: 700; color: #4ade80; margin-top: 4px;">Buka di Google Drive</span>
                    </div>
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.85)); color: #fff; font-size: 0.7rem; font-weight: 700; padding: 4px; text-align: center; pointer-events: none;">
                      🔍 Klik Perbesar
                    </div>
                  </div>
                  <button type="button" onclick="window.app.openLightbox('${safeSrc}', 'Foto Fisik Petugas #${i+1} &bull; ${item.id}')"
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

  openLightbox(src, caption = 'Bukti Foto Aduan Lingkungan') {
    this.currentLightboxSrc = src;
    this.currentLightboxCaption = caption;
    const modal = document.getElementById('modalPhotoLightbox');
    const img = document.getElementById('lightboxPhotoImg');
    const cap = document.getElementById('lightboxPhotoCaption');
    if (img) {
      img.src = this.formatPhotoUrl(src) || src;
      img.style.transform = 'scale(1)';
      img.style.cursor = 'zoom-in';
    }
    if (cap) cap.textContent = caption;
    if (modal) {
      modal.style.zIndex = '999999';
      modal.style.display = 'flex';
      modal.classList.add('show');
    }
  }

  closeLightbox() {
    const modal = document.getElementById('modalPhotoLightbox');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }

  toggleZoomPhoto(imgElem) {
    if (!imgElem) return;
    if (imgElem.style.transform === 'scale(1.8)') {
      imgElem.style.transform = 'scale(1)';
      imgElem.style.cursor = 'zoom-in';
    } else {
      imgElem.style.transform = 'scale(1.8)';
      imgElem.style.cursor = 'zoom-out';
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
