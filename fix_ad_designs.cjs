const fs = require('fs');
let code = fs.readFileSync('src/admin/TripPosterGenerator.tsx', 'utf8');

const regexAdBorders = /\{\/\* Elegant custom border structures to prevent overlap & keep layout extremely attractive \*\/\}(.*?)\{\/\* Absolute positioned neo-brutalist corner frames for maximum design aesthetic \*\/\}/s;

const replacementAdBorders = `{/* Custom Design Variations based on adDesign */}
                        {adDesign === 1 && (
                            <>
                                <div className="absolute inset-4 border-[3px] pointer-events-none z-20" style={{ borderColor: theme.primary }}></div>
                                <div className="absolute inset-5 border border-dashed pointer-events-none z-20 opacity-40" style={{ borderColor: theme.accent }}></div>
                            </>
                        )}
                        {adDesign === 2 && (
                            <div className="absolute inset-6 border-4 pointer-events-none z-20 shadow-[0_0_20px_rgba(255,255,255,0.2)]" style={{ borderColor: 'white', borderRadius: '2rem' }}></div>
                        )}
                        {adDesign === 3 && (
                            <div className="absolute inset-0 border-[16px] pointer-events-none z-20" style={{ borderColor: theme.primary }}></div>
                        )}
                        {adDesign === 4 && (
                            <>
                                <div className="absolute top-0 bottom-0 left-8 border-l-4 pointer-events-none z-20 opacity-30" style={{ borderColor: theme.accent }}></div>
                                <div className="absolute top-0 bottom-0 right-8 border-r-4 pointer-events-none z-20 opacity-30" style={{ borderColor: theme.accent }}></div>
                            </>
                        )}
                        {adDesign === 5 && (
                            <div className="absolute inset-2 border-[1px] pointer-events-none z-20 rounded-[2.5rem]" style={{ borderColor: theme.accent, boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)' }}></div>
                        )}

                        {/* Absolute positioned neo-brutalist corner frames for maximum design aesthetic */}`;

code = code.replace(regexAdBorders, replacementAdBorders);

// modify neo brutalist corners
code = code.replace(
    /\{\/\* Absolute positioned neo-brutalist corner frames for maximum design aesthetic \*\/\}\s*<div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4".*?<\/div>/s,
    `{/* Corners (Only on adDesign 1 and 3) */}
                        {(adDesign === 1 || adDesign === 3) && (
                            <>
                                <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4" style={{ borderColor: theme.accent }}></div>
                                <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4" style={{ borderColor: theme.accent }}></div>
                                <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4" style={{ borderColor: theme.accent }}></div>
                                <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4" style={{ borderColor: theme.accent }}></div>
                            </>
                        )}`
);

fs.writeFileSync('src/admin/TripPosterGenerator.tsx', code);
