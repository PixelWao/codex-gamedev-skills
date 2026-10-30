"""Synthetic regression tests. Run: python -m unittest discover -s scripts/tests -v."""
import copy
import json
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from schema_pipeline import (decode,migrate,canonical_json,SaveValidationError,FutureSaveError)
from audit_saves import audit
ROOT=Path(__file__).resolve().parents[2]/'fixtures'

def read(name):return (ROOT/name).read_bytes()

class MigrationTests(unittest.TestCase):
    def test_v1(self):
        m=migrate(decode(read('legacy_v1.json')))
        self.assertEqual(m['schemaVersion'],3)
        self.assertEqual(m['player']['hp'],77)
        self.assertEqual(m['world']['seed'],512)
        self.assertEqual(m['world']['generatorVersion'],'legacy-worldgen-1')
        self.assertTrue(m['flags']['boss_beaten'])
    def test_v2(self):
        self.assertEqual(migrate(decode(read('legacy_v2.json')))['player']['hp'],1)
    def test_v3(self):
        self.assertEqual(migrate(decode(read('current_v3.json')))['world']['edits'][0]['action'],'remove')
    def test_no_mutation(self):
        data=decode(read('legacy_v1.json'));original=copy.deepcopy(data);migrate(data);self.assertEqual(original,data)
    def test_deterministic(self):
        data=decode(read('legacy_v2.json'));self.assertEqual(canonical_json(migrate(data)),canonical_json(migrate(data)))
    def test_future(self):
        with self.assertRaises(FutureSaveError):migrate(decode(read('future_v4.json')))
    def test_bad_health(self):
        with self.assertRaises(SaveValidationError):migrate(decode(read('invalid_health.json')))
    def test_missing_version(self):
        with self.assertRaises(SaveValidationError):migrate(decode(read('missing_version.json')))
    def test_bad_json(self):
        with self.assertRaises(SaveValidationError):decode(read('corrupt_text.json'))
    def test_duplicate(self):
        with self.assertRaises(SaveValidationError):decode(read('duplicate_keys.json'))
    def test_nan(self):
        with self.assertRaises(SaveValidationError):decode('{"x":NaN}')
    def test_boolean_version(self):
        data=decode(read('legacy_v1.json'));data['schemaVersion']=True
        with self.assertRaises(SaveValidationError):migrate(data)
    def test_nonfinite_encode(self):
        with self.assertRaises(SaveValidationError):canonical_json({'x':float('nan')})
    def test_depth_limit(self):
        node={}
        for _ in range(35):node={'deep':node}
        with self.assertRaises(SaveValidationError):migrate(node)
    def test_input_max_bytes(self):
        with self.assertRaises(SaveValidationError):decode(' ' * 2_000_001)
    def test_invalid_edits(self):
        data=decode(read('current_v3.json'));data['world']['edits'][0]['action']='DROP TABLE'
        with self.assertRaises(SaveValidationError):migrate(data)
    def test_manifest(self):
        report=audit(ROOT,ROOT/'manifest.json');self.assertEqual(report['cases'],report['passed'])
    def test_roundtrip_unicode(self):
        data=migrate(decode(read('current_v3.json')))
        self.assertEqual(migrate(decode(canonical_json(data))),data)

if __name__=='__main__':unittest.main()
