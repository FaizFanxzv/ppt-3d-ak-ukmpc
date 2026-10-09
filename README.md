# Presentasi 3D — Divisi AK UKMPC UNESA 2026

Presentasi interaktif 8 slide (Divisi AK · Atlet & Kepelatihan) dengan latar ruang aula 3D.
Kamera bergerak ke sudut yang berbeda di setiap slide. Aplikasi ini berupa web statis:
tidak butuh backend, database, API key, atau proses build.

**Berjalan sepenuhnya offline.** Three.js dan model 3D disimpan di dalam folder ini; tidak ada
CDN atau sumber daya internet yang dimuat.

---

## 1. Cara menjalankan di Windows (disarankan)

1. Klik kanan `PPT_3D_FINAL_READY_TO_RUN.zip` → **Extract All…** → **Extract**.
   (Jangan menjalankan file langsung dari dalam ZIP.)
2. Buka folder hasil ekstrak `ppt-3d-final`.
3. Klik ganda **`run.bat`**.
4. Browser terbuka otomatis di `http://127.0.0.1:8765/` (atau port berikutnya bila 8765 dipakai).
5. **Biarkan jendela hitam run.bat tetap terbuka** selama presentasi. Tutup jendela itu
   (atau tekan `Ctrl+C`) bila sudah selesai.

`run.bat` membutuhkan **Python 3.7+**. Jika Python belum terpasang, jendela akan menampilkan
pesan dan tetap terbuka sampai Anda menekan tombol. Pasang dari https://www.python.org/downloads/
dan **centang "Add python.exe to PATH"** saat instalasi, lalu jalankan `run.bat` lagi.

> Jika Windows SmartScreen menampilkan "Windows protected your PC", klik **More info → Run anyway**.
> Jika Windows Firewall bertanya, akses cukup diizinkan untuk jaringan **Private**; server hanya
> mendengarkan di `127.0.0.1` (komputer ini saja).

## 2. Menjalankan server lokal secara manual

Halaman **tidak bisa** dibuka dengan klik ganda `index.html` (alamat `file://`), karena browser
memblokir modul JavaScript dan file `.glb` dari `file://`. Jika itu terjadi, halaman akan
menampilkan pesan untuk memakai `run.bat`; slide tetap bisa dibaca tetapi tanpa ruang 3D.

Pilih salah satu cara berikut dari dalam folder `ppt-3d-final`:

| Cara | Perintah / langkah |
| --- | --- |
| Python (semua OS) | `python tools/serve.py` (Windows: `py -3 tools\serve.py`) lalu buka alamat yang tampil |
| macOS / Linux | `./run.sh` |
| Python bawaan | `python -m http.server 8765` lalu buka `http://localhost:8765/` * |
| VS Code | Pasang ekstensi **Live Server** → klik kanan `index.html` → **Open with Live Server** |
| Node.js | `npx http-server -p 8765` (butuh internet saat pertama kali mengunduh paket) |

\* `tools/serve.py` lebih disarankan daripada `python -m http.server`, karena di sebagian PC
Windows `http.server` mengirim file `.js` sebagai `text/plain` sehingga browser menolak modulnya.
`tools/serve.py` memperbaiki MIME type, mencari port kosong, dan membuka browser otomatis.

Opsi `tools/serve.py`: `--port 9000` (port awal lain), `--no-browser` (tidak membuka browser).

## 3. Kebutuhan

- Windows 10/11, macOS, atau Linux.
- Browser modern: Google Chrome / Microsoft Edge 89+ atau Firefox 108+ (perlu dukungan
  *import maps* dan WebGL). Disarankan Chrome/Edge versi terbaru dengan akselerasi hardware aktif.
- Python 3.7+ (hanya untuk server lokal).
- **Tidak perlu koneksi internet.**

## 4. Kontrol

| Aksi | Kontrol |
| --- | --- |
| Slide berikutnya / sebelumnya | Tombol **Berikutnya ›** / **‹ Sebelumnya**, `→` / `←`, `PgDn` / `PgUp` (cocok untuk *presenter clicker*), `Spasi` |
| Lompat ke slide | Klik titik indikator di bawah, `Home` (slide 1), `End` (slide 8) |
| Putar kamera | Drag kiri pada ruang 3D |
| Zoom | Scroll mouse / cubit dua jari |
| Geser kamera | Drag kanan / drag dua jari |
| Kembalikan kamera ke sudut slide | Tombol **⟲** atau `R` |
| Sembunyikan / tampilkan panel teks | Tombol **▣** atau `H` (untuk memperlihatkan ruang 3D penuh) |
| Petunjuk kontrol | Tombol **?** |
| Pindah slide di layar sentuh | Geser (swipe) **di atas panel slide**. Swipe di ruang 3D hanya memutar kamera. |
| Tautan langsung ke slide | Tambahkan `#nomor` di alamat, contoh `http://127.0.0.1:8765/#7` |

Drag kamera tidak pernah mengganti slide. Setelah animasi kamera selesai, kamera bebas
digerakkan; berpindah slide atau menekan `R` mengembalikannya ke sudut slide.
Kamera manual dibatasi agar tetap di dalam aula. Di slide penutup, ruangan berputar perlahan
(berhenti saat Anda menyentuh kamera, lanjut lagi setelah 4 detik). Jika sistem mengaktifkan
**Reduce motion**, kamera berpindah tanpa animasi dan tidak berputar otomatis.

## 5. Sudut kamera per slide

Model `room.glb` adalah aula singgasana bergaya abad pertengahan. Model ini **tidak memiliki
perapian atau lukisan**, sehingga kamera lama yang mengarah ke objek tersebut diganti dengan
objek yang benar-benar ada. Satu meja catur prosedural ditambahkan di depan singgasana agar
tema catur terlihat.

