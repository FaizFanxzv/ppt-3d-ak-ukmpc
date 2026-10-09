/* =========================================================
   Navigasi slide + UI status (skrip klasik, tanpa dependensi)
   ---------------------------------------------------------
   Sengaja dipisah dari modul 3D: bila Three.js / WebGL / model
   gagal dimuat, slide tetap bisa dipresentasikan.

   Event yang dipancarkan ke `document`:
     slide:change  { index, previous, reason }
     view:reset    { index }
     panel:toggle  { hidden }
   ========================================================= */
(function () {
    'use strict';

    var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
    var total = slides.length;
    var current = -1;

    var prevBtn = document.getElementById('prevBtn');
    var nextBtn = document.getElementById('nextBtn');
    var dotContainer = document.getElementById('dotContainer');
    var counter = document.getElementById('slideCounter');
    var liveRegion = document.getElementById('liveRegion');
    var slideRegion = document.getElementById('slideRegion');
    var panelToggleBtn = document.getElementById('panelToggleBtn');
    var resetViewBtn = document.getElementById('resetViewBtn');
    var helpBtn = document.getElementById('helpBtn');
    var helpPanel = document.getElementById('helpPanel');
    var helpClose = document.getElementById('helpClose');

    var loaderEl = document.getElementById('loader');
    var loaderTitle = document.getElementById('loaderTitle');
    var loaderText = document.getElementById('loaderText');
    var loaderBar = document.getElementById('loaderBar');
    var banner = document.getElementById('statusBanner');
    var bannerTitle = document.getElementById('statusTitle');
    var bannerMsg = document.getElementById('statusMessage');
    var bannerActions = document.getElementById('statusActions');
    var bannerClose = document.getElementById('statusClose');

    var reducedMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

    function titleOf(i) {
        return slides[i] ? (slides[i].getAttribute('data-title') || ('Slide ' + (i + 1))) : '';
    }

    function emit(name, detail) {
        var ev;
        try {
            ev = new CustomEvent(name, { detail: detail });
        } catch (e) { // browser sangat lama
            ev = document.createEvent('CustomEvent');
            ev.initCustomEvent(name, false, false, detail);
        }
        document.dispatchEvent(ev);
    }

    // ---------- Dots ----------
    var dots = [];
    for (var i = 0; i < total; i++) {
        (function (idx) {
            var dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'dot';
            dot.setAttribute('aria-label', 'Ke slide ' + (idx + 1) + ': ' + titleOf(idx));
            dot.title = (idx + 1) + '. ' + titleOf(idx);
            dot.addEventListener('click', function () { goTo(idx, 'dot'); });
            dotContainer.appendChild(dot);
            dots.push(dot);
        })(i);
    }

    // ---------- Render ----------
    function render() {
        for (var i = 0; i < total; i++) {
            var active = i === current;
            slides[i].classList.toggle('active', active);
            if (active) slides[i].removeAttribute('hidden');
            else slides[i].setAttribute('hidden', '');
            if (active) dots[i].setAttribute('aria-current', 'step');
            else dots[i].removeAttribute('aria-current');
        }
        counter.textContent = (current + 1) + '/' + total;
        prevBtn.disabled = current <= 0;
        nextBtn.disabled = current >= total - 1;
        if (slides[current]) slides[current].scrollTop = 0;
    }

    function goTo(index, reason) {
        index = Number(index);
        if (!isFinite(index)) return false;
        index = Math.max(0, Math.min(total - 1, Math.round(index)));
        if (index === current) return false;

        var previous = current;
        current = index;
        render();

        if (reason !== 'init') {
            liveRegion.textContent = 'Slide ' + (current + 1) + ' dari ' + total + ': ' + titleOf(current);
        }
        try { history.replaceState(null, '', '#' + (current + 1)); } catch (e) { /* abaikan (mis. sandbox) */ }

        emit('slide:change', { index: current, previous: previous, reason: reason || 'nav' });
        return true;
    }

    function next() { return goTo(current + 1, 'next'); }
    function prev() { return goTo(current - 1, 'prev'); }

    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);

    // ---------- Panel & bantuan ----------
    function setPanelHidden(hidden) {
        document.body.classList.toggle('panel-hidden', hidden);
        panelToggleBtn.setAttribute('aria-pressed', hidden ? 'true' : 'false');
        panelToggleBtn.setAttribute('aria-label', hidden ? 'Tampilkan panel slide' : 'Sembunyikan panel slide');
        emit('panel:toggle', { hidden: hidden });
    }
    function togglePanel() { setPanelHidden(!document.body.classList.contains('panel-hidden')); }
    panelToggleBtn.addEventListener('click', togglePanel);

    function resetView() { emit('view:reset', { index: current }); }
    resetViewBtn.addEventListener('click', resetView);

    function setHelp(open) {
        helpPanel.hidden = !open;
        helpBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) helpClose.focus();
    }
    helpBtn.addEventListener('click', function () { setHelp(helpPanel.hidden); });
    helpClose.addEventListener('click', function () { setHelp(false); helpBtn.focus(); });

    // ---------- Keyboard ----------
    function isEditable(el) {
        if (!el || !el.tagName) return false;
        var tag = el.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    }

    document.addEventListener('keydown', function (e) {
        if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
        var t = e.target;
        if (isEditable(t)) return;
        var onButton = t && t.tagName === 'BUTTON';
        var inPanel = t && t.closest && t.closest('.slide');

        switch (e.key) {
            case 'ArrowRight':
            case 'PageDown':
                next(); e.preventDefault(); break;
            case 'ArrowLeft':
            case 'PageUp':
                prev(); e.preventDefault(); break;
            case 'ArrowDown':
                if (!inPanel) { next(); e.preventDefault(); }
                break;
            case 'ArrowUp':
                if (!inPanel) { prev(); e.preventDefault(); }
                break;
            case ' ':
            case 'Spacebar':
                if (!onButton) { if (e.shiftKey) prev(); else next(); e.preventDefault(); }
                break;
            case 'Home':
                goTo(0, 'key'); e.preventDefault(); break;
            case 'End':
                goTo(total - 1, 'key'); e.preventDefault(); break;
            case 'h':
            case 'H':
                togglePanel(); break;
            case 'r':
            case 'R':
                resetView(); break;
            case '?':
                setHelp(helpPanel.hidden); break;
            case 'Escape':
                if (!helpPanel.hidden) { setHelp(false); helpBtn.focus(); }
                break;
        }
    });

    // ---------- Swipe: hanya di area panel slide ----------
    // Drag di canvas 3D dipakai untuk kamera dan TIDAK mengganti slide.
    var touchStart = null;
    slideRegion.addEventListener('touchstart', function (e) {
        if (e.touches.length !== 1) { touchStart = null; return; }
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
    }, { passive: true });
    slideRegion.addEventListener('touchend', function (e) {
        if (!touchStart) return;
        var tc = e.changedTouches[0];
        var dx = tc.clientX - touchStart.x;
        var dy = tc.clientY - touchStart.y;
        var dt = Date.now() - touchStart.t;
        touchStart = null;
        if (dt < 800 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            if (dx < 0) next(); else prev();
        }
    }, { passive: true });
    slideRegion.addEventListener('touchcancel', function () { touchStart = null; }, { passive: true });

    // ---------- UI status (dipakai modul 3D) ----------
    var bannerTimer = 0;
    var ui = {
        setLoader: function (title, text, fraction) {
            loaderEl.classList.remove('hidden');
            if (title != null) loaderTitle.textContent = title;
            if (text != null) loaderText.textContent = text;
            if (typeof fraction === 'number' && isFinite(fraction)) {
                loaderBar.style.width = Math.round(Math.max(0, Math.min(1, fraction)) * 100) + '%';
            }
        },
        hideLoader: function () {
            loaderEl.classList.add('hidden');
        },
        /**
         * opts: { tone: 'error'|'warn'|'info', title, message, actions: [{label, onClick}], autoHideMs }
         */
        showBanner: function (opts) {
            clearTimeout(bannerTimer);
            banner.className = 'status-banner tone-' + (opts.tone || 'error');
            bannerTitle.textContent = opts.title || '';
            bannerMsg.textContent = opts.message || '';
            bannerActions.innerHTML = '';
            (opts.actions || []).forEach(function (a) {
                var b = document.createElement('button');
                b.type = 'button';
                b.textContent = a.label;
                b.addEventListener('click', a.onClick);
                bannerActions.appendChild(b);
            });
            banner.hidden = false;
            if (opts.autoHideMs) bannerTimer = setTimeout(ui.hideBanner, opts.autoHideMs);
        },
        hideBanner: function () {
            clearTimeout(bannerTimer);
            banner.hidden = true;
        }
    };
    bannerClose.addEventListener('click', ui.hideBanner);

    // ---------- Pengawas modul 3D ----------
    var sceneRegistered = false;
    var watchdog = 0;

    function disable3D(title, message, tone) {
        document.body.classList.add('no-3d');
        ui.hideLoader();
        ui.showBanner({ tone: tone || 'error', title: title, message: message });
    }

    window.__sceneScriptFailed = function () {
        if (sceneRegistered) return;
        clearTimeout(watchdog);
        console.error('[Presentasi] Modul js/scene.js atau dependensinya (vendor/three) gagal dimuat.');
        disable3D('Ruang 3D tidak dapat dimuat',
            'File pustaka 3D (folder vendor/ atau js/) tidak ditemukan atau rusak. Slide tetap dapat dipakai tanpa ruang 3D. Ekstrak ulang ZIP secara utuh lalu jalankan run.bat.');
    };

    var Presentation = {
        get total() { return total; },
        current: function () { return current; },
        goTo: function (i) { return goTo(i, 'api'); },
        next: next,
        prev: prev,
        titleOf: titleOf,
        ui: ui,
        prefersReducedMotion: function () { return !!(reducedMotionQuery && reducedMotionQuery.matches); },
        registerScene: function () {
            sceneRegistered = true;
            clearTimeout(watchdog);
        },
        disable3D: disable3D
    };
    window.Presentation = Presentation;

    function syncReducedMotion() {
        document.body.classList.toggle('reduced-motion', Presentation.prefersReducedMotion());
    }
    syncReducedMotion();
    if (reducedMotionQuery) {
        if (reducedMotionQuery.addEventListener) reducedMotionQuery.addEventListener('change', syncReducedMotion);
        else if (reducedMotionQuery.addListener) reducedMotionQuery.addListener(syncReducedMotion);
    }

    // ---------- Slide awal (mendukung tautan #3 dsb.) ----------
    var initial = 0;
    var m = /^#(\d+)$/.exec(location.hash || '');
    if (m) {
        var n = parseInt(m[1], 10) - 1;
        if (n >= 0 && n < total) initial = n;
    }
    goTo(initial, 'init');

    // ---------- Pemeriksaan lingkungan ----------
    if (location.protocol === 'file:') {
        console.error('[Presentasi] Dibuka melalui file:// — browser memblokir modul JavaScript dan file GLB. Jalankan run.bat.');
        disable3D('Buka melalui run.bat, bukan klik ganda index.html',
            'Browser memblokir model 3D bila halaman dibuka langsung sebagai file. Tutup tab ini, lalu jalankan run.bat (Windows) atau run.sh (macOS/Linux). Slide tetap dapat dibaca di bawah.',
            'warn');
        window.__sceneScriptFailed = function () {};
        return;
    }

    // HTMLScriptElement.supports baru ada di Chrome 96+/Firefox 94+; bila tidak ada,
    // biarkan pengawas (watchdog) yang menilai apakah modul berhasil dimuat.
    var supportsImportMap = typeof HTMLScriptElement === 'undefined' ||
        typeof HTMLScriptElement.supports !== 'function' || HTMLScriptElement.supports('importmap');
    if (!supportsImportMap) {
        console.error('[Presentasi] Browser tidak mendukung import maps.');
        disable3D('Browser terlalu lama untuk ruang 3D',
            'Gunakan versi terbaru Google Chrome, Microsoft Edge, atau Firefox. Slide tetap dapat dipakai tanpa ruang 3D.', 'warn');
        return;
    }

    ui.setLoader('Memuat ruangan 3D…', 'Memuat pustaka 3D', 0.02);
    // Bila modul 3D tidak melapor dalam 20 detik, anggap gagal agar loader tidak berputar selamanya.
    watchdog = setTimeout(function () {
        if (!sceneRegistered) window.__sceneScriptFailed();
    }, 20000);
})();
