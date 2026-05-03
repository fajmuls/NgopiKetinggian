import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const destinationsData = \[[\s\S]*?\];\s*const FilterButton/;

// I just want to replace the durations, difficulty, etc.
// But wait, the user wants me to add "openTripsData" as well.

const newData = `const openTripsData = [
  {
    "id": "ot-prau-1",
    "name": "Gunung Prau",
    "region": "Jawa Tengah",
    "height": "2.590 mdpl",
    "desc": "Open Trip spesial akhir pekan Gunung Prau dengan tim berpengalaman.",
    "image": "https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?q=80&w=2070&auto=format&fit=crop",
    "difficulty": "Pemula",
    "mepo": "Basecamp Patakbanteng",
    "kuota": "Sisa 5 Seat dari 12",
    "beans": "Arabica",
    "jadwal": "14-15 Agustus 2026",
    "path": "Patakbanteng",
    "duration": "2H 1M",
    "price": 650,
    "originalPrice": 800
  }
];

const FilterButton`;

// Actually, let's just make smaller edits using sed/regex.
