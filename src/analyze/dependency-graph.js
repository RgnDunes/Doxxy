import path from 'node:path';
import { findFiles, safeReadFile } from '../common/fs-utils.js';
import { parseCode } from '../common/ast-utils.js';
import _traverse from '@babel/traverse';
const traverse = _traverse.default || _traverse;

export async function analyzeDependencyGraph(basePath) {
  const files = await findFiles(basePath, ['**/*.{js,jsx,ts,tsx}']);
  const graph = {};
  const absoluteToRelative = (absPath) => path.relative(basePath, absPath).replace(/\\/g, '/');

  for (const file of files) {
    const relativePath = absoluteToRelative(file);
    const content = await safeReadFile(file);
    if (!content) continue;

    const ast = parseCode(content, file);
    if (!ast) continue;

    graph[relativePath] = [];

    traverse(ast, {
      ImportDeclaration(astPath) {
        const source = astPath.node.source.value;
        if (source.startsWith('.')) { // Only track relative imports
          try {
            const resolvedPath = path.resolve(path.dirname(file), source);
            const resolvedRelative = findModule(resolvedPath, files, basePath);
            if (resolvedRelative) {
              graph[relativePath].push(resolvedRelative);
            }
          } catch (e) {
            // Ignore resolution errors
          }
        }
      },
      CallExpression(astPath) {
        if (astPath.node.callee.name === 'require' && astPath.node.arguments.length > 0 && astPath.node.arguments.type === 'StringLiteral') {
            const source = astPath.node.arguments.value;
            if (source.startsWith('.')) {
                try {
                    const resolvedPath = path.resolve(path.dirname(file), source);
                    const resolvedRelative = findModule(resolvedPath, files, basePath);
                    if (resolvedRelative) {
                        graph[relativePath].push(resolvedRelative);
                    }
                } catch(e) {
                    // ignore
                }
            }
        }
      }
    });
  }

  return { moduleGraph: graph };
}

function findModule(resolvedPath, allFiles, basePath) {
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx', '/index.ts', '/index.tsx'];
    const candidates = [resolvedPath,...extensions.map(ext => resolvedPath + ext)];
    
    for (const candidate of candidates) {
        const found = allFiles.find(f => f === candidate);
        if (found) {
            return path.relative(basePath, found).replace(/\\/g, '/');
        }
    }
    return null;
}