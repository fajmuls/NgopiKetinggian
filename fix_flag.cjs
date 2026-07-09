const fs = require('fs');

let code = fs.readFileSync('src/admin/TripPosterGenerator.tsx', 'utf8');

code = code.replace(
   /\{flagDesign !== 3 && <div className="w-16 h-16 bg-white\/10 rounded-full mx-auto backdrop-blur-md flex items-center justify-center shadow-lg border border-white\/20 mb-4">/,
   `{flagShowLogo && <div className="w-16 h-16 bg-white/10 rounded-full mx-auto backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20 mb-4">`
);

code = code.replace(
    /<h3 className=\{\`text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none drop-shadow-\[0_4px_12px_rgba\(0,0,0,0\.65\)\] font-sans \$\{flagDesign === 5 \? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400' : 'text-white'\}\`\}>\s*\{mountainName\}\s*<\/h3>/,
    `{flagShowMountain && <h3 className={\`text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.65)] font-sans \${flagDesign === 5 ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400' : 'text-white'}\`}>
                            {mountainName}
                          </h3>}`
);

code = code.replace(
    /<span className="text-xl md:text-3xl font-black text-art-orange drop-shadow-lg">\{mountainMdpl\}<\/span>/,
    `{flagShowMountain && <span className="text-xl md:text-3xl font-black text-art-orange drop-shadow-lg">{mountainMdpl}</span>}`
);

fs.writeFileSync('src/admin/TripPosterGenerator.tsx', code);
