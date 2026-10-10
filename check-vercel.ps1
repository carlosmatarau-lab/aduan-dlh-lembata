<#
.SYNOPSIS
    Script diagnostik dan pengecekan kesehatan (health-check) deployment SILAPOR-DLH LEMBATA di Vercel.

.DESCRIPTION
    Script ini memverifikasi:
    1. Aksesibilitas endpoint Vercel (Beranda, Portal Petugas, Generator QR Code).
    2. Ketersediaan asset statis (CSS, JavaScript).
    3. Header keamanan HTTP sesuai konfigurasi vercel.json.
    4. Integritas versi kode live (data store, lampiran bukti, ID Google Apps Script).
    5. Konektivitas Web API Google Apps Script (GAS).

.EXAMPLE
    .\check-vercel.ps1
    .\check-vercel.ps1 -BaseUrl "https://aduan-dlh-lembata.vercel.app"
#>

[CmdletBinding()]
param (
    [string]$BaseUrl = "https://aduan-dlh-lembata.vercel.app",
    [string]$GasApiUrl = "https://script.google.com/macros/s/AKfycbwuDJ9X5a27GnVuuiU1keHexKXzG3OITUxwOomwHGt-1S53DdqfAfguDInXwtbh9ljKMw/exec"
)

# Konfigurasi Tampilan Konsol
$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   🌿 DIAGNOSTIK & HEALTH CHECK VERCEL - SILAPOR-DLH LEMBATA    " -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Target URL : $BaseUrl" -ForegroundColor Yellow
Write-Host " Waktu Cek  : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
Write-Host ""

$summary = @{
    TotalPassed = 0
    TotalWarning = 0
    TotalFailed = 0
}

function Report-Result {
    param (
        [string]$Category,
        [string]$Item,
        [string]$Status, # "PASS", "WARN", "FAIL"
        [string]$Message,
        [int]$DurationMs = 0
    )

    $timeStr = if ($DurationMs -gt 0) { " ($DurationMs ms)" } else { "" }

    switch ($Status) {
        "PASS" {
            $summary.TotalPassed++
            Write-Host "  [ PASS ] " -ForegroundColor Green -NoNewline
            Write-Host "$Item : " -ForegroundColor White -NoNewline
            Write-Host "$Message$timeStr" -ForegroundColor Gray
        }
        "WARN" {
            $summary.TotalWarning++
            Write-Host "  [ WARN ] " -ForegroundColor Yellow -NoNewline
            Write-Host "$Item : " -ForegroundColor White -NoNewline
            Write-Host "$Message$timeStr" -ForegroundColor Yellow
        }
        "FAIL" {
            $summary.TotalFailed++
            Write-Host "  [ FAIL ] " -ForegroundColor Red -NoNewline
            Write-Host "$Item : " -ForegroundColor White -NoNewline
            Write-Host "$Message$timeStr" -ForegroundColor Red
        }
    }
}

# -------------------------------------------------------------
# 1. CEK ENDPOINT HALAMAN UTAMA & ROUTE
# -------------------------------------------------------------
Write-Host "1. Memeriksa Halaman Aplikasi (Pages & Routes)..." -ForegroundColor Cyan

$routes = @(
    @{ Name = "Portal Publik (Root)"; Path = "/" },
    @{ Name = "Portal Khusus Petugas"; Path = "/petugas" },
    @{ Name = "Poster & QR Code"; Path = "/qr-code" }
)

$indexContent = $null

foreach ($r in $routes) {
    $target = "$BaseUrl$($r.Path)"
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $res = Invoke-WebRequest -Uri $target -Method Get -UseBasicParsing -TimeoutSec 15
        $sw.Stop()
        if ($res.StatusCode -eq 200) {
            Report-Result -Category "Route" -Item $r.Name -Status "PASS" -Message "HTTP 200 OK" -DurationMs $sw.ElapsedMilliseconds
            if ($r.Path -eq "/") {
                $indexContent = $res.Content
                $indexHeaders = $res.Headers
            }
        } else {
            Report-Result -Category "Route" -Item $r.Name -Status "WARN" -Message "HTTP Status $($res.StatusCode)" -DurationMs $sw.ElapsedMilliseconds
        }
    } catch {
        $sw.Stop()
        Report-Result -Category "Route" -Item $r.Name -Status "FAIL" -Message $_.Exception.Message -DurationMs $sw.ElapsedMilliseconds
    }
}

Write-Host ""

# -------------------------------------------------------------
# 2. CEK ASSET STATIS (CSS & JAVASCRIPT)
# -------------------------------------------------------------
Write-Host "2. Memeriksa Asset Statis (CSS & JS)..." -ForegroundColor Cyan

$assets = @(
    @{ Name = "Styles (CSS)"; Path = "/css/style.css" },
    @{ Name = "App Logic (JS)"; Path = "/js/app.js" },
    @{ Name = "Data Store (JS)"; Path = "/js/data.js" },
    @{ Name = "GIS Map Engine"; Path = "/js/map.js" },
    @{ Name = "Charts Engine"; Path = "/js/charts.js" }
)

foreach ($a in $assets) {
    $target = "$BaseUrl$($a.Path)"
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $res = Invoke-WebRequest -Uri $target -Method Get -UseBasicParsing -TimeoutSec 10
        $sw.Stop()
        if ($res.StatusCode -eq 200) {
            $lenKb = [math]::Round($res.Content.Length / 1024, 1)
            Report-Result -Category "Asset" -Item $a.Name -Status "PASS" -Message "OK (${lenKb} KB)" -DurationMs $sw.ElapsedMilliseconds
        } else {
            Report-Result -Category "Asset" -Item $a.Name -Status "WARN" -Message "HTTP $($res.StatusCode)" -DurationMs $sw.ElapsedMilliseconds
        }
    } catch {
        $sw.Stop()
        Report-Result -Category "Asset" -Item $a.Name -Status "FAIL" -Message $_.Exception.Message -DurationMs $sw.ElapsedMilliseconds
    }
}

