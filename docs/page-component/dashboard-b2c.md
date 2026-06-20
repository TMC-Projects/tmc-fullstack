# Dokumentasi Halaman Dasbor B2C

Dokumentasi untuk halaman Dashboard utama pengguna B2C (Player & Coach).

## 1. Informasi Halaman
- **File Path**: `frontend/src/app/app/dashboard/page.tsx`
- **URL Route**: `/app/dashboard`
- **Tujuan**: Sebagai halaman pendaratan (landing page) utama B2C yang menampilkan daftar Klub dan Trial Terbuka.
- **Proteksi**: Terhubung ke `useAuthStore` dari Zustand, dan menggunakan flag `_hasHydrated` untuk menangani proses refresh/reload tanpa *flicker* redirect ke halaman login.

## 2. API Integration
Halaman ini menggunakan 3 API secara paralel (menggunakan `Promise.all`):
1. `GET /api/global/clubs` : Mengambil seluruh klub aktif (menggunakan `NEXT_PUBLIC_GLOBAL_API_KEY`).
2. `GET /api/global/trials`: Mengambil seluruh trial terbuka (menggunakan `NEXT_PUBLIC_GLOBAL_API_KEY`).
3. `GET /api/my-applications`: Mengambil aplikasi trial pengguna saat ini (menggunakan Bearer Token).

## 3. Komponen

### A. ClubList
- **File**: `frontend/src/components/dashboard/ClubList.tsx`
- **Fitur**: 
  - Render daftar Klub ke dalam bentuk Card responsif.
  - Terdapat baris pencarian untuk mencari nama Klub.
  - Menampilkan jumlah anggota dan status klub.
  - Secara default tidak menampilkan klub "Free Agent".

### B. OpenTrialList
- **File**: `frontend/src/components/dashboard/OpenTrialList.tsx`
- **Fitur**:
  - Menampilkan trial dengan status "PUBLISHED".
  - Memiliki filter berdasarkan Game dan pencarian (Search).
  - Terdapat fungsi *Apply* (Mendaftar) yang akan memanggil `POST /api/trials/:id/apply`.
  - Terdapat validasi *client-side* untuk membatasi pendaftaran maksimal 10 klub (mengecek panjang `myApplications`).
  - Merubah status tombol menjadi "Applied" / "Terdaftar" jika ID trial sudah ada di array aplikasi.
