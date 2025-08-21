import path from 'node:path';
import { findFiles, readJsonFile, safeReadFile } from '../common/fs-utils.js';

export async function analyzeGettingStarted(basePath) {
  const packageJsonPath = path.join(basePath, 'package.json');
  const pkg = await readJsonFile(packageJsonPath) || {};
  const scripts = pkg.scripts || {};

  const commonScripts = {
    dev: findKey(scripts, ['dev', 'start', 'serve']),
    build: findKey(scripts, ['build']),
    test: findKey(scripts, ['test', 'test:ci', 'test:e2e']),
    lint: findKey(scripts, ['lint']),
    format: findKey(scripts, ['format', 'prettier']),
  };

  const envFiles = await findFiles(basePath, ['.env*']);
  const envVars = new Set();

  for (const file of envFiles) {
    const content = await safeReadFile(file);
    if (content) {
      const lines = content.split('\n');
      lines.forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=/);
        if (match && match) {
          envVars.add(match);
        }
      });
    }
  }

  return {
    scripts: commonScripts,
    envFiles: envFiles.map(f => ({ name: path.basename(f), path: path.relative(basePath, f) })),
    detectedEnvVars: Array.from(envVars),
  };
}

function findKey(obj, keys) {
  for (const key of keys) {
    if (obj[key]) {
      return { command: key, script: obj[key] };
    }
  }
  return null;
}