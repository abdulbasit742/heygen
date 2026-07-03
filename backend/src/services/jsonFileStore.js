import fs from 'fs';
import path from 'path';

function dataDir() {
  return path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));
}

function filePath(name) {
  return path.join(dataDir(), name);
}

export function readJson(name, fallback) {
  const target = filePath(name);
  try {
    if (!fs.existsSync(target)) return fallback;
    return JSON.parse(fs.readFileSync(target, 'utf8'));
  } catch {
    return fallback;
  }
}

export function writeJson(name, data) {
  const target = filePath(name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temp = `${target}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`);
  fs.renameSync(temp, target);
  return data;
}

export function loadMap(name, key = 'id') {
  const records = readJson(name, []);
  return new Map(records.map(record => [record[key], record]));
}

export function saveMap(name, map) {
  writeJson(name, [...map.values()]);
}
