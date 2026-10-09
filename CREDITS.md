# Kredit & Lisensi

## Model 3D — `assets/room.glb`

- **Judul:** Throne room - Medieval Fantasy Challenge
- **Pembuat:** tuturu — https://sketchfab.com/tuturu
- **Sumber:** https://sketchfab.com/3d-models/throne-room-medieval-fantasy-challenge-6b9bd21610d4465d872bfcfe176e98e1
- **Lisensi:** Creative Commons Attribution 4.0 (CC BY 4.0) — http://creativecommons.org/licenses/by/4.0/
- **Perubahan:** tidak ada perubahan pada file GLB. Di dalam aplikasi, model hanya digeser
  posisinya dan diberi pencahayaan/bayangan, lalu ditambah meja catur buatan sendiri.

Informasi di atas diambil dari metadata `asset.extras` di dalam file `room.glb` itu sendiri.
CC BY 4.0 mewajibkan atribusi kepada pembuat. Atribusi singkat juga tampil di aplikasi
(tombol **?** → bagian bawah panel petunjuk). Jika presentasi dipublikasikan atau
dibagikan, pertahankan atribusi ini.

## Pustaka — Three.js r163 (`vendor/three/`)

- **Proyek:** https://threejs.org — https://github.com/mrdoob/three.js
- **Versi:** 0.163.0 (sama dengan versi CDN yang dipakai proyek awal)
- **Lisensi:** MIT — salinan lengkap di `vendor/three/LICENSE`
- **File yang disertakan (tanpa modifikasi):**
  - `build/three.module.min.js`
  - `examples/jsm/controls/OrbitControls.js`
  - `examples/jsm/loaders/GLTFLoader.js`
  - `examples/jsm/utils/BufferGeometryUtils.js` (dependensi GLTFLoader)

## Aset buatan proyek ini

- Meja catur, papan, dan bidak (`js/chess.js`) serta adegan cadangan bertema catur
  dibuat secara prosedural dengan kode — tidak memakai aset pihak ketiga.
- Ikon tab (favicon) memakai karakter Unicode ♚ dalam SVG inline.
- Font memakai font bawaan sistem (Segoe UI di Windows); tidak ada font yang diunduh.
