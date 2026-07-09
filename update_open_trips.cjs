const fs = require('fs');
let code = fs.readFileSync('src/admin/OpenTripsAdmin.tsx', 'utf8');

code = code.replace(
   /onClick={\(\) => {\s*const nd = \[\.\.\.data\];\s*nd\[i\]\.status = 'draft';\s*setData\(nd\);\s*}}/g,
   "onClick={() => { const nd = [...data]; nd[i].status = 'draft'; setData(nd); updateConfig({ openTrips: nd }); showToast('Disimpan sebagai Draft!'); }}"
);
code = code.replace(
   /onClick={\(\) => {\s*const nd = \[\.\.\.data\];\s*nd\[i\]\.status = 'published';\s*setData\(nd\);\s*}}/g,
   "onClick={() => { const nd = [...data]; nd[i].status = 'published'; setData(nd); updateConfig({ openTrips: nd }); showToast('Dipublikasi!'); }}"
);
code = code.replace(
   /onClick={\(\) => {\s*const nd = \[\.\.\.data\];\s*nd\[i\]\.status = 'selesai';\s*setData\(nd\);\s*}}/g,
   "onClick={() => { const nd = [...data]; nd[i].status = 'selesai'; setData(nd); updateConfig({ openTrips: nd }); showToast('Selesai (Diarsipkan)!'); }}"
);

fs.writeFileSync('src/admin/OpenTripsAdmin.tsx', code);
