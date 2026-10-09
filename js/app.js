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

        if (file instanceof Blob || (typeof file === 'string' && (file.startsWith('data:') || file.startsWith('http')))) {
          const img = document.createElement('img');
          img.src = typeof file === 'string' ? file : URL.createObjectURL(file);
          img.alt = `Bukti ${idx + 1}`;
          item.appendChild(img);
        } else {
          item.innerHTML = '<span class="file-icon">📷</span>';
        }

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn-remove-preview';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = 'Hapus foto ini';
        removeBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.selectedMediaFiles.splice(idx, 1);
          renderPreviews();
        };
        item.appendChild(removeBtn);
        previewList.appendChild(item);
      });
    };

    const addFiles = (files) => {
      if (!files || !files.length) return;
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
        if (fileInput.files && fileInput.files.length) {
          addFiles(fileInput.files);
          fileInput.value = ''; // Reset agar bisa pilih file yang sama jika dihapus
        }
      });
    }

    // 2. Native Camera Capture (Fallback HP)
    if (cameraInput) {
      cameraInput.addEventListener('change', () => {
        if (cameraInput.files && cameraInput.files.length) {
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
        const canvas = document.createElement('canvas');
        let width = videoView.videoWidth || 640;
        let height = videoView.videoHeight || 480;
        const maxDim = 800;
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
        ctx.drawImage(videoView, 0, 0, width, height);

        const snapDataUrl = canvas.toDataURL('image/jpeg', 0.65);
        addFiles([snapDataUrl]);
        this.showToast('Foto bukti berhasil diambil dari kamera!', 'success');
        stopCamera();
      });
    }

    document.querySelectorAll('.btn-close-camera').forEach(btn => {
      btn.addEventListener('click', stopCamera);
    });

    // Drag and Drop & Zone click
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
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files.length) {
          addFiles(e.dataTransfer.files);
        }
      });
      uploadZone.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('.upload-preview-item')) return;
        if (fileInput) fileInput.click();
      });
    }
  }

  /* ===================================================================
     4. FORM SUBMISSION
     =================================================================== */
  setupFormSubmissions() {
    const form = document.getElementById('formAduanWarga');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btnSubmit = document.getElementById('btnSubmitAduan');
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = '⏳ Mengoptimalkan Foto & Mengirim Bukti...';
      }

      // Kumpulkan file dari selectedMediaFiles
      const filesToProcess = [...(this.selectedMediaFiles || [])];
      // Jika kosong, cek input file sebagai fallback
      const fileInput = document.getElementById('inputBuktiFoto');
      if (filesToProcess.length === 0 && fileInput && fileInput.files && fileInput.files.length) {
        Array.from(fileInput.files).forEach(f => filesToProcess.push(f));
      }
      const cameraInput = document.getElementById('inputCameraCapture');
      if (filesToProcess.length === 0 && cameraInput && cameraInput.files && cameraInput.files.length) {
        Array.from(cameraInput.files).forEach(f => filesToProcess.push(f));
      }

      // Konversi dan optimasi bukti foto ke resolusi web optimal (max 800px, 0.65 JPEG ~25-40KB)
      const mediaPromises = filesToProcess.map(file => {
        return new Promise((resolve) => {
          if (typeof file === 'string') {
            return resolve(file);
          }
          if (!(file instanceof Blob)) {
            return resolve(null);
          }

          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            const img = new Image();
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                let width = img.width || 640;
                let height = img.height || 480;
                const maxDim = 800;
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
                resolve(canvas.toDataURL('image/jpeg', 0.65));
              } catch (err) {
                resolve(dataUrl);
              }
            };
            img.onerror = () => resolve(dataUrl);
            img.src = dataUrl;
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });
      });

      const buktiList = (await Promise.all(mediaPromises)).filter(Boolean);

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
        lng: document.getElementById('inputLng').value,
        fotoBukti: buktiList[0] || '',
        linkFotoBukti: buktiList.join(', ') || (buktiList[0] || ''),
        buktiFotoList: buktiList
      };

      // Add to store (and auto-post to Google Apps Script / Spreadsheet)
      const newRecord = window.aduanStore.addAduan(formData);

      // Reset form
      form.reset();
      this.selectedMediaFiles = [];
      if (fileInput) fileInput.value = '';
      if (cameraInput) cameraInput.value = '';
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
          `📝 *Uraian:* ${newRecord.uraian}\n` +
          `📸 *Lampiran:* ${buktiList.length} Foto Terlampir\n\n` +
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
          <button class="btn btn-outline btn-sm" onclick="window.app.showDetailModal('${item.id}')">
            Lihat Detail
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

    // Foto bukti
    const photoList = [];
    if (Array.isArray(item.buktiFotoList)) {
      item.buktiFotoList.forEach(p => {
        if (typeof p === 'string' && p.trim() && !photoList.includes(p.trim())) photoList.push(p.trim());
        else if (p && p.dataUrl && !photoList.includes(p.dataUrl)) photoList.push(p.dataUrl);
      });
    }
    ['fotoBukti', 'linkFotoBukti', 'buktiFoto', 'linkFoto'].forEach(field => {
      const val = item[field];
      if (val && typeof val === 'string' && val.trim() && val !== '-' && !photoList.includes(val.trim())) {
        const strVal = val.trim();
        if (strVal.includes(',') && !strVal.startsWith('data:')) {
          strVal.split(',').forEach(sub => {
            const trimmed = sub.trim();
            if (trimmed && !photoList.includes(trimmed)) photoList.push(trimmed);
          });
        } else {
          photoList.push(strVal);
        }
      }
    });

    body.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
        <div>
          <span style="font-size: 0.75rem; color: #64748b;">KODE REGISTER:</span>
          <h2 style="font-size: 1.3rem; color: #059669; font-weight: 800;">${item.id}</h2>
        </div>
        <span class="badge ${this.getStatusBadgeClass(item.status)}">Aduan Masuk</span>
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

      ${photoList.length > 0 ? `
        <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 14px;">
          <div style="font-size: 0.78rem; font-weight: 700; color: #047857; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
            <span>📸 LAMPIRAN BUKTI PENDUKUNG (${photoList.length} FOTO):</span>
            <span style="font-size: 0.72rem; color: #64748b; font-weight: normal;">Klik foto untuk memperbesar</span>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            ${photoList.map((src, idx) => `
              <div class="evidence-thumb-wrap" onclick="window.app.openPhotoLightbox('${item.id}', ${idx})" title="Perbesar Foto Bukti ${idx + 1}" style="cursor: pointer; width: 85px; height: 85px; border-radius: 8px; overflow: hidden; border: 2px solid #e2e8f0; position: relative;">
                <img src="${src}" alt="Bukti ${idx + 1}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\' fill=\\'%2364748b\\' viewBox=\\'0 0 16 16\\'><text x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%2394a3b8\\'>Foto</text></svg>'">
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    modal.classList.add('show');
  }

  quickTrack(id) {
    this.showDetailModal(id);
  }

  openPhotoLightbox(ticketId, idx = 0) {
    const item = window.aduanStore.getById(ticketId);
    if (!item) return;

    const photoList = [];
    if (Array.isArray(item.buktiFotoList)) {
      item.buktiFotoList.forEach(p => {
        const u = typeof p === 'string' ? p : (p?.dataUrl || p?.url);
        if (u && !photoList.includes(u)) photoList.push(u);
      });
    }
    ['fotoBukti', 'linkFotoBukti', 'linkFoto', 'buktiFoto'].forEach(field => {
      const u = item[field];
      if (u && typeof u === 'string' && u !== '-' && !photoList.includes(u)) {
        if (u.includes(',') && !u.startsWith('data:')) {
          u.split(',').forEach(sub => {
            const tr = sub.trim();
            if (tr && !photoList.includes(tr)) photoList.push(tr);
          });
        } else {
          photoList.push(u.trim());
        }
      }
    });

    const targetSrc = photoList[idx] || photoList[0];
    if (!targetSrc) return;

    let lightbox = document.getElementById('modalPublicPhotoLightbox');
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.id = 'modalPublicPhotoLightbox';
      lightbox.className = 'modal-backdrop';
      lightbox.innerHTML = `
        <div class="modal-dialog" style="max-width: 760px; text-align: center;">
          <div class="modal-header">
            <h3 class="modal-title">📸 Bukti Foto Pengaduan (${ticketId})</h3>
            <button type="button" class="modal-close" onclick="document.getElementById('modalPublicPhotoLightbox').classList.remove('show')">&times;</button>
          </div>
          <div class="modal-body" style="background: #0f172a; padding: 16px;">
            <img id="lightboxImgPreview" src="" alt="Bukti Aduan" style="max-width: 100%; max-height: 70vh; object-fit: contain; border-radius: 8px;">
          </div>
          <div class="modal-footer" style="display: flex; justify-content: space-between;">
            <a id="lightboxBtnDownload" href="#" class="btn btn-primary btn-sm" download="bukti_aduan.jpg">📥 Unduh Foto</a>
            <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('modalPublicPhotoLightbox').classList.remove('show')">Tutup</button>
          </div>
        </div>
      `;
      document.body.appendChild(lightbox);
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.classList.remove('show');
      });
    }

    const img = document.getElementById('lightboxImgPreview');
    const dl = document.getElementById('lightboxBtnDownload');
    if (img) img.src = targetSrc;
    if (dl) {
      dl.href = targetSrc;
      if (targetSrc.startsWith('data:')) {
        dl.setAttribute('download', `bukti_${ticketId}.jpg`);
        dl.removeAttribute('target');
      } else {
        dl.removeAttribute('download');
        dl.setAttribute('target', '_blank');
      }
    }
    lightbox.classList.add('show');
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
  if (window.__dlhAppInitialized) return;
  window.__dlhAppInitialized = true;
  window.app = new DLHApp();
  window.app.init();
});
