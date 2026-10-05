import u1, { q1 } from './u1.js';
import u2, { q2 } from './u2.js';
import u3, { q3 } from './u3.js';
import u4, { q4 } from './u4.js';
import u5, { q5 } from './u5.js';
import u6, { q6 } from './u6.js';
import { GLOSSARY } from './glossary.js';
import { PROJECT } from './project.js';

export const UNITS = [u1, u2, u3, u4, u5, u6];

export const LESSONS = UNITS.flatMap(u => u.lessons.map(l => ({ ...l, unitId: u.id })));
export const LESSON_MAP = Object.fromEntries(LESSONS.map(l => [l.id, l]));

export const QUIZZES = {
  u1: q1, u2: q2, u3: q3, u4: q4, u5: q5, u6: q6
};

export function getUnit(id) { return UNITS.find(u => u.id === id) || null; }
export function getLesson(id) { return LESSON_MAP[id] || null; }
export function flatLessons() { return LESSONS; }

export { GLOSSARY, PROJECT };
