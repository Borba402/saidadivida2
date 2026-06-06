const XP_KEY = 'saidadivida_xp';
const SESSIONS_KEY = 'saidadivida_sessions';

export function getXP() {
  return parseInt(localStorage.getItem(XP_KEY) || '0', 10);
}

export function addXP(amount) {
  const next = getXP() + amount;
  localStorage.setItem(XP_KEY, String(next));
  return next;
}

export function getLevel(xp) {
  const v = xp ?? getXP();
  return Math.floor(Math.sqrt(v / 100));
}

export function xpForLevel(level) {
  return level * level * 100;
}

export function getLevelProgress() {
  const xp = getXP();
  const level = getLevel(xp);
  const base = xpForLevel(level);
  const cap = xpForLevel(level + 1);
  return {
    xp,
    level,
    levelXP: xp - base,
    neededXP: cap - base,
    percent: cap === base ? 1 : Math.min(1, (xp - base) / (cap - base))
  };
}

export function getTodaySessions() {
  const today = new Date().toDateString();
  const stored = localStorage.getItem(SESSIONS_KEY);
  if (!stored) return 0;
  const { date, count } = JSON.parse(stored);
  return date === today ? count : 0;
}

export function incrementSession() {
  const today = new Date().toDateString();
  const count = getTodaySessions() + 1;
  localStorage.setItem(SESSIONS_KEY, JSON.stringify({ date: today, count }));
  return count;
}
