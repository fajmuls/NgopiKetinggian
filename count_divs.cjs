const fs = require('fs');
let code = fs.readFileSync('src/admin/WebSettingsAdmin.tsx', 'utf8');

const startStr = "export const FacilitiesAdmin =";
const endStr = "export const PromoCodesAdmin =";

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

const subcode = code.substring(startIndex, endIndex);

const divOpenMatch = subcode.match(/<div/g);
const divCloseMatch = subcode.match(/<\/div>/g);

console.log("Open:", divOpenMatch ? divOpenMatch.length : 0);
console.log("Close:", divCloseMatch ? divCloseMatch.length : 0);
