import { findFiles } from '../common/fs-utils.js';
import path from 'node:path';

export async function analyzeDeployment(basePath) {
  const dockerfiles = await findFiles(basePath, ['**/Dockerfile*', '**/dockerfile*']);
  const composeFiles = await findFiles(basePath, ['**/docker-compose.yml', '**/docker-compose.yaml']);
  const k8sFiles = await findFiles(basePath, ['**/deployments/**/*.yml', '**/charts/**/*.yaml', '**/*.k8s.yml']);

  const relative = (files) => files.map(f => path.relative(basePath, f));

  return {
    hasDockerfile: dockerfiles.length > 0,
    dockerfilePaths: relative(dockerfiles),
    hasCompose: composeFiles.length > 0,
    composePaths: relative(composeFiles),
    hasKubernetes: k8sFiles.length > 0,
    kubernetesPaths: relative(k8sFiles),
  };
}