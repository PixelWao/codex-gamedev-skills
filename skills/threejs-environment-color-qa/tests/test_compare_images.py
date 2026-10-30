import importlib.util
from pathlib import Path
import tempfile
import unittest
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('compare_images',ROOT/'scripts/compare_images.py')
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class CompareTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.a=Path(self.tmp.name)/'a.png';self.b=Path(self.tmp.name)/'b.png'
    def save(self,a,b,size=(2,2)):
        Image.new('RGB',size,a).save(self.a);Image.new('RGB',size,b).save(self.b)
    def test_identical(self):
        self.save((2,3,4),(2,3,4))
        r=mod.compare_images(str(self.a),str(self.b));self.assertEqual(r['mae'],0);self.assertEqual(r['changed_pct'],0)
    def test_exact_different(self):
        self.save((0,0,0),(255,0,0))
        r=mod.compare_images(str(self.a),str(self.b),pixel_diff=20)
        self.assertAlmostEqual(r['mae'],85)
        self.assertAlmostEqual(r['rmse'],(255*255/3)**0.5)
        self.assertEqual(r['changed_pct'],100)
    def test_threshold(self):
        self.save((0,0,0),(20,20,20))
        self.assertEqual(mod.compare_images(str(self.a),str(self.b),pixel_diff=20)['changed_pct'],0)
        self.assertEqual(mod.compare_images(str(self.a),str(self.b),pixel_diff=19)['changed_pct'],100)
    def test_sizes(self):
        self.save((0,0,0),(0,0,0))
        Image.new('RGB',(1,1)).save(self.b)
        with self.assertRaisesRegex(ValueError,'size mismatch'):mod.compare_images(str(self.a),str(self.b))
    def test_bad_threshold(self):
        self.save((0,0,0),(0,0,0))
        with self.assertRaises(ValueError):mod.compare_images(str(self.a),str(self.b),pixel_diff=256)

if __name__=='__main__':unittest.main()
