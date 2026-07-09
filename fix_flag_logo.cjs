const fs = require('fs');
let code = fs.readFileSync('src/admin/TripPosterGenerator.tsx', 'utf8');

code = code.replace(
    /<Compass size=\{32\} className="text-white opacity-90" \/>/,
    `<img src="https://files.catbox.moe/lubzno.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-md" />`
);

fs.writeFileSync('src/admin/TripPosterGenerator.tsx', code);
