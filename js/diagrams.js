// SVG diagrams — วาดเองทั้งหมด ไม่ใช้ภาพตัวหนังสือ
const T = '#0E8C8C', N = '#0F2A4A', O = '#E86A17', B = '#1B5EA8', L = '#dbe3ea';
const box = (x, y, w, h, fill, label, sub) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="${N}" stroke-width="1.5"/>
  <text x="${x + w / 2}" y="${sub ? y + h / 2 - 4 : y + h / 2 + 5}" text-anchor="middle" font-size="13" font-weight="600" fill="${N}">${label}</text>
  ${sub ? `<text x="${x + w / 2}" y="${y + h / 2 + 14}" text-anchor="middle" font-size="11" fill="${N}" opacity="0.75">${sub}</text>` : ''}`;
const line = (x1, y1, x2, y2, c = N, w = 1.6, dash = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
const arrow = (x1, y1, x2, y2, c = T) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="2.4" marker-end="url(#ar)"/>`;
const txt = (x, y, s, size = 12, fill = N, anchor = 'start', weight = '400') =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}">${s}</text>`;
const DEFS = `<defs>
  <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="${T}"/>
  </marker>
  <marker id="arO" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="${O}"/>
  </marker>
</defs>`;

export function svgHeroNet() {
  const c = [];
  c.push(`<svg viewBox="0 0 520 340" role="img" aria-labelledby="hn-t hn-d" class="w-full h-auto">
  <title id="hn-t">ผังเครือข่ายห้องเรียนแบบ Star</title>
  <desc id="hn-d">คอมพิวเตอร์นักเรียน คอมพิวเตอร์ผู้สอน และเครื่องพิมพ์เชื่อมผ่านสวิตช์ ซึ่งเชื่อมต่อผ่านเราเตอร์ไปยังเครือข่ายภายนอก</desc>
  ${DEFS}`);
  c.push(box(215, 145, 90, 40, '#E3F3F3', 'Switch', '24 พอร์ต'));
  c.push(box(215, 250, 90, 40, '#E6EFF8', 'Router', 'Gateway'));
  const clients = [[40, 40, 'PC นักเรียน 1'], [185, 40, 'PC นักเรียน 2'], [330, 40, 'PC นักเรียน 3'],
  [40, 265, 'PC ผู้สอน'], [330, 265, 'เครื่องพิมพ์']];
  clients.forEach(([x, y, l]) => {
    c.push(box(x, y, 120, 38, '#fff', l));
    c.push(line(x + 60, y < 100 ? y + 38 : y, 260, y < 100 ? 145 : 185, L, 1.6));
  });
  c.push(line(260, 185, 260, 250, L, 1.6));
  c.push(box(200, 305, 120, 32, '#FDEDE1', 'อินเทอร์เน็ต'));
  c.push(line(260, 290, 260, 305, O, 1.8));
  c.push(txt(8, 24, 'LAN (สาย UTP)', 11, N, 'start', '600'));
  c.push(txt(330, 296, 'WAN / อินเทอร์เน็ต', 11, O));
  c.push(`</svg>`);
  return c.join('');
}

