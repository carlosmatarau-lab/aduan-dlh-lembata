/**
 * SISTEM PENDATAAN DIGITAL ADUAN PENCEMARAN LINGKUNGAN
 * DINAS LINGKUNGAN HIDUP KABUPATEN LEMBATA
 * Enhanced Interactive Map Engine (Leaflet + Citra Satelit + Tooltips)
 */

/**
 * Format nama wilayah administratif Desa vs Kelurahan Kabupaten Lembata
 * @param {string} rawNama
 * @returns {string}
 */
function formatWilayahAdministratif(rawNama) {
  if (!rawNama || rawNama === '-') return '-';
  let clean = String(rawNama).trim();

  const daftarKelurahan = [
    'lewoleba', 'lewoleba utara', 'lewoleba selatan', 
    'lewoleba tengah', 'lewoleba timur', 'lewoleba barat', 'selandoro'
  ];

  // Cek apakah string mengandung penanda kelurahan
  const isTaggedKelurahan = /\(kelurahan\)|^kelurahan\s+/i.test(clean);

  // Bersihkan awalan Desa/Kelurahan dan akhiran (Kelurahan)/(Desa)
  clean = clean
    .replace(/^(desa|kelurahan|kel\.?)\s+/i, '')
    .replace(/\s*\((kelurahan|desa)\)/i, '')
    .trim();

  if (!clean || clean === '-') return '-';

  const isKnownKelurahan = daftarKelurahan.includes(clean.toLowerCase());

  if (isTaggedKelurahan || isKnownKelurahan) {
    return `Kelurahan ${clean}`;
  }
  return `Desa ${clean}`;
}

window.formatWilayahAdministratif = formatWilayahAdministratif;

class LembataMapEngine {
  constructor(containerId = 'map') {
    this.containerId = containerId;
    this.map = null;
    this.markersGroup = null;
    this.landmarksGroup = null;
    this.markerInstances = {}; // Menyimpan referensi marker per ID tiket
    this.centerCoords = [-8.380, 123.575]; // Pusat Geografis Pulau Lembata
    this.defaultZoom = 11;
    this.activeFilter = {
      status: 'all',
      kecamatan: 'all',
      jenis: 'all'
    };
    this.baseLayers = {};
    this.currentBaseLayer = 'osm';
    this.formatWilayahAdministratif = formatWilayahAdministratif;
  }

  init() {
    const container = document.getElementById(this.containerId);
    if (typeof L !== 'undefined') {
      if (container) {
        this.initLeaflet();
        this.setupBasemapButtons();
        this.setupRegionPills();
        this.setupLegendInteractions();
      }
      this.initMiniMap('miniMapPreview');
    } else {
      console.warn('Leaflet CDN tidak terdeteksi, mengaktifkan peta vektor SVG fallback');
      if (container) this.initSvgFallback();
      this.initMiniMapFallback('miniMapPreview');
    }
  }

  initLeaflet() {
    try {
      // Bounding box geografis Pulau Lembata (mengunci peta hanya di wilayah Lembata)
      const southWest = L.latLng(-8.75, 123.05);
      const northEast = L.latLng(-8.05, 124.02);
      this.lembataBounds = L.latLngBounds(southWest, northEast);

      this.map = L.map(this.containerId, {
        center: this.centerCoords,
        zoom: this.defaultZoom,
        minZoom: 10,
        maxZoom: 18,
        maxBounds: this.lembataBounds,
        maxBoundsViscosity: 1.0, // Mengunci gerak peta 100% hanya di Pulau Lembata
        zoomControl: true,
        scrollWheelZoom: true
      });

      // Kunci juga maxBounds secara eksplisit
      this.map.setMaxBounds(this.lembataBounds);

      // 1. Layer Peta Standar (OpenStreetMap - 100% Bebas Watermark, Gratis & Stabil)
      const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> kontributor | DLH Kab. Lembata'
      });

