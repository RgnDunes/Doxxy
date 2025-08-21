# doxxy — Automated Codebase Intelligence Tool

This document is the comprehensive manual for **doxxy**—its purpose, features, architecture, and usage for both developers and AI agents.

---

## Overview

**doxxy** is a zero-dependency static analysis tool for modern **JavaScript**, **TypeScript**, and **React** codebases that generates a self-contained, browsable documentation site. It surfaces deep insights into a project’s architecture, dependencies, and API surface—useful to both human developers and AI assistants.

* **Output:** A fully static **HTML/CSS/JS** site that runs **offline** and requires **no build step**, making it easy to share and host.

---

## Core Features & Analysis Capabilities

doxxy provides a multi-faceted view of your codebase:

* **Repository Overview**

  * Detects package manager: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
  * Detects primary frameworks (e.g., **Next.js**, **Vite**)
  * Detects monorepos (e.g., `turbo.json`, `pnpm-workspace.yaml`)

* **Architectural Graphs**

  * Visualizes **module** and **React component** dependencies
  * Uses **Mermaid.js** diagrams rendered **client-side** for an interactive, offline-first experience

* **API Surface Mapping**

  * Extracts server-side endpoints (Next.js, Express)
  * Extracts client-side `fetch` / `axios` calls
  * Produces a summary + best-effort **OpenAPI-like JSON** specification

* **Developer Experience Insights**

  * Parses `package.json` scripts (e.g., `dev`, `test`, `build`) to map common workflows
  * Analyzes `.env*` files to list **required configuration variables** *(values are never read)*

* **Deployment & CI/CD**

  * Summarizes build and release pipelines from common CI systems (e.g., `.github/workflows`, `gitlab-ci.yml`)
  * Detects deployment artifacts like **Dockerfile** and **Kubernetes** manifests

* **Technology Stack**

  * Identifies and categorizes libraries and tools (UI frameworks, testing, state management, etc.)

---

## Installation & Usage

### Prerequisites

* **Node.js** v18 or newer
* **npm** (or **pnpm** / **yarn**)

### Install

```bash
# Clone the repository, then:
npm install
```

### CLI Interface

Primary entry point is the **command-line interface**.

**Command**

```bash
npm run docs generate <CODEBASE-PATH> [--llm]
```

* `<CODEBASE-PATH>`: Absolute or relative path to the codebase to analyze
* `--llm` *(optional)*: Enable AI-powered summary enrichment via the **Anthropic Claude** API

**Example (analyze current repo)**

```bash
npm run docs generate .
```

**Output**

* A directory named `doxxy/` is created **inside the target codebase**
* Open `doxxy/index.html` directly in your browser

---

## MCP Server Interface

doxxy can run as a **Model Context Protocol (MCP)** server so AI assistants (e.g., Cursor, Claude Code) can invoke it programmatically.

**Run the server**

```bash
npm run mcp
```

* **Tool exposed:** `docs.generate`
* **Input schema**

  ```json
  { "path": "<CODEBASE-PATH>" }
  ```
* **Output:** JSON summary of generated artifacts and the **relative output directory** path

---

## Technical Architecture

doxxy operates in distinct phases:

1. **File Discovery**

   * Uses **globby** to scan for relevant files: `.js`, `.jsx`, `.ts`, `.tsx`, `.yml`, etc.
   * Respects comprehensive ignore patterns (e.g., `node_modules`, `dist`, `.git`)

2. **AST Parsing**

   * Parses JS/TS into ASTs via **@babel/parser**
   * Enables plugins for `jsx` and `typescript`

3. **Data Extraction (Visitor Pattern)**

   * Traverses AST with **@babel/traverse**
   * Targeted visitors for:

     * `ImportDeclaration` (dependencies)
     * `CallExpression` (API calls, axios/fetch)
     * `FunctionDeclaration`
     * `JSXElement` (component structure)

4. **Data Serialization**

   * Aggregates results into JSON (e.g., `overview.json`, `graph.json`)
   * Writes artifacts to `doxxy/data/`

5. **Site Generation**

   * Copies static templates (**HTML/CSS/JS**) and vendored `mermaid.min.js`
   * Converts project `README.md` to HTML via **marked**

---

## API Endpoint Detection Patterns

API extraction is **heuristic** and best-effort.

| Source Type             | Detection Pattern (via `@babel/traverse`)                                                 | Notes                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Next.js API routes**  | File path matches `app/api/**/route.(js\|ts)` or `pages/api/**/*.(js\|ts)`                | Detects route files by path conventions.                                          |
| **Express.js**          | `CallExpression` where callee is `app.get`, `app.post`, `router.get`, `router.post`, etc. | Extracts HTTP method and the **first string literal** argument as the route path. |
| **Client-side `fetch`** | `CallExpression` where callee is an `Identifier` named `fetch`                            | Extracts literal URL (if present) and `method` from the options object.           |
| **Client-side `axios`** | `CallExpression` where callee is `axios.get`, `axios.post`, or `axios({...})`             | Extracts URL and method from arguments / config.                                  |

---

## Enabling AI-Powered Summaries (Optional)

doxxy can use an LLM to enrich documentation with high-level summaries and endpoint descriptions. This is **opt-in** and requires an API key.

1. Set the **Anthropic** API key:

   ```bash
   export ANTHROPIC_API_KEY="your-api-key-here"
   ```
2. Run with `--llm`:

   ```bash
   npm run docs generate <CODEBASE-PATH> --llm
   ```

When enabled, doxxy sends **contextual snippets** (code excerpts, file paths) to the Claude API to generate summaries.

---

## Limitations

* **Dynamic Code**

  * Static analysis of `import()` expressions, dynamic API routes (e.g., ``app.get(`/api/${variable}`)``), and computed properties is inherently limited; doxxy focuses on **literal, statically determinable** values.

* **Complex Type Analysis**

  * React prop inference is heuristic (e.g., via destructuring). Deep type resolution of imported **TypeScript interfaces** is **not** performed.

* **Build-time Information**

  * No access to bundler output; webpack/Vite module aliases are not resolved unless explicitly configured.

---

*End of document.*
