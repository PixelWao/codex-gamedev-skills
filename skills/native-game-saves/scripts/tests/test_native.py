"""Filesystem tests (no real power-cut guarantee)."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from native_save_store import NativeSaveStore,SaveError,SaveConflictError,SaveCorruptError,FutureSaveError

class NativeTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.store=NativeSaveStore(self.tmp.name)
        self.state={'schemaVersion':3,'player':{'hp':99},'world':{'seed':7,'generatorVersion':'v3','edits':[]}}
    def write(self,rev=0,hp=99,slot='a'):
        state=json.loads(json.dumps(self.state));state['player']['hp']=hp
        return self.store.write(slot,state,expected_revision=rev)
    def test_roundtrip(self):
        self.assertEqual(self.write()['revision'],1);self.assertEqual(self.store.load('a')['state'],self.state)
    def test_revisions(self):
        self.write();self.write(1,hp=30);self.assertEqual(self.store.load('a')['revision'],2)
    def test_backup(self):
        self.write();self.write(1,hp=30)
        (Path(self.tmp.name)/'save_a.json').write_text('corrupted')
        r=self.store.load('a');self.assertEqual(r['source'],'backup');self.assertEqual(r['state']['player']['hp'],99)
    def test_backup_untouched_if_invalid_primary(self):
        self.write();self.write(1,hp=30)
        (Path(self.tmp.name)/'save_a.json').write_text('garbage')
        with self.assertRaises(SaveCorruptError):self.write(2,hp=40)
        self.assertEqual(self.store.load('a')['state']['player']['hp'],99)
    def test_revision_conflict_preserves_primary(self):
        self.write()
        with self.assertRaises(SaveConflictError):self.write(0,hp=0)
        self.assertEqual(self.store.load('a')['state']['player']['hp'],99)
    def test_crash_before_replace(self):
        self.write()
        def fail(stage):
            if stage=='before_replace':raise OSError('injected crash')
        with self.assertRaises(OSError):self.store.write('a',{**self.state,'player':{'hp':20}},1,fault_hook=fail)
        self.assertEqual(self.store.load('a')['state']['player']['hp'],99)
    def test_initial_crash(self):
        with self.assertRaises(OSError):self.store.write('a',self.state,0,fault_hook=lambda stage:(_ for _ in ()).throw(OSError('fail')))
        self.assertIsNone(self.store.load('a'))
    def test_malformed_slot(self):
        for slot in ['../abc','', 'a/b','a\\b', ' ' * 5]:
            with self.subTest(slot=slot),self.assertRaises(SaveError):self.store.write(slot,self.state,0)
    def test_nonfinite(self):
        with self.assertRaises(SaveError):self.store.write('a',{**self.state,'x':float('nan')},0)
    def test_future(self):
        with self.assertRaises(FutureSaveError):self.store.write('a',{**self.state,'schemaVersion':99},0)
    def test_bool_version(self):
        with self.assertRaises(SaveError):self.store.write('a',{**self.state,'schemaVersion':True},0)
    def test_list(self):
        self.write(slot='z');self.write(slot='b');self.assertEqual(self.store.list_slots(),['b','z'])
    def test_no_save(self):self.assertIsNone(self.store.load('none'))
    def test_checksum_corruption(self):
        self.write();f=Path(self.tmp.name)/'save_a.json';data=json.loads(f.read_text());data['state']['player']['hp']=1;f.write_text(json.dumps(data))
        with self.assertRaises(SaveCorruptError):self.store.load('a')
    def test_backup_newer_refusal(self):
        self.write();f=Path(self.tmp.name)/'save_a.json';data=json.loads(f.read_text());data['state']['schemaVersion']=99
        # checksum is wrong; corruption rather than future until integrity verified.
        f.write_text(json.dumps(data))
        with self.assertRaises(SaveCorruptError):self.store.load('a')
    def test_initial_revision_mismatch(self):
        with self.assertRaises(SaveConflictError):self.write(1)
    def test_unicode_state(self):
        self.store.write('a',{**self.state,'note':'Gdańsk 🌊'},0);self.assertEqual(self.store.load('a')['state']['note'],'Gdańsk 🌊')
    def test_temp_cleanup(self):
        self.write()
        with self.assertRaises(OSError):self.store.write('a',self.state,1,fault_hook=lambda stage:(_ for _ in ()).throw(OSError('failure')) if stage=='before_replace' else None)
        self.assertFalse(list(Path(self.tmp.name).glob('*.tmp-*')))
    def test_valid_backup_after_two_writes(self):
        self.write();self.write(1,hp=51)
        b=Path(self.tmp.name)/'save_a.bak.json';self.assertTrue(b.exists())
        self.assertEqual(self.store._read_one(b)['revision'],1)

if __name__=='__main__':unittest.main()
