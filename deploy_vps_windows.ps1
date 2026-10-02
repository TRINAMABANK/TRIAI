# ==============================================================================
# TRÍ AI SAAS PLATFORM — TỰ ĐỘNG THIẾT LẬP & KHỞI CHẠY VPS WINDOWS SERVER
# Domain: banhangdinhcao.com & www.banhangdinhcao.com | IP: 160.187.228.50
# ==============================================================================

$ErrorActionPreference = "Continue"

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  🤖 BẮT ĐẦU TỰ ĐỘNG CẤU HÌNH TRÍ AI TRÊN VPS WINDOWS" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Mở cổng tường lửa Windows Firewall (Port 80, 443, 5000, 3000)
Write-Host "`n[1/6] Đang mở các cổng tường lửa Windows Firewall (80, 443, 5000)..." -ForegroundColor Green
netsh advfirewall firewall delete rule name="TRIAI-HTTP" 2>$null
netsh advfirewall firewall delete rule name="TRIAI-HTTPS" 2>$null
netsh advfirewall firewall delete rule name="TRIAI-API" 2>$null

netsh advfirewall firewall add rule name="TRIAI-HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="TRIAI-HTTPS" dir=in action=allow protocol=TCP localport=443
netsh advfirewall firewall add rule name="TRIAI-API" dir=in action=allow protocol=TCP localport=5000
Write-Host "  -> Đã mở cổng tường lửa thành công!" -ForegroundColor Green

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
if (Test-Path "$targetDir\.git") {
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
PORT=5000
NODE_ENV=production
APP_URL=https://banhangdinhcao.com
API_URL=https://banhangdinhcao.com/api
CORS_ORIGIN=*

# Database SQLite
DATABASE_URL=file:./.data/triai.db
STORAGE_PATH=./uploads
MAX_FILE_SIZE_MB=25

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

# 6. Cài đặt dependencies và khởi động Backend
Write-Host "`n[6/6] Cài đặt dependencies và khởi chạy Server..." -ForegroundColor Green
npm install --production=false
npm run build

# Cài đặt PM2 để chạy nền Node.js
Write-Host "  -> Khởi động Node.js Server qua PM2..." -ForegroundColor Yellow
npm install -g pm2
pm2 delete triai 2>$null
pm2 start server/src/server.js --name "triai"
pm2 save

# 7. Tải và cấu hình Caddy Server làm HTTPS/HTTP Reverse Proxy
Write-Host "`n🔒 Thiết lập Caddy Web Server & Tự động cấp chứng chỉ SSL HTTPS..." -ForegroundColor Green
$caddyExe = "$targetDir\caddy.exe"
if (-not (Test-Path $caddyExe)) {
    Write-Host "  -> Đang tải Caddy Server cho Windows..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://github.com/caddyserver/caddy/releases/download/v2.8.4/caddy_2.8.4_windows_amd64.zip" -OutFile "$env:TEMP\caddy.zip"
    Expand-Archive -Path "$env:TEMP\caddy.zip" -DestinationPath "$env:TEMP\caddy_unzip" -Force
    Copy-Item "$env:TEMP\caddy_unzip\caddy.exe" $caddyExe -Force
}

$caddyfileContent = @"
banhangdinhcao.com, www.banhangdinhcao.com, :80 {
    reverse_proxy localhost:5000
}
"@

Set-Content -Path "$targetDir\Caddyfile" -Value $caddyfileContent -Encoding UTF8

# Dừng caddy cũ nếu có và chạy caddy mới
Stop-Process -Name "caddy" -ErrorAction SilentlyContinue
Start-Process -FilePath $caddyExe -ArgumentList "run --config $targetDir\Caddyfile" -WindowStyle Hidden

Write-Host "`n======================================================" -ForegroundColor Cyan
Write-Host "  🎉 HỆ THỐNG TRÍ AI ĐÃ KHỞI CHẠY THÀNH CÔNG TRÊN VPS!" -ForegroundColor Green
Write-Host "  🌐 Domain chính: https://banhangdinhcao.com" -ForegroundColor Yellow
Write-Host "  🌐 Domain phụ:   https://www.banhangdinhcao.com" -ForegroundColor Yellow
Write-Host "  🌐 HTTP dự phòng: http://banhangdinhcao.com" -ForegroundColor Yellow
Write-Host "  🌐 IP Server:    http://160.187.228.50:5000" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan
