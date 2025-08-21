import path from 'node:path';
import { findFiles, safeReadFile } from '../common/fs-utils.js';
import { parseCode, extractLiteralValue } from '../common/ast-utils.js';
import _traverse from '@babel/traverse';
const traverse = _traverse.default || _traverse;

export async function analyzeApiSurface(basePath, llmClient) {
  const files = await findFiles(basePath, ['**/*.{js,jsx,ts,tsx}']);
  const endpoints = [];

  for (const file of files) {
    const content = await safeReadFile(file);
    if (!content) continue;

    const ast = parseCode(content, file);
    if (!ast) continue;

    const relativePath = path.relative(basePath, file);

    // Next.js App Router API Routes
    if (relativePath.match(/app[\\/]api[\\/].*?route\.(js|ts)x?$/)) {
      traverse(ast, {
        ExportNamedDeclaration(astPath) {
          const declaration = astPath.get('declaration');
          if (declaration.isFunctionDeclaration()) {
            const methodName = declaration.node.id.name.toUpperCase();
            if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'USE', 'ALL'].includes(methodName)) {
              endpoints.push(createEndpoint(
                'next_api',
                methodName,
                `/${path.dirname(relativePath).replace(/\\/g, '/')}`,
                relativePath,
                astPath.node.loc.start.line
              ));
            }
          }
        },
      });
    }

    // Next.js Pages Router API Routes
    if (relativePath.match(/pages[\\/]api[\\/].*\.(js|ts)x?$/)) {
        endpoints.push(createEndpoint(
            'next_api',
            'MANY',
            `/api/${path.basename(relativePath).split('.')}`,
            relativePath,
            1
        ));
    }

    // Generic client-side calls and server definitions
    traverse(ast, {
      CallExpression(astPath) {
        const callee = astPath.get('callee');

        // Client-side: fetch('...')
        if (callee.isIdentifier({ name: 'fetch' })) {
          const url = extractLiteralValue(astPath.node.arguments);
          const options = astPath.node.arguments[1];
          let method = 'GET';
          if (options && options.type === 'ObjectExpression') {
            const methodProp = options.properties.find(p => p?.key?.name === 'method');
            if (methodProp) {
              method = extractLiteralValue(methodProp.value) || 'UNKNOWN';
            }
          }
          if (url) {
            endpoints.push(createEndpoint('client_call', method.toUpperCase(), url, relativePath, astPath.node.loc.start.line));
          }
        }

        // Client-side: axios.get('...'), axios.post('...')
        if (callee.isMemberExpression() && callee.get('object').isIdentifier({ name: 'axios' })) {
          const method = callee.get('property').node.name.toUpperCase();
          const url = extractLiteralValue(astPath.node.arguments);
          if (url) {
            endpoints.push(createEndpoint('client_call', method, url, relativePath, astPath.node.loc.start.line));
          }
        }

        // Server-side: app.get('/path',...)
        if (callee.isMemberExpression() && ['get', 'post', 'put', 'delete', 'patch', 'use', 'all'].includes(callee.get('property').node.name)) {
            const objectName = callee.get('object').node.name;
            if (objectName === 'app' || objectName === 'router') {
                const routePath = extractLiteralValue(astPath.node.arguments);
                if (routePath) {
                    endpoints.push(createEndpoint(
                        'express',
                        callee.get('property').node.name.toUpperCase(),
                        routePath,
                        relativePath,
                        astPath.node.loc.start.line
                    ));
                }
            }
        }
      },
    });
  }

  if (llmClient) {
    console.log('✨ Enriching API descriptions with LLM...');
    for (const endpoint of endpoints) {
      endpoint.description = await getLlmDescription(llmClient, endpoint);
    }
  }

  const openapi = generateOpenApi(endpoints);
  return { apiEndpoints: endpoints, openapi };
}

function createEndpoint(sourceType, method, pathOrUrl, file, line) {
  return {
    sourceType,
    method,
    pathOrUrl,
    file,
    line,
    module: path.dirname(file),
    belongsTo: path.dirname(file).split(path.sep) || 'root',
    description: '',
    requestShape: 'unknown',
    responseShape: 'unknown',
  };
}

function generateOpenApi(endpoints) {
  const openapi = {
    openapi: '3.0.0',
    info: {
      title: 'API Specification (Auto-generated)',
      version: '1.0.0',
    },
    paths: {},
  };

  endpoints.filter(e => e.sourceType!== 'client_call').forEach(ep => {
    const path = ep.pathOrUrl.replace(/:(\w+)/g, '{$1}');
    if (!openapi.paths[path]) {
      openapi.paths[path] = {};
    }
    const method = ep.method.toLowerCase();
    if (method!== 'many' && method!== 'unknown') {
        openapi.paths[path][method] = {
            summary: `Endpoint defined in ${ep.file}`,
            description: ep.description || `Located at line ${ep.line}`,
            responses: {
                '200': { description: 'Successful response' },
            },
        };
    }
  });

  return openapi;
}

async function getLlmDescription(client, endpoint) {
    const prompt = `
        Based on the following information about an API endpoint, provide a concise, one-sentence description of its likely purpose.
        
        File Path: ${endpoint.file}
        Line Number: ${endpoint.line}
        HTTP Method: ${endpoint.method}
        Path/URL: ${endpoint.pathOrUrl}
        Source Type: ${endpoint.sourceType}

        Example description: "Handles user authentication by verifying credentials."
        
        Description:`;

    try {
        const msg = await client.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 100,
            messages: [{ role: "user", content: prompt }],
        });
        return msg.content.text.trim();
    } catch (error) {
        console.warn(`LLM enrichment failed for ${endpoint.pathOrUrl}: ${error.message}`);
        return 'LLM enrichment failed.';
    }
}