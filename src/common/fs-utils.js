import { globby } from 'globby';
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

export const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/coverage/**',
  '**/doxxy/**',
];

export async function findFiles(basePath, patterns) {
  const files = await globby(patterns, {
    cwd: basePath,
    ignore: IGNORE_PATTERNS,
    absolute: true,
    dot: true,
    gitignore: true,
  });
  return files;
}

export async function readJsonFile(filePath) {
  try {
    if (existsSync(filePath)) {
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    // Gracefully handle non-JSON or corrupted files
    console.warn(`Could not read or parse JSON file: ${filePath}`);
  }
  return null;
}

export async function safeReadFile(filePath) {
  try {
    if (existsSync(filePath)) {
      return await readFile(filePath, 'utf-8');
    }
  } catch (error) {
    console.warn(`Could not read file: ${filePath}`);
  }
  return null;
}

export async function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

export async function writeJson(filePath, data) {
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function copyFile(source, destination) {
    await cp(source, destination, { recursive: true });
}