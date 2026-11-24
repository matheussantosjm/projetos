// Cria um corretor de demonstração (demo@vitrine.com / 123456) com alguns imóveis sem foto.
const { openDatabase } = require('./db');
const { hashPassword } = require('./app');

const db = openDatabase();
if (db.prepare("SELECT 1 FROM brokers WHERE email = 'demo@vitrine.com'").get()) {
  console.log('A conta de demonstração já existe: demo@vitrine.com / 123456');
  process.exit(0);
}
const b = db.prepare(
  'INSERT INTO brokers (name, email, password_hash, slug, whatsapp, creci, city, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
).run('Rafael Moura', 'demo@vitrine.com', hashPassword('123456'), 'rafael-moura', '(19) 99999-0000', '00000-F', 'Campinas - SP',
  'Corretor há 8 anos em Campinas. Atendo compra e aluguel, com visita no horário que for melhor para você.').lastInsertRowid;
const add = db.prepare(
  `INSERT INTO listings (broker_id, deal, type, bairro, city, price, area, beds, suites, baths, parking, condo_fee, iptu, description, features)
   VALUES (?, ?, ?, ?, 'Campinas', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
[
  ['venda', 'Apartamento', 'Cambuí', 780000, 98, 3, 1, 2, 2, 1150, 210, 'Apartamento reformado, varanda gourmet e sol da manhã.', ['Varanda gourmet', 'Piscina', 'Academia']],
  ['venda', 'Casa em condomínio', 'Barão Geraldo', 1450000, 260, 4, 2, 4, 4, 890, 420, 'Casa térrea com quintal grande, perto da Unicamp.', ['Piscina', 'Churrasqueira', 'Quintal']],
  ['aluguel', 'Apartamento', 'Taquaral', 2800, 64, 2, 1, 2, 1, 620, 95, 'Pertinho da Lagoa do Taquaral, com armários.', ['Armários', 'Elevador']],
  ['aluguel', 'Studio', 'Centro', 1700, 32, 1, 0, 1, 0, 380, 40, 'Studio mobiliado, pronto para morar.', ['Mobiliado']],
].forEach(([deal, type, bairro, price, area, beds, suites, baths, parking, cond, iptu, desc, feats]) =>
  add.run(b, deal, type, bairro, price, area, beds, suites, baths, parking, cond, iptu, desc, JSON.stringify(feats)));
console.log('Conta de demonstração criada: demo@vitrine.com / 123456  ->  /rafael-moura');
