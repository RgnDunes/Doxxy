import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { analyzeCodebase } from '../src/analyze/index.js';
import { generateSite } from '../src/generate/index.js';

async function startMcpServer() {
  const server = new McpServer({
    name: 'doxxy-docs-generator',
    version: '1.0.0',
  });

  server.tool(
    'docs.generate',
    {
      path: z.string().describe('The absolute path to the codebase directory to analyze.'),
    },
    async (params) => {
      const { path: codebasePath } = params;

      if (!existsSync(codebasePath)) {
        throw new Error(`The specified path does not exist: ${codebasePath}`);
      }

      try {
        // LLM enrichment is not supported via MCP in this version for simplicity.
        const analysisResult = await analyzeCodebase(codebasePath, null);
        const outputDir = await generateSite(codebasePath, analysisResult);

        const relativeOutputDir = path.relative(codebasePath, outputDir);
        const summary = `Documentation generated for ${codebasePath}. Site written to ${relativeOutputDir}. Artifacts: ${Object.keys(analysisResult).length} data files.`;

        return {
          content: JSON.stringify({ path: result.outputPath, summary: result.summary }),
        };
      } catch (error) {
        console.error('MCP Tool Error:', error);
        throw new Error(`Failed to generate documentation: ${error.message}`);
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('MCP server for doxxy is running. Waiting for tool calls...');
}

startMcpServer().catch((err) => {
  console.error('Fatal MCP server error:', err);
  process.exit(1);
});