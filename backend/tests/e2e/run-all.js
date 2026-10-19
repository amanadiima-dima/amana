// Runs every *.e2e.js against the local API and prints one summary line each.
// Needs: ./dev-local.sh running (API on :3000, OTP_BYPASS=true, seeded users) and MAX_INVITES_PER_DAY=1000 in backend/.env.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname).filter((f) => f.endsWith('.e2e.js')).sort();
let failedFiles = 0, totalPass = 0, totalFail = 0;
for (const f of files) {
  const r = spawnSync('node', [path.join(__dirname, f)], { encoding: 'utf8', timeout: 300000, cwd: path.join(__dirname, '..', '..') });
  const out = (r.stdout || '') + (r.stderr || '');
  const lines = out.split('\n');
  const pass = lines.filter((l) => /^PASS/.test(l)).length;
  const bad = lines.filter((l) => /^FAIL|^ERR/.test(l));
  totalPass += pass; totalFail += bad.length;
  if (bad.length || pass === 0) failedFiles++;
  console.log(`${f.padEnd(30)} ${pass} passed, ${bad.length} failed${pass === 0 && !bad.length ? '  (script printed no PASS lines — crashed?)' : ''}`);
  bad.forEach((l) => console.log('    ' + l.slice(0, 160)));
}
console.log(`\nTOTAL: ${totalPass} passed, ${totalFail} failed in ${files.length} files`);
process.exit(failedFiles ? 1 : 0);
