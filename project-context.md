# Project Context

## Tech Stack & Architecture

### 1. Backend Architecture & Key Features
- **Tech Stack**: Node.js (TypeScript), Express.js, Prisma ORM (PostgreSQL), Redis, Zod (Validasi).
- **Session & Cookie Management**:
  - Menggunakan kombinasi **Refresh Token** (disimpan di Redis dan dikirim sebagai `http-only`, `secure`, `sameSite` Cookie).
  - Menggunakan **Access Token (JWT)** berumur pendek (10 menit) yang dikirim ke Frontend dan disisipkan pada header `Authorization: Bearer <token>`.
- **Rate Limiting**: Custom middleware berbasis Redis (`rl`) yang membatasi *request* spesifik per endpoint. Memiliki mekanisme penalti pemotongan kuota *hit* yang lebih besar khusus untuk *request* yang berhasil (status 200-299)
- **Global Routing & Error Handling**: Seluruh API berjalan di *base path* `/api/`. Error ditangkap secara global melalui *centralized error handler* (`error-handler.middleware.ts`). Secara umum, backend ini hanya mengembalikan **HTTP Status Code** saja (misal `200 OK` tanpa body), **kecuali** pada error `400 Bad Request` yang mengembalikan pesan spesifik (contoh: `{ "error": "wrong password" }`).

### 2. Frontend Architecture & Key Features
- **Tech Stack**: React 19 (TS), Vite, Tailwind CSS v4, Lucide React, i18next (Lokalisasi).
- **Routing**: Menggunakan Vanilla Routing (API bawaan browser) melalui penangkapan event `popstate` dan `window.location.pathname` yang dikelola secara global di `App.tsx`. Tidak menggunakan library eksternal seperti React Router.
- **State Management**: Menggunakan *Custom Hooks* (`useAuth.ts`, `useLanding.ts`, dll) serta pola *Prop Drilling* untuk komponen hierarki pendek. Tidak menggunakan *global state manager* seperti Redux atau Zustand.
- **Theming**: Dark Mode/Light Mode di-manage di tingkat global root (`App.tsx`) menggunakan deteksi `localStorage` dan preferensi sistem browser.

## Backend API List

*Catatan: Seluruh API Auth berjalan di bawah `/api/auth` dan User di bawah `/api/users`. Detail validasi input dilakukan via Zod schema, dan respons error dikelola secara global. Dokumentasi ini hanya memuat skenario Success.*

### Auth Module (`/api/auth`)
1. **`POST /register`**
   - **Input**: `username`, `password`
   - **Response**: Returns `accessToken`. Sets `refreshToken` Cookie.
2. **`POST /login`**
   - **Input**: `identifier` (username/email), `password`
   - **Response**: Returns `accessToken`. Sets `refreshToken` Cookie.
3. **`POST /logout`**
   - **Input**: Requires `refreshToken` Cookie.
   - **Response**: Clears `refreshToken` Cookie.
4. **`POST /refresh`**
   - **Input**: Requires `refreshToken` Cookie.
   - **Response**: Returns `accessToken`.
5. **`POST /verify-email/:token`**
   - **Input**: `token` (URL Param)
6. **`POST /forgot-password`**
   - **Aksi**: Mengirimkan email berisi tautan *reset password*.
   - **Input**: `email`
7. **`POST /reset-password/:token`**
   - **Input**: `token` (URL Param), `password` (Body)

### User Profile Module (`/api/users`)
*Catatan: Seluruh endpoint ini mensyaratkan `accessToken` Header (Bearer).*

1. **`GET /me`**
   - **Response**: Returns Profile Object (`id`, `username`, `email`, dll)
2. **`PATCH /me/username`**
   - **Input**: `username`
3. **`PATCH /me/email`**
   - **Aksi**: Mengajukan ganti email dan otomatis mengirim email verifikasi ke alamat baru.
   - **Input**: `email`
4. **`PATCH /me/password`**
   - **Aksi**: Mengubah *password* setelah memvalidasi *password* lama.
   - **Input**: `oldPassword`, `newPassword`
5. **`DELETE /me`**
   - **Aksi**: Menghapus akun secara permanen beserta data relasinya.
   - **Input**: `username` (sebagai konfirmasi)

## Frontend Component Breakdown

