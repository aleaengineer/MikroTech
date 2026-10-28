# MikroTech

MikroTech adalah webapp edukasi yang membahas MikroTik melalui artikel dan panduan konfigurasi. Dokumen ini menjadi acuan fitur, teknologi, dan alur pengembangan aplikasi.

## Tujuan

- Menyajikan materi MikroTik yang terstruktur dan mudah dipahami, dari pemula hingga pengguna berpengalaman.
- Memudahkan pengunjung menemukan panduan berdasarkan topik atau pencarian.
- Memungkinkan admin mengelola dan menerbitkan konten melalui panel admin.

## Teknologi

- **Node.js** sebagai runtime aplikasi.
- **Express** untuk server dan routing.
- **EJS** untuk merender halaman dari template server-side.
- **MySQL** sebagai basis data, dapat dijalankan melalui XAMPP untuk pengembangan lokal.
- **CSS khusus** dengan tema Modern Network Lab untuk membangun tampilan responsif.
- **Express Session + MySQL session store** untuk sesi admin.
- **Helmet, pembatasan percobaan login, dan token CSRF** untuk perlindungan dasar aplikasi.

Node.js dijalankan sebagai proses terpisah dari Apache XAMPP. MySQL XAMPP digunakan sebagai layanan basis data.

## Tema dan arah desain

Tema visual: **Modern Network Lab** — profesional seperti dokumentasi teknis, tetapi ramah bagi pemula.

- Gunakan palet yang mengikuti `logo.jpg`: navy gelap sebagai warna utama, cyan sebagai aksen utama, oranye sebagai aksen sekunder, serta latar putih atau abu-abu muda untuk keterbacaan. Tampilkan logo pada header, footer, login admin, halaman Tentang, dan ikon tab browser.
- Buat navigasi sederhana dan konsisten.
- Utamakan tipografi dan jarak baca yang nyaman pada halaman artikel.
- Tampilkan konfigurasi MikroTik dalam blok kode yang mudah dibedakan.
- Gunakan ikon atau ilustrasi jaringan seperlunya agar halaman tidak terasa ramai.
- Pastikan semua halaman nyaman digunakan di ponsel dan desktop.

## Cakupan fitur

### MVP — fitur versi pertama

#### Situs publik

- **Beranda** dengan pengantar MikroTech, pencarian, kategori populer, dan artikel terbaru.
- **Daftar artikel** dengan pencarian dan filter kategori.
- **Halaman artikel** dengan judul, ringkasan, isi, gambar pendukung, dan blok konfigurasi.
- **Halaman kategori** untuk menelusuri artikel berdasarkan topik.
- **FAQ** untuk menjawab pertanyaan umum tentang panduan dan penggunaan MikroTech.
- **Kontak** agar pembaca dapat mengirim pertanyaan, koreksi, atau saran.
- **Halaman Tentang** yang menjelaskan tujuan dan cakupan MikroTech.
- **Tampilan responsif** untuk ponsel, tablet, dan desktop.
- **SEO dasar**, termasuk judul dan deskripsi halaman serta URL artikel yang mudah dibaca.

#### Panel admin

- Login admin untuk melindungi pengelolaan konten.
- Halaman profil admin untuk mengganti username dan kata sandi dengan verifikasi kata sandi saat ini.
- Halaman pengaturan situs untuk mengubah nama situs, tagline, dan deskripsi SEO.
- Pratinjau artikel dari editor sebelum perubahan disimpan atau diterbitkan.
- Kotak masuk admin untuk membaca dan mengelola pesan dari formulir Kontak.
- Tambah, ubah, dan hapus artikel.
- Simpan artikel sebagai draf atau publikasikan.
- Tambah dan ubah kategori.
- Isi artikel meliputi judul, slug, ringkasan, isi, gambar, kategori, dan status publikasi.
- Validasi data sebelum artikel disimpan atau diterbitkan.

Isi artikel mendukung Markdown untuk judul (`##`/`###`), teks tebal (`**teks**`), daftar, garis pemisah (`---`), tautan, dan blok kode (termasuk blok `routeros`). Markdown yang ditempel sebagai satu baris juga dinormalisasi agar penanda subjudul, garis pemisah, dan daftar umum dapat dirender. HTML mentah tidak diaktifkan pada parser. URL gambar HTTP/HTTPS dapat ditambahkan sebagai gambar pendukung.

### Pengembangan setelah MVP

Fitur berikut bukan syarat peluncuran versi pertama dan dapat diprioritaskan berdasarkan kebutuhan:

