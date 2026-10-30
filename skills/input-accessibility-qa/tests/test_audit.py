import unittest
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'src'))
from audit_input import audit
class QA(unittest.TestCase):
    def test_valid(self):self.assertTrue(audit([{'time':1,'type':'down','device':'keyboard','control':'Space'},{'time':2,'type':'up','device':'keyboard','control':'Space'}])['ok'])
    def test_double_down(self):self.assertEqual(audit([{'time':1,'type':'down','control':'X'},{'time':2,'type':'down','control':'X'}])['errors'][0]['code'],'DOUBLE_DOWN')
    def test_orphan_up(self):self.assertFalse(audit([{'time':1,'type':'up','control':'X'}])['ok'])
    def test_timestamp_reversal(self):self.assertIn('TIME_REVERSAL',[e['code'] for e in audit([{'time':3,'type':'sample'},{'time':2,'type':'sample'}])['errors']])
    def test_bad_time(self):self.assertFalse(audit([{'time':float('nan'),'type':'sample'}])['ok'])
    def test_boolean_time(self):self.assertFalse(audit([{'time':True,'type':'sample'}])['ok'])
    def test_focus_clears_held(self):self.assertTrue(audit([{'time':1,'type':'down','control':'X'},{'time':2,'type':'blur'}])['ok'])
    def test_focus_warns(self):self.assertEqual(audit([{'time':1,'type':'down','control':'X'},{'time':2,'type':'blur'}])['warnings'][0]['code'],'FOCUS_RELEASE')
    def test_pointer_lifecycle(self):self.assertTrue(audit([{'time':1,'type':'pointerdown','pointerId':3},{'time':2,'type':'pointercancel','pointerId':3}])['ok'])
    def test_duplicate_pointer(self):self.assertFalse(audit([{'time':1,'type':'pointerdown','pointerId':3},{'time':2,'type':'pointerdown','pointerId':3}])['ok'])
    def test_orphan_pointer(self):self.assertFalse(audit([{'time':1,'type':'pointerup','pointerId':3}])['ok'])
    def test_simultaneous_pointers(self):self.assertTrue(audit([{'time':1,'type':'pointerdown','pointerId':1},{'time':2,'type':'pointerdown','pointerId':2},{'time':3,'type':'pointerup','pointerId':1},{'time':4,'type':'pointerup','pointerId':2}])['ok'])
    def test_axis_limit(self):self.assertFalse(audit([{'time':1,'type':'axis','x':1,'y':1}])['ok'])
    def test_axis_unit_circle(self):self.assertTrue(audit([{'time':1,'type':'axis','x':0.6,'y':0.8}])['ok'])
    def test_axis_missing_y(self):self.assertFalse(audit([{'time':1,'type':'axis','x':0.6}])['ok'])
    def test_double_consume(self):self.assertFalse(audit([{'time':1,'type':'consume','inputId':'a'},{'time':2,'type':'consume','inputId':'a'}])['ok'])
    def test_bad_consume(self):self.assertFalse(audit([{'time':1,'type':'consume'}])['ok'])
    def test_rebinding_conflict(self):self.assertFalse(audit([{'time':1,'type':'binding','conflict':True}])['ok'])
    def test_stuck_held(self):self.assertFalse(audit([{'time':1,'type':'down','control':'A'},{'time':50000,'type':'sample'}])['ok'])
    def test_closed_after_release(self):self.assertTrue(audit([{'time':1,'type':'down','control':'A'},{'time':100,'type':'up','control':'A'}])['ok'])
    def test_unknown_warns_only(self):self.assertEqual(audit([{'time':1,'type':'teleport'}])['warnings'][0]['code'],'UNKNOWN_EVENT')
if __name__=='__main__':unittest.main()
