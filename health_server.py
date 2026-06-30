"""
Minimal HTTP health-check server for the Celery worker container.

Railway's healthcheck hits GET /api/users/health/ and expects a 2xx.
Celery doesn't serve HTTP, so this tiny server handles that check.
Runs as a background process alongside Celery (started from start.sh).
"""
import os
import time
from http.server import BaseHTTPRequestHandler, HTTPServer


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"status":"ok","service":"celery-worker"}')

    def log_message(self, *args):
        pass  # suppress per-request access logs


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    server = HTTPServer(("0.0.0.0", port), HealthHandler)
    print(f"Health server listening on :{port}", flush=True)
    server.serve_forever()
