import tempfile, pathlib, sys, unittest, zipfile
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'src'))
from release import collect,package
class ReleaseTests(unittest.TestCase):
 def setUp(self):
  self.t=tempfile.TemporaryDirectory();self.addCleanup(self.t.cleanup);self.root=pathlib.Path(self.t.name)/'build';self.root.mkdir();(self.root/'index.html').write_text('<script src="game.js"></script>');(self.root/'game.js').write_text('console.log("ok")')
 def test_valid(self):self.assertFalse(collect(self.root)['errors'])
 def test_missing_entry(self):
  (self.root/'index.html').unlink();self.assertIn('index.html missing',collect(self.root)['errors'][0])
 def test_missing_asset(self):
  (self.root/'game.js').unlink();self.assertTrue(any('missing asset' in s for s in collect(self.root)['errors']))
 def test_absolute_ref(self):
  (self.root/'index.html').write_text('<script src="/game.js"></script>');self.assertTrue(any('absolute' in s for s in collect(self.root)['errors']))
 def test_external_ref_warns(self):
  (self.root/'index.html').write_text('<script src="https://cdn.example/js"></script>');self.assertTrue(collect(self.root)['warnings'])
 def test_deterministic_zip(self):
  out1=pathlib.Path(self.t.name)/'a.zip';out2=pathlib.Path(self.t.name)/'b.zip';a=package(self.root,out1);b=package(self.root,out2);self.assertEqual(a['sha256'],b['sha256'])
 def test_zip_root_entry(self):
  out=pathlib.Path(self.t.name)/'r.zip';package(self.root,out);self.assertIn('index.html',zipfile.ZipFile(out).namelist())
 def test_no_output_inside_build(self):
  with self.assertRaises(ValueError):package(self.root,self.root/'game.zip')
 def test_case_collision(self):
  (self.root/'GAME.JS').write_text('x');self.assertTrue(any('collision' in e for e in collect(self.root)['errors']))
 def test_symlink(self):
  target=pathlib.Path(self.t.name)/'secret.txt';target.write_text('secret');(self.root/'link.js').symlink_to(target);self.assertTrue(any('symlink' in e for e in collect(self.root)['errors']))
 def test_css_asset(self):
  (self.root/'index.html').write_text('<link href="style.css" rel="stylesheet">');(self.root/'style.css').write_text('body{background:url(missing.png)}');self.assertTrue(any('missing asset' in e for e in collect(self.root)['errors']))
 def test_report_has_hashes(self):
  out=pathlib.Path(self.t.name)/'r.zip';r=package(self.root,out);self.assertIn('index.html',r['file_hashes'])
if __name__=='__main__':unittest.main()
