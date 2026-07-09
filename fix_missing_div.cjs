const fs = require('fs');

let code = fs.readFileSync('src/admin/TripPosterGenerator.tsx', 'utf8');

code = code.replace(
    /<\/motion\.div>\s*<\/div>\s*\{\/\* Slide Navigation & Dots \*\/\}/,
    `</motion.div>\n                </div>\n              </div>\n              {/* Slide Navigation & Dots */}`
);

fs.writeFileSync('src/admin/TripPosterGenerator.tsx', code);
