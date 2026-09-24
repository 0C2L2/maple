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
const {parseMoney,formatMoney,amountFromMinor}=load(path.join(root,'features/opportunities/money.ts'));
for(const [amount,currency,expected] of [['5000','USD',500000],['500000','KRW',500000],['1000','JPY',1000],['1.25','EUR',125]]) assert.equal(parseMoney(amount,currency),expected);
for(const [amount,currency] of [['NaN','USD'],['Infinity','USD'],['-1','USD'],['0','USD'],['1.001','USD'],['1.1','KRW'],['9007199254740992','JPY'],['2','usd']]) assert.throws(()=>parseMoney(amount,currency));
assert.equal(formatMoney(500000,'USD'),'$5,000.00');assert.equal(formatMoney(500000,'KRW'),'₩500,000');assert.equal(formatMoney(1000,'JPY'),'¥1,000');
assert.equal(amountFromMinor(125,'USD'),'1.25');assert.equal(amountFromMinor(500000,'KRW'),'500000');
console.log('PASS currency-aware exact parsing, overflow and invalid-input rejection, USD/KRW/JPY formatting');

assert.equal(formatMoney(Number.MAX_SAFE_INTEGER,'USD'),'$90,071,992,547,409.91');
