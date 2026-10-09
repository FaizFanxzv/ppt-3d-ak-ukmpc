/* =========================================================
   Konfigurasi kamera per slide
   ---------------------------------------------------------
   Koordinat dalam meter, setelah model digeser dengan ROOM.offset
   (tengah aula ≈ x 0, lantai y ≈ 0.15, singgasana di z ≈ -12,
   pintu masuk di z ≈ +17). Sumbu: +y ke atas.

   Untuk menyetel ulang: buka index.html?debug, atur kamera dengan
   mouse, tekan C → koordinat disalin ke clipboard / console.
   ========================================================= */

/** Isi model room.glb (diverifikasi visual, koordinat setelah offset):
 *  - Singgasana raja, ratu, putri ........ x -1.4…2.2, y 0.7…2.8, z -12.9…-11.6
 *  - Dua panji merah di dinding belakang .. x -2…2.6,  y 2.3…8,   z -15.1
 *  - Meja perjamuan + 4 tamu (kiri) ....... x -7.3…-4.2, z -5.9…-2.3
 *  - Meja perjamuan + 4 tamu (kanan) ...... x  4.2…7.3,  z -5.9…-2.3
 *  - Dua pengawal (kiri singgasana) ....... x -13.2…-6.6, z -13.3…-12
 *  - Dua pemanah di balkon ................ x -3.1 & 3.8, y 10.3…12.2, z -13.3…-12
 *  - Bangku panjang, karpet merah, pilar nave di x ±10.3
 *  - Meja catur (ditambahkan prosedural) .. (0, 0.15, -6.2)
 *  Tidak ada perapian atau lukisan di model ini.
 */
export const ROOM = {
    url: './assets/room.glb',
    // Model asli (Sketchfab) berada jauh dari titik asal; digeser agar aula di tengah.
    offset: [-85, 0, -13],
    // Ukuran bounding box yang diharapkan (untuk mendeteksi bila room.glb diganti model lain)
    expectedSize: [33.48, 25.65, 43.32],
    // Kamera manual dibatasi di dalam nave agar tidak menembus dinding
    bounds: { min: [-9.2, 0.6, -14.4], max: [9.2, 20, 16.5] },
    chessTable: [0, 0.15, -6.2],
    intro: { pos: [0, 9, 17], target: [0, 3, -6] },
    views: [
        // 1. Pembuka — aula utama dari pintu masuk, karpet menuntun ke singgasana
        { label: 'Aula utama', pos: [0, 5.6, 14.5], target: [0, 2.4, -7] },
        // 2. Anggota — meja perjamuan kiri dengan para tamu (sebagai "anggota")
        { label: 'Meja perjamuan', pos: [1.4, 2.6, 0.4], target: [-5.6, 1.1, -4.1] },
        // 3. Visi & Misi — singgasana raja & ratu dengan panji di belakang
        { label: 'Singgasana', pos: [2.6, 3.2, -6.9], target: [0.2, 2.0, -12.3] },
        // 4. Kognitif — meja catur (strategi), singgasana sebagai latar
        { label: 'Meja catur', pos: [1.5, 2.25, -3.9], target: [0, 0.9, -6.3] },
        // 5. Afektif — para pengawal/ksatria (sportivitas, sikap ksatria)
        { label: 'Pengawal', pos: [-3.6, 2.0, -8.0], target: [-8.6, 1.15, -12.6] },
        // 6. Psikomotorik — pemanah di balkon (keterampilan & ketangkasan fisik)
        { label: 'Pemanah di balkon', pos: [0.6, 9.6, 0.5], target: [0.6, 10.7, -12.8] },
        // 7. Program Kerja — aula dengan bangku-bangku (venue kompetisi)
        { label: 'Aula kompetisi', pos: [7.6, 7.2, 11.5], target: [-1.2, 1.4, -3] },
        // 8. Penutup — orbit perlahan di tengah aula
        { label: 'Penutup', pos: [0, 6, 8.5], target: [0, 2, -0.5], orbit: true }
    ]
};

/** Adegan cadangan (papan catur besar, petak 0.5 m, putih di sisi +z). */
export const FALLBACK = {
    bounds: { min: [-13, 0.35, -13], max: [13, 12, 13] },
    intro: { pos: [0, 9, 12], target: [0, 0.3, 0] },
    views: [
        { label: 'Papan catur', pos: [0, 5.2, 7.2], target: [0, 0.4, 0] },
        { label: 'Bidak putih', pos: [3.2, 1.9, 4.6], target: [0, 0.5, 1.4] },
        { label: 'Raja & ratu', pos: [1.6, 1.5, 3.9], target: [0, 0.75, 1.75] },
        { label: 'Pusat papan', pos: [1.0, 4.4, 3.9], target: [0, 0.3, -0.2] },
        { label: 'Kuda', pos: [-2.9, 1.5, 0.6], target: [-0.75, 0.55, -1.25] },
        { label: 'Sudut rendah', pos: [4.2, 0.9, -0.4], target: [0, 0.5, 0] },
        { label: 'Panji', pos: [-5.2, 3.2, 3.6], target: [0, 1.2, -1.5] },
        { label: 'Penutup', pos: [0, 3.4, 6.2], target: [0, 0.4, 0], orbit: true }
    ]
};
