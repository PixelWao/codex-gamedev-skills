"""Real headless browser smoke test; optional if Chromium is unavailable."""
import pathlib,sys,unittest,tempfile,asyncio,os
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'src'))
from run_game_e2e import execute

class BrowserSmoke(unittest.TestCase):
 def test_local_page_without_network(self):
  try:from playwright.async_api import async_playwright
  except ImportError:self.skipTest('Playwright dependency not installed')
  async def runner():
   async with async_playwright() as p:
    browser=await p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or None)
    try:
     page=await browser.new_page(viewport={'width':800,'height':600})
     html=(pathlib.Path(__file__).resolve().parents[1]/'examples/demo.html').read_text()
     await page.set_content(html)
     with tempfile.TemporaryDirectory() as tmp:
      for step in [{'action':'assert_text','selector':'#status','contains':'ready'},{'action':'click','selector':'#start'},{'action':'assert_js','expression':'window.gameProbe().playing'},{'action':'screenshot','name':'test'}]:
       await execute(page,step,pathlib.Path(tmp))
      self.assertTrue((pathlib.Path(tmp)/'test.png').is_file())
    finally:await browser.close()
  try:asyncio.run(runner())
  except Exception as exc:
   # Browser availability is optional in installed skill, but missing installation must not be misreported as tested.
   msg=str(exc).lower()
   if 'executable doesn\'t exist' in msg or 'browserType.launch' in str(exc):self.skipTest('Chromium browser missing')
   raise
