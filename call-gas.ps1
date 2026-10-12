$res = Invoke-RestMethod -Uri 'https://script.google.com/macros/s/AKfycbwuDJ9X5a27GnVuuiU1keHexKXzG3OITUxwOomwHGt-1S53DdqfAfguDInXwtbh9ljKMw/exec?action=resetToZero'
Write-Host ($res | ConvertTo-Json)
