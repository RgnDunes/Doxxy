import { findFiles, safeReadFile } from '../common/fs-utils.js';
import path from 'node:path';

export async function analyzeBuildAndRelease(basePath) {
  const ciFiles = await findFiles(basePath, [
    '.github/workflows/*.{yml,yaml}',
    '.gitlab-ci.yml',
    'circleci/config.yml',
    'buildkite/*',
  ]);

  const workflows = [];

  for (const file of ciFiles) {
    const content = await safeReadFile(file);
    if (!content) continue;

    const relativePath = path.relative(basePath, file);
    let provider = 'unknown';
    if (relativePath.includes('.github')) provider = 'GitHub Actions';
    if (relativePath.includes('.gitlab-ci')) provider = 'GitLab CI/CD';
    if (relativePath.includes('circleci')) provider = 'CircleCI';
    if (relativePath.includes('buildkite')) provider = 'Buildkite';
    
    // Simple heuristic parsing for job/step names
    const jobs = (content.match(/jobs:\s*((?:.|\n)*?)(?=\n\S|$)/) || [''])[1] || '';
    const jobNames = [...jobs.matchAll(/^\s{2}(\w+):/gm)].map(m => m[1]);

    const steps = (content.match(/steps:\s*((?:.|\n)*?)(?=\n\s{0,2}\S)/) || [''])[1] || '';
    const stepNames = [...steps.matchAll(/^\s{4,}-\s*(?:name|run):\s*(.*)/gm)].map(m => m[1]);

    workflows?.push({
      provider,
      file: relativePath,
      jobNames: jobNames.length > 0? jobNames : ['N/A'],
      stepSummary: stepNames.slice(0, 5), // Limit for brevity
    });
  }

  return { workflows };
}