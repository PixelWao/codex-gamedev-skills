/** Snapshot in CSS viewport coordinates; MUST be run in a real browser page. MIT © 2026 Waldemar Soroka. */
export function snapshotUI({root=document, insets={}}={}) {
  const doc = root.ownerDocument??root;
  const win=doc.defaultView;
  const vp=win.visualViewport;
  // Layout viewport coordinates; do not mix VisualViewport scale with getBoundingClientRect().
  const width=doc.documentElement.clientWidth, height=doc.documentElement.clientHeight;
  const controls=[...root.querySelectorAll('button,a[href],input,select,textarea,[role="button"],[data-ui-critical]')].map((el,i)=>{
    const cs=win.getComputedStyle(el),r=el.getBoundingClientRect();
    const visible=cs.display!=='none'&&cs.visibility!=='hidden'&&!el.hidden&&r.width>0&&r.height>0;
    const interactive=el.matches('button,a[href],input,select,textarea,[role="button"]');
    const name=(el.getAttribute('aria-label')||el.getAttribute('title')||el.labels?.[0]?.textContent||el.textContent||'').trim();
    const fontSize=parseFloat(cs.fontSize)||16;
    return {id:el.id||`el-${i}`,name,rect:{x:r.left,y:r.top,width:r.width,height:r.height},visible,interactive,
      critical:el.hasAttribute('data-ui-critical'),keyboardReachable:interactive?((el.tabIndex>=0)&&!el.disabled):undefined,
      // CSS computed for an unfocused control cannot prove :focus-visible behavior.
      focusIndicator:(interactive && doc.activeElement===el)?!(cs.outlineStyle==='none'&&cs.boxShadow==='none'):undefined,
      text:!!name,foreground:cs.color,background:cs.backgroundColor,largeText:fontSize>=24,
      textOverflow:el.scrollWidth>el.clientWidth+1&&cs.overflowX==='hidden'};
  });
  return {viewport:{width,height,insets,visualViewport:{width:vp?.width??null,height:vp?.height??null,scale:vp?.scale??null}},controls};
}
