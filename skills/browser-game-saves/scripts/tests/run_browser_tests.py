"""Serve the example skill locally and run Chromium in headless mode; no packages."""
import http.server
import json
import re
import shutil
import subprocess
import tempfile
import threading
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,fmt,*args):pass


def main():
    binary=next((x for x in ('chromium','chromium-browser','google-chrome','chrome') if shutil.which(x)),None)
    if binary is None:raise SystemExit('SKIPPED: install Chromium/Chrome to run real IndexedDB tests')
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
    th=threading.Thread(target=server.serve_forever,daemon=True);th.start()
    try:
        url=f'http://127.0.0.1:{server.server_port}/scripts/tests/browser_tests.html'
        with tempfile.TemporaryDirectory(prefix='browser-saves-test-') as profile:
            args=[binary,'--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--disable-background-networking',f'--user-data-dir={profile}','--virtual-time-budget=14000','--dump-dom',url]
            result=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=40)
            matches=re.findall(r'BROWSER_TEST_RESULTS (\{.*?\})</main>',result.stdout,re.DOTALL)
            if not matches:
                print('CHROMIUM STDOUT:',result.stdout[-1000:]);print('CHROMIUM STDERR:',result.stderr[-1000:]);raise SystemExit('Headless browser tests did not finish')
            from html import unescape
            data=json.loads(unescape(matches[-1]))
            print(json.dumps(data,ensure_ascii=False,indent=2))
            if data['pass']!=data['total']:raise SystemExit(1)
    finally:server.shutdown();server.server_close()

if __name__=='__main__':main()
