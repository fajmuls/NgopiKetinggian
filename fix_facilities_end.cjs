const fs = require('fs');
let lines = fs.readFileSync('src/admin/WebSettingsAdmin.tsx', 'utf8').split('\n');

// we want to fix around line 1248-1251
const index = lines.findIndex(l => l.includes('export const PromoCodesAdmin'));
if (index > -1) {
    // go up until we hit the '  )'
    let returnIdx = index - 1;
    while (!lines[returnIdx].includes('  )')) {
        returnIdx--;
    }
    // lines from returnIdx to index should be just `  }\n\n`
    // and before `returnIdx` should be `      </div>\n    </div>`
    lines[returnIdx - 2] = '      </div>';
    lines[returnIdx - 1] = '    </div>';
    lines[returnIdx]     = '  )';
    lines[returnIdx + 1] = '}';
    lines.splice(returnIdx + 2, index - (returnIdx + 2));
    
    fs.writeFileSync('src/admin/WebSettingsAdmin.tsx', lines.join('\n'));
    console.log("Fixed FacilitiesAdmin end");
}
