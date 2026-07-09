const fs = require('fs');

let code = fs.readFileSync('src/admin/TripPosterGenerator.tsx', 'utf8');

// For info: 'poster' (Cover), 'rundown' (Rundown), 'gears' (Fasilitas), 'rules' (S&K), 'ad' (Promo)
// For iklan: 'ad' (Cover Iklan), 'rundown' (Highlight), 'gears' (Fasilitas)

code = code.replace(
    /setSelectedSlides\(\['ad', 'rundown', 'promo'\]\);/,
    "setSelectedSlides(['ad', 'rundown', 'gears']);"
);

code = code.replace(
    /:\s*\['ad', 'rundown', 'promo'\]\)\.map\(slideId => \(/,
    ": ['ad', 'rundown', 'gears']).map(slideId => ("
);

// Map text labels
code = code.replace(
    /\{slideId\.toUpperCase\(\)\}/,
    `{slideId === 'poster' ? 'Cover' : slideId === 'rundown' ? (layout === 'ad' ? 'Highlight' : 'Rundown') : slideId === 'gears' ? 'Fasilitas' : slideId === 'rules' ? 'S&K' : 'Promo'}`
);

fs.writeFileSync('src/admin/TripPosterGenerator.tsx', code);
