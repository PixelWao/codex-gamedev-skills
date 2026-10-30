import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import levelgen as g
import constraint_tiles as c

class LevelTests(unittest.TestCase):
    def test_replay_rooms(self): self.assertEqual(g.generate('x'),g.generate('x'))
    def test_replay_cave(self): self.assertEqual(g.generate('x',mode='cave'),g.generate('x',mode='cave'))
    def test_distinct_seed(self):
        self.assertNotEqual(g.generate('x')['grid'],g.generate('y')['grid'])
    def test_many_rooms(self):
        for seed in range(20):
            a=g.generate(seed,width=40,height=28)
            self.assertTrue(g.validate_grid(a['grid'],tuple(a['spawn']),tuple(a['exit'])),seed)
    def test_many_caves(self):
        for seed in range(10):
            a=g.generate(seed,width=32,height=24,mode='cave',target=.25)
            self.assertTrue(g.validate_grid(a['grid'],tuple(a['spawn']),tuple(a['exit'])),seed)
    def test_cave_budget_exhaust(self):
        with self.assertRaises(RuntimeError):g.cave('x',20,20,target=.7,max_steps=1)
    def test_invalid_target(self):
        with self.assertRaises(ValueError):g.cave('x',12,12,target=1.1)
    def test_rooms_too_large(self):
        with self.assertRaises(ValueError):g.generate('x',10,10,min_room=9)
    def test_fail_zero_attempts(self):
        with self.assertRaises(ValueError):g.generate('x',attempts=0)
    def test_disconnect_detection(self):
        self.assertFalse(g.validate_grid(['.#.','###','.#.'],(0,0),(2,2)))
    def test_outside_start(self):
        self.assertFalse(g.validate_grid(['...','...'],(4,0),(0,0)))
    def test_csp_local_validity(self):
        for seed in range(7):
            a=c.solve(5,4,seed)
            self.assertTrue(c.check_layout(a['tiles']))
    def test_csp_replay(self):self.assertEqual(c.solve(5,5,'same'),c.solve(5,5,'same'))
    def test_csp_impossible_boundary(self):
        with self.assertRaises(ValueError):c.solve(1,1,'x',{'0,0':'n'})
    def test_csp_invalid_fixed(self):
        with self.assertRaises(ValueError):c.solve(4,4,'x',{'5,5':'ew'})
    def test_csp_budget(self):
        with self.assertRaises(RuntimeError):c.solve(8,8,'x',max_nodes=1)
    def test_cli(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'level.json'
            subprocess.run([sys.executable,g.__file__,'--seed','55','--output',str(p)],check=True)
            self.assertEqual(json.loads(p.read_text())['kind'],'level')
    def test_tiles_cli(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'tiles.json'
            subprocess.run([sys.executable,c.__file__,'--seed','55','--output',str(p)],check=True)
            self.assertEqual(json.loads(p.read_text())['schema'],'pcg-constraint-tiles-v1')

if __name__=='__main__':unittest.main()
