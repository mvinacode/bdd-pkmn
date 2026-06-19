#!/usr/bin/env python3
"""Serveur de dev local qui désactive le cache navigateur.

`python -m http.server` n'envoie que `Last-Modified` (pas de `Cache-Control`),
ce qui déclenche le cache heuristique du navigateur : il ressert l'ancien
index.html sans revalider, et les bumps `?v=` ne sont jamais redemandés.
Ici on force `Cache-Control: no-store` pour toujours servir la dernière version.

Usage : python dev-server.py [port]   (défaut : 8080)
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    server = ThreadingHTTPServer(("127.0.0.1", port), NoCacheHandler)
    print(f"Dev server (no-cache) sur http://127.0.0.1:{port}/")
    server.serve_forever()