export function svgTopology() {
  let s = `<svg viewBox="0 0 640 300" role="img" aria-labelledby="tp-t tp-d" class="w-full h-auto">
  <title id="tp-t">รูปแบบผังเครือข่าย Star, Bus, Ring, Mesh</title>
  <desc id="tp-d">ภาพเปรียบเทียบโครงสร้างการเชื่อมต่อสี่แบบ โดย Star มีอุปกรณ์กลางรับทุกเครื่อง</desc>`;
  const cap = [[20, 'Star (จริง)'], [180, 'Star (ล้มเหลว)'], [340, 'Bus'], [500, 'Mesh']];
  cap.forEach(([x, t]) => s += txt(x + 60, 20, t, 12, N, 'middle', '600'));
  // star ok
  s += box(50, 55, 60, 26, '#E3F3F3', 'Switch');
  [[20, 100], [80, 100], [20, 145], [80, 145]].forEach(([x, y]) => { s += box(x, y, 40, 22, '#fff', 'PC'); s += line(x + 20, y, 80, 81, L); });
  s += txt(80, 190, 'สายหลุด 1 เครื่อง', 10, O, 'middle');
  // star fail
  s += box(210, 55, 60, 26, '#FDEDE1', 'Switch');
  s += txt(240, 118, '✕ จุดกลางเสีย', 11, O, 'middle', '600');
  [[180, 100], [240, 100], [180, 145], [240, 145]].forEach(([x, y]) => { s += box(x, y, 40, 22, '#fff', 'PC'); s += line(x + 20, y, 240, 81, O, 1.4, '4 3'); });
  s += txt(240, 190, 'กระทบทั้งห้อง', 10, O, 'middle');
  // bus
  s += line(360, 130, 440, 130, B, 3);
  [[360, 105], [390, 105], [420, 105]].forEach(([x, y]) => { s += box(x, y, 26, 20, '#fff', 'PC'); s += line(x + 13, y + 20, x + 13, 130, L); });
  s += txt(400, 160, 'แนวสื่อกลางร่วม', 10, N, 'middle');
  // mesh
  const pts = [[515, 110], [545, 155], [510, 190], [560, 200]];
  pts.forEach(([x, y]) => s += box(x - 16, y - 12, 32, 22, '#fff', 'R'));
  [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2]].forEach(([i, j]) => s += line(pts[i][0], pts[i][1], pts[j][0], pts[j][1], T, 1.3));
  s += txt(535, 230, 'หลายเส้นทาง', 10, N, 'middle');
  s += `</svg>`;
  return s;
}

export function svgDataPath() {
  let s = `<svg viewBox="0 0 620 130" role="img" aria-labelledby="dp-t dp-d" class="w-full h-auto">
  <title id="dp-t">เส้นทางส่งไฟล์ภายใน LAN</title>
  <desc id="dp-d">คอมพิวเตอร์ต้นทางส่งผ่านสวิตช์ไปยังคอมพิวเตอร์ปลายทาง โดยไม่ต้องผ่านเราเตอร์</desc>${DEFS}`;
  s += box(20, 45, 130, 40, '#fff', 'PC ต้นทาง', '192.168.10.10');
  s += box(245, 45, 130, 40, '#E3F3F3', 'Switch', 'Frame / MAC');
  s += box(470, 45, 130, 40, '#fff', 'PC ปลายทาง', '192.168.10.11');
  s += arrow(155, 65, 238, 65);
  s += arrow(380, 65, 463, 65);
  s += txt(300, 25, 'เส้นทางเดียวภายใน subnet เดียวกัน', 12, T, 'middle', '600');
  s += txt(310, 110, 'ไม่ต้องมีอินเทอร์เน็ต ก็ส่งไฟล์ได้', 11, N, 'middle');
  s += `</svg>`;
  return s;
}

export function svgStack() {
  let s = `<svg viewBox="0 0 620 130" role="img" aria-labelledby="st-t st-d" class="w-full h-auto">
  <title id="st-t">เส้นทางออกไปเครือข่ายภายนอก</title>
  <desc id="st-d">คอมพิวเตอร์ส่งไปยังเราเตอร์ผ่านประตูทางออกแล้วออกไปอินเทอร์เน็ต</desc>${DEFS}`;
  s += box(20, 45, 120, 40, '#fff', 'PC', 'Gateway .1');
  s += box(180, 45, 120, 40, '#E6EFF8', 'Router', 'Default Gateway');
  s += box(340, 45, 110, 40, '#E6EFF8', 'ISP', 'เครือข่ายอื่น');
  s += box(480, 45, 120, 40, '#FDEDE1', 'เว็บไซต์', 'ปลายทาง');
  s += arrow(145, 65, 173, 65);
  s += arrow(305, 65, 333, 65);
  s += arrow(455, 65, 473, 65);
  s += txt(310, 25, 'ปลายทางอยู่คนละ subnet → ต้องผ่าน Gateway', 12, B, 'middle', '600');
  s += txt(310, 110, 'ถ้า DNS มีปัญหา จะติดต่อ IP ได้แต่ติดต่อชื่อไม่ได้', 11, O, 'middle');
  s += `</svg>`;
  return s;
}

