import fs from 'fs';

let content = fs.readFileSync('src/AdminPanel.tsx', 'utf-8');

const s1Start = '              {/* Rundown Section for Open Trip - MOVED TO BOTTOM */}';
const s1End = '               {/* Layer 7: Group Management (MOVED TO BOTTOM) */}';
const s2End = '               {/* Layer 7: Leaders & Description */}';

const p1 = content.indexOf(s1Start);
const p2 = content.indexOf(s1End);
const p3 = content.indexOf(s2End);

let s1 = content.substring(p1, p2);
let s2 = content.substring(p2, p3);

content = content.replace(s1, '');
content = content.replace(s2, '');

let newS1 = s1.replace(/1\. Initiate Rundown PDF/g, 'Initiate Rundown PDF')
  .replace(/2\. Edit Teks Itinerary/g, 'Edit Teks Itinerary')
  .replace(/3\. Visibility PDF Rundown/g, 'Visibility PDF Rundown')
  .replace(/4\. Review Rundown/g, 'Review Rundown');

// Update Review Rundown styling
const reviewBtnRegex = /<button [\s\S]*?<Eye size=\{14\} \/> Review Rundown\s*<\/button>/;
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
                                <CheckCircle size={10} /> PDF Tersedia
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

const tStart = '              {/* Layer 1: Mountain + Difficulty */}';
const tp = content.indexOf(tStart);

const before = content.substring(0, tp);
const after = content.substring(tp);

const finalContent = before + newS1 + "\n" + s2 + "\n" + after;
fs.writeFileSync('src/AdminPanel.tsx', finalContent);
console.log('Fixed');
