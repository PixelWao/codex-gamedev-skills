import importlib.util, pathlib, unittest
p=pathlib.Path(__file__).resolve().parents[1]/'scripts'/'analyze_combat_trace.py'
spec=importlib.util.spec_from_file_location('trace',p)
trace=importlib.util.module_from_spec(spec);spec.loader.exec_module(trace)
class TestTrace(unittest.TestCase):
    def test_happy(self):
        d=trace.analyze([{'time':0,'type':'shot','actor':'p','weapon':'w','shotId':1}, {'time':.1,'type':'shot','actor':'p','weapon':'w','shotId':2}],10)
        self.assertTrue(d['ok'])
    def test_duplicate(self):
        rows=[{'time':i*.1,'type':'shot','actor':'p','weapon':'w','shotId':1} for i in range(2)]
        self.assertFalse(trace.analyze(rows)['ok'])
    def test_speed(self):
        rows=[{'time':i*.01,'type':'shot','actor':'p','weapon':'w','shotId':i} for i in range(2)]
        self.assertFalse(trace.analyze(rows,10)['ok'])
    def test_invalid(self):
        self.assertFalse(trace.analyze([{'time':float('nan'),'type':'shot'}])['ok'])
    def test_reordered(self):
        self.assertFalse(trace.analyze([{'time':1,'type':'reload'},{'time':0,'type':'reload'}])['ok'])
    def test_missing_hit_id(self):
        self.assertFalse(trace.analyze([{'time':.1,'type':'hit'}])['ok'])
if __name__=='__main__':unittest.main()
