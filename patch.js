import fs from 'fs';
const appPath = './src/App.tsx';
let data = fs.readFileSync(appPath, 'utf8');
const output = fs.readFileSync('output.json', 'utf8');

data = data.replace(/const destinationsData = \[\s*\{[\s\S]*?\];\n\nconst heroSlides/, `const destinationsData = ${output};\n\nconst heroSlides`);

fs.writeFileSync(appPath, data);
