const fs = require('fs');
let lines = fs.readFileSync('src/admin/WebSettingsAdmin.tsx', 'utf8').split('\n');

const index = lines.findIndex(l => l.includes('export const PromoCodesAdmin'));
if (index > -1) {
    let returnIdx = index - 1;
    while (!lines[returnIdx].includes('  )')) {
        returnIdx--;
    }
    
    // add one more </div> before )
    lines.splice(returnIdx, 0, '      </div>');
    
    fs.writeFileSync('src/admin/WebSettingsAdmin.tsx', lines.join('\n'));
    console.log("Added one more </div>");
}
