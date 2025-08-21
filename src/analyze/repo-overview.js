import path from 'node:path';
import { findFiles, readJsonFile, safeReadFile } from '../common/fs-utils.js';

export async function analyzeRepoOverview(basePath) {
  const packageJsonPath = path.join(basePath, 'package.json');
  const pkg = await readJsonFile(packageJsonPath) || {};

  const lockfiles = await findFiles(basePath, ['pnpm-lock.yaml', 'yarn.lock', 'package-lock.json']);
  let packageManager = 'unknown';
  if (lockfiles.some(f => f.endsWith('pnpm-lock.yaml'))) packageManager = 'pnpm';
  else if (lockfiles.some(f => f.endsWith('yarn.lock'))) packageManager = 'yarn';
  else if (lockfiles.some(f => f.endsWith('package-lock.json'))) packageManager = 'npm';

  const monorepoFiles = await findFiles(basePath, ['pnpm-workspace.yaml', 'turbo.json', 'lerna.json']);
  const isMonorepo = monorepoFiles.length > 0 || (pkg.workspaces && pkg.workspaces.length > 0);

  const frameworkFiles = await findFiles(basePath, ['next.config.js', 'next.config.mjs', 'vite.config.js', 'vite.config.ts', 'webpack.config.js']);
  const frameworks = [];
  if (frameworkFiles.some(f => f.includes('next.config'))) frameworks.push('Next.js');
  if (frameworkFiles.some(f => f.includes('vite.config'))) frameworks.push('Vite');
  if (frameworkFiles.some(f => f.includes('webpack.config'))) frameworks.push('Webpack');

  return {
    name: pkg.name || 'N/A',
    version: pkg.version || 'N/A',
    description: pkg.description || '',
    packageManager,
    isMonorepo,
    frameworks,
    scripts: pkg.scripts || {},
    dependencies: pkg.dependencies || {},
    devDependencies: pkg.devDependencies || {},
  };
}