/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module'), ts = require('typescript');
const root = path.resolve(__dirname, '../src');
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const mod = new Module(file, module);
  cache.set(file, mod);
  mod.filename = file; mod.paths = module.paths;
  mod.require = name => name.startsWith('@/') ? load(path.join(root, name.slice(2)) + '.ts')
    : name.startsWith('.') ? load(path.resolve(path.dirname(file), name) + '.ts') : require(name);
  mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
  return mod.exports;
}
const { wallToInstant, instantToWall } = load(path.join(root, 'features/events/dates.ts'));
const { validateEvent, emptyEvent } = load(path.join(root, 'features/events/validation.ts'));
const { taxonomy } = load(path.join(root, 'constants/taxonomy.ts'));
assert.equal(wallToInstant('2026-10-10T15:00','Asia/Seoul'),'2026-10-10T06:00:00Z');
assert.equal(wallToInstant('2026-10-10T15:00','America/New_York'),'2026-10-10T19:00:00Z');
assert.equal(wallToInstant('2026-01-10T15:00','America/New_York'),'2026-01-10T20:00:00Z');
assert.throws(() => wallToInstant('2026-03-08T02:30','America/New_York'));
assert.throws(() => wallToInstant('2026-11-01T01:30','America/New_York'));
assert.throws(() => wallToInstant('2026-02-30T12:00','Asia/Seoul'));
assert.throws(() => wallToInstant('2026-10-10T15:00','Not/A_Timezone'));
assert.throws(() => wallToInstant('2026-10-10T15:00','EST'));
const instant = wallToInstant('2026-10-10T15:00','Asia/Seoul');
assert.equal(wallToInstant(instantToWall(instant,'America/New_York'),'America/New_York'),instant);
console.log('PASS Seoul, New York summer/winter, DST gap/fold rejection, invalid date/zone, timezone-change preservation');
const value = { ...emptyEvent(), org_id: 'org', title: 'Test', slug: 'test-event', format: 'online', starts_at: '2026-10-10T15:00', ends_at: '2026-10-10T16:00', timezone: 'Asia/Seoul', categories:['hackathon'], audience_types:['developers'], attendance_band:'200-999' };
assert.deepEqual(validateEvent(value), {});
for (const [field, invalid] of [['title','  '],['slug','BAD slug'],['ends_at',value.starts_at],['ends_at','2026-10-10T14:00'],['timezone','Mars/Olympus_Mons'],['website','javascript:alert(1)'],['website','data:text/html,test'],['website','file:///tmp/a'],['website','ftp://example.com'],['categories',['unknown']],['audience_types',[]],['attendance_band','bad']]) assert.ok(validateEvent({...value,[field]:invalid})[field], field);
assert.ok(validateEvent({...value,format:'hybrid'}).city);
assert.ok(validateEvent({...value,format:'in_person'}).country);
for (const website of ['http://example.com','https://example.com']) assert.deepEqual(validateEvent({...value,website}),{});
for (const band of taxonomy.audience_band) assert.deepEqual(validateEvent({...value,attendance_band:band}),{});
const migration = fs.readFileSync(path.resolve(__dirname,'../../supabase/migrations/20260924140000_events_foundation.sql'),'utf8');
for(const key of ['categories','audience_types','audience_band']) for(const item of taxonomy[key]) assert.ok(migration.includes("'" + item + "'"),key + ':' + item);
console.log('PASS field validation, safe website schemes, canonical taxonomy parity');
