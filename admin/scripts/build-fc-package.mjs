import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const output = path.join(root, '.fc-build');

if (path.basename(output) !== '.fc-build') {
  throw new Error('拒绝清理非预期目录');
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, 'dist'), path.join(output, 'dist'), { recursive: true });
await cp(path.join(root, 'package-lock.json'), path.join(output, 'package-lock.json'));

const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const serverDependencies = new Set([
  'cookie',
  'dotenv',
  'express',
  'express-rate-limit',
  'hash-wasm',
  'helmet',
  'yaml',
  'zod',
]);
packageJson.dependencies = Object.fromEntries(
  Object.entries(packageJson.dependencies).filter(([name]) => serverDependencies.has(name)),
);
delete packageJson.devDependencies;
packageJson.scripts = { start: 'node dist/server/server/index.js' };
await writeFile(path.join(output, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);

await new Promise((resolve, reject) => {
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(command, ['install', '--omit=dev', '--ignore-scripts'], {
    cwd: output,
    stdio: 'inherit',
  });
  child.once('error', reject);
  child.once('exit', (code) => {
    if (code === 0) resolve(undefined);
    else reject(new Error(`npm install 失败（退出码 ${code ?? 'unknown'}）`));
  });
});

console.log(`函数计算部署包已生成：${output}`);
