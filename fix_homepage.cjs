const fs = require('fs');
let code = fs.readFileSync('src/admin/WebSettingsAdmin.tsx', 'utf8');

const targetStr = `<div className="flex items-center gap-3 mb-2 pb-4 border-b border-art-text/10">
        <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
           <Edit2 size={16} className="text-art-orange" /> Edit Teks Hero Utama
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">`;

const replacementStr = `<div className="flex items-center gap-3 mb-6 pb-4 border-b border-art-text/10">
        <div className="w-10 h-10 bg-art-orange text-white rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#1a1a1a]">
           <Edit2 size={20} className="drop-shadow-sm" />
        </div>
        <div>
           <h3 className="text-lg font-black uppercase text-art-text tracking-tight leading-tight">Branding & Hero</h3>
           <p className="text-[10px] font-bold text-art-text/40 uppercase">Atur konten utama pada halaman depan</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/admin/WebSettingsAdmin.tsx', code);
console.log("Replaced HomepageAdmin");
