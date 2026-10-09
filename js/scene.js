/* =========================================================
   Ruang 3D: renderer, pemuatan model, adegan cadangan, kamera
   Bergantung pada window.Presentation (js/slides.js).
   ========================================================= */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createChessTable, createFallbackHall } from './chess.js';
import { ROOM, FALLBACK } from './views.js';

const P = window.Presentation;
if (!P) throw new Error('[3D] js/slides.js belum dimuat — window.Presentation tidak ada.');
P.registerScene();

const LOG = '[3D]';
const DEBUG = new URLSearchParams(location.search).has('debug');
const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

// ---------------------------------------------------------
// Renderer
// ---------------------------------------------------------
const container = document.getElementById('canvas-container');
let renderer;
try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (err) {
    console.error(LOG, 'WebGL tidak tersedia:', err);
    P.disable3D('WebGL tidak tersedia',
        'Browser atau kartu grafis tidak mendukung WebGL, jadi ruang 3D dinonaktifkan. Slide tetap dapat dipakai. Coba aktifkan "Use hardware acceleration" di pengaturan browser.');
    throw err;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.setAttribute('role', 'img');
renderer.domElement.setAttribute('aria-label', 'Ruangan 3D. Drag untuk memutar kamera, scroll untuk zoom.');
container.appendChild(renderer.domElement);

renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    console.error(LOG, 'Konteks WebGL hilang.');
    P.ui.showBanner({ tone: 'warn', title: 'Tampilan 3D terhenti', message: 'Kartu grafis mereset tampilan. Muat ulang halaman (F5) untuk melanjutkan.', actions: [{ label: 'Muat ulang', onClick: () => location.reload() }] });
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1e2a);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 200);
camera.position.set(0, 9, 17);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.rotateSpeed = 0.6;
controls.zoomSpeed = 0.8;
controls.panSpeed = 0.7;
controls.screenSpacePanning = true;
controls.minDistance = 0.8;
controls.maxDistance = 26;
controls.maxPolarAngle = Math.PI * 0.75; // izinkan menengadah ke balkon
controls.target.set(0, 3, -6);
updateFovInit();
controls.update();
function updateFovInit() { camera.fov = camera.aspect < 1 ? 55 : 45; camera.updateProjectionMatrix(); }

// ---------------------------------------------------------
// Pencahayaan (dibuat ulang sesuai mode)
// ---------------------------------------------------------
const lights = new THREE.Group();
lights.name = 'Lights';
scene.add(lights);

function setupLights(mode) {
    for (const l of [...lights.children]) {
        lights.remove(l);
        if (l.shadow && l.shadow.map) l.shadow.map.dispose();
        l.dispose?.();
    }
    if (mode === 'room') {
        lights.add(new THREE.HemisphereLight(0xfff3e2, 0x7a5a40, 1.55));
        const key = new THREE.DirectionalLight(0xfff0da, 1.6);
        key.position.set(7, 22, 9);
        key.target.position.set(0, 0, -2);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        const s = key.shadow.camera;
        s.left = -14; s.right = 14; s.top = 22; s.bottom = -22; s.near = 2; s.far = 60;
        key.shadow.bias = -0.0004;
        key.shadow.normalBias = 0.03;
        lights.add(key, key.target);
        // aksen hangat di singgasana
        const warm = new THREE.PointLight(0xffc98a, 30, 16, 2);
        warm.position.set(0, 5, -9);
        lights.add(warm);
    } else {
        lights.add(new THREE.HemisphereLight(0xdfe8ff, 0x3a2a1e, 1.1));
        const key = new THREE.DirectionalLight(0xfff0da, 2.4);
        key.position.set(5, 10, 6);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        const s = key.shadow.camera;
        s.left = -8; s.right = 8; s.top = 8; s.bottom = -8; s.near = 1; s.far = 30;
        key.shadow.bias = -0.0004;
        key.shadow.normalBias = 0.02;
        lights.add(key);
        const rim = new THREE.DirectionalLight(0xffc98a, 0.8);
        rim.position.set(-6, 4, -6);
        lights.add(rim);
    }
}

