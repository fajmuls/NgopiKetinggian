import fs from 'fs';

const rawMountains = [
  { name: "Gunung Prau", height: "2.590 mdpl", region: "Jawa Tengah", paths: ["Via Wates", "Via Patakbanteng"] },
  { name: "Gunung Kembang", height: "2.340 mdpl", region: "Jawa Tengah", paths: ["Via Lengkong"] },
  { name: "Gunung Bismo", height: "2.365 mdpl", region: "Jawa Tengah", paths: ["Via Sikunang"] },
  { name: "Gunung Kembang + Bismo", height: "2.365 mdpl", region: "Jawa Tengah", paths: ["Via Lengkong & Sikunang"] },
  { name: "Gunung Merbabu", height: "3.142 mdpl", region: "Jawa Tengah", paths: ["Via Selo", "Via Thekelan", "Via Swanting"] },
  { name: "Gunung Slamet", height: "3.432 mdpl", region: "Jawa Tengah", paths: ["Via Bambangan", "Via Guci"] },
  { name: "Gunung Sindoro", height: "3.136 mdpl", region: "Jawa Tengah", paths: ["Via Kledung"] },
  { name: "Gunung Sumbing", height: "3.371 mdpl", region: "Jawa Tengah", paths: ["Via Garung", "Via Gajahmungkur"] },
  { name: "Gunung Lawu", height: "3.265 mdpl", region: "Jawa Timur", paths: ["Via Candi Cetho", "Via Cemoro Sewu"] },
  { name: "Gunung Ciremai", height: "3.078 mdpl", region: "Jawa Barat", paths: ["Via Apuy", "Via Sadarehe"] },
  { name: "Gunung Papandayan", height: "2.665 mdpl", region: "Jawa Barat", paths: ["Via Camp David"] },
  { name: "Gunung Gede", height: "2.958 mdpl", region: "Jawa Barat", paths: ["Via Putri", "Via Cibodas"] },
  { name: "Gunung Pangrango", height: "3.019 mdpl", region: "Jawa Barat", paths: ["Via Cibodas"] },
  { name: "Gunung Salak", height: "2.211 mdpl", region: "Jawa Barat", paths: ["Via Cidahu"] },
  { name: "Gunung Semeru", height: "3.676 mdpl", region: "Jawa Timur", paths: ["Via Ranu Pani"] },
  { name: "Gunung Rinjani", height: "3.726 mdpl", region: "NTB", paths: ["Via Sembalun", "Via Senaru"] }
];

const destinationsData = rawMountains.map(m => {
  return {
    id: m.name.toLowerCase().replace(/\s+/g, '-'),
    name: m.name,
    isActive: true,
    region: m.region,
    height: m.height,
    desc: `Petualangan premium di ${m.name}.`,
    image: "https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?q=80&w=2070&auto=format&fit=crop",
    locationTag: "Basecamp",
    difficulty: "Menengah",
    mepo: "Basecamp",
    kuota: "Min 2 - Max 12 Pax",
    beans: "Arabica Blend",
    paths: m.paths.map(pathName => {
      let basePrice = m.height.startsWith("3.") ? 900 : 700;
      if (m.name === "Gunung Rinjani" || m.name === "Gunung Semeru") basePrice = 1800; // special high prices
      return {
        name: pathName,
        durations: [
          { label: "1H (Tektok)", price: basePrice - 200, originalPrice: basePrice - 100 },
          { label: "2H 1M", price: basePrice, originalPrice: basePrice + 150 },
          { label: "3H 2M", price: basePrice + 300, originalPrice: basePrice + 450 }
        ]
      };
    })
  };
});

fs.writeFileSync('output.json', JSON.stringify(destinationsData, null, 2));
