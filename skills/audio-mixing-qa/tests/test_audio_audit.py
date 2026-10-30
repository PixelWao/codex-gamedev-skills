import math
import sys
import tempfile
import unittest
import wave
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from audio_audit import audit_wav,ffmpeg_ebur128
from audio_event_qa import audit_events

class AudioAuditTests(unittest.TestCase):
    def setUp(self): self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
    def wav(self,data,rate=8000,channels=1):
        import struct
        path=Path(self.tmp.name)/'test.wav'
        with wave.open(str(path),'wb') as w:
            w.setnchannels(channels);w.setsampwidth(2);w.setframerate(rate)
            w.writeframes(struct.pack('<'+'h'*len(data),*data))
        return path
    def test_silence(self): self.assertIn('SILENT_OR_NEAR_SILENT',audit_wav(self.wav([0]*100))['warnings'])
    def test_pcm_sine(self):
        p=self.wav([int(math.sin(i*2*math.pi/40)*10000) for i in range(800)])
        d=audit_wav(p);self.assertAlmostEqual(d['seconds'],.1);self.assertLess(d['sample_peak_dbfs'],0)
    def test_clipping_warning(self): self.assertIn('HIGH_SAMPLE_PEAK_NOT_TRUE_PEAK',audit_wav(self.wav([32767,-32768]*200))['warnings'])
    def test_dc(self): self.assertIn('DC_OFFSET',audit_wav(self.wav([5000]*200))['warnings'])
    def test_loop_jump(self): self.assertIn('LOOP_EDGE_DISCONTINUITY_CANDIDATE',audit_wav(self.wav([-28000]+[0]*50+[28000]))['warnings'])
    def test_empty(self):
        p=self.wav([])
        with self.assertRaises(ValueError):audit_wav(p)
    def test_bad_file(self):
        p=Path(self.tmp.name)/'bad.wav';p.write_bytes(b'not-wav')
        with self.assertRaises((EOFError, wave.Error)):audit_wav(p)
    def test_ffmpeg_optional(self):
        p=self.wav([0]*8000)
        result=ffmpeg_ebur128(p)
        self.assertIn('available',result)
    def test_event_trace_clean(self):
        e=[{'time':0,'event':'voice_start','id':'a'},{'time':.2,'event':'voice_end','id':'a'}]
        self.assertEqual(audit_events(e)['errors'],0)
    def test_duplicate(self):
        e=[{'time':0,'event':'voice_start','id':'a'},{'time':.1,'event':'voice_start','id':'a'}]
        self.assertIn('DUPLICATE_START',[i['code'] for i in audit_events(e)['issues']])
    def test_orphan_stop(self):self.assertIn('ORPHAN_STOP',[i['code'] for i in audit_events([{'time':0,'event':'voice_stop','id':'x'}])['issues']])
    def test_unclosed(self):self.assertIn('UNCLOSED_VOICE',[i['code'] for i in audit_events([{'time':0,'event':'voice_start','id':'x'}])['issues']])
    def test_budget(self):
        e=[{'time':0,'event':'voice_start','id':'a'},{'time':.1,'event':'voice_start','id':'b'}]
        self.assertIn('VOICE_BUDGET_EXCEEDED',[i['code'] for i in audit_events(e,max_voices=1)['issues']])
    def test_drift_warning(self):
        e=[{'time':0,'event':'music_event','scheduled':1,'actual':1.1}]
        self.assertIn('TIMING_DRIFT',[i['code'] for i in audit_events(e)['issues']])
    def test_invalid_duck(self):
        e=[{'time':0,'event':'duck','gain':-0.1}]
        self.assertIn('INVALID_DUCK_GAIN',[i['code'] for i in audit_events(e)['issues']])
    def test_nonmonotonic(self):
        e=[{'time':1,'event':'duck','gain':1},{'time':0,'event':'duck','gain':1}]
        self.assertIn('NON_MONOTONIC',[i['code'] for i in audit_events(e)['issues']])
if __name__=='__main__':unittest.main()
