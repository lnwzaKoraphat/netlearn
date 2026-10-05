import { UNITS, LESSONS, LESSON_MAP, QUIZZES, GLOSSARY, PROJECT, getUnit, getLesson, flatLessons } from './data/index.js';
import { readStore, quizStore, actStore, clearAll } from './store.js';
import { renderMatchActivity, renderT568Activity, renderSubnetActivity } from './activities.js';
import { svgTopology, svgDataPath, svgStack, svgFolderTree, svgWiring, svgSegPath, svgTroubleshoot, svgHeroNet, svgRoomLayout } from './diagrams.js';

const app = document.getElementById('app');
let currentCleanup = null;

export const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------- layout shell ---------------- */

function navHTML(active) {
  const items = [
    ['#/', 'หน้าแรก'],
    ['#/path', 'เส้นทางเรียน'],
    ['#/lessons', 'บทเรียนทั้งหมด'],
    ['#/project', 'โครงงาน'],
    ['#/progress', 'ความคืบหน้า'],
    ['#/glossary', 'คำศัพท์'],
  ];
  return items.map(([href, label]) => {
    const isOn = active === href;
    return `<a href="${href}"${isOn ? ' aria-current="page"' : ''}
      class="px-3 py-2 rounded-lg text-[0.95rem] font-medium whitespace-nowrap transition-colors
      ${isOn ? 'bg-teal text-white' : 'text-navy hover:bg-teal-light hover:text-teal-dark'}">${label}</a>`;
  }).join('');
}

function layout(active, main) {
  return `
  <a href="#main" class="skip-link">ข้ามไปยังเนื้อหาหลัก</a>
  <header class="bg-white border-b border-slate-200 sticky top-0 z-40">
    <div class="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
      <a href="#/" class="flex items-center gap-2 shrink-0">
        <span class="w-9 h-9 rounded-lg bg-teal text-white grid place-items-center font-bold text-lg" aria-hidden="true">N</span>
        <span class="text-xl font-bold text-navy">NetLearn</span>
      </a>
      <button id="menuBtn" class="ml-auto md:hidden px-3 py-2 rounded-lg border border-navy/30 text-sm font-medium"
        aria-expanded="false" aria-controls="mainNav">เมนู</button>
      <nav id="mainNav" class="order-last w-full md:order-none md:ml-auto md:w-auto hidden md:flex flex-col md:flex-row gap-1 pb-2 md:pb-0"
        aria-label="เมนูหลัก">
        ${navHTML(active)}
      </nav>
    </div>
  </header>
  <main id="main" tabindex="-1">${main}</main>
  <footer class="bg-navy text-white/90 mt-16">
    <div class="max-w-6xl mx-auto px-4 py-8 text-sm leading-relaxed">
      <p class="font-semibold text-white mb-2">NetLearn — คลังเรียนรู้เครือข่ายคอมพิวเตอร์ (6 หน่วย)</p>
      <p>เนื้อหานี้จัดทำเพื่อประกอบการเรียนรู้ เนื้อหาและกิจกรรมเป็นข้อเสนอสำหรับการเรียน ไม่ใช่รายการทั้งหมดจากเอกสารรายวิชา
         และไม่มีการรับรองผลการเรียนจากหน่วยงานใด</p>
      <p class="mt-2">กิจกรรมทั้งหมดเป็น <strong>การจำลอง (simulation)</strong> บนเบราว์เซอร์ ไม่ได้ทดสอบอุปกรณ์จริง
         ความคืบหน้าและคะแนนเก็บเป็น <strong>ข้อมูลเฉพาะเบราว์เซอร์</strong> (localStorage) เท่านั้น ไม่มีระบบบัญชีผู้ใช้และไม่มีเซิร์ฟเวอร์รับข้อมูล</p>
    </div>
  </footer>`;
}

