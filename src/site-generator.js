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
        title: "Overview",
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
        title: "Analysis Modules",
        children: [
            {
                fileName: "api-schema.html",
                title: "API Schema",
                prompt: prompts.buildApiSchemaPagePrompt,
            },
            {
                fileName: "conventions.html",
                title: "Dev & Conventions",
                prompt: prompts.buildConventionsPagePrompt,
            },
            {
                fileName: "build-and-deployment.html",
                title: "Build & Deployment",
                prompt: prompts.buildBuildPagePrompt,
            },
        ],
    },
];

function generateNavLinks(structure, currentFile) {
    let navHtml = '<ul>';
    for (const item of structure) {
        if (item.children) {
            navHtml += `<li><strong>${item.title}</strong>`;
            navHtml += generateNavLinks(item.children, currentFile); // Recursive call for nested items
            navHtml += '</li>';
        } else {
            const isActive = item.fileName === currentFile ? 'class="active"' : '';
            navHtml += `<li><a href="${item.fileName}" ${isActive}>${item.title}</a></li>`;
        }
    }
    navHtml += '</ul>';
    return navHtml;
}

function getHtmlShell(title, content, projectName, currentFile) {
    const navLinks = generateNavLinks(siteStructure, currentFile);
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
                ${navLinks}
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

async function generatePage(page, outputDir, summary) {
    console.log(`   Generating page: ${page.title}...`);
    const pagePrompt = page.prompt(summary, summary.dependencyGraph, summary.workflowGraph);
    let pageContent = await getAiResponse(pagePrompt);

    pageContent = pageContent.replace(/^```html\n?/, '').replace(/\n?```$/, '');
    
    const fullHtml = getHtmlShell(`${page.title} | ${summary.projectName}`, pageContent, summary.projectName, page.fileName);
    await fs.writeFile(path.join(outputDir, page.fileName), fullHtml);
}

export async function generateSite(outputDir, summary) {
    await fs.mkdir(path.join(outputDir, 'assets'), { recursive: true });

    await fs.writeFile(path.join(outputDir, 'assets/style.css'), getCss());
    await fs.writeFile(path.join(outputDir, 'assets/app.js'), getJs());

    for (const item of siteStructure) {
        if (item.children) {
            for (const childPage of item.children) {
                await generatePage(childPage, outputDir, summary);
            }
        } else {
            await generatePage(item, outputDir, summary);
        }
    }
}