import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

let serverProcess: ReturnType<typeof spawn> | null = null;

export async function setup() {
  serverProcess = spawn('pnpm', ['exec', 'varlock', 'run', '--', 'tsx', 'src/index.ts'], {
    cwd: join(__dirname, '..'),
    stdio: 'pipe',
    shell: true,
  });
  
  await new Promise(resolve => setTimeout(resolve, 5000));
}

export async function teardown() {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
}