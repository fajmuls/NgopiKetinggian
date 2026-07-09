const fs = require('fs');
let code = fs.readFileSync('src/admin/TripPosterGenerator.tsx', 'utf8');

code = code.replace(
    /<div className="bg-black\/20 p-3 rounded-xl border border-white\/5 backdrop-blur-sm">/g,
    `<div className={\`p-3 rounded-xl backdrop-blur-sm \${infoDesign === 2 ? 'bg-white/10 border border-white/20' : infoDesign === 3 ? 'bg-art-orange/20 border-l-4 border-art-orange' : infoDesign === 4 ? 'bg-transparent border-b-2 border-white/20 rounded-none' : infoDesign === 5 ? 'bg-black/40 border border-art-orange shadow-[0_0_15px_rgba(255,87,34,0.3)]' : 'bg-black/20 border border-white/5'}\`}>`
);

code = code.replace(
    /<div className="bg-black\/35 p-3\.5 rounded-xl border border-white\/10 space-y-2">/g,
    `<div className={\`p-3.5 space-y-2 \${infoDesign === 2 ? 'bg-white/5 border border-white/20 rounded-xl backdrop-blur-md' : infoDesign === 3 ? 'bg-black/40 border border-white/10 rounded-xl' : infoDesign === 4 ? 'bg-transparent border-t-2 border-white/20' : infoDesign === 5 ? 'bg-black/60 border border-art-orange shadow-[0_0_15px_rgba(255,87,34,0.3)] rounded-xl' : 'bg-black/35 rounded-xl border border-white/10'}\`}>`
);

code = code.replace(
    /<div className="bg-white\/5 p-3 rounded-xl border border-white\/10 flex items-center justify-between">/g,
    `<div className={\`p-3 flex items-center justify-between \${infoDesign === 2 ? 'bg-white/10 border border-white/20 rounded-xl backdrop-blur-md' : infoDesign === 3 ? 'bg-art-orange/10 border border-art-orange/30 rounded-xl' : infoDesign === 4 ? 'bg-transparent border-y-2 border-white/20' : infoDesign === 5 ? 'bg-black/60 border border-art-orange shadow-[0_0_15px_rgba(255,87,34,0.3)] rounded-xl' : 'bg-white/5 border border-white/10 rounded-xl'}\`}>`
);

fs.writeFileSync('src/admin/TripPosterGenerator.tsx', code);
