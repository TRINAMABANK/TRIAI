[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Write-Host "Dang tai Caddy SSL Server..." -ForegroundColor Yellow
Invoke-WebRequest -Uri "https://github.com/caddyserver/caddy/releases/download/v2.7.6/caddy_2.7.6_windows_amd64.zip" -OutFile "C:\caddy.zip"
Expand-Archive -Path "C:\caddy.zip" -DestinationPath "C:\Caddy" -Force

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
