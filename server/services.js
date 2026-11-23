const crypto = require('node:crypto');
const { MAX_STORES_PER_SEGMENT } = require('./db');

// ---------- Senhas e sessões ----------

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === candidate.length && crypto.timingSafeEqual(expected, candidate);
}

function createSession(db, userId, days = 30) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + days * 864e5).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expires);
  return token;
}

// ---------- Transações ----------

function tx(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// ---------- Vagas de anunciantes (máx. 3 por segmento) ----------

const PLAN_MONTHS = { mensal: 1, trimestral: 3, anual: 12 };
const PLAN_PRICES = { mensal: 199, trimestral: 549, anual: 1990 };

function addMonthsISO(months, from = new Date()) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

function activeCount(db, segmentId) {
  return db
    .prepare("SELECT COUNT(*) AS n FROM store_segments WHERE segment_id = ? AND status = 'active'")
    .get(segmentId).n;
}

// Aprova uma solicitação: ocupa a vaga se houver, senão vai para a fila de espera.
// Deve rodar dentro de transação.
function placeSubscription(db, subId) {
  const sub = db.prepare('SELECT * FROM store_segments WHERE id = ?').get(subId);
  if (!sub) throw httpError(404, 'Assinatura não encontrada.');
  if (sub.status === 'active') return 'active';
  if (activeCount(db, sub.segment_id) < MAX_STORES_PER_SEGMENT) {
    db.prepare(
      "UPDATE store_segments SET status = 'active', activated_at = datetime('now'), expires_at = ? WHERE id = ?"
    ).run(addMonthsISO(PLAN_MONTHS[sub.plan] || 1), subId);
    return 'active';
  }
  db.prepare("UPDATE store_segments SET status = 'waitlist' WHERE id = ?").run(subId);
  return 'waitlist';
}

// Preenche vagas livres com a fila de espera (ordem de chegada).
function promoteWaitlist(db, segmentId) {
  const promoted = [];
  while (activeCount(db, segmentId) < MAX_STORES_PER_SEGMENT) {
    const next = db
      .prepare(
        "SELECT id FROM store_segments WHERE segment_id = ? AND status = 'waitlist' ORDER BY requested_at, id LIMIT 1"
      )
      .get(segmentId);
    if (!next) break;
    placeSubscription(db, next.id);
    promoted.push(next.id);
  }
  return promoted;
}

function deactivateSubscription(db, subId) {
  return tx(db, () => {
    const sub = db.prepare('SELECT * FROM store_segments WHERE id = ?').get(subId);
    if (!sub) throw httpError(404, 'Assinatura não encontrada.');
    db.prepare("UPDATE store_segments SET status = 'inactive' WHERE id = ?").run(subId);
    return promoteWaitlist(db, sub.segment_id);
  });
}

function approveSubscription(db, subId) {
  return tx(db, () => placeSubscription(db, subId));
}

// Expira assinaturas vencidas e libera as vagas para a fila.
function expireSubscriptions(db) {
  const expired = db
    .prepare("SELECT id, segment_id FROM store_segments WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < ?")
    .all(new Date().toISOString());
  if (!expired.length) return 0;
  tx(db, () => {
    for (const s of expired) db.prepare("UPDATE store_segments SET status = 'inactive' WHERE id = ?").run(s.id);
    for (const segId of new Set(expired.map((s) => s.segment_id))) promoteWaitlist(db, segId);
  });
  return expired.length;
}

function waitlistPosition(db, sub) {
  if (sub.status !== 'waitlist') return null;
  return db
    .prepare(
      `SELECT COUNT(*) AS n FROM store_segments
       WHERE segment_id = ? AND status = 'waitlist' AND (requested_at < ? OR (requested_at = ? AND id <= ?))`
    )
    .get(sub.segment_id, sub.requested_at, sub.requested_at, sub.id).n;
}

// ---------- Orçamentos ----------

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function computeTotals(budget, items) {
  const subtotal = round2(items.reduce((s, it) => s + Number(it.quantity) * Number(it.unit_price), 0));
  const fee = round2(budget.fee_type === 'percent' ? (subtotal * Number(budget.fee_value)) / 100 : Number(budget.fee_value));
  const discount = round2(Number(budget.discount) || 0);
  const total = round2(subtotal + fee - discount);

  const bySegment = {};
  const byRoom = {};
  for (const it of items) {
    const v = Number(it.quantity) * Number(it.unit_price);
    const sk = it.segment_name || 'Sem segmento';
    bySegment[sk] = round2((bySegment[sk] || 0) + v);
    byRoom[it.room] = round2((byRoom[it.room] || 0) + v);
  }
  return { subtotal, fee, discount, total, bySegment, byRoom };
}

function nextBudgetCode(db, architectId) {
  const year = new Date().getFullYear();
  const last = db
    .prepare('SELECT code FROM budgets WHERE architect_id = ? AND code LIKE ? ORDER BY code DESC LIMIT 1')
    .get(architectId, `ORC-${year}-%`);
  const n = last ? parseInt(last.code.split('-')[2], 10) + 1 : 1;
  return `ORC-${year}-${String(n).padStart(4, '0')}`;
}

// Lojas ativas de um segmento, em ordem aleatória (rodízio justo entre os 3 anunciantes).
function activeStoresForSegment(db, segmentId) {
  const rows = db
    .prepare(
      `SELECT st.id, st.name, st.description, st.phone, st.whatsapp, st.email, st.website,
              st.instagram, st.city, st.state, st.address, st.color, ss.segment_id
       FROM store_segments ss JOIN stores st ON st.id = ss.store_id
       WHERE ss.segment_id = ? AND ss.status = 'active'`
    )
    .all(segmentId);
  for (let i = rows.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  return rows;
}

function isStoreActiveInSegment(db, storeId, segmentId) {
  return !!db
    .prepare("SELECT 1 FROM store_segments WHERE store_id = ? AND segment_id = ? AND status = 'active'")
    .get(storeId, segmentId);
}

function logStoreEvent(db, { storeId, segmentId = null, architectId = null, budgetId = null, type, channel = null }) {
  db.prepare(
    'INSERT INTO store_events (store_id, segment_id, architect_id, budget_id, type, channel) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(storeId, segmentId, architectId, budgetId, type, channel);
}

// ---------- Utilidades ----------

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = {
  MAX_STORES_PER_SEGMENT,
  PLAN_PRICES,
  PLAN_MONTHS,
  hashPassword,
  verifyPassword,
  createSession,
  tx,
  placeSubscription,
  promoteWaitlist,
  approveSubscription,
  deactivateSubscription,
  expireSubscriptions,
  waitlistPosition,
  activeCount,
  computeTotals,
  nextBudgetCode,
  activeStoresForSegment,
  isStoreActiveInSegment,
  logStoreEvent,
  httpError,
  round2,
};
