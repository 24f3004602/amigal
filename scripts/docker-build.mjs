import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const service = process.argv[2];

if (!service || !['backend', 'frontend'].includes(service)) {
  console.error('Usage: npm run docker:build:<backend|frontend>');
  process.exit(1);
}

const cwd = process.cwd();
const rootPackageJsonPath = join(cwd, 'package.json');

if (!existsSync(rootPackageJsonPath)) {
  console.error('Run this from the monorepo root that contains package.json with workspaces.');
  process.exit(1);
}

let rootPackageJson;

try {
  rootPackageJson = JSON.parse(readFileSync(rootPackageJsonPath, 'utf8'));
} catch {
  console.error('Unable to read package.json in the current directory. Run from the monorepo root.');
  process.exit(1);
}

if (!Array.isArray(rootPackageJson.workspaces)) {
  console.error('Current directory is not the workspace root. Expected a package.json with a workspaces field.');
  process.exit(1);
}

const dockerfile = service === 'backend' ? 'docker/Dockerfile.backend' : 'docker/Dockerfile.frontend';
const result = spawnSync('docker', ['build', '--no-cache', '-f', dockerfile, '.'], {
  cwd,
  stdio: 'inherit',
  shell: false,
});

process.exit(result.status ?? 1);