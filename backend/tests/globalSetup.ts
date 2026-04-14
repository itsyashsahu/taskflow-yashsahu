import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

let serverProcess: ReturnType<typeof spawn> | null = null;

export async function setup() {
  const serverPath = join(__dirname, '../src/index.ts');
  
  serverProcess = spawn('npx', ['tsx', 'watch', 'src/index.ts'], {
    cwd: join(__dirname, '..'),
    stdio: 'pipe',
  });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
}

export async function teardown() {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
}