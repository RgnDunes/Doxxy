// src/index.js

import path from 'path';
import { collectCodebaseInChunks } from './code-collector.js';
import { buildAnalysisPrompt } from './prompt-builder.js';
import { getAiResponse } from './ai-service.js';
import { generateSite } from './site-generator.js';

export async function generateDocs(targetDir, outputDir) {
    // PASS 1: ANALYSIS & SUMMARIZATION
    console.log('🚀 Pass 1/2: Collecting and analyzing codebase in chunks...');
    // Destructure the new metrics from the function result
    const { projectName, codeChunks, totalFiles, totalLinesOfCode } = await collectCodebaseInChunks(targetDir);
    
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
    
    // Add the metrics to the final aggregated summary object
    const aggregatedSummary = { 
        projectName, 
        summaries,
        metrics: {
            totalFiles,
            totalLinesOfCode
        }
    };

    // PASS 2: SYNTHESIS & SITE GENERATION
    console.log('💬 Pass 2/2: Generating site pages from aggregated summary...');
    await generateSite(outputDir, aggregatedSummary);
    
    console.log(`\n✅ Success! Documentation site generated in '${outputDir}'.`);
    console.log(`👉 Open ${path.join(outputDir, 'index.html')} in your browser.`);
}