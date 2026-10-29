import {randomInt,scrypt as scryptCb} from 'node:crypto';import {promisify} from 'node:util';import {connectDB} from './config/db.js';import {User} from './models/User.js';
const scrypt=promisify(scryptCb);
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  const name = process.env.ADMIN_NAME || 'Findora Administrator';

  if (!email || !/^\S+@\S+\.\S+$/.test(email) || password.length < 12) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in your local environment first.');
  }

  await connectDB();

  const salt = randomInt(0, 0x7fffffff).toString(16) + randomInt(0, 0x7fffffff).toString(16);
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  const passwordHash = `${salt}:${hash.toString('hex')}`;

  const existing = await User.findOne({ email });
  if (existing) {
    existing.name = name;
    existing.role = 'admin';
    existing.passwordHash = passwordHash;
    existing.emailVerified = true;
    await existing.save();
    console.log(`Administrator updated: ${email}`);
  } else {
    await User.create({
      name,
      email,
      passwordHash,
      role: 'admin',
      emailVerified: true,
    });
    console.log(`Administrator created: ${email}`);
  }
  process.exit(0);
}main().catch(e=>{console.error('Admin seed failed:',e instanceof Error?e.message:'unknown error');process.exit(1)});