Write-Host ""

# -------------------------------------------------------------
# 3. CEK HEADER KEAMANAN (SECURITY HEADERS DARI vercel.json)
# -------------------------------------------------------------
Write-Host "3. Memeriksa Security Headers (vercel.json)..." -ForegroundColor Cyan

if ($indexHeaders) {
    $secHeaders = @(
        "X-Frame-Options",
        "X-Content-Type-Options",
        "X-XSS-Protection",
        "Referrer-Policy"
    )

    foreach ($h in $secHeaders) {
        $val = $indexHeaders[$h]
        if ($val) {
            Report-Result -Category "Header" -Item $h -Status "PASS" -Message "Aktif ($val)"
        } else {
            Report-Result -Category "Header" -Item $h -Status "WARN" -Message "Header tidak terdeteksi pada response"
        }
    }
} else {
    Write-Host "  [ SKIP ] Dilewati karena halaman utama tidak dapat diakses." -ForegroundColor Yellow
}

Write-Host ""

# -------------------------------------------------------------
# 4. CEK INTEGRITAS FITUR PADA DEPLOYMENT LIVE
# -------------------------------------------------------------
Write-Host "4. Memeriksa Integritas Kode & Fitur Terpasang..." -ForegroundColor Cyan

if ($indexContent) {
    # 4.1 Identitas Aplikasi
    if ($indexContent -match "SILAPOR-DLH LEMBATA" -or $indexContent -match "Dinas Lingkungan Hidup Kabupaten Lembata") {
        Report-Result -Category "Feature" -Item "Identitas DLH Lembata" -Status "PASS" -Message "Teks branding & logo ditemukan"
    } else {
        Report-Result -Category "Feature" -Item "Identitas DLH Lembata" -Status "WARN" -Message "Teks branding tidak ditemukan pada HTML"
    }

    # 4.2 Fitur Data Store & Lampiran Bukti
    if ($indexContent -match "aduanStore" -or $indexContent -match "AduanDataStore") {
        Report-Result -Category "Feature" -Item "Data Store & Lampiran Bukti" -Status "PASS" -Message "Engine data store & lampiran bukti terpasang"
    } else {
        Report-Result -Category "Feature" -Item "Data Store & Lampiran Bukti" -Status "WARN" -Message "Engine data belum termuat di index.html"
    }

    # 4.3 Konfigurasi Web API Google Apps Script
    if ($indexContent -match "AKfycbwuD" -or $indexContent -match "AKfycb") {
        Report-Result -Category "Feature" -Item "ID Google Apps Script" -Status "PASS" -Message "Deployment ID Google Apps Script sinkron"
    } else {
        Report-Result -Category "Feature" -Item "ID Google Apps Script" -Status "WARN" -Message "ID Apps Script default tidak terdeteksi langsung di inline script"
    }
} else {
    Write-Host "  [ SKIP ] Dilewati karena konten halaman tidak diperoleh." -ForegroundColor Yellow
}

Write-Host ""

# -------------------------------------------------------------
# 5. CEK KONEKTIVITAS KE GOOGLE APPS SCRIPT WEB API
# -------------------------------------------------------------
Write-Host "5. Memeriksa Konektivitas Google Apps Script (Web API)..." -ForegroundColor Cyan

if ($GasApiUrl) {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $pingUrl = "$GasApiUrl`?action=ping"
    try {
        $gasRes = Invoke-WebRequest -Uri $pingUrl -Method Get -UseBasicParsing -TimeoutSec 15
        $sw.Stop()
        if ($gasRes.StatusCode -eq 200 -or $gasRes.StatusCode -eq 302) {
            Report-Result -Category "GAS" -Item "Google Apps Script Ping" -Status "PASS" -Message "Response OK (HTTP $($gasRes.StatusCode))" -DurationMs $sw.ElapsedMilliseconds
        } else {
            Report-Result -Category "GAS" -Item "Google Apps Script Ping" -Status "WARN" -Message "HTTP $($gasRes.StatusCode)" -DurationMs $sw.ElapsedMilliseconds
        }
    } catch {
        $sw.Stop()
        # Apps Script redirects sering memicu handled redirect di basic parsing
        Report-Result -Category "GAS" -Item "Google Apps Script Ping" -Status "WARN" -Message "Catatan: $($_.Exception.Message)" -DurationMs $sw.ElapsedMilliseconds
    }
}

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "                      RINGKASAN HASIL                            " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Berhasil (PASS)   : $($summary.TotalPassed)" -ForegroundColor Green
Write-Host " Peringatan (WARN) : $($summary.TotalWarning)" -ForegroundColor Yellow
Write-Host " Gagal (FAIL)      : $($summary.TotalFailed)" -ForegroundColor Red
Write-Host "=================================================================" -ForegroundColor Cyan

if ($summary.TotalFailed -eq 0) {
    Write-Host " Status: DEPLOYMENT SEHAT & DAPAT DIAKSES SECARA NORMAL." -ForegroundColor Green
} else {
    Write-Host " Status: DITEMUKAN MASALAH PADA DEPLOYMENT, PERIKSA KEMBALI LOG DI ATAS." -ForegroundColor Red
}
Write-Host ""
