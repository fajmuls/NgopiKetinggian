const fs = require('fs');

let code = fs.readFileSync('src/admin/TripPosterGenerator.tsx', 'utf8');

code = code.replace(/\{postCategory\.toUpperCase\(\)\}/g, "{layout.toUpperCase()}");

const regexDotsAndRightBtn = /\{\/\* Right Button \*\/\}[\s\S]*?(?=\{\/\* Secondary Action Toolbar shown underneath the preview \*\/)/;

const newDotsAndControls = `
              {/* Slide Navigation & Dots */}
              {selectedSlides.length > 1 && (
                <div className="flex items-center gap-4 mt-5 z-20">
                  <button 
                    onClick={() => setCurrentSlide((prev) => (prev > 0 ? prev - 1 : selectedSlides.length - 1))}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center transition-all shadow-lg border border-white/10 shrink-0 hover:scale-105 active:scale-95"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex items-center gap-1.5">
                    {selectedSlides.map((s, idx) => {
                      const isActive = currentSlide === idx;
                      return (
                        <button
                          key={s}
                          onClick={() => setCurrentSlide(idx)}
                          className={\`h-2 rounded-full transition-all duration-300 \${isActive ? 'w-6 bg-art-orange shadow-md' : 'w-2 bg-white/30 hover:bg-white/60'}\`}
                        />
                      );
                    })}
                  </div>
                  <button 
                    onClick={() => setCurrentSlide((prev) => (prev < selectedSlides.length - 1 ? prev + 1 : 0))}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center transition-all shadow-lg border border-white/10 shrink-0 hover:scale-105 active:scale-95"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
`;

code = code.replace(regexDotsAndRightBtn, newDotsAndControls);

fs.writeFileSync('src/admin/TripPosterGenerator.tsx', code);
