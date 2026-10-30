import tempfile
import unittest
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from compare_images import compare,load_image

def ppm(path,rgb,w=2,h=2):path.write_bytes(f'P6\n{w} {h}\n255\n'.encode()+bytes(rgb))
class TestImageQA(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.a=Path(self.temp.name)/'a.ppm';self.b=Path(self.temp.name)/'b.ppm'
        self.original=bytes([0,0,0,10,10,10,20,20,20,30,30,30]);ppm(self.a,self.original)
    def test_identical_pass(self):
        ppm(self.b,self.original)
        r=compare(self.a,self.b)
        self.assertEqual(r['status'],'PASS');self.assertEqual(r['mae'],0)
    def test_different_fails(self):
        payload=bytearray(self.original);payload[0]=255;ppm(self.b,payload)
        r=compare(self.a,self.b)
        self.assertEqual(r['status'],'FAIL');self.assertEqual(r['max_channel_delta'],255)
        self.assertAlmostEqual(r['fraction_changed_pixels'],0.25)
    def test_threshold(self):
        payload=bytearray(self.original);payload[0]=5;ppm(self.b,payload)
        r=compare(self.a,self.b,delta=5,allowed_mae=1.0)
        self.assertEqual(r['status'],'PASS')
    def test_mismatched_size(self):
        ppm(self.b,self.original[:6],w=1,h=2)
        with self.assertRaises(ValueError):compare(self.a,self.b)
    def test_truncated_ppm(self):
        self.b.write_bytes(b'P6\n2 2\n255\nxxx')
        with self.assertRaises(ValueError):load_image(self.b)
    def test_invalid_threshold(self):
        ppm(self.b,self.original)
        with self.assertRaises(ValueError):compare(self.a,self.b,allowed_changed=2)
    def test_ppm_comment_header(self):
        self.b.write_bytes(b'P6\n# comment\n1 1\n255\n\x01\x02\x03')
        self.assertEqual(load_image(self.b)[:3],(1,1,3))
if __name__=='__main__':unittest.main()
