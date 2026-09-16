import { build } from 'vite';
import fs from 'fs';

async function run() {
  try {
    await build({
      root: process.cwd(),
      logLevel: 'error',
    });
    fs.writeFileSync('build_error_clean.txt', 'Build successful', 'utf8');
  } catch (error) {
    fs.writeFileSync('build_error_clean.txt', 'Error: ' + error.message + '\nFile: ' + error.id + '\nFrame: ' + error.frame + '\nStack: ' + error.stack, 'utf8');
    process.exit(1);
  }
}
run();
