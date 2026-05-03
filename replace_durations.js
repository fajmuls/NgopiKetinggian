import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const standardDurations = `"durations": [
          { "label": "1H (Tektok)", "price": 400, "originalPrice": 500 },
          { "label": "2H 1M", "price": 650, "originalPrice": 800 },
          { "label": "3H 2M", "price": 950, "originalPrice": 1100 },
          { "label": "4H 3M", "price": 1300, "originalPrice": 1500 },
          { "label": "5H 4M", "price": 1600, "originalPrice": 1800 }
        ]`;

content = content.replace(/"durations":\s*\[[\s\S]*?\](?=\s*\})/g, standardDurations);

fs.writeFileSync('src/App.tsx', content);
