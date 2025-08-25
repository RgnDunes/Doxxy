// src/analyze/index.js

import { getAiResponse } from '../ai-service.js';
import { collectCodebaseInChunks } from '../code-collector.js';
import { buildAnalysisPrompt } from '../prompt-builder.js';

/**
 * Analyzes a code snippet and generates documentation using a specified AI model.
 * @param {object} params
 * @param {string} params.code - The source code to document.
 * @param {string} params.model - The AI model to use (e.g., 'gpt-4o' or 'claude-3-sonnet-20240229').
 * @returns {Promise<string>} The generated documentation in Markdown format.
 */
export async function analyzeAndDocument({ code, model }) {
  const systemPrompt = `
    You are an expert technical writer. Your task is to generate clear, concise, and accurate documentation
    for the provided code snippet. The output should be in Markdown format.
    Focus on explaining the purpose, parameters, and return values of functions or components.
  `;

  const prompt = `${systemPrompt}\n\nPlease generate detailed documentation for the following code for someone who is just getting onboarded to the project:\n---\n${code}\n---`;

  const documentation = await getAiResponse(prompt);
  return documentation;
}

/**
 * Analyzes a codebase directory and returns structured analysis data.
 * @param {string} codebasePath - The path to the codebase directory.
 * @param {object} llmClient - The LLM client (unused in current implementation).
 * @returns {Promise<object>} The analysis result with structured data.
 */
export async function analyzeCodebase(codebasePath, llmClient) {
  console.log('🚀 Analyzing codebase in chunks...');
  
  // Use the existing collection and analysis pipeline
  const { projectName, codeChunks, totalFiles, totalLinesOfCode } = await collectCodebaseInChunks(codebasePath);
  
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
      console.warn(`   Proceeding with ${summaries.length} completed summaries.`);
    } else {
      throw error;
    }
  }
  
  if (summaries.length === 0) {
    throw new Error("No summaries could be generated.");
  }
  
  // Return structured analysis result
  return {
    projectName,
    summaries,
    metrics: {
      totalFiles,
      totalLinesOfCode
    }
  };
}