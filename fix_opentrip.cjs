const fs = require('fs');
let code = fs.readFileSync('src/admin/OpenTripsAdmin.tsx', 'utf-8');

const tabsHtml = `
              <div className="flex flex-wrap gap-2 mb-4 border-b-2 border-art-text/10 pb-2">
                <button 
                  onClick={() => setActiveTabs(prev => ({ ...prev, [i]: 'basic' }))} 
                  className={\`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all \${(!activeTabs[i] || activeTabs[i] === 'basic') ? 'bg-art-text text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}\`}
                >Info Dasar</button>
                <button 
                  onClick={() => setActiveTabs(prev => ({ ...prev, [i]: 'price' }))} 
                  className={\`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all \${activeTabs[i] === 'price' ? 'bg-art-text text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}\`}
                >Harga & Kuota</button>
                <button 
                  onClick={() => setActiveTabs(prev => ({ ...prev, [i]: 'itinerary' }))} 
                  className={\`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all \${activeTabs[i] === 'itinerary' ? 'bg-art-text text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}\`}
                >Rundown</button>
                <button 
                  onClick={() => setActiveTabs(prev => ({ ...prev, [i]: 'groups' }))} 
                  className={\`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all \${activeTabs[i] === 'groups' ? 'bg-art-text text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}\`}
                >Grup & Manifest</button>
              </div>
`;

code = code.replace(
  /<div className="mt-4 pt-4 border-t-2 border-dashed border-art-text\/10 space-y-4">\s*{\/\* Rundown Section for Open Trip \*\//,
  '<div className="mt-4 pt-4 border-t-2 border-dashed border-art-text/10 space-y-4">\n' + tabsHtml + '\n{/* Rundown Section for Open Trip */'
);

code = code.replace(/\{\/\* Rundown Section for Open Trip \*\/\}/g, '{activeTabs[i] === "itinerary" && (\n<>\n{/* Rundown Section for Open Trip */}');
code = code.replace(/\{\/\* Layer 7: Group Management \(MOVED TO BOTTOM\) \*\/\}/g, '</>\n)}\n{activeTabs[i] === "groups" && (\n<>\n{/* Layer 7: Group Management (MOVED TO BOTTOM) */}');
code = code.replace(/\{\/\* Layer 1: Mountain \+ Difficulty \*\/\}/g, '</>\n)}\n{(!activeTabs[i] || activeTabs[i] === "basic") && (\n<>\n{/* Layer 1: Mountain + Difficulty */}');
code = code.replace(/\{\/\* Layer 4: Capacity \+ Availability \*\/\}/g, '</>\n)}\n{activeTabs[i] === "price" && (\n<>\n{/* Layer 4: Capacity + Availability */}');
code = code.replace(/\{\/\* Layer 7: Leaders & Description \*\/\}/g, '</>\n)}\n{(!activeTabs[i] || activeTabs[i] === "basic") && (\n<>\n{/* Layer 7: Leaders & Description */}');
code = code.replace(/\{\/\* Layer 9: Beans \*\/\}/g, '{/* Layer 9: Beans */}');
code = code.replace(/(<textarea[\s\S]*?placeholder="Beans \/ Tagline \/ Catchphrase"[\s\S]*?\/>\s*<\/div>\s*<\/div>\s*<\/div>)/, '$1\n</>\n)}');

fs.writeFileSync('src/admin/OpenTripsAdmin.tsx', code);
console.log('Modified structure');