| Slide | Fokus kamera |
| --- | --- |
| 1. Divisi AK | Aula utama dari pintu masuk, karpet merah menuju singgasana |
| 2. Anggota Divisi | Meja perjamuan dengan para tamu |
| 3. Visi & Misi | Singgasana raja & ratu dengan panji di belakangnya |
| 4. Ranah Kognitif | Meja catur (strategi), singgasana sebagai latar |
| 5. Ranah Afektif | Para pengawal (sikap ksatria, sportivitas) |
| 6. Psikomotorik | Pemanah di balkon (keterampilan fisik) |
| 7. Program Kerja | Aula dengan deretan bangku (venue kompetisi) |
| 8. Thank You | Orbit perlahan di tengah aula |

Koordinat kamera ada di `js/views.js`. Untuk menyetel ulang: buka `http://127.0.0.1:8765/?debug`,
atur kamera dengan mouse, tekan `C` → baris `{ pos: [...], target: [...] }` disalin ke clipboard
(dan tampil di console browser, `F12`). Tempel ke array `views` di `js/views.js`.

## 6. Jika model 3D gagal dimuat

- Bila `assets/room.glb` hilang/rusak, aplikasi menampilkan **adegan catur cadangan**
  (papan catur besar) dengan 8 sudut kamera sendiri, plus banner berisi penyebabnya dan tombol
  **Coba lagi**.
- Bila pustaka 3D (`vendor/`) hilang, WebGL tidak tersedia, atau browser terlalu lama,
  muncul pesan yang menjelaskan masalahnya dan **slide tetap bisa dipresentasikan tanpa 3D**.
- Detail teknis untuk pengembang dicatat di console browser (`F12` → Console, awalan `[3D]`).

## 7. Mengatasi masalah umum

| Gejala | Solusi |
| --- | --- |
| Jendela run.bat langsung menulis "Python 3 tidak ditemukan" | Pasang Python 3 (centang *Add to PATH*), tutup & buka lagi run.bat |
| Muncul "Buka melalui run.bat, bukan klik ganda index.html" | Tutup tab, jalankan `run.bat` |
| Banner "Ruangan 3D utama gagal dimuat — menampilkan adegan catur cadangan" | Pastikan `assets/room.glb` ada (ekstrak ulang ZIP), pastikan jendela run.bat masih terbuka, klik **Coba lagi** |
| Banner "Ruang 3D tidak dapat dimuat" | Folder `vendor/` atau `js/` tidak lengkap → ekstrak ulang seluruh ZIP |
| Banner "WebGL tidak tersedia" | Aktifkan *Use hardware acceleration when available* di pengaturan Chrome/Edge, perbarui driver grafis, atau coba browser lain |
| Browser tidak terbuka otomatis | Salin alamat `http://127.0.0.1:...` dari jendela run.bat ke browser |
| Port 8765 dipakai aplikasi lain | Tidak perlu tindakan: server otomatis memakai port berikutnya (8766, 8767, …) |
| Tampilan patah-patah | Tutup tab/aplikasi berat lain, aktifkan akselerasi hardware, sambungkan charger laptop |
| Isi slide berubah tetapi tampilan lama | Tekan `Ctrl+F5` untuk memuat ulang tanpa cache |

## 8. Struktur folder

```
ppt-3d-final/
├── index.html            Halaman presentasi (isi 8 slide)
├── css/style.css         Tampilan
├── js/
│   ├── slides.js         Navigasi slide, keyboard, swipe, pesan status (tanpa dependensi)
│   ├── scene.js          Ruang 3D: pemuatan model, fallback, animasi kamera
│   ├── views.js          Koordinat kamera per slide (mudah diedit)
│   └── chess.js          Meja & bidak catur prosedural, adegan cadangan
├── assets/room.glb       Model aula 3D (CC BY 4.0, lihat CREDITS.md)
├── vendor/three/         Three.js r163 lokal + LICENSE (MIT)
├── tools/serve.py        Server lokal (dipakai run.bat / run.sh)
├── run.bat               Peluncur Windows
├── run.sh                Peluncur macOS/Linux
├── README.md
└── CREDITS.md            Atribusi & lisensi
```

## 9. Catatan konten

Isi slide dipertahankan sesuai proyek awal. Hal yang perlu dicek pemilik materi:

- **UCT (12 September 2026)** — tanggalnya sudah lewat, tetapi data proyek tidak memuat hasil
  pelaksanaannya. Slide 7 diberi label kecil *"Hasil pelaksanaan: perlu konfirmasi"*.
  Setelah hasil dipastikan, ubah teks UCT di `index.html` lalu hapus elemen
  `<span class="status-chip" …>` di bawahnya.
- **Evaluasi internal** di slide 4, 5, dan 7 (misalnya *"kelas Atlet minim kehadiran (hanya Ali
  aktif)"*) tetap ditampilkan seperti aslinya. Bila presentasi ditujukan untuk audiens umum,
  pertimbangkan menyebut pola tanpa nama perorangan (contoh: "kehadiran kelas Atlet masih rendah")
  dan menyimpan detail per orang untuk rapat internal.
- Slide 2 menyebut "7 anggota" — sesuai dengan 2 pengurus + 5 anggota aktif yang tercantum.

## 10. Lisensi & atribusi

- Model 3D: "Throne room - Medieval Fantasy Challenge" oleh **tuturu** (Sketchfab), **CC BY 4.0**.
- Three.js r163: **MIT** (`vendor/three/LICENSE`).
- Meja/bidak catur dan adegan cadangan: dibuat prosedural untuk proyek ini.

Detail lengkap ada di [CREDITS.md](CREDITS.md).
