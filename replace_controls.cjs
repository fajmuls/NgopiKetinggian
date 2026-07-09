const fs = require('fs');

let code = fs.readFileSync('src/admin/TripPosterGenerator.tsx', 'utf8');

const replacement = `{/* Additional Controls based on Layout */}
            {layout === 'poster' && (
              <div className="space-y-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Opsi Desain Poster</label>
                <div className="grid grid-cols-5 gap-1 pt-1">
                  {[1,2,3,4,5].map((d) => (
                    <button
                      key={d}
                      onClick={() => setPosterDesign(d)}
                      className={\`py-2 rounded-xl text-[9px] font-black border-2 transition-all \${posterDesign === d ? 'border-art-orange bg-orange-50 text-art-orange' : 'border-gray-200 bg-white text-gray-400'}\`}
                    >
                      D{d}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {(layout === 'rundown' || layout === 'ad') && (
               <div className="space-y-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Pilih Slide</label>
                  <div className="grid grid-cols-2 gap-2">
                     {(layout === 'rundown' ? ['poster', 'rundown', 'gears', 'rules', 'ad'] : ['ad', 'rundown', 'promo']).map(slideId => (
                        <label key={slideId} className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                           <input 
                             type="checkbox" 
                             checked={selectedSlides.includes(slideId)}
                             onChange={(e) => {
                               if (e.target.checked) setSelectedSlides([...selectedSlides, slideId]);
                               else setSelectedSlides(selectedSlides.filter(s => s !== slideId));
                             }}
                             className="accent-art-orange"
                           />
                           {slideId.toUpperCase()}
                        </label>
                     ))}
                  </div>
               </div>
            )}

            {layout === 'flag' && (
              <div className="space-y-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Opsi Desain Bendera</label>
                <div className="grid grid-cols-5 gap-1 pt-1">
                  {[1,2,3,4,5].map((d) => (
                    <button
                      key={d}
                      onClick={() => setFlagDesign(d)}
                      className={\`py-2 rounded-xl text-[9px] font-black border-2 transition-all \${flagDesign === d ? 'border-art-orange bg-orange-50 text-art-orange' : 'border-gray-200 bg-white text-gray-400'}\`}
                    >
                      D{d}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2 pt-2">
                   <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={flagShowLogo} onChange={e => setFlagShowLogo(e.target.checked)} className="accent-art-orange" />
                      Tampilkan Logo Utama
                   </label>
                   <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={flagShowMountain} onChange={e => setFlagShowMountain(e.target.checked)} className="accent-art-orange" />
                      Tampilkan Nama Gunung/MDPL
                   </label>
                </div>
              </div>
            )}

            {layout === 'board' && (
              <div className="space-y-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Opsi Desain Papan</label>
                <div className="grid grid-cols-5 gap-1 pt-1">
                  {[1,2,3,4,5].map((d) => (
                    <button
                      key={d}
                      onClick={() => setBoardDesign(d)}
                      className={\`py-2 rounded-xl text-[9px] font-black border-2 transition-all \${boardDesign === d ? 'border-art-orange bg-orange-50 text-art-orange' : 'border-gray-200 bg-white text-gray-400'}\`}
                    >
                      D{d}
                    </button>
                  ))}
                </div>
                <div className="pt-2 space-y-2">
                   <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={boardShowMountain} onChange={e => setBoardShowMountain(e.target.checked)} className="accent-art-orange" />
                      Tampilkan Nama Gunung
                   </label>
                   <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Deskripsi Papan</label>
                   <textarea className="w-full text-xs p-2 border rounded-xl outline-none focus:border-art-orange" rows={3} value={boardDescription} onChange={e => setBoardDescription(e.target.value)} />
                </div>
              </div>
            )}
`;

const regex = /\{\/\* Additional Controls \*\/\}[\s\S]*?(?=\{\/\* Ratio Selector \*\/)/;
code = code.replace(regex, replacement);

fs.writeFileSync('src/admin/TripPosterGenerator.tsx', code);
