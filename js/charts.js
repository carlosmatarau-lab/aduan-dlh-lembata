/**
 * SISTEM PENDATAAN DIGITAL ADUAN PENCEMARAN LINGKUNGAN
 * DINAS LINGKUNGAN HIDUP KABUPATEN LEMBATA
 * Charts & Analytics Visualizer (Chart.js + Native Canvas Fallback)
 */

class AnalyticsEngine {
  constructor() {
    this.chartInstances = {};
  }

  init() {
    this.renderAll();
  }

  renderAll() {
    const stats = window.aduanStore ? window.aduanStore.getStats() : null;
    if (!stats) return;

    this.renderStatusChart(stats);
    this.renderJenisChart(stats);
    this.renderKecamatanChart(stats);
  }

  renderStatusChart(stats) {
    const canvas = document.getElementById('chartStatus');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const labels = ['Aduan Diterima', 'Verifikasi Lapangan', 'Dalam Penanganan', 'Selesai', 'Ditolak'];
    const dataValues = [
      stats.aduanDiterima || stats.baru || 0,
      (stats.verifAdmin || 0) + (stats.menungguVerif || 0) + (stats.sedangDiverif || stats.diverifikasi || 0),
      stats.dalamPenanganan || stats.ditindak || 0,
      stats.selesai || 0,
      stats.ditolak || 0
    ];
    const colors = ['#f59e0b', '#8b5cf6', '#2563eb', '#059669', '#64748b'];

    if (this.chartInstances['status']) {
      this.chartInstances['status'].destroy();
    }

    if (typeof Chart !== 'undefined') {
      try {
        this.chartInstances['status'] = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: dataValues,
              backgroundColor: colors,
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { font: { family: 'Plus Jakarta Sans', size: 11 } }
              }
            },
            cutout: '65%'
          }
        });
        return;
      } catch (e) {
        console.warn('Chart.js error, falling back to native canvas:', e);
      }
    }

    // Native HTML5 Canvas Fallback for Donut Chart
    this.drawNativeDonut(ctx, canvas.width, canvas.height, labels, dataValues, colors);
  }

  renderJenisChart(stats) {
    const canvas = document.getElementById('chartJenis');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const labels = Object.keys(stats.perJenis);
    const dataValues = Object.values(stats.perJenis);
    const bgColors = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#047857', '#065f46'];

    if (this.chartInstances['jenis']) {
      this.chartInstances['jenis'].destroy();
    }

    if (typeof Chart !== 'undefined') {
      try {
        this.chartInstances['jenis'] = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Jumlah Kasus',
              data: dataValues,
              backgroundColor: bgColors.slice(0, labels.length),
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { stepSize: 1 }
              }
            }
          }
        });
        return;
      } catch (e) {
        console.warn('Chart.js error, falling back to native canvas:', e);
      }
    }

    // Native bar fallback
    this.drawNativeBar(ctx, canvas.width, canvas.height, labels, dataValues);
  }

  renderKecamatanChart(stats) {
    const canvas = document.getElementById('chartKecamatan');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const labels = Object.keys(stats.perKecamatan);
    const dataValues = Object.values(stats.perKecamatan);

    if (this.chartInstances['kecamatan']) {
      this.chartInstances['kecamatan'].destroy();
    }

    if (typeof Chart !== 'undefined') {
      try {
        this.chartInstances['kecamatan'] = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Aduan Masuk',
              data: dataValues,
              backgroundColor: '#059669',
              borderRadius: 6
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              x: {
                beginAtZero: true,
                ticks: { stepSize: 1 }
              }
            }
          }
        });
        return;
      } catch (e) {
        console.warn('Chart.js error:', e);
      }
    }

    this.drawNativeBar(ctx, canvas.width, canvas.height, labels, dataValues);
  }

  // Graceful Canvas Fallbacks
  drawNativeDonut(ctx, w, h, labels, values, colors) {
    const total = values.reduce((a, b) => a + b, 0);
    if (total === 0) return;

    ctx.clearRect(0, 0, w, h);
    const centerX = w / 2;
    const centerY = h / 2 - 20;
    const radius = Math.min(centerX, centerY) - 20;

    let startAngle = 0;
    for (let i = 0; i < values.length; i++) {
      const sliceAngle = (values[i] / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.arc(centerX, centerY, radius * 0.6, startAngle + sliceAngle, startAngle, true);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      startAngle += sliceAngle;
    }

    // Inner text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${total} Aduan`, centerX, centerY);
  }

  drawNativeBar(ctx, w, h, labels, values) {
    ctx.clearRect(0, 0, w, h);
    const maxVal = Math.max(...values, 1);
    const barWidth = (w - 60) / labels.length;

    labels.forEach((lbl, i) => {
      const barHeight = (values[i] / maxVal) * (h - 80);
      const x = 40 + i * barWidth;
      const y = h - 40 - barHeight;

      ctx.fillStyle = '#10b981';
      ctx.fillRect(x + 6, y, barWidth - 12, barHeight);

      ctx.fillStyle = '#64748b';
      ctx.font = '10px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(lbl.substring(0, 7), x + barWidth / 2, h - 20);
      ctx.fillText(values[i], x + barWidth / 2, y - 6);
    });
  }
}

window.analytics = new AnalyticsEngine();
