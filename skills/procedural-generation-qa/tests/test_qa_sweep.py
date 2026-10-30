import json
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import qa_sweep as q

LEVEL = {'schema':'pcg-map-v1','kind':'level','algorithm':'test-v1','seed':'7',
 'metadata':{'width':5,'height':3},'grid':['#####','#...#','#####'],
 'spawn':[1,1], 'exit':[3,1]}

def clone(obj):return json.loads(json.dumps(obj))

class QATests(unittest.TestCase):
    def test_valid_level(self):
        r=q.evaluate(LEVEL);self.assertTrue(r['success']);self.assertEqual(r['path_steps'],2)
    def test_short_path_threshold(self):
        r=q.evaluate(LEVEL,min_path=3);self.assertFalse(r['success'])
    def test_disconnected(self):
        a=clone(LEVEL);a['grid']=['#####','#.#.#','#####']
        self.assertFalse(q.evaluate(a)['success'])
    def test_door_with_key(self):
        a=clone(LEVEL);a['grid']=['#####','#KDE#','#####']
        self.assertTrue(q.evaluate(a)['success'])
    def test_no_key(self):
        a=clone(LEVEL);a['grid']=['#####','#.DE#','#####']
        self.assertFalse(q.evaluate(a)['success'])
    def test_key_behind_door(self):
        a=clone(LEVEL);a['grid']=['######','#.DKE#','######']
        a['metadata']['width']=6;a['exit']=[4,1]
        self.assertFalse(q.evaluate(a)['success'])
    def test_broken_shape(self):
        a=clone(LEVEL);a['grid'][2]='##'
        with self.assertRaises(ValueError):q.evaluate(a)
    def test_invalid_char(self):
        a=clone(LEVEL);a['grid'][1]='#?###'
        with self.assertRaises(ValueError):q.evaluate(a)
    def test_bad_start(self):
        a=clone(LEVEL);a['spawn']=[0,0]
        with self.assertRaises(ValueError):q.evaluate(a)
    def test_nan_scalar(self):
        a={'schema':'pcg-map-v1','kind':'world','metadata':{'width':1,'height':1},
           'grid':['W'],'heightfield':[[float('nan')]],'moisture':[[0.2]]}
        with self.assertRaises(ValueError):q.evaluate(a)
    def test_world_valid(self):
        a={'schema':'pcg-map-v1','kind':'world','metadata':{'width':2,'height':2},
           'grid':['WW','DG'],'heightfield':[[.1,.2],[.3,.4]],'moisture':[[.5,.6],[.7,.8]]}
        self.assertTrue(q.evaluate(a)['success'])
    def test_fingerprint_ignore_seed(self):
        a=clone(LEVEL);a['seed']='other'
        self.assertEqual(q.digest(a),q.digest(LEVEL))
    def test_duplicates(self):
        a=q.audit([('one',LEVEL),('two',LEVEL)],max_duplicate_rate=0)
        self.assertEqual(a['verdict'],'FAIL');self.assertEqual(a['duplicate_rate'],.5)
    def test_fail_rate(self):
        a=q.audit([('one',LEVEL),('bad',{'error':'not a map'})])
        self.assertEqual(a['failed'],1)
    def test_percentile(self):
        self.assertEqual(q.percentile([1,2,3,4],50),2.5)
    def test_read_json(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'level.json';p.write_text(json.dumps(LEVEL))
            self.assertEqual(q.read_map(p)['kind'],'level')
    def test_run_generator_integration(self):
        level_script=Path(__file__).resolve().parents[2]/'procedural-level-design'/'scripts'/'levelgen.py'
        # Standalone QA must not rely on siblings for its ordinary functions;
        # optional cross-skill integration is tested separately by release validator.
        self.assertTrue(q.evaluate(LEVEL)['success'])
    def test_evaluate_empty_grid(self):
        a=clone(LEVEL);a['grid']=[]
        with self.assertRaises(ValueError):q.evaluate(a)
    def test_no_shell_in_source(self):
        import inspect
        self.assertIn('subprocess.run(cmd,',inspect.getsource(q.run_generator))
        self.assertNotIn('shell=True',inspect.getsource(q.run_generator))

if __name__=='__main__':unittest.main()