function toast(msg) {
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-navy text-white px-4 py-2.5 rounded-lg shadow-lg text-sm';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

/* ---------------- shared bits ---------------- */

function unitProgress(unit) {
  const read = readStore.all();
  const done = unit.lessons.filter(l => read[l.id]).length;
  return { done, total: unit.lessons.length, pct: Math.round((done / unit.lessons.length) * 100) };
}

function unitCard(u, i) {
  const p = unitProgress(u);
  return `
  <article class="card card-hover p-5 flex flex-col">
    <div class="flex items-start gap-3">
      <span class="w-9 h-9 shrink-0 rounded-lg bg-blue-light text-blue font-bold grid place-items-center">${i + 1}</span>
      <div class="min-w-0">
        <h3 class="text-lg font-bold leading-snug"><a class="hover:text-teal-dark focus-visible:text-teal-dark" href="#/path/${u.id}">${esc(u.title)}</a></h3>
        <p class="text-sm text-navy/70 leading-relaxed mt-1">${esc(u.subtitle)}</p>
      </div>
    </div>
    <p class="text-sm mt-3 flex-1"><span class="font-semibold">ผลลัพธ์:</span> ${esc(u.outcome)}</p>
    <div class="mt-4">
      <div class="flex justify-between text-sm mb-1">
        <span>อ่านแล้ว ${p.done}/${p.total} บท</span>
        <span class="font-semibold">${p.pct}%</span>
      </div>
      <div class="h-2.5 rounded-full bg-slate-200 overflow-hidden" role="img" aria-label="ความคืบหน้าการอ่านหน่วย ${i + 1} ${p.pct} เปอร์เซ็นต์">
        <div class="h-full bg-teal" style="width:${p.pct}%"></div>
      </div>
    </div>
    <div class="mt-4 flex flex-wrap gap-2">
      <a href="#/path/${u.id}" class="px-3 py-2 rounded-lg bg-teal text-white text-sm font-medium hover:bg-teal-dark">เรียนหน่วยนี้</a>
      <a href="#/quiz/${u.id}" class="px-3 py-2 rounded-lg border border-teal text-teal-dark text-sm font-medium hover:bg-teal-light">แบบทดสอบ</a>
    </div>
  </article>`;
}

/* ---------------- pages ---------------- */

function pageHome() {
  const lessons = flatLessons();
  const read = readStore.all();
  const done = lessons.filter(l => read[l.id]).length;
  const pct = Math.round((done / lessons.length) * 100);
  return `
  <section class="hero-grid-bg bg-white border-b border-slate-200">
    <div class="max-w-6xl mx-auto px-4 py-10 md:py-14 grid md:grid-cols-2 gap-8 items-center">
      <div>
        <p class="chip chip-info mb-3">วิชาพื้นฐานเครือข่ายคอมพิวเตอร์ · 6 หน่วย</p>
        <h1 class="text-3xl md:text-4xl font-bold leading-snug text-navy">เรียนเครือข่ายตั้งแต่พื้นฐาน ถึงติดตั้ง ออกแบบ แก้ปัญหา และความปลอดภัย</h1>
        <p class="mt-4 text-navy/80 leading-relaxed">
          เส้นทางเรียนแบบเป็นขั้น อ่านได้ทุกบท มีเป้าหมาย ตัวอย่าง จุดที่ควรระวัง แบบทดสอบ 5 ข้อต่อหน่วย
          และกิจกรรมโต้ตอบ 3 อย่าง (จับคู่อุปกรณ์ / เรียงสีสาย T568B / ตรวจ IPv4) ใช้ได้ทั้งคีย์บอร์ดและมือถือ
        </p>
        <div class="mt-6 flex flex-wrap gap-3">
          <a href="#/path" class="px-5 py-3 rounded-lg bg-teal text-white font-medium hover:bg-teal-dark">เริ่มเส้นทางเรียน</a>
          <a href="#/lessons" class="px-5 py-3 rounded-lg border border-navy/30 font-medium hover:bg-teal-light">ค้นหาบทเรียน</a>
        </div>
        <div class="mt-6 max-w-sm">
          <div class="flex justify-between text-sm mb-1"><span>อ่านแล้ว ${done}/${lessons.length} บท</span><span class="font-semibold">${pct}%</span></div>
          <div class="h-2.5 rounded-full bg-slate-200 overflow-hidden" role="img" aria-label="ความคืบหน้ารวม ${pct} เปอร์เซ็นต์">
            <div class="h-full bg-teal" style="width:${pct}%"></div>
          </div>
          <p class="text-xs text-navy/60 mt-1">บันทึกไว้ในเบราว์เซอร์เครื่องนี้เท่านั้น</p>
        </div>
      </div>
      <div class="card p-4">${svgHeroNet()}</div>
    </div>
  </section>

  <section class="max-w-6xl mx-auto px-4 py-10">
    <h2 class="text-2xl font-bold mb-1">หน่วยการเรียนรู้ทั้ง 6 หน่วย</h2>
    <p class="text-navy/70 mb-6">แต่ละหน่วยประกอบด้วยบทเรียน ผลลัพธ์การเรียนรู้ แบบทดสอบ 5 ข้อ และกิจกรรม</p>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">${UNITS.map(unitCard).join('')}</div>
  </section>

  <section class="max-w-6xl mx-auto px-4 pb-4">
    <h2 class="text-2xl font-bold mb-4">เส้นทางข้อมูลในห้องเรียน</h2>
    <div class="grid md:grid-cols-2 gap-5">
      <div class="card p-5">
        <h3 class="font-bold text-lg mb-2">ส่งไฟล์ภายในห้อง (ไม่ต้องมีอินเทอร์เน็ต)</h3>
        ${svgDataPath()}
        <p class="text-sm mt-2 text-navy/80">คอมพิวเตอร์ต้นทาง → Switch → คอมพิวเตอร์ปลายทาง ผ่านสายและพอร์ตภายใน LAN เท่านั้น</p>
      </div>
      <div class="card p-5">
        <h3 class="font-bold text-lg mb-2">เข้าเว็บไซต์ภายนอก (ต้องมี Gateway)</h3>
        ${svgStack()}
        <p class="text-sm mt-2 text-navy/80">เมื่อปลายทางอยู่คนละเครือข่าย ข้อมูลจะผ่าน Default Gateway และ Router ออกไป</p>
      </div>
    </div>
  </section>`;
}

function pagePath() {
  const rows = UNITS.map(u => {
    const p = unitProgress(u);
    return `
    <li class="card p-5">
      <div class="flex flex-wrap items-center gap-2 mb-2">
        <span class="chip chip-info">หน่วย ${UNITS.indexOf(u) + 1}</span>
        <span class="text-xs text-navy/60">${p.done}/${p.total} บท · แบบทดสอบ ${quizStore.forUnit(u.id) ? (quizStore.forUnit(u.id).passed ? 'ผ่าน' : 'ยังไม่ผ่าน') : 'ยังไม่ได้ทำ'}</span>
      </div>
      <h2 class="text-xl font-bold"><a class="hover:text-teal-dark" href="#/path/${u.id}">${esc(u.title)}</a></h2>
      <p class="text-navy/75 mt-1">${esc(u.subtitle)}</p>
      <p class="text-sm mt-2"><span class="font-semibold">ผลลัพธ์การเรียนรู้:</span> ${esc(u.outcome)}</p>
      <ol class="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
        ${u.lessons.map(l => `
          <li class="flex items-start gap-2 py-0.5">
            <span aria-hidden="true" class="mt-0.5 font-bold ${readStore.isRead(l.id) ? 'text-teal' : 'text-navy/30'}">${readStore.isRead(l.id) ? '✔' : '○'}</span>
            <span>${esc(l.no)} ${esc(l.title)}${readStore.isRead(l.id) ? ' <span class="text-teal font-medium">(อ่านแล้ว)</span>' : ''}</span>
          </li>`).join('')}
      </ol>
      <div class="mt-4 flex flex-wrap gap-2">
        <a href="#/path/${u.id}" class="px-3 py-2 rounded-lg bg-teal text-white text-sm font-medium hover:bg-teal-dark">เปิดหน่วย</a>
        <a href="#/quiz/${u.id}" class="px-3 py-2 rounded-lg border border-teal text-teal-dark text-sm font-medium hover:bg-teal-light">แบบทดสอบหน่วยนี้</a>
      </div>
    </li>`;
  }).join('');
  return `
  <div class="max-w-4xl mx-auto px-4 py-8">
    <nav aria-label="เส้นทาง" class="text-sm text-navy/60 mb-2"><a class="hover:text-teal-dark" href="#/">หน้าแรก</a> / เส้นทางเรียน</nav>
    <h1 class="text-2xl md:text-3xl font-bold mb-2">เส้นทางการเรียน 6 หน่วย</h1>
    <p class="text-navy/75 mb-6">เรียนตามลำดับหน่วย 1 → 6 หรือข้ามไปยังบทที่สนใจได้ ทุกบทเปิดได้จาก URL และรีโหลดหน้าได้โดยไม่หาย</p>
    <ol class="space-y-4">${rows}</ol>
  </div>`;
}

function pageUnit(unitId) {
  const u = getUnit(unitId);
  if (!u) return pageNotFound();
  const idx = UNITS.indexOf(u);
  const p = unitProgress(u);
  const qz = quizStore.forUnit(u.id);
  return `
  <div class="max-w-5xl mx-auto px-4 py-8">
    <nav aria-label="เส้นทาง" class="text-sm text-navy/60 mb-2">
      <a class="hover:text-teal-dark" href="#/">หน้าแรก</a> /
      <a class="hover:text-teal-dark" href="#/path">เส้นทางเรียน</a> / หน่วย ${idx + 1}
    </nav>
    <h1 class="text-2xl md:text-3xl font-bold">${esc(u.title)}</h1>
    <p class="text-navy/75 mt-1">${esc(u.subtitle)}</p>
    <div class="card p-4 mt-4 border-l-4 border-l-teal">
      <p class="font-semibold">ผลลัพธ์การเรียนรู้ของหน่วยนี้</p>
      <p class="mt-1 text-navy/85">${esc(u.outcome)}</p>
      ${u.activity ? `
      <div class="mt-4 border-t border-slate-200 pt-3">
        <p class="font-semibold text-orange">กิจกรรมประจำหน่วย</p>
        <p class="mt-1 text-navy/85">${esc(u.activity.text)}</p>
      </div>` : ''}
    </div>
    <div class="mt-5 flex flex-wrap gap-3 items-center">
      <a href="#/lesson/${u.id}/${u.lessons[0].id}" class="px-4 py-2.5 rounded-lg bg-teal text-white font-medium hover:bg-teal-dark">เริ่มบทแรก</a>
      <a href="#/quiz/${u.id}" class="px-4 py-2.5 rounded-lg border border-teal text-teal-dark font-medium hover:bg-teal-light">แบบทดสอบหน่วยนี้</a>
      <span class="text-sm text-navy/70">อ่านแล้ว ${p.done}/${p.total} บท${qz ? (qz.passed ? ' · แบบทดสอบผ่าน' : ' · แบบทดสอบยังไม่ผ่าน') : ''}</span>
    </div>
    <h2 class="text-xl font-bold mt-8 mb-3">บทเรียนในหน่วยนี้</h2>
    <ol class="space-y-3">
      ${u.lessons.map((l, i) => `
      <li class="card p-4 flex flex-wrap items-center gap-3">
        <span class="font-bold text-blue">${esc(l.no)}</span>
        <div class="flex-1 min-w-[12rem]">
          <a class="font-semibold hover:text-teal-dark" href="#/lesson/${u.id}/${l.id}">${esc(l.title)}</a>
          <p class="text-sm text-navy/70">${esc(l.summary[0])}</p>
        </div>
        ${readStore.isRead(l.id) ? '<span class="chip chip-ok">อ่านแล้ว</span>' : '<span class="chip chip-info">ยังไม่อ่าน</span>'}
        <a href="#/lesson/${u.id}/${l.id}" class="px-3 py-2 rounded-lg border border-teal text-teal-dark text-sm font-medium hover:bg-teal-light">เปิดบท</a>
      </li>`).join('')}
    </ol>
    <div class="mt-8 flex flex-wrap gap-3">
      ${idx > 0 ? `<a href="#/path/${UNITS[idx - 1].id}" class="px-4 py-2 rounded-lg border border-navy/30 hover:bg-teal-light">← หน่วยก่อนหน้า</a>` : ''}
      ${idx < UNITS.length - 1 ? `<a href="#/path/${UNITS[idx + 1].id}" class="px-4 py-2 rounded-lg bg-teal text-white hover:bg-teal-dark">หน่วยถัดไป →</a>` : ''}
    </div>
  </div>`;
}

function pageLessons() {
  const all = flatLessons();
  return `
  <div class="max-w-5xl mx-auto px-4 py-8">
    <h1 class="text-2xl md:text-3xl font-bold">บทเรียนทั้งหมด (${all.length} บท)</h1>
    <p class="text-navy/75 mt-1 mb-5">ค้นหาจากชื่อบทหรือเนื้อหาในบท รวมถึงข้อความในกิจกรรมและแบบทดสอบของหน่วยนั้น</p>
    <div class="max-w-xl">
      <label for="q" class="block font-semibold mb-1">ค้นหาบทเรียน</label>
      <input id="q" type="search" class="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white focus:border-teal"
        placeholder="เช่น T568B, DHCP, subnet, NTFS, firewall" autocomplete="off" />
      <p id="qcount" class="text-sm text-navy/70 mt-2" role="status"></p>
    </div>
    <div id="results" class="mt-5 space-y-3"></div>
  </div>`;
}

function lessonResultHTML(l, q) {
  const hay = (l.title + ' ' + l.no + ' ' + JSON.stringify(l.body) + ' ' + JSON.stringify(l.example || '') + ' ' + l.summary.join(' ') + ' ' + l.pitfalls.map(p => p.wrong + p.right).join(' ')).toLowerCase();
  if (q && !hay.includes(q)) return '';
  const u = getUnit(l.unitId);
  return `
  <li class="card p-4 flex flex-wrap items-center gap-3">
    <span class="chip chip-info">${esc(l.no)}</span>
    <div class="flex-1 min-w-[12rem]">
      <a class="font-semibold hover:text-teal-dark" href="#/lesson/${u.id}/${l.id}">${esc(l.title)}</a>
      <p class="text-sm text-navy/70">หน่วย ${UNITS.indexOf(u) + 1}: ${esc(u.title)}</p>
    </div>
    ${readStore.isRead(l.id) ? '<span class="chip chip-ok">อ่านแล้ว</span>' : ''}
  </li>`;
}

function pageQuiz(unitId) {
  const u = getUnit(unitId);
  if (!u) return pageNotFound();
  const qs = QUIZZES[u.id];
  const rec = quizStore.forUnit(u.id);
  return `
  <div class="max-w-3xl mx-auto px-4 py-8">
    <nav aria-label="เส้นทาง" class="text-sm text-navy/60 mb-2">
      <a class="hover:text-teal-dark" href="#/">หน้าแรก</a> /
      <a class="hover:text-teal-dark" href="#/path/${u.id}">${esc(u.title)}</a> / แบบทดสอบ
    </nav>
    <h1 class="text-2xl md:text-3xl font-bold">แบบทดสอบหน่วย ${UNITS.indexOf(u) + 1}: ${esc(u.title)}</h1>
    <p class="text-navy/75 mt-1 mb-4">ชนิดปัญยาวยาว 5 ข้อ ตัวเลือก 4 ตัวต่อข้อ เลือกได้ครั้งเดียวแล้วดูเฉลยพร้อมเหตุผล
       ข้อนี้เป็นข้อเสนอสำหรับการประเมิน ไม่ใช่รายการคำถามจากข้อสอบจริง</p>
    ${rec ? `
    <div class="card p-4 mb-5 border-l-4 border-l-teal">
      <p class="font-semibold">ผลการทำครั้งล่าสุด</p>
      <p class="mt-1">ได้ ${rec.lastScore}/${qs.length} ข้อ · คะแนนเดิมสูงสุด ${rec.bestScore}/${qs.length} ·
        ${rec.passed ? '<span class="chip chip-ok">ผ่าน</span>' : '<span class="chip chip-no">ยังไม่ผ่าน</span>'}
        · เกณฑ์ผ่าน 4/5 · ทำเมื่อ ${new Date(rec.at).toLocaleString('th-TH')}</p>
    </div>` : ''}
    <form id="quizForm" novalidate>
      ${qs.map((q, i) => `
      <fieldset class="card p-5 mb-4">
        <legend class="font-semibold text-lg px-1">ข้อ ${i + 1}. ${esc(q.q)}</legend>
        <div class="mt-2 space-y-2">
          ${q.options.map((o, oi) => `
          <label class="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-teal-light cursor-pointer">
            <input type="radio" name="q${i}" value="${oi}" class="mt-1.5 w-4 h-4 accent-teal" required>
            <span>${esc(o)}</span>
          </label>`).join('')}
        </div>
        <div class="fb hidden mt-3 p-3 rounded-lg text-sm" data-fb="${i}"></div>
      </fieldset>`).join('')}
      <div class="flex flex-wrap gap-3 items-center">
        <button type="submit" class="px-5 py-3 rounded-lg bg-teal text-white font-medium hover:bg-teal-dark">ส่งคำตอบ</button>
        <a href="#/lesson/${u.id}/${u.lessons[u.lessons.length - 1].id}" class="px-5 py-3 rounded-lg border border-navy/30 hover:bg-teal-light">ทบทวนบทเรียน</a>
      </div>
      <p id="score" class="mt-4 font-semibold" role="status"></p>
      <p class="text-sm text-navy/70 mt-2">คะแนนเก็บเป็นข้อมูลเฉพาะเบราว์เซอร์ (localStorage) ไม่มีระบบบัญชีผู้ใช้</p>
    </form>
  </div>`;
}

function pageLesson(unitId, lessonId) {
  const l = getLesson(lessonId);
  if (!l || l.unitId !== unitId) return pageNotFound();
  const u = getUnit(unitId);
  const idxAll = flatLessons().findIndex(x => x.id === l.id);
  const prev = flatLessons()[idxAll - 1];
  const next = flatLessons()[idxAll + 1];
  const isRead = readStore.isRead(l.id);

  let extra = '';
  if (u.id === 'u1') extra = `<div class="card p-5">${svgTopology()}<p class="text-sm text-navy/75 mt-3">ผัง Star รูปแบบที่พบบ่อยที่สุดใน LAN ด้วยสาย UTP: เมื่อสายของคอมพิวเตอร์หนึ่งเครื่องหลุด เครื่องนั้นหยุดทำงาน แต่เครื่องอื่นยังใช้งานได้</p></div>`;
  if (u.id === 'u2') extra = `<div class="card p-5">${svgStack()}</div>`;
  if (u.id === 'u3') extra = `<div class="card p-5">${svgWiring()}<p class="text-sm text-navy/75 mt-3">ลำดับสีหัว RJ45 มาตรฐาน T568B ข้างซ้ายเมื่อมองจากด้านหน้าสัมผัสโลหะ สลักอยู่ด้านหลังและสายห้อยลง</p></div>`;
  if (u.id === 'u4') extra = `<div class="card p-5">${svgFolderTree()}</div>`;
  if (u.id === 'u5') extra = `<div class="card p-5">${svgSegPath()}</div>`;
  if (u.id === 'u6') extra = `<div class="card p-5">${svgTroubleshoot()}</div>`;

  const act = l.activityId;
  return `
  <div class="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[16rem_1fr] gap-7">
    <aside class="lg:sticky lg:top-24 self-start">
      <nav aria-label="เป้าหมายบทเรียน" class="card p-4">
        <p class="text-xs text-navy/60">หน่วย ${UNITS.indexOf(u) + 1}</p>
        <p class="font-semibold text-sm mb-3">${esc(u.title)}</p>
        <p class="font-semibold text-sm border-b border-slate-200 pb-2">${esc(l.no)} ${esc(l.title)}</p>
        <ul class="mt-3 text-sm space-y-1.5">
          ${l.objectives.map((o, i) => `<li><a class="hover:text-teal-dark" href="#obj-${i}">${esc(o)}</a></li>`).join('')}
        </ul>
        <div class="mt-4 pt-3 border-t border-slate-200 text-sm space-y-1">
          <a class="block hover:text-teal-dark font-medium" href="#sec-example">ตัวอย่าง</a>
          <a class="block hover:text-teal-dark font-medium" href="#sec-pitfall">จุดที่เข้าใจผิด</a>
          <a class="block hover:text-teal-dark font-medium" href="#sec-summary">สรุป</a>
          ${act ? `<a class="block hover:text-teal-dark font-medium" href="#sec-activity">กิจกรรม</a>` : ''}
        </div>
      </nav>
    </aside>

    <article>
      <nav aria-label="เส้นทาง" class="text-sm text-navy/60 mb-2">
        <a class="hover:text-teal-dark" href="#/">หน้าแรก</a> /
        <a class="hover:text-teal-dark" href="#/path/${u.id}">หน่วย ${UNITS.indexOf(u) + 1}</a> / ${esc(l.no)}
      </nav>
      <h1 class="text-2xl md:text-3xl font-bold">${esc(l.no)} ${esc(l.title)}</h1>
      <p class="text-navy/70 mt-1">${esc(l.subtitle || u.subtitle)}</p>

      <section class="card p-5 mt-4 border-l-4 border-l-blue">
        <h2 class="font-bold text-lg">เป้าหมายของบทนี้</h2>
        <ol class="mt-2 ml-5 list-decimal space-y-1">
          ${l.objectives.map((o, i) => `<li id="obj-${i}" class="hash-anchor">${esc(o)}</li>`).join('')}
        </ol>
      </section>

      <section class="lesson-body prose-net mt-5">
        <h2 class="text-xl font-bold text-navy">คำอธิบาย</h2>
        ${l.body.map(b => renderBlock(b)).join('')}
      </section>

      ${extra}

      <section id="sec-example" class="hash-anchor card p-5 mt-5 border-l-4 border-l-teal">
        <h2 class="font-bold text-lg">ตัวอย่าง</h2>
        <p class="mt-1"><strong>${esc(l.example.title)}</strong></p>
        <p class="mt-1 text-navy/85">${esc(l.example.text)}</p>
        ${l.example.steps ? `<ol class="mt-2 ml-5 list-decimal space-y-1 text-navy/85">${l.example.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
        ${l.example.note ? `<p class="mt-3 text-sm bg-orange-light border-l-4 border-l-orange p-3 rounded">${esc(l.example.note)}</p>` : ''}
      </section>

      <section id="sec-pitfall" class="hash-anchor card p-5 mt-5 border-l-4 border-l-orange">
        <h2 class="font-bold text-lg">จุดที่เข้าใจผิดบ่อย</h2>
        <ul class="mt-2 space-y-3">
          ${l.pitfalls.map(p => `
          <li>
            <p class="text-sm"><span class="chip chip-no mr-1">ผิด</span>${esc(p.wrong)}</p>
            <p class="text-sm mt-1"><span class="chip chip-ok mr-1">ถูก</span>${esc(p.right)}</p>
            <p class="text-sm text-navy/70 mt-1">เหตุผล: ${esc(p.why)}</p>
          </li>`).join('')}
        </ul>
      </section>

      <section id="sec-summary" class="hash-anchor card p-5 mt-5 border-l-4 border-l-teal">
        <h2 class="font-bold text-lg">สรุป 3 ข้อ</h2>
        <ol class="mt-2 ml-5 list-decimal space-y-1">${l.summary.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      </section>

      ${act ? `
      <section id="sec-activity" class="hash-anchor card p-5 mt-5 border-l-4 border-l-blue">
        <h2 class="font-bold text-lg">กิจกรรมโต้ตอบ</h2>
        <p class="text-sm text-navy/75 mt-1">กิจกรรมนี้เป็นการจำลอง (simulation) บนเบราว์เซอร์ ไม่ได้ทดสอบอุปกรณ์จริง
           ผลที่ได้จึงเป็นการฝึกทักษะ ไม่ใช่ผลวัดจากอุปกรณ์</p>
        <div id="actRoot" class="mt-3"></div>
      </section>` : ''}

      <section class="mt-6 flex flex-wrap gap-3 items-center">
        <button id="markRead" class="px-5 py-3 rounded-lg ${isRead ? 'bg-white border border-teal text-teal-dark' : 'bg-teal text-white'} font-medium hover:bg-teal-dark">
          ${isRead ? 'ยกเลิกเครื่องหมาย "อ่านแล้ว"' : 'ทำเครื่องหมายว่าอ่านแล้ว'}
        </button>
        <a href="#/quiz/${u.id}" class="px-5 py-3 rounded-lg border border-navy/30 hover:bg-teal-light">แบบทดสอบหน่วยนี้</a>
      </section>
      <p class="text-sm text-navy/70 mt-2">สถานะการอ่านถูกบันทึกใน localStorage ของเบราว์เซอร์นี้ ผู้เรียนทุกคนจึงเห็นข้อมูลของตัวเองแยกกัน</p>

      <nav aria-label="บทก่อนหน้าและถัดไป" class="mt-8 flex flex-wrap gap-3 border-t border-slate-200 pt-5">
        ${prev ? `<a href="#/lesson/${prev.unitId}/${prev.id}" class="px-4 py-2.5 rounded-lg border border-navy/30 hover:bg-teal-light">← ${esc(prev.no)} ${esc(prev.title)}</a>` : '<span></span>'}
        ${next ? `<a href="#/lesson/${next.unitId}/${next.id}" class="px-4 py-2.5 rounded-lg bg-teal text-white hover:bg-teal-dark">${esc(next.no)} ${esc(next.title)} →</a>` : ''}
      </nav>
    </article>
  </div>`;
}

function renderBlock(b) {
  if (b.p) return `<p>${esc(b.p)}</p>`;
  if (b.ul) return `<ul>${b.ul.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
  if (b.ol) return `<ol class="ml-5 list-decimal space-y-1 mb-4">${b.ol.map(i => `<li>${esc(i)}</li>`).join('')}</ol>`;
  if (b.callout) {
    const tone = b.tone === 'warn' ? 'bg-orange-light border-l-orange' : 'bg-blue-light border-l-blue';
    return `<div class="my-3 p-4 rounded-lg border-l-4 ${tone}"><p>${esc(b.callout)}</p></div>`;
  }
  if (b.table) {
    return `<div class="overflow-x-auto my-4"><table class="table-net"><caption class="sr-only">${esc(b.caption || 'ตารางประกอบ')}</caption>
      <thead><tr>${b.table.head.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${b.table.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  if (b.code) {
    return `<pre class="my-4 p-4 rounded-lg bg-navy text-white/95 overflow-x-auto text-[0.9rem]"><code>${esc(b.code)}</code></pre>`;
  }
  if (b.svg) {
    const map = { topology: svgTopology, datapath: svgDataPath, stack: svgStack, wiring: svgWiring, seg: svgSegPath, trouble: svgTroubleshoot, room: svgRoomLayout };
    const f = map[b.svg];
    return f ? `<figure class="my-4 card p-4">${f()}<figcaption class="text-sm text-navy/70 mt-2">${esc(b.caption || '')}</figcaption></figure>` : '';
  }
  return '';
}

function pageProject() {
  return `
  <div class="max-w-5xl mx-auto px-4 py-8">
    <h1 class="text-2xl md:text-3xl font-bold">โครงงานบูรณาการ: ออกแบบห้องคอมพิวเตอร์ 20 เครื่อง</h1>
    <p class="text-navy/75 mt-1 mb-5">ภารกิจประจำรายวิชา ใช้ความรู้ทั้ง 6 หน่วยร่วมกัน ผลงานที่ส่งและเกณฑ์ประเมินที่เสนอเป็นข้อมูลจากเนื้อหาบทเรียน</p>

    <section class="card p-5">
      <h2 class="font-bold text-lg">1. ขอบเขตงาน (สถานการณ์สมมติสำหรับการเรียน)</h2>
      <ul class="mt-2 ml-5 list-disc space-y-1">
        ${PROJECT.scope.map(s => `<li>${esc(s)}</li>`).join('')}
      </ul>
      <h3 class="font-semibold mt-4">สิ่งที่ต้องส่ง (5 ชิ้น)</h3>
      <ol class="mt-2 ml-5 list-decimal space-y-1">${PROJECT.deliverables.map(d => `<li>${esc(d)}</li>`).join('')}</ol>
    </section>

    <section class="card p-5 mt-4">
      <h2 class="font-bold text-lg">2. ผังกายภาพตัวอย่าง (20 เครื่อง + เครื่องผู้สอน + เครื่องพิมพ์)</h2>
      ${svgRoomLayout()}
      <p class="text-sm text-navy/75 mt-2">ตัวอย่างนี้เป็นแนวทาง นักเรียนต้องร่างผังของตนเองพร้อมระยะสายและตำแหน่งติดตั้งจริงในห้อง</p>
    </section>

    <section class="card p-5 mt-4">
      <h2 class="font-bold text-lg">3. นับพอร์ตและการเผื่อขยาย</h2>
      <div class="overflow-x-auto mt-2">
        <table class="table-net">
          <thead><tr><th scope="col">รายการ</th><th scope="col">จำนวน</th><th scope="col">พอร์ตที่ใช้</th><th scope="col">หมายเหตุ</th></tr></thead>
          <tbody>
            ${PROJECT.portTable.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>
      <p class="text-sm mt-3 font-semibold">สรุป: ต้องการ 22 พอร์ต → เลือก Switch 24 พอร์ต เผื่อขยาย 2 พอร์ต (หรือ 48 พอร์ตเมื่อเตรียมอุปกรณ์เพิ่ม)</p>
    </section>

    <section class="card p-5 mt-4">
      <h2 class="font-bold text-lg">4. ตารางแผน IP และอุปกรณ์ (ตัวอย่าง)</h2>
      <div class="overflow-x-auto mt-2">
        <table class="table-net">
          <thead><tr><th scope="col">อุปกรณ์</th><th scope="col">IP</th><th scope="col">Prefix</th><th scope="col">Gateway</th><th scope="col">วิธีรับ IP</th><th scope="col">ตำแหน่ง</th></tr></thead>
          <tbody>${PROJECT.ipTable.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>
      <p class="text-sm mt-3">DHCP pool ต้องไม่ทับกับช่วง static: จากตารางนี้ pool คือ ${esc(PROJECT.dhcpRange)} และ static อยู่นอกช่วงนั้น
        ตรวจสอบกับค่าที่ตั้งจริงบน Router ก่อนติดตั้ง</p>
    </section>

    <section class="card p-5 mt-4">
      <h2 class="font-bold text-lg">5. ตารางสิทธิ์ (ตัวอย่างตามหลัก least privilege)</h2>
      <div class="overflow-x-auto mt-2">
        <table class="table-net">
          <thead><tr><th scope="col">โฟลเดอร์/งาน</th><th scope="col">ผู้ดูแล</th><th scope="col">ผู้สอน</th><th scope="col">นักเรียน</th></tr></thead>
          <tbody>${PROJECT.permTable.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>
      <p class="text-sm mt-3">ออกแบบโฟลเดอร์ดังนี้เพื่อไม่ให้นักเรียนลบงานของกัน: งานแต่ละคนอยู่คนละโฟลเดอร์
        การฝากไฟล์อย่างเดียวต้องทำด้วยสิทธิ์เฉพาะที่ออกแบบเพิ่มเติม ไม่ใช่การตั้ง Modify ร่วมกันทั้งโฟลเดอร์</p>
    </section>

    <section class="card p-5 mt-4">
      <h2 class="font-bold text-lg">6. แผนทดสอบและตรวจรับ</h2>
      <div class="overflow-x-auto mt-2">
        <table class="table-net">
          <thead><tr><th scope="col">รายการทดสอบ</th><th scope="col">วิธีตรวจ</th><th scope="col">ผลที่คาดหวัง</th><th scope="col">ผ่าน/ไม่ผ่าน</th></tr></thead>
          <tbody>${PROJECT.testTable.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>
      <p class="text-sm mt-3">บน Windows ใช้ <code class="bg-slate-100 px-1 rounded">ipconfig /all</code>,
        <code class="bg-slate-100 px-1 rounded">ping</code>, <code class="bg-slate-100 px-1 rounded">tracert</code> เป็นตัวช่วยตรวจ
        ชื่อเมนูและตัวเลือกอาจต่างกันตามเวอร์ชัน จึงยึดหน้าที่ของค่าที่ตั้งเป็นหลัก</p>
    </section>

    <section class="card p-5 mt-4">
      <h2 class="font-bold text-lg">7. รายงานแก้ปัญหา 3 กรณี (กรอบการเขียน)</h2>
      <p class="text-sm text-navy/75 mb-3">กรณีตัวอย่างเพื่อฝึกเขียน ไม่ใช่เหตุการณ์ที่เกิดขึ้นจริงในห้อง</p>
      ${PROJECT.caseTemplate.map((c, i) => `
      <div class="border border-slate-200 rounded-lg p-4 mb-3">
        <p class="font-semibold">กรณีที่ ${i + 1}: ${esc(c.symptom)}</p>
        <ol class="mt-2 ml-5 list-decimal text-sm space-y-1">
          <li>สอบถามขอบเขตและอาการ: ${esc(c.q1)}</li>
          <li>ตรวจชั้นที่ ${esc(c.q2)}</li>
          <li>สมมติฐาน: ${esc(c.hypo)}</li>
          <li>หลักฐานที่บันทึก: ${esc(c.evidence)}</li>
          <li>การทดสอบหลังแก้: ${esc(c.verify)}</li>
        </ol>
        <p class="text-sm mt-2"><strong>ข้อควรระวัง:</strong> ${esc(c.caution)}</p>
      </div>`).join('')}
    </section>

    <section class="card p-5 mt-4 border-l-4 border-l-orange">
      <h2 class="font-bold text-lg">8. เกณฑ์ประเมินที่เสนอ</h2>
      <div class="overflow-x-auto mt-2">
        <table class="table-net">
          <thead><tr><th scope="col">ส่วน</th><th scope="col">น้ำหนัก</th><th scope="col">สิ่งที่ตรวจ</th></tr></thead>
          <tbody>${PROJECT.rubric.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>
      <p class="text-sm mt-3">เกณฑ์นี้เป็นข้อเสนอ ให้ปรับตามจุดประสงค์และระดับของผู้เรียน</p>
    </section>

    <section class="card p-5 mt-4">
      <h2 class="font-bold text-lg">9. ข้อจำกัดของเว็บนี้</h2>
      <ul class="mt-2 ml-5 list-disc space-y-1">
        <li>ไม่มีระบบรับงานส่งงานและไม่เก็บข้อมูลส่วนตัว เพราะไม่มี backend จริง</li>
        <li>กิจกรรมทุกอย่างเป็นการจำลองบนเบราว์เซอร์ ไม่ได้เชื่อมต่อหรือทดสอบอุปกรณ์จริง</li>
        <li>ไม่มีการส่งงาน ไม่มีผู้สอนกลาง และไม่มีการยืนยันตัวตนของผู้เรียน</li>
        <li>ตาราง IP สิทธิ์ และผังที่แสดงเป็นตัวอย่างที่เสนอ นักเรียนต้องปรับให้ตรงกับห้องจริง</li>
      </ul>
    </section>
  </div>`;
}

function pageProgress() {
  const all = flatLessons();
  const read = readStore.all();
  const done = all.filter(l => read[l.id]).length;
  const quizDone = Object.keys(quizStore.all());
  return `
  <div class="max-w-5xl mx-auto px-4 py-8">
    <h1 class="text-2xl md:text-3xl font-bold">ความคืบหน้ารวม</h1>
    <p class="text-navy/75 mt-1 mb-5">ข้อมูลทั้งหมดมาจาก localStorage ของเบราว์เซอร์นี้ ไม่มีการส่งออกหรือแชร์ข้อมูล และไม่มีระบบบัญชีผู้ใช้</p>

    <div class="grid sm:grid-cols-3 gap-4">
      <div class="card p-5"><p class="text-sm text-navy/70">บทที่อ่านแล้ว</p><p class="text-3xl font-bold">${done}/${all.length}</p></div>
      <div class="card p-5"><p class="text-sm text-navy/70">แบบทดสอบที่ผ่าน</p><p class="text-3xl font-bold">${quizStore.passedCount()}/${UNITS.length}</p></div>
      <div class="card p-5"><p class="text-sm text-navy/70">กิจกรรมที่ทำแล้ว</p><p class="text-3xl font-bold">${Object.keys(actStore.all()).length}/3</p></div>
    </div>

    <div class="mt-6 grid md:grid-cols-2 gap-5">
      <div class="card p-5">
        <h2 class="font-bold text-lg mb-3">รายละเอียดรายหน่วย</h2>
        <table class="table-net">
          <thead><tr><th scope="col">หน่วย</th><th scope="col">อ่านแล้ว</th><th scope="col">แบบทดสอบ</th><th scope="col">คะแนนสูงสุด</th></tr></thead>
          <tbody>
            ${UNITS.map(u => {
              const p = unitProgress(u);
              const r = quizStore.forUnit(u.id);
              return `<tr>
                <td><a class="hover:text-teal-dark font-medium" href="#/path/${u.id}">${esc(u.title)}</a></td>
                <td>${p.done}/${p.total} (${p.pct}%)</td>
                <td>${r ? (r.passed ? '<span class="chip chip-ok">ผ่าน</span>' : `<span class="chip chip-no">${r.bestScore}/5</span>`) : '<span class="chip chip-info">ยังไม่ทำ</span>'}</td>
                <td>${r ? r.bestScore + '/5' : '—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        <p class="text-sm text-navy/70 mt-3">เกณฑ์ผ่านแบบทดสอบ: 4 จาก 5 ข้อ · คะแนนรวมที่ได้: ${quizStore.bestTotal()} จาก ${UNITS.length * 5} ข้อ</p>
      </div>
      <div class="card p-5">
        <h2 class="font-bold text-lg mb-3">กิจกรรมโต้ตอบ</h2>
        <ul class="space-y-2 text-sm">
          ${[['match', 'จับคู่ Switch / Router / AP', 'u2/u2-2'], ['t568', 'เรียงลำดับสีสาย T568B', 'u3/u3-2'], ['subnet', 'ตรวจว่าอยู่ใน /24 เดียวกันไหม', 'u3/u3-4']].map(([k, label, href]) => {
            const r = actStore.all()[k];
            return `<li class="flex flex-wrap items-center gap-2 border border-slate-200 rounded-lg p-2">
              <span class="flex-1 min-w-[10rem]">${label}</span>
              ${r ? `<span class="chip chip-ok">เสร็จ${r.score !== undefined ? ' · คะแนน ' + r.score : ''}</span>` : '<span class="chip chip-info">ยังไม่ทำ</span>'}
              <a class="px-2.5 py-1.5 rounded-lg border border-teal text-teal-dark font-medium hover:bg-teal-light" href="#/lesson/${href}">ทำกิจกรรม</a>
            </li>`;
          }).join('')}
        </ul>
        <h3 class="font-bold mt-6">ล้างข้อมูลในเบราว์เซอร์นี้</h3>
        <p class="text-sm text-navy/75 mt-1">การล้างจะเป็นการลบสถานะการอ่าน คะแนน และผลกิจกรรมทั้งหมดในเครื่องนี้ ไม่กระทบข้อมูลของผู้อื่น</p>
        <button id="clearData" class="mt-2 px-4 py-2.5 rounded-lg bg-orange text-white font-medium hover:brightness-95">ล้างข้อมูลทั้งหมด</button>
      </div>
    </div>

    <p class="text-sm text-navy/70 mt-6">ไม่มีการแสดงชื่อผู้เรียน สถิติทั้งระบบ หรือผลการเรียนของผู้อื่น เพราะเว็บนี้ไม่มี backend และไม่มีระบบ login</p>
  </div>`;
}

function pageGlossary() {
  return `
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-2xl md:text-3xl font-bold">คำศัพท์เครือข่ายที่ใช้ในเว็บนี้</h1>
    <p class="text-navy/75 mt-1 mb-5">อธิบายแบบเข้าใจง่าย ไม่ใช่นิยามทางเทคนิคเต็มรูปแบบ</p>
    <div class="space-y-3">
      ${GLOSSARY.map(g => `
      <details class="card p-4 group">
        <summary class="font-semibold cursor-pointer list-none flex items-center gap-2">
          <span class="text-teal-dark">${esc(g.term)}</span>
          <span class="text-sm text-navy/60">${esc(g.short)}</span>
        </summary>
        <p class="mt-2 text-navy/85">${esc(g.def)}</p>
        ${g.example ? `<p class="text-sm mt-1 text-navy/70"><strong>ตัวอย่าง:</strong> ${esc(g.example)}</p>` : ''}
      </details>`).join('')}
    </div>
  </div>`;
}

function pageNotFound() {
  return `
  <div class="max-w-2xl mx-auto px-4 py-16 text-center">
    <h1 class="text-2xl font-bold">ไม่พบหน้านี้</h1>
    <p class="text-navy/75 mt-2">URL อาจไม่ถูกต้อง หรือบทเรียนนี้ถูกย้าย ลองกลับไปหน้าแรกหรือค้นหาบทเรียน</p>
    <div class="mt-5 flex justify-center gap-3">
      <a href="#/" class="px-4 py-2.5 rounded-lg bg-teal text-white font-medium hover:bg-teal-dark">หน้าแรก</a>
      <a href="#/lessons" class="px-4 py-2.5 rounded-lg border border-navy/30 hover:bg-teal-light">ค้นหาบทเรียน</a>
    </div>
  </div>`;
}

/* ---------------- event wiring per page ---------------- */

function wireHome() {}

function wireLessons() {
  const input = document.getElementById('q');
  const results = document.getElementById('results');
  const count = document.getElementById('qcount');
  const all = flatLessons();
  const render = (q) => {
    const list = all.map(l => lessonResultHTML(l, q)).filter(Boolean);
    if (q) {
      results.innerHTML = list.length
        ? list.join('')
        : `<div class="card p-6 text-center">
             <p class="font-semibold">ไม่พบบทเรียนที่ตรงกับ “${esc(q)}”</p>
             <p class="text-navy/75 mt-1">ลองใช้คำอื่น เช่น DHCP, subnet, T568B, NTFS, firewall, สิทธิ์, สาย</p>
             <button id="resetQ" class="mt-3 px-4 py-2 rounded-lg border border-teal text-teal-dark font-medium hover:bg-teal-light">ล้างคำค้น</button>
           </div>`;
      count.textContent = `พบ ${list.length} บท จากทั้งหมด ${all.length} บท`;
    } else {
      results.innerHTML = list.join('');
      count.textContent = `แสดงทั้งหมด ${all.length} บท`;
    }
    const rb = document.getElementById('resetQ');
    if (rb) rb.addEventListener('click', () => { input.value = ''; render(''); input.focus(); });
  };
  render('');
  input.addEventListener('input', e => render(e.target.value.trim().toLowerCase()));
}

function wireQuiz(unitId) {
  const u = getUnit(unitId);
  const qs = QUIZZES[u.id];
  const form = document.getElementById('quizForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let score = 0;
    qs.forEach((q, i) => {
      const picked = form.querySelector(`input[name="q${i}"]:checked`);
      const fb = form.querySelector(`[data-fb="${i}"]`);
      fb.classList.remove('hidden');
      const val = picked ? Number(picked.value) : -1;
      const ok = val === q.answer;
      if (ok) score++;
      fb.className = 'fb mt-3 p-3 rounded-lg text-sm border-l-4 ' + (ok ? 'bg-teal-light border-l-teal' : 'bg-orange-light border-l-orange');
      fb.innerHTML = ok
        ? `<strong class="text-teal-dark">ถูกต้อง</strong> — ${esc(q.why)}`
        : `<strong>ยังไม่ถูก</strong> · เฉลยคือ “${esc(q.options[q.answer])}”<br>${esc(q.why)}`;
      form.querySelectorAll(`input[name="q${i}"]`).forEach(r => r.disabled = true);
    });
    const passed = score >= 4;
    const prev = quizStore.forUnit(u.id);
    quizStore.save(u.id, {
      lastScore: score, bestScore: prev ? Math.max(prev.bestScore, score) : score,
      passed: (prev && prev.passed) || passed, at: new Date().toISOString()
    });
    const out = document.getElementById('score');
    out.innerHTML = `ได้ ${score}/${qs.length} ข้อ — ${passed ? '<span class="chip chip-ok">ผ่านเกณฑ์ 4/5</span>' : '<span class="chip chip-no">ยังไม่ผ่าน ต้องได้ 4 ข้อขึ้นไป</span>'}
      <span class="text-sm font-normal text-navy/70 ml-1">บันทึกคะแนนในเบราว์เซอร์นี้แล้ว (ทำซ้ำได้ทุกครั้ง ไม่มีการล็อกบท)</span>`;
    out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

function wireLesson(unitId, lessonId) {
  const l = getLesson(lessonId);
  const btn = document.getElementById('markRead');
  btn.addEventListener('click', () => {
    const nowRead = readStore.isRead(l.id);
    if (nowRead) { readStore.unmark(l.id); toast('ยกเลิกเครื่องหมาย "อ่านแล้ว" แล้ว'); }
    else { readStore.mark(l.id); toast('ทำเครื่องหมายว่าอ่านแล้ว (บันทึกในเบราว์เซอร์นี้)'); }
    // อัปเดตปุ่มและแถบด้านข้างเฉพาะจุด เพื่อไม่ให้กิจกรรมที่กำลังทำถูกรีเซ็ต
    const isRead = readStore.isRead(l.id);
    btn.textContent = isRead ? 'ยกเลิกเครื่องหมาย "อ่านแล้ว"' : 'ทำเครื่องหมายว่าอ่านแล้ว';
    btn.className = 'px-5 py-3 rounded-lg font-medium hover:bg-teal-dark ' +
      (isRead ? 'bg-white border border-teal text-teal-dark' : 'bg-teal text-white');
  });
  if (l.activityId) {
    const root = document.getElementById('actRoot');
    const renderers = { match: renderMatchActivity, t568: renderT568Activity, subnet: renderSubnetActivity };
    const f = renderers[l.activityId];
    if (f && root) f(root, l);
  }
}

function wireProgress() {
  const b = document.getElementById('clearData');
  if (!b) return;
  b.addEventListener('click', () => {
    if (confirm('ล้างข้อมูลการอ่าน คะแนน และผลกิจกรรมทั้งหมดในเบราว์เซอร์นี้?')) {
      clearAll(); toast('ล้างข้อมูลแล้ว'); route();
    }
  });
}

/* ---------------- router ---------------- */

function parseHash() {
  const raw = (location.hash || '#/').replace(/^#/, '');
  const parts = raw.split('/').filter(Boolean);
  return { page: parts[0] || 'home', a: parts[1], b: parts[2] };
}

function route() {
  if (currentCleanup) { try { currentCleanup(); } catch (e) { } currentCleanup = null; }
  const { page, a, b } = parseHash();
  let main = '', active = '#/', wire = () => { };
  switch (page) {
    case 'home': main = pageHome(); active = '#/'; wire = wireHome; break;
    case 'path':
      main = a ? pageUnit(a) : pagePath();
      active = '#/path';
      wire = () => { };
      break;
    case 'lessons': main = pageLessons(); active = '#/lessons'; wire = wireLessons; break;
    case 'lesson': main = pageLesson(a, b); active = '#/lessons'; wire = () => wireLesson(a, b); break;
    case 'quiz': main = pageQuiz(a); active = '#/lessons'; wire = () => wireQuiz(a); break;
    case 'project': main = pageProject(); active = '#/project'; wire = () => { }; break;
    case 'progress': main = pageProgress(); active = '#/progress'; wire = wireProgress; break;
    case 'glossary': main = pageGlossary(); active = '#/glossary'; wire = () => { }; break;
    default: main = pageNotFound(); active = '#/'; wire = () => { };
  }
  app.innerHTML = layout(active, main);
  wire();
  const nav = document.getElementById('mainNav');
  const mb = document.getElementById('menuBtn');
  if (mb && nav) {
    mb.addEventListener('click', () => {
      const open = nav.classList.toggle('hidden');
      mb.setAttribute('aria-expanded', String(!open));
    });
  }
  if (page === 'lesson' || page === 'path' || page === 'quiz') window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();