// ---------------------------------------------------------
// State
// ---------------------------------------------------------
const state = {
    mode: null,          // 'room' | 'fallback'
    config: null,        // ROOM | FALLBACK
    views: [],
    bounds: null,        // { min: Vector3, max: Vector3 }
    content: null,       // Object3D saat ini
    flight: null,        // animasi kamera aktif
    dirty: true,
    loadToken: 0,
    resumeTimer: 0,
    userMoved: false,
    framing: { x: 0, y: 0, tx: 0, ty: 0 }
};

function disposeObject(root) {
    root.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.isInstancedMesh) o.dispose();
        const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
        for (const m of mats) {
            for (const key of Object.keys(m)) {
                const val = m[key];
                if (val && val.isTexture) val.dispose();
            }
            m.dispose();
        }
    });
}

function setContent(object, mode, config, views) {
    if (state.content) {
        scene.remove(state.content);
        disposeObject(state.content);
    }
    state.content = object;
    state.mode = mode;
    state.config = config;
    state.views = views;
    state.bounds = config.bounds ? { min: v3(config.bounds.min), max: v3(config.bounds.max) } : null;
    scene.add(object);
    setupLights(mode);
    scene.background = new THREE.Color(mode === 'room' ? 0x1b1712 : 0x141821);
    document.body.dataset.scene = mode;
    state.dirty = true;
}

// ---------------------------------------------------------
// Animasi kamera
// ---------------------------------------------------------
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function cancelFlight() {
    if (!state.flight) return;
    state.flight = null;
    controls.enableDamping = true;
}

/**
 * Sesuaikan sudut kamera dengan rasio layar: pada layar sempit/portrait
 * kamera dimundurkan sedikit agar objek fokus tetap masuk bingkai,
 * lalu dibatasi agar tetap di dalam ruangan.
 */
function resolveView(view) {
    const pos = v3(view.pos);
    const target = v3(view.target);
    const aspect = camera.aspect || 1;
    if (aspect < 1.3) {
        const k = Math.min(1.9, Math.pow(1.3 / aspect, 0.6));
        pos.sub(target).multiplyScalar(k).add(target);
    }
    if (state.bounds) pos.clamp(state.bounds.min, state.bounds.max);
    return { pos, target };
}

function updateFov() {
    const fov = camera.aspect < 1 ? 55 : 45;
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
}

function flyTo(view, opts = {}) {
    if (!view) return;
    cancelFlight();
    clearTimeout(state.resumeTimer);
    controls.autoRotate = false;
    state.userMoved = false;

    const { pos: toPos, target: toTarget } = resolveView(view);
    const dist = camera.position.distanceTo(toPos) + controls.target.distanceTo(toTarget) * 0.5;
    const instant = opts.instant || P.prefersReducedMotion() || dist < 1e-3;

    if (instant) {
        camera.position.copy(toPos);
        controls.target.copy(toTarget);
        controls.update();
        state.dirty = true;
        onFlightDone(view);
        return;
    }
    // Damping dimatikan sementara agar sisa gerakan drag tidak "melawan" animasi
    controls.enableDamping = false;
    controls.update();
    state.flight = {
        view,
        fromPos: camera.position.clone(),
        fromTarget: controls.target.clone(),
        toPos, toTarget,
        start: performance.now(),
        duration: opts.duration ?? THREE.MathUtils.clamp(1100 + dist * 45, 1300, 2600),
        // sedikit melengkung ke atas agar jalur kamera tidak memotong objek
        lift: Math.min(1.6, dist * 0.06)
    };
}

function stepFlight(now) {
    const f = state.flight;
    const t = Math.min((now - f.start) / f.duration, 1);
    const e = easeInOutCubic(t);
    camera.position.lerpVectors(f.fromPos, f.toPos, e);
    camera.position.y += Math.sin(Math.PI * e) * f.lift;
    controls.target.lerpVectors(f.fromTarget, f.toTarget, e);
    if (t >= 1) {
        camera.position.copy(f.toPos);
        controls.target.copy(f.toTarget);
        cancelFlight();
        onFlightDone(f.view);
    }
}

function onFlightDone(view) {
    if (view.orbit && !P.prefersReducedMotion()) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.7; // ±85 detik per putaran
    }
}

