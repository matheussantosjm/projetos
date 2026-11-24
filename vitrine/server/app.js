const express = require('express');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const views = require('./views');

const LEAD_STATUSES = ['Pediu contato', 'Quer visitar', 'Respondido', 'Visita marcada', 'Fechou negócio', 'Desistiu'];
const LISTING_STATUSES = ['ativo', 'pausado', 'vendido', 'alugado'];
const RESERVED_SLUGS = new Set(['api', 'painel', 'assets', 'uploads', 'admin', 'login', 'cadastro', 'entrar', 'sair', 'imovel', 'imoveis', 'www', 'app', 'favicon.ico', 'robots.txt']);
const MAX_PHOTOS = 20;

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}
function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const a = crypto.scryptSync(password, salt, 64);
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const str = (v, max = 500) => (v == null ? null : String(v).trim().slice(0, max) || null);
const num = (v, def = 0) => { const n = Number(v); return Number.isFinite(n) ? n : def; };
const int = (v) => Math.max(0, Math.round(num(v)));
const digits = (s) => String(s || '').replace(/\D/g, '');

function slugify(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

function waNumber(phone) {
  const d = digits(phone);
  if (!d) return '';
  return d.length <= 11 ? `55${d}` : d;
}

function createApp(db, { uploadsDir }) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', true);
  app.use(express.json({ limit: '12mb' }));

  const publicDir = path.join(__dirname, '..', 'public');
  app.use('/assets', express.static(path.join(publicDir, 'assets'), { maxAge: '1h' }));
  app.use('/uploads', express.static(uploadsDir, { maxAge: '7d', immutable: true }));
  app.use('/painel', express.static(path.join(publicDir, 'painel')));

  const required = (b, fields) => {
    for (const [f, label] of fields) if (!str(b[f])) throw httpError(400, `Preencha: ${label}.`);
  };

  // ---------- Sessão ----------
  function createSession(brokerId) {
    const token = crypto.randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions (token, broker_id, expires_at) VALUES (?, ?, ?)')
      .run(token, brokerId, new Date(Date.now() + 60 * 864e5).toISOString());
    return token;
  }

  function auth(req, _res, next) {
    const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const broker = token && db.prepare(
      `SELECT b.* FROM sessions s JOIN brokers b ON b.id = s.broker_id WHERE s.token = ? AND s.expires_at > ?`
    ).get(token, new Date().toISOString());
    if (!broker) return next(httpError(401, 'Entre na sua conta para continuar.'));
    req.broker = broker;
    req.token = token;
    next();
  }

  const publicBroker = (b) => ({ id: b.id, name: b.name, email: b.email, slug: b.slug, whatsapp: b.whatsapp, creci: b.creci, city: b.city, bio: b.bio, color: b.color });

  // ---------- Imóveis (helpers) ----------
  function photosOf(listingId) {
    return db.prepare('SELECT id, filename FROM photos WHERE listing_id = ? ORDER BY position, id').all(listingId)
      .map((p) => ({ id: p.id, url: `/uploads/${p.filename}` }));
  }
  function hydrate(l) {
    return { ...l, features: JSON.parse(l.features || '[]'), photos: photosOf(l.id) };
  }
  function ownListing(req) {
    const l = db.prepare('SELECT * FROM listings WHERE id = ? AND broker_id = ?').get(req.params.id, req.broker.id);
    if (!l) throw httpError(404, 'Imóvel não encontrado.');
    return l;
  }
  function listingFields(b) {
    const deal = b.deal === 'aluguel' ? 'aluguel' : 'venda';
    required(b, [['type', 'tipo do imóvel'], ['bairro', 'bairro']]);
    const price = num(b.price);
    if (!(price > 0)) throw httpError(400, 'Informe o preço.');
    const features = Array.isArray(b.features) ? b.features.map((f) => str(f, 40)).filter(Boolean).slice(0, 20) : [];
    return {
      deal, type: str(b.type, 40), bairro: str(b.bairro, 80), city: str(b.city, 80), price,
      area: Math.max(0, num(b.area)), beds: int(b.beds), suites: int(b.suites), baths: int(b.baths), parking: int(b.parking),
      condo_fee: Math.max(0, num(b.condo_fee)), iptu: Math.max(0, num(b.iptu)), description: str(b.description, 3000),
      features: JSON.stringify(features),
    };
  }

  // ---------- Auth ----------
  app.post('/api/auth/register', (req, res) => {
    const b = req.body || {};
    required(b, [['name', 'seu nome'], ['email', 'e-mail'], ['password', 'senha'], ['whatsapp', 'WhatsApp']]);
    if (String(b.password).length < 6) throw httpError(400, 'A senha precisa ter pelo menos 6 caracteres.');
    if (!/^\S+@\S+\.\S+$/.test(b.email)) throw httpError(400, 'E-mail inválido.');
    if (digits(b.whatsapp).length < 10) throw httpError(400, 'WhatsApp inválido. Use DDD + número.');
    if (db.prepare('SELECT 1 FROM brokers WHERE email = ?').get(str(b.email))) throw httpError(409, 'Este e-mail já tem conta. Tente entrar.');

    let base = slugify(b.slug || b.name) || 'corretor';
    if (RESERVED_SLUGS.has(base)) base = `${base}-corretor`;
    let slug = base;
    for (let i = 2; db.prepare('SELECT 1 FROM brokers WHERE slug = ?').get(slug); i++) slug = `${base}-${i}`;

    const r = db.prepare('INSERT INTO brokers (name, email, password_hash, slug, whatsapp, creci, city) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(str(b.name, 100), str(b.email, 160), hashPassword(String(b.password)), slug, str(b.whatsapp, 30), str(b.creci, 30), str(b.city, 80));
    res.status(201).json({ token: createSession(Number(r.lastInsertRowid)) });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    const b = db.prepare('SELECT * FROM brokers WHERE email = ?').get(str(email) || '');
    if (!b || !verifyPassword(String(password || ''), b.password_hash)) throw httpError(401, 'E-mail ou senha incorretos.');
    res.json({ token: createSession(b.id) });
  });

  app.post('/api/auth/logout', auth, (req, res) => {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(req.token);
    res.json({ ok: true });
  });

  app.get('/api/me', auth, (req, res) => res.json(publicBroker(req.broker)));

  app.put('/api/me', auth, (req, res) => {
    const b = req.body || {};
    required(b, [['name', 'seu nome'], ['whatsapp', 'WhatsApp'], ['slug', 'endereço da vitrine']]);
    if (digits(b.whatsapp).length < 10) throw httpError(400, 'WhatsApp inválido. Use DDD + número.');
    const slug = slugify(b.slug);
    if (!slug || slug.length < 3) throw httpError(400, 'O endereço da vitrine precisa ter pelo menos 3 letras.');
    if (RESERVED_SLUGS.has(slug)) throw httpError(400, 'Esse endereço é reservado. Escolha outro.');
    if (db.prepare('SELECT 1 FROM brokers WHERE slug = ? AND id <> ?').get(slug, req.broker.id)) throw httpError(409, 'Esse endereço já está em uso. Escolha outro.');
    const color = /^#[0-9a-f]{6}$/i.test(b.color || '') ? b.color : req.broker.color;
    db.prepare('UPDATE brokers SET name = ?, whatsapp = ?, creci = ?, city = ?, bio = ?, slug = ?, color = ? WHERE id = ?')
      .run(str(b.name, 100), str(b.whatsapp, 30), str(b.creci, 30), str(b.city, 80), str(b.bio, 600), slug, color, req.broker.id);
    res.json(publicBroker(db.prepare('SELECT * FROM brokers WHERE id = ?').get(req.broker.id)));
  });

  // ---------- Imóveis ----------
  app.get('/api/listings', auth, (req, res) => {
    const rows = db.prepare(
      `SELECT l.*,
         (SELECT COUNT(*) FROM views v WHERE v.listing_id = l.id) AS views_total,
         (SELECT COUNT(*) FROM leads d WHERE d.listing_id = l.id) AS leads_total
       FROM listings l WHERE l.broker_id = ? ORDER BY l.updated_at DESC, l.id DESC`
    ).all(req.broker.id);
    res.json(rows.map(hydrate));
  });

  app.get('/api/listings/:id', auth, (req, res) => res.json(hydrate(ownListing(req))));

  app.post('/api/listings', auth, (req, res) => {
    const f = listingFields(req.body || {});
    const r = db.prepare(
      `INSERT INTO listings (broker_id, deal, type, bairro, city, price, area, beds, suites, baths, parking, condo_fee, iptu, description, features)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(req.broker.id, f.deal, f.type, f.bairro, f.city || req.broker.city, f.price, f.area, f.beds, f.suites, f.baths, f.parking, f.condo_fee, f.iptu, f.description, f.features);
    res.status(201).json({ id: Number(r.lastInsertRowid) });
  });

  app.put('/api/listings/:id', auth, (req, res) => {
    const l = ownListing(req);
    const f = listingFields({ ...hydrate(l), ...(req.body || {}) });
    db.prepare(
      `UPDATE listings SET deal = ?, type = ?, bairro = ?, city = ?, price = ?, area = ?, beds = ?, suites = ?, baths = ?, parking = ?,
         condo_fee = ?, iptu = ?, description = ?, features = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(f.deal, f.type, f.bairro, f.city, f.price, f.area, f.beds, f.suites, f.baths, f.parking, f.condo_fee, f.iptu, f.description, f.features, l.id);
    res.json({ ok: true });
  });

  app.put('/api/listings/:id/status', auth, (req, res) => {
    const l = ownListing(req);
    const status = (req.body || {}).status;
    if (!LISTING_STATUSES.includes(status)) throw httpError(400, 'Status inválido.');
    db.prepare("UPDATE listings SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, l.id);
    res.json({ ok: true });
  });

  app.delete('/api/listings/:id', auth, (req, res) => {
    const l = ownListing(req);
    for (const p of db.prepare('SELECT filename FROM photos WHERE listing_id = ?').all(l.id)) {
      fs.rmSync(path.join(uploadsDir, p.filename), { force: true });
    }
    db.prepare('DELETE FROM listings WHERE id = ?').run(l.id);
    res.json({ ok: true });
  });

  // Fotos chegam já reduzidas pelo navegador, em JPEG base64 (data URL).
  app.post('/api/listings/:id/photos', auth, (req, res) => {
    const l = ownListing(req);
    const count = db.prepare('SELECT COUNT(*) AS n FROM photos WHERE listing_id = ?').get(l.id).n;
    if (count >= MAX_PHOTOS) throw httpError(400, `Cada imóvel pode ter até ${MAX_PHOTOS} fotos.`);
    const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String((req.body || {}).data || ''));
    if (!m) throw httpError(400, 'Formato de foto inválido.');
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > 4 * 1024 * 1024) throw httpError(400, 'Foto muito grande.');
    const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
    const filename = `${l.id}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
    fs.writeFileSync(path.join(uploadsDir, filename), buf);
    const r = db.prepare('INSERT INTO photos (listing_id, filename, position) VALUES (?, ?, ?)').run(l.id, filename, count);
    db.prepare("UPDATE listings SET updated_at = datetime('now') WHERE id = ?").run(l.id);
    res.status(201).json({ id: Number(r.lastInsertRowid), url: `/uploads/${filename}` });
  });

  app.put('/api/listings/:id/photos/order', auth, (req, res) => {
    const l = ownListing(req);
    const ids = ((req.body || {}).ids || []).map(Number);
    const upd = db.prepare('UPDATE photos SET position = ? WHERE id = ? AND listing_id = ?');
    ids.forEach((id, i) => upd.run(i, id, l.id));
    res.json({ ok: true });
  });

  app.delete('/api/listings/:id/photos/:photoId', auth, (req, res) => {
    const l = ownListing(req);
    const p = db.prepare('SELECT * FROM photos WHERE id = ? AND listing_id = ?').get(req.params.photoId, l.id);
    if (!p) throw httpError(404, 'Foto não encontrada.');
    fs.rmSync(path.join(uploadsDir, p.filename), { force: true });
    db.prepare('DELETE FROM photos WHERE id = ?').run(p.id);
    res.json({ ok: true });
  });

  // ---------- Interessados ----------
  app.get('/api/leads', auth, (req, res) => {
    const rows = db.prepare(
      `SELECT d.*, l.type AS listing_type, l.bairro AS listing_bairro, l.deal AS listing_deal, l.price AS listing_price
       FROM leads d LEFT JOIN listings l ON l.id = d.listing_id
       WHERE d.broker_id = ? ORDER BY d.created_at DESC, d.id DESC`
    ).all(req.broker.id);
    res.json({ statuses: LEAD_STATUSES, leads: rows.map((r) => ({ ...r, whatsapp_url: `https://wa.me/${waNumber(r.phone)}` })) });
  });

  app.put('/api/leads/:id', auth, (req, res) => {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ? AND broker_id = ?').get(req.params.id, req.broker.id);
    if (!lead) throw httpError(404, 'Interessado não encontrado.');
    const b = req.body || {};
    const status = b.status === undefined ? lead.status : b.status;
    if (!LEAD_STATUSES.includes(status)) throw httpError(400, 'Status inválido.');
    const note = b.note === undefined ? lead.note : str(b.note, 1000);
    db.prepare("UPDATE leads SET status = ?, note = ?, updated_at = datetime('now') WHERE id = ?").run(status, note, lead.id);
    res.json({ ok: true });
  });

  app.delete('/api/leads/:id', auth, (req, res) => {
    const r = db.prepare('DELETE FROM leads WHERE id = ? AND broker_id = ?').run(req.params.id, req.broker.id);
    if (!r.changes) throw httpError(404, 'Interessado não encontrado.');
    res.json({ ok: true });
  });

  // ---------- Resumo ----------
  app.get('/api/stats', auth, (req, res) => {
    const id = req.broker.id;
    const since = new Date(Date.now() - 7 * 864e5).toISOString().replace('T', ' ').slice(0, 19);
    const one = (sql, ...a) => db.prepare(sql).get(...a).n;
    const top = db.prepare(
      `SELECT l.id, l.type, l.bairro, l.deal, COUNT(v.id) AS views
       FROM listings l LEFT JOIN views v ON v.listing_id = l.id AND v.created_at >= ?
       WHERE l.broker_id = ? AND l.status = 'ativo' GROUP BY l.id ORDER BY views DESC, l.id DESC LIMIT 5`
    ).all(since, id);
    res.json({
      visitors7: one('SELECT COUNT(DISTINCT visitor) AS n FROM views WHERE broker_id = ? AND created_at >= ?', id, since),
      listingViews7: one('SELECT COUNT(*) AS n FROM views WHERE broker_id = ? AND listing_id IS NOT NULL AND created_at >= ?', id, since),
      leads7: one('SELECT COUNT(*) AS n FROM leads WHERE broker_id = ? AND created_at >= ?', id, since),
      visits: one("SELECT COUNT(*) AS n FROM leads WHERE broker_id = ? AND status = 'Visita marcada'", id),
      activeListings: one("SELECT COUNT(*) AS n FROM listings WHERE broker_id = ? AND status = 'ativo'", id),
      top,
    });
  });

  // ---------- Público: pedido de contato ----------
  const leadHits = new Map();
  app.post('/api/public/leads', (req, res) => {
    const ip = req.ip || 'x';
    const now = Date.now();
    const hits = (leadHits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
    if (hits.length >= 10) throw httpError(429, 'Muitos pedidos seguidos. Tente de novo em alguns minutos.');
    hits.push(now);
    leadHits.set(ip, hits);

    const b = req.body || {};
    const broker = db.prepare('SELECT * FROM brokers WHERE slug = ?').get(str(b.slug, 60) || '');
    if (!broker) throw httpError(404, 'Vitrine não encontrada.');
    const listing = b.listing_id
      ? db.prepare("SELECT * FROM listings WHERE id = ? AND broker_id = ? AND status <> 'pausado'").get(Number(b.listing_id), broker.id)
      : null;
    required(b, [['name', 'seu nome'], ['phone', 'seu WhatsApp']]);
    if (digits(b.phone).length < 10) throw httpError(400, 'WhatsApp inválido. Use DDD + número.');
    const kind = b.kind === 'visita' ? 'visita' : 'contato';
    const name = str(b.name, 80);

    // Mesma pessoa pedindo de novo o mesmo imóvel: atualiza em vez de duplicar.
    const existing = db.prepare('SELECT * FROM leads WHERE broker_id = ? AND phone = ? AND listing_id IS ?')
      .get(broker.id, digits(b.phone), listing ? listing.id : null);
    if (existing) {
      const status = kind === 'visita' && existing.status === 'Pediu contato' ? 'Quer visitar' : existing.status;
      db.prepare("UPDATE leads SET name = ?, kind = ?, status = ?, updated_at = datetime('now') WHERE id = ?").run(name, kind, status, existing.id);
    } else {
      db.prepare('INSERT INTO leads (broker_id, listing_id, name, phone, kind, status) VALUES (?, ?, ?, ?, ?, ?)')
        .run(broker.id, listing ? listing.id : null, name, digits(b.phone), kind, kind === 'visita' ? 'Quer visitar' : 'Pediu contato');
    }

    const what = listing ? `o ${listing.type.toLowerCase()} no ${listing.bairro}` : 'seus imóveis';
    const link = listing ? `${req.protocol}://${req.get('host')}/${broker.slug}/${listing.id}` : '';
    const text = kind === 'visita'
      ? `Olá, ${broker.name.split(' ')[0]}! Sou ${name}. Quero visitar ${what}. Quais dias e horários você tem? ${link}`
      : `Olá, ${broker.name.split(' ')[0]}! Sou ${name}. Tenho interesse n${listing ? 'o' : 'os'} ${listing ? `${listing.type.toLowerCase()} no ${listing.bairro}` : 'seus imóveis'}. ${link}`;
    res.status(201).json({ whatsapp_url: `https://wa.me/${waNumber(broker.whatsapp)}?text=${encodeURIComponent(text.trim())}` });
  });

  // ---------- Páginas públicas ----------
  function visitorId(req, res) {
    const m = /(?:^|;\s*)vid=([a-f0-9]{16,32})/.exec(req.get('cookie') || '');
    if (m) return m[1];
    const id = crypto.randomBytes(12).toString('hex');
    res.cookie('vid', id, { maxAge: 365 * 864e5, httpOnly: true, sameSite: 'lax' });
    return id;
  }
  const isBot = (req) => /bot|crawl|spider|facebookexternalhit|whatsapp|preview|slurp/i.test(req.get('user-agent') || '');

  app.get('/', (_req, res) => res.redirect('/painel/'));

  app.get('/:slug', (req, res, next) => {
    if (RESERVED_SLUGS.has(req.params.slug.toLowerCase())) return next();
    const broker = db.prepare('SELECT * FROM brokers WHERE slug = ?').get(req.params.slug);
    if (!broker) return res.status(404).send(views.notFound());
    const listings = db.prepare(
      "SELECT * FROM listings WHERE broker_id = ? AND status <> 'pausado' ORDER BY (status = 'ativo') DESC, created_at DESC, id DESC"
    ).all(broker.id).map(hydrate);
    if (!isBot(req)) db.prepare('INSERT INTO views (broker_id, listing_id, visitor) VALUES (?, NULL, ?)').run(broker.id, visitorId(req, res));
    res.send(views.showcase({ broker, listings, origin: `${req.protocol}://${req.get('host')}` }));
  });

  app.get('/:slug/:id', (req, res, next) => {
    if (RESERVED_SLUGS.has(req.params.slug.toLowerCase()) || !/^\d+$/.test(req.params.id)) return next();
    const broker = db.prepare('SELECT * FROM brokers WHERE slug = ?').get(req.params.slug);
    const l = broker && db.prepare("SELECT * FROM listings WHERE id = ? AND broker_id = ? AND status <> 'pausado'").get(req.params.id, broker.id);
    if (!l) return res.status(404).send(views.notFound(broker));
    if (!isBot(req)) db.prepare('INSERT INTO views (broker_id, listing_id, visitor) VALUES (?, ?, ?)').run(broker.id, l.id, visitorId(req, res));
    res.send(views.listingPage({ broker, listing: hydrate(l), origin: `${req.protocol}://${req.get('host')}` }));
  });

  // ---------- Erros ----------
  app.use('/api', (_req, _res, next) => next(httpError(404, 'Rota não encontrada.')));
  app.use((_req, res) => res.status(404).send(views.notFound()));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    const status = err.status || (err.type === 'entity.parse.failed' ? 400 : err.type === 'entity.too.large' ? 413 : 500);
    if (status >= 500) console.error(err);
    const message = status === 413 ? 'Arquivo grande demais.' : status >= 500 ? 'Erro no servidor. Tente de novo.' : err.message;
    if (req.path.startsWith('/api')) return res.status(status).json({ error: message });
    res.status(status).send(views.notFound());
  });

  return app;
}

module.exports = { createApp, LEAD_STATUSES, slugify, hashPassword };
