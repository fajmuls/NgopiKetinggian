const fs = require('fs');

let code = fs.readFileSync('src/admin/TripPosterGenerator.tsx', 'utf8');

// For Papan, we want to ensure "Gunung" is prepended if not there, and conditionally render it.
// Wait, user said "Nama gunungnya pasti aktif. Terus nama gunungnya harus ada tulisan gunung di depannya, jadi Gunung Lawu, jangan hanya Lawu."
// So no need to conditionally render in Papan.

code = code.replace(
    /⛰️ \{mountainName\.toUpperCase\(\)\} ⛰️/,
    "⛰️ {(mountainName.toLowerCase().startsWith('gunung') ? mountainName : 'GUNUNG ' + mountainName).toUpperCase()} ⛰️"
);

// For Bendera (flag), we have `flagShowLogo` and `flagShowMountain`.
// Let's find LAYOUT F
code = code.replace(
   /\{!\(theme\.id === 'light' || theme\.id === 'retro'\) \? \([\s\S]*?<img src="\/logo-light\.png" alt="Logo" className="w-24 md:w-32 object-contain" \/>\s*\)\}/,
   `{flagShowLogo && (
                             !(theme.id === 'light' || theme.id === 'retro') ? (
                                <img src="/logo.png" alt="Logo" className="w-24 md:w-32 object-contain brightness-0 invert" />
                             ) : (
                                <img src="/logo-light.png" alt="Logo" className="w-24 md:w-32 object-contain" />
                             )
                           )}`
);

// For Bendera's mountain name:
code = code.replace(
   /<div className="space-y-1 mb-8">\s*<h4 className="text-\[10px\] font-black uppercase text-white\/50 tracking-\[0\.3em\]">PENDAKIAN BERSAMA<\/h4>\s*<h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">\s*\{mountainName\}\s*<\/h3>\s*<\/div>/,
   `{flagShowMountain && (
                             <div className="space-y-1 mb-8">
                               <h4 className="text-[10px] font-black uppercase text-white/50 tracking-[0.3em]">PENDAKIAN BERSAMA</h4>
                               <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">
                                 {mountainName}
                               </h3>
                             </div>
                           )}`
);

fs.writeFileSync('src/admin/TripPosterGenerator.tsx', code);
