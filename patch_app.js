import fs from 'fs';

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

appCode = appCode.replace(/const \[filterDifficulty, setFilterDifficulty\] = useState\('Semua'\);/, `const [filterDifficulty, setFilterDifficulty] = useState('Semua');
  const [filterRegion, setFilterRegion] = useState('Semua');
  const [tripTab, setTripTab] = useState<'open'|'private'>('open');`);

// Find the difficultyOptions and filteredDestinations
appCode = appCode.replace(/const difficultyOptions = \['Semua', 'Pemula', 'Menengah', 'Ahli', 'Sangat Ahli'\];\s+const filteredDestinations = currentDestinations\.filter\(dest => \{[\s\S]*?\}\);/,
`const difficultyOptions = ['Semua', 'Pemula', 'Menengah', 'Ahli', 'Sangat Ahli'];
  const regionOptions = ['Semua', ...Array.from(new Set(currentDestinations.map(d => d.region || 'Jawa').filter(Boolean)))];
  
  const filteredDestinations = currentDestinations.filter(dest => {
    if (dest.isActive === false) return false;
    const matchesDifficulty = filterDifficulty === 'Semua' || dest.difficulty.toLowerCase().includes(filterDifficulty.toLowerCase());
    const matchesRegion = filterRegion === 'Semua' || (dest.region || 'Jawa') === filterRegion;
    const matchesSearch = dest.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          dest.desc.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          dest.locationTag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDifficulty && matchesRegion && matchesSearch;
  });
  
  const currentOpenTrips = config.openTrips || [];
  const filteredOpenTrips = currentOpenTrips.filter((dest: any) => {
    const matchesDifficulty = filterDifficulty === 'Semua' || dest.difficulty?.toLowerCase().includes(filterDifficulty.toLowerCase());
    const matchesRegion = filterRegion === 'Semua' || (dest.region || 'Jawa') === filterRegion;
    const matchesSearch = dest.name?.toLowerCase().includes(searchQuery.toLowerCase()) || dest.mepo?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDifficulty && matchesRegion && matchesSearch;
  });
`);

// Add Open Trip cards and Tab Navigation
appCode = appCode.replace(/<div className="flex justify-center flex-wrap gap-4 mb-16">/,
`<div className="flex justify-center gap-4 mb-8">
              <button 
                onClick={() => setTripTab('open')}
                className={\`px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs transition-all \${tripTab === 'open' ? 'bg-art-orange text-white shadow-lg shadow-art-orange/30' : 'bg-white text-art-text border border-art-text/20 hover:bg-gray-50'}\`}
              >Open Trip</button>
              <button 
                onClick={() => setTripTab('private')}
                className={\`px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs transition-all \${tripTab === 'private' ? 'bg-art-orange text-white shadow-lg shadow-art-orange/30' : 'bg-white text-art-text border border-art-text/20 hover:bg-gray-50'}\`}
              >Private Trip</button>
            </div>
            
            <div className="flex justify-center flex-wrap gap-4 mb-4">
              {regionOptions.map((reg: any) => (
                <button
                  key={reg}
                  onClick={() => { playClick(); setFilterRegion(reg); }}
                  onMouseEnter={playHover}
                  className={\`text-[10px] tracking-widest uppercase font-bold px-6 py-2 rounded-full border-2 transition-all \${filterRegion === reg ? 'bg-art-text text-white border-art-text' : 'bg-white text-art-text border-art-text/20 hover:border-art-text'}\`}
                >
                  {reg}
                </button>
              ))}
            </div>
            
            <div className="flex justify-center flex-wrap gap-4 mb-16">`);

fs.writeFileSync('src/App.tsx', appCode);
