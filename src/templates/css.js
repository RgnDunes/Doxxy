// src/templates/css.js

export function getCss() {
    return `
  :root {
      --bg-color: #f9fafb;
      --sidebar-bg: #ffffff;
      --content-bg: #ffffff;
      --text-color: #1f2937;
      --text-color-light: #6b7280;
      --border-color: #e5e7eb;
      --accent-color: #ffc107; /* Rippling Yellow */
      --accent-color-dark: #e0a800;
      --accent-color-light: #fff8e1;
      --code-bg: #f3f4f6;
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  }
  
  * {
      box-sizing: border-box;
  }
  
  body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      background-color: var(--bg-color);
      color: var(--text-color);
      line-height: 1.7;
      font-size: 16px;
  }
  
  .container {
      display: flex;
  }
  
  .sidebar {
      width: 260px;
      flex-shrink: 0;
      background-color: var(--sidebar-bg);
      border-right: 1px solid var(--border-color);
      height: 100vh;
      position: sticky;
      top: 0;
      padding: 1.5rem;
  }
  
  .sidebar-header {
      margin-bottom: 2rem;
      padding-left: 0.75rem;
  }
  
  .main-title {
      display: block;
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-color);
  }
  
  .sub-title {
      display: block;
      font-size: 1rem;
      color: var(--text-color-light);
      margin-top: 0.25rem;
  }
  
  .sidebar nav ul {
      list-style: none;
      padding: 0;
      margin: 0;
  }
  
  .sidebar nav a {
      display: block;
      padding: 0.5rem 0.75rem;
      margin-bottom: 0.25rem;
      color: var(--text-color);
      text-decoration: none;
      border-radius: 6px;
      transition: background-color 0.2s ease, color 0.2s ease;
  }
  
  .sidebar nav a:hover {
      background-color: var(--accent-color-light);
  }
  
  .content {
      flex-grow: 1;
      padding: 2rem 3rem;
      max-width: 900px;
      margin: 0 auto;
  }
  
  section {
      margin-bottom: 3rem;
  }
  
  h1, h2, h3, h4 {
      color: var(--text-color);
      font-weight: 600;
      line-height: 1.3;
      margin-top: 2.5rem;
  }
  
  h2 {
      font-size: 2rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
      margin-bottom: 1.5rem;
  }
  
  h3 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
  }
  
  h4 {
      font-size: 1.2rem;
      margin-bottom: 1rem;
  }
  
  a {
      color: var(--accent-color-dark);
      text-decoration: none;
      font-weight: 500;
  }
  
  a:hover {
      text-decoration: underline;
  }
  
  code {
      background-color: var(--code-bg);
      color: var(--text-color);
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      border-radius: 6px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
  }
  
  pre {
      background-color: var(--code-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1rem;
      overflow-x: auto;
      font-size: 0.9rem;
  }
  
  pre code {
      background: none;
      padding: 0;
      font-size: 100%;
  }
  
  table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1.5rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
  }
  
  th, td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
  }
  
  th {
      background-color: var(--sidebar-bg);
      font-weight: 600;
  }
  
  tbody tr:last-child td {
      border-bottom: none;
  }
  
  .mermaid {
      background-color: #ffffff;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      margin-top: 1.5rem;
      text-align: center;
  }
    `;
  }