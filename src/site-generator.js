// src/site-generator.js

import fs from 'fs/promises';
import path from 'path';
import { getAiResponse } from './ai-service.js';
import * as prompts from './prompt-builder.js';
import { getCss } from './templates/css.js';
import { getJs } from './templates/js.js';

// Add the new page to the site structure
const siteStructure = [
    {
        fileName: "index.html",
        title: "Project Overview",
        prompt: prompts.buildIndexPagePrompt,
    },
    {
        fileName: "architecture.html",
        title: "Architecture",
        prompt: prompts.buildArchitecturePagePrompt,
    },
    {
        fileName: "getting-started.html",
        title: "Getting Started",
        prompt: prompts.buildGettingStartedPagePrompt,
    },
    {
        fileName: "api-schema.html",
        title: "API Schema",
        prompt: prompts.buildApiSchemaPagePrompt,
    },
];

function getHtmlShell(title, content, projectName) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale-1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="assets/style.css">
</head>
<body>
    <div class="container">
        <aside class="sidebar">
            <div class="sidebar-header">
                <span class="main-title">Doxxy</span>
                <span class="sub-title">${projectName}</span>
            </div>
            <nav>
                <ul>
                    <li><a href="index.html">Overview</a></li>
                    <li><a href="architecture.html">Architecture</a></li>
                    <li><a href="getting-started.html">Getting Started</a></li>
                    <li><a href="api-schema.html">API Schema</a></li>
                </ul>
            </nav>
        </aside>
        <main class="content">
            <section>
                ${content}
            </section>
        </main>
    </div>
    <script type="module" src="assets/app.js"></script>
    <script type="module">
        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
        mermaid.initialize({ startOnLoad: true, theme: 'neutral' });
    </script>
</body>
</html>`;
}

export async function generateSite(outputDir, summary) {
    await fs.mkdir(path.join(outputDir, 'assets'), { recursive: true });

    await fs.writeFile(path.join(outputDir, 'assets/style.css'), getCss());
    await fs.writeFile(path.join(outputDir, 'assets/app.js'), getJs());

    for (const page of siteStructure) {
        console.log(`   Generating page: ${page.title}...`);
        const pagePrompt = page.prompt(summary);
        let pageContent = await getAiResponse(pagePrompt);

        pageContent = pageContent.replace(/^```html\n?/, '').replace(/\n?```$/, '');
        
        const fullHtml = getHtmlShell(`${page.title} | ${summary.projectName}`, pageContent, summary.projectName);
        await fs.writeFile(path.join(outputDir, page.fileName), fullHtml);
    }
}