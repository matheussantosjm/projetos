const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');

function openDatabase(dbPath = process.env.DB_PATH || path.join(DATA_DIR, 'vitrine.db')) {
  if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  if (dbPath !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS brokers (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      slug          TEXT NOT NULL UNIQUE COLLATE NOCASE,
      whatsapp      TEXT NOT NULL,
      creci         TEXT,
      city          TEXT,
      bio           TEXT,
      color         TEXT NOT NULL DEFAULT '#1f5f8b',
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      broker_id  INTEGER NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );

    -- status: ativo (aparece na vitrine), pausado (escondido), vendido / alugado (aparece com selo)
    CREATE TABLE IF NOT EXISTS listings (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      broker_id   INTEGER NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
      deal        TEXT NOT NULL CHECK (deal IN ('venda','aluguel')),
      type        TEXT NOT NULL,
      bairro      TEXT NOT NULL,
      city        TEXT,
      price       REAL NOT NULL,
      area        REAL NOT NULL DEFAULT 0,
      beds        INTEGER NOT NULL DEFAULT 0,
      suites      INTEGER NOT NULL DEFAULT 0,
      baths       INTEGER NOT NULL DEFAULT 0,
      parking     INTEGER NOT NULL DEFAULT 0,
      condo_fee   REAL NOT NULL DEFAULT 0,
      iptu        REAL NOT NULL DEFAULT 0,
      description TEXT,
      features    TEXT NOT NULL DEFAULT '[]',
      status      TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','pausado','vendido','alugado')),
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS photos (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      filename   TEXT NOT NULL,
      position   INTEGER NOT NULL DEFAULT 0
    );

    -- Interessados. kind: contato (Tenho interesse) ou visita (Quero visitar)
    CREATE TABLE IF NOT EXISTS leads (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      broker_id  INTEGER NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
      listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
      name       TEXT NOT NULL,
      phone      TEXT NOT NULL,
      kind       TEXT NOT NULL CHECK (kind IN ('contato','visita')),
      status     TEXT NOT NULL DEFAULT 'Pediu contato',
      note       TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Uma linha por abertura da vitrine (listing_id nulo) ou de um imóvel.
    CREATE TABLE IF NOT EXISTS views (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      broker_id  INTEGER NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
      listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
      visitor    TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_listings_broker ON listings(broker_id, status);
    CREATE INDEX IF NOT EXISTS idx_photos_listing ON photos(listing_id, position);
    CREATE INDEX IF NOT EXISTS idx_leads_broker ON leads(broker_id, status);
    CREATE INDEX IF NOT EXISTS idx_views_broker ON views(broker_id, created_at);
  `);
  return db;
}

module.exports = { openDatabase, DATA_DIR };
