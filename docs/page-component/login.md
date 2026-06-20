# Dokumentasi Halaman Login (B2C & B2B)

Dokumentasi ini menjelaskan implementasi teknis halaman login B2C dan B2B pada aplikasi Next.js frontend Njara Platform.

---

## 1. Login B2C (Player & Coach)

- **File Path**: `frontend/src/app/app/login/page.tsx`
- **URL Route**: `/app/login`
- **Tujuan**: Mengautentikasi pengguna kategori umum/B2C, yaitu **Player** dan **Coach**.
- **Desain**: Nuansa premium eSports dengan perpaduan warna gelap (cyber-gaming) dan gradien warna violet/cyan, serta didukung logo *Gamepad*.
- **Aturan Validasi**:
  - Jika pengguna terdaftar sebagai akun B2B (`owner`, `manager`, `staff`, `ba`), login akan ditolak di halaman ini dengan pesan: 
    > *"Akun Anda terdaftar sebagai mitra B2B (Owner/Manager/Staff/BA). Silakan gunakan portal B2B untuk masuk."*
  - Menyimpan token JWT dan profil user ke Zustand Auth Store pada saat login berhasil.
  - Mengarahkan user ke `/app/dashboard` setelah login berhasil.

---

## 2. Login B2B (Owner, Manager, Staff, BA)

- **File Path**: `frontend/src/app/portal/login/page.tsx`
- **URL Route**: `/portal/login`
- **Tujuan**: Mengautentikasi pengguna kategori klub/B2B, yaitu **Owner**, **Manager**, **Staff**, dan **BA (Brand Ambassador)**.
- **Desain**: Nuansa premium korporasi/manajemen klub dengan gradien warna emerald/teal, serta didukung logo *Building*.
- **Aturan Validasi**:
  - Jika pengguna terdaftar sebagai akun B2C (`player`, `coach`), login akan ditolak di halaman ini dengan pesan:
    > *"Akun Anda terdaftar sebagai B2C (Player/Coach). Silakan gunakan portal Player untuk masuk."*
  - Menyimpan token JWT dan profil user ke Zustand Auth Store pada saat login berhasil.
  - Mengarahkan user ke `/portal/dashboard` setelah login berhasil.

---

## 3. State Management & Integrasi API

### Zustand Auth Store (`frontend/src/store/auth.ts`)
Digunakan untuk mempertahankan status autentikasi secara global di sisi client:
- **`token`**: JWT Token untuk otorisasi API request.
- **`refreshToken`**: Token untuk memperbarui access token yang kedaluwarsa.
- **`user`**: Objek data profil user yang aktif.
- **Persistensi**: Menggunakan middleware `persist` bawaan Zustand agar data tetap tersimpan di `localStorage` saat halaman di-refresh.
