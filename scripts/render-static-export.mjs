import { cp, mkdir, rm, writeFile } from 'fs/promises';
import path from 'path';

const root = process.cwd();
const nextDir = path.join(root, 'dist');
const outDir = path.join(root, 'out');

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

await copyPage(
  path.join(nextDir, 'server', 'app', 'api', 'n8n', 'workflows.body'),
  path.join(outDir, 'api', 'n8n', 'workflows'),
);
await writeFile(path.join(outDir, 'api', 'sheet-mappings'), '[]\n');

console.log(`Static Render export written to ${outDir}`);
