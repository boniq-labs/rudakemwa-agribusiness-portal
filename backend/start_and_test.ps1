$serverJob = Start-Job -Name "srv" -ScriptBlock {
  Set-Location "D:\fast\efms\backend"
  & "node_modules\.bin\tsx.cmd" "src\server.ts" 2>&1 | Out-Null
}
Start-Sleep 10
$health = curl.exe -s --max-time 5 http://localhost:5000/api/health
Write-Host "HEALTH: $health"
$login = curl.exe -s --max-time 5 -X POST -H "Content-Type: application/json" -d '{"username":"owner","password":"admin123"}' http://localhost:5000/api/auth/login
Write-Host "LOGIN: $login"
Stop-Job $serverJob -ErrorAction SilentlyContinue
Remove-Job $serverJob -ErrorAction SilentlyContinue
taskkill /F /IM node.exe 2>&1 | Out-Null
