/**
 * Interactive development launcher for CareerMate AI API.
 * Shows environment config and prompts before starting the server with nodemon.
 */
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const port     = process.env.PORT            || '8000';
const mongoUri = process.env.MONGODB_URI     || '';
const mongoDb  = process.env.MONGODB_DB      || 'careermate';
const origin   = process.env.FRONTEND_URL    || 'http://localhost:3000';
const hasApiKey = Boolean(process.env.GEMINI_API_KEY);
const mongoMasked = mongoUri ? mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : '✗ NOT SET';

console.log('');
console.log('  ╔══════════════════════════════════════╗');
console.log('  ║       CareerMate AI  — Backend       ║');
console.log('  ╚══════════════════════════════════════╝');
console.log('');
console.log('  Configuration');
console.log('  ───────────────────────────────────────');
console.log(`  Port          : ${port}`);
console.log(`  MongoDB URI   : ${mongoMasked}`);
console.log(`  MongoDB DB    : ${mongoDb}`);
console.log(`  CORS origin   : ${origin}`);
console.log(`  Gemini key    : ${hasApiKey ? '✓ set' : '✗ NOT SET — AI chat disabled'}`);
console.log(`  Node env      : ${process.env.NODE_ENV || 'development'}`);
console.log('  ───────────────────────────────────────');
console.log('');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('  Start dev server? [Y/n] ', (answer) => {
  rl.close();
  const yes = answer.trim() === '' || /^y(es)?$/i.test(answer.trim());

  if (!yes) {
    console.log('\n  Cancelled.\n');
    process.exit(0);
  }

  console.log('');

  // Resolve nodemon bin from local node_modules
  const nodemonBin = path.resolve(__dirname, '../node_modules/.bin/nodemon');
  const serverFile = path.resolve(__dirname, 'server.js');

  const child = spawn(
    process.platform === 'win32' ? `"${nodemonBin}"` : nodemonBin,
    [serverFile],
    {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' },
    }
  );

  child.on('error', (err) => {
    console.error('  Failed to start server:', err.message);
    process.exit(1);
  });

  child.on('exit', (code) => process.exit(code ?? 0));

  // Forward signals so Ctrl+C works cleanly
  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
});
