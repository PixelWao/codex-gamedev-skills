import importlib.util, json, pathlib, subprocess, sys, tempfile, unittest
P=pathlib.Path(__file__).resolve().parents[1]/'src'/'audit_ui.py'
spec=importlib.util.spec_from_file_location('audit_ui',P);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

def snap(**kw):
  d={'viewport':{'width':390,'height':844,'insets':{'top':44,'bottom':24,'left':0,'right':0}},'controls':[{'id':'btn','rect':{'x':16,'y':60,'width':60,'height':50},'interactive':True,'name':'Play','text':'Play','foreground':'#ffffff','background':'#000000','focusIndicator':True,'keyboardReachable':True,'critical':True}]}
  d.update(kw);return d
class TestAudit(unittest.TestCase):
 def test_valid(self): self.assertTrue(m.audit(snap())['ok'])
 def test_contrast(self): self.assertAlmostEqual(m.contrast_ratio('#000000','#ffffff'),21)
 def test_low_contrast(self):
  s=snap();s['controls'][0]['foreground']='#777777';s['controls'][0]['background']='#888888';self.assertIn('LOW_TEXT_CONTRAST',[e['code'] for e in m.audit(s)['errors']])
 def test_target(self):
  s=snap();s['controls'][0]['rect']['width']=23;self.assertIn('TARGET_TOO_SMALL',[e['code'] for e in m.audit(s)['errors']])
 def test_target_exception_warns(self):
  s=snap();s['controls'][0]['rect']['width']=23;s['controls'][0]['targetException']=True;self.assertTrue(m.audit(s)['ok']);self.assertTrue(m.audit(s)['warnings'])
 def test_pref44_warning(self):
  s=snap();s['controls'][0]['rect']['width']=30;self.assertTrue(m.audit(s)['ok']);self.assertIn('TARGET_BELOW_PREFERRED',[x['code'] for x in m.audit(s)['warnings']])
 def test_overflow(self):
  s=snap();s['controls'][0]['rect']['x']=370;self.assertIn('VIEWPORT_OVERFLOW',[e['code'] for e in m.audit(s)['errors']])
 def test_safe(self):
  s=snap();s['controls'][0]['rect']['y']=12;self.assertIn('SAFE_AREA',[e['code'] for e in m.audit(s)['errors']])
 def test_missing_name(self):
  s=snap();s['controls'][0]['name']='';self.assertIn('MISSING_NAME',[e['code'] for e in m.audit(s)['errors']])
 def test_keyboard(self):
  s=snap();s['controls'][0]['keyboardReachable']=False;self.assertIn('NOT_KEYBOARD_REACHABLE',[e['code'] for e in m.audit(s)['errors']])
 def test_focus(self):
  s=snap();s['controls'][0]['focusIndicator']=False;self.assertIn('NO_FOCUS_INDICATOR',[e['code'] for e in m.audit(s)['errors']])
 def test_duplicate_id(self):
  s=snap();s['controls'].append(dict(s['controls'][0]));self.assertIn('DUPLICATE_ID',[e['code'] for e in m.audit(s)['errors']])
 def test_unbounded_viewport(self): self.assertFalse(m.audit(snap(viewport={'width':0,'height':20}))['ok'])
 def test_clipped_text(self):
  s=snap();s['controls'][0]['textOverflow']=True;self.assertIn('TEXT_OVERFLOW',[e['code'] for e in m.audit(s)['errors']])
 def test_hidden_ignored(self):
  s=snap();s['controls'][0]['visible']=False;s['controls'][0]['name']='';self.assertTrue(m.audit(s)['ok'])
 def test_invalid_color_warning(self):
  s=snap();s['controls'][0]['foreground']='transparent';self.assertTrue(m.audit(s)['ok']);self.assertTrue(m.audit(s)['warnings'])
 def test_cli_exit_success(self):
  with tempfile.TemporaryDirectory() as d:
   f=pathlib.Path(d)/'snapshot.json';f.write_text(json.dumps(snap()));run=subprocess.run([sys.executable,str(P),str(f)],capture_output=True,text=True);self.assertEqual(run.returncode,0,run.stderr)
 def test_cli_exit_failure(self):
  with tempfile.TemporaryDirectory() as d:
   s=snap();s['controls'][0]['name']='';f=pathlib.Path(d)/'snapshot.json';f.write_text(json.dumps(s));run=subprocess.run([sys.executable,str(P),str(f)],capture_output=True,text=True);self.assertEqual(run.returncode,2)
if __name__=='__main__': unittest.main()
