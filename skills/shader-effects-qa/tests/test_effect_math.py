import unittest
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from effect_math import smoothstep,vignette_factor,dissolve_edge,self_test
class TestEffects(unittest.TestCase):
    def test_self_test(self): self.assertTrue(self_test())
    def test_smoothstep_bounds(self):
        self.assertEqual(smoothstep(0,1,-1),0)
        self.assertEqual(smoothstep(0,1,2),1)
        self.assertAlmostEqual(smoothstep(0,1,0.5),0.5)
    def test_nonascending_undefined(self):
        with self.assertRaises(ValueError):smoothstep(0.75,0.2,0.3)
    def test_nan_rejected(self):
        with self.assertRaises(ValueError):smoothstep(0,1,float('nan'))
    def test_center_vignette(self):self.assertEqual(vignette_factor((.5,.5)),1)
    def test_edge_darker(self):self.assertLess(vignette_factor((0,0)),1)
    def test_invalid_vignette(self):
        with self.assertRaises(ValueError):vignette_factor((0,0),inner=.9,outer=.2)
    def test_dissolve_boundary(self):
        self.assertFalse(dissolve_edge(.49,.5,.1)['visible'])
        self.assertTrue(dissolve_edge(.5,.5,.1)['visible'])
        self.assertEqual(dissolve_edge(.5,.5,.1)['edge_mix'],0)
    def test_dissolve_invalid(self):
        with self.assertRaises(ValueError):dissolve_edge(.5,.5,0)
if __name__=='__main__':unittest.main()
