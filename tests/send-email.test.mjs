import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/send-email.js';

test('support accepts its deployment and branch preview origins while rejecting other projects', async (t) => {
  const environment = {
    RESEND_API_KEY: 'local-test-key',
    VERCEL_URL: 'website-abc123-team.vercel.app',
    VERCEL_BRANCH_URL: 'website-git-audit-team.vercel.app',
  };
  const previous = Object.fromEntries(Object.keys(environment).map(key => [key, process.env[key]]));
  Object.assign(process.env, environment);
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  let sent = 0;
  t.mock.method(globalThis, 'fetch', async () => { sent += 1; return { ok: true }; });
  for (const [origin, expected] of [
    [`https://${environment.VERCEL_URL}`, 200],
    [`https://${environment.VERCEL_BRANCH_URL}`, 200],
    ['https://topdoglabs.com', 200],
    ['https://another-project.vercel.app', 403],
    [`https://${environment.VERCEL_BRANCH_URL}.unrelated.example`, 403],
  ]) {
    const response = { statusCode: 200, setHeader() {}, status(code) { this.statusCode = code; return this; }, json() { return this; } };
    await handler({
      method: 'POST', headers: { origin, 'content-type': 'application/json' },
      socket: { remoteAddress: '192.0.2.50' },
      body: { name: 'Preview Test', email: 'test@example.com', message: 'Preview support check' },
    }, response);
    assert.equal(response.statusCode, expected, origin);
  }
  assert.equal(sent, 3);
});

test('support requests validate input, keep email text literal, and limit repeated sends', async (t) => {
  const previousKey = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = 'local-test-key';
  const sent = [];
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    sent.push(JSON.parse(options.body));
    return { ok: true, status: 200, json: async () => ({ id: 'test' }) };
  });
  t.after(() => {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
  });
  const submit = async (body, ip = '192.0.2.1', extra = {}) => {
    const response = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(s) { this.statusCode = s; return this; }, json(data) { this.data = data; return this; } };
    await handler({ method: 'POST', headers: { 'content-type': 'application/json' }, socket: { remoteAddress: ip }, body, ...extra }, response);
    return response;
  };
  const valid = { name: 'Test User', email: 'test@example.com', message: 'A support question', subject: 'General Support' };
  for (const body of [undefined, null, [], {}, { ...valid, message: 123 }, { ...valid, name: '   ' }, { ...valid, email: 'invalid' }, { ...valid, message: 'x'.repeat(10001) }]) {
    const response = await submit(body);
    assert.equal(response.statusCode, 400, `invalid payload: ${JSON.stringify(body)?.slice(0,100)}`);
  }
  assert.equal(sent.length, 0);
  const injected = { ...valid, name: '<b>Test</b>', message: '<a href="https://example.com">hello</a>\nSecond line' };
  assert.equal((await submit(injected)).statusCode, 200);
  assert.ok(!sent[0].html || !sent[0].html.includes('<b>Test</b>'));
  assert.ok(sent[0].text.includes(injected.message));
  assert.equal((await submit({ ...valid, website: 'bot.example' })).statusCode, 200);
  assert.equal(sent.length, 1, 'honeypot submissions must not send mail');
  assert.equal((await submit(valid, '192.0.2.2', { headers: { origin: 'https://unrelated.example', 'content-type': 'application/json' } })).statusCode, 403);
  for (let index = 0; index < 5; index++) assert.equal((await submit(valid, '192.0.2.3')).statusCode, 200);
  const limited = await submit(valid, '192.0.2.3');
  assert.equal(limited.statusCode, 429);
  assert.ok(Number(limited.headers['Retry-After']) > 0);
});
