#!/usr/bin/env python3
"""Serveur local sans dépendance pour EP-133 KO II Studio."""

from __future__ import annotations

import argparse
import http.server
import pathlib
import socketserver
import webbrowser


ROOT = pathlib.Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser(description="Lance EP-133 KO II Studio en local")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8787, type=int)
    parser.add_argument("--open", action="store_true", help="ouvre le navigateur")
    args = parser.parse_args()

    handler = lambda *a, **kw: http.server.SimpleHTTPRequestHandler(*a, directory=str(ROOT), **kw)
    class ReusableServer(socketserver.TCPServer):
        allow_reuse_address = True
    with ReusableServer((args.host, args.port), handler) as server:
        address = f"http://{args.host}:{args.port}/docs/ep133-pad-player.html"
        print("EP-133 KO II Studio est prêt : " + address)
        print("Arrêter : Ctrl+C")
        if args.open:
            webbrowser.open(address)
        server.serve_forever()


if __name__ == "__main__":
    main()
