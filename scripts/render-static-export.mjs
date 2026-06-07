import { cp, mkdir, rm, writeFile } from 'fs/promises';
import path from 'path';

const root = path.resolve(process.cwd());

function safePath(...segments) {
  const resolvedPath = path.resolve(root, ...segments);

  if (resolvedPath !== root && !resolvedPath.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Refusing to access path outside project root: ${resolvedPath}`);
  }

  return resolvedPath;
}

const nextDir = safePath('dist');
const outDir = safePath('out');

async function copyPage(source, target) {
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target);
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

await cp(path.join(nextDir, 'static'), path.join(outDir, '_next', 'static'), {
  recursive: true,
});

await cp(path.join(root, 'public'), outDir, {
  recursive: true,
});

await copyPage(path.join(nextDir, 'server', 'app', 'index.html'), path.join(outDir, 'index.html'));
await copyPage(path.join(nextDir, 'server', 'app', 'login.html'), path.join(outDir, 'login', 'index.html'));
await copyPage(path.join(nextDir, 'server', 'app', 'login.html'), path.join(outDir, 'login.html'));
await copyPage(
  path.join(nextDir, 'server', 'app', 'auth', 'callback.html'),
  path.join(outDir, 'auth', 'callback', 'index.html'),
);
await copyPage(
  path.join(nextDir, 'server', 'app', 'auth', 'callback.html'),
  path.join(outDir, 'auth', 'callback.html'),
);
await copyPage(path.join(nextDir, 'server', 'app', '_not-found.html'), path.join(outDir, '404.html'));

const workflowsBody = path.join(nextDir, 'server', 'app', 'api', 'n8n', 'workflows.body');
try {
  await copyPage(workflowsBody, path.join(outDir, 'api', 'n8n', 'workflows'));
} catch (error) {
  if (error?.code !== 'ENOENT') {
    throw error;
  }

  await mkdir(path.join(outDir, 'api', 'n8n'), { recursive: true });
  await writeFile(path.join(outDir, 'api', 'n8n', 'workflows'), '{"workflows":[]}\n');
}
await writeFile(path.join(outDir, 'api', 'sheet-mappings'), '[]\n');

console.log(`Static Render export written to ${outDir}`);
