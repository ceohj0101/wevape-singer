/* 깃허브 액션이 실행 — 공용 카운터에서 재생수를 긁어와 plays.json 으로 저장소에 저장 */
import fs from 'fs';

const BASE = 'https://abacus.jasoncameron.dev';
const NS = 'wevape-singer-live';
const keys = JSON.parse(fs.readFileSync('tracks.json', 'utf8'));

const p = (n) => String(n).padStart(2, '0');
const k = new Date(Date.now() + 9 * 36e5);           // 한국시간 기준

function isoWeek(x) {
  const t = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()));
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7) + 3);
  const y = t.getUTCFullYear();
  const j = new Date(Date.UTC(y, 0, 4));
  return y + p(1 + Math.round(((t - j) / 864e5 - 3 + ((j.getUTCDay() + 6) % 7)) / 7));
}

const buckets = [
  'd' + k.getUTCFullYear() + p(k.getUTCMonth() + 1) + p(k.getUTCDate()),
  'w' + isoWeek(k),
  'm' + k.getUTCFullYear() + p(k.getUTCMonth() + 1),
  'all'
];

const fresh = {};
for (const key of keys) {
  for (const b of buckets) {
    const kk = b + '-' + key.replace(/[^a-zA-Z0-9_-]/g, '-');
    try {
      const r = await fetch(BASE + '/get/' + NS + '/' + kk);
      fresh[kk] = r.status === 404 ? 0 : ((await r.json()).value | 0);
    } catch (e) {
      console.log('skip', kk, e.message);
    }
  }
}

let prev = { counts: {} };
try { prev = JSON.parse(fs.readFileSync('plays.json', 'utf8')); } catch (e) {}

const counts = Object.assign({}, prev.counts || {});
for (const kk of Object.keys(fresh)) {
  if ((counts[kk] || 0) < fresh[kk]) counts[kk] = fresh[kk];   // 절대 줄지 않음
}

fs.writeFileSync('plays.json', JSON.stringify({ updated: new Date().toISOString(), ns: NS, counts }, null, 1) + '\n');
console.log('수집 완료:', JSON.stringify(fresh));