- Bookmark artikel.
- Komentar atau tanya jawab.
- Umpan balik “Apakah panduan ini membantu?”
- Artikel terkait dan navigasi ke panduan berikutnya.
- Label tingkat kesulitan dan estimasi waktu baca.
- Statistik artikel untuk admin.
- Sitemap dan penyempurnaan SEO.
- Mode gelap dan notifikasi artikel baru.

## Kategori konten awal

- Dasar MikroTik dan RouterOS
- Konfigurasi jaringan dan routing
- Firewall, NAT, dan keamanan
- Hotspot, DHCP, dan Wi-Fi
- Troubleshooting

Kategori dapat dikelola admin; daftar ini menjadi titik awal untuk menyiapkan konten.

## Alur pengembangan

### Tahap 1 — Fondasi proyek

- Inisialisasi proyek Node.js dan Express.
- Siapkan konfigurasi aplikasi dan variabel lingkungan.
- Tentukan struktur folder untuk routes, views, public assets, dan akses basis data.
- Buat layout EJS dasar, navigasi, dan gaya visual Modern Network Lab.

**Hasil yang diharapkan:** aplikasi dapat dijalankan secara lokal dan menampilkan halaman dasar.

### Tahap 2 — Situs publik

- Buat beranda dengan artikel terbaru dan kategori populer.
- Buat daftar artikel, filter kategori, dan pencarian.
- Buat halaman detail artikel dan halaman kategori.
- Buat halaman Tentang serta tata letak responsif.
- Tambahkan halaman FAQ dan formulir Kontak.

**Hasil yang diharapkan:** pengunjung dapat menjelajahi halaman dan contoh konten dengan alur yang konsisten.

### Tahap 3 — Basis data dan konten

- Siapkan basis data MySQL dan konfigurasi koneksi.
- Rancang tabel untuk admin, kategori, dan artikel.
- Hubungkan daftar dan detail artikel dengan data basis data.
- Pastikan hanya artikel terbit yang muncul di situs publik.

**Hasil yang diharapkan:** konten situs berasal dari MySQL, bukan data statis di template.

### Tahap 4 — Panel admin

- Buat login dan logout admin.
- Lindungi route pengelolaan agar hanya dapat diakses setelah login.
- Tambahkan halaman Profil untuk mengubah username dan kata sandi dengan verifikasi kata sandi saat ini.
- Tambahkan halaman Pengaturan Situs untuk nama situs, tagline footer, dan deskripsi SEO.
- Buat pratinjau artikel dari isi formulir sebelum disimpan.
- Buat kotak masuk untuk pesan Kontak, termasuk tindakan tandai dibaca dan hapus.
- Buat formulir untuk menambah dan mengubah artikel serta kategori.
- Dukung status draf dan terbit, serta penghapusan dengan konfirmasi.
- Validasi input dan tampilkan pesan keberhasilan atau kesalahan dengan jelas.

**Hasil yang diharapkan:** admin dapat mengelola alur publikasi konten dari panel.

### Tahap 5 — Penyempurnaan

- Tambahkan pencarian dan filter yang bekerja terhadap data sebenarnya.
- Periksa tampilan di ukuran layar ponsel dan desktop.
- Lengkapi metadata halaman dan URL artikel.
- Periksa validasi formulir, navigasi, halaman kosong, dan pesan kesalahan.

**Hasil yang diharapkan:** pengalaman penggunaan konsisten dan siap diuji sebelum peluncuran.

### Tahap 6 — Pengujian dan peluncuran

- Uji halaman publik, pencarian, filter, login, dan pengelolaan artikel.
- Pastikan artikel draf tidak terlihat oleh pengunjung.
- Uji input tidak valid dan akses ke route admin tanpa login.
- Dokumentasikan cara menyiapkan basis data dan menjalankan aplikasi.
- Siapkan konfigurasi deployment sebelum aplikasi dipublikasikan.

**Hasil yang diharapkan:** alur utama berfungsi dan panduan menjalankan aplikasi tersedia.

## Model data awal

Rancangan berikut adalah panduan awal; detail kolom dapat disesuaikan ketika skema basis data dibuat.

- **admins** — akun admin dan informasi autentikasi.
- **app_settings** — nama situs, tagline, dan deskripsi SEO.
- **contact_messages** — pesan, alamat email pengirim, status dibaca, dan waktu diterima.
- **categories** — nama dan slug kategori.
- **articles** — judul, slug, ringkasan, isi, gambar, status publikasi, waktu pembuatan/perubahan, serta relasi kategori.

