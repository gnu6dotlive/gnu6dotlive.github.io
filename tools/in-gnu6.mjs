// [in.gnu6] consommé par le hub : source copiée à une révision exacte, octet pour octet, avec
// sa licence. Le moteur possède la scène ; le hub n'y écrit rien d'autre que des cibles, et projette.
//   node tools/in-gnu6.mjs sync <révision>   copie src/ et LICENSE de ../in.gnu6 à cette révision
//   node tools/in-gnu6.mjs check             vérifie chaque octet contre le manifeste (et contre Git si ../in.gnu6 existe)
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const VENDOR = join(ICI, '..', 'vendor', 'in.gnu6');
const SOURCE = join(ICI, '..', '..', 'in.gnu6');
const CHEMINS = ['src', 'LICENSE'];
const sha = (b) => createHash('sha256').update(b).digest('hex');
const git = (...a) => execFileSync('git', ['-C', SOURCE, ...a], { maxBuffer: 64 << 20 });

function agregat(fichiers) {
  return sha(Object.keys(fichiers).sort().map((f) => f + '\0' + fichiers[f] + '\n').join(''));
}

const [cmd, rev] = process.argv.slice(2);
if (cmd === 'sync') {
  if (!rev) { console.error('révision exigée'); process.exit(2); }
  const complete = git('rev-parse', rev + '^{commit}').toString().trim();
  const liste = git('ls-tree', '-r', '--name-only', complete, '--', ...CHEMINS).toString().trim().split('\n').filter(Boolean);
  if (!liste.includes('LICENSE')) { console.error('cette révision n\'a pas de LICENSE : le hub ne copie qu\'un moteur sous licence'); process.exit(2); }
  rmSync(VENDOR, { recursive: true, force: true });
  const fichiers = {};
  for (const f of liste) {
    const octets = git('show', complete + ':' + f);
    mkdirSync(dirname(join(VENDOR, f)), { recursive: true });
    writeFileSync(join(VENDOR, f), octets);
    fichiers[f] = sha(octets);
  }
  const manifeste = { moteur: '[in.gnu6]', depot: 'gnu6dotlive/in.gnu6', revision: complete, empreinte: agregat(fichiers), fichiers };
  writeFileSync(join(VENDOR, 'manifest.json'), JSON.stringify(manifeste, null, 1) + '\n');
  writeFileSync(join(VENDOR, 'PROVENANCE.md'),
    '# [in.gnu6] — copie consommée par le hub\n\n' +
    'Révision : `' + complete + '` (gnu6dotlive/in.gnu6, licence MIT : `LICENSE`)\n\n' +
    'Empreinte de l\'arbre copié (SHA-256) : `' + manifeste.empreinte + '`\n\n' +
    'Copie octet pour octet de `' + CHEMINS.join('`, `') + '` (git show), vérifiée par `node tools/in-gnu6.mjs check`.\n' +
    'Ne jamais modifier ces fichiers ici : une correction du moteur se fait dans in.gnu6 (branche et PR), puis\n' +
    'une nouvelle synchronisation à la révision fusionnée.\n');
  console.log(liste.length + ' fichiers · révision ' + complete.slice(0, 7) + ' · empreinte ' + manifeste.empreinte.slice(0, 12));
} else if (cmd === 'check') {
  const m = JSON.parse(readFileSync(join(VENDOR, 'manifest.json'), 'utf8'));
  const derive = [];
  for (const [f, h] of Object.entries(m.fichiers)) {
    const p = join(VENDOR, f);
    if (!existsSync(p)) { derive.push('absent : ' + f); continue; }
    if (sha(readFileSync(p)) !== h) derive.push('octets modifiés : ' + f);
  }
  if (agregat(m.fichiers) !== m.empreinte) derive.push('empreinte du manifeste incohérente');
  if (existsSync(join(SOURCE, '.git'))) {
    for (const f of Object.keys(m.fichiers)) {
      try { if (sha(git('show', m.revision + ':' + f)) !== m.fichiers[f]) derive.push('différent de la révision : ' + f); }
      catch { derive.push('révision illisible dans ../in.gnu6 : ' + f); break; }
    }
  }
  if (derive.length) { console.error('[in.gnu6] copie altérée :\n  ' + derive.join('\n  ')); process.exit(1); }
  console.log('[in.gnu6] ' + Object.keys(m.fichiers).length + ' fichiers intacts · révision ' + m.revision.slice(0, 7));
} else {
  console.error('usage : node tools/in-gnu6.mjs sync <révision> | check');
  process.exit(2);
}
