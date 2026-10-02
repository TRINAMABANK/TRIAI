# ==============================================================================
# TRÍ AI SAAS PLATFORM — TU DONG THIET LAP & KHOI CHAY VPS WINDOWS SERVER
# Domain: banhangdinhcao.com & www.banhangdinhcao.com | IP: 160.187.228.50
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

Write-Output "======================================================"
Write-Output "  BAT DAU TU DONG CAU HINH TRI AI TREN VPS WINDOWS"
Write-Output "======================================================"

# 1. Mo cong tuong lua Windows Firewall (Port 80, 443, 5000)
Write-Output "`n[1/6] Dang mo cac cong tuong lua Windows Firewall (80, 443, 5000)..."
netsh advfirewall firewall delete rule name="TRIAI-HTTP" 2>$null
netsh advfirewall firewall delete rule name="TRIAI-HTTPS" 2>$null
netsh advfirewall firewall delete rule name="TRIAI-API" 2>$null

netsh advfirewall firewall add rule name="TRIAI-HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="TRIAI-HTTPS" dir=in action=allow protocol=TCP localport=443
netsh advfirewall firewall add rule name="TRIAI-API" dir=in action=allow protocol=TCP localport=5000
Write-Output "  -> Da mo cong tuong lua thanh cong!"

# 2. Kiem tra va cai dat Git neu chua co
Write-Output "`n[2/6] Kiem tra moi truong Git..."
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Output "  -> Dang tai va cai dat Git for Windows..."
    $gitInstaller = "$env:TEMP\git_setup.exe"
    Invoke-WebRequest -Uri "https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/Git-2.44.0-64-bit.exe" -OutFile $gitInstaller
    Start-Process -FilePath $gitInstaller -ArgumentList "/VERYSILENT /NORESTART /NOCANCEL /SP- /CLOSEAPPLICATIONS /RESTARTAPPLICATIONS" -Wait
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}
Write-Output "  -> Git da san sang!"

# 3. Kiem tra va cai dat Node.js neu chua co
Write-Output "`n[3/6] Kiem tra moi truong Node.js..."
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Output "  -> Dang tai va cai dat Node.js LTS (v20.x)..."
    $nodeMsi = "$env:TEMP\node_setup.msi"
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.12.2/node-v20.12.2-x64.msi" -OutFile $nodeMsi
    Start-Process msiexec.exe -ArgumentList "/i `"$nodeMsi`" /qn /norestart" -Wait
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}
Write-Output "  -> Node.js version: $(node -v)"

# 4. Cap nhat ma nguon tu GitHub
Write-Output "`n[4/6] Cap nhat ma nguon moi nhat tu GitHub..."
$targetDir = "C:\TRIAI"
if (Test-Path "$targetDir\.git") {
    Set-Location $targetDir
    git reset --hard
    git pull origin main
} else {
    git clone https://github.com/TRINAMABANK/TRIAI.git $targetDir
    Set-Location $targetDir
}

# 5. Cau hinh file .env chuan Production
Write-Output "`n[5/6] Thiet lap cau hinh he thong .env..."
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
ADMIN_INITIAL_PASSWORD=Giamua@2023admin

# Dung thu & Thanh toan VietQR OCB
TRIAL_DURATION_MINUTES=15
VIETQR_BANK_CODE=OCB
VIETQR_ACCOUNT_NUMBER=0982441446
VIETQR_ACCOUNT_NAME=QUANG NHUT TRI

# AI Runtime OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
"@

Set-Content -Path "$targetDir\.env" -Value $envContent -Encoding UTF8
Write-Output "  -> File .env da duoc cau hinh chuan!"

# 6. Cai dat dependencies va khoi dong Backend
Write-Output "`n[6/6] Cai dat dependencies va khoi chay Server..."
npm install --production=false
npm run build

# Cai dat PM2 de chay nen Node.js
Write-Output "  -> Khoi dong Node.js Server qua PM2..."
npm install -g pm2
pm2 delete triai 2>$null
pm2 start server/src/server.js --name "triai"
pm2 save

# 7. Tai va cau hinh Caddy Server lam HTTPS/HTTP Reverse Proxy
Write-Output "`nThiet lap Caddy Web Server & Tu dong cap chung chi SSL HTTPS..."
$caddyExe = "$targetDir\caddy.exe"
if (-not (Test-Path $caddyExe)) {
    Write-Output "  -> Dang tai Caddy Server cho Windows..."
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

# Dung caddy cu neu co va chay caddy moi
Stop-Process -Name "caddy" -ErrorAction SilentlyContinue
Start-Process -FilePath $caddyExe -ArgumentList "run --config $targetDir\Caddyfile" -WindowStyle Hidden

Write-Output "`n======================================================"
Write-Output "  HE THONG TRI AI DA KHOI CHAY THANH CONG TREN VPS!"
Write-Output "  Domain chinh:  https://banhangdinhcao.com"
Write-Output "  Domain phu:    https://www.banhangdinhcao.com"
Write-Output "  HTTP du phong: http://banhangdinhcao.com"
Write-Output "  IP Server:     http://160.187.228.50:5000"
Write-Output "======================================================"
