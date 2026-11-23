const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { openDatabase } = require('../server/db');
const { createApp } = require('../server/app');
const { seed } = require('../server/seed');

let server;
let base;
let db;

before(async () => {
  db = openDatabase(':memory:');
  seed(db);
  server = createApp(db).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

async function api(method, url, body, token) {
  const res = await fetch(base + url, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

const login = async (email) => (await api('POST', '/api/auth/login', { email, password: '123456' })).body.token;
const segmentId = (name) => db.prepare('SELECT id FROM segments WHERE name = ?').get(name).id;

test('no máximo 3 lojas ativas por segmento; a 4ª vai para fila de espera', async () => {
  const segs = (await api('GET', '/api/segments')).body;
  const marc = segs.find((s) => s.name === 'Marcenaria e Móveis Planejados');
  assert.equal(marc.active_stores, 3);
  assert.equal(marc.waitlist, 1);
  assert.equal(marc.free_slots, 0);
});

test('arquiteto vê no máximo 3 parceiros por segmento, com contato', async () => {
  const token = await login('arquiteta@orcaarq.com');
  const { body } = await api('GET', `/api/partners?segment_id=${segmentId('Marcenaria e Móveis Planejados')}`, null, token);
  assert.equal(body[0].stores.length, 3);
  assert.ok(body[0].stores.every((s) => s.phone));
  assert.ok(!body[0].stores.some((s) => s.name === 'Marcenaria Fila de Espera'));
});

test('ao cancelar uma loja ativa, a primeira da fila é promovida', async () => {
  const admin = await login('admin@orcaarq.com');
  const seg = segmentId('Marcenaria e Móveis Planejados');
  const ov = (await api('GET', '/api/admin/overview', null, admin)).body;
  const subs = ov.segments.find((s) => s.id === seg).subscriptions;
  const active = subs.find((s) => s.status === 'active');
  const waiting = subs.find((s) => s.status === 'waitlist');
  const r = await api('POST', `/api/admin/subscriptions/${active.id}/deactivate`, null, admin);
  assert.deepEqual(r.body.promoted, [waiting.id]);
  const after = db.prepare('SELECT status FROM store_segments WHERE id = ?').get(waiting.id);
  assert.equal(after.status, 'active');
});

test('cadastro de lojista fica pendente até aprovação do admin', async () => {
  const seg = segmentId('Gesso e Forros');
  const reg = await api('POST', '/api/auth/register', {
    name: 'João', email: 'gesso@teste.com', password: 'abcdef', role: 'store', storeName: 'Gesso Top', segments: [seg], phone: '(11) 1111-1111',
  });
  assert.equal(reg.status, 201);
  const me = (await api('GET', '/api/store/me', null, reg.body.token)).body;
  assert.equal(me.subscriptions[0].status, 'pending');

  const admin = await login('admin@orcaarq.com');
  const r = await api('POST', `/api/admin/subscriptions/${me.subscriptions[0].id}/approve`, null, admin);
  assert.equal(r.body.status, 'active');
});

test('orçamento: itens, honorários, desconto e total', async () => {
  const token = await login('arquiteta@orcaarq.com');
  const { body: created } = await api('POST', '/api/budgets', { title: 'Teste' }, token);
  await api('PUT', `/api/budgets/${created.id}`, { fee_type: 'percent', fee_value: 10, discount: 50 }, token);
  await api('POST', `/api/budgets/${created.id}/items`, { description: 'Item A', quantity: 2, unit_price: 100 }, token);
  await api('POST', `/api/budgets/${created.id}/items`, { description: 'Item B', quantity: 1.5, unit_price: 200 }, token);
  const { body } = await api('GET', `/api/budgets/${created.id}`, null, token);
  assert.equal(body.totals.subtotal, 500);
  assert.equal(body.totals.fee, 50);
  assert.equal(body.totals.total, 500);
});

test('não permite vincular loja que não é parceira ativa do segmento', async () => {
  const token = await login('arquiteta@orcaarq.com');
  const { body: created } = await api('POST', '/api/budgets', { title: 'Teste 2' }, token);
  const waitStore = db.prepare("SELECT id FROM stores WHERE name = 'Verde Vivo Paisagismo'").get().id; // pendente
  const r = await api('POST', `/api/budgets/${created.id}/items`, {
    description: 'Jardim', segment_id: segmentId('Paisagismo'), store_id: waitStore,
  }, token);
  assert.equal(r.status, 400);
});

test('arquiteto não acessa orçamento de outro arquiteto', async () => {
  const reg = await api('POST', '/api/auth/register', { name: 'Outro', email: 'outro@arq.com', password: 'abcdef', role: 'architect' });
  const r = await api('GET', '/api/budgets/1', null, reg.body.token);
  assert.equal(r.status, 404);
});

test('lojista não acessa rotas de admin', async () => {
  const token = await login('ateliermadeiranobre@loja.com');
  const r = await api('GET', '/api/admin/overview', null, token);
  assert.equal(r.status, 403);
});
