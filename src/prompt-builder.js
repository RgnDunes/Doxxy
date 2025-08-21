// src/prompt-builder.js

// The static text of the analysis prompt, exported for token counting.
export const ANALYSIS_PROMPT_SCAFFOLD = `
You are a high-speed static analysis engine. Your task is to analyze a chunk of source code and extract key structural information.
Respond ONLY with a single JSON object. Do not include any markdown formatting, comments, or explanatory text outside of the JSON structure.

The JSON structure should contain these keys: "summary", "components", "apiEndpoints", "techStack".
- summary: A concise, one-paragraph summary of the purpose of the files in this chunk.
- components: An array of objects, each with "name", "file", "purpose", and an array of "props".
- apiEndpoints: An array of objects, each with "method", "path", "file", and "purpose".
- techStack: An array of strings listing technologies found (e.g., "React", "Express", "Vite").

Analyze the following code context:
--- START OF CODE CHUNK ---
{CODE_CHUNK}
--- END OF CODE CHUNK ---
`;

// This function now uses the scaffold to build the final prompt.
export function buildAnalysisPrompt(chunk) {
  return ANALYSIS_PROMPT_SCAFFOLD.replace('{CODE_CHUNK}', chunk);
}

// A helper to create prompts for generating page content
function buildPagePrompt(pageTitle, instructions, summary) {
  return `
You are Codebase Cartographer, an expert technical writer.
Your goal is to generate the HTML content for a specific page of a documentation website.
Use the provided JSON summary of the entire codebase as your source of truth.
Respond ONLY with the raw HTML for the page's main content. Do not include <html>, <head>, or <body> tags.
Use tables, lists, and Mermaid diagrams where appropriate for clarity.

**Project Summary Context:**
\`\`\`json
${JSON.stringify(summary, null, 2)}
\`\`\`

---

**Your Task:**
Generate the HTML content for the **"${pageTitle}"** page.
**Instructions:** ${instructions}
`;
}

export function buildIndexPagePrompt(summary) {
  return buildPagePrompt(
    "Project Overview",
    "Create a project overview covering the repository fingerprint (framework, package manager, etc.), key stats (LOC, file count), and a detailed tech stack breakdown based on the summaries.",
    summary
  );
}

export function buildArchitecturePagePrompt(summary) {
  return buildPagePrompt(
    "Architecture",
    "Provide a high-level architectural overview. Create two Mermaid diagrams in <pre class='mermaid'> tags: 1. A 'graph TD' showing system/data flow between modules. 2. A 'sequenceDiagram' showing a typical request lifecycle (e.g., UI -> State -> API -> Backend).",
    summary
  );
}

export function buildGettingStartedPagePrompt(summary) {
    return buildPagePrompt(
      "Getting Started",
      "Generate a step-by-step guide for new developers. Include sections for Prerequisites, Installation, Environment Setup (mention .env files), and how to run common commands (dev, build, test, lint).",
      summary
    );
}