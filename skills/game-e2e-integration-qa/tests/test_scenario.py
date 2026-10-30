import sys, pathlib, unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'src'))
from scenario import validate_scenario
class ScenarioTest(unittest.TestCase):
 def test_valid(self):self.assertEqual(validate_scenario({'steps':[{'action':'wait','ms':10}]})['viewport']['width'],1280)
 def test_empty(self):
  with self.assertRaises(ValueError):validate_scenario({'steps':[]})
 def test_unsafe_goto(self):
  with self.assertRaises(ValueError):validate_scenario({'steps':[{'action':'goto','path':'https://example.com'}]})
 def test_unsafe_screenshot(self):
  with self.assertRaises(ValueError):validate_scenario({'steps':[{'action':'screenshot','name':'../bad'}]})
 def test_invalid_wait(self):
  with self.assertRaises(ValueError):validate_scenario({'steps':[{'action':'wait','ms':-10}]})
 def test_missing_selector(self):
  with self.assertRaises(ValueError):validate_scenario({'steps':[{'action':'click'}]})
 def test_invalid_viewport(self):
  with self.assertRaises(ValueError):validate_scenario({'steps':[{'action':'wait','ms':1}],'viewport':{'width':0,'height':0}})
 def test_jsexpression_requires_text(self):
  with self.assertRaises(ValueError):validate_scenario({'steps':[{'action':'assert_js','expression':None}]})
if __name__=='__main__':unittest.main()
