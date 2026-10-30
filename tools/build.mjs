// Compile le hub (src/hub.ts, [in.gnu6] vendu dans vendor/in.gnu6, PixiJS) en assets/hub.js.
// La copie du moteur doit être intacte avant toute compilation.
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
execFileSync('node', [join(RACINE, 'tools', 'in-gnu6.mjs'), 'check'], { stdio: 'inherit' });
await build({
  entryPoints: [join(RACINE, 'src', 'hub.ts')], bundle: true, format: 'iife', target: ['es2022'],
  outfile: join(RACINE, 'assets', 'hub.js'), minify: true, legalComments: 'eof', logLevel: 'warning',
  banner: { js: '/* gnu6dotlive.github.io — moteur [in.gnu6] (MIT, gnu6dotlive/in.gnu6, voir vendor/in.gnu6/LICENSE) ; PixiJS (MIT). */' },
});
console.log('assets/hub.js prêt');
