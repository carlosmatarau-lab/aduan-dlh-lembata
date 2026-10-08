/**
 * ===================================================================
 * SILAPOR DLH KABUPATEN LEMBATA — MAIN JAVASCRIPT CONTROLLER
 * Ringan, Cepat, Responsif & Siap Digunakan Masyarakat
 * ===================================================================
 */

class DLHApp {
  constructor() {
    this.currentTab = 'lapor';
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
    this.setupFormSubmissions();
    this.setupGPSDetection();
    this.setupUploadPreview();
    this.setupTrackingSearch();
    this.setupTableAndFilters();
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
    this.currentTab = tabName;

    // Update active nav buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update active content panes
    document.querySelectorAll('.tab-content').forEach(pane => {
      pane.classList.remove('active');
    });

    const targetPane = document.getElementById(`pane-${tabName}`);
    if (targetPane) {
      targetPane.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

    this.populateDesaDropdown = (kecamatanName, selectedDesa = '') => {
      desaSelect.innerHTML = '<option value="">-- Pilih Desa / Kelurahan --</option>';
      
      const kecData = typeof KECAMATAN_LEMBATA !== 'undefined' ? KECAMATAN_LEMBATA[kecamatanName] : null;
      if (kecData && Array.isArray(kecData.desa)) {
        kecData.desa.forEach(namaDesa => {
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

    // Populasi awal berdasarkan nilai awal kecamatan
    this.populateDesaDropdown(kecSelect.value);

    // Event saat kecamatan diubah
    kecSelect.addEventListener('change', (e) => {
      this.populateDesaDropdown(e.target.value);
    });
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
     3.5 UPLOAD PREVIEW & LIVE CAMERA CAPTURE
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

    const renderPreviews = () => {
      if (!previewList) return;
      previewList.innerHTML = '';

      this.selectedMediaFiles.forEach((file, idx) => {
        const item = document.createElement('div');
        item.className = 'upload-preview-item';

        if (file.type.startsWith('image/')) {
          const img = document.createElement('img');
          img.src = URL.createObjectURL(file);
          item.appendChild(img);
        } else {
          item.innerHTML = '<span class="file-icon">🎥</span>';
        }

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove-preview';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = 'Hapus';
        removeBtn.onclick = (e) => {
          e.stopPropagation();
          this.selectedMediaFiles.splice(idx, 1);
          renderPreviews();
        };
        item.appendChild(removeBtn);
        previewList.appendChild(item);
      });
    };

    const addFiles = (files) => {
      Array.from(files).forEach(f => {
        if (this.selectedMediaFiles.length < 3) {
          this.selectedMediaFiles.push(f);
        } else {
          this.showToast('Batas maksimal 3 bukti foto/video tercapai.', 'warning');
        }
      });
      renderPreviews();
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
      if (this.selectedMediaFiles.length >= 3) {
        this.showToast('Maksimal 3 foto/video sudah tercapai.', 'warning');
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
     4. FORM SUBMISSION
     =================================================================== */
  setupFormSubmissions() {
    const form = document.getElementById('formAduanWarga');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const btnSubmit = document.getElementById('btnSubmitAduan');
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = '⏳ Mengirim Laporan ke DLH...';
      }

      // Read selected category
      const selectedRadio = document.querySelector('input[name="radioJenis"]:checked');
      const jenisPencemaran = selectedRadio ? selectedRadio.value : 'Lainnya';

      const formData = {
        namaPelapor: document.getElementById('inputNama').value,
        noHp: document.getElementById('inputNoHp').value,
        alamatPelapor: document.getElementById('inputAlamat').value,
        kecamatan: document.getElementById('inputKecamatan').value,
        desa: document.getElementById('inputDesa').value,
        lokasiDetail: document.getElementById('inputLokasiDetail').value,
        jenisPencemaran: jenisPencemaran,
        tanggalKejadian: document.getElementById('inputTanggalKejadian').value,
        sumberDugaan: document.getElementById('inputSumberDugaan').value,
        uraian: document.getElementById('inputUraian').value,
        lat: document.getElementById('inputLat').value,
        lng: document.getElementById('inputLng').value
      };

      // Add to store (and auto-post to Google Apps Script / Spreadsheet)
      const newRecord = window.aduanStore.addAduan(formData);

      // Reset form
      form.reset();
      this.selectedMediaFiles = [];
      const previewList = document.getElementById('uploadPreviewList');
      if (previewList) previewList.innerHTML = '';
      const dateInput = document.getElementById('inputTanggalKejadian');
      if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
      const kecVal = document.getElementById('inputKecamatan')?.value || 'Nubatukan';
      if (this.populateDesaDropdown) this.populateDesaDropdown(kecVal);

      // Update UI components
      this.updateKPIs();
      this.renderTable();
      if (window.lembataMap) window.lembataMap.renderMarkers();

      // Show Success Modal
      const modalSuccess = document.getElementById('modalSuccessAduan');
      const ticketDisplay = document.getElementById('successTicketId');
      const btnWa = document.getElementById('btnWaConfirmation');

      if (ticketDisplay) ticketDisplay.textContent = newRecord.id;
      if (btnWa) {
        const waText = encodeURIComponent(
          `Halo DLH Kabupaten Lembata, saya telah mengirimkan aduan pencemaran lingkungan melalui portal resmi.\n\n` +
          `📌 *KODE TIKET:* ${newRecord.id}\n` +
          `👤 *Nama:* ${newRecord.namaPelapor}\n` +
          `📍 *Lokasi:* ${newRecord.desa}, Kec. ${newRecord.kecamatan}\n` +
          `⚠️ *Masalah:* ${newRecord.jenisPencemaran}\n` +
          `📝 *Uraian:* ${newRecord.uraian}\n\n` +
          `Mohon bantuannya untuk dapat ditindaklanjuti. Terima kasih!`
        );
        btnWa.href = `https://wa.me/6282234582769?text=${waText}`;
      }

      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = '🚀 KIRIM LAPORAN SEKARANG';
      }

      if (modalSuccess) modalSuccess.classList.add('show');
    });

    // Form Update Verifikasi Petugas
    const formVerif = document.getElementById('formVerifikasiDLH');
    if (formVerif) {
      formVerif.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = document.getElementById('verifIdAduan').value;
        const updateData = {
          status: document.getElementById('verifStatus').value,
          petugasVerifikasi: document.getElementById('verifPetugas').value || 'Petugas DLH Lembata',
          tanggalVerifikasi: document.getElementById('verifTanggal').value || new Date().toISOString().split('T')[0],
          hasilVerifikasi: document.getElementById('verifHasil').value || 'Telah diverifikasi tim di lapangan.',
          tindakanDLH: document.getElementById('verifTindakan').value || 'Dalam penanganan DLH Kabupaten Lembata.'
        };

        window.aduanStore.updateVerifikasi(id, updateData);

        document.getElementById('modalVerifikasi').classList.remove('show');
        this.updateKPIs();
        this.renderTable();
        if (window.lembataMap) window.lembataMap.renderMarkers();

        this.showToast(`Verifikasi untuk ${id} berhasil disimpan ke sistem!`, 'success');
      });
    }
  }

  /* ===================================================================
     5. TRACKING SEARCH
     =================================================================== */
  setupTrackingSearch() {
    const btnSearch = document.getElementById('btnTrackSearch');
    const inputSearch = document.getElementById('inputTrackId');
    if (!btnSearch || !inputSearch) return;

    btnSearch.addEventListener('click', () => {
      const query = inputSearch.value.trim().toUpperCase();
      this.renderTrackResult(query, false);
    });

    inputSearch.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = inputSearch.value.trim().toUpperCase();
        this.renderTrackResult(query, false);
      }
    });
  }

  renderTrackResult(query, isRealtime = false) {
    const container = document.getElementById('trackResultContainer');
    if (!container) return;

    if (!query) {
      this.showToast('Masukkan nomor tiket aduan Anda.', 'warning');
      return;
    }

    const item = window.aduanStore.getById(query);
    container.style.display = 'block';

    if (!item) {
      container.innerHTML = `
        <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 20px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 6px;">❌</div>
          <strong style="color: #be123c;">Nomor Tiket "${query}" Tidak Ditemukan</strong>
          <p style="font-size: 0.85rem; color: #9f1239; margin-top: 4px;">
            Pastikan kode tiket yang Anda masukkan sesuai (Contoh format: <code>ADU-LMB-2026-001</code>).
          </p>
        </div>
      `;
      return;
    }

    if (isRealtime) {
      this.showToast(`⚡ Pembaruan Real-Time: Tindak lanjut aduan ${item.id} baru saja diperbarui oleh petugas! Status: ${item.status}`, 'success');
    }

    const isSelesai = item.status === 'Selesai';
    const isDitolak = item.status === 'Ditolak';
    const isDalamPenanganan = item.status === 'Dalam Penanganan' || isSelesai;
    const isSedangDiverif = item.status === 'Sedang Diverifikasi' || isDalamPenanganan;
    const isMenungguVerif = item.status === 'Menunggu Verifikasi Lapangan' || isSedangDiverif;
    const isVerifAdmin = item.status === 'Verifikasi Administrasi' || isMenungguVerif;

    // Kumpulkan foto bukti dukung warga
    const photoList = [];
    if (Array.isArray(item.buktiFotoList)) {
      item.buktiFotoList.forEach(p => { if (p && typeof p === 'string' && !photoList.includes(p)) photoList.push(p); });
    }
    if (item.fotoBukti && typeof item.fotoBukti === 'string' && !photoList.includes(item.fotoBukti)) {
      photoList.unshift(item.fotoBukti);
    }
    if (item.linkFotoBukti && typeof item.linkFotoBukti === 'string' && !photoList.includes(item.linkFotoBukti)) {
      photoList.push(item.linkFotoBukti);
    }

    container.innerHTML = `
      <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 22px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
        
        ${isRealtime ? `
          <div style="background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 1.5px solid #10b981; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; color: #064e3b;">
            <span style="display: flex; align-items: center; gap: 8px; font-weight: 800;">
              <span style="display: inline-block; width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.4);"></span>
              ⚡ Tindak Lanjut Baru Saja Diperbarui oleh Petugas DLH!
            </span>
            <span style="font-size: 0.73rem; color: #047857; font-weight: 700;">Update: ${new Date().toLocaleTimeString('id-ID')} WITA</span>
          </div>
        ` : `
          <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.74rem; color: #047857; background: #f0fdf4; padding: 3px 12px; border-radius: 999px; border: 1px solid #bbf7d0; margin-bottom: 12px;">
            <span style="width: 7px; height: 7px; background: #16a34a; border-radius: 50%; display: inline-block;"></span>
            <span>🟢 Terhubung Real-Time &bull; Perkembangan Lapangan Diperbarui Otomatis</span>
          </div>
        `}

        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div>
            <div style="font-size: 0.74rem; color: #64748b; font-weight: 700;">STATUS TERKINI TIKET ADUAN</div>
            <h3 style="font-size: 1.35rem; font-weight: 900; color: #065f46;">${item.id}</h3>
          </div>
          <span class="badge ${this.getStatusBadgeClass(item.status)}" style="font-size: 0.85rem; padding: 6px 14px; font-weight: 800;">
            ${item.status}
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-bottom: 16px; font-size: 0.84rem;">
          <div style="background: #f8fafc; padding: 10px 14px; border-radius: 8px;">
            <span style="color: #64748b; display: block; font-size: 0.74rem;">Nama Pelapor:</span>
            <strong>${item.namaPelapor}</strong>
          </div>
          <div style="background: #f8fafc; padding: 10px 14px; border-radius: 8px;">
            <span style="color: #64748b; display: block; font-size: 0.74rem;">Wilayah:</span>
            <strong>${item.desa}, Kec. ${item.kecamatan}</strong>
          </div>
          <div style="background: #f8fafc; padding: 10px 14px; border-radius: 8px;">
            <span style="color: #64748b; display: block; font-size: 0.74rem;">Kategori Dugaan:</span>
            <strong>${item.jenisPencemaran}</strong>
          </div>
          <div style="background: #f8fafc; padding: 10px 14px; border-radius: 8px;">
            <span style="color: #64748b; display: block; font-size: 0.74rem;">Waktu Lapor Masuk:</span>
            <strong>${item.timestamp}</strong>
          </div>
        </div>

        <div style="font-size: 0.88rem; color: #334155; background: #f0fdf4; padding: 12px 14px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #10b981;">
          <strong>📝 Uraian Laporan Masyarakat:</strong><br>
          "${item.uraian}"
        </div>

        ${photoList.length > 0 ? `
          <div style="margin-bottom: 16px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 12px 14px;">
            <div style="font-size: 0.78rem; font-weight: 800; color: #064e3b; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
              <span>📸 Bukti Dukung yang Diunggah / Kamera Warga:</span>
              <span style="font-size: 0.72rem; color: #64748b; font-weight: 600;">(${photoList.length} Foto)</span>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              ${photoList.map((p, pIdx) => `
                <a href="${p}" target="_blank" style="display: inline-block; width: 80px; height: 80px; border-radius: 6px; overflow: hidden; border: 1.5px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.06); transition: transform 0.2s;" title="Lihat Foto Bukti #${pIdx + 1} ↗" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                  <img src="${p}" alt="Bukti Foto ${pIdx + 1}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🖼️</text></svg>'">
                </a>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${item.rekamTindakanTerakhir ? `
          <div style="background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); border: 1.5px solid #a7f3d0; border-left: 4px solid #059669; border-radius: 10px; padding: 14px 16px; margin-bottom: 18px; font-size: 0.85rem;">
            <div style="font-weight: 800; color: #064e3b; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px;">
              <span style="display: flex; align-items: center; gap: 6px;">
                <span>⚡</span>
                <span>Rekam Tindakan Terakhir Petugas DLH:</span>
              </span>
              <span style="font-size: 0.74rem; color: #047857; font-weight: 700; background: #ffffff; padding: 2px 8px; border-radius: 999px; border: 1px solid #a7f3d0;">⏱️ ${item.rekamTindakanTerakhir.waktu || '-'}</span>
            </div>
            <div style="color: #065f46; margin-bottom: 4px;">
              <strong>🚜 Tindakan Lapangan:</strong> ${item.rekamTindakanTerakhir.tindakan}
            </div>
            ${item.rekamTindakanTerakhir.hasil ? `
              <div style="font-size: 0.82rem; color: #047857; margin-bottom: 4px;">
                <strong>📋 Fakta Temuan:</strong> ${item.rekamTindakanTerakhir.hasil}
              </div>
            ` : ''}
            ${item.rekamTindakanTerakhir.catatan ? `
              <div style="font-size: 0.8rem; color: #1e3a8a; font-style: italic; margin-bottom: 4px;">
                <strong>💡 Catatan / Rekomendasi:</strong> ${item.rekamTindakanTerakhir.catatan}
              </div>
            ` : ''}
            ${item.rekamTindakanTerakhir.petugas ? `
              <div style="font-size: 0.76rem; color: #64748b; margin-top: 6px;">
                Petugas Verifikator: <strong>${item.rekamTindakanTerakhir.petugas}</strong>
              </div>
            ` : ''}
            ${item.rekamTindakanTerakhir.foto ? `
              <div style="margin-top: 8px;">
                <a href="${item.rekamTindakanTerakhir.foto}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; background: #ffffff; border: 1px solid #a7f3d0; border-radius: 6px; color: #047857; font-size: 0.76rem; font-weight: 700; text-decoration: none;">
                  📸 Lihat Foto Bukti Tindakan Lapangan Petugas ↗
                </a>
              </div>
            ` : ''}
          </div>
        ` : ''}

        ${Array.isArray(item.riwayatTindakan) && item.riwayatTindakan.length > 1 ? `
          <div style="margin-bottom: 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px;">
            <div style="font-size: 0.82rem; font-weight: 800; color: #334155; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
              <span>📜 Kronologi Seluruh Rekam Tindakan (${item.riwayatTindakan.length} Aksi Lapangan):</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${item.riwayatTindakan.map((log, lIdx) => `
                <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; font-size: 0.8rem;">
                  <div style="display: flex; justify-content: space-between; font-weight: 700; color: #064e3b; margin-bottom: 3px;">
                    <span>#${lIdx + 1}. ${log.kategori || 'Tindakan Lapangan'}</span>
                    <span style="font-size: 0.72rem; color: #64748b;">⏱️ ${log.waktu || '-'}</span>
                  </div>
                  <div style="color: #334155;">${log.tindakan || '-'}</div>
                  ${log.hasil ? `<div style="font-size: 0.76rem; color: #047857; margin-top: 2px;">Temuan: ${log.hasil}</div>` : ''}
                  ${log.petugas ? `<div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">Petugas: ${log.petugas}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div style="font-weight: 800; font-size: 0.95rem; color: #0f172a; margin-bottom: 8px;">
          📋 Garis Waktu Penanganan DLH Lembata:
        </div>

        <div class="timeline">
          <div class="timeline-item completed">
            <div class="timeline-dot"></div>
            <div class="timeline-title">1. Aduan Diterima & Tercatat Sistem</div>
            <div class="timeline-time">${item.timestamp}</div>
            <div class="timeline-desc">Aduan masyarakat telah diterima dan dicatat dalam sistem pengaduan digital DLH Lembata.</div>
          </div>

          <div class="timeline-item ${isVerifAdmin ? 'completed' : ''}">
            <div class="timeline-dot"></div>
            <div class="timeline-title">2. Verifikasi Administrasi</div>
            <div class="timeline-desc">Kelengkapan data aduan diperiksa dan divalidasi oleh petugas administrasi DLH.</div>
          </div>

          <div class="timeline-item ${isMenungguVerif ? 'completed' : ''}">
            <div class="timeline-dot"></div>
            <div class="timeline-title">3. Menunggu Verifikasi Lapangan</div>
            <div class="timeline-desc">Aduan telah lulus verifikasi administrasi. Menunggu penjadwalan tim verifikasi ke lapangan.</div>
          </div>

          <div class="timeline-item ${isSedangDiverif ? 'completed' : ''}">
            <div class="timeline-dot"></div>
            <div class="timeline-title">4. Sedang Diverifikasi di Lapangan</div>
            <div class="timeline-time">${item.tanggalVerifikasi !== '-' ? item.tanggalVerifikasi : 'Menunggu jadwal'}</div>
            <div class="timeline-desc">
              ${item.petugasVerifikasi !== '-' ? `Verifikator: <strong>${item.petugasVerifikasi}</strong><br>Hasil: ${item.hasilVerifikasi}` : 'Tim DLH sedang melakukan observasi dan pemeriksaan kondisi faktual di lokasi.'}
            </div>
          </div>

          <div class="timeline-item ${isDalamPenanganan ? 'completed' : ''}">
            <div class="timeline-dot"></div>
            <div class="timeline-title">5. Dalam Penanganan DLH</div>
            <div class="timeline-desc">
              ${item.tindakanDLH !== '-' ? item.tindakanDLH : 'Menunggu tindakan rekomendasi dan penanganan.'}
            </div>
          </div>

          <div class="timeline-item ${isSelesai ? 'completed' : (isDitolak ? 'completed' : '')}">
            <div class="timeline-dot"></div>
            <div class="timeline-title">6. ${isDitolak ? 'Aduan Ditolak / Tidak Terbukti' : 'Selesai Ditangani'}</div>
            <div class="timeline-time">${item.tanggalSelesai !== '-' ? item.tanggalSelesai : '-'}</div>
            <div class="timeline-desc">
              ${isSelesai ? 'Pembersihan / pemulihan lingkungan dinyatakan tuntas oleh DLH Lembata.' : (isDitolak ? 'Hasil observasi menunjukkan tidak ada pencemaran berbahaya atau dialihkan ke instansi teknis terkait.' : 'Dalam proses penyelesaian.')}
            </div>
          </div>
        </div>

      </div>
    `;
  }

  quickTrack(ticketId) {
    this.switchTab('lacak');
    const input = document.getElementById('inputTrackId');
    const btn = document.getElementById('btnTrackSearch');
    if (input && btn) {
      input.value = ticketId;
      btn.click();
    }
  }

  /* ===================================================================
     5B. REAL-TIME SYNCHRONIZATION LISTENER (PORTAL WARGA)
     =================================================================== */
  setupRealtimeSync() {
    if (!window.dlhRealtime) return;

    window.dlhRealtime.listen((msg) => {
      if (!msg || !msg.type) return;

      if (msg.type === 'TINDAK_LANJUT_UPDATED') {
        if (window.aduanStore) {
          window.aduanStore.init();
        }
        this.updateKPIs();
        this.renderTable();
        if (window.lembataMap) window.lembataMap.renderMarkers();

        const updatedId = msg.payload?.aduanId || msg.payload?.id;
        const inputTrack = document.getElementById('inputTrackId');
        const currentQuery = inputTrack ? inputTrack.value.trim().toUpperCase() : '';
        const trackContainer = document.getElementById('trackResultContainer');

        if (updatedId && currentQuery === updatedId && trackContainer && trackContainer.style.display !== 'none') {
          this.renderTrackResult(updatedId, true);
        } else {
          const statusName = msg.payload?.item?.status || msg.payload?.status || 'Tindakan Lapangan';
          this.showToast(`⚡ Pembaruan Real-Time: Petugas DLH baru saja memperbarui tindakan untuk aduan ${updatedId} (Status: ${statusName})`, 'success');
        }
      } else if (msg.type === 'ADUAN_BARU' || msg.type === 'STORAGE_RAW_UPDATED') {
        if (window.aduanStore) {
          window.aduanStore.init();
        }
        this.updateKPIs();
        this.renderTable();
        if (window.lembataMap) window.lembataMap.renderMarkers();
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
          <td colspan="7" style="text-align: center; padding: 28px; color: #64748b;">
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
        <td><span class="badge ${this.getStatusBadgeClass(item.status)}">${item.status}</span></td>
        <td style="text-align: center; white-space: nowrap;">
          <button class="btn btn-outline btn-sm" onclick="window.app.showDetailModal('${item.id}')">
            Detail
          </button>
          <button class="btn btn-primary btn-sm" onclick="window.app.showVerifikasiModal('${item.id}')">
            Verifikasi
          </button>
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

    body.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
        <div>
          <span style="font-size: 0.75rem; color: #64748b;">KODE REGISTER:</span>
          <h2 style="font-size: 1.3rem; color: #059669; font-weight: 800;">${item.id}</h2>
        </div>
        <span class="badge ${this.getStatusBadgeClass(item.status)}">${item.status}</span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; font-size: 0.85rem;">
        <div style="background: #f8fafc; padding: 10px; border-radius: 8px;">
          <div style="color: #64748b; font-size: 0.75rem;">PELAPOR</div>
          <strong>${item.namaPelapor}</strong> (${item.noHp})
        </div>
        <div style="background: #f8fafc; padding: 10px; border-radius: 8px;">
          <div style="color: #64748b; font-size: 0.75rem;">LOKASI</div>
          <strong>Kec. ${item.kecamatan}</strong> - Desa ${item.desa}
        </div>
      </div>

      <div style="margin-bottom: 12px; font-size: 0.88rem;">
        <strong>Jenis Pencemaran:</strong> <span style="color: #059669; font-weight: 700;">${item.jenisPencemaran}</span>
      </div>

      <div style="margin-bottom: 14px; font-size: 0.85rem; color: #475569;">
        <strong>Patokan Lokasi:</strong> ${item.lokasiDetail}<br>
        <span style="font-family: monospace; font-size: 0.78rem; color: #059669;">🌐 Koordinat: ${item.lat}, ${item.lng}</span>
      </div>

      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 8px; margin-bottom: 14px; font-size: 0.88rem; color: #14532d;">
        <strong>Uraian Aduan:</strong><br>${item.uraian}
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; font-size: 0.85rem;">
        <div style="font-weight: 700; color: #064e3b; margin-bottom: 4px;">Pemeriksaan DLH Lembata:</div>
        <div>Verifikator: <strong>${item.petugasVerifikasi}</strong> (${item.tanggalVerifikasi})</div>
        <div style="margin-top: 4px;">Hasil: ${item.hasilVerifikasi}</div>
        <div style="margin-top: 4px;">Tindakan DLH: ${item.tindakanDLH}</div>
      </div>
    `;

    modal.classList.add('show');
  }

  showVerifikasiModal(id) {
    const item = window.aduanStore.getById(id);
    if (!item) return;

    const modal = document.getElementById('modalVerifikasi');
    if (!modal) return;

    document.getElementById('verifIdAduan').value = item.id;
    document.getElementById('verifDisplayId').textContent = item.id;
    document.getElementById('verifDisplayPelapor').textContent = `${item.namaPelapor} (Kec. ${item.kecamatan})`;
    document.getElementById('verifStatus').value = item.status;
    document.getElementById('verifPetugas').value = item.petugasVerifikasi !== '-' ? item.petugasVerifikasi : '';
    document.getElementById('verifTanggal').value = item.tanggalVerifikasi !== '-' ? item.tanggalVerifikasi : new Date().toISOString().split('T')[0];
    document.getElementById('verifHasil').value = item.hasilVerifikasi !== '-' ? item.hasilVerifikasi : '';
    document.getElementById('verifTindakan').value = item.tindakanDLH !== '-' ? item.tindakanDLH : '';

    modal.classList.add('show');
  }

  /* ===================================================================
     8. CLOUD SYNC SETTINGS
     =================================================================== */
  setupCloudSync() {
    this.updateCloudUI();

    window.addEventListener('aduanDataSynced', (e) => {
      this.updateKPIs();
      this.renderTable();
      if (window.lembataMap) window.lembataMap.renderMarkers();
      this.updateCloudUI();
      const count = e.detail && e.detail.count ? e.detail.count : window.aduanStore.getAll().length;
      this.showToast(`Berhasil sinkron ${count} data dari Google Spreadsheet!`, 'success');
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
        this.updateCloudUI();

        if (urlVal) {
          this.showToast('Menghubungkan ke Google Apps Script...', 'info');
          const res = await window.aduanStore.syncFromGAS();
          if (res.success) {
            modal.classList.remove('show');
          } else {
            this.showToast(`Gagal: ${res.error || res.reason}`, 'warning');
          }
        } else {
          modal.classList.remove('show');
          this.showToast('URL dikosongkan. Menggunakan penyimpanan lokal.', 'info');
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
        if (!res.success) {
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

// Inisialisasi Aplikasi saat Dokumen Siap
document.addEventListener('DOMContentLoaded', () => {
  window.app = new DLHApp();
  window.app.init();
});
