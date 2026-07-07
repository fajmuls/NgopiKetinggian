const fs = require('fs');
let code = fs.readFileSync('src/admin/TeamAndLeadersAdmin.tsx', 'utf8');

const targetStr = `<div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border-2 border-art-text space-y-4">
        <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
           <Edit2 size={16} className="text-art-orange" /> Edit Teks Trip Leader (Homepage)
        </h3>`;

const replacementStr = `<div className="space-y-6">
      <div className="bg-gradient-to-br from-orange-50 to-white border-2 border-art-text rounded-3xl p-6 shadow-[8px_8px_0px_0px_#1a1a1a]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 border-b border-art-text/10 pb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-art-orange text-white rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#1a1a1a]">
               <Users size={20} className="drop-shadow-sm" />
             </div>
             <div>
               <h3 className="text-lg font-black uppercase text-art-text tracking-tight leading-tight">Trip Leader</h3>
               <p className="text-[10px] font-bold text-art-text/40 uppercase">Kelola profil pemandu perjalanan</p>
             </div>
          </div>
          <button onClick={handleSave} className="w-full sm:w-auto bg-art-orange text-white px-6 py-4 sm:py-3 min-h-[44px] rounded-xl text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">Simpan Konten</button>
        </div>`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/admin/TeamAndLeadersAdmin.tsx', code);
console.log("Replaced TeamAndLeadersAdmin header 1");
