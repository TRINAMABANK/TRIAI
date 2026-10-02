# ==============================================================================
# TRÍ AI SAAS PLATFORM — TỰ ĐỘNG CÀI ĐẶT SSL/HTTPS VỚI CADDY SERVER (WINDOWS)
# Domain: banhangdinhcao.com | IP: 160.187.228.50
# ==============================================================================

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  🔒 BẮT ĐẦU TỰ ĐỘNG CÀI ĐẶT SSL/HTTPS CHO BANHANGDINHCAO.COM" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan

$caddyDir = "C:\Caddy"
if (-not (Test-Path $caddyDir)) {
    New-Item -ItemType Directory -Path $caddyDir -Force | Out-Null
}

# 1. Tải Caddy Server cho Windows nếu chưa có
Write-Host "`n[1/4] Tải công cụ cấp phát SSL Caddy Server..." -ForegroundColor Green
$caddyExe = "$caddyDir\caddy.exe"
if (-not (Test-Path $caddyExe)) {
    $zipPath = "$env:TEMP\caddy.zip"
    Invoke-WebRequest -Uri "https://github.com/caddyserver/caddy/releases/download/v2.7.6/caddy_2.7.6_windows_amd64.zip" -OutFile $zipPath
    Expand-Archive -Path $zipPath -DestinationPath $caddyDir -Force
    Remove-Item $zipPath -Force
}
Write-Host "  -> Caddy Server đã sẵn sàng!" -ForegroundColor Green

# 2. Tạo Caddyfile cấu hình HTTPS tự động cho banhangdinhcao.com
Write-Host "`n[2/4] Tạo cấu hình SSL cho banhangdinhcao.com..." -ForegroundColor Green
$caddyFileContent = @"
banhangdinhcao.com, www.banhangdinhcao.com {
    reverse_proxy 127.0.0.1:5000
}
"@
Set-Content -Path "$caddyDir\Caddyfile" -Value $caddyFileContent -Encoding UTF8
Write-Host "  -> Đã tạo file cấu hình Caddyfile thành công!" -ForegroundColor Green

# 3. Đổi cổng backend Node.js sang port 5000 (để Caddy quản lý port 80 & 443)
Write-Host "`n[3/4] Cập nhật cấu hình cổng Backend..." -ForegroundColor Green
$envPath = "C:\TRIAI\.env"
if (Test-Path $envPath) {
    (Get-Content $envPath) -replace 'PORT=80', 'PORT=5000' | Set-Content $envPath
} else {
    Set-Content -Path $envPath -Value "PORT=5000`nNODE_ENV=production" -Encoding UTF8
}

# 4. Mở cổng 80 & 443 cho Caddy
Write-Host "`n[4/4] Mở cổng tường lửa HTTPS 443..." -ForegroundColor Green
netsh advfirewall firewall add rule name="TRIAI-HTTPS" dir=in action=allow protocol=TCP localport=443 >$null 2>&1
netsh advfirewall firewall add rule name="TRIAI-HTTP" dir=in action=allow protocol=TCP localport=80 >$null 2>&1

Write-Host "`n======================================================" -ForegroundColor Cyan
Write-Host "  🎉 CÀI ĐẶT SSL HOÀN TẤT!" -ForegroundColor Green
Write-Host "  Chạy Caddy để kích hoạt ổ khóa xanh HTTPS:" -ForegroundColor Yellow
Write-Host "  Start-Process $caddyExe -ArgumentList 'run', '--config', '$caddyDir\Caddyfile'" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan
