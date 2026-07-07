const fs = require('fs');
let code = fs.readFileSync('src/admin/TeamAndLeadersAdmin.tsx', 'utf8');

const targetStr = `      </div>\n      <div className="mt-8 border-t-2 border-dashed border-art-text/20 pt-8">`;
const replacementStr = `      <div className="mt-8 border-t-2 border-dashed border-art-text/20 pt-8">`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/admin/TeamAndLeadersAdmin.tsx', code);
console.log("Reverted TeamAndLeadersAdmin end");