export function svgWiring() {
  // pin colors T568B: 1 w/orange, 2 orange, 3 w/green, 4 blue, 5 w/blue, 6 green, 7 w/brown, 8 brown
  const colors = ['#F5F7F9', '#E86A17', '#E86A17', '#F5F7F9', '#1B5EA8', '#F5F7F9', '#0E8C8C', '#F5F7F9'];
  let s = `<svg viewBox="0 0 420 190" role="img" aria-labelledby="wi-t wi-d" class="w-full h-auto max-w-md">
  <title id="wi-t">หัว RJ45 มาตรฐาน T568B</title>
  <desc id="wi-d">หัวตัวเลข 1 ถึง 8 เรียงจากซ้ายไปขวาเมื่อมองจากด้านหน้าสัมผัสโลหะ สลักอยู่ด้านหลังและสายห้อยลง</desc>`;
  s += `<rect x="60" y="40" width="300" height="70" rx="6" fill="#fff" stroke="${N}" stroke-width="2"/>`;
  s += `<rect x="60" y="18" width="300" height="24" rx="5" fill="#c9d4de" stroke="${N}" stroke-width="1.5"/>`;
  s += txt(210, 12, 'ด้านสัมผัสโลหะ (สลักอยู่ด้านหลัง · สายห้อยลง)', 11, N, 'middle', '600');
  for (let i = 0; i < 8; i++) {
    const x = 78 + i * 34;
    s += `<rect class="wire-slot" x="${x}" y="52" width="22" height="46" rx="3" fill="#F5F7F9" stroke="${N}" stroke-width="1.2"/>`;
    s += `<rect x="${x + 4}" y="58" width="14" height="34" rx="2" fill="${colors[i]}" stroke="${N}" stroke-width="1"/>`;
    s += txt(x + 11, 128, String(i + 1), 12, N, 'middle', '700');
  }
  s += txt(210, 152, 'T568B: ขาวส้ม · ส้ม · ขาวเขียว · น้ำเงิน · ขาวน้ำเงิน · เขียว · ขาวน้ำตาล · น้ำตาล', 11, N, 'middle');
  s += txt(210, 172, 'สายตรงใช้มาตรฐานเดียวกันทั้งสองด้าน', 10, O, 'middle');
  s += `</svg>`;
  return s;
}

export function svgFolderTree() {
  let s = `<svg viewBox="0 0 620 250" role="img" aria-labelledby="ft-t ft-d" class="w-full h-auto">
  <title id="ft-t">โครงสร้างโฟลเดอร์แชร์ที่แยกสิทธิ์</title>
  <desc id="ft-d">โฟลเดอร์ Materials อ่านอย่างเดียว Submissions แยกรายคน และ Management แก้ไขได้เฉพาะผู้สอน</desc>`;
  s += box(20, 20, 180, 36, '#E6EFF8', '\\\\SERVER\\', 'แชร์จากเครื่องผู้สอน');
  const cols = [
    [230, 'Materials', ['Read ทุกคน', 'ผู้สอน: Modify'], '#E3F3F3'],
    [370, 'Submissions', ['โฟลเดอร์ย่อยรายคน', 'เจ้าของเขียนได้'], '#FDEDE1'],
    [510, 'Management', ['ผู้สอนเท่านั้น', 'นักเรียน: ไม่มีสิทธิ์'], '#E6EFF8'],
  ];
  cols.forEach(([x, name, items, fill]) => {
    s += box(x, 85, 120, 34, fill, name);
    s += line(x + 60, 85, x + 60, 56, L);
    items.forEach((t, i) => {
      s += `<rect x="${x - 5}" y="${135 + i * 34}" width="130" height="28" rx="6" fill="#fff" stroke="${L}"/>`;
      s += txt(x + 60, 154 + i * 34, t, 11, N, 'middle');
    });
  });
  s += line(110, 56, 290, 56, L); s += line(290, 56, 290, 85, L);
  s += line(290, 56, 430, 56, L); s += line(430, 56, 430, 85, L);
  s += line(290, 56, 570, 56, L); s += line(570, 56, 570, 85, L);
  s += txt(310, 235, 'ผ่านเครือข่ายต้องได้รับอนุญาตทั้ง Share permissions และ NTFS permissions', 11, O, 'middle');
  s += `</svg>`;
  return s;
}

