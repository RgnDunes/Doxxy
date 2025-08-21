import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDir, writeJson, copyFile } from '../common/fs-utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');

export async function writeSite(outputDir, analysisResult) {
  const dataDir = path.join(outputDir, 'data');
  const assetsDir = path.join(outputDir, 'assets');

  // Create directories
  await ensureDir(outputDir);
  await ensureDir(dataDir);
  await ensureDir(assetsDir);

  // Copy static assets from templates
  await copyFile(path.join(TEMPLATES_DIR, 'index.html'), path.join(outputDir, 'index.html'));
  await copyFile(path.join(TEMPLATES_DIR, 'styles.css'), path.join(assetsDir, 'styles.css'));
  await copyFile(path.join(TEMPLATES_DIR, 'app.js'), path.join(assetsDir, 'app.js'));
  await copyFile(path.join(TEMPLATES_DIR, 'mermaid.min.js'), path.join(assetsDir, 'mermaid.min.js'));

  // Write data files
  for (const key in analysisResult) {
    if (Object.hasOwnProperty.call(analysisResult, key)) {
      await writeJson(path.join(dataDir, `${key}.json`), { data: analysisResult[key] });
    }
  }
}