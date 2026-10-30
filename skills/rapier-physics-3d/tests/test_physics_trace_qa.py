"""Portable regression tests for trace reader and CLI."""
import csv
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

APP = Path(__file__).resolve().parents[1] / 'scripts' / 'physics_trace_qa.py'


class TraceQaTests(unittest.TestCase):
    def check(self, data, *arguments, ext='.json'):
        with tempfile.TemporaryDirectory() as tmp:
            file = Path(tmp) / ('trace' + ext)
            if ext == '.json':
                file.write_text(json.dumps({'samples': data}), encoding='utf-8')
            else:
                with file.open('w', encoding='utf-8', newline='') as stream:
                    writer = csv.DictWriter(stream, fieldnames=list(data[0]))
                    writer.writeheader()
                    writer.writerows(data)
            result = subprocess.run([sys.executable, str(APP), '--input', str(file), *arguments],
                                    capture_output=True, text=True)
            return result

    def test_pass_2d(self):
        r = self.check([{'tick': 0, 'body': 'block', 'x': 1, 'y': 2,
                         'joint_error': 0.01, 'penetration': 0, 'step_ms': 0.4}],
                       '--max-joint-error', '0.02')
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(json.loads(r.stdout)['status'], 'PASS')

    def test_pass_3d_csv(self):
        data = [{'tick': 0, 'body': 'ball', 'x': 1, 'y': 2, 'z': 3,
                 'step_ms': 1.2}, {'tick': 1, 'body': 'ball', 'x': 1, 'y': 1.8,
                 'z': 3, 'step_ms': 1.1}]
        r = self.check(data, '--max-step-ms-p95', '2', ext='.csv')
        self.assertEqual(r.returncode, 0, r.stderr)

    def test_threshold_fail(self):
        r = self.check([{'tick': 0, 'body': 'a', 'x': 0, 'y': 0,
                         'penetration': 0.2}], '--max-penetration', '0.05')
        self.assertEqual(r.returncode, 1)

    def test_required_metric_missing_fails(self):
        r = self.check([{'tick': 0, 'body': 'a', 'x': 0, 'y': 0}],
                       '--max-joint-error', '0.1')
        self.assertEqual(r.returncode, 1)
        self.assertIn('UNMEASURED', r.stdout)

    def test_nonfinite_rejected(self):
        r = self.check([{'tick': 0, 'body': 'a', 'x': float('nan'), 'y': 0}])
        self.assertEqual(r.returncode, 2)
        self.assertIn('nonfinite', r.stderr)

    def test_duplicate_rejected(self):
        r = self.check([{'tick': 0, 'body': 'a', 'x': 0, 'y': 0},
                        {'tick': 0, 'body': 'a', 'x': 0, 'y': 0}])
        self.assertEqual(r.returncode, 2)

    def test_step_time_not_multiplied_by_body_count(self):
        r = self.check([{'tick': 0, 'body': 'a', 'x': 0, 'y': 0, 'step_ms': 2},
                        {'tick': 0, 'body': 'b', 'x': 1, 'y': 0, 'step_ms': 2}])
        self.assertEqual(r.returncode, 0)
        self.assertEqual(json.loads(r.stdout)['candidate']['metrics']['step_ms']['n'], 1)

    def test_conflicting_timing_fails(self):
        r = self.check([{'tick': 0, 'body': 'a', 'x': 0, 'y': 0, 'step_ms': 2},
                        {'tick': 0, 'body': 'b', 'x': 1, 'y': 0, 'step_ms': 3}])
        self.assertEqual(r.returncode, 2)

    def test_no_overall_threshold_still_unmeasured(self):
        r = self.check([{'tick': 0, 'body': 'a', 'x': 0, 'y': 0}])
        self.assertEqual(r.returncode, 0)
        self.assertFalse(json.loads(r.stdout)['candidate']['measured']['penetration'])

    def test_baseline_regression(self):
        with tempfile.TemporaryDirectory() as tmp:
            b = Path(tmp) / 'baseline.json'
            c = Path(tmp) / 'candidate.json'
            b.write_text(json.dumps([{'tick': 0, 'body': 'b', 'x': 0, 'y': 0,
                                      'joint_error': 0.1}]))
            c.write_text(json.dumps([{'tick': 0, 'body': 'b', 'x': 0, 'y': 0,
                                      'joint_error': 0.2}]))
            proc = subprocess.run([sys.executable, str(APP), '--input', str(c),
                                   '--baseline', str(b)], capture_output=True, text=True)
            self.assertEqual(proc.returncode, 1)
            self.assertIn('REGRESSION', proc.stdout)

    def test_monotonic_ticks(self):
        r = self.check([{'tick': 5, 'body': 'a', 'x': 0, 'y': 0},
                        {'tick': 4, 'body': 'a', 'x': 0, 'y': 0}])
        self.assertEqual(r.returncode, 2)

    def test_negative_metric(self):
        r = self.check([{'tick': 0, 'body': 'a', 'x': 0, 'y': 0,
                         'joint_error': -1}])
        self.assertEqual(r.returncode, 2)


if __name__ == '__main__':
    unittest.main()
