import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { loadMap, saveMap } from './jsonFileStore.js';

const STORE_FILE = 'users.json';
const users = loadMap(STORE_FILE);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function persistUsers() {
  saveMap(STORE_FILE, users);
}

function cleanText(value, maxLength) {
  return String(value ?? '').normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalizeEmail(value) {
  const email = cleanText(value, 254).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) throw new Error('A valid email is required.');
  return email;
}

function validatePassword(value) {
  const password = String(value ?? '');
  if (password.length < 10 || password.length > 128) {
    throw new Error('Password must be between 10 and 128 characters.');
  }
  return password;
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    createdAt: user.createdAt,
  };
}

export async function createUser(input = {}) {
  const normalizedEmail = normalizeEmail(input.email);
  const password = validatePassword(input.password);
  const name = cleanText(input.name || 'Creator', 80) || 'Creator';

  const existing = [...users.values()].find((user) => user.email === normalizedEmail);
  if (existing) throw new Error('User already exists.');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = {
    id: randomUUID(),
    name,
    email: normalizedEmail,
    passwordHash,
    plan: 'free',
    createdAt: new Date().toISOString(),
  };

  users.set(user.id, user);
  persistUsers();
  return sanitizeUser(user);
}

export async function verifyUser(email, password) {
  let normalizedEmail;
  try {
    normalizedEmail = normalizeEmail(email);
    validatePassword(password);
  } catch {
    return null;
  }
  const user = [...users.values()].find((item) => item.email === normalizedEmail);
  if (!user) return null;

  const valid = await bcrypt.compare(String(password), user.passwordHash);
  return valid ? sanitizeUser(user) : null;
}

export function getUserById(id) {
  return sanitizeUser(users.get(id));
}
