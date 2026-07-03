import { spawn } from 'child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const processes = [
  spawn(npmCommand, ['--prefix', 'backend', 'run', 'dev'], { stdio: 'inherit' }),
  spawn(npmCommand, ['--prefix', 'frontend', 'run', 'dev'], { stdio: 'inherit' })
];

function shutdown() {
  for (const child of processes) {
    if (!child.killed) child.kill('SIGTERM');
  }
}

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});

for (const child of processes) {
  child.on('exit', code => {
    if (code && code !== 0) {
      shutdown();
      process.exit(code);
    }
  });
}
