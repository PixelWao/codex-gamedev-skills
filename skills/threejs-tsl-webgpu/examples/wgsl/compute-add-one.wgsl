struct Count { n: u32, };
@group(0) @binding(0) var<storage, read_write> values: array<f32>;
@group(0) @binding(1) var<uniform> count: Count;

@compute @workgroup_size(8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= count.n) { return; }
  values[id.x] = values[id.x] + 1.0;
}
