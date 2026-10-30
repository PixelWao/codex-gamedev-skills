# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Waldemar Soroka
import importlib.util
import json
import math
import pathlib
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
PATH = ROOT / 'scripts' / 'analyze_frame_times.py'
spec = importlib.util.spec_from_file_location('analyze_frame_times', PATH)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class TimingAnalyzerTests(unittest.TestCase):
    def test_nearest_rank_and_budget(self):
        v = [10, 11, 12, 13, 14, 15, 16, 17, 18, 45, 55, 60]
        s = module.summarize(v, 60)
        self.assertEqual(s['count'], 12)
        self.assertEqual(s['p50Ms'], 15)
        self.assertEqual(s['p95Ms'], 60)
        self.assertEqual(s['p99Ms'], 60)
        self.assertAlmostEqual(s['overBudgetPct'], 100 * 5 / 12)

    def test_json_csv_and_skip(self):
        with tempfile.TemporaryDirectory() as folder:
            folder = pathlib.Path(folder)
            (folder / 'in.json').write_text(json.dumps({'frameIntervalsMs': [8, 9, 10]}))
            (folder / 'in.csv').write_text('frame_ms\n8\n9\n10\n')
            self.assertEqual(module.load_intervals(folder / 'in.json', 1), [9, 10])
            self.assertEqual(module.load_intervals(folder / 'in.csv', 1), [9, 10])

    def test_bad_inputs(self):
        with tempfile.TemporaryDirectory() as folder:
            path = pathlib.Path(folder) / 'bad.json'
            for values in ([-1, 12], ['NaN'], [True], [], [0], ['Infinity']):
                path.write_text(json.dumps(values))
                with self.assertRaises(ValueError):
                    module.load_intervals(path)

    def test_compare_and_cli_json(self):
        baseline = module.summarize([20, 20, 20, 20], 60)
        candidate = module.summarize([15, 15, 15, 15], 60)
        diff = module.compare(baseline, candidate)
        self.assertEqual(diff['p95Ms']['difference'], -5)
        with tempfile.TemporaryDirectory() as folder:
            path = pathlib.Path(folder) / 'frames.json'
            path.write_text('[16, 17, 18]')
            self.assertEqual(module.main([str(path), '--target-fps', '60', '--json']), 0)

    def test_invalid_target(self):
        for fps in (float('nan'), float('inf'), 0, -60):
            with self.assertRaises(ValueError):
                module.summarize([16], fps)


if __name__ == '__main__':
    unittest.main()
