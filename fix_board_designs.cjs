const fs = require('fs');
let code = fs.readFileSync('src/admin/TripPosterGenerator.tsx', 'utf8');

const regex = /\{\/\* LAYOUT G: PAPAN.*?\{selectedSlides\[currentSlide\].*?'board' && \(\s*<div className="relative z-10 flex flex-col h-full.*?<\/div>\s*<\/div>\s*\)\}/s;

const replacement = `{/* LAYOUT G: PAPAN (Summit Sign Board / Papan Puncak Foto) */}
                    {(selectedSlides[currentSlide] || layout) === 'board' && (
                      <div className={\`relative z-10 flex flex-col h-full p-[8%] justify-between items-center text-center w-full rounded-2xl overflow-hidden \${boardDesign === 2 ? 'bg-green-950/40' : boardDesign === 3 ? 'bg-orange-950/40' : boardDesign === 4 ? 'bg-black/20' : boardDesign === 5 ? 'bg-stone-900/40' : 'bg-amber-950/40'}\`}>
                        
                        {/* Board Styling */}
                        <div className={\`absolute inset-2 border-4 rounded-2xl shadow-2xl flex flex-col justify-between p-6 overflow-hidden \${
                          boardDesign === 2 ? 'border-green-600 bg-green-900/90' :
                          boardDesign === 3 ? 'border-orange-800 bg-[#3d2314]/90' :
                          boardDesign === 4 ? 'border-white/30 bg-white/10 backdrop-blur-md' :
                          boardDesign === 5 ? 'border-stone-500 bg-stone-800/95' :
                          'border-amber-900 bg-amber-950/90'
                        }\`}>
                          
                          {/* Inner details */}
                          {boardDesign === 1 && (
                            <>
                               <div className="absolute inset-0 opacity-10 bg-gradient-to-b from-transparent via-amber-500/10 to-transparent pointer-events-none"></div>
                               <div className="absolute left-0 right-0 top-1/3 h-[2px] bg-amber-900/50"></div>
                               <div className="absolute left-0 right-0 top-2/3 h-[2px] bg-amber-900/50"></div>
                               <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-yellow-600/80 border border-yellow-800 shadow-inner flex items-center justify-center text-[5px] text-yellow-900 font-bold">+</div>
                               <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-yellow-600/80 border border-yellow-800 shadow-inner flex items-center justify-center text-[5px] text-yellow-900 font-bold">+</div>
                               <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-yellow-600/80 border border-yellow-800 shadow-inner flex items-center justify-center text-[5px] text-yellow-900 font-bold">+</div>
                               <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-yellow-600/80 border border-yellow-800 shadow-inner flex items-center justify-center text-[5px] text-yellow-900 font-bold">+</div>
                            </>
                          )}
                          
                          {boardDesign === 2 && (
                            <div className="absolute inset-1 border border-green-500/50 rounded-xl pointer-events-none"></div>
                          )}

                          {boardDesign === 3 && (
                            <>
                               <div className="absolute inset-0 border-[8px] border-[#2b170c] rounded-xl pointer-events-none"></div>
                               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-2 bg-orange-700/50"></div>
                            </>
                          )}
                          
                          {boardDesign === 5 && (
                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')] pointer-events-none"></div>
                          )}

                          {/* Board Header */}
                          <div className={\`flex justify-between items-center border-b pb-2 z-10 w-full \${
                            boardDesign === 2 ? 'border-green-500/30' :
                            boardDesign === 4 ? 'border-white/20' :
                            boardDesign === 5 ? 'border-stone-500/40' :
                            'border-yellow-600/30'
                          }\`}>
                            <span className={\`text-[7.5px] font-black uppercase tracking-[0.2em] \${
                              boardDesign === 2 ? 'text-green-300' :
                              boardDesign === 4 ? 'text-white' :
                              boardDesign === 5 ? 'text-stone-300' :
                              'text-yellow-500'
                            }\`}>Puncak Sejati</span>
                            <div className={\`flex items-center gap-1 \${
                              boardDesign === 2 ? 'text-green-300' :
                              boardDesign === 4 ? 'text-white' :
                              boardDesign === 5 ? 'text-stone-300' :
                              'text-yellow-500'
                            }\`}>
                              <Compass size={10} />
                              <span className="text-[7px] font-bold">SAVER AREA</span>
                            </div>
                          </div>

                          {/* Main Board Content */}
                          <div className="my-auto space-y-2 z-10">
                            <h4 className={\`text-[10px] font-black uppercase tracking-[0.3em] \${
                              boardDesign === 2 ? 'text-green-400' :
                              boardDesign === 4 ? 'text-white/70' :
                              boardDesign === 5 ? 'text-stone-400' :
                              'text-yellow-600'
                            }\`}>WELCOME TO</h4>
                            {boardShowMountain && <h3 className={\`font-extrabold uppercase tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] \${
                              boardDesign === 2 ? 'text-white text-3xl md:text-4xl font-sans' :
                              boardDesign === 3 ? 'text-orange-200 text-3xl md:text-5xl font-serif' :
                              boardDesign === 4 ? 'text-white text-4xl md:text-5xl font-sans tracking-tighter' :
                              boardDesign === 5 ? 'text-stone-200 text-3xl md:text-4xl font-mono' :
                              'text-yellow-50 text-3xl md:text-4xl font-serif'
                            }\`}>
                              {boardDesign === 3 ? '' : '⛰️'} {(mountainName.toLowerCase().startsWith('gunung') ? mountainName : 'GUNUNG ' + mountainName).toUpperCase()} {boardDesign === 3 ? '' : '⛰️'}
                            </h3>}
                            <div className={\`inline-block px-4 py-1.5 rounded-lg text-lg md:text-xl font-black tracking-widest shadow-md \${
                              boardDesign === 2 ? 'bg-white text-green-900' :
                              boardDesign === 3 ? 'bg-orange-800 text-orange-100 border border-orange-700' :
                              boardDesign === 4 ? 'bg-white/20 text-white backdrop-blur-md' :
                              boardDesign === 5 ? 'bg-stone-700 text-stone-200 border-2 border-stone-600' :
                              'bg-yellow-500 text-black'
                            }\`}>
                              {mountainMdpl}
                            </div>
                            <p className={\`text-[8px] font-black tracking-[0.15em] uppercase \${
                              boardDesign === 2 ? 'text-green-300' :
                              boardDesign === 4 ? 'text-white/80' :
                              boardDesign === 5 ? 'text-stone-400' :
                              'text-yellow-500/80'
                            }\`}>
                              Jalur Pendakian Resmi Via {customVia}
                            </p>
                            {boardDescription && (
                                <p className={\`text-[7px] italic mt-4 px-4 \${
                                    boardDesign === 2 ? 'text-green-200' :
                                    boardDesign === 4 ? 'text-white/70' :
                                    boardDesign === 5 ? 'text-stone-400' :
                                    'text-yellow-600'
                                }\`}>
                                   "{boardDescription}"
                                </p>
                            )}
                          </div>

                          {/* Board Footer */}
                          <div className={\`flex justify-between items-center pt-2 border-t text-[7px] font-black uppercase z-10 w-full \${
                            boardDesign === 2 ? 'border-green-500/30 text-green-400' :
                            boardDesign === 4 ? 'border-white/20 text-white/70' :
                            boardDesign === 5 ? 'border-stone-500/40 text-stone-400' :
                            'border-yellow-600/30 text-yellow-600/80'
                          }\`}>
                            <span>Tgl: {tripDate}</span>
                            <span>@ngopi.dketinggian</span>
                          </div>
                        </div>
                      </div>
                    )}`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/admin/TripPosterGenerator.tsx', code);
