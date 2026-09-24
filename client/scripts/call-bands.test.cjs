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
const {budgetBands,isBudgetBand}=load(path.join(root,'constants/budgetBands.ts'));
const migration=fs.readFileSync(path.resolve(root,'../../supabase/migrations/20260924160000_call_opportunities.sql'),'utf8');
const check=migration.match(/budget_band text not null check\(budget_band in \(([^)]+)\)\)/)[1];
const sqlValues=[...check.matchAll(/'([^']+)'/g)].map(match=>match[1]);
assert.deepEqual(sqlValues,Object.keys(budgetBands));
for(const value of sqlValues)assert(isBudgetBand(value));
for(const value of ['random','100000','usd_5k','','toString'])assert.equal(isBudgetBand(value),false);
console.log('PASS canonical client/SQL band parity and invalid-band validation');