export function svgSegPath() {
  let s = `<svg viewBox="0 0 640 210" role="img" aria-labelledby="sg-t sg-d" class="w-full h-auto">
  <title id="sg-t">ลำดับการแก้ปัญหาเป็นชั้น</title>
  <desc id="sg-d">ไล่จากขอบเขตไปหาสายและลิงก์ ไปค่า IP และเกตเวย์ ไปชื่อโดเมน ไปบริการ</desc>${DEFS}`;
  const steps = [['1. ขอบเขต/อาการ', 10], ['2. สายและ Link', 160], ['3. IP / mask / gateway', 310], ['4. DNS และบริการ', 480]];
  steps.forEach(([t, x], i) => {
    s += `<rect x="${x}" y="70" width="150" height="44" rx="8" fill="${i === 0 ? '#FDEDE1' : '#E3F3F3'}" stroke="${N}" stroke-width="1.5"/>`;
    s += txt(x + 75, 97, t, 12, N, 'middle', '600');
    if (i < 3) s += arrow(x + 152, 92, x + 172, 92);
  });
  s += txt(320, 40, 'เปลี่ยนทีละปัจจัย บันทึกผลก่อน–หลังทุกครั้ง', 12, O, 'middle', '600');
  s += txt(320, 150, 'ที่ 169.254.x.x มักบ่งชี้ว่าเครื่องตั้ง IPv4 link-local เพราะไม่ได้ค่าจาก DHCP', 11, N, 'middle');
  s += txt(320, 175, 'ไม่ปิด firewall ทั้งระบบ และไม่สรุปว่าเครื่องเสียทันทีจาก ping ไม่ตอบ', 11, N, 'middle');
  s += `</svg>`;
  return s;
}

export function svgTroubleshoot() {
  let s = `<svg viewBox="0 0 640 250" role="img" aria-labelledby="tr-t tr-d" class="w-full h-auto">
  <title id="tr-t">วงจรชีวิตบัญชีและสิทธิ์ตามบทบาท</title>
  <desc id="tr-d">สร้างบัญชีรายคน กำหนดบทบาท ทบทวนสิทธิ์เมื่อเปลี่ยนหน้าที่ และยกเลิกบัญชีเมื่อพ้นสภาพ</desc>${DEFS}`;
  const cyc = [['สร้างบัญชีรายคน', 120, 40], ['กำหนดเจ้าของ/บทบาท', 360, 40], ['ใช้งานและบันทึกที่เหมาะสม', 540, 90], ['ทบทวนสิทธิ์เมื่อเปลี่ยนหน้าที่', 500, 170], ['ยกเลิกบัญชีเมื่อพ้นสภาพ', 240, 170], ['ส่งต่อข้อมูลของเจ้าของไฟล์', 60, 90]];
  cyc.forEach(([t, x, y], i) => {
    s += `<rect x="${x - 70}" y="${y}" width="140" height="38" rx="8" fill="#fff" stroke="${T}" stroke-width="1.5"/>`;
    s += txt(x, y + 24, t, 11, N, 'middle', '600');
    const [nx, ny] = cyc[(i + 1) % cyc.length];
    s += arrow(x + 60, y + 20, nx - 60, ny + 20);
  });
  s += txt(320, 240, 'หลัก least privilege: ให้สิทธิ์เท่าที่จำเป็นต่อหน้าที่ และใช้กลุ่มช่วยจัดการแทนการแจกสิทธิ์รายบุคคล', 11, O, 'middle');
  s += `</svg>`;
  return s;
}

