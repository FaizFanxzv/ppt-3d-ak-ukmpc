/* =========================================================
   Geometri catur prosedural (dibuat sendiri, tanpa aset luar)
   - createChessTable(): meja catur kecil untuk ruang utama
   - createFallbackHall(): adegan cadangan bila room.glb gagal
   ========================================================= */
import * as THREE from 'three';

// Profil bubut (radius, tinggi) — satuan relatif, tinggi raja ≈ 1.05
const BASE = [[0, 0], [0.36, 0], [0.36, 0.07], [0.31, 0.11], [0.25, 0.15]];
const PROFILES = {
    pawn: [...BASE, [0.15, 0.24], [0.11, 0.42], [0.18, 0.45], [0.11, 0.49], [0.15, 0.55], [0.16, 0.62], [0.13, 0.69], [0.07, 0.73], [0, 0.74]],
    rook: [...BASE, [0.19, 0.25], [0.17, 0.56], [0.25, 0.6], [0.25, 0.79], [0.18, 0.79], [0.18, 0.73], [0, 0.73]],
    bishop: [...BASE, [0.15, 0.3], [0.1, 0.56], [0.19, 0.59], [0.11, 0.63], [0.16, 0.73], [0.15, 0.83], [0.08, 0.92], [0.04, 0.95], [0.06, 0.98], [0, 1.0]],
    queen: [...BASE, [0.17, 0.35], [0.11, 0.7], [0.22, 0.74], [0.13, 0.78], [0.21, 0.96], [0.12, 0.98], [0.07, 1.0], [0, 1.0]],
    king: [...BASE, [0.17, 0.35], [0.12, 0.75], [0.23, 0.79], [0.14, 0.83], [0.2, 0.99], [0, 0.99]],
    knightBase: [...BASE, [0.21, 0.24], [0, 0.24]]
};

function lathe(points, segments = 20) {
    return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments);
}

/** Geometri dipakai bersama oleh semua bidak dengan jenis yang sama. */
function buildPieceGeometries() {
    const g = {};
    for (const k of ['pawn', 'rook', 'bishop', 'queen', 'king']) g[k] = lathe(PROFILES[k]);
    g.knightBase = lathe(PROFILES.knightBase);

    // Kepala kuda: siluet diekstrusi
    const s = new THREE.Shape();
    const pts = [[-0.2, 0.22], [0.2, 0.22], [0.16, 0.42], [0.25, 0.58], [0.25, 0.7], [0.08, 0.86],
        [-0.02, 0.95], [-0.06, 0.86], [-0.2, 0.74], [-0.27, 0.6], [-0.14, 0.55], [-0.22, 0.4]];
    s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    s.closePath();
    g.knightHead = new THREE.ExtrudeGeometry(s, { depth: 0.28, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 });
    g.knightHead.translate(0, 0, -0.14);

    // Mahkota raja (salib) & bola ratu
    g.crossV = new THREE.BoxGeometry(0.06, 0.2, 0.06);
    g.crossH = new THREE.BoxGeometry(0.16, 0.06, 0.06);
    g.queenBall = new THREE.SphereGeometry(0.07, 16, 12);
    return g;
}

function makePiece(type, color, geos, mat) {
    const grp = new THREE.Group();
    grp.name = `${color}-${type}`;
    const add = (geo, y = 0, rotY = 0) => {
        const m = new THREE.Mesh(geo, mat);
        m.position.y = y;
        m.rotation.y = rotY;
        m.castShadow = true;
        m.receiveShadow = true;
        grp.add(m);
        return m;
    };
    if (type === 'knight') {
        add(geos.knightBase);
        // kuda putih menghadap -z (ke arah hitam), kuda hitam ke +z
        add(geos.knightHead, 0, color === 'w' ? Math.PI / 2 : -Math.PI / 2);
    } else {
        add(geos[type]);
        if (type === 'king') { add(geos.crossV, 1.08); add(geos.crossH, 1.1); }
        if (type === 'queen') add(geos.queenBall, 1.04);
    }
    return grp;
}

// Posisi pembukaan Italian Game (1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5)
const POSITION = {
    w: { king: ['e1'], queen: ['d1'], rook: ['a1', 'h1'], bishop: ['c1', 'c4'], knight: ['b1', 'f3'], pawn: ['a2', 'b2', 'c2', 'd2', 'e4', 'f2', 'g2', 'h2'] },
    b: { king: ['e8'], queen: ['d8'], rook: ['a8', 'h8'], bishop: ['c8', 'c5'], knight: ['g8', 'c6'], pawn: ['a7', 'b7', 'c7', 'd7', 'e5', 'f7', 'g7', 'h7'] }
};

/** Koordinat lokal petak (pusat papan = 0,0). Putih di sisi +z. */
export function squareToLocal(sq, size) {
    const file = sq.charCodeAt(0) - 97; // a=0
    const rank = parseInt(sq[1], 10) - 1; // 1=0
    return { x: (file - 3.5) * size, z: (3.5 - rank) * size };
}

/**
 * Papan + bidak. Titik asal di tengah permukaan bawah papan.
 * @param {number} size ukuran satu petak (meter)
 */
