# ERP Template untuk UMKM Indonesia 🇮🇩

Website template ERP lengkap dan cerdas untuk bisnis UMKM Indonesia. Dilengkapi dengan integrasi AI, database cloud (Turso), dan fitur customization penuh.

## ✨ Fitur Utama

- 📦 **Manajemen Produk** - CRUD produk dengan tracking stok
- 👥 **Manajemen Pelanggan** - CRM sederhana untuk pelanggan
- 🛒 **Point of Sale (POS)** - Kasir dengan berbagai metode pembayaran
- 📊 **Dashboard Analytics** - Statistik penjualan real-time
- 🤖 **AI Assistant** - Chatbot cerdas dengan multi-provider (Groq, OpenAI, Gemini, Anthropic, Ollama)
- 🎨 **Full Customization** - Warna, tema, dan branding
- 🗄️ **Multi-Mode Database** - Cloud (Turso), Local, atau Hybrid
- 📱 **Responsive** - Berfungsi di desktop dan mobile

## 🚀 Cara Mulai

### 1. Clone Repository
```bash
git clone https://github.com/Hengki-Setiawan/Website-ERP.git
cd Website-ERP/erp-template
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Jalankan Development Server
```bash
npm run dev
```

### 4. Setup Database (Opsional)
1. Buka https://turso.tech dan daftar akun gratis
2. Buat database baru
3. Copy Database URL dan Auth Token
4. Masukkan di halaman **Dashboard > Database**

## 📁 Struktur Project

```
erp-template/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes (backend)
│   │   │   ├── products/      # CRUD produk
│   │   │   ├── customers/     # CRUD pelanggan
│   │   │   ├── transactions/  # Transaksi
│   │   │   ├── auth/          # Autentikasi
│   │   │   ├── settings/      # Pengaturan
│   │   │   ├── dashboard/     # Statistik
│   │   │   ├── db/            # Database ops
│   │   │   └── ai/            # AI integration
│   │   ├── dashboard/         # Halaman dashboard
│   │   │   ├── products/      # Produk
│   │   │   ├── customers/     # Pelanggan
│   │   │   ├── pos/           # Kasir
│   │   │   ├── transactions/  # Riwayat transaksi
│   │   │   ├── database/      # Setup database
│   │   │   ├── ai/            # AI chatbot
│   │   │   └── settings/      # Pengaturan
│   │   ├── login/             # Halaman login
│   │   └── page.tsx           # Landing page
│   ├── components/            # Komponen UI
│   ├── lib/                   # Libraries & utilities
│   │   ├── db/               # Database schema & client
│   │   ├── auth.ts           # Authentication
│   │   ├── ai.ts             # AI integration
│   │   └── store.ts          # Zustand state management
│   └── types/                # TypeScript types
├── public/                   # Static assets
└── package.json
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Turso (libSQL)
- **State**: Zustand
- **AI**: Multi-provider (Groq, OpenAI, Gemini, Anthropic, Ollama)
- **Icons**: Lucide React
- **Auth**: JWT + bcrypt

## 📝 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET/POST/PUT/DELETE | `/api/products` | CRUD Produk |
| GET/POST/PUT/DELETE | `/api/customers` | CRUD Pelanggan |
| GET/POST/DELETE | `/api/transactions` | Transaksi |
| POST | `/api/auth` | Login/Register/Logout |
| GET/POST | `/api/settings` | Pengaturan |
| GET | `/api/dashboard/stats` | Statistik Dashboard |
| POST | `/api/db/init` | Inisialisasi Database |
| POST | `/api/db/test` | Test Koneksi DB |
| POST | `/api/ai/chat` | Chat dengan AI |
| POST | `/api/ai/test` | Test API Key AI |

## 🔐 Keamanan

- Password di-hash dengan bcrypt (12 rounds)
- JWT untuk autentikasi
- HttpOnly cookies
- CORS & security headers
- Role-Based Access Control (Owner, Admin, Cashier, Viewer)

## 📄 License

MIT License - bebas digunakan untuk proyek pribadi ataupun komersial.

---

Made with ❤️ for UMKM Indonesia
