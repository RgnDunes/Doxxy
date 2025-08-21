// src/code-collector.js

import { globby } from 'globby';
import fs from 'fs/promises';
import path from 'path';
import { get_encoding } from '@dqbd/tiktoken';
import { ANALYSIS_PROMPT_SCAFFOLD } from './prompt-builder.js';

const enc = get_encoding("cl100k_base");

const MODEL_MAX_TOKENS = 128000;
const PROMPT_SCAFFOLD_TOKENS = enc.encode(ANALYSIS_PROMPT_SCAFFOLD).length;
const RESPONSE_BUFFER_TOKENS = 4096;
const SAFETY_BUFFER_TOKENS = 1000;
const CHUNK_TOKEN_LIMIT = MODEL_MAX_TOKENS - PROMPT_SCAFFOLD_TOKENS - RESPONSE_BUFFER_TOKENS - SAFETY_BUFFER_TOKENS;

export async function collectCodebaseInChunks(directory) {
    let projectName = path.basename(directory);
    try {
        const packageJsonContent = await fs.readFile(path.join(directory, 'package.json'), 'utf-8');
        projectName = JSON.parse(packageJsonContent).name || projectName;
    } catch (e) { /* Ignore if no package.json */ }

    const files = await globby(['**/*'], { cwd: directory, gitignore: true, dot: true, ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'] });

    const codeChunks = [];
    let currentChunk = '';
    let currentTokenCount = 0;
    let totalLinesOfCode = 0; // Initialize a line counter

    for (const file of files) {
        try {
            const content = await fs.readFile(path.join(directory, file), 'utf-8');
            totalLinesOfCode += content.split('\n').length; // Add the file's line count

            const fileBlock = `--- FILE: ${file} ---\n${content}\n\n`;
            const tokenCount = enc.encode(fileBlock).length;

            if (tokenCount > CHUNK_TOKEN_LIMIT) {
                console.warn(`⚠️  Skipping file '${file}' as its token count (${tokenCount}) exceeds the chunk limit.`);
                continue;
            }

            if (currentTokenCount > 0 && currentTokenCount + tokenCount > CHUNK_TOKEN_LIMIT) {
                codeChunks.push(currentChunk);
                currentChunk = '';
                currentTokenCount = 0;
            }
            currentChunk += fileBlock;
            currentTokenCount += tokenCount;
        } catch (error) { /* Ignore unreadable/binary files */ }
    }
    
    if (currentChunk) codeChunks.push(currentChunk);
    
    enc.free();
    console.log(`   Collected ${files.length} files into ${codeChunks.length} dynamically-sized chunks.`);
    
    // Return the new metrics along with the other data
    return { projectName, codeChunks, totalFiles: files.length, totalLinesOfCode };
}