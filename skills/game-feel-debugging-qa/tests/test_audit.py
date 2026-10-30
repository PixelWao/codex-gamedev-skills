import sys,json,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'src'))
from feel_qa import audit,load_trace

def e(t,ms,**kw):return {'type':t,'atMs':ms,**kw}
class QA(unittest.TestCase):
 def test_valid(self):self.assertTrue(audit([e('hitstop_start',0,eventId='a',untilMs=40),e('feedback_accepted',0,eventId='a',channels=['audio']),e('hitstop_end',40,eventId='a')])['ok'])
 def test_duplicate(self):self.assertFalse(audit([e('feedback_accepted',0,eventId='a'),e('feedback_accepted',1,eventId='a')])['ok'])
 def test_unfinished(self):self.assertFalse(audit([e('hitstop_start',0,eventId='a',untilMs=20)])['ok'])
 def test_orphan_end(self):self.assertFalse(audit([e('hitstop_end',0,eventId='a')])['ok'])
 def test_extended(self):self.assertTrue(audit([e('hitstop_start',0,eventId='a',untilMs=20),e('hitstop_extended',5,eventId='a',untilMs=60),e('hitstop_end',60,eventId='a')])['ok'])
 def test_missing_start(self):self.assertFalse(audit([e('hitstop_extended',0,eventId='a',untilMs=50)])['ok'])
 def test_flash_flag(self):self.assertFalse(audit([e('feedback_accepted',0,eventId='a',allowFlashes=False,channels=['flash'])])['ok'])
 def test_motion_flag(self):self.assertFalse(audit([e('feedback_accepted',0,eventId='a',reducedMotion=True,channels=['shake'])])['ok'])
 def test_event_budget(self):self.assertGreater(audit([e('feedback_accepted',i,eventId=str(i)) for i in range(6)],max_events_100ms=2)['warnings'],0)
 def test_particle_budget(self):self.assertGreater(audit([e('feedback_accepted',i,eventId=str(i),particles=20) for i in range(6)],max_particles_100ms=20)['warnings'],0)
 def test_nonfinite(self):self.assertFalse(audit([e('camera_delta',0,x=1,y=2,roll='NaN')])['ok'])
 def test_vfx_overflow(self):self.assertFalse(audit([e('vfx_batch',0,active=3,capacity=2)])['ok'])
 def test_out_of_order(self):self.assertFalse(audit([e('vfx_batch',5,active=1,capacity=2),e('vfx_batch',4,active=1,capacity=2)])['ok'])
 def test_too_long_warning(self):self.assertGreater(audit([e('hitstop_start',0,eventId='a',untilMs=1000),e('hitstop_end',1000,eventId='a')])['warnings'],0)
 def test_jsonl_reader(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'x.jsonl';p.write_text(json.dumps(e('feedback_accepted',0,eventId='a'))+'\n');self.assertEqual(len(load_trace(p)),1)
 def test_json_reader(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'x.json';p.write_text(json.dumps({'events':[e('feedback_accepted',0,eventId='a')]}));self.assertEqual(len(load_trace(p)),1)
 def test_csv_reader(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'x.csv';p.write_text('type,atMs,eventId,channels\nfeedback_accepted,0,a,audio|shake\n');self.assertEqual(load_trace(p)[0]['channels'],['audio','shake'])
 def test_invalid_limits(self):
  with self.assertRaises(ValueError):audit([],max_events_100ms=-1)
if __name__=='__main__':unittest.main()
