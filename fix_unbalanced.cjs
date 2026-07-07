const fs = require('fs');
let code = fs.readFileSync('src/admin/WebSettingsAdmin.tsx', 'utf8');

// Find the line with `</div>` right before `<div className="pt-6 border-t border-art-text/10 space-y-4">`
const lines = code.split('\n');
const targetLineIndex = lines.findIndex(line => line.includes('<div className="pt-6 border-t border-art-text/10 space-y-4">'));

if (targetLineIndex !== -1) {
    // Delete the `</div>` just before it
    lines.splice(targetLineIndex - 2, 1);
    fs.writeFileSync('src/admin/WebSettingsAdmin.tsx', lines.join('\n'));
    console.log("Deleted extra </div>");
} else {
    console.log("Could not find target line");
}
