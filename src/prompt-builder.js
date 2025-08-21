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
      1.  **File Structure Organization**: Describe the purpose of the main directories. If you detect a monorepo, add a subsection explaining how the packages interact.
      2.  **High-Level System Overview**: Create a detailed Mermaid 'graph TD' diagram showing the system's conceptual layers (e.g., 'Frontend', 'State Management', 'Backend Services') and the data flow between them.
      3.  **Request Lifecycle**: Create a 'sequenceDiagram' in Mermaid that illustrates a typical user request lifecycle.
      `,
      summary
    );
}

export function buildGettingStartedPagePrompt(summary) {
    return buildPagePrompt(
      "Getting Started",
      "Generate a step-by-step guide for new developers. Include sections for Prerequisites, Installation, Environment Setup, and how to run common commands (dev, build, test, lint).",
      summary
    );
}

export function buildApiSchemaPagePrompt(summary) {
    return buildPagePrompt(
      "API Schema",
      "Create a single, comprehensive HTML table for all unique API endpoints. The table columns should be: Endpoint, Method, Description, Payload Structure, and Response Structure. Use <code> tags for structures.",
      summary
    );
}

// ENHANCED prompt for the Conventions page
export function buildConventionsPagePrompt(summary) {
    return buildPagePrompt(
        "Development & Conventions",
        `
        Generate a page with helpful information for new developers. Include the following sections:
        1.  **Development Workflow**: Describe the typical developer workflow from getting a ticket to merging a pull request. Mention quality assurance steps like linting and code reviews.
        2.  **High-Level Code Explanation**: Describe common coding patterns, the primary state management approach, and how data fetching is handled.
        3.  **Key Dependencies**: Highlight the most critical libraries and briefly explain their role in the project.
        4.  **Glossary**: Create a list of any project-specific or domain-specific terms and their meanings.
        `,
        summary
    );
}

// NEW prompt for the Build & Deployment page
export function buildBuildPagePrompt(summary) {
    return buildPagePrompt(
        "Build & Deployment",
        `
        Generate a detailed overview of the project's operational aspects. Include the following sections:
        1.  **Build System & Dependency Management**: Analyze 'package.json' to describe the build system and how dependencies are managed (e.g., npm, yarn, pnpm). List key build tools (e.g., Vite, Webpack).
        2.  **CI/CD Pipeline**: Look for CI/CD configuration files (e.g., in '.github/workflows'). If found, describe the pipeline architecture and create a Mermaid 'graph TD' diagram of the workflow stages (e.g., Push -> Lint -> Test -> Build -> Deploy). If not found, state that the pipeline could not be inferred.
        3.  **Testing Strategy**: Based on testing libraries found, describe the project's testing strategy (Unit, Integration, E2E) and how test scripts in 'package.json' are used.
        4.  **Release Process**: Describe the likely release process. Is it manual or automated via the CI/CD pipeline? Is there a versioning script?
        5.  **Bundle Size & Performance**: Mention any tools or scripts found for bundle size analysis or performance monitoring.
        `,
        summary
    );
}