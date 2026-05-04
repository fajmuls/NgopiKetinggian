const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// The destinations array is huge. We want to vary the prices.
// We can parse the whole text, find prices and increment them slightly based on string index or something.
let destIndex = 0;
const newCode = code.replace(/\{ "label": "(.*?)", "price": 400, "originalPrice": 500 \}/g, (match, p1) => {
    let p = 400 + (destIndex * 15);
    let o = p + 150;
    
    if (p1 === "1H (Tektok)") { p = 350 + (destIndex * 10); o = p + 100; }
    else if (p1 === "2H 1M") { p = 550 + (destIndex * 15); o = p + 200; }
    else if (p1 === "3H 2M") { p = 800 + (destIndex * 20); o = p + 250; }
    else if (p1 === "4H 3M") { p = 1100 + (destIndex * 25); o = p + 300; }
    else if (p1 === "5H 4M") { p = 1400 + (destIndex * 30); o = p + 400; destIndex++; } // increment on last item
    else { p+=50; o+=100; }
    return `{ "label": "${p1}", "price": ${p}, "originalPrice": ${o} }`;
});

fs.writeFileSync('src/App.tsx', newCode);
console.log("Replaced");