Slug artikel digunakan sebagai URL yang mudah dibaca dan harus unik.

## Kriteria MVP selesai

- Pengunjung dapat membuka beranda, daftar artikel, kategori, dan halaman artikel.
- Pencarian dan filter kategori dapat digunakan.
- Artikel draf tidak muncul di situs publik; artikel terbit dapat dibuka melalui URL yang sesuai.
- Admin dapat login, mengelola artikel dan kategori, serta menyimpan draf atau menerbitkan artikel.
- Admin dapat mengubah username, kata sandi, dan pengaturan dasar situs.
- Admin dapat melihat pratinjau artikel dan mengelola pesan dari pengunjung.
- Pengunjung dapat membaca FAQ dan mengirim pesan melalui halaman Kontak.
- Halaman dan formulir utama berfungsi di desktop maupun ponsel.
- Kredensial dan konfigurasi lokal tidak ditanam langsung ke source code.

## Status implementasi

Fondasi MVP sudah mencakup halaman publik, pencarian dan filter artikel, halaman artikel/kategori/FAQ/Kontak/Tentang, panel admin, pengelolaan artikel dan kategori, pratinjau artikel, kotak masuk pesan, profil admin, pengaturan situs, skema MySQL, serta skrip pembuatan akun admin. Pesan kontak disimpan di database lokal dan dapat dibalas melalui aplikasi email admin; pengiriman email otomatis belum dikonfigurasi. Fitur lanjutan seperti komentar, bookmark, statistik pembaca, dan mode gelap belum termasuk dalam implementasi awal.

## Menjalankan aplikasi secara lokal

### Persiapan

- Node.js versi 20 atau lebih baru.
- MySQL yang berjalan melalui XAMPP atau instalasi MySQL lain.
- Terminal pada folder proyek.

### Instalasi pertama

1. Salin `.env.example` menjadi `.env`, lalu sesuaikan pengaturan koneksi MySQL.
2. Isi `SESSION_SECRET` dengan nilai acak minimal 32 karakter. Jangan gunakan nilai contoh pada deployment.
3. Jalankan MySQL di XAMPP.
4. Impor `db/schema.sql` melalui phpMyAdmin atau MySQL CLI. Skrip ini membuat database `mikrotech`, tabel awal, dan kategori bawaan.
5. Pasang dependensi:

   ```sh
   npm install
   ```

6. Buat akun admin dengan mengisi `ADMIN_USERNAME` dan `ADMIN_PASSWORD` pada lingkungan proses, lalu jalankan:

   ```sh
   npm run create-admin
   ```

   Username harus berisi 3–80 karakter dan kata sandi minimal 6 karakter. Kata sandi disimpan sebagai hash.

7. Jalankan aplikasi:

   ```sh
   npm run dev
   ```

8. Buka `http://localhost:3000`. Panel admin tersedia di `http://localhost:3000/admin/login`.

Untuk menjalankan tanpa mode watch, gunakan `npm start`. Pastikan `.env` tidak dimasukkan ke repositori.

### Variabel lingkungan

| Variabel | Kegunaan | Nilai bawaan |
|---|---|---|
| `NODE_ENV` | Mode aplikasi; gunakan `production` di deployment HTTPS | `development` |
| `PORT` | Port server Node.js | `3000` |
| `SESSION_SECRET` | Rahasia penandatanganan sesi, minimal 32 karakter | Wajib diisi |
| `DB_HOST` | Host MySQL | `127.0.0.1` |
| `DB_PORT` | Port MySQL | `3306` |
| `DB_NAME` | Nama database | `mikrotech` |
| `DB_USER` | Pengguna MySQL | `root` |
| `DB_PASSWORD` | Kata sandi pengguna MySQL | kosong |

`ADMIN_USERNAME` dan `ADMIN_PASSWORD` hanya dibutuhkan ketika membuat akun admin.

## Prinsip pengembangan

- Bangun fitur MVP terlebih dahulu sebelum menambah fitur lanjutan.
- Pisahkan tampilan, routing, dan akses basis data dengan struktur yang jelas.
- Validasi input dan berikan pesan kesalahan yang informatif.
- Lindungi halaman admin dan data autentikasi.
- Jangan menyimpan kata sandi dalam bentuk teks biasa atau mengunggah kredensial ke repositori.
- Uji alur publik dan admin setiap kali fitur terkait berubah.
