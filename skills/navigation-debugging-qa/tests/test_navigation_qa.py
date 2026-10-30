import sys,unittest,math,tempfile,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parents[1]/'scripts'))
from navigation_qa import analyze_route,analyze_trace,main

def route(**kw):
    return dict(width=3,height=3,start=[0,1],goal=[2,1],walls=[],path=[[0,1],[1,1],[2,1]],**kw)
class Tests(unittest.TestCase):
    def test_ok(self):self.assertTrue(analyze_route(route())['ok'])
    def test_nonoptimal(self):
        r=route();r['path']=[[0,1],[0,0],[1,0],[2,0],[2,1]];self.assertIn('nonoptimal_path',analyze_route(r)['problems'])
    def test_wrong_start(self):
        r=route();r['path'][0]=[1,1];self.assertIn('wrong_start',analyze_route(r)['problems'])
    def test_blocked(self):
        r=route();r['walls']=[[1,1]];self.assertIn('blocked_or_out_of_bounds_path_node',analyze_route(r)['problems'])
    def test_unreachable(self):
        r=route();r['walls']=[[1,0],[1,1],[1,2]];r['path']=None;self.assertTrue(analyze_route(r)['ok'])
    def test_missing_path(self):
        r=route();r['path']=None;self.assertIn('missing_path_to_reachable_goal',analyze_route(r)['problems'])
    def test_cost_validation(self):
        r=route();r['costs']=[{'cell':[1,1],'cost':-1}];self.assertRaises(ValueError,analyze_route,r)
    def test_diagonal_blocked_corner(self):
        r=dict(width=2,height=2,start=[0,0],goal=[1,1],walls=[[1,0],[0,1]],diagonal=True,path=[[0,0],[1,1]])
        self.assertIn('invalid_path_edge',analyze_route(r)['problems'])
    def test_directed_portal(self):
        r=dict(width=8,height=1,start=[0,0],goal=[7,0],walls=[],links=[{'from':[0,0],'to':[7,0],'cost':.5}],path=[[0,0],[7,0]],reportedCost=.5)
        self.assertTrue(analyze_route(r)['ok'])
    def test_portal_reversed(self):
        r=dict(width=8,height=1,start=[7,0],goal=[0,0],walls=[],links=[{'from':[0,0],'to':[7,0],'cost':.5}],path=[[7,0],[0,0]])
        self.assertIn('invalid_path_edge',analyze_route(r)['problems'])
    def test_reported_cost(self):
        r=route();r['reportedCost']=99;self.assertIn('incorrect_reported_cost',analyze_route(r)['problems'])
    def test_stuck(self):
        rows=[dict(agent='a',t=t,x=0,z=0,goalX=8,goalZ=0,state='moving') for t in [0,.5,1,1.5,2,2.5]]
        self.assertIn('stuck',[x['issue'] for x in analyze_trace(rows)['issues']])
    def test_stale(self):
        r=[dict(agent='a',t=0,x=0,z=0,goalX=1,goalZ=0,state='moving',revision=2,pathRevision=1)]
        self.assertIn('stale_route_in_use',[x['issue'] for x in analyze_trace(r)['issues']])
    def test_speed(self):
        r=[dict(agent='a',t=t,x=x,z=0,goalX=100,goalZ=0) for t,x in [(0,0),(.1,50)]]
        self.assertIn('movement_speed_spike',[x['issue'] for x in analyze_trace(r)['issues']])
    def test_valid_movement(self):
        r=[dict(agent='a',t=t,x=t,z=0,goalX=5,goalZ=0) for t in [0,.5,1,1.5,2,2.5]]
        self.assertTrue(analyze_trace(r)['ok'])
    def test_cli_roundtrip(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'routes.json';o=Path(d)/'out.json';p.write_text(json.dumps(route()));self.assertEqual(main(['--routes',str(p),'--output',str(o)]),0);self.assertTrue(json.loads(o.read_text())['ok'])
if __name__=='__main__':unittest.main()
