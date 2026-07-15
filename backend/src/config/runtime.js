import dotenv from 'dotenv';
import { loadRuntimeConfig } from './runtimePolicy.mjs';

dotenv.config();
let cachedConfig;

export function getRuntimeConfig() {
  if (!cachedConfig) cachedConfig = loadRuntimeConfig(process.env);
  return cachedConfig;
}

export function resetRuntimeConfigForTests() {
  cachedConfig = undefined;
}
