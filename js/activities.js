// กิจกรรมโต้ตอบ 3 อย่าง — ทั้งหมดเป็นการจำลองบนเบราว์เซอร์ ใช้ปุ่มทั้งหมดเพื่อให้คีย์บอร์ดใช้ได้
import { actStore } from './store.js';
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- 1) จับคู่ Switch / Router / AP ---------- */
const ITEMS = [
  { k: 'switch', d: 'Switch', fn: 'เชื่อมอุปกรณ์ภายใน LAN และส่งเฟรมตาม MAC address', why: 'Switch ทำงานที่ชั้น Layer 2 จึงใช้ที่อยู่ MAC ในการส่งเฟรมภายในเครือข่ายเดียวกัน' },
  { k: 'router', d: 'Router', fn: 'ส่ง IP packet ระหว่างคนละเครือข่าย', why: 'Router ใช้ตารางเส้นทางและที่อยู่ IP ในการส่งข้อมูลข้าม subnet' },
  { k: 'ap', d: 'Access Point', fn: 'เชื่อมอุปกรณ์ไร้สายเข้าสู่ LAN', why: 'AP ทำหน้าที่เป็นสะพานระหว่างคลื่นวิทยุกับสายเครือข่าย จึงต้องเชื่อมต่อสายเข้าสวิตช์' },
  { k: 'gateway', d: 'อุปกรณ์ที่ทำหน้าที่เป็น Gateway ของเครือข่าย', fn: 'เป็นทางออกของเครือข่ายสำหรับข้อมูลที่ปลายทางอยู่คนละ subnet', why: 'Default Gateway ต้องเป็นอุปกรณ์ที่ส่งต่อข้อมูลข้ามเครือข่ายได้' },
];

export function renderMatchActivity(root) {
  const state = { picks: {}, done: [], wrong: 0 };
  const say = (msg, tone = 'info') => {
    const el = root.querySelector('[data-say]');
    el.className = 'mt-3 p-3 rounded-lg text-sm border-l-4 bg-' + (tone === 'ok' ? 'teal-light border-l-teal' : tone === 'no' ? 'orange-light border-l-orange' : 'blue-light border-l-blue');
    el.textContent = msg;
  };

  root.innerHTML = `
  <p class="text-navy/85">เลือกอุปกรณ์ทางซ้าย แล้วเลือกหน้าที่ที่ตรงกันทางขวา เมื่อจับคู่ได้ครบ 4 คู่จะแสดงเหตุผลของแต่ละคู่</p>
  <p class="text-sm text-navy/70 mt-1">ใช้ปุ่ม Tab เลื่อน และปุ่ม Enter หรือ Space เพื่อเลือก</p>
  <div class="grid md:grid-cols-2 gap-4 mt-3">
    <div>
      <p class="font-semibold text-sm mb-2">อุปกรณ์</p>
      <div class="grid sm:grid-cols-2 gap-2" role="group" aria-label="รายการอุปกรณ์">
        ${ITEMS.map((it, i) => `<button type="button" class="match-item" data-group="dev" data-idx="${i}" aria-pressed="false">${esc(it.d)}</button>`).join('')}
      </div>
    </div>
    <div>
      <p class="font-semibold text-sm mb-2">หน้าที่</p>
      <div class="space-y-2" role="group" aria-label="รายการหน้าที่">
        ${ITEMS.map((it, i) => `<button type="button" class="match-item text-left font-normal" data-group="fn" data-idx="${i}" aria-pressed="false">${esc(it.fn)}</button>`).join('')}
      </div>
    </div>
  </div>
  <div class="mt-4 flex flex-wrap gap-2 items-center">
    <button type="button" id="mReset" class="px-4 py-2 rounded-lg border border-navy/30 hover:bg-teal-light">เริ่มใหม่</button>
    <span id="mScore" class="px-4 py-2 rounded-lg bg-teal-light text-sm font-semibold" role="status">จับคู่แล้ว 0/4</span>
  </div>
  <div data-say class="mt-3 p-3 rounded-lg text-sm border-l-4 bg-blue-light border-l-blue" role="status">เลือกอุปกรณ์ทางซ้ายก่อน แล้วเลือกหน้าที่ทางขวา</div>`;

  const btns = Array.from(root.querySelectorAll('.match-item'));
  const scoreEl = root.querySelector('#mScore');

  btns.forEach(b => b.addEventListener('click', () => {
    if (b.classList.contains('matched')) return;
    btns.forEach(x => { if (x.dataset.group === b.dataset.group) { x.classList.remove('sel'); x.setAttribute('aria-pressed', 'false'); } });
    b.classList.add('sel');
    b.setAttribute('aria-pressed', 'true');
    state.picks[b.dataset.group] = b;
    const d = state.picks.dev, f = state.picks.fn;
    if (!d || !f) return;
    const di = Number(d.dataset.idx), fi = Number(f.dataset.idx);
    if (di === fi) {
      [d, f].forEach(x => { x.classList.remove('sel'); x.classList.add('matched'); x.setAttribute('aria-pressed', 'false'); x.disabled = true; });
      state.done.push(di);
      scoreEl.textContent = `จับคู่แล้ว ${state.done.length}/4`;
      say(`ถูกต้อง: ${ITEMS[di].d} — ${ITEMS[di].why}`, 'ok');
      if (state.done.length === 4) {
        actStore.save('match', { done: true, score: 4, wrong: state.wrong, at: new Date().toISOString() });
        say('จับคู่ครบ 4 คู่แล้ว บันทึกคะแนน 4/4 ไว้ในเบราว์เซอร์นี้ กดเริ่มใหม่เพื่อทำซ้ำได้', 'ok');
      }
    } else {
      state.wrong++;
      say(`ยังไม่ใช่คู่เดียวกัน: "${ITEMS[di].d}" ไม่ได้ทำหน้าที่ "${ITEMS[fi].fn}" ลองพิจารณาว่าอุปกรณ์นี้ทำงานที่ชั้นใด`, 'no');
      state.picks = {};
      [d, f].forEach(x => { x.classList.remove('sel'); x.setAttribute('aria-pressed', 'false'); });
    }
  }));

  root.querySelector('#mReset').addEventListener('click', () => {
    state.picks = {}; state.done = []; state.wrong = 0;
    btns.forEach(b => { b.classList.remove('sel', 'matched'); b.disabled = false; });
    scoreEl.textContent = 'จับคู่แล้ว 0/4';
    say('เริ่มใหม่แล้ว ลองจับคู่อีกครั้ง', 'info');
    btns[0].focus();
  });
}

