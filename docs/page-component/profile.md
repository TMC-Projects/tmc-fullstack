# Dokumentasi Halaman Profil B2C (Player & Coach)

Dokumentasi ini menjelaskan arsitektur dan komponen pada halaman Profil B2C.

## 1. Halaman Utama
- **File Path**: `frontend/src/app/app/profile/page.tsx`
- **URL Route**: `/app/profile`
- **Tujuan**: Menampilkan profil lengkap user (Player/Coach) yang mencakup data pribadi, statistik game, media sosial, prestasi, dan highlight.
- **State Management**: Menggunakan `Zustand` untuk mengambil `token` yang tersimpan, lalu menembak endpoint backend `GET /api/profile`.
- **Lokalisasi**: Menggunakan `next-intl` untuk translasi label dan teks bahasa (Inggris dan Indonesia).
- **Animasi**: Menggunakan `framer-motion` untuk memberikan transisi halus (fade-in, slide-up) saat komponen-komponen di-render atau di-*scroll*.

## 2. Komponen Mandiri (Sub-Components)

Sesuai aturan arsitektur, halaman profil dibagi menjadi beberapa komponen spesifik yang disimpan dalam `frontend/src/components/profile/`:

### A. ProfileHeader
- **File**: `ProfileHeader.tsx`
- **Fungsi**: Menampilkan blok data utama pengguna (Avatar, Nama Lengkap, Username, Bio, Role/Kategori, dan ID Klub).
- **Desain**: Card dengan aksen *glassmorphism* dan gradien neon B2C (Violet/Cyan).

### B. StatList
- **File**: `StatList.tsx`
- **Fungsi**: Menampilkan daftar statistik in-game (misal: Win Rate, KDA) milik player.
- **Desain**: Grid card yang interaktif dengan micro-animation saat di-*hover*.

### C. HighlightList
- **File**: `HighlightList.tsx`
- **Fungsi**: Menampilkan highlight/sorotan video permainan (misal dari YouTube). Jika URL adalah link YouTube biasa, komponen akan secara otomatis merendernya dalam `iframe`. Jika berupa tautan platform lain, pengguna akan dialihkan melalui external link.

### D. AchievementList
- **File**: `AchievementList.tsx`
- **Fungsi**: Menampilkan pencapaian/prestasi pengguna dalam format menyerupai *timeline* (dengan garis vertikal di sisi kiri).

### E. SocialMediaList
- **File**: `SocialMediaList.tsx`
- **Fungsi**: Menampilkan daftar tautan ke profil media sosial pengguna, yang secara otomatis memunculkan icon sesuai platform (Instagram, Twitter, LinkedIn, YouTube).