      // 2. Layer Peta Jalan & Kota (Esri World Street Map - Tampilan Jalan & Pemukiman Sangat Jelas)
      const esriStreetLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Peta Jalan &copy; Esri, DeLorme, TomTom | DLH Lembata'
      });

      // 3. Layer Citra Satelit Nyata + Label Nama Kota (Esri World Imagery Hybrid)
      const satBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Citra Satelit &copy; Esri, Maxar, Earthstar Geographics'
      });
      const satLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
      });
      const satLayer = L.layerGroup([satBase, satLabels]);

      // 4. Layer Peta Topografi & Relief (Esri World Topo)
      const topoLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Topografi &copy; Esri, USGS'
      });

      // Default basemap: Peta Jalan OSM
      osmLayer.addTo(this.map);

      // Quick Basemap Switcher menggunakan tombol mengambang (.map-floating-basemap)
      // Kontrol bawaan Leaflet dihilangkan agar tidak menduplikasi kontrol dan menghemat ruang kanvas
      this.baseLayers = {
        'osm': osmLayer,
        'street': esriStreetLayer,
        'sat': satLayer,
        'topo': topoLayer
      };
      this.currentBaseLayer = 'osm';

      // Tambahkan skala jarak (metric)
      L.control.scale({ imperial: false, position: 'bottomright' }).addTo(this.map);

      // Inisialisasi layer penanda aduan
      this.markersGroup = L.layerGroup().addTo(this.map);

      // Tambahkan penanda landmark geografis penting Lembata
      this.addGeographicLandmarks();

      // Render pertama kali
      this.renderMarkers();

      // Pastikan petak peta Leaflet terisi penuh tanpa celah abu-abu
      setTimeout(() => {
        try {
          if (this.map) this.map.invalidateSize();
        } catch (e) {}
      }, 250);
    } catch (err) {
      console.error('Error saat inisialisasi Leaflet:', err);
      this.initSvgFallback();
    }
  }

  /* Landmark Geografis Pulau Lembata untuk memudahkan masyarakat mengenali wilayah */
  addGeographicLandmarks() {
    if (!this.map) return;
    this.landmarksGroup = L.layerGroup().addTo(this.map);

    const landmarks = [
      { name: 'Kota Lewoleba (Ibukota)', coords: [-8.375, 123.418], desc: 'Pusat Pemerintahan, Pelabuhan & Ibukota Lembata' },
      { name: 'Teluk Lewoleba', coords: [-8.355, 123.400], desc: 'Kawasan Pesisir Nubatukan' },
      { name: 'Gunung Ile Lewotolok', coords: [-8.273, 123.507], desc: 'Puncak Vulkanik Ile Ape' },
      { name: 'Teluk Hadakewa', coords: [-8.365, 123.548], desc: 'Pesisir Hadakewa Lebatukan' },
      { name: 'Tanjung Batu', coords: [-8.245, 123.485], desc: 'Ujung Utara Ile Ape' },
      { name: 'Balauring (Kedang)', coords: [-8.234, 123.706], desc: 'Pusat Kecamatan Omesuri' },
      { name: 'Wairiang (Buyasuri)', coords: [-8.192, 123.820], desc: 'Pusat Kecamatan Buyasuri' },
      { name: 'Lamalera (Wulandoni)', coords: [-8.552, 123.435], desc: 'Desa Tradisional Pesisir Selatan' },
      { name: 'Mingar / Loang (Nagawutung)', coords: [-8.490, 123.360], desc: 'Kawasan Pesisir Barat Daya' },
      { name: 'Kalikasa (Atadei)', coords: [-8.434, 123.468], desc: 'Pusat Kecamatan Atadei' }
    ];

    landmarks.forEach(lm => {
      const landmarkIcon = L.divIcon({
        className: 'landmark-map-label',
        html: `<div style="
          background: rgba(15, 23, 42, 0.75);
          color: #ffffff;
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          pointer-events: none;
        ">${lm.name}</div>`,
        iconSize: [120, 20],
        iconAnchor: [60, 10]
      });

      L.marker(lm.coords, { icon: landmarkIcon, interactive: false }).addTo(this.landmarksGroup);
    });
  }

  /* Ikon Kategori Pencemaran (Zero-Emoji Policy untuk Gov WebGIS) */
  getCategoryIcon(jenis) {
    return '';
  }

  /* Warna Status Aduan */
  getMarkerColor(status) {
    switch (status) {
      case 'Baru':
      case 'Aduan Diterima': return '#f59e0b'; // Amber / Kuning Jingga
      case 'Verifikasi Administrasi': return '#ca8a04'; // Emas
      case 'Menunggu Verifikasi Lapangan': return '#ea580c'; // Oranye
      case 'Sedang Diverifikasi':
      case 'Diverifikasi': return '#8b5cf6'; // Ungu
      case 'Dalam Penanganan':
      case 'Ditindaklanjuti': return '#2563eb'; // Biru
      case 'Selesai': return '#059669'; // Hijau
      case 'Ditolak': return '#64748b'; // Abu-abu
      default: return '#10b981';
    }
  }

  /* Custom Leaflet Pin Icon (Gov Clean Pin dengan Dot Putih Solid dan Halo Denyut) */
  createPinIcon(item) {
    const color = this.getMarkerColor(item.status);
    const isActivelyHandled = item.status !== 'Selesai' && item.status !== 'Ditolak';

    return L.divIcon({
      className: 'custom-leaflet-marker-wrapper',
      html: `
        <div class="custom-leaflet-marker" style="--marker-color: ${color};">
          ${isActivelyHandled ? `<div class="marker-pulse-ring" style="border-color: ${color};"></div>` : ''}
          <div class="marker-pin" style="background: ${color};">
            <span class="marker-pin-dot"></span>
          </div>
        </div>
      `,
      iconSize: [28, 34],
      iconAnchor: [14, 32],
      popupAnchor: [0, -32]
    });
  }

  /* Render Marker di Peta Sesuai Filter */
  renderMarkers() {
    if (!this.map || !this.markersGroup) return;

    this.markersGroup.clearLayers();
    this.markerInstances = {};

    const data = window.aduanStore ? window.aduanStore.getAll() : [];

    const filtered = data.filter(item => {
      const matchStatus = this.activeFilter.status === 'all' || item.status === this.activeFilter.status;
      const matchKec = this.activeFilter.kecamatan === 'all' || item.kecamatan === this.activeFilter.kecamatan;
      const matchJenis = this.activeFilter.jenis === 'all' || item.jenisPencemaran === this.activeFilter.jenis;
      return matchStatus && matchKec && matchJenis;
    });

    // Update Mini Statistik & Feed List di Bawah Peta
    this.updateMapStats(filtered, data);
    this.renderMapFeed(filtered);

    const bounds = [];

    filtered.forEach(item => {
      if (item.lat && item.lng) {
        bounds.push([item.lat, item.lng]);

        const marker = L.marker([item.lat, item.lng], {
          icon: this.createPinIcon(item)
        });

        const color = this.getMarkerColor(item.status);
        const catIcon = this.getCategoryIcon(item.jenisPencemaran);
        const badgeClass = (item.status || 'baru').toLowerCase().replace(/[^a-z0-9]/g, '-');

        // Sanitasi teks uraian (pisahkan aduan asli dari tag sistem backend internal)
        let cleanUraian = (item.uraian || '-').trim();
        if (cleanUraian.includes('---')) {
          cleanUraian = cleanUraian.split('---')[0].trim();
        }
        cleanUraian = cleanUraian
          .replace(/\[PENYELESAIAN_DIINGINKAN\]:[\s\S]*/gi, '')
          .replace(/\[RIWAYAT_INSTANSI\]:[\s\S]*/gi, '')
          .replace(/\[[A-Z0-9_]+:[^\]]*\]/gi, '')
          .trim();
        if (!cleanUraian) cleanUraian = '-';

        // Sanitasi teks tindakan DLH jika ada
        let cleanTindakan = (item.tindakanDLH && item.tindakanDLH !== '-') ? item.tindakanDLH.trim() : '';
        if (cleanTindakan) {
          if (cleanTindakan.includes('---')) {
            cleanTindakan = cleanTindakan.split('---')[0].trim();
          }
          cleanTindakan = cleanTindakan
            .replace(/\[[A-Z0-9_]+:[^\]]*\]/gi, '')
            .trim();
        }

        // Sanitasi wilayah administratif (Desa vs Kelurahan resmi Lembata)
        const desaKelFormatted = formatWilayahAdministratif(item.desa);

        // 1. Tooltip Instan Saat Kursor Diarahkan (Hover) - Non-permanent agar tidak mengotori layar mobile
        marker.bindTooltip(`
          <div class="map-tooltip-content">
            <div class="tt-header">
              <span class="tt-id">${item.id}</span>
              <span class="tt-status" style="background: ${color}25; color: ${color};">${item.status}</span>
            </div>
            <div class="tt-title">${item.jenisPencemaran}</div>
            <div class="tt-loc">${desaKelFormatted}, Kec. ${item.kecamatan}</div>
            <div class="tt-desc">${cleanUraian.substring(0, 80)}${cleanUraian.length > 80 ? '...' : ''}</div>
            <div class="tt-hint">Klik pin untuk melihat ringkasan aduan</div>
          </div>
        `, {
          direction: 'top',
          offset: [0, -32],
          opacity: 0.98,
          className: 'custom-map-tooltip',
          permanent: false
        });

        // 2. Popup Interaktif Saat Pin Diklik (Auto-pan aman, informasi umum publik ringkas tanpa tombol detail modal)
        const popupContent = `
          <div class="map-popup-card">
            <div class="popup-head">
              <span class="popup-id">${item.id}</span>
              <span class="badge badge-${badgeClass}">${item.status}</span>
            </div>
            
            <div class="popup-cat">
              <strong>${item.jenisPencemaran}</strong>
            </div>

            <div class="popup-body-scroll">
              <div class="popup-location">
                <strong>Lokasi Kejadian:</strong><br>
                ${desaKelFormatted}, Kec. ${item.kecamatan}
                <div class="popup-detail-loc">Patokan: ${item.lokasiDetail || '-'}</div>
                <div class="popup-coords">Koordinat: ${item.lat}, ${item.lng}</div>
              </div>

              <div class="popup-chronology">
                <strong>Uraian Aduan:</strong>
                <p>${cleanUraian}</p>
              </div>

              ${cleanTindakan ? `
                <div class="popup-dlh-status">
                  <strong>Tindakan DLH:</strong><br>
                  ${cleanTindakan}
                </div>
              ` : ''}
            </div>
          </div>
        `;

        const popupOptions = {
          maxWidth: 290,
          minWidth: 240,
          autoPan: true,
          keepInView: true,
          autoPanPaddingTopLeft: L.point(15, 90),
          autoPanPaddingBottomRight: L.point(15, 20),
          closeButton: true,
          className: 'custom-dlh-popup'
        };

        marker.bindPopup(popupContent, popupOptions);
        this.markersGroup.addLayer(marker);

        // Simpan instance marker agar bisa dibuka dari daftar feed
        this.markerInstances[item.id] = marker;
      }
    });

    // Auto-fit jika difilter per kecamatan
    if (bounds.length > 0 && this.activeFilter.kecamatan !== 'all') {
      this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }

  /* Sorot & Pusatkan Titik Aduan Tertentu di Peta */
  highlightAduan(id) {
    const item = window.aduanStore ? window.aduanStore.getById(id) : null;
    if (!item || !item.lat || !item.lng) return;

    if (this.map) {
      // Pada perangkat seluler, beralih otomatis ke tab Peta
      if (typeof window.switchMobileMapView === 'function' && window.innerWidth < 1024) {
        window.switchMobileMapView('map');
      }

      // Gulir halus jika diperlukan
      const mapContainer = document.getElementById(this.containerId);
      if (mapContainer && window.innerWidth < 1024) {
        mapContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      this.map.flyTo([Number(item.lat), Number(item.lng)], 15, {
        animate: true,
        duration: 1.0
      });

      setTimeout(() => {
        const marker = this.markerInstances[id];
        if (marker) {
          marker.openPopup();
        }
      }, 1050);
    }
  }

  /* Alias method sorot peta untuk kompatibilitas */
  sorotDiPeta(id) {
    return this.highlightAduan(id);
  }

  highlightOnMap(id) {
    return this.highlightAduan(id);
  }

  /* Set Filter Peta */
  setFilters(status = 'all', kecamatan = 'all', jenis = 'all') {
    this.activeFilter = { status, kecamatan, jenis };
    if (this.map) {
      this.renderMarkers();
    } else {
      this.initSvgFallback();
    }
  }

  /* Perbarui Mini KPI Bar di Atas Peta */
  updateMapStats(filteredData, allData) {
    const statTotal = document.getElementById('mapStatTotal');
    const statBaru = document.getElementById('mapStatBaru');
    const statProses = document.getElementById('mapStatProses');
    const statSelesai = document.getElementById('mapStatSelesai');
    const badgeCount = document.getElementById('mapFilteredCountBadge');
    const mobiCount = document.getElementById('mobiAduanCount');

    let baru = 0;
    let proses = 0;
    let selesai = 0;

    filteredData.forEach(item => {
      const s = String(item.status || '').toLowerCase();
      if (s.includes('selesai')) selesai++;
      else if (s.includes('tolak')) { /* ditolak tidak masuk proses aktif */ }
      else if (s === 'aduan diterima' || s === 'baru') baru++;
      else proses++;
    });

    if (statTotal) statTotal.textContent = filteredData.length;
    if (statBaru) statBaru.textContent = baru;
    if (statProses) statProses.textContent = proses;
    if (statSelesai) statSelesai.textContent = selesai;
    if (mobiCount) mobiCount.textContent = filteredData.length;

    if (badgeCount) {
      const kecLabel = this.activeFilter.kecamatan === 'all' ? 'Seluruh Lembata' : `Kec. ${this.activeFilter.kecamatan}`;
      badgeCount.innerHTML = `<span class="badge-count-num">${filteredData.length} Titik</span><span class="badge-sub-label"> Terpantau (${kecLabel})</span>`;
    }
  }

  /* Render Feed Kartu Aduan dinonaktifkan (Peta Spasial adalah satu-satunya tampilan visual utama) */
  renderMapFeed(filteredData) {
    const container = document.getElementById('mapAduanGrid');
    if (container) {
      container.style.display = 'none';
      container.innerHTML = '';
    }
  }

  /* Setup Switcher Basemap Buttons (Peta Standar, Satelit, Topografi) */
  setupBasemapButtons() {
    const btnOsm = document.getElementById('btnBaseOsm');
    const btnSat = document.getElementById('btnBaseSat');
    const btnTopo = document.getElementById('btnBaseTopo');

    const switchBase = (type) => {
      if (!this.map || !this.baseLayers[type]) return;

      Object.values(this.baseLayers).forEach(layer => {
        if (this.map.hasLayer(layer)) {
          this.map.removeLayer(layer);
        }
      });

      this.baseLayers[type].addTo(this.map);
      this.currentBaseLayer = type;

      // Update button active state
      [btnOsm, btnSat, btnTopo].forEach(b => {
        if (b) b.classList.remove('active');
      });

      if (type === 'osm' && btnOsm) btnOsm.classList.add('active');
      if (type === 'sat' && btnSat) btnSat.classList.add('active');
      if (type === 'topo' && btnTopo) btnTopo.classList.add('active');
    };

    if (btnOsm) btnOsm.addEventListener('click', () => switchBase('osm'));
    if (btnSat) btnSat.addEventListener('click', () => switchBase('sat'));
    if (btnTopo) btnTopo.addEventListener('click', () => switchBase('topo'));

    // Set default tombol aktif ke Citra Satelit
    if (btnSat) btnSat.classList.add('active');
    if (btnOsm) btnOsm.classList.remove('active');
    if (btnTopo) btnTopo.classList.remove('active');
  }

  /* Setup Tombol Cepat Wilayah Lembata */
  setupRegionPills() {
    const pills = document.querySelectorAll('.pill-region[data-region]');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const region = pill.getAttribute('data-region');
        this.focusToRegion(region);

        // Sinkronkan juga dropdown kecamatan
        const selectKec = document.getElementById('mapFilterKecamatan');
        if (selectKec) {
          if (region === 'all' || region === 'Kedang' || region === 'Selatan') {
            selectKec.value = 'all';
          } else {
            selectKec.value = region;
          }
          this.activeFilter.kecamatan = selectKec.value;
          this.renderMarkers();
        }
      });
    });
  }

  /* Fokus Kamera Peta ke Wilayah */
  focusToRegion(regionKey) {
    if (!this.map) return;

    switch (regionKey) {
      case 'all':
        this.map.setView(this.centerCoords, this.defaultZoom);
        break;
      case 'Nubatukan':
        this.map.setView([-8.375, 123.418], 13); // Kota Lewoleba
        break;
      case 'Ile Ape':
        this.map.setView([-8.321, 123.473], 13);
        break;
      case 'Ile Ape Timur':
        this.map.setView([-8.244, 123.495], 13);
        break;
      case 'Lebatukan':
        this.map.setView([-8.371, 123.547], 13);
        break;
      case 'Kedang':
        this.map.setView([-8.210, 123.760], 12);
        break;
      case 'Selatan':
        this.map.setView([-8.480, 123.460], 12);
        break;
      case 'Nagawutung':
        this.map.setView([-8.490, 123.360], 13);
        break;
      default:
        this.map.setView(this.centerCoords, this.defaultZoom);
    }
  }

  /* Setup Interaksi Legenda Peta (Floating Pill Button Collapsed by Default) */
  setupLegendInteractions() {
    const toggleBtn = document.getElementById('btnToggleLegend');
    const itemsList = document.getElementById('legendItemsList');
    const box = document.getElementById('mapLegendBox');
    const arrow = document.getElementById('legendArrowIcon');
    const header = box ? box.querySelector('.legend-header') : null;

    // Default tertutup (collapsed)
    if (itemsList) itemsList.style.display = 'none';
    if (box) box.classList.remove('expanded');
    if (arrow) arrow.textContent = '▾';
    if (toggleBtn) toggleBtn.textContent = '▾';

    const toggleFn = () => {
      if (!itemsList || !box) return;
      const isExpanded = box.classList.contains('expanded');
      if (isExpanded) {
        box.classList.remove('expanded');
        itemsList.style.display = 'none';
        if (arrow) arrow.textContent = '▾';
        if (toggleBtn) toggleBtn.textContent = '▾';
      } else {
        box.classList.add('expanded');
        itemsList.style.display = 'flex';
        if (arrow) arrow.textContent = '▴';
        if (toggleBtn) toggleBtn.textContent = '▴';
      }
    };

    const clickTarget = header || toggleBtn;
    if (clickTarget) {
      clickTarget.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFn();
      });
    }

    // Klik item legenda untuk langsung memfilter status
    const legendItems = document.querySelectorAll('.legend-item[data-status-filter]');
    legendItems.forEach(item => {
      item.addEventListener('click', () => {
        const st = item.getAttribute('data-status-filter');
        const selectSt = document.getElementById('mapFilterStatus');
        if (selectSt) {
          selectSt.value = (selectSt.value === st) ? 'all' : st;
          this.activeFilter.status = selectSt.value;
          this.renderMarkers();
        }
      });
    });
  }

  /* Fallback Vector SVG Map jika perangkat offline tanpa CDN Leaflet */
  initSvgFallback() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const data = window.aduanStore ? window.aduanStore.getAll() : [];
    const filtered = data.filter(item => {
      const matchStatus = this.activeFilter.status === 'all' || item.status === this.activeFilter.status;
      const matchKec = this.activeFilter.kecamatan === 'all' || item.kecamatan === this.activeFilter.kecamatan;
      const matchJenis = this.activeFilter.jenis === 'all' || item.jenisPencemaran === this.activeFilter.jenis;
      return matchStatus && matchKec && matchJenis;
    });

    this.updateMapStats(filtered, data);
    this.renderMapFeed(filtered);

    container.innerHTML = `
      <div style="position: relative; width: 100%; height: 100%; background: #e0f2fe; overflow: hidden; display: flex; flex-direction: column;">
        <div style="background: rgba(255,255,255,0.9); padding: 8px 16px; font-size: 12px; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
          <span><strong>Peta Digital Spasial Lembata (Mode Vektor Cadangan)</strong></span>
          <span class="badge badge-selesai">${filtered.length} Titik Terpantau</span>
        </div>
        <div style="flex: 1; position: relative; padding: 20px;">
          <svg viewBox="0 0 800 450" style="width: 100%; height: 100%; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));">
            <!-- Outline Pulau Lembata -->
            <path d="M 220 280 C 180 260 150 200 190 140 C 230 110 320 90 400 110 C 470 120 540 100 620 90 C 690 90 730 120 740 160 C 740 210 680 240 600 240 C 530 250 490 280 430 310 C 370 340 330 380 270 370 C 230 360 210 320 220 280 Z" 
                  fill="#d1fae5" stroke="#059669" stroke-width="3" />
            
            <!-- Kecamatan Labels -->
            <text x="280" y="180" font-size="14" font-weight="bold" fill="#065f46">Nubatukan (Lewoleba)</text>
            <text x="230" y="130" font-size="12" fill="#047857">Ile Ape</text>
            <text x="360" y="140" font-size="12" fill="#047857">Ile Ape Timur</text>
            <text x="420" y="190" font-size="13" font-weight="600" fill="#047857">Lebatukan</text>
            <text x="210" y="320" font-size="12" fill="#047857">Nagawutung</text>
            <text x="280" y="350" font-size="12" fill="#047857">Wulandoni</text>
            <text x="360" y="270" font-size="12" fill="#047857">Atadei</text>
            <text x="560" y="160" font-size="12" fill="#047857">Omesuri</text>
            <text x="660" y="140" font-size="12" fill="#047857">Buyasuri</text>
            
            <!-- Titik-titik aduan -->
            ${filtered.map((item) => {
              const normX = ((item.lng - 123.3) / 0.7) * 580 + 160;
              const normY = ((item.lat - (-8.1)) / (-0.5)) * 260 + 90;
              const col = this.getMarkerColor(item.status);

              return `
                <g class="svg-pin" cursor="pointer" onclick="window.app.showDetailModal('${item.id}')">
                  <circle cx="${normX}" cy="${normY}" r="12" fill="${col}" fill-opacity="0.3" />
                  <circle cx="${normX}" cy="${normY}" r="6" fill="${col}" stroke="#ffffff" stroke-width="2" />
                  <text x="${normX + 10}" y="${normY + 4}" font-size="10" font-weight="bold" fill="#0f172a">${item.id}</text>
                </g>
              `;
            }).join('')}
          </svg>
        </div>
      </div>
    `;
  }

  /* Mini Map Preview untuk Kartu Peta Sebaran di Beranda */
  initMiniMap(containerId = 'miniMapPreview') {
    const el = document.getElementById(containerId);
    if (!el || typeof L === 'undefined') return;

    // Bersihkan jika sudah pernah diinisialisasi
    if (this.miniMapInstance) {
      try { this.miniMapInstance.remove(); } catch(e) {}
    }

    try {
      // Koordinat Bounding Box Pulau Lembata presisi agar seluruh pulau pas di tengah
      const southWest = L.latLng(-8.64, 123.12);
      const northEast = L.latLng(-8.12, 123.95);
      const bounds = L.latLngBounds(southWest, northEast);

      this.miniMapInstance = L.map(containerId, {
        center: [-8.38, 123.54],
        zoom: 10,
        minZoom: 8,
        maxZoom: 14,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false
      });

      // Layer 1: Citra Satelit Nyata Esri (Lembata terlihat hijau kontras di atas laut biru gelap)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
        attribution: 'Esri, Maxar'
      }).addTo(this.miniMapInstance);

      // Layer 2: Label Nama Kota, Kecamatan & Batas Wilayah
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18
      }).addTo(this.miniMapInstance);

      // Posisikan seluruh Pulau Lembata pas di tengah kontainer mini map
      this.miniMapInstance.fitBounds(bounds, { padding: [2, 2] });
      setTimeout(() => {
        if (this.miniMapInstance) {
          this.miniMapInstance.invalidateSize();
          this.miniMapInstance.fitBounds(bounds, { padding: [2, 2] });
        }
      }, 250);

      // Render pin titik aduan murni dari data real database/store
      const data = window.aduanStore ? window.aduanStore.getAll() : [];
      const pinPoints = data.filter(d => d && d.lat && d.lng);

      pinPoints.forEach(p => {
        const col = this.getMarkerColor(p.status);
        L.circleMarker([p.lat, p.lng], {
          radius: 6,
          fillColor: col,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.95
        }).addTo(this.miniMapInstance);
      });

      // Klik mini map otomatis beralih ke peta spasial penuh
      el.style.cursor = 'pointer';
      el.onclick = () => {
        if (window.app) window.app.switchTab('peta');
      };
    } catch(err) {
      console.warn('Gagal memuat mini map Leaflet:', err);
      this.initMiniMapFallback(containerId);
    }
  }

  /* Fallback Mini Map SVG jika offline/no CDN */
  initMiniMapFallback(containerId = 'miniMapPreview') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
      <div style="width: 100%; height: 100%; background: #e0f2fe; display: flex; align-items: center; justify-content: center; position: relative; cursor: pointer;" onclick="if(window.app) window.app.switchTab('peta');">
        <svg viewBox="0 0 400 150" style="width: 100%; height: 100%;">
          <path d="M 110 90 C 90 80 80 60 100 40 C 130 30 180 25 220 30 C 260 35 300 30 340 25 C 380 30 390 40 380 60 C 360 80 320 85 270 95 C 220 105 170 120 140 115 Z" fill="#bbf7d0" stroke="#059669" stroke-width="2"/>
          <circle cx="160" cy="65" r="5" fill="#f59e0b" stroke="#fff" stroke-width="1.5"/>
          <circle cx="140" cy="45" r="5" fill="#8b5cf6" stroke="#fff" stroke-width="1.5"/>
          <circle cx="210" cy="55" r="5" fill="#2563eb" stroke="#fff" stroke-width="1.5"/>
          <circle cx="320" cy="40" r="5" fill="#059669" stroke="#fff" stroke-width="1.5"/>
          <circle cx="150" cy="100" r="5" fill="#ea580c" stroke="#fff" stroke-width="1.5"/>
        </svg>
        <span style="position: absolute; bottom: 6px; right: 8px; font-size: 10px; font-weight: 700; color: #065f46; background: rgba(255,255,255,0.9); padding: 2px 6px; border-radius: 4px;">Pulau Lembata</span>
      </div>
    `;
  }
}

// Global instance
window.lembataMap = new LembataMapEngine();

/**
 * Toggle Bilah Filter & Wilayah pada Perangkat Seluler (< 768px)
 */
window.toggleMapFiltersMobile = function() {
  const container = document.getElementById('mapFiltersCollapsible');
  const btnText = document.getElementById('filterToggleBtnText');
  const arrow = document.getElementById('filterToggleArrow');
  if (!container) return;

  const isCollapsed = container.classList.contains('collapsed');
  if (isCollapsed) {
    container.classList.remove('collapsed');
    if (btnText) btnText.textContent = 'Tutup Filter';
    if (arrow) arrow.textContent = '▴';
  } else {
    container.classList.add('collapsed');
    if (btnText) btnText.textContent = 'Buka Filter';
    if (arrow) arrow.textContent = '▾';
  }
};

/**
 * Pengalih Tampilan Mobile (Disederhanakan karena Peta Spasial adalah satu-satunya tampilan utama)
 */
window.switchMobileMapView = function(mode) {
  const viewPanel = document.getElementById('mapViewPanel');
  if (viewPanel) viewPanel.style.display = 'block';
  if (window.lembataMap && window.lembataMap.map) {
    setTimeout(() => {
      try {
        window.lembataMap.map.invalidateSize();
      } catch(e) {}
    }, 80);
  }
};

// Pastikan sinkronisasi tata letak saat ukuran layar browser diubah
window.addEventListener('resize', () => {
  const viewPanel = document.getElementById('mapViewPanel');
  if (viewPanel) viewPanel.style.display = 'block';
  if (window.lembataMap && window.lembataMap.map) {
    try {
      window.lembataMap.map.invalidateSize();
    } catch(e) {}
  }
});

// Global helper aliases untuk kompatibilitas sorot peta & buka detail
window.sorotDiPeta = function(a, b, c) {
  const id = c || (typeof a === 'string' ? a : null);
  const lat = (typeof a === 'number') ? a : null;
  const lng = (typeof b === 'number') ? b : null;

  if (typeof window.switchMobileMapView === 'function' && window.innerWidth < 1024) {
    window.switchMobileMapView('map');
  }

  if (window.lembataMap) {
    if (id) {
      window.lembataMap.highlightAduan(id);
    } else if (lat && lng && window.lembataMap.map) {
      window.lembataMap.map.flyTo([lat, lng], 15, { animate: true, duration: 1.0 });
    }
  }
};

window.highlightOnMap = function(id) {
  if (window.sorotDiPeta) window.sorotDiPeta(id);
};

window.bukaDetail = function(id) {
  if (window.app && typeof window.app.showDetailModal === 'function') {
    window.app.showDetailModal(id);
  } else if (window.portal && typeof window.portal.showDetailModal === 'function') {
    window.portal.showDetailModal(id);
  }
};
