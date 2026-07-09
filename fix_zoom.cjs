const fs = require('fs');
let code = fs.readFileSync('src/admin/TripPosterGenerator.tsx', 'utf8');

if (!code.includes('const [rotation, setRotation] = useState(0);')) {
   code = code.replace(
      /const \[zoomScale, setZoomScale\] = useState\(1\);/,
      `const [zoomScale, setZoomScale] = useState(1);
  const [rotation, setRotation] = useState(0);`
   );
   
   // Apply rotation to the wrapper
   code = code.replace(
      /transform: \`scale\(\$\{zoomScale\}\)\`/,
      "transform: `scale(${zoomScale}) rotate(${rotation}deg)`"
   );
   
   // Add Zoom/Rotate controls
   const statusTagRegex = /\{\/\* Status indicator tag \*\/\}/;
   code = code.replace(statusTagRegex, 
   `{/* Image Viewer Controls (Zoom/Rotate) */}
            <div className="absolute top-20 right-6 flex flex-col gap-2 z-50">
               <button onClick={() => setZoomScale(z => Math.min(z + 0.2, 3))} className="w-10 h-10 rounded-full bg-black/60 text-white backdrop-blur-md flex items-center justify-center shadow-lg border border-white/10 hover:bg-black/80 transition-all">
                  <span className="text-xl font-bold">+</span>
               </button>
               <button onClick={() => setZoomScale(z => Math.max(z - 0.2, 0.5))} className="w-10 h-10 rounded-full bg-black/60 text-white backdrop-blur-md flex items-center justify-center shadow-lg border border-white/10 hover:bg-black/80 transition-all">
                  <span className="text-xl font-bold">-</span>
               </button>
               <button onClick={() => setRotation(r => r + 90)} className="w-10 h-10 rounded-full bg-black/60 text-white backdrop-blur-md flex items-center justify-center shadow-lg border border-white/10 hover:bg-black/80 transition-all">
                  <RotateCcw size={16} />
               </button>
            </div>
            
            {/* Status indicator tag */}`);
}
fs.writeFileSync('src/admin/TripPosterGenerator.tsx', code);
