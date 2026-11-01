// Visual layout extension. Original Barsmith code remains MIT licensed.
(() => {
  let editing = false;
  const originalRender = renderScreen;
  const css = document.createElement('style');
  css.textContent = `
    .layout-tools{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0;font-size:12px;align-items:center}
    #screen.layout-edit .bar{outline:1px dashed #dfbc72;outline-offset:2px}
    .layout-handle{position:absolute;left:0;top:-23px;height:21px;padding:0 7px;background:#302719;color:#ffe3a0;border:1px solid #a68b54;border-radius:3px;cursor:move;touch-action:none;z-index:8;font-size:11px}
    .layout-resize{position:absolute;right:-7px;bottom:-7px;width:15px;height:15px;background:#e4bc65;border:1px solid #111;cursor:nwse-resize;touch-action:none;z-index:8}
    #screen.layout-edit .ab{pointer-events:none}
  `;
  document.head.append(css);
  const tools = document.createElement('div');
  tools.className = 'layout-tools';
  tools.innerHTML = `<button type="button" class="btn" id="layoutToggle">Edit layout</button><button type="button" class="btn" id="layoutReset">Reset layout</button><label>Bar <select id="layoutBar"></select></label><label>Rows <select id="layoutRows"><option>1</option><option>2</option><option>3</option><option>4</option><option>6</option><option>12</option></select></label><span>Drag a bar’s handle to move; drag its gold corner to resize. Layout saves per plan, in this browser only.</span>`;
  $('screen').before(tools);
  const bars = () => [...$('screen').querySelectorAll('.bar')];
  const key = el => el.dataset.bar || (el.getAttribute('aria-label') === 'Pet bar' ? 'pet' : 'stance');
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function place(el, config) {
    const sc = $('screen');
    const count = el.querySelectorAll('.ab').length;
    const rows = clamp(config.rows || 1, 1, count);
    const columns = Math.ceil(count / rows);
    const size = Math.min(config.size || 36, Math.max(8, (sc.clientWidth - 12 - (columns - 1) * 3) / columns), Math.max(8, (sc.clientHeight - 35 - (rows - 1) * 3) / rows));
    Object.assign(el.style, {position:'absolute', margin:'0', transform:'none', gridAutoFlow:'row', gridAutoColumns:'unset', gridTemplateColumns:`repeat(${columns}, var(--b))`, gridTemplateRows:`repeat(${rows}, var(--b))`, gap:'3px'});
    el.style.setProperty('--b', size + 'px');
    el.style.left = clamp(config.x * sc.clientWidth, 6, Math.max(6, sc.clientWidth - columns * (size + 3) - 20)) + 'px';
    el.style.top = clamp(config.y * sc.clientHeight, 28, Math.max(28, sc.clientHeight - rows * (size + 3) - 8)) + 'px';
  }
  function captureAll() {
    const sc = $('screen'), rect = sc.getBoundingClientRect();
    P().layout ||= {};
    for (const el of bars()) {
      const id = key(el);
      if (!P().layout[id]) {
        const r = el.getBoundingClientRect();
        P().layout[id] = {x:(r.left-rect.left)/sc.clientWidth,y:(r.top-rect.top)/sc.clientHeight,size:el.querySelector('.ab').getBoundingClientRect().width,rows:el.classList.contains('vertical') ? 12 : 1};
      }
    }
    save();
  }
  function enhance() {
    const sc = $('screen');
    sc.classList.toggle('layout-edit', editing);
    if (editing) captureAll();
    for (const el of bars()) {
      const id = key(el), config = (P().layout || {})[id];
      if (config) { sc.append(el); place(el, config); }
      if (editing) {
        const handle = document.createElement('button');
        handle.type = 'button'; handle.className = 'layout-handle'; handle.textContent = id.startsWith('b') ? 'Move bar ' + id.slice(1) : 'Move ' + id;
        handle.setAttribute('aria-label', handle.textContent + ' (arrow keys move)');
        const resize = document.createElement('button'); resize.type = 'button'; resize.className = 'layout-resize'; resize.setAttribute('aria-label','Resize ' + id + ' (arrow keys adjust)');
        el.append(handle, resize);
        for (const [control, resizing] of [[handle,false],[resize,true]]) {
          control.addEventListener('pointerdown', e => {
            e.preventDefault(); e.stopPropagation();
            const start = {...P().layout[id]}, x = e.clientX, y = e.clientY;
            control.setPointerCapture(e.pointerId);
            const move = event => {
              const c = P().layout[id];
              if (resizing) c.size = clamp(start.size + Math.max(event.clientX-x,event.clientY-y) / Math.max(1,Math.ceil(el.querySelectorAll('.ab').length / c.rows)), 12, 80);
              else { c.x = clamp(start.x+(event.clientX-x)/sc.clientWidth,0,1); c.y = clamp(start.y+(event.clientY-y)/sc.clientHeight,0,1); }
              place(el,c);
            };
            const end = () => {control.removeEventListener('pointermove',move);control.removeEventListener('pointerup',end);control.removeEventListener('pointercancel',end);save();};
            control.addEventListener('pointermove',move);control.addEventListener('pointerup',end);control.addEventListener('pointercancel',end);
          });
          control.addEventListener('keydown', e => {
            if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return;
            e.preventDefault();e.stopPropagation();const c=P().layout[id];
            if(resizing)c.size=clamp(c.size+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1),12,80);
            else {c.x=clamp(c.x+(e.key==='ArrowRight'?4:e.key==='ArrowLeft'?-4:0)/sc.clientWidth,0,1);c.y=clamp(c.y+(e.key==='ArrowDown'?4:e.key==='ArrowUp'?-4:0)/sc.clientHeight,0,1);}
            place(el,c);save();
          });
        }
      }
    }
    const selected=$('layoutBar').value;
    $('layoutBar').replaceChildren(...bars().map(el=>new Option(key(el).replace('b','Bar '),key(el))));
    if([...$('layoutBar').options].some(o=>o.value===selected))$('layoutBar').value=selected;
    $('layoutRows').value=String((P().layout||{})[$('layoutBar').value]?.rows||1);
    $('layoutBar').disabled=$('layoutRows').disabled=!editing;
    $('layoutToggle').textContent=editing?'Done editing':'Edit layout';
    $('layoutToggle').setAttribute('aria-pressed',String(editing));
  }
  renderScreen = function(){originalRender();enhance();};
  $('layoutToggle').onclick=()=>{if(kbMode)setKb(false);editing=!editing;renderScreen();};
  $('layoutReset').onclick=()=>{delete P().layout;renderScreen();save();};
  $('layoutBar').onchange=()=>{$('layoutRows').value=String(P().layout[$('layoutBar').value]?.rows||1);};
  $('layoutRows').onchange=()=>{P().layout[$('layoutBar').value].rows=Number($('layoutRows').value);renderScreen();save();};
  new ResizeObserver(()=>{for(const el of bars()){const c=(P().layout||{})[key(el)];if(c)place(el,c);}}).observe($('screen'));
  renderScreen();
})();
