# doxxy — AI-Powered Codebase Documentation Generator

An intelligent documentation tool that analyzes your codebase using **OpenAI GPT-4o** and generates a comprehensive, multi-page documentation site.

---

## Overview

**doxxy** is an AI-powered documentation generator for **JavaScript**, **TypeScript**, and **React** codebases that creates a professional, browsable documentation website. It uses advanced language models to understand your code and generate human-readable documentation with insights into architecture, getting started guides, and API schemas.

* **Output:** A fully static **HTML/CSS/JS** site that runs **offline** and requires **no build step**
* **AI-Powered:** Uses **OpenAI GPT-4o** to generate intelligent summaries and documentation
* **Multi-Page Site:** Creates Overview, Architecture, Getting Started, and API Schema pages

---

## Core Features

doxxy generates comprehensive documentation through AI analysis:

* **Project Overview**
  
  * AI-generated project summary and key insights
  * Codebase metrics (total files, lines of code)
  * Technology stack identification

* **Architecture Documentation**

  * High-level architectural analysis
  * Component relationships and dependencies
  * **Mermaid.js** diagrams for visual representation

* **Getting Started Guide**

  * AI-generated onboarding documentation
  * Setup and development workflow guidance
  * Key concepts and entry points

* **API Schema Documentation**

  * Endpoint discovery and documentation
  * Request/response patterns
  * API structure analysis

---

## Installation & Usage

### Prerequisites

* **Node.js** v18 or newer
* **npm** (or **pnpm** / **yarn**)
* **OpenAI API Key(s)** - for AI-powered analysis

### Setup

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd geminiLLM
   npm install
   ```

2. **Configure API Keys:**
   
   Create a `.env` file with your OpenAI API key(s):
   ```bash
   # Single API key
   OPENAI_API_KEY_1=your-openai-api-key
   
   # Multiple keys for higher rate limits (recommended)
   OPENAI_API_KEY_1=your-first-key
   OPENAI_API_KEY_2=your-second-key
   OPENAI_API_KEY_3=your-third-key
   ```

### CLI Usage

**Basic Command:**
```bash
npm run docs generate <DIRECTORY> [--output <OUTPUT-DIR>]
```

**Parameters:**
* `<DIRECTORY>`: Path to the codebase to analyze
* `--output` *(optional)*: Output directory name (defaults to `doxxyDocs`)

**Examples:**
```bash
# Analyze current directory
npm run docs generate .

# Analyze specific project with custom output
npm run docs generate ./my-project --output my-docs
```

**Output:**
* Documentation site generated in `doxxyDocs/` (or specified output directory)
* Open `doxxyDocs/index.html` in your browser to view the site

---

## MCP Server Interface

doxxy can run as a **Model Context Protocol (MCP)** server for programmatic access by AI assistants.

**Run the server:**
```bash
node server/server.js
```

* **Tool exposed:** `docs.generate`
* **Input schema:** `{ "path": "<CODEBASE-PATH>" }`
* **Output:** JSON summary with generated documentation path

---

## How It Works

doxxy uses a **two-pass AI analysis system**:

### Pass 1: Code Analysis
1. **File Discovery**
   * Scans codebase using **globby** with comprehensive ignore patterns
   * Respects `.gitignore` and excludes `node_modules`, `dist`, `build`

2. **Chunking Strategy**
   * Divides codebase into token-optimized chunks using **tiktoken**
   * Ensures each chunk fits within GPT-4o's context window (128K tokens)
   * Handles large files gracefully with warnings

3. **AI Analysis**
   * Sends each chunk to **OpenAI GPT-4o** for analysis
   * Generates structured JSON summaries of code functionality
   * Supports multiple API keys for high-volume processing

### Pass 2: Site Generation
1. **Content Synthesis**
   * Aggregates AI-generated summaries
   * Calculates project metrics (files, lines of code)

2. **Multi-Page Site Creation**
   * **Overview:** Project summary and key insights
   * **Architecture:** High-level system design and diagrams
   * **Getting Started:** Onboarding and setup guide
   * **API Schema:** Endpoint documentation and patterns

3. **Static Assets**
   * Modern responsive CSS styling
   * **Mermaid.js** integration for diagrams
   * Offline-first design with no external dependencies

---

## Dependencies

doxxy uses the following key dependencies:

| Package | Purpose |
|---------|---------|
| `openai` | OpenAI GPT-4o API integration |
| `globby` | Fast file system scanning with gitignore support |
| `@dqbd/tiktoken` | Token counting for chunk optimization |
| `@babel/parser` | JavaScript/TypeScript parsing for code analysis |
| `yargs` | Command-line interface |
| `dotenv` | Environment variable management |

---

## Performance & Limits

* **Token Management**
  * Automatically chunks large codebases to fit within GPT-4o's 128K token context window
  * Uses tiktoken for accurate token counting
  * Skips individual files that exceed chunk limits with warnings

* **API Rate Limits**
  * Supports multiple OpenAI API keys for higher throughput
  * Automatically rotates between keys on rate limit/auth errors
  * Graceful degradation if keys are exhausted

* **File Processing**
  * Respects `.gitignore` patterns and excludes common build directories
  * Handles binary files gracefully (skips unreadable content)
  * Provides progress indicators for large codebases

---

## Limitations

* **AI Analysis Accuracy**
  * Documentation quality depends on GPT-4o's understanding of your code
  * Complex business logic may require human review and editing
  * Generated content should be verified for accuracy

* **Language Support**
  * Optimized for JavaScript, TypeScript, and React codebases
  * Other languages may receive basic analysis but less detailed insights

* **Cost Considerations**
  * Uses OpenAI API which incurs costs based on token usage
  * Large codebases may require significant API credits
  * Multiple API keys recommended for cost distribution

---

*End of document.*
