const fs = require('fs');
let code = fs.readFileSync('src/admin/TripPosterGenerator.tsx', 'utf8');

// Add state variables
if (!code.includes('const [infoDesign')) {
    code = code.replace(
        /const \[posterDesign, setPosterDesign\] = useState<number>\(1\);/,
        `const [posterDesign, setPosterDesign] = useState<number>(1);
  const [infoDesign, setInfoDesign] = useState<number>(1);
  const [adDesign, setAdDesign] = useState<number>(1);`
    );
}

// Add controls
const infoAdControls = `
            {['rundown', 'gears', 'rules'].includes(selectedSlides[currentSlide] || layout) && (
              <div className="space-y-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 mt-3">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Opsi Desain Info</label>
                <div className="grid grid-cols-5 gap-1 pt-1">
                  {[1,2,3,4,5].map((d) => (
                    <button
                      key={d}
                      onClick={() => setInfoDesign(d)}
                      className={\`py-2 rounded-xl text-[9px] font-black border-2 transition-all \${infoDesign === d ? 'border-art-orange bg-orange-50 text-art-orange' : 'border-gray-200 bg-white text-gray-400'}\`}
                    >
                      D{d}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {(selectedSlides[currentSlide] || layout) === 'ad' && (
              <div className="space-y-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 mt-3">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Opsi Desain Promo</label>
                <div className="grid grid-cols-5 gap-1 pt-1">
                  {[1,2,3,4,5].map((d) => (
                    <button
                      key={d}
                      onClick={() => setAdDesign(d)}
                      className={\`py-2 rounded-xl text-[9px] font-black border-2 transition-all \${adDesign === d ? 'border-art-orange bg-orange-50 text-art-orange' : 'border-gray-200 bg-white text-gray-400'}\`}
                    >
                      D{d}
                    </button>
                  ))}
                </div>
              </div>
            )}
`;

code = code.replace(
    /\{\(layout === 'rundown' \|\| layout === 'ad'\) && \(/,
    infoAdControls + "\n            {(layout === 'rundown' || layout === 'ad') && ("
);

fs.writeFileSync('src/admin/TripPosterGenerator.tsx', code);
