if (-not (Test-Path "C:\Caddy")) { New-Item -ItemType Directory -Path "C:\Caddy" -Force | Out-Null }

if (Test-Path "C:\TRIAI\caddy.exe") {
    Copy-Item -Path "C:\TRIAI\caddy.exe" -Destination "C:\Caddy\caddy.exe" -Force
} elseif (Test-Path "C:\TRIAI\caddy_test.exe") {
    Copy-Item -Path "C:\TRIAI\caddy_test.exe" -Destination "C:\Caddy\caddy.exe" -Force
}

$caddyfileContent = @"
banhangdinhcao.com, www.banhangdinhcao.com {
    reverse_proxy 127.0.0.1:5000
}
"@
Set-Content -Path "C:\Caddy\Caddyfile" -Value $caddyfileContent -Encoding UTF8

Write-Host "Mo cong tuong lua 80 va 443..." -ForegroundColor Green
netsh advfirewall firewall add rule name="TRIAI-HTTP" dir=in action=allow protocol=TCP localport=80 >$null 2>&1
netsh advfirewall firewall add rule name="TRIAI-HTTPS" dir=in action=allow protocol=TCP localport=443 >$null 2>&1

Write-Host "Dang bat Caddy SSL..." -ForegroundColor Green
cd C:\Caddy
.\caddy.exe run
