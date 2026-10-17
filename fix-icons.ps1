$path = "d:\app\petugas.html"
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
$mag = [char]::ConvertFromUtf32(0x1F50D)
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '[^>\s]+(?=\s+Klik Perbesar)', $mag)
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Output "Cleaned up Klik Perbesar successfully!"
