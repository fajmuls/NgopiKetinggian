const fs = require('fs');
let code = fs.readFileSync('src/admin/TeamAndLeadersAdmin.tsx', 'utf8');

const targetStr = `      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-art-text/20">
        <p className="text-xs font-bold text-art-text/60 uppercase">Daftar Trip Leader</p>
        <div className="flex gap-2">`;

const replacementStr = `<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-lg border border-art-text/20 gap-4 mt-6">
        <p className="text-xs font-bold text-art-text/60 uppercase">Daftar Trip Leader</p>
        <div className="flex gap-2 w-full sm:w-auto">`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/admin/TeamAndLeadersAdmin.tsx', code);
console.log("Replaced TeamAndLeadersAdmin header 2");
