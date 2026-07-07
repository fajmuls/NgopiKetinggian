const fs = require('fs');

let code = fs.readFileSync('src/admin/OpenTripsAdmin.tsx', 'utf-8');

const tabsHtml = `
              <div className="flex flex-wrap gap-2 mb-4 border-b-2 border-art-text/10 pb-2">
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); setActiveTabs(prev => ({ ...prev, [i]: 'basic' })); }} 
                  className={\`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all \${(!activeTabs[i] || activeTabs[i] === 'basic') ? 'bg-art-text text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}\`}
                >Info Dasar</button>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); setActiveTabs(prev => ({ ...prev, [i]: 'price' })); }} 
                  className={\`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all \${activeTabs[i] === 'price' ? 'bg-art-text text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}\`}
                >Harga & Kuota</button>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); setActiveTabs(prev => ({ ...prev, [i]: 'itinerary' })); }} 
                  className={\`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all \${activeTabs[i] === 'itinerary' ? 'bg-art-text text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}\`}
                >Rundown</button>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); setActiveTabs(prev => ({ ...prev, [i]: 'groups' })); }} 
                  className={\`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all \${activeTabs[i] === 'groups' ? 'bg-art-text text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}\`}
                >Grup</button>
                
                <button 
                  type="button"
                  onClick={(e) => {
                     e.preventDefault();
                     customAlert(
                        <div className="space-y-4 w-full">
                           <div className="border-b-2 border-art-text pb-2 flex items-center justify-between">
                              <h3 className="font-black uppercase text-sm">Manifest: {ot.name || '-'}</h3>
                           </div>
                           <div className="max-h-96 overflow-y-auto pr-2 space-y-2">
                              {bookings.filter(b => b.type === 'open' && b.destinasi === ot.name && b.jadwal === ot.jadwal && (b.status === 'processing' || b.status === 'lunas' || b.status === 'selesai' || b.status === 'dp_partial')).map(b => (
                                 <div key={b.id} className="p-3 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-between">
                                    <div>
                                       <div className="font-bold text-xs uppercase text-art-text">{b.nama}</div>
                                       <div className="text-[10px] text-gray-500 font-mono mt-1">{b.nohp}</div>
                                    </div>
                                    <div className="text-right">
                                       <div className="text-[10px] font-black uppercase text-art-orange">{b.peserta} Pax</div>
                                       <a href={\`https://wa.me/\${b.nohp?.replace(/^0/, '62')}\`} target="_blank" className="text-[8px] bg-green-100 text-green-700 px-2 py-1 rounded inline-flex mt-1 uppercase font-bold items-center gap-1 hover:bg-green-200 transition-colors"><MessageCircle size={10}/> Chat</a>
                                    </div>
                                 </div>
                              ))}
                              {bookings.filter(b => b.type === 'open' && b.destinasi === ot.name && b.jadwal === ot.jadwal && (b.status === 'processing' || b.status === 'lunas' || b.status === 'selesai' || b.status === 'dp_partial')).length === 0 && (
                                 <p className="text-center text-xs text-gray-400 py-4 font-bold uppercase tracking-widest">Belum ada peserta</p>
                              )}
                           </div>
                        </div>
                     , "Manifest Peserta");
                  }} 
                  className="px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 flex items-center gap-1 sm:ml-auto"
                ><Users size={12}/> Manifest</button>
              </div>
`;

code = code.replace(
  /<div className="mt-4 pt-4 border-t-2 border-dashed border-art-text\/10 space-y-4">\s*{\/\* Rundown Section for Open Trip \*\//,
  '<div className="mt-4 pt-4 border-t-2 border-dashed border-art-text/10 space-y-4">\n' + tabsHtml + '\n{/* Rundown Section for Open Trip */'
);

// Define wrappers
const wrap = (layerName, tabName) => {
  const isBasic = tabName === 'basic';
  const displayCondition = isBasic ? `(!activeTabs[i] || activeTabs[i] === '${tabName}')` : `activeTabs[i] === '${tabName}'`;
  
  const regex = new RegExp(`({\\/\\* ${layerName} \\*\\/})`, 'g');
  code = code.replace(regex, `<div className={${displayCondition} ? "space-y-4" : "hidden"}>\n$1`);
}

// Wrapping each layer inside a conditionally displayed div
code = code.replace(/\{\/\* Rundown Section for Open Trip \*\/\}/g, `<div className={activeTabs[i] === 'itinerary' ? "space-y-4" : "hidden"}>\n{/* Rundown Section for Open Trip */}`);
// For Rundown we need to close it before Layer 7: Group Management
code = code.replace(/\{\/\* Layer 7: Group Management \(MOVED TO BOTTOM\) \*\/\}/g, `</div>\n<div className={activeTabs[i] === 'groups' ? "space-y-4" : "hidden"}>\n{/* Layer 7: Group Management (MOVED TO BOTTOM) */}`);
// Close Group before Layer 1
code = code.replace(/\{\/\* Layer 1: Mountain \+ Difficulty \*\/\}/g, `</div>\n<div className={(!activeTabs[i] || activeTabs[i] === 'basic') ? "space-y-4" : "hidden"}>\n{/* Layer 1: Mountain + Difficulty */}`);

// We want Layer 1, 2, 3, 8, 9 inside basic.
// We want Layer 4, 5, 7 inside price.

// So:
// Basic div starts at Layer 1.
// At Layer 4, we close Basic, and start Price.
code = code.replace(/\{\/\* Layer 4: Capacity \+ Availability \*\/\}/g, `</div>\n<div className={activeTabs[i] === 'price' ? "space-y-4" : "hidden"}>\n{/* Layer 4: Capacity + Availability */}`);

// At Layer 7 (Leaders), we close Price, and open Basic again? Wait, Layer 7 (Leaders) is part of Price? 
// Let's put Leaders in basic. Wait, we can put Leaders in basic or price. Let's put Leaders in 'basic'.
// So at Layer 7:
code = code.replace(/\{\/\* Layer 7: Leaders & Description \*\/\}/g, `</div>\n<div className={(!activeTabs[i] || activeTabs[i] === 'basic') ? "space-y-4" : "hidden"}>\n{/* Layer 7: Leaders & Description */}`);

// And finally at the very end of the expanded section, we close the last div.
// The end of the expanded section is at `</textarea>` then 3 `</div>`s.
code = code.replace(/(<textarea[\s\S]*?placeholder="Beans \/ Tagline \/ Catchphrase"[\s\S]*?\/>\s*<\/div>\s*<\/div>\s*<\/div>)/, '$1\n</div>');

fs.writeFileSync('src/admin/OpenTripsAdmin.tsx', code);
console.log('Modified tabs');
