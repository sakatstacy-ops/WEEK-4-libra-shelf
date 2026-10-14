require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');

const port = Number(process.env.PORT) || 3000;

async function start() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Set MONGODB_URI in your .env file before starting the API.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(port, () => {
    console.log(`Library catalog API listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error(`API startup failed: ${error.message}`);
  process.exitCode = 1;
});