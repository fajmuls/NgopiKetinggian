const fs = require('fs');

let code = fs.readFileSync('src/admin/OpenTripsAdmin.tsx', 'utf8');

code = code.replace(
    /\{\!isPublished \|\| ot\.status === 'selesai' \? \([\s\S]*?Selesai\s*<\/button>\s*<\/div>\s*\)\}/,
    `<button
                   onClick={() => {
                     const nd = [...data];
                     nd[i].status = isPublished ? 'draft' : 'published';
                     setData(nd);
                     updateConfig({ openTrips: nd });
                     showToast(isPublished ? 'Disimpan sebagai Draft!' : 'Dipublikasi!');
                   }}
                   className={\`w-full sm:w-auto \${isPublished ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-art-green hover:bg-green-600'} text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors\`}
                >
                   {isPublished ? 'Jadikan Draft' : 'Publikasi Trip'}
                </button>`
);

fs.writeFileSync('src/admin/OpenTripsAdmin.tsx', code);
