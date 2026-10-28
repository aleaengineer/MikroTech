require('dotenv').config();

const bcrypt = require('bcryptjs');
const db = require('../src/db');

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || username.trim().length < 3 || username.trim().length > 80) {
    throw new Error('ADMIN_USERNAME wajib diisi dengan 3–80 karakter.');
  }
  if (!password || password.length < 6) {
    throw new Error('ADMIN_PASSWORD wajib diisi dan minimal 6 karakter.');
  }

  const [existing] = await db.execute(
    'SELECT id FROM admins WHERE username = ? LIMIT 1',
    [username.trim()]
  );
  if (existing.length) {
    throw new Error('Username admin sudah ada. Gunakan username lain.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.execute(
    'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
    [username.trim(), passwordHash]
  );
  console.log(`Admin "${username.trim()}" berhasil dibuat.`);
}

main()
  .catch((error) => {
    console.error(`Gagal membuat admin: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => db.end());
