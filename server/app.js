const express = require('express');
const path = require('node:path');
const S = require('./services');

const { httpError } = S;

function createApp(db) {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // ---------- Helpers ----------

  const str = (v, max = 500) => (v == null ? null : String(v).trim().slice(0, max) || null);
  const num = (v, def = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
  };
  const required = (body, fields) => {
    for (const f of fields) if (!str(body[f])) throw httpError(400, `Campo obrigatório: ${f}`);
  };

  function auth(...roles) {
    return (req, _res, next) => {
      const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
      const row = token
        ? db
            .prepare(
              `SELECT u.id, u.name, u.email, u.role, u.phone, u.company, u.cau
               FROM sessions s JOIN users u ON u.id = s.user_id
               WHERE s.token = ? AND s.expires_at > ?`
            )
            .get(token, new Date().toISOString())
        : null;
      if (!row) return next(httpError(401, 'Faça login para continuar.'));
      if (roles.length && !roles.includes(row.role)) return next(httpError(403, 'Acesso não permitido para este perfil.'));
      req.user = row;
      req.token = token;
      next();
    };
  }

  function storeOf(userId) {
    const store = db.prepare('SELECT * FROM stores WHERE user_id = ?').get(userId);
    if (!store) throw httpError(404, 'Loja não encontrada.');
    return store;
  }

  function ownBudget(req) {
    const b = db.prepare('SELECT * FROM budgets WHERE id = ? AND architect_id = ?').get(req.params.id, req.user.id);
    if (!b) throw httpError(404, 'Orçamento não encontrado.');
    return b;
  }

  function budgetItems(budgetId) {
    return db
      .prepare(
        `SELECT bi.*, sg.name AS segment_name, sg.icon AS segment_icon, st.name AS store_name
         FROM budget_items bi
         LEFT JOIN segments sg ON sg.id = bi.segment_id
         LEFT JOIN stores st ON st.id = bi.store_id
         WHERE bi.budget_id = ? ORDER BY bi.position, bi.id`
      )
      .all(budgetId);
  }

  // ---------- Auth ----------

  app.post('/api/auth/register', (req, res) => {
    const b = req.body || {};
    required(b, ['name', 'email', 'password', 'role']);
    if (!['architect', 'store'].includes(b.role)) throw httpError(400, 'Perfil inválido.');
    if (String(b.password).length < 6) throw httpError(400, 'A senha deve ter pelo menos 6 caracteres.');
    if (!/^\S+@\S+\.\S+$/.test(b.email)) throw httpError(400, 'E-mail inválido.');
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(str(b.email))) throw httpError(409, 'E-mail já cadastrado.');

    let segmentIds = [];
    if (b.role === 'store') {
      required(b, ['storeName']);
      segmentIds = [...new Set((b.segments || []).map(Number))].filter(
        (id) => db.prepare('SELECT 1 FROM segments WHERE id = ? AND active = 1').get(id)
      );
      if (!segmentIds.length) throw httpError(400, 'Escolha ao menos um segmento de atuação.');
    }
    const plan = ['mensal', 'trimestral', 'anual'].includes(b.plan) ? b.plan : 'mensal';

    const userId = S.tx(db, () => {
      const { lastInsertRowid } = db
        .prepare('INSERT INTO users (name, email, password_hash, role, phone, company, cau) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(str(b.name, 120), str(b.email, 160), S.hashPassword(String(b.password)), b.role, str(b.phone, 40), str(b.company, 120), str(b.cau, 40));
      if (b.role === 'store') {
        const st = db
          .prepare('INSERT INTO stores (user_id, name, cnpj, phone, whatsapp, email, city, state) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .run(lastInsertRowid, str(b.storeName, 120), str(b.cnpj, 20), str(b.phone, 40), str(b.whatsapp || b.phone, 40), str(b.email, 160), str(b.city, 80), str(b.state, 2));
        for (const segId of segmentIds) {
          db.prepare('INSERT INTO store_segments (store_id, segment_id, plan) VALUES (?, ?, ?)').run(st.lastInsertRowid, segId, plan);
        }
      }
      return Number(lastInsertRowid);
    });
    res.status(201).json({ token: S.createSession(db, userId) });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(str(email) || '');
    if (!user || !S.verifyPassword(String(password || ''), user.password_hash)) throw httpError(401, 'E-mail ou senha incorretos.');
    res.json({ token: S.createSession(db, user.id) });
  });

  app.post('/api/auth/logout', auth(), (req, res) => {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(req.token);
    res.json({ ok: true });
  });

  app.get('/api/me', auth(), (req, res) => res.json(req.user));

  app.put('/api/me', auth(), (req, res) => {
    const b = req.body || {};
    required(b, ['name']);
    db.prepare('UPDATE users SET name = ?, phone = ?, company = ?, cau = ? WHERE id = ?').run(
      str(b.name, 120), str(b.phone, 40), str(b.company, 120), str(b.cau, 40), req.user.id
    );
    res.json({ ok: true });
  });

  // ---------- Segmentos (público) ----------

  app.get('/api/segments', (_req, res) => {
    S.expireSubscriptions(db);
    const rows = db
      .prepare(
        `SELECT sg.id, sg.name, sg.icon, sg.active,
           (SELECT COUNT(*) FROM store_segments ss WHERE ss.segment_id = sg.id AND ss.status = 'active') AS active_stores,
           (SELECT COUNT(*) FROM store_segments ss WHERE ss.segment_id = sg.id AND ss.status = 'waitlist') AS waitlist
         FROM segments sg WHERE sg.active = 1 ORDER BY sg.name`
      )
      .all();
    res.json(rows.map((r) => ({ ...r, max_stores: S.MAX_STORES_PER_SEGMENT, free_slots: Math.max(0, S.MAX_STORES_PER_SEGMENT - r.active_stores) })));
  });

  app.get('/api/plans', (_req, res) => {
    res.json(Object.entries(S.PLAN_PRICES).map(([id, price]) => ({ id, price, months: S.PLAN_MONTHS[id] })));
  });

  // ---------- Arquiteto: lojas parceiras ----------

  app.get('/api/partners', auth('architect', 'admin'), (req, res) => {
    S.expireSubscriptions(db);
    const segmentId = Number(req.query.segment_id);
    const budgetId = req.query.budget_id ? Number(req.query.budget_id) : null;
    const segments = segmentId
      ? db.prepare('SELECT id, name, icon FROM segments WHERE id = ?').all(segmentId)
      : db.prepare('SELECT id, name, icon FROM segments WHERE active = 1 ORDER BY name').all();
    const out = segments.map((sg) => {
      const stores = S.activeStoresForSegment(db, sg.id);
      if (req.user.role === 'architect' && req.query.track !== '0') {
        for (const st of stores) S.logStoreEvent(db, { storeId: st.id, segmentId: sg.id, architectId: req.user.id, budgetId, type: 'impression' });
      }
      return { ...sg, stores };
    });
    res.json(out);
  });

  app.post('/api/partners/:storeId/contact', auth('architect'), (req, res) => {
    const storeId = Number(req.params.storeId);
    const b = req.body || {};
    if (!db.prepare('SELECT 1 FROM stores WHERE id = ?').get(storeId)) throw httpError(404, 'Loja não encontrada.');
    const channel = ['whatsapp', 'phone', 'email', 'website', 'instagram'].includes(b.channel) ? b.channel : 'phone';
    S.logStoreEvent(db, {
      storeId, segmentId: b.segment_id ? Number(b.segment_id) : null, architectId: req.user.id,
      budgetId: b.budget_id ? Number(b.budget_id) : null, type: 'contact', channel,
    });
    res.json({ ok: true });
  });

  // ---------- Arquiteto: clientes ----------

  app.get('/api/clients', auth('architect'), (req, res) => {
    res.json(
      db.prepare(
        `SELECT c.*, (SELECT COUNT(*) FROM budgets b WHERE b.client_id = c.id) AS budgets
         FROM clients c WHERE c.architect_id = ? ORDER BY c.name`
      ).all(req.user.id)
    );
  });

  app.post('/api/clients', auth('architect'), (req, res) => {
    const b = req.body || {};
    required(b, ['name']);
    const r = db
      .prepare('INSERT INTO clients (architect_id, name, email, phone, document, address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, str(b.name, 120), str(b.email, 160), str(b.phone, 40), str(b.document, 30), str(b.address, 300));
    res.status(201).json({ id: Number(r.lastInsertRowid) });
  });

  app.put('/api/clients/:id', auth('architect'), (req, res) => {
    const b = req.body || {};
    required(b, ['name']);
    const r = db
      .prepare('UPDATE clients SET name = ?, email = ?, phone = ?, document = ?, address = ? WHERE id = ? AND architect_id = ?')
      .run(str(b.name, 120), str(b.email, 160), str(b.phone, 40), str(b.document, 30), str(b.address, 300), req.params.id, req.user.id);
    if (!r.changes) throw httpError(404, 'Cliente não encontrado.');
    res.json({ ok: true });
  });

  app.delete('/api/clients/:id', auth('architect'), (req, res) => {
    const r = db.prepare('DELETE FROM clients WHERE id = ? AND architect_id = ?').run(req.params.id, req.user.id);
    if (!r.changes) throw httpError(404, 'Cliente não encontrado.');
    res.json({ ok: true });
  });

  // ---------- Arquiteto: orçamentos ----------

  app.get('/api/dashboard', auth('architect'), (req, res) => {
    const budgets = db.prepare('SELECT * FROM budgets WHERE architect_id = ?').all(req.user.id);
    const byStatus = { rascunho: 0, enviado: 0, aprovado: 0, recusado: 0 };
    let approvedTotal = 0;
    let openTotal = 0;
    for (const b of budgets) {
      byStatus[b.status]++;
      const t = S.computeTotals(b, budgetItems(b.id)).total;
      if (b.status === 'aprovado') approvedTotal += t;
      if (b.status === 'enviado' || b.status === 'rascunho') openTotal += t;
    }
    const clients = db.prepare('SELECT COUNT(*) AS n FROM clients WHERE architect_id = ?').get(req.user.id).n;
    const conversion = byStatus.aprovado + byStatus.recusado ? byStatus.aprovado / (byStatus.aprovado + byStatus.recusado) : null;
    res.json({ total: budgets.length, byStatus, approvedTotal: S.round2(approvedTotal), openTotal: S.round2(openTotal), clients, conversion });
  });

  app.get('/api/budgets', auth('architect'), (req, res) => {
    const rows = db
      .prepare(
        `SELECT b.*, c.name AS client_name FROM budgets b LEFT JOIN clients c ON c.id = b.client_id
         WHERE b.architect_id = ? ORDER BY b.updated_at DESC`
      )
      .all(req.user.id);
    res.json(rows.map((b) => ({ ...b, totals: S.computeTotals(b, budgetItems(b.id)), items_count: budgetItems(b.id).length })));
  });

  app.post('/api/budgets', auth('architect'), (req, res) => {
    const b = req.body || {};
    const clientId = b.client_id ? Number(b.client_id) : null;
    if (clientId && !db.prepare('SELECT 1 FROM clients WHERE id = ? AND architect_id = ?').get(clientId, req.user.id)) {
      throw httpError(400, 'Cliente inválido.');
    }
    const r = db
      .prepare('INSERT INTO budgets (architect_id, client_id, code, title, project_address, fee_type, fee_value) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(req.user.id, clientId, S.nextBudgetCode(db, req.user.id), str(b.title, 160) || 'Novo orçamento', str(b.project_address, 300), 'percent', num(b.fee_value, 10));
    res.status(201).json({ id: Number(r.lastInsertRowid) });
  });

  app.get('/api/budgets/:id', auth('architect'), (req, res) => {
    const budget = ownBudget(req);
    const items = budgetItems(budget.id);
    const client = budget.client_id ? db.prepare('SELECT * FROM clients WHERE id = ?').get(budget.client_id) : null;
    // Lojas parceiras dos segmentos usados neste orçamento (sem contar exibição: é só leitura do documento).
    const segIds = [...new Set(items.map((i) => i.segment_id).filter(Boolean))];
    const partners = segIds.map((id) => ({
      ...db.prepare('SELECT id, name, icon FROM segments WHERE id = ?').get(id),
      stores: S.activeStoresForSegment(db, id).sort((a, b) => a.name.localeCompare(b.name)),
    }));
    res.json({ ...budget, client, items, totals: S.computeTotals(budget, items), partners, architect: req.user });
  });

  app.put('/api/budgets/:id', auth('architect'), (req, res) => {
    const budget = ownBudget(req);
    const b = { ...budget, ...(req.body || {}) };
    const clientId = b.client_id ? Number(b.client_id) : null;
    if (clientId && !db.prepare('SELECT 1 FROM clients WHERE id = ? AND architect_id = ?').get(clientId, req.user.id)) {
      throw httpError(400, 'Cliente inválido.');
    }
    if (!['rascunho', 'enviado', 'aprovado', 'recusado'].includes(b.status)) throw httpError(400, 'Status inválido.');
    if (!['percent', 'fixed'].includes(b.fee_type)) throw httpError(400, 'Tipo de honorário inválido.');
    db.prepare(
      `UPDATE budgets SET client_id = ?, title = ?, project_address = ?, status = ?, fee_type = ?, fee_value = ?,
         discount = ?, validity_days = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(
      clientId, str(b.title, 160) || 'Orçamento', str(b.project_address, 300), b.status, b.fee_type,
      Math.max(0, num(b.fee_value)), Math.max(0, num(b.discount)), Math.max(1, Math.round(num(b.validity_days, 15))),
      str(b.notes, 4000), budget.id
    );
    res.json({ ok: true });
  });

  app.delete('/api/budgets/:id', auth('architect'), (req, res) => {
    const budget = ownBudget(req);
    db.prepare('DELETE FROM budgets WHERE id = ?').run(budget.id);
    res.json({ ok: true });
  });

  app.post('/api/budgets/:id/duplicate', auth('architect'), (req, res) => {
    const budget = ownBudget(req);
    const newId = S.tx(db, () => {
      const r = db
        .prepare(
          `INSERT INTO budgets (architect_id, client_id, code, title, project_address, fee_type, fee_value, discount, validity_days, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(req.user.id, budget.client_id, S.nextBudgetCode(db, req.user.id), `${budget.title} (cópia)`, budget.project_address,
          budget.fee_type, budget.fee_value, budget.discount, budget.validity_days, budget.notes);
      for (const it of budgetItems(budget.id)) {
        db.prepare(
          'INSERT INTO budget_items (budget_id, room, segment_id, store_id, description, unit, quantity, unit_price, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(r.lastInsertRowid, it.room, it.segment_id, it.store_id, it.description, it.unit, it.quantity, it.unit_price, it.position);
      }
      return Number(r.lastInsertRowid);
    });
    res.status(201).json({ id: newId });
  });

  function validateItem(body, existing = {}) {
    const it = { ...existing, ...body };
    if (!str(it.description)) throw httpError(400, 'Descreva o item.');
    const segmentId = it.segment_id ? Number(it.segment_id) : null;
    if (segmentId && !db.prepare('SELECT 1 FROM segments WHERE id = ?').get(segmentId)) throw httpError(400, 'Segmento inválido.');
    let storeId = it.store_id ? Number(it.store_id) : null;
    if (storeId) {
      if (!segmentId) throw httpError(400, 'Escolha o segmento antes da loja.');
      // Mantém a loja já salva mesmo que a assinatura tenha vencido; só valida novas escolhas.
      if (storeId !== existing.store_id && !S.isStoreActiveInSegment(db, storeId, segmentId)) {
        throw httpError(400, 'Esta loja não é parceira ativa neste segmento.');
      }
    }
    return {
      room: str(it.room, 80) || 'Geral',
      segment_id: segmentId,
      store_id: storeId,
      description: str(it.description, 300),
      unit: str(it.unit, 10) || 'un',
      quantity: Math.max(0, num(it.quantity, 1)),
      unit_price: Math.max(0, num(it.unit_price)),
    };
  }

  app.post('/api/budgets/:id/items', auth('architect'), (req, res) => {
    const budget = ownBudget(req);
    const it = validateItem(req.body || {});
    const pos = db.prepare('SELECT COALESCE(MAX(position), 0) + 1 AS p FROM budget_items WHERE budget_id = ?').get(budget.id).p;
    const r = db
      .prepare('INSERT INTO budget_items (budget_id, room, segment_id, store_id, description, unit, quantity, unit_price, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(budget.id, it.room, it.segment_id, it.store_id, it.description, it.unit, it.quantity, it.unit_price, pos);
    if (it.store_id) S.logStoreEvent(db, { storeId: it.store_id, segmentId: it.segment_id, architectId: req.user.id, budgetId: budget.id, type: 'selected' });
    db.prepare("UPDATE budgets SET updated_at = datetime('now') WHERE id = ?").run(budget.id);
    res.status(201).json({ id: Number(r.lastInsertRowid) });
  });

  app.put('/api/budgets/:id/items/:itemId', auth('architect'), (req, res) => {
    const budget = ownBudget(req);
    const existing = db.prepare('SELECT * FROM budget_items WHERE id = ? AND budget_id = ?').get(req.params.itemId, budget.id);
    if (!existing) throw httpError(404, 'Item não encontrado.');
    const it = validateItem(req.body || {}, existing);
    db.prepare('UPDATE budget_items SET room = ?, segment_id = ?, store_id = ?, description = ?, unit = ?, quantity = ?, unit_price = ? WHERE id = ?')
      .run(it.room, it.segment_id, it.store_id, it.description, it.unit, it.quantity, it.unit_price, existing.id);
    if (it.store_id && it.store_id !== existing.store_id) {
      S.logStoreEvent(db, { storeId: it.store_id, segmentId: it.segment_id, architectId: req.user.id, budgetId: budget.id, type: 'selected' });
    }
    db.prepare("UPDATE budgets SET updated_at = datetime('now') WHERE id = ?").run(budget.id);
    res.json({ ok: true });
  });

  app.delete('/api/budgets/:id/items/:itemId', auth('architect'), (req, res) => {
    const budget = ownBudget(req);
    const r = db.prepare('DELETE FROM budget_items WHERE id = ? AND budget_id = ?').run(req.params.itemId, budget.id);
    if (!r.changes) throw httpError(404, 'Item não encontrado.');
    db.prepare("UPDATE budgets SET updated_at = datetime('now') WHERE id = ?").run(budget.id);
    res.json({ ok: true });
  });

  // ---------- Lojista ----------

  function storeMetrics(storeId) {
    const since = new Date(Date.now() - 30 * 864e5).toISOString().replace('T', ' ').slice(0, 19);
    const count = (type, from) =>
      db.prepare(`SELECT COUNT(*) AS n FROM store_events WHERE store_id = ? AND type = ? ${from ? 'AND created_at >= ?' : ''}`)
        .get(...[storeId, type, ...(from ? [from] : [])]).n;
    return {
      last30: { impressions: count('impression', since), contacts: count('contact', since), selected: count('selected', since) },
      allTime: { impressions: count('impression'), contacts: count('contact'), selected: count('selected') },
    };
  }

  app.get('/api/store/me', auth('store'), (req, res) => {
    S.expireSubscriptions(db);
    const store = storeOf(req.user.id);
    const subs = db
      .prepare(
        `SELECT ss.*, sg.name AS segment_name, sg.icon AS segment_icon,
           (SELECT COUNT(*) FROM store_segments x WHERE x.segment_id = ss.segment_id AND x.status = 'active') AS active_stores
         FROM store_segments ss JOIN segments sg ON sg.id = ss.segment_id
         WHERE ss.store_id = ? ORDER BY sg.name`
      )
      .all(store.id)
      .map((s) => ({ ...s, waitlist_position: S.waitlistPosition(db, s), price: S.PLAN_PRICES[s.plan] }));
    const leads = db
      .prepare(
        `SELECT e.created_at, e.channel, e.type, u.name AS architect_name, u.company AS architect_company, sg.name AS segment_name
         FROM store_events e
         LEFT JOIN users u ON u.id = e.architect_id
         LEFT JOIN segments sg ON sg.id = e.segment_id
         WHERE e.store_id = ? AND e.type IN ('contact','selected')
         ORDER BY e.created_at DESC, e.id DESC LIMIT 30`
      )
      .all(store.id);
    res.json({ store, subscriptions: subs, metrics: storeMetrics(store.id), leads, max_per_segment: S.MAX_STORES_PER_SEGMENT });
  });

  app.put('/api/store/me', auth('store'), (req, res) => {
    const store = storeOf(req.user.id);
    const b = req.body || {};
    required(b, ['name']);
    const color = /^#[0-9a-f]{6}$/i.test(b.color || '') ? b.color : store.color;
    db.prepare(
      `UPDATE stores SET name = ?, cnpj = ?, description = ?, phone = ?, whatsapp = ?, email = ?, website = ?,
         instagram = ?, address = ?, city = ?, state = ?, color = ? WHERE id = ?`
    ).run(
      str(b.name, 120), str(b.cnpj, 20), str(b.description, 600), str(b.phone, 40), str(b.whatsapp, 40), str(b.email, 160),
      str(b.website, 200), str(b.instagram, 80), str(b.address, 300), str(b.city, 80), str(b.state, 2), color, store.id
    );
    res.json({ ok: true });
  });

  app.post('/api/store/segments', auth('store'), (req, res) => {
    const store = storeOf(req.user.id);
    const b = req.body || {};
    const segmentId = Number(b.segment_id);
    const plan = ['mensal', 'trimestral', 'anual'].includes(b.plan) ? b.plan : 'mensal';
    if (!db.prepare('SELECT 1 FROM segments WHERE id = ? AND active = 1').get(segmentId)) throw httpError(400, 'Segmento inválido.');
    const existing = db.prepare('SELECT * FROM store_segments WHERE store_id = ? AND segment_id = ?').get(store.id, segmentId);
    if (existing && existing.status !== 'inactive') throw httpError(409, 'Você já possui solicitação para este segmento.');
    if (existing) {
      db.prepare("UPDATE store_segments SET status = 'pending', plan = ?, requested_at = datetime('now'), activated_at = NULL, expires_at = NULL WHERE id = ?")
        .run(plan, existing.id);
    } else {
      db.prepare('INSERT INTO store_segments (store_id, segment_id, plan) VALUES (?, ?, ?)').run(store.id, segmentId, plan);
    }
    res.status(201).json({ ok: true });
  });

  app.delete('/api/store/segments/:subId', auth('store'), (req, res) => {
    const store = storeOf(req.user.id);
    const sub = db.prepare('SELECT * FROM store_segments WHERE id = ? AND store_id = ?').get(req.params.subId, store.id);
    if (!sub) throw httpError(404, 'Assinatura não encontrada.');
    S.deactivateSubscription(db, sub.id);
    res.json({ ok: true });
  });

  // ---------- Admin ----------

  app.get('/api/admin/overview', auth('admin'), (_req, res) => {
    S.expireSubscriptions(db);
    const segments = db.prepare('SELECT * FROM segments ORDER BY name').all();
    const subs = db
      .prepare(
        `SELECT ss.*, st.name AS store_name, st.city, st.state, st.phone, st.email, sg.name AS segment_name
         FROM store_segments ss JOIN stores st ON st.id = ss.store_id JOIN segments sg ON sg.id = ss.segment_id
         ORDER BY ss.requested_at, ss.id`
      )
      .all();
    const counts = {
      architects: db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'architect'").get().n,
      stores: db.prepare('SELECT COUNT(*) AS n FROM stores').get().n,
      budgets: db.prepare('SELECT COUNT(*) AS n FROM budgets').get().n,
      pending: subs.filter((s) => s.status === 'pending').length,
      mrr: S.round2(subs.filter((s) => s.status === 'active').reduce((sum, s) => sum + S.PLAN_PRICES[s.plan] / S.PLAN_MONTHS[s.plan], 0)),
    };
    res.json({
      counts,
      max_per_segment: S.MAX_STORES_PER_SEGMENT,
      segments: segments.map((sg) => ({
        ...sg,
        active: !!sg.active,
        subscriptions: subs.filter((s) => s.segment_id === sg.id),
      })),
      pending: subs.filter((s) => s.status === 'pending'),
    });
  });

  app.post('/api/admin/subscriptions/:id/approve', auth('admin'), (req, res) => {
    res.json({ status: S.approveSubscription(db, Number(req.params.id)) });
  });

  app.post('/api/admin/subscriptions/:id/deactivate', auth('admin'), (req, res) => {
    res.json({ promoted: S.deactivateSubscription(db, Number(req.params.id)) });
  });

  app.post('/api/admin/segments', auth('admin'), (req, res) => {
    const b = req.body || {};
    required(b, ['name']);
    if (db.prepare('SELECT 1 FROM segments WHERE name = ?').get(str(b.name, 80))) throw httpError(409, 'Segmento já existe.');
    const r = db.prepare('INSERT INTO segments (name, icon) VALUES (?, ?)').run(str(b.name, 80), str(b.icon, 8) || '📦');
    res.status(201).json({ id: Number(r.lastInsertRowid) });
  });

  app.put('/api/admin/segments/:id', auth('admin'), (req, res) => {
    const b = req.body || {};
    const sg = db.prepare('SELECT * FROM segments WHERE id = ?').get(req.params.id);
    if (!sg) throw httpError(404, 'Segmento não encontrado.');
    db.prepare('UPDATE segments SET name = ?, icon = ?, active = ? WHERE id = ?').run(
      str(b.name, 80) || sg.name, str(b.icon, 8) || sg.icon, b.active === undefined ? sg.active : b.active ? 1 : 0, sg.id
    );
    res.json({ ok: true });
  });

  // ---------- Erros / SPA ----------

  app.use('/api', (_req, _res, next) => next(httpError(404, 'Rota não encontrada.')));

  app.get(/.*/, (_req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status || (err.type === 'entity.parse.failed' ? 400 : 500);
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? 'Erro interno no servidor.' : err.message });
  });

  return app;
}

module.exports = { createApp };
