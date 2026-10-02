@echo off
chcp 65001 >nul
echo ======================================================
echo   BAT DAU CAU HINH TRI AI TREN VPS WINDOWS
echo ======================================================

echo [1/4] Mo cong tuong lua Windows Firewall 80, 443, 5000...
netsh advfirewall firewall delete rule name="TRIAI-HTTP" >nul 2>&1
netsh advfirewall firewall delete rule name="TRIAI-HTTPS" >nul 2>&1
netsh advfirewall firewall delete rule name="TRIAI-API" >nul 2>&1

netsh advfirewall firewall add rule name="TRIAI-HTTP" dir=in action=allow protocol=TCP localport=80 >nul 2>&1
netsh advfirewall firewall add rule name="TRIAI-HTTPS" dir=in action=allow protocol=TCP localport=443 >nul 2>&1
netsh advfirewall firewall add rule name="TRIAI-API" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1
echo   - Da mo tuong lua thanh cong!

echo [2/4] Cap nhat ma nguon tu GitHub...
cd /d C:\TRIAI
git reset --hard
git pull origin main

echo [3/4] Cai dat dependencies va Build Frontend...
call npm install --production=false
call npm run build

echo [4/4] Khoi dong Node.js Server & PM2...
call npm install -g pm2
call pm2 delete triai >nul 2>&1
call pm2 start server/src/server.js --name "triai"
call pm2 save

echo ======================================================
echo   HE THONG TRI AI DA KHOI DONG THANH CONG!
echo   Domain: https://banhangdinhcao.com
echo   IP:     http://160.187.228.50:5000
echo ======================================================
pause
