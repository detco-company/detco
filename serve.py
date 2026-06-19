#!/usr/bin/env python3
"""
Deepak Trading Corporation — Single-command local development server.
Run: python3 serve.py
Opens: http://localhost:8080
"""
import http.server
import socketserver
import socket
import os
import webbrowser

START_PORT = 8080
MAX_PORT = 8090
DIR = os.path.dirname(os.path.abspath(__file__))   # same folder as this script

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    # Silence normal GET log noise — keep only errors
    def log_message(self, fmt, *args):
        try:
            if int(args[1]) >= 400:
                super().log_message(fmt, *args)
        except (IndexError, ValueError):
            super().log_message(fmt, *args)


def find_free_port(start=START_PORT, end=MAX_PORT):
    for port in range(start, end + 1):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind(("", port))
                return port
            except OSError:
                continue
    raise OSError(f"No available ports between {start} and {end}")

PORT = find_free_port()
socketserver.TCPServer.allow_reuse_address = True

print("╔══════════════════════════════════════════════════╗")
print("║   Deepak Trading Corporation — Dev Server        ║")
if PORT == START_PORT:
    print(f"║   http://localhost:{PORT}                          ║")
else:
    print(f"║   http://localhost:{PORT} (port {START_PORT} busy) ║")
print("║   Press  Ctrl+C  to stop                         ║")
print("╚══════════════════════════════════════════════════╝")

webbrowser.open(f"http://localhost:{PORT}")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
