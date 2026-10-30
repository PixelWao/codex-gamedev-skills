import json
import pathlib
import tempfile
import unittest
import sys
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
from camera_trace_qa import evaluate,read_records,main
class CameraQATest(unittest.TestCase):
    def rows(self, n=10): return [{'t':i/60,'target':{'x':i/60,'y':0},'camera':{'x':i/60,'y':0}} for i in range(n)]
    def test_stationary_perfect(self): self.assertTrue(evaluate(self.rows(),max_follow_error=.1,max_speed=2)['passed'])
    def test_follow_error(self):
        r=self.rows();r[4]['camera']['x']=10;rep=evaluate(r,max_follow_error=1);self.assertFalse(rep['passed'])
    def test_speed(self):
        r=self.rows();r[4]['camera']['x']=10;self.assertFalse(evaluate(r,max_speed=50)['passed'])
    def test_jitter(self):
        r=self.rows();r[4]['camera']['x']=10;self.assertFalse(evaluate(r,max_jitter=1)['passed'])
    def test_teleport_grace(self):
        r=self.rows();r[4]['target']['x']=100;r[4]['camera']['x']=100;r[4]['teleport']=True
        r[5]['target']['x']=100;r[5]['camera']['x']=100
        self.assertTrue(evaluate(r,max_speed=15,teleport_grace=1)['passed'])
    def test_bounds_normal(self):
        r=[{'t':0,'target':{'x':50,'y':50},'camera':{'x':50,'y':50}}]
        b={'minX':0,'maxX':200,'minY':0,'maxY':200}
        self.assertTrue(evaluate(r,bounds=b,viewport={'width':100,'height':100})['passed'])
        r[0]['camera']['x']=10
        self.assertFalse(evaluate(r,bounds=b,viewport={'width':100,'height':100})['passed'])
    def test_bounds_small_level(self):
        b={'minX':0,'maxX':60,'minY':0,'maxY':60}
        r=[{'t':0,'target':{'x':40,'y':40},'camera':{'x':30,'y':30}}]
        self.assertTrue(evaluate(r,bounds=b,viewport={'width':200,'height':200})['passed'])
    def test_occlusion(self):
        r=self.rows();r[0]['occluded']=True
        self.assertFalse(evaluate(r,max_occlusion_rate=.05)['passed'])
    def test_bad_timestamps(self):
        r=self.rows();r[1]['t']=0
        with self.assertRaises(ValueError):evaluate(r)
    def test_nan(self):
        r=self.rows();r[0]['target']['x']=float('nan')
        with self.assertRaises(ValueError):evaluate(r)
    def test_3d(self):
        r=[{'t':0,'target':{'x':0,'y':0,'z':0},'camera':{'x':0,'y':0,'z':0}}]
        self.assertTrue(evaluate(r,dim=3)['passed'])
    def test_empty(self):
        with self.assertRaises(ValueError):evaluate([])
    def test_csv_and_jsonl_cli(self):
        with tempfile.TemporaryDirectory() as d:
            p=pathlib.Path(d)/'test.jsonl';p.write_text('\n'.join(json.dumps(x) for x in self.rows()))
            self.assertEqual(len(read_records(p)),10)
            self.assertEqual(main([str(p),'--max-follow-error','0.1','--output',str(pathlib.Path(d)/'report.json')]),0)
            q=pathlib.Path(d)/'test.csv';q.write_text('t,target_x,target_y,camera_x,camera_y\n0,0,0,0,0\n1,1,0,1,0\n')
            self.assertEqual(len(read_records(q)),2)
    def test_bad_schema(self):
        with self.assertRaises(ValueError):evaluate([{'t':0,'target':{},'camera':{}}])
    def test_invalid_threshold(self):
        with self.assertRaises(ValueError):evaluate(self.rows(),max_speed=-1)
    def test_timestamp_not_monotone(self):
        r=self.rows();r[5]['t']=r[4]['t']
        with self.assertRaises(ValueError):evaluate(r)
if __name__=='__main__':unittest.main()
