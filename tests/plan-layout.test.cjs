const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html', 'utf8');
const codec = html.slice(html.indexOf('const escField ='), html.indexOf('function warnings()'));
const bars = Array.from({length:8}, (_,i) => ({key:'b'+(i+1), first:[1,61,49,25,37,145,157,169][i]}));
function setup() {
  const ctx = vm.createContext({TextEncoder, TextDecoder, btoa, atob, BARS:bars,
    CLASS_NAME:{SHAMAN:'Shaman'}, RACES:['Dwarf'], app:{cls:'SHAMAN',race:'Dwarf'},
    slotInfo:n => bars.some(b => n>=b.first && n<b.first+12),
    P:() => ctx.current});
  vm.runInContext(codec,ctx);
  return ctx;
}
const plain = x => JSON.parse(JSON.stringify(x));
const config = {x:.2,y:.35,size:27,baseSize:36,buttons:6,rows:2};
const plan = () => ({name:'Test',shown:['b1','b4'],layout:{b1:{...config},b4:{...config,rows:6},pet:{...config,buttons:10}},
  slots:{1:{kind:'spell',value:'Lightning Bolt'},12:{kind:'macro',value:'Heal'},61:{kind:'clear',value:''},37:{kind:'item',value:'item:6948'}},
  macros:[{name:'Heal',icon:'',perChar:true,body:'#showtooltip\n/cast Healing Wave\n/say a\tb\\c'}],binds:{ACTIONBUTTON1:'CTRL-1'}});
test('BP1 round trip restores layout and all actions, including hidden slots/bars', () => {
  const c=setup(); c.current=plan();
  const string=c.serialize(); assert.ok(string.startsWith('BP1:'));
  const loaded=c.parse(string); assert.equal(loaded.cls,'SHAMAN');
  for(const field of ['shown','layout','slots','macros','binds']) assert.deepEqual(plain(loaded.plan[field]),c.current[field]);
  c.current=loaded.plan;
  assert.equal(c.serialize(),string);
});
test('legacy strings retain inferred bars and actions', () => {
  const c=setup(); c.current=plan();
  const raw=c.fromB64(c.serialize().slice(4));
  const old=raw.split('\n').filter(l=>!l.startsWith('LAYOUT\t')&&!l.startsWith('SHOWN')).join('\n');
  const loaded=c.parse('BP1:'+c.toB64(old)).plan;
  assert.equal(loaded.layout,undefined);
  assert.deepEqual(plain(loaded.shown),['b1','b2','b5']);
  for(const field of ['slots','macros','binds']) assert.deepEqual(plain(loaded[field]),c.current[field]);
});
test('malformed layout data cannot corrupt actions or styles', () => {
  const c=setup();
  for(const record of ['LAYOUT\tb1\tNaN\t0\t36\t36\t12\t1','LAYOUT\tb1\t0\t0\tInfinity\t36\t12\t1','LAYOUT\tb1\t0\t0\t36\t36\t13\t1','LAYOUT\t__proto__\t0\t0\t36\t36\t12\t1','LAYOUT\tb1\t0\t0\t36\t36\t6\t7','LAYOUT\tb1\t\t0\t36\t36\t6\t1']) {
    const p=c.parse('BP1:'+c.toB64('BARPLAN\t1\nSLOT\t1\tspell\tLightning Bolt\n'+record)).plan;
    assert.equal(p.layout,undefined); assert.equal(p.slots[1].value,'Lightning Bolt');
  }
});
test('imported layout drives the renderer position, size, visible cells and rows', () => {
  const c=setup(); c.current=plan(); const loaded=c.parse(c.serialize()).plan;
  const source=fs.readFileSync('layout-editor.js','utf8');
  const place=source.slice(source.indexOf('  function place('),source.indexOf('  function captureAll('));
  const cells=Array.from({length:12},()=>({style:{}}));
  const el={style:{setProperty(k,v){this[k]=v;}},querySelectorAll:()=>cells};
  c.$=()=>({clientWidth:1000,clientHeight:600}); c.clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
  vm.runInContext(place,c); c.place(el,loaded.layout.b1);
  assert.equal(el.style.left,'200px'); assert.equal(el.style.top,'210px');
  assert.equal(el.style['--b'],'27px'); assert.equal(el.style.gridTemplateColumns,'repeat(3, var(--b))');
  assert.equal(el.style.gridTemplateRows,'repeat(2, var(--b))');
  assert.equal(cells.filter(cell=>cell.style.display!=='none').length,6);
});
