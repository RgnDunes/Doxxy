// src/prompt-builder.js

export const ANALYSIS_PROMPT_SCAFFOLD = `
You are a static analysis engine. Analyze the provided code chunk and respond ONLY with a single JSON object.
Do not include any text outside the JSON structure.

The JSON structure should contain these keys: "summary", "components", "apiEndpoints", "techStack".
- summary: A concise, one-paragraph summary of the purpose of the files in this chunk.
- components: An array of objects, each with "name", "file", "purpose", and an array of "props".
- apiEndpoints: An array of objects, each with "method", "path", "file", "purpose", "payloadStructure", and "responseStructure". For payload and response, provide a simplified object-like string (e.g., "{ id: string, name: string }").
- techStack: An array of strings listing technologies found (e.g., "React", "Express", "Vite").

Analyze the following code context:
--- START OF CODE CHUNK ---
{CODE_CHUNK}
--- END OF CODE CHUNK ---
`;

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
      `
      Generate a detailed architectural overview with three sections:

      1.  **File Structure Organization**: Create a section that describes the purpose of the main directories (e.g., 'src', 'components', 'pages', 'api', 'lib', 'services'). If you detect evidence of a monorepo (e.g., 'packages' or 'apps' folders), add a subsection explaining how the different packages interact.

      2.  **High-Level System Overview**: Create a detailed Mermaid 'graph TD' diagram. This diagram should be comprehensive, inspired by diagrams used to document complex web applications. Organize it into logical subgraphs representing conceptual layers like 'Frontend Components', 'State Management', 'Data & Caching', 'Network Layer', and 'Backend Services/APIs'. Map the key modules, components, and services from the project summary into their appropriate subgraphs and show the data flow between them.

      3.  **Request Lifecycle**: Create a 'sequenceDiagram' in Mermaid that illustrates a typical user request lifecycle, from the UI through to the backend and back.
      `,
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

export function buildApiSchemaPagePrompt(summary) {
    return buildPagePrompt(
      "API Schema",
      "Create a single, comprehensive HTML table for all unique API endpoints found in the summaries. Consolidate data for the same endpoint if found in multiple files. The table columns should be: Endpoint, Method, Description, Payload Structure, and Response Structure. For structure columns, use <code> tags. If a value is not found, use 'N/A'.",
      summary
    );
}

// New prompt for the Code Conventions page
export function buildConventionsPagePrompt(summary) {
    return buildPagePrompt(
        "Code Conventions & Glossary",
        `
        Generate a page with helpful information for new developers onboarding to the codebase. Include the following sections:

        1.  **High-Level Code Explanation**: Based on the project summaries, describe the common coding patterns. Explain the primary state management approach, how data fetching is handled (e.g., hooks, services), and the overall code style (e.g., functional components, async/await).

        2.  **Key Dependencies**: Create a section highlighting the most critical libraries. For each, provide a brief explanation of its role in the project.

        3.  **Testing Strategy**: If testing libraries (like Jest, Vitest, Cypress, Testing Library) are detected in the tech stack, briefly describe the project's likely testing strategy (e.g., "Unit tests for components, integration tests for user flows").

        4.  **Glossary**: Create a list of any project-specific or domain-specific terms and their meanings, inferred from file names and summaries.
        `,
        summary
    );
}