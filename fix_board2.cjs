const fs = require('fs');

let code = fs.readFileSync('src/admin/TripPosterGenerator.tsx', 'utf8');

code = code.replace(
   /<h3 className="font-extrabold uppercase text-yellow-50 text-3xl md:text-4xl tracking-tight drop-shadow-\[0_2px_4px_rgba\(0,0,0,0\.8\)\] font-serif">\s*⛰️ \{\(mountainName\.toLowerCase\(\)\.startsWith\('gunung'\) \? mountainName : 'GUNUNG ' \+ mountainName\)\.toUpperCase\(\)\} ⛰️\s*<\/h3>/,
   `{boardShowMountain && <h3 className="font-extrabold uppercase text-yellow-50 text-3xl md:text-4xl tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-serif">
                              ⛰️ {(mountainName.toLowerCase().startsWith('gunung') ? mountainName : 'GUNUNG ' + mountainName).toUpperCase()} ⛰️
                            </h3>}`
);

fs.writeFileSync('src/admin/TripPosterGenerator.tsx', code);