export function svgRoomLayout() {
  let s = `<svg viewBox="0 0 700 340" role="img" aria-labelledby="rl-t rl-d" class="w-full h-auto">
  <title id="rl-t">ผังกายภาพตัวอย่างห้องคอมพิวเตอร์ 20 เครื่อง</title>
  <desc id="rl-d">โต๊ะเรียนสองปีกเชื่อมเข้าสวิตช์กลาง มีเครื่องพิมพ์และอุปกรณ์เครือข่ายบริเวณประตู</desc>${DEFS}`;
  s += `<rect x="14" y="14" width="672" height="312" rx="8" fill="#fff" stroke="${N}" stroke-width="1.5"/>`;
  s += txt(24, 32, 'ประตู', 11, N);
  s += `<rect x="24" y="36" width="46" height="8" fill="${N}"/>`;
  // desks: two columns of 10
  for (let i = 0; i < 10; i++) {
    const y = 60 + i * 25;
    [90, 470].forEach(x => {
      s += `<rect x="${x}" y="${y}" width="120" height="18" rx="4" fill="#E6EFF8" stroke="${B}"/>`;
      s += txt(x + 60, y + 13, `PC ${i + 1 + (x > 300 ? 10 : 0)}`, 10, N, 'middle');
      s += line(x + 60, y + 18, x + 60, y + 25, L, 1);
    });
  }
  s += `<rect x="285" y="60" width="120" height="34" rx="6" fill="#E3F3F3" stroke="${N}" stroke-width="1.5"/>`;
  s += txt(345, 76, 'Switch 24 พอร์ต', 12, N, 'middle', '700');
  s += txt(345, 89, 'ต้นทางสาย ≤ 90 m', 10, N, 'middle');
  for (let i = 0; i < 10; i++) {
    const y = 64 + i * 25;
    s += line(205, y, 285, 77, L, 1);
    s += line(475, y, 405, 77, L, 1);
  }
  s += `<rect x="300" y="180" width="90" height="30" rx="6" fill="#E6EFF8" stroke="${N}"/>`;
  s += txt(345, 199, 'Router', 12, N, 'middle', '700');
  s += line(345, 94, 345, 180, L, 1.6);
  s += `<rect x="300" y="140" width="90" height="28" rx="6" fill="#FDEDE1" stroke="${O}"/>`;
  s += txt(345, 158, 'AP (ถ้ามี Wi-Fi)', 11, N, 'middle', '700');
  s += `<rect x="440" y="180" width="90" height="30" rx="6" fill="#fff" stroke="${N}"/>`;
  s += txt(485, 199, 'เครื่องพิมพ์', 11, N, 'middle');
  s += line(405, 77, 485, 190, L, 1);
  s += `<rect x="290" y="245" width="110" height="30" rx="6" fill="#fff" stroke="${N}"/>`;
  s += txt(345, 264, 'PC ผู้สอน', 11, N, 'middle');
  s += line(345, 210, 345, 245, L, 1);
  s += txt(640, 30, 'ทางออก WAN', 10, O, 'middle');
  s += line(390, 195, 660, 26, O, 1.4, '4 3');
  s += txt(350, 320, 'นับพอร์ต: PC 20 + ผู้สอน 1 + เครื่องพิมพ์ 1 + uplink 1 = 22 พอร์ต (ถ้าเพิ่ม AP ให้นับพอร์ตของ AP เพิ่มตามอุปกรณ์)', 11, N, 'middle');
  s += `</svg>`;
  return s;
}
