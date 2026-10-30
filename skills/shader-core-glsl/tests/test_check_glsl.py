import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from check_glsl import analyze
ROOT=Path(__file__).resolve().parents[1]
class ShaderStaticTests(unittest.TestCase):
    def test_reference_shaders(self):
        for path in (ROOT/'examples').rglob('*'):
            if path.suffix in ('.frag','.vert'):
                with self.subTest(path=path.name):
                    self.assertFalse([i for i in analyze(path.read_text(),path.suffix) if i['level']=='error'])
    def test_legacy_es300_rejected(self):
        self.assertIn('es300-legacy',[i['code'] for i in analyze('#version 300 es\nvoid main(){gl_FragColor=vec4(1.);}')])
    def test_bad_smoothstep_rejected(self):
        self.assertIn('smoothstep-order',[i['code'] for i in analyze('precision mediump float; void main(){float a=smoothstep(0.8,0.3,0.5);}')])
    def test_early_directive_warning(self):
        self.assertIn('version-order',[i['code'] for i in analyze('// comment\n#version 300 es\nvoid main(){}')])
    def test_missing_main(self):
        self.assertIn('main-missing',[i['code'] for i in analyze('precision mediump float;')])
if __name__=='__main__': unittest.main()
