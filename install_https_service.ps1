# ==============================================================================
# TRÍ AI SAAS PLATFORM — TỰ ĐỘNG CÀI ĐẶT TOÀN DIỆN HTTPS/SSL CHO BANHANGDINHCAO.COM
# ==============================================================================

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  BẮT ĐẦU CÀI ĐẶT Ổ KHÓA XANH HTTPS CHO BANHANGDINHCAO.COM" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Cập nhật cấu hình cổng Backend sang 5000
Write-Host "`n[1/5] Cập nhật Backend sang cổng 5000..." -ForegroundColor Green
$envPath = "C:\TRIAI\.env"
$envLines = @(
    "PORT=5000",
    "NODE_ENV=production",
    "APP_URL=https://banhangdinhcao.com",
    "API_URL=https://banhangdinhcao.com/api",
    "CORS_ORIGIN=*",
    "DATABASE_PATH=./.data/triai.db",
    "UPLOAD_DIR=./uploads",
    "JWT_SECRET=triai_master_jwt_secret_production_2026_qnt",
    "JWT_EXPIRES_IN=7d",
    "MASTER_ADMIN_EMAIL=triqnnamabank@gmail.com",
    "ADMIN_INITIAL_PASSWORD=TriAI@2026!Admin",
    "TRIAL_DURATION_MINUTES=15",
    "VIETQR_BANK_CODE=OCB",
    "VIETQR_ACCOUNT_NUMBER=0982441446",
    "VIETQR_ACCOUNT_NAME=QUANG NHỰT TRÍ",
    "OPENAI_API_KEY=",
    "OPENAI_MODEL=gpt-4o-mini"
)
$envLines | Set-Content -Path $envPath -Encoding UTF8

# 2. Mở cổng tường lửa Windows Firewall cho 80, 443, 5000
Write-Host "`n[2/5] Mở các cổng tường lửa 80 (HTTP), 443 (HTTPS), 5000 (API)..." -ForegroundColor Green
netsh advfirewall firewall delete rule name="TRIAI-HTTP" 2>$null
netsh advfirewall firewall delete rule name="TRIAI-HTTPS" 2>$null
netsh advfirewall firewall delete rule name="TRIAI-API" 2>$null

netsh advfirewall firewall add rule name="TRIAI-HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="TRIAI-HTTPS" dir=in action=allow protocol=TCP localport=443
netsh advfirewall firewall add rule name="TRIAI-API" dir=in action=allow protocol=TCP localport=5000

# 3. Tải Caddy Server (Trình cấp phát SSL Let's Encrypt tự động cho Windows)
Write-Host "`n[3/5] Tải và thiết lập Caddy SSL Server..." -ForegroundColor Green
$caddyDir = "C:\Caddy"
if (-not (Test-Path $caddyDir)) {
    New-Item -ItemType Directory -Path $caddyDir -Force | Out-Null
}

$caddyExe = "$caddyDir\caddy.exe"
if (-not (Test-Path $caddyExe)) {
    $zipPath = "$env:TEMP\caddy.zip"
    Write-Host "  -> Đang tải Caddy binary..." -ForegroundColor Yellow
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri "https://github.com/caddyserver/caddy/releases/download/v2.7.6/caddy_2.7.6_windows_amd64.zip" -OutFile $zipPath
    Expand-Archive -Path $zipPath -DestinationPath $caddyDir -Force
    Remove-Item $zipPath -Force
}

# 4. Tạo Caddyfile cấu hình đầy đủ https, www, http
Write-Host "`n[4/5] Tạo file cấu hình SSL Caddyfile..." -ForegroundColor Green
$caddyLines = @(
    "banhangdinhcao.com, www.banhangdinhcao.com {",
    "    reverse_proxy 127.0.0.1:5000",
    "}"
)
$caddyLines | Set-Content -Path "$caddyDir\Caddyfile" -Encoding UTF8

# 5. Dừng các tiến trình node/caddy cũ và khởi động mới song song
Write-Host "`n[5/5] Khởi động hệ thống Backend và Caddy SSL..." -ForegroundColor Green
Stop-Process -Name "caddy" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 1

# Khởi động Backend
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d C:\TRIAI && node server/src/server.js" -WindowStyle Minimized

# Khởi động Caddy
Start-Process -FilePath $caddyExe -ArgumentList "run --config C:\Caddy\Caddyfile" -WorkingDirectory $caddyDir

Write-Host "`n======================================================" -ForegroundColor Cyan
Write-Host "  HỆ THỐNG ĐÃ KÍCH HOẠT THÀNH CÔNG Ổ KHÓA XANH HTTPS!" -ForegroundColor Green
Write-Host "  HTTPS: https://banhangdinhcao.com" -ForegroundColor Yellow
Write-Host "  WWW:   https://www.banhangdinhcao.com" -ForegroundColor Yellow
Write-Host "  HTTP:  http://banhangdinhcao.com" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan
