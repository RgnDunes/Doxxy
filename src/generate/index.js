import path from 'node:path';
import { writeSite } from './write-site.js';

export async function generateSite(codebasePath, analysisResult) {
  const outputDir = path.join(codebasePath, 'doxxy');
  await writeSite(outputDir, analysisResult);
  return outputDir;
}