/* ---------- 2) เรียงลำดับสี T568B ---------- */
const PINS = [
  { n: 1, label: 'ขาวส้ม' }, { n: 2, label: 'ส้ม' }, { n: 3, label: 'ขาวเขียว' },
  { n: 4, label: 'น้ำเงิน' }, { n: 5, label: 'ขาวน้ำเงิน' }, { n: 6, label: 'เขียว' },
  { n: 7, label: 'ขาวน้ำตาล' }, { n: 8, label: 'น้ำตาล' }
];
const SWATCH = { 1: '#F5F7F9', 2: '#E86A17', 3: '#F5F7F9', 4: '#1B5EA8', 5: '#F5F7F9', 6: '#0E8C8C', 7: '#F5F7F9', 8: '#8B5A2B' };

export function renderT568Activity(root) {
  const state = { order: [1, 2, 3, 4, 5, 6, 7, 8] };
  let cur = 1;
  const say = (msg, tone = 'info') => {
    const el = root.querySelector('[data-say]');
    el.className = 'mt-3 p-3 rounded-lg text-sm border-l-4 bg-' + (tone === 'ok' ? 'teal-light border-l-teal' : tone === 'no' ? 'orange-light border-l-orange' : 'blue-light border-l-blue');
    el.textContent = msg;
  };
  const label = (n) => PINS.find(p => p.n === n).label;

  root.innerHTML = `
  <p class="text-navy/85">จัดลำดับขา 1–8 ให้ตรงกับมาตรฐาน T568B วิธีกำหนดมุมมอง: หันหน้าสัมผัสโลหะเข้าหาตัวเอง
     ให้สลักอยู่ด้านหลังและสายห้อยลง ขา 1 จึงอยู่ซ้ายมือ</p>
  <p class="text-sm text-navy/70 mt-1">ทางเลือกสำหรับคีย์บอร์ด: ปุ่ม Tab เลื่อน · ปุ่มเลข 1–8 เลือกขา · ปุ่มลูกศรซ้าย/ขวาเลื่อนขา · Enter หรือ Space เลือกสี</p>
  <div class="grid lg:grid-cols-2 gap-5 mt-3">
    <div>
      <p class="font-semibold text-sm mb-2">ขาที่กำลังเลือก</p>
      <div class="grid grid-cols-4 gap-2" role="group" aria-label="เลือกหมายเลขขา">
        ${PINS.map(p => `<button type="button" class="match-item" data-pin="${p.n}" aria-pressed="false">ขา ${p.n}</button>`).join('')}
      </div>
      <p class="text-sm text-navy/70 mt-4 mb-1">สีของขาที่เลือก</p>
      <div class="grid grid-cols-2 gap-2" role="group" aria-label="เลือกสีขา">
        ${PINS.map(p => `<button type="button" class="match-item" data-color="${p.n}">${esc(p.label)}</button>`).join('')}
      </div>
    </div>
    <div>
      <p class="font-semibold text-sm mb-2">กระดานลำดับที่เรียง (ขา 1 → 8)</p>
      <ol class="space-y-1.5" data-board aria-label="ลำดับสีของขาที่เรียงแล้ว"></ol>
    </div>
  </div>
  <div class="mt-4 flex flex-wrap gap-2">
    <button type="button" id="tCheck" class="px-4 py-2 rounded-lg bg-teal text-white font-medium hover:bg-teal-dark">ตรวจคำตอบ</button>
    <button type="button" id="tReset" class="px-4 py-2 rounded-lg border border-navy/30 hover:bg-teal-light">เริ่มใหม่</button>
  </div>
  <div data-say class="mt-3 p-3 rounded-lg text-sm border-l-4 bg-blue-light border-l-blue" role="status">เลือกขาที่ 1 แล้วเลือกสี แล้วไล่ไปขา 2 จนถึงขา 8</div>`;

  function paint() {
    root.querySelector('[data-board]').innerHTML = state.order.map((colorPin, i) => `
      <li class="flex items-center gap-2 border rounded-lg p-2 ${i + 1 === cur ? 'border-orange bg-orange-light' : 'border-slate-200 bg-white'}">
        <span class="w-16 font-bold">ขา ${i + 1}</span>
        <span class="w-24 h-6 rounded border border-navy/30" style="background:${SWATCH[colorPin]}" aria-hidden="true"></span>
        <span>${esc(label(colorPin))}</span>
        ${i + 1 === cur ? '<span class="ml-auto text-xs text-orange font-semibold">กำลังเลือก</span>' : ''}
      </li>`).join('');
    root.querySelectorAll('[data-pin]').forEach(el => {
      const on = Number(el.dataset.pin) === cur;
      el.classList.toggle('sel', on);
      el.setAttribute('aria-pressed', String(on));
    });
  }

  const focusPin = () => root.querySelector(`[data-pin="${cur}"]`).focus();

  root.querySelectorAll('[data-pin]').forEach(b => b.addEventListener('click', () => { cur = Number(b.dataset.pin); paint(); }));
  root.querySelectorAll('[data-color]').forEach(b => b.addEventListener('click', () => {
    state.order[cur - 1] = Number(b.dataset.color);
    const next = cur < 8 ? cur + 1 : 8;
    say(`กำหนดขา ${cur} เป็น "${label(Number(b.dataset.color))}" แล้ว ขั้นต่อไปคือขา ${next}`, 'info');
    cur = next;
    paint();
    focusPin();
  }));

  root.addEventListener('keydown', (e) => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
    if (/^[1-8]$/.test(e.key)) { cur = Number(e.key); paint(); focusPin(); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { cur = cur === 8 ? 1 : cur + 1; paint(); focusPin(); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { cur = cur === 1 ? 8 : cur - 1; paint(); focusPin(); e.preventDefault(); }
  });

  root.querySelector('#tCheck').addEventListener('click', () => {
    const correct = state.order.filter((v, i) => v === i + 1).length;
    actStore.save('t568', { done: true, score: correct, total: 8, at: new Date().toISOString() });
    if (correct === 8) say('ถูกต้องครบทั้ง 8 ขา: ขาวส้ม · ส้ม · ขาวเขียว · น้ำเงิน · ขาวน้ำเงิน · เขียว · ขาวน้ำตาล · น้ำตาล (T568B) ผลนี้เป็นการจำลอง ไม่ได้ทดสอบหัวสายจริง', 'ok');
    else {
      const bad = state.order.findIndex((v, i) => v !== i + 1);
      say(`ถูก ${correct}/8 ขา · ขาที่ยังไม่ตรงคือขา ${bad + 1} ซึ่งควรเป็น "${label(bad + 1)}" ตรวจมุมมองและลำดับสีอีกครั้ง`, 'no');
    }
  });
  root.querySelector('#tReset').addEventListener('click', () => {
    state.order = [1, 2, 3, 4, 5, 6, 7, 8]; cur = 1; paint();
    say('เริ่มใหม่แล้ว กระดานถูกรีเซ็ตเป็นลำดับเดิม ต้องจัดใหม่ทั้งหมด', 'info');
    focusPin();
  });
  paint();
}

/* ---------- 3) ตรวจว่าอยู่ใน /24 เดียวกันไหม ---------- */
export function renderSubnetActivity(root) {
  const say = (msg, tone = 'info') => {
    const el = root.querySelector('[data-say]');
    el.className = 'mt-3 p-3 rounded-lg text-sm border-l-4 bg-' + (tone === 'ok' ? 'teal-light border-l-teal' : tone === 'no' ? 'orange-light border-l-orange' : 'blue-light border-l-blue');
    el.textContent = msg;
  };
  root.innerHTML = `
  <p class="text-navy/85">ใส่ที่อยู่ IPv4 สองค่า แล้วดูว่าอยู่ในเครือข่าย /24 เดียวกันหรือไม่
     ระบบตรวจว่าทั้ง 4 octet อยู่ในช่วง 0–255 และรูปแบบถูกต้องก่อนคำนวณเสมอ</p>
  <form class="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-end mt-3">
    <div>
      <label for="ipA" class="block font-semibold text-sm mb-1">ที่อยู่เครื่องที่ 1</label>
      <input id="ipA" type="text" inputmode="numeric" autocomplete="off" spellcheck="false"
        class="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-teal" aria-describedby="ipHelp" value="192.168.10.10">
    </div>
    <p class="pb-2.5 text-navy/60 font-semibold" aria-hidden="true">และ</p>
    <div>
      <label for="ipB" class="block font-semibold text-sm mb-1">ที่อยู่เครื่องที่ 2</label>
      <input id="ipB" type="text" inputmode="numeric" autocomplete="off" spellcheck="false"
        class="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-teal" aria-describedby="ipHelp" value="192.168.10.11">
    </div>
    <div class="sm:col-span-3 flex flex-wrap gap-2">
      <button type="submit" class="px-4 py-2.5 rounded-lg bg-teal text-white font-medium hover:bg-teal-dark">ตรวจสอบ</button>
      <button type="button" id="sClear" class="px-4 py-2.5 rounded-lg border border-navy/30 hover:bg-teal-light">ล้างค่า</button>
    </div>
  </form>
  <p id="ipHelp" class="text-sm text-navy/70 mt-2">ตัวอย่าง: 192.168.10.10 กับ 192.168.10.11 อยู่เครือข่ายเดียวกัน · 192.168.10.10 กับ 192.168.11.11 ไม่อยู่เครือข่ายเดียวกัน</p>
  <div data-say class="mt-3 p-3 rounded-lg text-sm border-l-4 bg-blue-light border-l-blue" role="status">กดตรวจสอบเพื่อดูผลลัพธ์</div>
  <div data-detail class="mt-3"></div>`;

  const parse = (v) => {
    const s = String(v == null ? '' : v).trim();
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(s)) return { err: 'รูปแบบไม่ถูกต้อง ต้องเป็นตัวเลข 4 ส่วนคั่นด้วยจุด เช่น 192.168.10.10' };
    const parts = s.split('.').map(Number);
    if (parts.some(p => !Number.isInteger(p) || p < 0 || p > 255)) return { err: 'แต่ละส่วนต้องเป็นจำนวนเต็มระหว่าง 0–255' };
    return { parts };
  };

  function run(e) {
    if (e) e.preventDefault();
    const va = root.querySelector('#ipA').value;
    const vb = root.querySelector('#ipB').value;
    const A = parse(va), B = parse(vb);
    if (A.err) { say('ที่อยู่เครื่องที่ 1: ' + A.err, 'no'); root.querySelector('[data-detail]').innerHTML = ''; root.querySelector('#ipA').focus(); return; }
    if (B.err) { say('ที่อยู่เครื่องที่ 2: ' + B.err, 'no'); root.querySelector('[data-detail]').innerHTML = ''; root.querySelector('#ipB').focus(); return; }

    const same = A.parts[0] === B.parts[0] && A.parts[1] === B.parts[1] && A.parts[2] === B.parts[2];
    const net = `${A.parts[0]}.${A.parts[1]}.${A.parts[2]}.0`;
    const bcast = `${A.parts[0]}.${A.parts[1]}.${A.parts[2]}.255`;
    const edge = [A.parts[3], B.parts[3]].some(v => v === 0 || v === 255);
    actStore.save('subnet', { done: true, same, a: va, b: vb, at: new Date().toISOString() });

    say(same
      ? `${va} และ ${vb} อยู่ในเครือข่าย /24 เดียวกัน (prefix ${A.parts[0]}.${A.parts[1]}.${A.parts[2]}) เครื่องทั้งสองส่งถึงกันได้โดยไม่ต้องผ่าน Gateway`
      : `${va} และ ${vb} ไม่อยู่ใน /24 เดียวกัน เพราะส่วนที่ 3 ของที่อยู่ต่างกัน ทั้งสองเครื่องต้องส่งผ่าน Gateway เพื่อคุยกัน`,
      same ? 'ok' : 'no');

    root.querySelector('[data-detail]').innerHTML = `
    <div class="overflow-x-auto">
      <table class="table-net">
        <caption class="sr-only">ผลการตรวจสอบที่อยู่และส่วนประกอบของแต่ละเครื่อง</caption>
        <thead><tr><th scope="col">รายการ</th><th scope="col">เครื่องที่ 1</th><th scope="col">เครื่องที่ 2</th></tr></thead>
        <tbody>
          <tr><td>ที่อยู่ IP</td><td>${esc(va)}</td><td>${esc(vb)}</td></tr>
          <tr><td>Mask ในรูปแบบ /24</td><td>255.255.255.0</td><td>255.255.255.0</td></tr>
          <tr><td>Prefix (ส่วนเครือข่าย)</td><td>${A.parts[0]}.${A.parts[1]}.${A.parts[2]}</td><td>${B.parts[0]}.${B.parts[1]}.${B.parts[2]}</td></tr>
          <tr><td>Host (ส่วนเครื่อง)</td><td>${A.parts[3]}</td><td>${B.parts[3]}</td></tr>
        </tbody>
      </table>
    </div>
    <ul class="mt-3 text-sm space-y-1 list-disc ml-5">
      <li><strong>Network address</strong> ของเครือข่ายนี้คือ ${esc(net)} ใช้ระบุกลุ่มเครือข่าย ไม่ใช้เป็นที่อยู่ของเครื่อง</li>
      <li><strong>Broadcast address</strong> คือ ${esc(bcast)} ใช้ส่งถึงทุกเครื่องในเครือข่าย ไม่ใช้เป็นที่อยู่ของเครื่อง</li>
      <li>ช่วงที่ใช้งานได้ของ /24 นี้คือ ${esc(net)} ถึง ${esc(bcast)} โดยใช้ค่า host 1–254</li>
      ${edge ? '<li class="text-orange font-semibold">ค่าที่กรอกมามี .0 หรือ .255 ซึ่งเป็น network หรือ broadcast ของ /24 นี้ ไม่ควรใช้เป็นที่อยู่ของเครื่อง</li>' : ''}
      <li>กิจกรรมนี้เป็นการจำลองบนเบราว์เซอร์ ไม่ได้ ping หรือทดสอบอุปกรณ์จริง</li>
    </ul>`;
  }

  root.querySelector('form').addEventListener('submit', run);
  root.querySelector('#sClear').addEventListener('click', () => {
    root.querySelector('#ipA').value = ''; root.querySelector('#ipB').value = '';
    root.querySelector('[data-detail]').innerHTML = '';
    say('ล้างค่าแล้ว ใส่ที่อยู่ใหม่ได้เลย', 'info');
    root.querySelector('#ipA').focus();
  });
  run();
}
