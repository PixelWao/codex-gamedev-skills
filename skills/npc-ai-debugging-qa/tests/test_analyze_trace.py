import unittest,sys,tempfile,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from analyze_trace import analyze,parse_rows,percentile,main

class Check(unittest.TestCase):
    def test_empty(self): self.assertEqual(analyze([])['status'],'PASS')
    def test_good_sample(self):
        rows=parse_rows(Path(__file__).resolve().parents[1]/'examples/guard_trace.jsonl')
        result=analyze(rows,strict_end=True)
        self.assertEqual(result['status'],'PASS')
        self.assertEqual(result['agent_count'],1)
    def test_bad_sample(self):
        rows=parse_rows(Path(__file__).resolve().parents[1]/'examples/bad_trace.jsonl')
        result=analyze(rows,strict_end=True)
        self.assertEqual(result['status'],'FAIL')
        self.assertGreaterEqual(len(result['errors']),2)
    def test_unfinished_warn_or_fail(self):
        r=[{'agent':'a','t':0,'kind':'start','node':'x'}]
        self.assertEqual(analyze(r)['status'],'WARN')
        self.assertEqual(analyze(r,strict_end=True)['status'],'FAIL')
    def test_emergency_exempts_flip(self):
        r=[{'agent':'a','t':0,'kind':'decision','action':'patrol'},{'agent':'a','t':.05,'kind':'decision','action':'flee','reason':'emergency'}]
        self.assertEqual(analyze(r)['rapid_flips'],0)
    def test_regular_rapid_flip(self):
        r=[{'agent':'a','t':0,'kind':'decision','action':'a'},{'agent':'a','t':.01,'kind':'decision','action':'b'}]
        self.assertEqual(analyze(r)['rapid_flips'],1)
    def test_time_reversed(self):
        self.assertEqual(analyze([{'agent':'a','t':1,'kind':'cost','ms':1},{'agent':'a','t':0,'kind':'cost','ms':1}])['status'],'FAIL')
    def test_nonfinite_cost(self):
        self.assertEqual(analyze([{'agent':'a','t':0,'kind':'cost','ms':float('nan')}])['status'],'FAIL')
    def test_p95_budget(self):
        data=[{'agent':'a','t':i,'kind':'cost','ms':i} for i in range(10)]
        self.assertEqual(analyze(data,max_p95=2)['status'],'FAIL')
    def test_hash_deterministic(self):
        v=[{'agent':'a','t':0,'kind':'decision','action':'patrol'}]
        self.assertEqual(analyze(v)['trace_sha256'],analyze(v)['trace_sha256'])
    def test_percentile(self): self.assertEqual(percentile([1,2,3],50),2)
    def test_invalid_json_constants(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'x.jsonl';p.write_text('{"ms":NaN}\n')
            with self.assertRaises(ValueError):parse_rows(p)
    def test_cli(self):
        with tempfile.TemporaryDirectory() as d:
            out=Path(d)/'report.json'; self.assertEqual(main([str(Path(__file__).resolve().parents[1]/'examples/guard_trace.jsonl'),'--strict-end','--json',str(out)]),0)
            self.assertEqual(json.loads(out.read_text())['status'],'PASS')
if __name__=='__main__':unittest.main()
