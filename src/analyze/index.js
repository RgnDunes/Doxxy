// src/analyze/index.js

import { getAiCompletion } from '../lib/ai.js';

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

  const prompt = `
    Please generate detailed documentation for the following code for someone who is just getting onboarded to the project:
    ---
    ${code}
    ---
  `;

  const documentation = await getAiCompletion({
    model,
    prompt,
    systemPrompt,
  });

  return documentation;
}