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
     4. FORM SUBMISSION (LANGSUNG TERHUBUNG KE WHATSAPP RESMI DLH LEMBATA)
     =================================================================== */
  setupFormSubmissions() {
    const form = document.getElementById('formAduanWarga');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btnSubmit = document.getElementById('btnSubmitAduan');
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = '⏳ Menyusun Aduan & Menyiapkan WhatsApp...';
      }

      // Kumpulkan semua file bukti foto (dari selectedMediaFiles, input file, atau kamera)
      const allMedia = [...(this.selectedMediaFiles || [])];
      const fileInput = document.getElementById('inputBuktiFoto');
      if (fileInput && fileInput.files && fileInput.files.length) {
        Array.from(fileInput.files).forEach(f => {
          if (!allMedia.includes(f)) allMedia.push(f);
        });
      }
      const cameraInput = document.getElementById('inputCameraCapture');
      if (cameraInput && cameraInput.files && cameraInput.files.length) {
        Array.from(cameraInput.files).forEach(f => {
          if (!allMedia.includes(f)) allMedia.push(f);
        });
      }

      // Konversi dan optimasi bukti foto ke Base64 Data URL
      const mediaPromises = allMedia.map(file => {
        return new Promise((resolve) => {
          if (typeof file === 'string') return resolve(file);
          if (!(file instanceof Blob)) return resolve(null);

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
                resolve(canvas.toDataURL('image/jpeg', 0.75));
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
        linkFotoBukti: buktiList[0] || '',
        buktiFotoList: buktiList
      };

      // Simpan ke database lokal
      const newRecord = window.aduanStore.addAduan(formData);

      // Link Google Maps koordinat presisi
      const finalLat = newRecord.lat || lat;
      const finalLng = newRecord.lng || lng;
      const mapsLink = (finalLat && finalLng)
        ? `https://maps.google.com/?q=${finalLat},${finalLng}`
        : 'Koordinat belum disetel';

      // Susun Format Pesan WhatsApp Resmi yang Lengkap untuk DLH Lembata (Tanpa Link Foto terpisah)
      const waMessage = 
`*PENGADUAN LINGKUNGAN HIDUP KABUPATEN LEMBATA*
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
  ? `• Status: Terlampir ${buktiList.length} Foto Bukti Kejadian (dikirim langsung bersama pesan ini)` 
  : '• Status: Pelapor tidak melampirkan foto bukti.'}
--------------------------------------------------
_Laporan resmi dikirim melalui formulir pengaduan masyarakat DLH Lembata._
_Mohon bantuan tindak lanjut dari Petugas Dinas Lingkungan Hidup Kab. Lembata. Terima kasih!_`;

      const waUrl = `https://wa.me/6282234582769?text=${encodeURIComponent(waMessage)}`;

      // Helper konversi Base64 DataURL menjadi File objek JPEG standar
      const dataUrlToJpegFile = (dataUrl, fileName) => {
        try {
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

      // Siapkan 1 berkas foto bukti JPEG siap kirim langsung ke WhatsApp
      let shareFile = null;
      if (buktiList.length === 1) {
        shareFile = dataUrlToJpegFile(buktiList[0], `bukti_${newRecord.id}.jpg`);
      } else if (buktiList.length > 1) {
        // Gabungkan seluruh foto ke satu frame kolase agar WhatsApp di HP warga
        // dapat mengirimkan seluruh foto sekaligus teks keterangan dalam 1 pesan tunggal
        try {
          const loadedImages = await Promise.all(
            buktiList.map(src => new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = () => resolve(null);
              img.src = src;
            }))
          );
          const validImgs = loadedImages.filter(Boolean);
          if (validImgs.length > 0) {
            const targetW = 900;
            const pad = 12;
            let totalH = pad;
            const heights = validImgs.map(img => {
              const h = Math.round((img.height * targetW) / (img.width || targetW));
              totalH += h + pad;
              return h;
            });
            const c = document.createElement('canvas');
            c.width = targetW;
            c.height = totalH;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, c.width, c.height);
            let curY = pad;
            validImgs.forEach((img, i) => {
              ctx.drawImage(img, pad, curY, targetW - (pad * 2), heights[i]);
              curY += heights[i] + pad;
            });
            shareFile = dataUrlToJpegFile(c.toDataURL('image/jpeg', 0.85), `bukti_${newRecord.id}.jpg`);
          }
        } catch (colErr) {
          console.warn('Gagal buat kolase foto:', colErr);
          shareFile = dataUrlToJpegFile(buktiList[0], `bukti_${newRecord.id}.jpg`);
        }
      }

      // Reset form
      form.reset();
      this.selectedMediaFiles = [];
      if (fileInput) fileInput.value = '';
      if (cameraInput) cameraInput.value = '';
      const previewList = document.getElementById('uploadPreviewList');
      if (previewList) previewList.innerHTML = '';
      const dateInput = document.getElementById('inputTanggalKejadian');
      if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
      if (this.populateDesaDropdown) this.populateDesaDropdown('Nubatukan');

      // Update UI components
      this.updateKPIs();
      this.renderTable();
      if (window.lembataMap) window.lembataMap.renderMarkers();

      // Langsung eksekusi Web Share API dengan File di HP (mengirim foto + teks sebagai caption 1 pesan)
      let autoShareTriggered = false;
      if (shareFile && navigator.share) {
        try {
          if (navigator.canShare && navigator.canShare({ files: [shareFile] })) {
            autoShareTriggered = true;
            await navigator.share({
              title: `Pengaduan Lingkungan ${newRecord.id}`,
              text: waMessage,
              files: [shareFile]
            });
            this.showToast('Laporan & foto bukti berhasil diteruskan ke WhatsApp DLH!', 'success');
          }
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') {
            autoShareTriggered = true;
          } else {
            console.warn('Auto share dilewati, tampilkan modal:', shareErr);
            autoShareTriggered = false;
          }
        }
      }

      // Tampilkan Modal Sukses Aduan
      const modalSuccess = document.getElementById('modalSuccessAduan');
      const ticketDisplay = document.getElementById('successTicketId');
      const btnWa = document.getElementById('btnWaConfirmation');
      const photoBox = document.getElementById('waPhotoAttachmentBox');
      const photoThumbContainer = document.getElementById('waPhotoThumbContainer');
      const photoCountBadge = document.getElementById('waPhotoCount');

      if (ticketDisplay) ticketDisplay.textContent = newRecord.id;

      // Konfigurasi Tombol Kirim WhatsApp: Menjamin pengiriman foto dalam satu kesatuan pesan tanpa copy-paste
      if (btnWa) {
        btnWa.onclick = async (evt) => {
          if (evt) evt.preventDefault();

          // 1. Prioritaskan Native Share dengan File (Foto + Keterangan dalam 1 pesan WhatsApp di HP)
          if (shareFile && navigator.share) {
            try {
              if (navigator.canShare && navigator.canShare({ files: [shareFile] })) {
                await navigator.share({
                  title: `Pengaduan Lingkungan ${newRecord.id}`,
                  text: waMessage,
                  files: [shareFile]
                });
                this.showToast('Laporan & foto bukti berhasil dibagikan ke WhatsApp!', 'success');
                return;
              }
            } catch (shareErr) {
              if (shareErr.name === 'AbortError') return;
              console.warn('Native share gagal, dialihkan:', shareErr);
            }
          }

          // 2. Fallback untuk Desktop PC / WhatsApp Web (Teks dikirim rapi tanpa link palsu, foto sudah tersimpan di database DLH)
          window.open(waUrl, '_blank');
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

      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '📲 KIRIM LAPORAN SEKARANG VIA WHATSAPP (DLH LEMBATA)';
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
        <strong>Patokan Lokasi:</strong> ${item.lokasiDetail || '-'}<br>
        <span style="font-family: monospace; font-size: 0.78rem; color: #059669;">🌐 Koordinat: ${item.lat}, ${item.lng}</span>
        ${mapsUrl ? `<br><a href="${mapsUrl}" target="_blank" style="color: #0284c7; text-decoration: underline; font-size: 0.8rem; font-weight: 600;">📍 Buka Titik Lokasi di Google Maps ↗</a>` : ''}
      </div>

      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 8px; margin-bottom: 14px; font-size: 0.88rem; color: #14532d;">
        <strong>Uraian Aduan:</strong><br>${item.uraian}
      </div>

      ${photoList.length > 0 ? `
        <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 14px;">
          <div style="font-size: 0.76rem; font-weight: 700; color: #64748b; margin-bottom: 8px;">📸 FOTO BUKTI PENDUKUNG (${photoList.length} Foto):</div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${photoList.map((src, i) => `
              <a href="${src}" target="_blank" style="display: inline-block; width: 80px; height: 80px; border-radius: 8px; overflow: hidden; border: 1.5px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.06);" title="Lihat Foto Bukti ${i+1}">
                <img src="${src}" alt="Bukti ${i+1}" style="width: 100%; height: 100%; object-fit: cover;">
              </a>
            `).join('')}
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
  window.app = new DLHApp();
  window.app.init();
});
