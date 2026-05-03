import fs from 'fs';

let code = fs.readFileSync('src/AdminPanel.tsx', 'utf8');

code = code.replace(/\{ name: "Nama Baru", age: "20 th",/g, '{ name: "Nama Baru", age: "20 th", experience: "Pengalaman X th",');

// Edit age text to experience if we want, currently it says "age: 20 th", let's leave age or rename it to "experience". 
// The user said: "the years of experience should be editable. Currently, it shows 31 years, but I should be able to edit the number of years of experience."
// Actually, earlier the card showed: `<p ...>{leader.age}</p>` but it was actually "age" property storing "Pengalaman 10+ Tahun" maybe? 
// Let's add an input for leader.age.

code = code.replace(/<input className="border p-2 rounded text-sm font-bold w-1\/2 mb-2 block" value=\{leader.name\}/g,
  `<div className="flex gap-2 mb-2"><input className="border p-2 rounded text-sm font-bold w-1/2 block" value={leader.name} onChange={e => {
                  setData(prev => prev.map((item, idx) => idx === i ? { ...item, name: e.target.value } : item));
            }} placeholder="Nama" />
            <input className="border p-2 rounded text-sm font-bold w-1/2 block" value={leader.age} onChange={e => {
                  setData(prev => prev.map((item, idx) => idx === i ? { ...item, age: e.target.value } : item));
            }} placeholder="Pengalaman (cth: Pengalaman 10+ Tahun)" /></div>`);

// I also need to remove the old input for leader.name if I added it above. Let me do exact regex matching.