export function createChessSet(size = 0.11) {
    const group = new THREE.Group();
    group.name = 'ChessSet';
    const thick = size * 0.35;

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x4a2c18, roughness: 0.55, metalness: 0.05 });
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xead6ad, roughness: 0.5 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x7b4a2a, roughness: 0.5 });

    const frame = new THREE.Mesh(new THREE.BoxGeometry(size * 9, thick, size * 9), frameMat);
    frame.position.y = thick / 2;
    frame.castShadow = true;
    frame.receiveShadow = true;
    group.add(frame);

    // 64 petak sebagai dua InstancedMesh (2 draw call)
    const tileGeo = new THREE.BoxGeometry(size, size * 0.06, size);
    const light = new THREE.InstancedMesh(tileGeo, lightMat, 32);
    const dark = new THREE.InstancedMesh(tileGeo, darkMat, 32);
    const m4 = new THREE.Matrix4();
    let li = 0, di = 0;
    for (let f = 0; f < 8; f++) {
        for (let r = 0; r < 8; r++) {
            const x = (f - 3.5) * size, z = (3.5 - r) * size;
            m4.makeTranslation(x, thick + size * 0.03, z);
            // a1 (f=0,r=0) adalah petak gelap
            if ((f + r) % 2 === 0) dark.setMatrixAt(di++, m4); else light.setMatrixAt(li++, m4);
        }
    }
    for (const im of [light, dark]) { im.receiveShadow = true; im.instanceMatrix.needsUpdate = true; group.add(im); }

    const geos = buildPieceGeometries();
    const mats = {
        w: new THREE.MeshStandardMaterial({ color: 0xf1e8d6, roughness: 0.42, metalness: 0.05 }),
        b: new THREE.MeshStandardMaterial({ color: 0x2b2421, roughness: 0.38, metalness: 0.12 })
    };
    const scale = size * 0.95;
    const top = thick + size * 0.06;
    for (const color of ['w', 'b']) {
        for (const [type, squares] of Object.entries(POSITION[color])) {
            for (const sq of squares) {
                const p = makePiece(type, color, geos, mats[color]);
                const { x, z } = squareToLocal(sq, size);
                p.position.set(x, top, z);
                p.scale.setScalar(scale);
                group.add(p);
            }
        }
    }
    group.userData.topY = top;
    return group;
}

/** Meja catur berkaki tunggal dengan papan di atasnya. Titik asal = lantai. */
export function createChessTable() {
    const group = new THREE.Group();
    group.name = 'ChessTable';
    const wood = new THREE.MeshStandardMaterial({ color: 0x5b3a22, roughness: 0.6, metalness: 0.05 });
    const brass = new THREE.MeshStandardMaterial({ color: 0xc9a14a, roughness: 0.35, metalness: 0.7 });
    const topH = 0.8;

    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.06, 40), wood);
    top.position.y = topH;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.015, 8, 48), brass);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = topH + 0.03;
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, topH - 0.06, 20), wood);
    column.position.y = (topH - 0.06) / 2 + 0.03;
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.44, 0.06, 32), wood);
    foot.position.y = 0.03;
    for (const m of [top, rim, column, foot]) { m.castShadow = true; m.receiveShadow = true; group.add(m); }

    const set = createChessSet(0.11);
    set.position.y = topH + 0.03;
    group.add(set);
    return group;
}

/**
 * Adegan cadangan bertema catur (dipakai bila room.glb gagal dimuat).
 * Papan besar di atas panggung, lantai, karpet, dan dua panji.
 */
export function createFallbackHall() {
    const group = new THREE.Group();
    group.name = 'FallbackHall';

    const floor = new THREE.Mesh(
        new THREE.CircleGeometry(16, 64),
        new THREE.MeshStandardMaterial({ color: 0x2c2119, roughness: 0.85 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    const rug = new THREE.Mesh(
        new THREE.RingGeometry(3.6, 4.4, 64),
        new THREE.MeshStandardMaterial({ color: 0x7a1d1d, roughness: 0.9, side: THREE.DoubleSide })
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.y = 0.005;
    rug.receiveShadow = true;
    group.add(rug);

    const stage = new THREE.Mesh(
        new THREE.CylinderGeometry(3.2, 3.35, 0.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x3b2a1e, roughness: 0.7 })
    );
    stage.rotation.y = Math.PI / 8;
    stage.position.y = 0.1;
    stage.castShadow = true;
    stage.receiveShadow = true;
    group.add(stage);

    const set = createChessSet(0.5);
    set.position.y = 0.2;
    group.add(set);

    // Dua panji emas-marun di belakang papan
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xc9a14a, roughness: 0.35, metalness: 0.7 });
    const clothMat = new THREE.MeshStandardMaterial({ color: 0x8e1b1b, roughness: 0.8, side: THREE.DoubleSide });
    for (const x of [-3.2, 3.2]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.2, 12), poleMat);
        pole.position.set(x, 2.1, -4.2);
        pole.castShadow = true;
        const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), clothMat);
        cloth.position.set(x, 2.8, -4.15);
        cloth.castShadow = true;
        group.add(pole, cloth);
    }
    return group;
}
