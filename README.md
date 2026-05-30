# 🗺️ Interactive Maps BFI Finance

**Blocation** (BFI Location) adalah sebuah aplikasi pemetaan interaktif berbasis web yang memvisualisasikan seluruh jaringan kantor BFI Finance di seluruh penjuru Indonesia. Mulai dari Kantor Cabang Konvensional, Unit Syariah, hingga POS (Point of Sales).

Didesain dengan antarmuka premium, ringan, dan modern, aplikasi ini memudahkan pengguna untuk menelusuri ratusan lokasi cabang BFI Finance secara interaktif dalam satu layar.

---

## ✨ Fitur Utama

- 📍 **Pemetaan Visual yang Kaya**: Memuat total **319 lokasi** (233 Kantor Cabang & 86 POS) dengan akurasi koordinat tinggi yang divisualisasikan dengan pin khusus (Konvensional = Biru, Syariah = Hijau, POS = Oranye).
- ⚡ **Performa Tinggi (O(1) Lookup)**: Dioptimalkan dengan pencarian instan menggunakan struktur data *Map*, serta *Event Delegation* agar browser tetap berjalan mulus dan ringan.
- 🔍 **Pencarian Cerdas**: Cari cabang dengan cepat berdasarkan nama, kota, atau alamat dengan fitur *auto-complete* instan.
- 🎯 **Radius Jangkauan Interaktif**: Klik pada salah satu cabang di peta untuk memunculkan radius jangkauan *60km* bersimbol putaran radar.
- 🗂️ **Penyaringan (Filter) Cepat**: Pisahkan tampilan cabang secara mudah berdasarkan jenis layanan (Konvensional, Syariah, POS BFI).
- 📋 **Tabel Daftar Cabang**: Lihat seluruh daftar cabang secara ringkas pada sebuah tabel pop-up interaktif yang juga mendukung penyaringan data secara reaktif.
- 📱 **Desain Responsif**: Antarmuka responsif penuh untuk *mobile*, *tablet*, maupun *desktop* berkat utilitas *Tailwind CSS*.

---

## 🛠️ Teknologi yang Digunakan

Aplikasi web ini dibangun dengan pendekatan murni (*vanilla*) tanpa langkah *build* (*No-Build/Bundler*) yang rumit, menjadikannya sangat mudah untuk langsung dijalankan.

- **Inti**: HTML5, CSS3, JavaScript (ES6)
- **Peta Interaktif**: [Leaflet.js](https://leafletjs.com/) & [OpenStreetMap](https://www.openstreetmap.org/)
- **Clustering**: Leaflet MarkerCluster
- **Antarmuka (UI)**: [Tailwind CSS](https://tailwindcss.com/) (CDN) & [React](https://reactjs.org/) (UMD untuk *Landing Page*)
- **Font**: Google Fonts (Inter)

---

## 🚀 Cara Menjalankan Secara Lokal

Karena aplikasi ini tidak memerlukan *Node.js build-step* untuk antarmuka (*frontend*), Anda bisa langsung menjalankannya dengan cepat:

### Opsi 1: Menggunakan Live Server (Direkomendasikan)
Jika Anda menggunakan editor seperti Visual Studio Code:
1. Pasang ekstensi **Live Server**.
2. Klik kanan pada berkas `index.html`.
3. Pilih **"Open with Live Server"**.

### Opsi 2: Menggunakan HTTP Server sederhana
Pastikan Python atau Node.js sudah terpasang.
```bash
# Jika menggunakan Node.js (via npx)
npx serve .

# Jika menggunakan Python 3
python -m http.server 3000
```
Lalu buka peramban Anda di `http://localhost:3000`.

*(Catatan: Jangan langsung mengklik dua kali `index.html` dari File Explorer tanpa server web lokal (protokol `file:///`), karena beberapa modul eksternal CDN mungkin memerlukan protokol `http/https` untuk merender React dan Leaflet dengan sempurna).*

---

## 📂 Struktur Direktori

```text
/Interactive Maps BFI Finance
│
├── index.html           # Struktur utama HTML, CDN impor, & komponen Landing Page React
├── style.css            # Kumpulan kelas kustom, palet warna, dan gaya dasar
├── app.js               # Logika peta Leaflet, integrasi, filter, dan fungsi pencarian
├── branches_data.js     # Berkas database statis berisi daftar 319 lokasi cabang (JSON)
└── README.md            # Dokumentasi ini
```

---

## 💻 Pengembang
Dibuat oleh **itsokkay** untuk BFI Finance.
Source peta dari bfi.co.id
#SelaluAdaJalan untuk hidup #JauhLebihTenang

(lokasi mungkin bisa berbeda dan berubah sesuai dengan kebijakan perusahaan)
