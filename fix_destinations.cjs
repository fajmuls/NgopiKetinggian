const fs = require('fs');
let code = fs.readFileSync('src/admin/DestinationsAdmin.tsx', 'utf8');

const targetStart = "return (\n    <div className=\"space-y-6\">\n       <div className=\"flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 bg-white p-4 rounded-lg border border-art-text/20\">";

const replacement = `return (
    <div className="space-y-6">
       <div className="bg-gradient-to-br from-orange-50 to-white border-2 border-art-text rounded-3xl p-6 shadow-[8px_8px_0px_0px_#1a1a1a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-art-orange text-white rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#1a1a1a]">
               <MapPin size={20} className="drop-shadow-sm" />
             </div>
             <div>
               <h3 className="text-lg font-black uppercase text-art-text tracking-tight leading-tight">Destinasi & Durasi</h3>
               <p className="text-[10px] font-bold text-art-text/40 uppercase">Kelola destinasi, via jalur, dan harga private trip</p>
             </div>
        </div>
        <div className="flex flex-wrap gap-2">`;

code = code.replace("return (\n    <div className=\"space-y-6\">\n       <div className=\"flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 bg-white p-4 rounded-lg border border-art-text/20\">\n        <div className=\"flex items-center gap-3\">\n          <p className=\"text-xs font-bold uppercase text-art-text/60 font-black\">Destinasi & Durasi Trip</p>\n        </div>\n        <div className=\"flex flex-wrap gap-2\">\n          <button onClick={() => {", replacement + "\n          <button onClick={() => {");

fs.writeFileSync('src/admin/DestinationsAdmin.tsx', code);
console.log("Replaced DestinationsAdmin");
