@echo off
chcp 65001 >nul
title TRÍ AI SAAS PLATFORM - PRODUCTION SERVER

echo ===================================================================
echo   🤖 DANG KHOI DONG HE THONG TRI AI SAAS TREN CONG 80...
echo ===================================================================

echo [1/3] Mo cong tuong lua Windows Firewall (Port 80, 443, 5000)...
netsh advfirewall firewall add rule name="TRIAI-HTTP" dir=in action=allow protocol=TCP localport=80 >nul 2>&1
netsh advfirewall firewall add rule name="TRIAI-HTTPS" dir=in action=allow protocol=TCP localport=443 >nul 2>&1
netsh advfirewall firewall add rule name="TRIAI-API" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1
echo   -^> Da mo cong tuong lua thanh cong!

echo [2/3] Build giao dien Single Page Application...
call npm run build

echo [3/3] Bat may chu web node server/src/server.js tren Cong 80...
set PORT=80
node server/src/server.js

pause
