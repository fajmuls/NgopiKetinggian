const fs = require('fs');

let code = fs.readFileSync('src/useAppConfig.ts', 'utf8');

code = code.replace(
    /export const WEBSITE_VERSION = ".*?";/,
    'export const WEBSITE_VERSION = "1.2.0";'
);

// Add to patch notes
const newPatchNotes = `
  {
    version: '1.2.0',
    date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    changes: [
      'Perbaikan status Draft & Publikasi pada Open Trips',
      'Perbaikan isu preview poster generator terpotong',
      'Penambahan fitur opsi desain untuk Layout Info, Promo, Bendera, dan Papan (Desain 1-5)',
      'Penambahan logo aplikasi otomatis pada desain Bendera'
    ]
  },`;

code = code.replace(
    /export const DEFAULT_PATCH_NOTES: PatchNote\[\] = \[/,
    `export const DEFAULT_PATCH_NOTES: PatchNote[] = [\n${newPatchNotes}`
);

fs.writeFileSync('src/useAppConfig.ts', code);
