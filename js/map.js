/**
 * SISTEM PENDATAAN DIGITAL ADUAN PENCEMARAN LINGKUNGAN
 * DINAS LINGKUNGAN HIDUP KABUPATEN LEMBATA
 * Enhanced Interactive Map Engine (Leaflet + Citra Satelit + Tooltips + Feed)
 */

class LembataMapEngine {
  constructor(containerId = 'map') {
    this.containerId = containerId;
    this.map = null;
    this.markersGroup = null;
    this.landmarksGroup = null;
    this.markerInstances = {}; // Menyimpan referensi marker per ID tiket
    this.centerCoords = [-8.370, 123.560]; // Pusat Pulau Lembata
    this.defaultZoom = 11;
    this.activeFilter = {
      status: 'all',
      kecamatan: 'all',
      jenis: 'all'
    };
    this.baseLayers = {};
    this.currentBaseLayer = 'osm';
  }

  init() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    if (typeof L !== 'undefined') {
      this.initLeaflet();
      this.setupBasemapButtons();
      this.setupRegionPills();
      this.setupLegendInteractions();
    } else {
      console.warn('Leaflet CDN tidak terdeteksi, mengaktifkan peta vektor SVG fallback');
      this.initSvgFallback();
    }
  }

  initLeaflet() {
    try {
      this.map = L.map(this.containerId, {
        center: this.centerCoords,
        zoom: this.defaultZoom,
        zoomControl: true,
        scrollWheelZoom: true
      });

      // 1. Layer Peta Standar OpenStreetMap
      const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap kontributor | DLH Lembata'
      });

      // 2. Layer Citra Satelit Nyata (Esri World Imagery)
      const satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Citra Satelit &copy; Esri, Maxar, Earthstar Geographics'
      });

      // 3. Layer Peta Topografi & Relief (Esri World Topo)
      const topoLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Topografi &copy; Esri, USGS'
      });

      // Default basemap
      osmLayer.addTo(this.map);

      this.baseLayers = {
        'osm': osmLayer,
        'sat': satLayer,
        'topo': topoLayer
      };

      // Kontrol Layer Bawaan Leaflet di Pojok Kanan Atas
      const layerControlLabels = {
        '🗺️ Peta Jalan / Desa': osmLayer,
        '🛰️ Citra Satelit Nyata': satLayer,
        '⛰️ Relief Topografi': topoLayer
      };
      L.control.layers(layerControlLabels, null, { position: 'topright' }).addTo(this.map);

      // Tambahkan skala jarak (metric)
      L.control.scale({ imperial: false, position: 'bottomright' }).addTo(this.map);

      // Inisialisasi layer penanda aduan
      this.markersGroup = L.layerGroup().addTo(this.map);

      // Tambahkan penanda landmark geografis penting Lembata
      this.addGeographicLandmarks();

      // Render pertama kali
      this.renderMarkers();
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
      { name: '🏛️ Kota Lewoleba (Ibukota)', coords: [-8.368, 123.558], desc: 'Pusat Pemerintahan & Pelabuhan Lewoleba' },
      { name: '🌋 Gunung Ile Lewotolok', coords: [-8.272, 123.505], desc: 'Puncak Vulkanik Ile Ape' },
      { name: '🌊 Teluk Lewoleba', coords: [-8.352, 123.535], desc: 'Kawasan Pesisir Nubatukan' },
      { name: '🐟 Teluk Hadakewa', coords: [-8.355, 123.662], desc: 'Pesisir Lebatukan' },
      { name: '🏝️ Tanjung Batu', coords: [-8.245, 123.520], desc: 'Ujung Utara Ile Ape' },
      { name: '🏘️ Balauring (Kedang)', coords: [-8.235, 123.822], desc: 'Pusat Kecamatan Omesuri' },
      { name: '🛶 Lamalera (Wulandoni)', coords: [-8.552, 123.492], desc: 'Desa Tradisional Pesisir Selatan' }
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

  /* Ikon Kategori Pencemaran */
  getCategoryIcon(jenis) {
    if (!jenis) return '⚠️';
    const j = jenis.toLowerCase();
    if (j.includes('laut') || j.includes('pesisir')) return '🌊';
    if (j.includes('sampah') || j.includes('bau')) return '🗑️';
    if (j.includes('air') || j.includes('sungai')) return '💧';
    if (j.includes('udara') || j.includes('asap')) return '💨';
    if (j.includes('b3') || j.includes('kimia') || j.includes('medis')) return '☣️';
    if (j.includes('kerusakan') || j.includes('tanah') || j.includes('hutan')) return '🌳';
    return '⚠️';
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

  /* Custom Leaflet Pin Icon dengan Ikon Kategori dan Animasi Halo Denyut */
  createPinIcon(item) {
    const color = this.getMarkerColor(item.status);
    const catIcon = this.getCategoryIcon(item.jenisPencemaran);
    const isActivelyHandled = item.status !== 'Selesai' && item.status !== 'Ditolak';

    return L.divIcon({
      className: 'custom-leaflet-marker-wrapper',
      html: `
        <div class="custom-leaflet-marker" style="--marker-color: ${color};">
          ${isActivelyHandled ? `<div class="marker-pulse-ring" style="border-color: ${color};"></div>` : ''}
          <div class="marker-pin" style="background: ${color};">
            <span class="marker-icon">${catIcon}</span>
          </div>
        </div>
      `,
      iconSize: [32, 38],
      iconAnchor: [16, 36],
      popupAnchor: [0, -36]
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

        // 1. Tooltip Instan Saat Kursor Diarahkan (Hover)
        marker.bindTooltip(`
          <div class="map-tooltip-content">
            <div class="tt-header">
              <span class="tt-id">${item.id}</span>
              <span class="tt-status" style="background: ${color}25; color: ${color};">${item.status}</span>
            </div>
            <div class="tt-title">${catIcon} ${item.jenisPencemaran}</div>
            <div class="tt-loc">📍 Desa ${item.desa}, Kec. ${item.kecamatan}</div>
            <div class="tt-desc">${(item.uraian || '').substring(0, 80)}${item.uraian && item.uraian.length > 80 ? '...' : ''}</div>
            <div class="tt-hint">👆 Klik pin untuk melihat detail aduan</div>
          </div>
        `, {
          direction: 'top',
          offset: [0, -32],
          opacity: 0.98,
          className: 'custom-map-tooltip'
        });

        // 2. Popup Interaktif Saat Pin Diklik
        const popupContent = `
          <div class="map-popup-card">
            <div class="popup-head">
              <span class="popup-id">${item.id}</span>
              <span class="badge badge-${badgeClass}">${item.status}</span>
            </div>
            
            <div class="popup-cat">
              <span class="cat-icon">${catIcon}</span>
              <strong>${item.jenisPencemaran}</strong>
            </div>

            <div class="popup-location">
              <strong>📍 Lokasi Kejadian:</strong><br>
              Desa ${item.desa}, Kec. ${item.kecamatan}
              <div class="popup-detail-loc">Patokan: ${item.lokasiDetail || '-'}</div>
              <div class="popup-coords">🌐 Koordinat: ${item.lat}, ${item.lng}</div>
            </div>

            <div class="popup-chronology">
              <strong>Uraian Aduan:</strong>
              <p>${item.uraian}</p>
            </div>

            ${item.tindakanDLH && item.tindakanDLH !== '-' ? `
              <div class="popup-dlh-status">
                <strong>Tindakan DLH:</strong><br>
                ${item.tindakanDLH}
              </div>
            ` : ''}

            <div class="popup-actions">
              <button class="btn btn-sm btn-primary" onclick="window.app.showDetailModal('${item.id}')" style="flex: 1;">
                📄 Lihat Detail Aduan &amp; Foto
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 320 });
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
      // Gulir halaman ke peta secara halus
      const mapContainer = document.getElementById(this.containerId);
      if (mapContainer) {
        mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      this.map.flyTo([item.lat, item.lng], 14, {
        animate: true,
        duration: 1.2
      });

      setTimeout(() => {
        const marker = this.markerInstances[id];
        if (marker) {
          marker.openPopup();
        }
      }, 1250);
    }
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

    let baru = 0;
    let proses = 0;
    let selesai = 0;

    filteredData.forEach(item => {
      if (item.status === 'Aduan Diterima' || item.status === 'Baru') baru++;
      else if (item.status === 'Selesai') selesai++;
      else if (item.status !== 'Ditolak') proses++;
    });

    if (statTotal) statTotal.textContent = filteredData.length;
    if (statBaru) statBaru.textContent = baru;
    if (statProses) statProses.textContent = proses;
    if (statSelesai) statSelesai.textContent = selesai;

    if (badgeCount) {
      const kecLabel = this.activeFilter.kecamatan === 'all' ? 'Seluruh Lembata' : `Kec. ${this.activeFilter.kecamatan}`;
      badgeCount.textContent = `${filteredData.length} Titik Terpantau (${kecLabel})`;
    }
  }

  /* Render Feed Kartu Aduan di Bawah Peta */
  renderMapFeed(filteredData) {
    const container = document.getElementById('mapAduanGrid');
    if (!container) return;

    if (filteredData.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 32px 16px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; color: #64748b;">
          <div style="font-size: 28px; margin-bottom: 6px;">🔍</div>
          <strong>Tidak ada titik aduan yang cocok dengan kriteria filter saat ini.</strong>
          <p style="font-size: 0.82rem; margin-top: 4px;">Coba ubah pilihan kecamatan, status, atau jenis pencemaran.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredData.map(item => {
      const catIcon = this.getCategoryIcon(item.jenisPencemaran);
      const badgeClass = (item.status || 'baru').toLowerCase().replace(/[^a-z0-9]/g, '-');

      return `
        <div class="map-aduan-card">
          <div>
            <div class="mac-top">
              <span class="mac-id">${item.id}</span>
              <span class="badge badge-${badgeClass}">${item.status}</span>
            </div>
            <div class="mac-title">${catIcon} ${item.jenisPencemaran}</div>
            <div class="mac-loc">📍 Desa ${item.desa}, Kec. ${item.kecamatan}</div>
            <div class="mac-desc">${item.uraian}</div>
          </div>
          <div class="mac-actions">
            <button type="button" class="btn btn-outline btn-sm" onclick="window.lembataMap.highlightAduan('${item.id}')" style="flex: 1;" title="Pusatkan peta ke titik ini">
              🎯 Sorot di Peta
            </button>
            <button type="button" class="btn btn-primary btn-sm" onclick="window.app.showDetailModal('${item.id}')" title="Lihat rincian aduan ini">
              📄 Detail
            </button>
          </div>
        </div>
      `;
    }).join('');
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
        this.map.setView([-8.368, 123.558], 13);
        break;
      case 'Ile Ape':
        this.map.setView([-8.283, 123.541], 13);
        break;
      case 'Ile Ape Timur':
        this.map.setView([-8.291, 123.612], 13);
        break;
      case 'Lebatukan':
        this.map.setView([-8.358, 123.665], 13);
        break;
      case 'Kedang':
        this.map.setView([-8.220, 123.880], 12);
        break;
      case 'Selatan':
        this.map.setView([-8.510, 123.530], 12);
        break;
      case 'Nagawutung':
        this.map.setView([-8.490, 123.385], 13);
        break;
      default:
        this.map.setView(this.centerCoords, this.defaultZoom);
    }
  }

  /* Setup Interaksi Legenda Peta */
  setupLegendInteractions() {
    const toggleBtn = document.getElementById('btnToggleLegend');
    const itemsList = document.getElementById('legendItemsList');

    if (toggleBtn && itemsList) {
      toggleBtn.addEventListener('click', () => {
        const isHidden = itemsList.style.display === 'none';
        itemsList.style.display = isHidden ? 'flex' : 'none';
        toggleBtn.textContent = isHidden ? '▾' : '▸';
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
          <span>🗺️ <strong>Peta Digital Spasial Lembata (Mode Vektor Cadangan)</strong></span>
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
}

// Global instance
window.lembataMap = new LembataMapEngine();
