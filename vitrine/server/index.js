const path = require('node:path');
const { openDatabase, DATA_DIR } = require('./db');
const { createApp } = require('./app');

const db = openDatabase();
const uploadsDir = process.env.UPLOADS_DIR || path.join(DATA_DIR, 'uploads');
const port = Number(process.env.PORT) || 3000;

createApp(db, { uploadsDir }).listen(port, () => {
  console.log(`Vitrine rodando em http://localhost:${port}`);
  console.log(`Painel do corretor: http://localhost:${port}/painel/`);
});
