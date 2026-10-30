import json
import math
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import worldgen as w

class WorldTest(unittest.TestCase):
    def test_repeatable(self):
        self.assertEqual(w.generate('same',20,12), w.generate('same',20,12))
    def test_distinct_seeds(self):
        self.assertNotEqual(w.generate('A',25,20)['heightfield'],w.generate('B',25,20)['heightfield'])
    def test_seed_domain(self):
        self.assertNotEqual(w.seed_key(2,'moisture'),w.seed_key(2,'elevation'))
    def test_negative_infinite(self):
        m=w.generate('z',8,8,-20,-11,shape='infinite')
        self.assertEqual(len(m['grid']),8)
    def test_chunk_equals_full(self):
        full=w.generate('abc',32,24,world_width=32,world_height=24)
        tile=w.generate('abc',11,7,7,10,world_width=32,world_height=24)
        for y in range(7):
            self.assertEqual(tile['grid'][y],full['grid'][10+y][7:18])
            self.assertEqual(tile['heightfield'][y],full['heightfield'][10+y][7:18])
            self.assertEqual(tile['moisture'][y],full['moisture'][10+y][7:18])
    def test_split_chunk_infinite(self):
        full=w.generate('b',12,6,-6,-3,shape='infinite')
        a=w.generate('b',6,6,-6,-3,shape='infinite')
        b=w.generate('b',6,6,0,-3,shape='infinite')
        for i in range(6):
            self.assertEqual(full['grid'][i],a['grid'][i]+b['grid'][i])
    def test_valid_scalar(self):
        o=w.generate('numeric',22,13)
        for field in ('heightfield','moisture'):
            self.assertTrue(all(0<=z<=1 and math.isfinite(z) for row in o[field] for z in row))
    def test_shore(self):
        self.assertEqual(w.biome(.46,.3,.5,.48),'S')
    def test_bad_bounds(self):
        with self.assertRaises(ValueError):w.generate('s',0,9)
    def test_beyond_world(self):
        with self.assertRaises(ValueError):w.generate('s',10,10,20,0,world_width=25)
    def test_nan_sea_level(self):
        with self.assertRaises(ValueError):w.generate('s',10,10,sea_level=float('nan'))
    def test_bad_fbm(self):
        with self.assertRaises(ValueError):w.fbm(0,1,1,scale=0)
    def test_budget(self):
        with self.assertRaises(ValueError):w.generate('s',512,512,shape='infinite')
    def test_no_jagged(self):
        o=w.generate('x',23,17);self.assertTrue(all(len(row)==23 for row in o['grid']))
    def test_cli(self):
        with tempfile.TemporaryDirectory() as d:
            target=Path(d)/'w.json'
            subprocess.run([sys.executable,str(Path(w.__file__)),'--seed','h','--width','12','--height','11',
                            '--output',str(target)],check=True,stdout=subprocess.PIPE)
            self.assertEqual(json.loads(target.read_text())['schema'],'pcg-map-v1')

if __name__=='__main__':unittest.main()
