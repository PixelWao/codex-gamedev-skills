// Adaptable browser-side WGSL module compilation helper (not a standalone Node program).
export async function checkWGSL(device, code) {
  if (!device?.createShaderModule) throw new Error('GPUDevice required');
  const module = device.createShaderModule({ code, label:'skill-wgsl-fixture' });
  const info = await module.getCompilationInfo();
  const diagnostics = [...info.messages].map(m => ({type:m.type, message:m.message, line:m.lineNum}));
  return {module, diagnostics, ok: !diagnostics.some(m=>m.type==='error')};
}
