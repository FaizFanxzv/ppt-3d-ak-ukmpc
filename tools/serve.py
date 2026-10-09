#!/usr/bin/env python3
"""
Server lokal sederhana untuk Presentasi 3D Divisi AK.

- Menyajikan folder proyek (satu tingkat di atas folder tools/) di 127.0.0.1.
- Mencari port kosong mulai dari 8765 (atau --port).
- Memaksa MIME type yang benar untuk .js/.mjs/.glb/.json/.css
  (di sebagian PC Windows, registry membuat .js terbaca sebagai text/plain
  sehingga browser menolak modul JavaScript).
- Membuka browser secara otomatis (nonaktifkan dengan --no-browser).

Pemakaian:  python tools/serve.py [--port 8765] [--no-browser]
Butuh Python 3.7 atau lebih baru. Tidak memerlukan paket tambahan.
"""
import argparse
import errno
import functools
import http.server
import os
import socket
import sys
import threading
import webbrowser

if sys.version_info < (3, 7):
    sys.stderr.write("Python 3.7 atau lebih baru diperlukan. Versi Anda: %s\n" % sys.version.split()[0])
    sys.exit(2)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOST = "127.0.0.1"

MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".md": "text/markdown; charset=utf-8",
}


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map, **MIME)

    def guess_type(self, path):
        ext = os.path.splitext(path)[1].lower()
        return MIME.get(ext) or super().guess_type(path)

    def end_headers(self):
        # Hindari cache lama saat file diperbarui
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        # Tampilkan hanya error agar jendela tetap rapi
        if len(args) > 1 and str(args[1]).startswith(("4", "5")):
            sys.stderr.write("  [!] %s -> %s\n" % (args[0], args[1]))


def find_server(start_port, attempts=30):
    handler = functools.partial(Handler, directory=ROOT)
    http.server.ThreadingHTTPServer.allow_reuse_address = False
    last_err = None
    for port in range(start_port, start_port + attempts):
        try:
            return http.server.ThreadingHTTPServer((HOST, port), handler), port
        except OSError as e:
            last_err = e
            if e.errno in (errno.EADDRINUSE, errno.EACCES, 10048, 10013):
                continue
            raise
    raise OSError("Tidak menemukan port kosong di %d-%d (%s)" % (start_port, start_port + attempts - 1, last_err))


def main():
    ap = argparse.ArgumentParser(description="Server lokal Presentasi 3D")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--no-browser", action="store_true")
    args = ap.parse_args()

    index = os.path.join(ROOT, "index.html")
    if not os.path.isfile(index):
        sys.stderr.write("[X] index.html tidak ditemukan di %s\n    Ekstrak ulang ZIP secara utuh.\n" % ROOT)
        return 1
    missing = [p for p in ("assets/room.glb", "vendor/three/build/three.module.min.js", "js/scene.js", "js/slides.js")
               if not os.path.isfile(os.path.join(ROOT, p))]
    if missing:
        sys.stderr.write("[!] File berikut tidak ada: %s\n    Presentasi tetap dibuka, tetapi ruang 3D mungkin tidak tampil.\n" % ", ".join(missing))

    try:
        httpd, port = find_server(args.port)
    except OSError as e:
        sys.stderr.write("[X] Gagal menjalankan server: %s\n" % e)
        return 1

    url = "http://%s:%d/" % (HOST, port)
    print("")
    print("  Presentasi 3D Divisi AK berjalan di:  %s" % url)
    print("  Folder: %s" % ROOT)
    print("")
    print("  Biarkan jendela ini TETAP TERBUKA selama presentasi.")
    print("  Tekan Ctrl+C (atau tutup jendela) untuk menghentikan server.")
    print("")

    if not args.no_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server dihentikan.")
    finally:
        httpd.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
