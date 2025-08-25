// src/index.js

import path from 'path';
import { globby } from 'globby';
import { promises as fs } from 'fs';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default || _traverse;
import { collectCodebaseInChunks } from './code-collector.js';
import { buildAnalysisPrompt } from './prompt-builder.js';
import { getAiResponse } from './ai-service.js';
import { generateSite } from './site-generator.js';

function sanitizeForMermaid(str) {
    return `id_${str.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

async function generateDependencyMermaid(targetDir) {
    const files = await globby(['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'], {
        cwd: targetDir,
        gitignore: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    });

    const dependencies = {};
    const allProjectFiles = new Set(files);

    for (const file of files) {
        const filePath = path.join(targetDir, file);
        try {
            const code = await fs.readFile(filePath, 'utf-8');
            dependencies[file] = new Set(); // Use a Set to avoid duplicate edges

            const ast = parse(code, {
                sourceType: 'module',
                plugins: ['typescript', 'jsx'],
                errorRecovery: true,
            });

            traverse(ast, {
                ImportDeclaration({ node }) {
                    const importSource = node.source.value;
                    // Only process relative imports to ignore npm packages
                    if (importSource.startsWith('./') || importSource.startsWith('../')) {
                        let resolvedPath = path.relative(targetDir, path.resolve(path.dirname(filePath), importSource));
                        
                        // Attempt to resolve file extensions
                        if (!path.extname(resolvedPath)) {
                            if (allProjectFiles.has(`${resolvedPath}.js`)) resolvedPath = `${resolvedPath}.js`;
                            else if (allProjectFiles.has(`${resolvedPath}.ts`)) resolvedPath = `${resolvedPath}.ts`;
                            else if (allProjectFiles.has(`${resolvedPath}/index.js`)) resolvedPath = `${resolvedPath}/index.js`;
                        }

                        if (allProjectFiles.has(resolvedPath)) {
                            dependencies[file].add(resolvedPath);
                        }
                    }
                },
            });
        } catch (e) {
            // Silently ignore files that can't be parsed
        }
    }

    let mermaidString = 'graph TD\n';
    const definedNodes = new Set();

    for (const file in dependencies) {
        const fileId = sanitizeForMermaid(file);
        // Define the node with its ID and a user-friendly label
        if (!definedNodes.has(fileId)) {
            mermaidString += `    ${fileId}["${file}"]\n`;
            definedNodes.add(fileId);
        }
        
        if (dependencies[file].size > 0) {
            dependencies[file].forEach(dep => {
                const depId = sanitizeForMermaid(dep);
                 if (!definedNodes.has(depId)) {
                    mermaidString += `    ${depId}["${dep}"]\n`;
                    definedNodes.add(depId);
                }
                // Create the link between the sanitized IDs
                mermaidString += `    ${fileId} --> ${depId}\n`;
            });
        }
    }
    return mermaidString;
}

export async function generateDocs(targetDir, outputDir) {
    // PASS 1: ANALYSIS & SUMMARIZATION
    console.log('🚀 Pass 1/2: Collecting and analyzing codebase in chunks...');
    const { projectName, codeChunks, totalFiles, totalLinesOfCode } = await collectCodebaseInChunks(targetDir);

    const mermaidGraph = await generateDependencyMermaid(targetDir);

    const summaries = [];
    try {
        for (let i = 0; i < codeChunks.length; i++) {
            console.log(`   Analyzing chunk ${i + 1} of ${codeChunks.length}...`);
            const analysisPrompt = buildAnalysisPrompt(codeChunks[i]);
            const rawSummary = await getAiResponse(analysisPrompt, true);
            summaries.push(JSON.parse(rawSummary));
        }
    } catch (error) {
        if (error.message.includes("All API keys have been exhausted")) {
            console.warn(`\n🔔 ${error.message}`);
            console.warn(`   Proceeding to generate site with ${summaries.length} completed summaries.`);
        } else {
            throw error;
        }
    }

    if (summaries.length === 0) {
        console.error("❌ No summaries could be generated. Exiting.");
        return;
    }

    const aggregatedSummary = {
        projectName,
        summaries,
        metrics: {
            totalFiles,
            totalLinesOfCode
        },
        mermaidGraph,
    };

    // PASS 2: SYNTHESIS & SITE GENERATION
    console.log('💬 Pass 2/2: Generating site pages from aggregated summary...');
    await generateSite(outputDir, aggregatedSummary);

    console.log(`\n✅ Success! Documentation site generated in '${outputDir}'.`);
    console.log(`👉 Open ${path.join(outputDir, 'index.html')} in your browser.`);
}