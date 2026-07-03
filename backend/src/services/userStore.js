import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { loadMap, saveMap } from './jsonFileStore.js';

const STORE_FILE = 'users.json';
const users = loadMap(STORE_FILE);

function persistUsers() {
  saveMap(STORE_FILE, users);
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    createdAt: user.createdAt
  };
}

export async function createUser({ name, email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw new Error('Email and password are required.');
  }

  const existing = [...users.values()].find(user => user.email === normalizedEmail);
  if (existing) {
    throw new Error('User already exists.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = {
    id: randomUUID(),
    name: String(name || 'Creator').trim(),
    email: normalizedEmail,
    passwordHash,
    plan: 'free',
    createdAt: new Date().toISOString()
  };

  users.set(user.id, user);
  persistUsers();
  return sanitizeUser(user);
}

export async function verifyUser(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = [...users.values()].find(item => item.email === normalizedEmail);

  if (!user) return null;

  const valid = await bcrypt.compare(password || '', user.passwordHash);
  if (!valid) return null;

  return sanitizeUser(user);
}

export function getUserById(id) {
  return sanitizeUser(users.get(id));
}
