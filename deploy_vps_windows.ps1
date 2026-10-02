# ==============================================================================
# TRÍ AI SAAS PLATFORM — TỰ ĐỘNG THIẾT LẬP & KHỞI CHẠY VPS WINDOWS SERVER
# Domain: banhangdinhcao.com | IP: 160.187.228.50
# ==============================================================================

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  🤖 BẮT ĐẦU TỰ ĐỘNG CẤU HÌNH TRÍ AI TRÊN VPS WINDOWS" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Mở cổng tường lửa Windows Firewall (Port 80, 443, 5000)
Write-Host "`n[1/6] Đang mở các cổng tường lửa Windows Firewall (80, 443, 5000)..." -ForegroundColor Green
netsh advfirewall firewall delete rule name="TRIAI-HTTP" 2>$null
netsh advfirewall firewall delete rule name="TRIAI-HTTPS" 2>$null
netsh advfirewall firewall delete rule name="TRIAI-API" 2>$null

netsh advfirewall firewall add rule name="TRIAI-HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="TRIAI-HTTPS" dir=in action=allow protocol=TCP localport=443
netsh advfirewall firewall add rule name="TRIAI-API" dir=in action=allow protocol=TCP localport=5000
Write-Host "  -> Đã mở cổng 80, 443, 5000 thành công!" -ForegroundColor Green

# 2. Kiểm tra và cài đặt Git nếu chưa có
Write-Host "`n[2/6] Kiểm tra môi trường Git..." -ForegroundColor Green
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "  -> Đang tải và cài đặt Git for Windows..." -ForegroundColor Yellow
    $gitInstaller = "$env:TEMP\git_setup.exe"
    Invoke-WebRequest -Uri "https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/Git-2.44.0-64-bit.exe" -OutFile $gitInstaller
    Start-Process -FilePath $gitInstaller -ArgumentList "/VERYSILENT /NORESTART /NOCANCEL /SP- /CLOSEAPPLICATIONS /RESTARTAPPLICATIONS" -Wait
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}
Write-Host "  -> Git đã sẵn sàng!" -ForegroundColor Green

# 3. Kiểm tra và cài đặt Node.js nếu chưa có
Write-Host "`n[3/6] Kiểm tra môi trường Node.js..." -ForegroundColor Green
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "  -> Đang tải và cài đặt Node.js LTS (v20.x)..." -ForegroundColor Yellow
    $nodeMsi = "$env:TEMP\node_setup.msi"
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.12.2/node-v20.12.2-x64.msi" -OutFile $nodeMsi
    Start-Process msiexec.exe -ArgumentList "/i `"$nodeMsi`" /qn /norestart" -Wait
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}
Write-Host "  -> Node.js version: $(node -v)" -ForegroundColor Green

# 4. Kéo hoặc tạo thư mục dự án C:\TRIAI
Write-Host "`n[4/6] Cập nhật mã nguồn mới nhất từ GitHub..." -ForegroundColor Green
$targetDir = "C:\TRIAI"
if (Test-Path $targetDir) {
    Set-Location $targetDir
    git reset --hard
    git pull origin main
} else {
    git clone https://github.com/TRINAMABANK/TRIAI.git $targetDir
    Set-Location $targetDir
}

# 5. Cấu hình file .env chuẩn Production
Write-Host "`n[5/6] Thiết lập cấu hình hệ thống .env..." -ForegroundColor Green
$envContent = @"
PORT=80
NODE_ENV=production
APP_URL=https://banhangdinhcao.com
API_URL=https://banhangdinhcao.com/api
CORS_ORIGIN=*

# Database SQLite
DATABASE_PATH=./.data/triai.db
UPLOAD_DIR=./uploads

# Security & Master Admin
JWT_SECRET=triai_master_jwt_secret_production_2026_qnt
JWT_EXPIRES_IN=7d
MASTER_ADMIN_EMAIL=triqnnamabank@gmail.com
ADMIN_INITIAL_PASSWORD=TriAI@2026!Admin

# Dùng thử & Thanh toán VietQR OCB
TRIAL_DURATION_MINUTES=15
VIETQR_BANK_CODE=OCB
VIETQR_ACCOUNT_NUMBER=0982441446
VIETQR_ACCOUNT_NAME=QUANG NHỰT TRÍ

# AI Runtime OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
"@

Set-Content -Path "$targetDir\.env" -Value $envContent -Encoding UTF8
Write-Host "  -> File .env đã được cấu hình chuẩn!" -ForegroundColor Green

# 6. Cài đặt dependencies, build frontend và khởi chạy hệ thống
Write-Host "`n[6/6] Cài đặt dependencies và đóng gói bản dựng..." -ForegroundColor Green
npm install
npm run build

Write-Host "`n🚀 Khởi động dịch vụ TRÍ AI Server qua PM2..." -ForegroundColor Green
npm install -g pm2
pm2 delete triai 2>$null
pm2 start server/src/server.js --name "triai"
pm2 save

Write-Host "`n======================================================" -ForegroundColor Cyan
Write-Host "  🎉 HỆ THỐNG TRÍ AI ĐÃ KHỞI CHẠY THÀNH CÔNG TRÊN VPS!" -ForegroundColor Green
Write-Host "  🌐 Truy cập trực tiếp qua IP: http://160.187.228.50" -ForegroundColor Yellow
Write-Host "  🌐 Hoặc Domain: https://banhangdinhcao.com" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan
