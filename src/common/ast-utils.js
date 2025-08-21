import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default || _traverse; 

export function parseCode(code, filePath) {
  try {
    return parse(code, {
      sourceType: 'module',
      plugins: [
        'typescript', 
        'jsx',
        'decorators-legacy',  // Support for TypeScript decorators
        'classProperties',    // Support for class properties
        'objectRestSpread',   // Support for object spread
        'optionalChaining',   // Support for optional chaining (?.)
        'nullishCoalescingOperator'  // Support for nullish coalescing (??)
      ],
      errorRecovery: true,
    });
  } catch (e) {
    console.warn(`Babel parse error in ${filePath}: ${e.message}`);
    return null;
  }
}

export function isReactComponent(path) {
  const { node } = path;
  if (!node.id ||!node.id.name) return false;

  // Heuristic 1: Name starts with an uppercase letter.
  const isPascalCase = /^[A-Z]/.test(node.id.name);
  if (!isPascalCase) return false;

  let hasJsx = false;

  // Heuristic 2: Returns a JSX element.
  path.traverse({
    JSXElement(jsxPath) {
      hasJsx = true;
      jsxPath.stop(); // Found one, no need to traverse deeper
    },
    JSXFragment(jsxPath) {
      hasJsx = true;
      jsxPath.stop();
    }
  });

  return hasJsx;
}

export function extractLiteralValue(node) {
  if (!node) return null;
  
  // Handle simple string literals
  if (node.type === 'StringLiteral') {
    return node.value;
  }
  
  // Handle template literals
  if (node.type === 'TemplateLiteral') {
    if (node.quasis.length === 1) {
      // Simple template literal with no variables
      return node.quasis[0].value.cooked;
    } else if (node.quasis.length > 1) {
      // Template literal with variables - construct a pattern
      let pattern = '';
      for (let i = 0; i < node.quasis.length; i++) {
        pattern += node.quasis[i].value.cooked;
        if (i < node.expressions.length) {
          // Add a placeholder for the variable
          pattern += '{variable}';
        }
      }
      return pattern;
    }
  }
  
  return null;
}