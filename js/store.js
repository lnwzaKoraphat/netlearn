// localStorage layer — ข้อมูลทั้งหมดเป็นข้อมูลเฉพาะเบราว์เซอร์
const K_READ = 'netlearn.read.v1';
const K_QUIZ = 'netlearn.quiz.v1';
const K_ACT = 'netlearn.activities.v1';

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const val = JSON.parse(raw);
    return val && typeof val === 'object' ? val : fallback;
  } catch (e) {
    return fallback;
  }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch (e) { return false; }
}

export const readStore = {
  all() { return load(K_READ, {}); },
  isRead(lessonId) { return Boolean(load(K_READ, {})[lessonId]); },
  mark(lessonId) { const r = this.all(); r[lessonId] = new Date().toISOString(); return save(K_READ, r); },
  unmark(lessonId) { const r = this.all(); delete r[lessonId]; return save(K_READ, r); },
  count() { return Object.keys(this.all()).length; },
  clear() { return save(K_READ, {}); }
};

export const quizStore = {
  all() { return load(K_QUIZ, {}); },
  forUnit(unitId) { return this.all()[unitId] || null; },
  save(unitId, rec) { const q = this.all(); q[unitId] = rec; return save(K_QUIZ, q); },
  passedCount() { return Object.values(this.all()).filter(r => r && r.passed).length; },
  bestTotal() {
    return Object.values(this.all())
      .filter(r => r && typeof r.bestScore === 'number')
      .reduce((s, r) => s + r.bestScore, 0);
  },
  clear() { return save(K_QUIZ, {}); }
};

export const actStore = {
  all() { return load(K_ACT, {}); },
  forUnit(unitId) { return this.all()[unitId] || null; },
  save(unitId, rec) { const a = this.all(); a[unitId] = rec; return save(K_ACT, a); },
  clear() { return save(K_ACT, {}); }
};

export function clearAll() {
  save(K_READ, {}); save(K_QUIZ, {}); save(K_ACT, {});
}