function viewFor(index) {
    const n = state.views.length;
    if (!n) return null;
    const i = Number.isInteger(index) ? THREE.MathUtils.clamp(index, 0, n - 1) : 0;
    return state.views[i];
}

function showSlide(index, opts) {
    const view = viewFor(index);
    if (view) flyTo(view, opts);
}

// Interaksi pengguna membatalkan animasi & auto-rotate; auto-rotate kembali setelah diam
controls.addEventListener('start', () => {
    state.userMoved = true;
    cancelFlight();
    controls.autoRotate = false;
    clearTimeout(state.resumeTimer);
});
controls.addEventListener('end', () => {
    clearTimeout(state.resumeTimer);
    const view = viewFor(P.current());
    if (view && view.orbit && !P.prefersReducedMotion()) {
        state.resumeTimer = setTimeout(() => {
            if (!state.flight && viewFor(P.current()) === view) controls.autoRotate = true;
        }, 4000);
    }
});
controls.addEventListener('change', () => { state.dirty = true; });

document.addEventListener('slide:change', (e) => {
    if (!state.mode) return; // belum siap: kamera diatur saat konten selesai dimuat
    showSlide(e.detail.index);
    scheduleFramingUpdate();
});
document.addEventListener('view:reset', () => {
    if (state.mode) showSlide(P.current());
});
document.addEventListener('panel:toggle', scheduleFramingUpdate);

// ---------------------------------------------------------
// Framing: geser titik fokus ke area yang tidak tertutup panel
// ---------------------------------------------------------
function computeFraming() {
    const w = container.clientWidth, h = container.clientHeight;
    const f = state.framing;
    f.tx = 0; f.ty = 0;
    if (document.body.classList.contains('panel-hidden') || document.body.classList.contains('no-3d')) return;
    const region = document.getElementById('slideRegion');
    const slide = document.querySelector('.slide.active');
    const nav = document.querySelector('.nav-controls');
    if (!region || !slide) return;
    const r = region.getBoundingClientRect();
    const stacked = r.width > w * 0.7; // layout ponsel: panel di atas
    if (!stacked) {
        // panel di kiri → titik fokus ke tengah area kanan
        f.tx = THREE.MathUtils.clamp(r.right / 2, 0, w * 0.3);
    } else {
        const panelBottom = r.top + slide.offsetHeight;
        const navTop = nav ? nav.getBoundingClientRect().top : h;
        const freeCenter = (panelBottom + navTop) / 2;
        f.ty = THREE.MathUtils.clamp(freeCenter - h / 2, 0, h * 0.3);
    }
}
let framingRaf = 0;
function scheduleFramingUpdate() {
    cancelAnimationFrame(framingRaf);
    framingRaf = requestAnimationFrame(() => { computeFraming(); state.dirty = true; });
}
function applyFraming(immediate, dt = 0.016) {
    const f = state.framing;
    // pergeseran halus berbasis waktu (±0.4 dtk), tidak bergantung FPS
    const k = immediate ? 1 : 1 - Math.exp(-dt * 9);
    const nx = f.x + (f.tx - f.x) * k;
    const ny = f.y + (f.ty - f.y) * k;
    const moving = Math.abs(nx - f.x) > 0.05 || Math.abs(ny - f.y) > 0.05;
    f.x = Math.abs(f.tx - nx) < 0.5 ? f.tx : nx;
    f.y = Math.abs(f.ty - ny) < 0.5 ? f.ty : ny;
    const w = container.clientWidth, h = container.clientHeight;
    if (f.x === 0 && f.y === 0) camera.clearViewOffset();
    else camera.setViewOffset(w, h, -f.x, -f.y, w, h);
    return moving;
}

// ---------------------------------------------------------
// Resize
// ---------------------------------------------------------
function onResize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    updateFov();
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    computeFraming();
    applyFraming(true);
    // Rotasi layar / resize: bila kamera belum digeser pengguna, sesuaikan ulang sudut slide
    if (state.mode && !state.userMoved && !state.flight) {
        const view = viewFor(P.current());
        if (view) {
            const r = resolveView(view);
            camera.position.copy(r.pos);
            controls.target.copy(r.target);
            controls.update();
        }
    }
    state.dirty = true;
}
if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(container);
else window.addEventListener('resize', onResize);
document.addEventListener('visibilitychange', () => { if (!document.hidden) state.dirty = true; });

