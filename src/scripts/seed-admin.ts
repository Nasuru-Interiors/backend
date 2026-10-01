import bcrypt from 'bcryptjs';
import { sql } from '../lib/db';

async function main() {
  const args = process.argv.slice(2);
  const email = args[0] || 'admin@nasuru.com';
  const password = args[1] || 'VerySecurePassword123!)(*';

  console.log(`Seeding admin user in Neon Database...`);
  console.log(`Email: ${email}`);

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const rows = await sql`
    INSERT INTO public.profiles (email, password_hash, role)
    VALUES (${email}, ${passwordHash}, 'admin')
    ON CONFLICT (email) DO UPDATE
    SET password_hash = ${passwordHash}, role = 'admin'
    RETURNING id, email, role, created_at;
  `;

  console.log('✅ Admin account seeded successfully:', rows[0]);
}

main().catch((err) => {
  console.error('❌ Failed to seed admin account:', err);
  process.exit(1);
});
