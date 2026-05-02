import fs from 'fs';
const list = `GN PRAU WATES
GN PRAU PATAKBANTENG
GN KEMBANG LENGKONG
GN BISMO SIKUNANG
GN KEMBANG + BISMO
GN MERBABU SELO
GN MERBABU THEKELAN
GN MERBABU SWANTING
GN SLAMET BAMBANGAN
GN SLAMET GUCI
GN SINDORO KLEDUNG
GN SUMBING GARUNG
GN SUMBING GAJAHMUNGKUR
GN LAWU CANDI CETHO
GN CIREMAI APUY
GN CIREMAI SADAREHE
GN PAPANDAYAN CAMP
GN GEDE PUTRI
GN PANGRANGO CIBODAS
GN SALAK
GN SEMERU
GN RINJANI`;

const mountains = list.split('\n').filter(Boolean).map(line => {
  const name = line.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  return {
    id: line.replace(/\s+/g, '-').toLowerCase(),
    name: name.replace('Gn', 'Gunung'),
    isActive: true,
    region: 'Jawa',
    height: '2.000 mdpl',
    desc: 'Deskripsi perjalanan untuk ' + name + '. Anda dapat mengedit ini di panel admin.',
    image: 'https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?q=80&w=2070&auto=format&fit=crop',
    locationTag: 'Basecamp',
    difficulty: 'Menengah',
    mepo: 'Basecamp',
    kuota: 'Min 2 - Max 12 Pax',
    beans: 'Arabica',
    durations: [
      { label: "1H (Tektok)", price: 400, originalPrice: 500 },
      { label: "2H 1M", price: 800, originalPrice: 900 },
      { label: "3H 2M", price: 1200, originalPrice: 1400 },
      { label: "4H 3M", price: 1600, originalPrice: 1800 },
      { label: "5H 4M", price: 2000, originalPrice: 2200 }
    ]
  };
});

fs.writeFileSync('output.json', JSON.stringify(mountains, null, 2));
