# API Documentation - Njara Platform

Dokumentasi API Njara Platform tersedia dalam bentuk **Bruno API Collection**. Dokumen ini menjelaskan cara menggunakan koleksi tersebut, aturan hak akses (RBAC), aturan bisnis (B2B Club), dan daftar lengkap endpoint yang tersedia di sistem.

---

## 1. Cara Import ke Bruno API Client

1. Download dan Install [Bruno](https://www.usebruno.com/).
2. Buka aplikasi Bruno.
3. Klik tombol **Open Collection**.
4. Arahkan ke folder `docs/bruno-collection` di dalam repository ini.
5. Koleksi **Njara Platform API** akan otomatis ter-load.

---

## 2. Environment Variables

Koleksi ini menggunakan Environment `Local`. Pastikan memilih Environment `Local` di pojok kanan atas Bruno sebelum mengirim request.

- `baseUrl`: Base URL dari API (default: `http://localhost:3000`)
- `token`: JWT Token. Setelah memanggil API `Login` atau `Register`, copy field `token` dari response ke variabel `token` di environment (klik ikon gear/mata di pojok kanan atas -> Variables).

---

## 3. Kategori User (Roles) & Hak Akses (Permissions)

Njara Platform menggunakan sistem Role-Based Access Control (RBAC) berdasarkan kolom `category` pada entitas User. Berikut adalah kategori user yang tersedia beserta fungsinya:

| Kategori (Role) | Keterangan |
| :--- | :--- |
| **Owner** | Pemilik klub. Memiliki hak penuh untuk mengelola klub, membeli subscription, mengelola talent, trial, serta mengambil keputusan rekrutmen. |
| **Manager** | Pengelola klub. Memiliki hak hampir setara dengan Owner, kecuali untuk pembuatan klub baru dan pembelian subscription. |
| **Coach** | Pelatih klub. Bertanggung jawab atas pengelolaan tim, melakukan penilaian (assessment) pada peserta trial, dan melihat analitik. |
| **Staff** | Staf pendukung klub. Membantu administrasi trial, mencatat kehadiran, dan dapat membantu melakukan penilaian awal (assessment). |
| **Player** | Pemain / Talent. Dapat melamar ke trial yang dibuka oleh klub dan memperkaya portofolio profil pribadinya. |
| **BA (Brand Ambassador)** | Perwakilan brand klub dengan hak akses terbatas di dalam sistem klub. |

### Pemetaan Permission Default (Seeded)

Beberapa endpoint memeriksa permission spesifik yang disimpan dalam database melalui tabel `role_permissions`. Berikut adalah konfigurasi default hasil seeding:

- **Player**:
  - `edit_portfolio`
  - `view_stats`
- **Coach**:
  - `manage_teams`
  - `view_analytics`
- **Manager**:
  - `manage_club`
  - `manage_teams`
  - `view_analytics`
  - `view_transfer_market`
  - `manage_talents`
- **Owner**:
  - `manage_club`
  - `manage_teams`
  - `view_analytics`
  - `view_transfer_market`
  - `manage_talents`

---

## 4. Aturan Bisnis & Mekanisme Otorisasi

### A. Autentikasi JWT
Mayoritas endpoint memerlukan Header `Authorization: Bearer <token>`. Token didapatkan setelah sukses melakukan Login atau Register. Token yang telah di-logout akan otomatis diblokir melalui sistem caching Redis.

### B. Proteksi Akses B2B (Active B2B Club Check)
Untuk endpoint yang berlabel **B2B Only**, sistem memberlakukan middleware `RequireActiveB2BClub`. 
- Sistem akan memeriksa apakah klub tempat user bernaung memiliki subscription dengan status `full` atau `trial` yang masih aktif.
- Jika masa berlaku subscription telah lewat (`ExpiredDate < Time.Now`), status klub akan otomatis diubah menjadi `expired` di database, dan request akan ditolak dengan error `403 Forbidden`.
- **Pengecualian**: Endpoint untuk melihat paket subscription (`/api/subscriptions/plans`), membuat subscription baru, melakukan pembayaran, dan menerima webhook callback tetap dapat diakses oleh klub berstatus `expired` agar mereka dapat melakukan perpanjangan layanan (renewal).

### C. Akses Global (API Key)
Beberapa endpoint berlabel **Global** tidak memerlukan autentikasi JWT, melainkan memerlukan header `X-API-Key: <global_api_key>` untuk integrasi antar-layanan atau sistem eksternal.

---

## 5. Struktur & Daftar Lengkap Endpoint

### A. Autentikasi & Akun Publik
Tidak memerlukan status B2B aktif.

- `POST /api/register` : Mendaftarkan user baru (Player, Coach, Manager, Owner, Staff, BA).
- `POST /api/login` : Login menggunakan email & password. Mengembalikan JWT token dan data user.
- `POST /api/logout` (Auth) : Melakukan logout dan memblokir token akses/refresh token yang digunakan.
- `POST /api/refresh-token` : Memperbarui access token yang kedaluwarsa menggunakan refresh token.
- `GET /api/profile` (Auth) : Mendapatkan informasi profil user yang sedang login beserta pencapaian, statistik, dan highlight sosial media.
- `GET /api/games` : Mendapatkan daftar game esports yang didukung oleh platform.

---

### B. Enrichment Profil Player (Auth)
Digunakan oleh Player untuk melengkapi portofolio mereka. Tidak memerlukan status B2B aktif.

- **Statistik Player**:
  - `POST /api/profile/stats` : Menambahkan statistik permainan baru.
  - `PUT /api/profile/stats/:id` : Mengubah data statistik permainan.
  - `DELETE /api/profile/stats/:id` : Menghapus data statistik permainan.
- **Media Sosial**:
  - `POST /api/profile/social-media` : Menambahkan link sosial media.
  - `PUT /api/profile/social-media/:id` : Mengubah data link sosial media.
  - `DELETE /api/profile/social-media/:id` : Menghapus link sosial media.
- **Pencapaian (Achievements)**:
  - `POST /api/profile/achievements` : Menambahkan prestasi/piala yang pernah diraih.
  - `PUT /api/profile/achievements/:id` : Mengubah data prestasi.
  - `DELETE /api/profile/achievements/:id` : Menghapus data prestasi.
- **Highlight Video**:
  - `POST /api/profile/highlights` : Menambahkan link video gameplay / highlight.
  - `PUT /api/profile/highlights/:id` : Mengubah data highlight.
  - `DELETE /api/profile/highlights/:id` : Menghapus data highlight.

---

### C. Manajemen Klub
- `POST /api/clubs` (Auth) : Membuat klub baru (Hanya untuk kategori `owner`).
- `PUT /api/clubs/:id` (Auth, B2B Only) : Memperbarui informasi profil klub.

---

### D. Layanan Subscription & Pembayaran (B2B)
*Catatan: Beberapa endpoint sengaja dilepas dari proteksi B2B aktif agar klub berstatus expired bisa memperbarui paket.*

- `GET /api/subscriptions/plans` : Mendapatkan daftar paket subscription yang tersedia (Monthly, Quarterly, Yearly).
- `POST /api/subscriptions` (Auth) : Membuat transaksi subscription baru (Hanya untuk kategori `owner`).
- `POST /api/subscriptions/:id/pay` (Auth) : Memulai proses pembayaran subscription via Midtrans payment gateway (Hanya untuk kategori `owner`).
- `GET /api/subscriptions/my-club` (Auth) : Melihat riwayat dan status subscription klub saat ini.
- `POST /api/subscriptions/callback` / `POST /api/callback` : Endpoint webhook untuk menerima notifikasi status pembayaran dari Midtrans.

---

### E. Manajemen Talent & Anggota Klub (Auth, B2B Only, Category: Owner/Manager)
- **Daftar Anggota Klub**:
  - `GET /api/players` : Mendapatkan daftar player di dalam klub.
  - `GET /api/coaches` : Mendapatkan daftar coach di dalam klub.
  - `GET /api/owners` : Mendapatkan daftar owner di dalam klub.
  - `GET /api/staff` : Mendapatkan daftar staff di dalam klub.
  - `GET /api/ba` : Mendapatkan daftar Brand Ambassador di dalam klub.
- **Modul Talent**:
  - `GET /api/talents` : Mendapatkan daftar seluruh talent terdaftar.
  - `POST /api/talents` : Mendaftarkan talent baru ke dalam klub (Memerlukan permission `manage_talents`).
  - `PUT /api/talents/:id/market-value` : Mengubah estimasi harga pasar (market value) talent.
  - `PUT /api/talents/:id/biodata` : Mengubah biodata dasar talent (Full Name, Username, Email, Category, Bio).
  - `PUT /api/talents/:id/contract-salary` : Memperbarui durasi kontrak dan gaji talent.
- **Modul Tim (Teams)** (Memerlukan permission `manage_teams`):
  - `GET /api/teams` : Mendapatkan daftar tim di dalam klub.
  - `POST /api/teams` : Membuat tim baru.
  - `GET /api/teams/:id` : Melihat detail tim.
  - `PUT /api/teams/:id` : Memperbarui data tim.
  - `DELETE /api/teams/:id` : Menghapus tim.

---

### F. Transfer Market (Auth, B2B Only, Category: Owner/Manager)
- `GET /api/transfer-market` : Mendapatkan daftar player berstatus Free Agent (Memerlukan permission `view_transfer_market`).
- `PUT /api/transfer-market/:id/status` : Menyetujui atau menolak akuisisi player dari transfer market ke klub.

---

### G. Modul Trial Management (B2B Only)
Modul untuk mengelola seleksi terbuka (Open Trial) bagi calon pemain baru.

#### 1. Trial (Low-Level Config)
- `POST /api/trials` (Auth, Category: Owner/Manager/Staff) : Membuat event open trial baru.
- `GET /api/trials` (Auth) : Melihat semua event open trial.
- `GET /api/trials/:id` (Auth) : Melihat detail informasi event open trial tertentu.
- `PUT /api/trials/:id` (Auth, Category: Owner/Manager/Staff) : Memperbarui konfigurasi event open trial.

#### 2. Lamaran Trial (Trial Application)
- `GET /api/my-applications` (Auth, Category: Player) : Melihat riwayat lamaran trial saya.
- `POST /api/trials/:trial_id/apply` (Auth, Category: Player) : Mengirim lamaran untuk mengikuti event trial tertentu.
- `GET /api/trials/:trial_id/applications` (Auth, Category: Owner/Manager/Staff) : Melihat daftar pelamar di event trial klub.
- `PATCH /api/trial-applications/:id/shortlist` (Auth, Category: Owner/Manager/Staff) : Menerima lamaran dan memasukkan pelamar ke dalam shortlist peserta.
- `PATCH /api/trial-applications/:id/reject` (Auth, Category: Owner/Manager/Staff) : Menolak lamaran pelamar trial.

#### 3. Peserta Trial (Trial Participant)
- `GET /api/trials/:trial_id/participants` (Auth, Category: Owner/Manager/Staff/Coach) : Mendapatkan daftar peserta yang lolos shortlist.
- `PATCH /api/trial-participants/:id/attendance` (Auth, Category: Owner/Manager/Staff) : Mencatat kehadiran peserta pada sesi trial.
- `PATCH /api/trial-participants/:id/stage` (Auth, Category: Owner/Manager/Staff) : Mengubah tahap penyaringan peserta (misal: Tahap 1, Tahap Akhir).

#### 4. Penilaian & Skor (Assessment)
- `POST /api/assessments` (Auth, Category: Coach/Staff) : Membuat form penilaian baru untuk peserta trial.
- `GET /api/participants/:participant_id/assessments` (Auth, Category: Owner/Manager/Staff/Coach) : Melihat seluruh penilaian yang telah diberikan kepada peserta tertentu.
- `POST /api/assessments/:assessment_id/scores` (Auth, Category: Coach/Staff) : Memasukkan nilai berdasarkan kriteria (Mechanical Skill, Macro & Game Sense, Communication, Adaptability, Attitude).
- `GET /api/assessments/:assessment_id/scores` (Auth, Category: Owner/Manager/Staff/Coach) : Mengambil detail skor penilaian dari suatu form assessment.

#### 5. Keputusan Rekrutmen (Recruitment Decision)
- `POST /api/recruitment-decisions` (Auth, Category: Owner/Manager) : Menetapkan keputusan akhir apakah peserta trial direkrut (Accepted) atau dieliminasi (Rejected).
- `GET /api/trials/:trial_id/recruitment-decisions` (Auth, Category: Owner/Manager) : Melihat daftar keputusan rekrutmen dari suatu event trial.

---

### H. Endpoint Global (Public & X-API-Key Required)
Digunakan oleh pihak eksternal atau integrasi landing page. Tidak memerlukan token JWT.

- `GET /api/global/clubs` : Mengambil daftar seluruh klub di platform.
- `GET /api/global/trials` : Mengambil daftar seluruh event trial yang aktif.
- `GET /api/global/transfer-market` : Mengambil daftar player yang sedang berada di transfer market.

---

### I. RBAC Verification / Test Endpoints (Auth)
Digunakan untuk memvalidasi pemetaan role permission secara dinamis.

- `GET /api/test/player` : Hanya dapat diakses oleh user yang memiliki permission `edit_portfolio` (Kategori Player).
- `GET /api/test/coach` : Hanya dapat diakses oleh user yang memiliki permission `manage_teams` (Kategori Coach, Manager, Owner).
- `GET /api/test/manager` : Hanya dapat diakses oleh user yang memiliki permission `manage_club` (Kategori Manager, Owner).

