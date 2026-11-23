const { openDatabase } = require('./db');
const { createApp } = require('./app');
const { seed } = require('./seed');
const { expireSubscriptions } = require('./services');

const db = openDatabase();

// Primeira execução: popula com dados de demonstração.
if (!db.prepare('SELECT COUNT(*) AS n FROM users').get().n) {
  seed(db);
  console.log('Banco vazio: dados de demonstração criados (senha 123456).');
}

// Libera vagas de assinaturas vencidas a cada hora.
setInterval(() => expireSubscriptions(db), 60 * 60 * 1000).unref();

const port = Number(process.env.PORT) || 3000;
createApp(db).listen(port, () => {
  console.log(`OrçaArq rodando em http://localhost:${port}`);
});
