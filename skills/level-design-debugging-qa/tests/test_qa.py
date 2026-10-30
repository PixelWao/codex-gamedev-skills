import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'src'))
from level_qa import analyze,reachable_states,validate_schema,validate_jump

def valid():
 return {'start':'entry','goal':'boss','rooms':{
  'entry':{'exits':[{'to':'hall'}]},
  'hall':{'exits':[{'to':'side'},{'to':'vista','requiresAbilities':['jump']}]},
  'side':{'grants':['jump'],'keys':{'red':1},'exits':[{'to':'hall'}]},
  'vista':{'exits':[{'to':'boss','consumesKeys':{'red':1}}]},
  'boss':{'exits':[]}}}
class TestQA(unittest.TestCase):
 def test_invalid_room_instead_of_exception(self):
  l=valid();l['rooms']['hall']=None;self.assertEqual(reachable_states(l)['status'],'invalid')
 def test_negative_key(self):
  l=valid();l['rooms']['side']['keys']={'red':-1};self.assertEqual(reachable_states(l)['status'],'invalid')
 def test_invalid_beat(self):
  l=valid();l['beats']=[None];self.assertTrue(any(i['code']=='INVALID_BEAT' for i in analyze(l)['issues']))
 def test_solvable(self):self.assertEqual(reachable_states(valid())['status'],'solvable')
 def test_missing_boss(self):
  l=valid();del l['rooms']['boss'];self.assertEqual(reachable_states(l)['status'],'invalid')
 def test_missing_key(self):
  l=valid();l['rooms']['side'].pop('keys');self.assertEqual(reachable_states(l)['errors'][0]['code'],'UNOBTAINABLE_KEY')
 def test_backtracking_path(self):self.assertEqual(reachable_states(valid())['witness'],['entry','hall','side','hall','vista','boss'])
 def test_softlock_trap(self):
  l=valid();l['rooms']['hall']['exits'].append({'to':'pit'});l['rooms']['pit']={'exits':[]};self.assertTrue(any(x['room']=='pit' for x in reachable_states(l)['softlocks']))
 def test_key_consumed_once(self):
  l=valid();l['rooms']['vista']['exits']=[{'to':'trap','consumesKeys':{'red':1}},{'to':'boss','consumesKeys':{'red':1}}];l['rooms']['trap']={'exits':[{'to':'vista'}]};self.assertTrue(any(x['room']=='trap' for x in reachable_states(l)['softlocks']))
 def test_budget(self):self.assertEqual(reachable_states(valid(),1)['status'],'inconclusive')
 def test_invalid_budget(self):
  with self.assertRaises(ValueError):reachable_states(valid(),0)
 def test_invalid_target(self):
  l=valid();l['rooms']['hall']['exits'].append({'to':'null'});self.assertTrue(any(x['code']=='MISSING_TARGET' for x in validate_schema(l)))
 def test_destroyed_switch(self):
  l=valid();l['rooms']['side']['destroys']=['wall'];l['rooms']['vista']['exits']=[{'to':'boss','requiresDestroyed':['wall']}];self.assertEqual(reachable_states(l)['status'],'solvable')
 def test_switch(self):
  l=valid();l['rooms']['side']['flags']=['power'];l['rooms']['vista']['exits']=[{'to':'boss','requiresFlags':['power']}];self.assertEqual(reachable_states(l)['status'],'solvable')
 def test_jump_unreachable(self):self.assertEqual(validate_jump({'runSpeed':250,'jumpSpeed':480,'gravity':1200,'deltaX':140,'deltaY':90})['code'],'UNREACHABLE_JUMP')
 def test_jump_reachable(self):self.assertIsNone(validate_jump({'runSpeed':250,'jumpSpeed':480,'gravity':1200,'deltaX':125,'deltaY':90}))
 def test_jump_bad(self):self.assertEqual(validate_jump({'runSpeed':1,'jumpSpeed':2,'gravity':0,'deltaX':1})['code'],'INVALID_JUMP_SPEC')
 def test_pacing(self):
  l=valid();l['beats']=[{'type':'test','intensity':.8,'mechanic':'portal'},{'type':'climax','intensity':1}];self.assertTrue(any(e['code']=='UNTAUGHT_MECHANIC' for e in analyze(l)['issues']))
 def test_strict_softlocks_only_warning(self):self.assertEqual(analyze(valid())['softlocks'],[])
if __name__=='__main__':unittest.main()
