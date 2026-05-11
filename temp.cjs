const fs = require('fs');
let content = fs.readFileSync('src/AdminPanel.tsx', 'utf-8');
const s1 = fs.readFileSync('r1.txt', 'utf-8');
const s2 = fs.readFileSync('r2.txt', 'utf-8');

// remove them from bottom
content = content.replace(s1, '');
content = content.replace(s2, '');

let newS1 = s1.replace(/1\. Initiate Rundown PDF/g, 'Initiate Rundown PDF')
  .replace(/2\. Edit Teks Itinerary/g, 'Edit Teks Itinerary')
  .replace(/3\. Visibility PDF Rundown/g, 'Visibility PDF Rundown');

// Update Review Rundown styling
const reviewBtnRegex = /<button [\s\S]*?<Eye size=\{14\} \/> 4\. Review Rundown\s*<\/button>/;
const newBtn = `<button 
                      type="button"
                      className="bg-white border border-art-text/20 text-art-text px-3 py-1.5 rounded-lg text-[8px] font-black uppercase hover:bg-art-bg transition-all shadow-sm flex items-center gap-1.5"
                      onClick={() => {
                        const rundownHtml = ot.rundownText || "Belum ada teks rundown.";
                        const title = ot.name ? \`\${ot.name} - \${ot.duration}\` : "Trip Baru";
                        customAlert(
                          <div className="text-left w-full space-y-4">
                            <div className="border-b-2 border-art-text pb-2">
                              <h3 className="font-black uppercase text-xs">Preview Rundown: {title}</h3>
                            </div>
                            <div className="max-h-64 overflow-y-auto no-scrollbar pr-2 text-[10px] font-medium leading-relaxed whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded-xl border border-art-text/5">
                              {rundownHtml}
                            </div>
                            {ot.rundownPdf && (
                              <div className="flex items-center gap-2 text-art-green font-black uppercase text-[8px]">
                                <CheckCircle size={10} /> PDF Tersedia di: <a href={ot.rundownPdf} target="_blank" rel="noreferrer" className="underline truncate max-w-[200px]">{ot.rundownPdf}</a>
                              </div>
                            )}
                          </div>,
                          "Review Rundown"
                        );
                      }}
                   >
                      <Eye size={12} /> Review Rundown
                   </button>`;

newS1 = newS1.replace(reviewBtnRegex, newBtn);

// Insert just after expandedIndexes
// let's insert it before Layer 1
const targetStr = 'Layer 1: Mountain + Difficulty';

const pos = content.indexOf(targetStr);

if (pos === -1) {
   console.error('Cannot find insertion pos');
} else {
   const before = content.substring(0, content.lastIndexOf('\n', pos));
   let insertMark = content.substring(content.lastIndexOf('\n', pos), pos + targetStr.length);
   const after = content.substring(pos + targetStr.length);
   
   content = before + '\n' + newS1 + "\n" + s2 + "\n" + insertMark + after;
   fs.writeFileSync('src/AdminPanel.tsx', content);
   console.log('Success');
}