// ---------------------------------------------------------
// Loop render (render hanya saat ada perubahan)
// ---------------------------------------------------------
const clock = new THREE.Clock();
const renderStats = { controls: 0, moving: 0, dirty: 0, autoRotate: 0 };
function frame(now) {
    requestAnimationFrame(frame);
    const rawDt = clock.getDelta();
    const dt = Math.min(rawDt, 0.1);
    if (document.hidden) return;

    let moving = false;
    if (state.flight) { stepFlight(now); moving = true; }
    const changed = controls.update(dt);
    if (state.bounds) {
        const before = camera.position.clone();
        camera.position.clamp(state.bounds.min, state.bounds.max);
        controls.target.clamp(state.bounds.min, state.bounds.max);
        if (!before.equals(camera.position)) camera.lookAt(controls.target);
    }
    if (applyFraming(false, Math.min(rawDt, 1))) moving = true;

    if (changed || moving || state.dirty || controls.autoRotate) {
        const r = renderStats;
        if (changed) r.controls++; if (moving) r.moving++; if (state.dirty) r.dirty++; if (controls.autoRotate) r.autoRotate++;
        renderer.render(scene, camera);
        state.dirty = false;
    }
}

// ---------------------------------------------------------
// Pemuatan model
// ---------------------------------------------------------
const gltfLoader = new GLTFLoader();

function describeLoadError(err) {
    const msg = String((err && (err.message || err.type)) || err || '');
    if (/\b404\b/.test(msg)) return 'File assets/room.glb tidak ditemukan. Pastikan folder "assets" ikut terekstrak.';
    if (/failed to fetch|networkerror|load failed|error/i.test(msg) && !/json|gltf|parse|unexpected/i.test(msg)) {
        return 'Model tidak dapat diambil dari server lokal. Pastikan jendela run.bat masih terbuka.';
    }
    return 'File model rusak atau tidak dapat dibaca (' + msg.slice(0, 120) + ').';
}

function generatedViews(box) {
    // Cadangan generik bila room.glb diganti model lain: orbit di sekitar bounding box
    const c = box.getCenter(new THREE.Vector3());
    const s = box.getSize(new THREE.Vector3());
    const r = Math.max(s.x, s.z) * 0.9 + 1;
    const y = c.y + s.y * 0.35;
    return Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 4;
        return { label: 'Sudut ' + (i + 1), pos: [c.x + Math.sin(a) * r, y + (i % 2) * s.y * 0.2, c.z + Math.cos(a) * r], target: [c.x, c.y, c.z], orbit: i === 7 };
    });
}

function setupRoom(gltf) {
    const root = new THREE.Group();
    root.name = 'Room';
    const model = gltf.scene;
    model.position.set(...ROOM.offset);
    root.add(model);
    root.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const expected = v3(ROOM.expectedSize);
    const matches = Math.abs(size.x - expected.x) / expected.x < 0.1 &&
        Math.abs(size.y - expected.y) / expected.y < 0.1 &&
        Math.abs(size.z - expected.z) / expected.z < 0.1;

    let config = ROOM;
    let views = ROOM.views;
    if (!matches) {
        console.warn(LOG, 'Ukuran room.glb berbeda dari model asli; memakai sudut kamera generik.', size);
        config = { ...ROOM, bounds: null };
        views = generatedViews(box);
        controls.maxDistance = Math.max(26, size.length() * 1.5);
    }

    let meshes = 0;
    model.traverse((o) => {
        if (!o.isMesh) return;
        meshes++;
        o.receiveShadow = true;
        // Cangkang bangunan (dinding/atap/lantai) tidak memberi bayangan agar
        // atap tidak menutup cahaya; figur & perabot tetap berbayangan.
        const b = new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3());
        o.castShadow = Math.max(b.x, b.y, b.z) < 12;
        const m = o.material;
        if (m && m.map) m.map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    });

    if (matches) {
        const table = createChessTable();
        table.position.set(...ROOM.chessTable);
        root.add(table);
    }

    console.info(LOG, `Model dimuat: ${meshes} mesh, ukuran ${size.x.toFixed(1)}×${size.y.toFixed(1)}×${size.z.toFixed(1)} m`);
    return { root, config, views };
}

