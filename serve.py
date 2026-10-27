"""Local preview server with clean URLs: /play opens play/index.html.
Run:  python3 serve.py      then open http://localhost:8000
"""
import http.server, os, socketserver
ROOT = os.path.dirname(os.path.abspath(__file__))
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def do_GET(self):
        path = self.path.split('?')[0].split('#')[0]
        if path != '/' and not os.path.splitext(path)[1]:
            folder = os.path.join(ROOT, path.strip('/'))
            if os.path.isfile(os.path.join(folder, 'index.html')):
                qs = self.path[len(path):]
                self.path = path.rstrip('/') + '/index.html' + qs
        return super().do_GET()
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('', 8000), H) as s:
    print('ARC site on http://localhost:8000  (Ctrl+C to stop)'); s.serve_forever()
