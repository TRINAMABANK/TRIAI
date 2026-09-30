# 📘 TRÍ AI SAAS PLATFORM — HƯỚNG DẪN TRIỂN KHAI & VẬN HÀNH TOÀN DIỆN

Tài liệu này cung cấp toàn bộ quy trình thiết lập môi trường phát triển cục bộ và hướng dẫn từng bước chuẩn bị triển khai lên máy chủ VPS / Cloud khi người dùng có Domain và Hosting chính thức.

---

## I. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

TRÍ AI SaaS Platform được thiết kế theo kiến trúc chuẩn Enterprise:

```
[Người dùng / Khách hàng]
          │
          ▼
 [React 18 + Vite SPA Frontend (Port 3000 / Static Web)]
          │
          ▼  /api Reverse Proxy
 [Node.js Express 5.x Backend API (Port 5000)]
   ├── Auth & RBAC Middleware (triqnnamabank@gmail.com = Master Admin)
   ├── AI Runtime Orchestrator (Context + Persona + OpenAI API / Local Fallback)
   ├── Dynamic Skill Engine (33 Master Skills + ZIP Upload Extractor)
   ├── License & 15m Trial Engine
   ├── VietQR OCB Auto-Payment Gateway & Auto License Activation
   └── Relational Storage (SQLite WAL / PostgreSQL Abstraction)
```

---

## II. CHẠY VÀ PHÁT TRIỂN CỤC BỘ (LOCAL DEVELOPMENT)

Hệ thống có khả năng khởi chạy độc lập 100% trên máy tính cá nhân không yêu cầu cấu hình phức tạp:

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình file môi trường `.env`
Tạo file `.env` tại thư mục gốc với các thông số:
```env
PORT=5000
NODE_ENV=development
APP_URL=http://localhost:3000
API_URL=http://localhost:5000/api
CORS_ORIGIN=*

# Cấu hình Cơ sở dữ liệu SQLite cục bộ (Không cần cài đặt DB server ngoài)
DATABASE_PATH=./.data/triai.db

# Bảo mật & Phân quyền Master Admin
JWT_SECRET=triai_master_jwt_secret_dev_key_2026_qnt
JWT_EXPIRES_IN=7d
MASTER_ADMIN_EMAIL=triqnnamabank@gmail.com
ADMIN_INITIAL_PASSWORD=TriAI@2026!Admin

# Dùng thử & Thanh toán
TRIAL_DURATION_MINUTES=15
VIETQR_BANK_CODE=OCB
VIETQR_ACCOUNT_NUMBER=0004100030588008
VIETQR_ACCOUNT_NAME=QUANG NHỰT TRÍ

# Trí tuệ nhân tạo (Nếu chưa có API Key, hệ thống tự động chạy Local Engine phản hồi chuẩn nghiệp vụ)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

### 3. Khởi chạy toàn bộ hệ thống (Frontend + Backend)
```bash
npm run dev
```
- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:5000`
- **Health Check:** `http://localhost:5000/api/health`

---

## III. HƯỚNG DẪN KHI BẮT ĐẦU TRIỂN KHAI LÊN VPS & DOMAIN THẬT

Khi anh Trí đã mua Domain và thuê VPS (Ubuntu 22.04 LTS), thực hiện theo các bước sau:

### 1. Chuẩn bị máy chủ VPS
```bash
# Cập nhật hệ thống & cài Node.js 20.x
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx

# Cài PM2 để duy trì tiến trình server chạy ngầm
sudo npm install -g pm2
```

### 2. Build Frontend cho môi trường Production
```bash
npm run build
```
Thư mục `dist/` sẽ chứa toàn bộ mã nguồn tĩnh đã được bundle và tối ưu tốc độ tải.

### 3. Khởi chạy Backend bằng PM2
```bash
pm2 start server/src/server.js --name "tri-ai-backend"
pm2 save
pm2 startup
```

### 4. Cấu hình Nginx Reverse Proxy & SSL (HTTPS)
Tạo file `/etc/nginx/sites-available/triai.conf`:
```nginx
server {
    server_name yourdomain.com www.yourdomain.com;

    # Frontend Static Files
    root /var/www/tri-ai/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static Uploads Proxy
    location /uploads/ {
        proxy_pass http://127.0.0.1:5000/uploads/;
        proxy_set_header Host $host;
    }
}
```

Kích hoạt cấu hình và cấp chứng chỉ SSL miễn phí:
```bash
sudo ln -s /etc/nginx/sites-available/triai.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## IV. BẢO MẬT & SAO LƯU DỮ LIỆU

1. **Sao lưu Database định kỳ:**
   ```bash
   cp ./.data/triai.db ./.data/backups/triai_$(date +%Y%m%d_%H%M%S).db
   ```
2. **Quyền Master Admin:**
   Chỉ email `triqnnamabank@gmail.com` mới có quyền phê duyệt, kích hoạt, thu hồi bản quyền và chỉnh sửa cấu hình các Skill, Agent của toàn bộ khách hàng.
