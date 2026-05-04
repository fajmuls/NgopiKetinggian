const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const diffs = ["Pemula", "Pemula Menengah", "Menengah", "Menengah Ahli", "Ahli", "Sangat Ahli"];
let dIdx = 1;
const newCode = code.replace(/"difficulty": "Menengah"/g, (match) => {
    let d = diffs[dIdx % diffs.length];
    dIdx++;
    return `"difficulty": "${d}"`;
});

fs.writeFileSync('src/App.tsx', newCode);
console.log("Replaced");
