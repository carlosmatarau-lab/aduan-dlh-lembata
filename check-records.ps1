$res = Invoke-RestMethod -Uri 'https://script.google.com/macros/s/AKfycbwuDJ9X5a27GnVuuiU1keHexKXzG3OITUxwOomwHGt-1S53DdqfAfguDInXwtbh9ljKMw/exec?action=getAll'
Write-Host "Total Records: $($res.data.Count)"
foreach ($item in $res.data) {
    Write-Host "----------------------------------"
    Write-Host "ID: $($item.id)"
    Write-Host "Status: $($item.status)"
    Write-Host "Nama: $($item.namaPelapor)"
    Write-Host "FotoBukti: $(if ($item.fotoBukti) { $item.fotoBukti.Substring(0, [Math]::Min(50, $item.fotoBukti.Length)) } else { 'KOSONG' })"
    Write-Host "FotoRiil: $(if ($item.fotoKondisiRiil) { $item.fotoKondisiRiil.Substring(0, [Math]::Min(50, $item.fotoKondisiRiil.Length)) } else { 'KOSONG' })"
}
