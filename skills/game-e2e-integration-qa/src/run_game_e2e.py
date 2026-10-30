"""Local Playwright gameplay smoke runner. MIT © 2026 Waldemar Soroka."""
import argparse, asyncio, json, re, traceback, os
from pathlib import Path
from urllib.parse import urlsplit, urljoin
from scenario import load_scenario

async def execute(page, step, artifacts):
    action=step['action']
    if action=='goto': await page.goto(urljoin(page.url,step.get('path','/')),wait_until='domcontentloaded')
    elif action=='click': await page.locator(step['selector']).click(timeout=5000)
    elif action=='tap': await page.locator(step['selector']).tap(timeout=5000)
    elif action=='key_down': await page.keyboard.down(step['key'])
    elif action=='key_up': await page.keyboard.up(step['key'])
    elif action=='wait': await page.wait_for_timeout(step['ms'])
    elif action=='assert_text':
        actual=await page.locator(step['selector']).inner_text(timeout=5000)
        if step.get('contains','') not in actual: raise AssertionError(f'text mismatch: {actual[:200]!r}')
    elif action=='assert_js':
        if not await page.evaluate(step['expression']): raise AssertionError('JS probe returned falsy')
    elif action=='screenshot':
        target=artifacts/(step.get('name','step')+'.png');await page.screenshot(path=str(target),full_page=False)
    elif action=='mouse_move':
        await page.mouse.move(float(step['x']),float(step['y']))

async def run(args):
    from playwright.async_api import async_playwright
    scenario=load_scenario(args.scenario)
    url=urlsplit(args.url)
    if url.scheme!='http' or url.hostname not in ('localhost','127.0.0.1') or not url.port:
        raise ValueError('only explicit local HTTP servers are allowed, e.g. http://127.0.0.1:8000/')
    artifacts=Path(args.output).resolve();artifacts.mkdir(parents=True,exist_ok=True)
    failed=[];errors=[];steps=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=not args.headed, executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or None)
        context=await browser.new_context(viewport=scenario['viewport'],reduced_motion=scenario.get('reduced_motion','reduce'),has_touch=any(s['action']=='tap' for s in scenario['steps']))
        page=await context.new_page()
        page.on('pageerror',lambda e:errors.append(str(e)))
        await page.goto(args.url,wait_until='domcontentloaded')
        for i, step in enumerate(scenario['steps']):
            try:
                await execute(page,step,artifacts);steps.append({'index':i,'action':step['action'],'status':'PASS'})
            except Exception as e:
                failed.append({'index':i,'action':step['action'],'reason':str(e)})
                steps.append({'index':i,'action':step['action'],'status':'FAIL'})
                try:await page.screenshot(path=str(artifacts/'failure.png'))
                except Exception:pass
                break
        await context.close();await browser.close()
    result={'status':'PASS' if not failed and not errors else 'FAIL','steps':steps,'failures':failed,'page_errors':errors,'url':args.url}
    (artifacts/'result.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    print(json.dumps(result,indent=2))
    return 0 if result['status']=='PASS' else 1

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--url',required=True,help='Local HTTP game URL')
    parser.add_argument('--scenario',required=True)
    parser.add_argument('--output',default='game-e2e-output')
    parser.add_argument('--headed',action='store_true')
    a=parser.parse_args()
    try:raise SystemExit(asyncio.run(run(a)))
    except Exception as exc:
        print(f'E2E runner error: {exc}');raise SystemExit(2)
