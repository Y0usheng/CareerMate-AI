/**
 * Dev-only mailer: logs reset codes to the server console instead of
 * sending real email. Swap this out for nodemailer/Resend when needed.
 */
async function sendResetCodeEmail(email, code) {
  console.log('');
  console.log('  ┌─────────────────────────────────────────┐');
  console.log('  │  Password reset code (dev — no email)   │');
  console.log('  ├─────────────────────────────────────────┤');
  console.log(`  │  To   : ${email.padEnd(32)}│`);
  console.log(`  │  Code : ${code.padEnd(32)}│`);
  console.log('  └─────────────────────────────────────────┘');
  console.log('');
  return { delivered: false, dev: true };
}

module.exports = { sendResetCodeEmail };
