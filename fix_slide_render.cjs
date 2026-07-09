const fs = require('fs');

let code = fs.readFileSync('src/admin/TripPosterGenerator.tsx', 'utf8');

// The active slide determines what is rendered.
code = code.replace(
   /key={layout}\s*initial=/g,
   "key={selectedSlides[currentSlide] || layout}\n                      initial="
);

// We need to replace `{layout === 'poster' && (`, etc with `{(selectedSlides[currentSlide] || layout) === 'poster' && (` inside the canvas
code = code.replace(/\{layout === 'poster' && \(/g, "{(selectedSlides[currentSlide] || layout) === 'poster' && (");
code = code.replace(/\{layout === 'rundown' && \(/g, "{(selectedSlides[currentSlide] || layout) === 'rundown' && (");
code = code.replace(/\{layout === 'ad' && \(/g, "{(selectedSlides[currentSlide] || layout) === 'ad' && (");
code = code.replace(/\{layout === 'gears' && \(/g, "{(selectedSlides[currentSlide] || layout) === 'gears' && (");
code = code.replace(/\{layout === 'rules' && \(/g, "{(selectedSlides[currentSlide] || layout) === 'rules' && (");
code = code.replace(/\{layout === 'flag' && \(/g, "{(selectedSlides[currentSlide] || layout) === 'flag' && (");
code = code.replace(/\{layout === 'board' && \(/g, "{(selectedSlides[currentSlide] || layout) === 'board' && (");
code = code.replace(/\{layout === 'promo' && \(/g, "{(selectedSlides[currentSlide] || layout) === 'promo' && ("); // Just in case we add promo

fs.writeFileSync('src/admin/TripPosterGenerator.tsx', code);
