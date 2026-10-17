$path = "d:\app\petugas.html"
$bytes = [System.IO.File]::ReadAllBytes($path)
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# Replace regex matching the garbled text before Klik Perbesar and Buka Foto
$text = [System.Text.RegularExpressions.Regex]::Replace($text, '(?<=<span[^>]*>)[^\x00-\x7F]+(?=Buka di Google Drive)', '📸')
$text = [System.Text.RegularExpressions.Regex]::Replace($text, '[^\x00-\x7F]+(?=\s*Klik Perbesar)', '🔍 ')
$text = [System.Text.RegularExpressions.Regex]::Replace($text, '[^\x00-\x7F]+(?=\s*Buka Foto)', '🔍 ')

[System.IO.File]::WriteAllText($path, $text, [System.Text.Encoding]::UTF8)
Write-Output "Done regex replace"
