const fs = require('fs');
let code = fs.readFileSync('src/admin/WebSettingsAdmin.tsx', 'utf8');

const targetStr = `<div className="flex justify-between bg-white p-4 rounded-lg border border-art-text/20">
        <p className="text-xs font-bold uppercase text-art-text/60">Fasilitas Trip</p>
        <div className="flex gap-2">`;

const replacementStr = `<div className="bg-gradient-to-br from-orange-50 to-white border-2 border-art-text rounded-3xl p-6 shadow-[8px_8px_0px_0px_#1a1a1a]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-art-orange text-white rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#1a1a1a]">
               <Coffee size={20} className="drop-shadow-sm" />
             </div>
             <div>
               <h3 className="text-lg font-black uppercase text-art-text tracking-tight leading-tight">Fasilitas & Harga</h3>
               <p className="text-[10px] font-bold text-art-text/40 uppercase">Atur opsi fasilitas include dan exclude</p>
             </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/admin/WebSettingsAdmin.tsx', code);
console.log("Replaced FacilitiesAdmin");
