#!/usr/bin/env python3
"""Local development server simulating GitHub Pages behavior."""

import http.server
import mimetypes
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 8080


class DevHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def guess_type(self, path):
        ext = os.path.splitext(path)[1]
        overrides = {
            ".webp": "image/webp",
            ".m4a": "audio/mp4",
            ".lrc": "text/plain",
            ".srs": "application/octet-stream",
        }
        return overrides.get(ext) or mimetypes.guess_type(path)[0] or "application/octet-stream"

    def do_GET(self):
        path = self.path.split("?")[0].split("#")[0]
        if os.path.isdir(os.path.join(ROOT, path.lstrip("/").rstrip("/"))):
            if not path.endswith("/"):
                self.send_response(301)
                self.send_header("Location", path + "/")
                self.end_headers()
                return
            index = os.path.join(ROOT, path.lstrip("/").rstrip("/"), "index.html")
            if os.path.isfile(index):
                self.path = path.rstrip("/") + "/index.html"
        return super().do_GET()

    def log_message(self, format, *args):
        print(f"  [{self.command}] {args[0]}", flush=True)


if __name__ == "__main__":
    addr = ("0.0.0.0", PORT)
    server = http.server.HTTPServer(addr, DevHandler)
    print(f"Serving {ROOT} at http://localhost:{PORT}", flush=True)
    print("Press Ctrl+C to stop\n", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.", flush=True)
        server.server_close()