*Komponen dipetakan berdasarkan Feature Domains, lengkap dengan fungsionalitas dan aliran datanya.*

### 1. Landing & Public (`LandingPage.tsx`, `Navbar.tsx`)
- **Features**: Toggle Light/Dark mode, memicu Auth Modal, dan menampilkan Hero Section.
- **Data Displayed**: Nama *Project*, status *loading* ketika memeriksa autentikasi.

### 2. Authentication (`AuthModal.tsx`)
- **Features**: Autentikasi user, pendaftaran akun baru, pengiriman email *reset password*, dan navigasi antar form (switch form).
- **Data Displayed**: Pesan sukses/error (feedback) setelah *submit*.
- **Data Inputs**:
  - **Login**: `Identifier` (username/email), `Password`.
  - **Register**: `Identifier/Username`, `Password`, `Confirm Password`.
  - **Forgot Password**: `Email`.

### 3. Dashboard (`Dashboard.tsx`)
- **Features**: Melihat detail profil, memperbarui alamat email, dan Logout.
- **Data Displayed**: `Username`, `Email` (atau 'Not Set' jika belum ada).
- **Data Inputs**:
  - **Update Email**: `newEmail`.

### 4. Verification & Reset Flow (`VerifyEmail.tsx`, `ResetPassword.tsx`)
*Halaman khusus yang diakses via tautan yang dikirim ke email.*
- **Features**:
  - `VerifyEmail`: Otomatis memvalidasi token URL untuk verifikasi email.
  - `ResetPassword`: Mengizinkan user untuk memasukkan password baru jika token di URL valid.
- **Data Displayed**: Indikator *Loading* (Spinner), indikator Sukses/Error (Validasi token gagal/kedaluwarsa).
- **Data Inputs**:
  - **Verify Email**: Tidak ada input manual (Token dari URL).
  - **Reset Password**: `Password`, `Confirm Password`.

## API Message Mapping Implementation
Frontend menggunakan `apiMessages.ts` untuk memetakan respons dari backend (yang sebagian besar berupa *HTTP Status Code* tanpa *body*) menjadi pesan *feedback* yang dibaca oleh pengguna.

### 1. Common Error Handler (`handleCommonMessages`)
Menangani *status code* global yang berlaku untuk semua *request*:
- `0`: Connection failed (Masalah jaringan).
- `>= 500`: Internal server error.
- `429`: Too many requests (Terkena *Rate Limit*).
- `403`: Forbidden.
- `400`: Invalid data/Bad Request (Akan mengekstrak JSON dari *body* untuk mendapatkan detail pesan error, jika gagal menggunakan pesan default).

### 2. Endpoint-Specific Mapping
Pesan khusus yang menangani kode respons dari tiap modul:
- **Auth Flow**:
  - `login`: `200` (Success), `401`/`404` (Incorrect credentials).
  - `register`: `200`/`201` (Success), `409` (Username is already taken).
  - `forgotPassword`: `200` (Link sent), `404` (Email address not found).
  - `resetPassword`: `200` (Success), `401`/`404` (Link invalid/expired).
  - `verifyEmail`: `200` (Success), `400`/`404` (Link invalid/expired).
- **User Flow**:
  - `getMe`: `200` (Welcome message), `401`/`404` (Profile not found / session expired).
  - `updateEmail`: `200` (Link sent), `409` (Email is already registered).
  - `deleteMe`: `200`/`204` (Success), `400` (Invalid username confirmation).

## DevOps & Deployment Architecture

- **Containerization**: Monolitik via *multi-stage* `Dockerfile`. Stage 1 (Node 20) men-*compile* UI Vite, Stage 2 (Node 22) menyalin hasil *build* UI ke folder `public/` Backend Express agar dapat dilayani bersamaan di satu *port*.
- **Orchestration (`docker-compose.yml`)**: Membaca `.env` untuk menjalankan kontainer aplikasi (dan Caddy opsional). Mengasumsikan PostgreSQL & Redis berjalan langsung di mesin *host* via *binding* `host.docker.internal:host-gateway`.
- **Database Migration**: Berjalan terpisah secara *one-off* untuk mencegah konflik, dieksekusi via *compose profile*:
  `docker compose -f docker-compose.dev.yml --profile migrate up` (membaca konfigurasi `.env.migrate`).

