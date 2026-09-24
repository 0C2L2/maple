/* Local-only OTP smoke test. Run after build:web with Playwright available.
 * MAPLE_PLAYWRIGHT_MODULE may point to an existing Playwright installation.
 * Codes and session values stay in memory and are never logged or saved.
 */
/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require(process.env.MAPLE_PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '../dist');
const out = process.env.MAPLE_AUTH_QA_OUTPUT;
const mailUrl = process.env.MAPLE_LOCAL_MAIL_URL;
assert(mailUrl && ['127.0.0.1', 'localhost'].includes(new URL(mailUrl).hostname), 'Set MAPLE_LOCAL_MAIL_URL to local Supabase Mailpit');
const results = [];
const pass = (test) => { results.push({ test, result: 'PASS' }); console.log('PASS ' + test); };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) file += '.html';
  if (!fs.existsSync(file)) file = path.join(root, 'index.html');
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg' };
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
async function captureMatrix(page, step) {
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    for (const colorScheme of ['light', 'dark']) {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ colorScheme });
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'horizontal overflow');
      const boxes = await page.getByRole('button').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().height));
      assert(boxes.every(h => h >= 44), 'touch targets');
      if (out) await page.screenshot({ path: path.join(out, 'auth-' + step + '-' + width + '-' + colorScheme + '.png'), fullPage: true });
      pass(step + ' ' + width + 'x' + height + ' ' + colorScheme);
    }
  }
}
const seenMessages = new Set();
async function messageFor(email, excluded) {
  for (let i = 0; i < 30; i++) {
    const data = await (await fetch(mailUrl + '/api/v1/messages')).json();
    const message = data.messages.find(m => !seenMessages.has(m.ID) && m.ID !== excluded && m.To.some(to => to.Address === email));
    if (message) { seenMessages.add(message.ID); return await (await fetch(mailUrl + '/api/v1/message/' + message.ID)).json(); }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('Local email not received');
}
function tokenFrom(message, heading) {
  assert(message.HTML.includes(heading), 'correct template');
  assert(!message.HTML.includes('token='), 'no magic-link dependence');
  const token = message.HTML.match(/<strong>(\d{6})<\/strong>/)?.[1];
  assert(token, 'six-digit code in visible strong element');
  return token;
}
(async () => {
  if (out) fs.mkdirSync(out, { recursive: true });
  await new Promise(resolve => server.listen(8766, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, channel: process.env.MAPLE_BROWSER_CHANNEL || 'msedge' });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on('pageerror', () => runtimeErrors.push('runtime error'));
    const email = 'maple-checkpoint3-' + Date.now() + '@example.test';
    await page.goto('http://127.0.0.1:8766/onboarding');
    await page.getByRole('button', { name: 'Continue', exact: true }).waitFor();
    assert(new URL(page.url()).pathname === '/login');
    pass('unauthenticated protected route returns to login');
    await captureMatrix(page, 'email');
    const emailInput = page.getByRole('textbox', { name: 'Email address' });
    await emailInput.focus();
    assert.equal(await emailInput.evaluate(n => getComputedStyle(n).outlineStyle), 'solid');
    pass('keyboard focus visible');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Enter a valid email' }).waitFor();
    await emailInput.fill('invalid');
    await emailInput.press('Enter');
    await page.getByRole('alert').filter({ hasText: 'Enter a valid email' }).waitFor();
    pass('empty and malformed email');
    await emailInput.fill(email);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('textbox', { name: 'Verification code' }).waitFor();
    const first = await messageFor(email);
    const firstToken = tokenFrom(first, 'Your Maple verification code');
    pass('new user confirmation email contains six-digit code');
    const mailPage = await context.newPage();
    await mailPage.goto(mailUrl);
    await mailPage.getByText('Your Maple verification code', { exact: true }).first().click();
    await mailPage.waitForTimeout(500);
    let visibleToken = false;
    for (const frame of mailPage.frames()) {
      if (await frame.getByText(firstToken, { exact: true }).count()) {
        visibleToken = await frame.getByText(firstToken, { exact: true }).first().isVisible();
      }
    }
    assert(visibleToken, 'code visible in captured-email UI');
    pass('Mailpit UI displays actual token');
    await mailPage.close();
    await captureMatrix(page, 'otp');
    const codeInput = page.getByRole('textbox', { name: 'Verification code' });
    await codeInput.fill('ab12cd');
    assert.equal(await codeInput.inputValue(), '12');
    assert(await page.getByRole('button', { name: 'Verify', exact: true }).isDisabled());
    assert(await page.getByRole('button', { name: /Resend code in/ }).isDisabled());
    pass('numeric filter, incomplete verify disabled, resend cooldown');
    await codeInput.fill(firstToken === '000000' ? '111111' : '000000');
    await page.getByRole('button', { name: 'Verify', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'invalid or has expired' }).waitFor();
    pass('invalid code rejected by real Auth');
    await codeInput.fill(firstToken);
    await page.getByRole('button', { name: 'Verify', exact: true }).click();
    await page.getByRole('button', { name: 'Sign out', exact: true }).waitFor();
    assert(new URL(page.url()).pathname === '/onboarding');
    pass('actual confirmation OTP creates session');
    await captureMatrix(page, 'onboarding');
    await page.goto('http://127.0.0.1:8766/login');
    await page.getByRole('button', { name: 'Sign out', exact: true }).waitFor();
    assert(new URL(page.url()).pathname === '/onboarding');
    pass('authenticated login redirects to onboarding');
    await page.reload();
    await page.getByRole('button', { name: 'Sign out', exact: true }).waitFor();
    pass('web reload restores session');
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await page.getByRole('button', { name: 'Continue', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => Object.keys(localStorage).some(k => k.endsWith('-auth-token'))), false);
    pass('sign out clears persisted session and returns to login');
    await page.goto('http://127.0.0.1:8766/onboarding');
    await page.getByRole('button', { name: 'Continue', exact: true }).waitFor();
    pass('signed-out protected route remains unavailable');
    await page.getByRole('textbox', { name: 'Email address' }).fill(email);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('textbox', { name: 'Verification code' }).waitFor();
    const second = await messageFor(email, first.ID);
    tokenFrom(second, 'Your Maple sign-in code');
    pass('existing user email contains six-digit code');
    await page.getByRole('button', { name: 'Change email', exact: true }).click();
    await page.getByRole('textbox', { name: 'Email address' }).waitFor();
    assert.equal(await page.getByRole('alert').count(), 0);
    pass('change email returns to email step and clears errors');
    // Wait out the real server interval. No fake timers or bypass of limits.
    await page.waitForTimeout(61_000);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('textbox', { name: 'Verification code' }).waitFor();
    const third = await messageFor(email, second.ID);
    const thirdToken = tokenFrom(third, 'Your Maple sign-in code');
    assert.equal(await codeInput.inputValue(), '');
    await page.getByRole('button', { name: 'Resend code', exact: true }).waitFor({ state: 'visible', timeout: 65_000 });
    assert.equal(await page.getByRole('button', { name: 'Resend code', exact: true }).isDisabled(), false);
    await page.getByRole('button', { name: 'Resend code', exact: true }).click();
    const fourth = await messageFor(email, third.ID);
    const fourthToken = tokenFrom(fourth, 'Your Maple sign-in code');
    assert(thirdToken !== fourthToken, 'resend should issue a fresh code');
    pass('resend after cooldown delivers fresh real code');
    await codeInput.fill(fourthToken);
    await page.getByRole('button', { name: 'Verify', exact: true }).click();
    await page.getByRole('button', { name: 'Sign out', exact: true }).waitFor();
    pass('existing user actual OTP verification');
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await page.getByRole('button', { name: 'Continue', exact: true }).waitFor();
    assert.deepEqual(runtimeErrors, []);
    pass('no browser runtime errors');
    // Controlled transport failures exercise visible error copy without secrets.
    await page.route('**/auth/v1/otp', route => route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ code: 'over_email_send_rate_limit', msg: 'Email rate limit exceeded' }) }));
    await page.getByRole('textbox', { name: 'Email address' }).fill(email);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Too many requests' }).waitFor();
    pass('rate error visible (controlled response)');
    await page.unroute('**/auth/v1/otp');
    await page.route('**/auth/v1/otp', route => route.abort('internetdisconnected'));
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Unable to connect' }).waitFor({ timeout: 30_000 });
    pass('network error visible (controlled failure)');
    await context.close();
    if (out) fs.writeFileSync(path.join(out, 'auth-results.json'), JSON.stringify({ email, results }, null, 2));
    console.log('Local auth smoke complete: ' + results.length + ' checks');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error('FAIL ' + error.message.replace(/\b\d{6}\b/g, '[redacted]')); server.close(); process.exitCode = 1; });
