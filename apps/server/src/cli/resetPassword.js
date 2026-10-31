import { resetPassword } from '../accounts.js';
import { defaultDatabasePath, openDatabase } from '../db/database.js';

const email = process.argv[2];
if (!email) {
  console.error('Usage: npm run user:reset-password -- <email>');
  process.exit(1);
}

const db = openDatabase(defaultDatabasePath());
try {
  const temporary = await resetPassword(db, email);
  if (!temporary) {
    console.error('No account with that email.');
    process.exit(1);
  }
  console.log(`Temporary password for ${email}: ${temporary}`);
  console.log('All sessions were signed out. The user must choose a new password at next login.');
} finally {
  db.close();
}
