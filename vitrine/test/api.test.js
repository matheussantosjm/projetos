const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { openDatabase } = require('../server/db');
const { createApp } = require('../server/app');

let server; let base; let tmp;
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vitrine-'));
  server = createApp(openDatabase(':memory:'), { uploadsDir: tmp }).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

async function call(method, url, body, token, raw = false) {
  const res = await fetch(base + url, {
    method,
    headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 teste', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: raw ? await res.text() : await res.json().catch(() => null) };
}
const register = async (name, email) => (await call('POST', '/api/auth/register', { name, email, password: '123456', whatsapp: '(19) 99999-0000', city: 'Campinas - SP' })).body.token;

let ana; let anaSlug; let listingId;

test('cadastro cria vitrine com endereço a partir do nome', async () => {
  ana = await register('Ana Corretora', 'ana@teste.com');
  const me = (await call('GET', '/api/me', null, ana)).body;
  assert.equal(me.slug, 'ana-corretora');
  anaSlug = me.slug;
  const other = await register('Ana Corretora', 'ana2@teste.com');
  assert.equal((await call('GET', '/api/me', null, other)).body.slug, 'ana-corretora-2');
});

test('cadastra imóvel com foto e ele aparece na vitrine pública', async () => {
  const r = await call('POST', '/api/listings', { deal: 'venda', type: 'Apartamento', bairro: 'Cambuí', price: 780000, area: 98, beds: 3, features: ['Piscina'] }, ana);
  assert.equal(r.status, 201);
  listingId = r.body.id;
  const p = await call('POST', `/api/listings/${listingId}/photos`, { data: PNG }, ana);
  assert.equal(p.status, 201);
  assert.ok(fs.existsSync(path.join(tmp, path.basename(p.body.url))));

  const page = await call('GET', `/${anaSlug}`, null, null, true);
  assert.equal(page.status, 200);
  assert.match(page.body, /Apartamento · Cambuí/);
  assert.match(page.body, /R\$\s?780\.000/);
  const detail = await call('GET', `/${anaSlug}/${listingId}`, null, null, true);
  assert.match(detail.body, /og:image/);
  assert.match(detail.body, /Quero visitar/);
});

test('imóvel pausado some da vitrine', async () => {
  await call('PUT', `/api/listings/${listingId}/status`, { status: 'pausado' }, ana);
  const page = await call('GET', `/${anaSlug}`, null, null, true);
  assert.doesNotMatch(page.body, /Apartamento · Cambuí/);
  assert.equal((await call('GET', `/${anaSlug}/${listingId}`, null, null, true)).status, 404);
  await call('PUT', `/api/listings/${listingId}/status`, { status: 'ativo' }, ana);
});

test('cliente pede visita: vira interessado e recebe link do WhatsApp do corretor', async () => {
  const r = await call('POST', '/api/public/leads', { slug: anaSlug, listing_id: listingId, name: 'João Cliente', phone: '(19) 98888-7777', kind: 'visita' });
  assert.equal(r.status, 201);
  assert.match(r.body.whatsapp_url, /^https:\/\/wa\.me\/5519999990000\?text=/);
  assert.match(decodeURIComponent(r.body.whatsapp_url), /Quero visitar o apartamento no Cambuí/);

  // pedir de novo não duplica
  await call('POST', '/api/public/leads', { slug: anaSlug, listing_id: listingId, name: 'João Cliente', phone: '19988887777', kind: 'contato' });
  const { leads } = (await call('GET', '/api/leads', null, ana)).body;
  assert.equal(leads.length, 1);
  assert.equal(leads[0].status, 'Quer visitar');
  assert.match(leads[0].whatsapp_url, /wa\.me\/5519988887777/);

  await call('PUT', `/api/leads/${leads[0].id}`, { status: 'Visita marcada', note: 'Sábado 10h' }, ana);
  const stats = (await call('GET', '/api/stats', null, ana)).body;
  assert.equal(stats.visits, 1);
  assert.ok(stats.visitors7 >= 1);
});

test('pedido de contato exige nome e WhatsApp válido', async () => {
  const r = await call('POST', '/api/public/leads', { slug: anaSlug, name: 'X', phone: '123' });
  assert.equal(r.status, 400);
});

test('um corretor não mexe nos imóveis nem vê os interessados de outro', async () => {
  const bruno = await register('Bruno', 'bruno@teste.com');
  assert.equal((await call('PUT', `/api/listings/${listingId}`, { price: 1 }, bruno)).status, 404);
  assert.equal((await call('DELETE', `/api/listings/${listingId}`, null, bruno)).status, 404);
  assert.equal((await call('GET', '/api/leads', null, bruno)).body.leads.length, 0);
});

test('endereço reservado ou já usado é recusado', async () => {
  const me = (await call('GET', '/api/me', null, ana)).body;
  assert.equal((await call('PUT', '/api/me', { ...me, slug: 'painel' }, ana)).status, 400);
  assert.equal((await call('PUT', '/api/me', { ...me, slug: 'ana-corretora-2' }, ana)).status, 409);
});

test('textos do corretor são escapados na página pública', async () => {
  await call('POST', '/api/listings', { deal: 'aluguel', type: 'Casa', bairro: '<script>alert(1)</script>', price: 2000 }, ana);
  const page = await call('GET', `/${anaSlug}`, null, null, true);
  assert.doesNotMatch(page.body, /<script>alert\(1\)<\/script>/);
  assert.match(page.body, /&lt;script&gt;/);
});
