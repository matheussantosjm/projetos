const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

// Máximo de lojas ativas (anunciantes) por segmento.
const MAX_STORES_PER_SEGMENT = 3;

function openDatabase(dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'orcaarq.db')) {
  if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');
  migrate(db);
  return db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL CHECK (role IN ('architect','store','admin')),
      phone         TEXT,
      company       TEXT,
      cau           TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS segments (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      name   TEXT NOT NULL UNIQUE,
      icon   TEXT NOT NULL DEFAULT '📦',
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS stores (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      cnpj        TEXT,
      description TEXT,
      phone       TEXT,
      whatsapp    TEXT,
      email       TEXT,
      website     TEXT,
      instagram   TEXT,
      address     TEXT,
      city        TEXT,
      state       TEXT,
      color       TEXT NOT NULL DEFAULT '#2f6f5e',
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Assinatura de uma loja em um segmento (vaga de anunciante).
    -- status: pending (aguardando aprovação), active (ocupa vaga),
    --         waitlist (aprovada, aguardando vaga), inactive (cancelada/expirada)
    CREATE TABLE IF NOT EXISTS store_segments (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id     INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      segment_id   INTEGER NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
      status       TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','active','waitlist','inactive')),
      plan         TEXT NOT NULL DEFAULT 'mensal' CHECK (plan IN ('mensal','trimestral','anual')),
      requested_at TEXT NOT NULL DEFAULT (datetime('now')),
      activated_at TEXT,
      expires_at   TEXT,
      UNIQUE (store_id, segment_id)
    );

    CREATE TABLE IF NOT EXISTS clients (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      architect_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name         TEXT NOT NULL,
      email        TEXT,
      phone        TEXT,
      document     TEXT,
      address      TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      architect_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      client_id       INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      code            TEXT NOT NULL,
      title           TEXT NOT NULL,
      project_address TEXT,
      status          TEXT NOT NULL DEFAULT 'rascunho'
                      CHECK (status IN ('rascunho','enviado','aprovado','recusado')),
      fee_type        TEXT NOT NULL DEFAULT 'percent' CHECK (fee_type IN ('percent','fixed')),
      fee_value       REAL NOT NULL DEFAULT 0,
      discount        REAL NOT NULL DEFAULT 0,
      validity_days   INTEGER NOT NULL DEFAULT 15,
      notes           TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS budget_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      budget_id   INTEGER NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
      room        TEXT NOT NULL DEFAULT 'Geral',
      segment_id  INTEGER REFERENCES segments(id) ON DELETE SET NULL,
      store_id    INTEGER REFERENCES stores(id) ON DELETE SET NULL,
      description TEXT NOT NULL,
      unit        TEXT NOT NULL DEFAULT 'un',
      quantity    REAL NOT NULL DEFAULT 1,
      unit_price  REAL NOT NULL DEFAULT 0,
      position    INTEGER NOT NULL DEFAULT 0
    );

    -- Métricas para o lojista: exibições, cliques em contato e seleção em orçamentos.
    CREATE TABLE IF NOT EXISTS store_events (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id     INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      segment_id   INTEGER REFERENCES segments(id) ON DELETE SET NULL,
      architect_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      budget_id    INTEGER REFERENCES budgets(id) ON DELETE SET NULL,
      type         TEXT NOT NULL CHECK (type IN ('impression','contact','selected')),
      channel      TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_store_segments_seg ON store_segments(segment_id, status);
    CREATE INDEX IF NOT EXISTS idx_budget_items_budget ON budget_items(budget_id);
    CREATE INDEX IF NOT EXISTS idx_events_store ON store_events(store_id, type);
  `);
}

module.exports = { openDatabase, MAX_STORES_PER_SEGMENT };
