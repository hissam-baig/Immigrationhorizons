// Optional helper: generates a bcrypt hash of a password so you can set
// ADMIN_PASSWORD_HASH in .env instead of keeping a plain-text password there.
//
// Usage:  node scripts/createAdmin.js "your-new-password"
const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.log('Usage: node scripts/createAdmin.js "your-new-password"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('\nAdd this line to your .env file, then remove ADMIN_PASSWORD:\n');
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
