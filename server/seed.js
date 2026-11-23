// Popula o banco com dados de demonstração.
// Uso: npm run seed   (apaga e recria data/orcaarq.db)
const fs = require('node:fs');
const path = require('node:path');
const { openDatabase } = require('./db');
const S = require('./services');

const SEGMENTS = [
  ['Marcenaria e Móveis Planejados', '🪵'],
  ['Iluminação', '💡'],
  ['Revestimentos e Pisos', '🧱'],
  ['Louças e Metais', '🚿'],
  ['Marmoraria', '🪨'],
  ['Vidraçaria e Espelhos', '🪟'],
  ['Tintas e Pintura', '🎨'],
  ['Elétrica e Automação', '🔌'],
  ['Cortinas e Persianas', '🪟'],
  ['Móveis Soltos e Decoração', '🛋️'],
  ['Ar-condicionado e Climatização', '❄️'],
  ['Paisagismo', '🌿'],
  ['Gesso e Forros', '🏗️'],
  ['Eletrodomésticos', '🍳'],
];

function seed(db) {
  const segId = {};
  for (const [name, icon] of SEGMENTS) {
    const r = db.prepare('INSERT OR IGNORE INTO segments (name, icon) VALUES (?, ?)').run(name, icon);
    segId[name] = Number(r.lastInsertRowid) || db.prepare('SELECT id FROM segments WHERE name = ?').get(name).id;
  }

  const user = (name, email, role, extra = {}) =>
    Number(
      db.prepare('INSERT INTO users (name, email, password_hash, role, phone, company, cau) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(name, email, S.hashPassword('123456'), role, extra.phone || null, extra.company || null, extra.cau || null).lastInsertRowid
    );

  user('Administrador', 'admin@orcaarq.com', 'admin');
  const arq = user('Ana Ribeiro', 'arquiteta@orcaarq.com', 'architect', { phone: '(11) 98888-1234', company: 'Ribeiro Arquitetura & Interiores', cau: 'A123456-7' });

  const colors = ['#2f6f5e', '#8a5a44', '#3b5b8c', '#7a4f8f', '#a0662b', '#2c7a7b', '#9b3d4a'];
  let ci = 0;
  const store = (name, segments, info = {}) => {
    const slug = name.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
    const uid = user(`Responsável ${name}`, `${slug}@loja.com`, 'store', { phone: info.phone });
    const sid = Number(
      db.prepare(
        'INSERT INTO stores (user_id, name, description, phone, whatsapp, email, website, instagram, address, city, state, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(uid, name, info.description || null, info.phone || '(11) 3000-0000', info.whatsapp || '5511990000000', `${slug}@loja.com`,
        `https://${slug}.com.br`, `@${slug}`, info.address || null, info.city || 'São Paulo', 'SP', colors[ci++ % colors.length]).lastInsertRowid
    );
    for (const seg of segments) {
      const sub = db.prepare("INSERT INTO store_segments (store_id, segment_id, plan) VALUES (?, ?, 'anual')").run(sid, segId[seg]);
      if (!info.pending) S.approveSubscription(db, Number(sub.lastInsertRowid));
    }
    return sid;
  };

  const madeira = store('Atelier Madeira Nobre', ['Marcenaria e Móveis Planejados'], { description: 'Planejados sob medida com MDF e lâminas naturais. Projeto executivo incluso.', phone: '(11) 3456-7890', whatsapp: '5511987654321', address: 'Rua Harmonia, 450 - Vila Madalena' });
  store('Planeja Design', ['Marcenaria e Móveis Planejados'], { description: 'Cozinhas, closets e home offices com prazo de 30 dias.', phone: '(11) 3222-1100', whatsapp: '5511912345678' });
  store('Casa do Marceneiro', ['Marcenaria e Móveis Planejados'], { description: 'Marcenaria artesanal e restauração.', phone: '(11) 3111-2233' });
  store('Marcenaria Fila de Espera', ['Marcenaria e Móveis Planejados'], { description: 'Exemplo de loja aguardando vaga.' });

  const luz = store('Lumière Iluminação', ['Iluminação', 'Elétrica e Automação'], { description: 'Projeto luminotécnico, perfis de LED e pendentes de design.', phone: '(11) 3555-4040', whatsapp: '5511955554040' });
  store('Spot Light Store', ['Iluminação'], { description: 'Spots, trilhos e fitas LED com pronta entrega.' });

  const piso = store('Portobello Revest Center', ['Revestimentos e Pisos'], { description: 'Porcelanatos grandes formatos, vinílicos e madeira.', phone: '(11) 3777-8800' });
  store('Cerâmica & Cia', ['Revestimentos e Pisos'], { description: 'Revestimentos nacionais e importados.' });
  store('Pedra Bruta Mármores', ['Marmoraria'], { description: 'Mármores, granitos e quartzitos. Bancadas e escadas.' });
  const metal = store('Banho & Metais', ['Louças e Metais'], { description: 'Louças, metais e cubas das principais marcas.' });
  store('Vidros Cristal', ['Vidraçaria e Espelhos'], { description: 'Box, espelhos e guarda-corpos.' });
  store('Tintas Coral Center', ['Tintas e Pintura'], {});
  store('Cortinas Lux', ['Cortinas e Persianas'], { description: 'Cortinas, persianas e automação.' });
  store('Verde Vivo Paisagismo', ['Paisagismo'], { pending: true, description: 'Jardins verticais e paisagismo residencial.' });

  // Clientes e orçamento de exemplo
  const c1 = Number(db.prepare('INSERT INTO clients (architect_id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)')
    .run(arq, 'Carlos e Juliana Mendes', 'carlos.mendes@email.com', '(11) 97777-0001', 'Rua das Acácias, 120 - Apto 82 - Pinheiros').lastInsertRowid);
  db.prepare('INSERT INTO clients (architect_id, name, email, phone) VALUES (?, ?, ?, ?)').run(arq, 'Mariana Costa', 'mariana@email.com', '(11) 96666-0002');

  const b = Number(db.prepare(
    `INSERT INTO budgets (architect_id, client_id, code, title, project_address, status, fee_type, fee_value, discount, validity_days, notes)
     VALUES (?, ?, ?, ?, ?, 'enviado', 'percent', 12, 500, 15, ?)`
  ).run(arq, c1, S.nextBudgetCode(db, arq), 'Reforma apartamento Pinheiros — Cozinha e Living', 'Rua das Acácias, 120 - Apto 82',
    'Valores sujeitos a confirmação após medição técnica. Prazo estimado de execução: 60 dias.').lastInsertRowid);

  const items = [
    ['Cozinha', 'Marcenaria e Móveis Planejados', madeira, 'Armários superiores e inferiores em MDF laca fosca', 'm', 6.5, 2850],
    ['Cozinha', 'Marmoraria', null, 'Bancada em quartzo branco com cuba esculpida', 'm²', 3.2, 1650],
    ['Cozinha', 'Louças e Metais', metal, 'Misturador monocomando gourmet preto fosco', 'un', 1, 1890],
    ['Cozinha', 'Revestimentos e Pisos', piso, 'Porcelanato 120x120 acetinado', 'm²', 18, 189],
    ['Living', 'Iluminação', luz, 'Perfil de LED embutido 3000K', 'm', 14, 165],
    ['Living', 'Iluminação', luz, 'Pendente de design sobre a mesa de jantar', 'un', 2, 1240],
    ['Living', 'Marcenaria e Móveis Planejados', madeira, 'Painel ripado com nicho para TV', 'm²', 7.5, 980],
    ['Living', 'Cortinas e Persianas', null, 'Cortina em linho com trilho suíço', 'm', 5.2, 420],
  ];
  items.forEach(([room, seg, storeId, desc, unit, qty, price], i) => {
    db.prepare('INSERT INTO budget_items (budget_id, room, segment_id, store_id, description, unit, quantity, unit_price, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(b, room, segId[seg], storeId, desc, unit, qty, price, i + 1);
    if (storeId) S.logStoreEvent(db, { storeId, segmentId: segId[seg], architectId: arq, budgetId: b, type: 'selected' });
  });
  S.logStoreEvent(db, { storeId: madeira, segmentId: segId['Marcenaria e Móveis Planejados'], architectId: arq, budgetId: b, type: 'contact', channel: 'whatsapp' });
}

if (require.main === module) {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'orcaarq.db');
  for (const f of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) fs.rmSync(f, { force: true });
  const db = openDatabase(dbPath);
  seed(db);
  console.log('Banco populado em', dbPath);
  console.log('Logins (senha 123456): admin@orcaarq.com | arquiteta@orcaarq.com | ateliermadeiranobre@loja.com');
}

module.exports = { seed };