function startScene(intro) {
    // Mulai dari sudut pembuka lalu terbang ke slide yang sedang aktif.
    // Tidak bergantung pada perubahan indeks slide (perbaikan bug goToSlide(0) lama).
    controls.autoRotate = false;
    if (intro && !P.prefersReducedMotion()) {
        camera.position.copy(v3(intro.pos));
        controls.target.copy(v3(intro.target));
    }
    controls.update();
    computeFraming();
    applyFraming(true);
    showSlide(P.current(), { duration: 2200 });
}

function loadRoom() {
    const token = ++state.loadToken;
    const isRetry = state.mode === 'fallback';
    P.ui.hideBanner();
    if (!isRetry) P.ui.setLoader('Memuat ruangan 3D…', 'Mengunduh model (0%)', 0.05);
    else P.ui.showBanner({ tone: 'info', title: 'Mencoba memuat ulang model…', message: 'Mohon tunggu.' });

    gltfLoader.load(
        ROOM.url,
        (gltf) => {
            if (token !== state.loadToken) { disposeObject(gltf.scene); return; }
            const { root, config, views } = setupRoom(gltf);
            setContent(root, 'room', config, views);
            startScene(config.intro);
            P.ui.setLoader(null, 'Selesai', 1);
            setTimeout(P.ui.hideLoader, 250);
            if (isRetry) P.ui.showBanner({ tone: 'info', title: 'Model berhasil dimuat', message: 'Ruang 3D utama kini ditampilkan.', autoHideMs: 3500 });
        },
        (xhr) => {
            if (token !== state.loadToken || isRetry) return;
            if (xhr.lengthComputable && xhr.total > 0) {
                const p = xhr.loaded / xhr.total;
                P.ui.setLoader(null, `Mengunduh model (${Math.round(p * 100)}%)`, 0.05 + p * 0.9);
            } else {
                P.ui.setLoader(null, `Mengunduh model (${(xhr.loaded / 1048576).toFixed(1)} MB)`, null);
            }
        },
        (err) => {
            if (token !== state.loadToken) return;
            console.error(LOG, `Gagal memuat ${ROOM.url}:`, err);
            const reason = describeLoadError(err);
            if (state.mode !== 'fallback') {
                setContent(createFallbackHall(), 'fallback', FALLBACK, FALLBACK.views);
                startScene(FALLBACK.intro);
            }
            P.ui.hideLoader();
            P.ui.showBanner({
                tone: 'warn',
                title: 'Ruangan 3D utama gagal dimuat — menampilkan adegan catur cadangan',
                message: reason,
                actions: [{ label: 'Coba lagi', onClick: loadRoom }]
            });
        }
    );
}

// ---------------------------------------------------------
// Mode debug (index.html?debug): tekan C untuk menyalin posisi kamera
// ---------------------------------------------------------
if (DEBUG) {
    const f = (v) => `[${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)}]`;
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() !== 'c' || e.ctrlKey || e.metaKey) return;
        const line = `{ pos: ${f(camera.position)}, target: ${f(controls.target)} },`;
        console.log('%c[debug] Kamera:', 'color:#f6d365;font-weight:bold', line);
        navigator.clipboard?.writeText(line).then(
            () => console.log('[debug] Disalin ke clipboard.'),
            () => console.log('[debug] Salin manual dari baris di atas.')
        );
    });
    window.__debug3D = { THREE, scene, camera, controls, renderer, state, showSlide };
    console.info(LOG, 'Mode debug aktif: tekan C untuk menyalin koordinat kamera.');
}

// Hook ringan untuk pengujian otomatis (tidak memengaruhi pengguna)
window.__scene3D = {
    get mode() { return state.mode; },
    get flying() { return !!state.flight; },
    get autoRotate() { return controls.autoRotate; },
    camera: () => ({ pos: camera.position.toArray(), target: controls.target.toArray() }),
    info: () => renderer.info.render,
    renderStats: () => ({ ...renderStats }),
    memory: () => ({ ...renderer.info.memory })
};

requestAnimationFrame(frame);
loadRoom();
