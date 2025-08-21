import path from 'node:path';
import { findFiles, safeReadFile } from '../common/fs-utils.js';
import { parseCode, isReactComponent } from '../common/ast-utils.js';
import _traverse from '@babel/traverse';
const traverse = _traverse.default || _traverse;

export async function analyzeReactComponents(basePath) {
  const files = await findFiles(basePath, ['**/*.{jsx,tsx}']);
  const componentMap = {};
  let totalComponents = 0;

  for (const file of files) {
    const content = await safeReadFile(file);
    if (!content) continue;

    const ast = parseCode(content, file);
    if (!ast) continue;

    const relativePath = path.relative(basePath, file);
    const folder = path.dirname(relativePath);

    if (!componentMap[folder]) {
      componentMap[folder] = { count: 0, components: []};
    }

    const visitor = {
      FunctionDeclaration(astPath) {
        if (isReactComponent(astPath)) {
          totalComponents++;
          componentMap[folder].count++;
          const componentInfo = {
            name: astPath.node.id.name,
            file: relativePath,
            line: astPath.node.loc.start.line,
            props: [],
            imports: [],
          };
          
          // Basic prop detection from destructuring
          const params = astPath.get('params.0');
          if (params && params.isObjectPattern()) {
            params.get('properties').forEach(prop => {
              if (prop.isObjectProperty()) {
                componentInfo.props.push(prop.get('key').node.name);
              }
            });
          }
          
          componentMap[folder].components.push(componentInfo);
        }
      },
      VariableDeclarator(astPath) {
        if (astPath.get('init').isArrowFunctionExpression() && isReactComponent(astPath)) {
            totalComponents++;
            componentMap[folder].count++;
            const componentInfo = {
                name: astPath.node.id.name,
                file: relativePath,
                line: astPath.node.loc.start.line,
                props: [],
                imports: [],
            };
            componentMap[folder].components.push(componentInfo);
        }
      }
    };

    traverse(ast, visitor);
  }

  // Second pass for imports after all components are identified
  for (const folder in componentMap) {
      for (const component of componentMap[folder].components) {
          const content = await safeReadFile(path.join(basePath, component.file));
          const ast = parseCode(content, component.file);
          if (!ast) continue;

          traverse(ast, {
              ImportDeclaration(astPath) {
                  astPath.node.specifiers.forEach(specifier => {
                      if (specifier.type === 'ImportSpecifier' || specifier.type === 'ImportDefaultSpecifier') {
                          component.imports.push(specifier.local.name);
                      }
                  });
              }
          });
      }
  }

  return {
    total: totalComponents,
    byFolder: componentMap,
  };
}