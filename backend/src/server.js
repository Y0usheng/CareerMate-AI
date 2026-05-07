const app = require('./app');
const config = require('./config');
const { connect } = require('./database');

const port = config.port;
const host = '0.0.0.0';

async function main() {
  try {
    await connect();
    console.log(`  MongoDB     : connected → ${config.mongodbDb}`);
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  app.listen(port, host, () => {
    const env = process.env.NODE_ENV || 'development';
    console.log('');
    console.log('  CareerMate AI API');
    console.log('  ─────────────────────────────────────');
    console.log(`  Environment : ${env}`);
    console.log(`  Listening   : http://localhost:${port}`);
    console.log(`  Health      : http://localhost:${port}/health`);
    console.log(`  API Base    : http://localhost:${port}/api`);
    console.log('  ─────────────────────────────────────');
    console.log('  Press Ctrl+C to stop');
    console.log('');
  });
}

main();
