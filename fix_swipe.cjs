const fs = require('fs');

let code = fs.readFileSync('src/admin/TripPosterGenerator.tsx', 'utf8');

code = code.replace(
   /style=\{\{ touchAction: 'pan-x pan-y' \}\}/g,
   "style={{ touchAction: 'pan-y' }}"
);

fs.writeFileSync('src/admin/TripPosterGenerator.tsx', code);
