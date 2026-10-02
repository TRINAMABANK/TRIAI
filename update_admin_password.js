import { hashPassword } from './server/src/utils/security.js';
import db from './server/src/db/index.js';

async function updatePassword() {
  const newPass = 'Giamua@2023admin';
  const email = 'triqnnamabank@gmail.com';
  
  const hash = await hashPassword(newPass);
  const now = new Date().toISOString();
  
  await db.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?', [hash, now, email]);
  console.log(`[SUCCESS] Admin password for ${email} has been updated to: ${newPass}`);
  process.exit(0);
}

updatePassword().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
