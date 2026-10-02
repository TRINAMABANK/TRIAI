@echo off
chcp 65001 >nul
title THIET LAP SSL HTTPS CHO BANHANGDINHCAO.COM

echo ===================================================================
echo   DANG THIET LAP SSL HTTPS CHO BANHANGDINHCAO.COM...
echo ===================================================================

if not exist "C:\Caddy" mkdir "C:\Caddy"

echo [1/4] Mo cong tuong lua 80, 443, 5000...
netsh advfirewall firewall add rule name="TRIAI-HTTP" dir=in action=allow protocol=TCP localport=80 >nul 2>&1
netsh advfirewall firewall add rule name="TRIAI-HTTPS" dir=in action=allow protocol=TCP localport=443 >nul 2>&1
netsh advfirewall firewall add rule name="TRIAI-API" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1

echo [2/4] Tao file cau hinh Caddyfile...
(
echo banhangdinhcao.com, www.banhangdinhcao.com {
echo     reverse_proxy 127.0.0.1:5000
echo }
) > "C:\Caddy\Caddyfile"

echo [3/4] Tai Caddy SSL Server neu chua co...
if not exist "C:\Caddy\caddy.exe" (
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/caddyserver/caddy/releases/download/v2.7.6/caddy_2.7.6_windows_amd64.zip' -OutFile '%TEMP%\caddy.zip'; Expand-Archive -Path '%TEMP%\caddy.zip' -DestinationPath 'C:\Caddy' -Force"
)

echo [4/4] Khoi dong Backend Port 5000 va Caddy SSL Port 443...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM caddy.exe >nul 2>&1

start "TRIAI-BACKEND" /min cmd /c "cd /d C:\TRIAI && set PORT=5000 && node server/src/server.js"
start "TRIAI-CADDY-SSL" /min cmd /c "cd /d C:\Caddy && caddy.exe run --config Caddyfile"

echo ===================================================================
echo   DA KHOI DONG THANH CONG HTTPS CHO BANHANGDINHCAO.COM!
echo ===================================================================
pause
