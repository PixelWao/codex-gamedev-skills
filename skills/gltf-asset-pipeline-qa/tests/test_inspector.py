import json
from pathlib import Path
import struct
import sys
import tempfile
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from inspect_gltf import inspect_asset

def doc():
 return {'asset':{'version':'2.0'},'buffers':[{'byteLength':0}],
   'nodes':[{'mesh':0}], 'scenes':[{'nodes':[0]}], 'scene':0,
   'accessors':[{'count':6}], 'meshes':[{'primitives':[{'attributes':{'POSITION':0},'mode':4}]}]}
def glb(d):
 jb=json.dumps(d,separators=(',',':')).encode(); jb+=b' ' * ((-len(jb))%4)
 bin_payload=b''
 return b'glTF'+struct.pack('<II',2,12+8+len(jb)+8+len(bin_payload)) + struct.pack('<I4s',len(jb),b'JSON')+jb+struct.pack('<I4s',len(bin_payload),b'BIN\0')+bin_payload
class InspectionTests(unittest.TestCase):
 def setUp(self): self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup); self.p=Path(self.temp.name)
 def write(self,name,data):p=self.p/name;p.write_bytes(data);return p
 def test_valid_gltf(self):
  r=inspect_asset(self.write('a.gltf',json.dumps(doc()).encode()));self.assertTrue(r['ok']);self.assertEqual(r['estimatedTriangleListTriangles'],2)
 def test_valid_glb(self):self.assertTrue(inspect_asset(self.write('a.glb',glb(doc())))['ok'])
 def test_truncated_header(self):self.assertFalse(inspect_asset(self.write('a.glb',b'glTF'))['ok'])
 def test_bad_magic(self):self.assertFalse(inspect_asset(self.write('a.glb',b'BAD!'+glb(doc())[4:]))['ok'])
 def test_wrong_length(self):
  b=bytearray(glb(doc()));struct.pack_into('<I',b,8,len(b)+1);self.assertFalse(inspect_asset(self.write('a.glb',b))['ok'])
 def test_malformed_json(self):self.assertFalse(inspect_asset(self.write('a.gltf',b'{bad'))['ok'])
 def test_version(self):d=doc();d['asset']['version']='1.0';self.assertFalse(inspect_asset(self.write('a.gltf',json.dumps(d).encode()))['ok'])
 def test_invalid_index(self):d=doc();d['nodes'][0]['mesh']=50;self.assertFalse(inspect_asset(self.write('a.gltf',json.dumps(d).encode()))['ok'])
 def test_external_buffer_warn(self):d=doc();d['buffers'][0]['uri']='mesh.bin';r=inspect_asset(self.write('a.gltf',json.dumps(d).encode()));self.assertTrue(any('External buffer' in w for w in r['warnings']))
 def test_required_extensions(self):d=doc();d['extensionsRequired']=['KHR_draco_mesh_compression'];r=inspect_asset(self.write('a.gltf',json.dumps(d).encode()));self.assertEqual(r['extensionsRequired'][0],'KHR_draco_mesh_compression')
 def test_short_binary(self):d=doc();d['buffers'][0]['byteLength']=1024;self.assertFalse(inspect_asset(self.write('a.glb',glb(d)))['ok'])
 def test_bad_extension(self):self.assertFalse(inspect_asset(self.write('a.txt',b'{}'))['ok'])
 def test_missing_file(self):self.assertFalse(inspect_asset(self.p/'missing.gltf')['ok'])
if __name__=='__main__': unittest.main()

class BundledFixturesTests(unittest.TestCase):
 def test_real_triangle_glb(self):
  p=Path(__file__).resolve().parent/'fixtures/triangle.glb'
  r=inspect_asset(p)
  self.assertTrue(r['ok'],r['errors'])
  self.assertEqual(r['estimatedTriangleListTriangles'],1)
 def test_real_triangle_gltf(self):
  p=Path(__file__).resolve().parent/'fixtures/triangle.gltf'
  r=inspect_asset(p)
  self.assertTrue(r['ok'],r['errors'])
  self.assertEqual(r['estimatedTriangleListTriangles'],1)
