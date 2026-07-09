const fs = require('fs');

let code = fs.readFileSync('src/admin/TripPosterGenerator.tsx', 'utf8');

// For centered and right-aligned text in Middle: Title Block
code = code.replace(
    /<div className="my-auto space-y-3">/,
    `<div className={\`my-auto space-y-3 \${posterDesign === 2 ? 'text-center flex flex-col items-center' : posterDesign === 3 ? 'text-right flex flex-col items-end' : ''}\`}>`
);

// For the border frame (posterDesign 5)
code = code.replace(
    /\{\(selectedSlides\[currentSlide\] \|\| layout\) === 'poster' && \(\s*<div className="relative z-10 flex flex-col h-full w-full justify-between">/,
    `{(selectedSlides[currentSlide] || layout) === 'poster' && (
       <div className={\`relative z-10 flex flex-col h-full w-full justify-between \${posterDesign === 5 ? 'border-[12px] border-white/20 p-2' : ''}\`}>`
);

fs.writeFileSync('src/admin/TripPosterGenerator.tsx', code);
