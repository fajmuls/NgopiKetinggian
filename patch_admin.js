import fs from 'fs';
const appPath = './src/AdminPanel.tsx';
let data = fs.readFileSync(appPath, 'utf8');

const replacement = `const DestinationsAdmin = ({ config, updateConfig, showToast }: any) => {
  const [data, setData] = useState(JSON.parse(JSON.stringify(config.destinationsData)));
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("Semua");

  const handleSave = () => {
    updateConfig({ destinationsData: data });
    showToast('Tersimpan!');
  };

  const regions = ["Semua", ...Array.from(new Set(data.map((d: any) => d.region || "Jawa")))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-lg border border-art-text/20 gap-3">
        <p className="text-xs font-bold text-art-text/60 uppercase">Mengedit Destinasi & Jalur</p>
        <div className="flex gap-2">
          <button onClick={handleSave} className="bg-art-orange text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">Simpan Perubahan</button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg border border-art-text/20">
        <input 
          type="text" 
          placeholder="Cari Gunung / Jalur..." 
          className="border border-art-text/30 px-3 py-2 rounded text-sm outline-none focus:border-art-orange flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select 
          className="border border-art-text/30 px-3 py-2 rounded text-sm outline-none focus:border-art-orange"
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
        >
          {regions.map((r: any) => (
            <option key={r} value={r as string}>{r as string}</option>
          ))}
        </select>
      </div>

      {data.map((dest: any, i: number) => {
        const matchesSearch = dest.name.toLowerCase().includes(search.toLowerCase());
        const matchesRegion = regionFilter === "Semua" || dest.region === regionFilter;
        
        if (!matchesSearch && !matchesRegion) return null;
        if (!matchesSearch && matchesRegion && search) return null; // exact search logic
        if (matchesSearch && regionFilter !== "Semua" && dest.region !== regionFilter) return null;

        return (
        <div key={i} className={\`bg-white p-4 rounded-lg border-2 \${dest.isActive !== false ? 'border-art-text' : 'border-gray-300 opacity-70'} space-y-4 relative w-full overflow-hidden\`}>
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-art-text/60">Aktif di Homepage?</span>
            <input 
              type="checkbox" 
              className="w-4 h-4 accent-art-orange"
              checked={dest.isActive !== false}
              onChange={(e) => {
                const nd = [...data];
                nd[i].isActive = e.target.checked;
                setData(nd);
              }}
            />
          </div>
          <div className="flex items-center gap-4 pr-32">
            <input 
              className="font-bold text-lg border-b border-dashed border-art-text/30 outline-none focus:border-art-orange w-full bg-transparent" 
              value={dest.name}
              onChange={e => {
                const nd = [...data];
                nd[i].name = e.target.value;
                setData(nd);
              }}
              placeholder="Nama Gunung"
            />
            <button 
              onClick={() => {
                const nd = [...data];
                if (!nd[i].paths) nd[i].paths = [];
                nd[i].paths.push({ name: "Jalur Baru", durations: [{ label: "1H (Tektok)", price: 0, originalPrice: 0 }] });
                setData(nd);
              }}
              className="text-[10px] bg-art-text text-white px-3 py-1.5 rounded whitespace-nowrap hidden sm:block"
            >+ Jalur</button>
          </div>
          
          <div className="grid gap-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center mb-2">
              <span className="text-xs font-bold w-16">Region:</span>
              <input className="border p-2 rounded text-xs w-full sm:w-32" value={dest.region || 'Jawa'} onChange={e => {
                const nd = [...data];
                nd[i].region = e.target.value;
                setData(nd);
              }} placeholder="Contoh: Jawa Tengah" />
              
              <span className="text-xs font-bold w-12 sm:ml-4">Kuota:</span>
              <input className="border p-2 rounded text-xs w-full sm:flex-1" value={dest.kuota} onChange={e => {
                const nd = [...data];
                nd[i].kuota = e.target.value;
                setData(nd);
              }} placeholder="Contoh: Min 2 - Max 12 Pax" />
            </div>
            
            <button 
              onClick={() => {
                const nd = [...data];
                if (!nd[i].paths) nd[i].paths = [];
                nd[i].paths.push({ name: "Jalur Baru", durations: [{ label: "1H (Tektok)", price: 0, originalPrice: 0 }] });
                setData(nd);
              }}
              className="text-[10px] bg-art-text text-white px-3 py-1.5 rounded w-full sm:hidden"
            >+ Jalur</button>

            {dest.paths?.map((path: any, pIdx: number) => (
              <div key={pIdx} className="border border-art-text/20 p-3 rounded-lg bg-gray-50 space-y-3 relative">
                <button onClick={() => {
                   const nd = [...data];
                   nd[i].paths.splice(pIdx, 1);
                   setData(nd);
                }} className="absolute top-3 right-3 text-red-500"><Trash2 size={14}/></button>
                <div className="flex items-center gap-2 pr-8">
                  <span className="text-[10px] font-bold uppercase w-12">Jalur:</span>
                  <input className="border p-1.5 rounded text-xs flex-1" value={path.name} onChange={e => {
                    const nd = [...data];
                    nd[i].paths[pIdx].name = e.target.value;
                    setData(nd);
                  }} placeholder="Nama Jalur" />
                  <button onClick={() => {
                    const nd = [...data];
                    nd[i].paths[pIdx].durations.push({ label: "1H (Tektok)", price: 0, originalPrice: 0 });
                    setData(nd);
                  }} className="text-[10px] bg-blue-500 text-white px-2 py-1.5 rounded whitespace-nowrap">+ Durasi</button>
                </div>
                
                <div className="pl-0 sm:pl-14 space-y-2">
                  {path.durations.map((dur: any, j: number) => (
                    <div key={j} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <input className="border p-2 rounded text-xs w-full sm:flex-1" value={dur.label} onChange={e => {
                        const nd = [...data];
                        nd[i].paths[pIdx].durations[j].label = e.target.value;
                        setData(nd);
                      }} placeholder="Durasi (1H (Tektok))" />
                      <div className="flex gap-2 w-full sm:w-auto">
                        <input type="number" className="border p-2 rounded text-xs w-24 flex-1 sm:flex-none" value={dur.originalPrice} onChange={e => {
                          const nd = [...data];
                          nd[i].paths[pIdx].durations[j].originalPrice = parseInt(e.target.value) || 0;
                          setData(nd);
                        }} placeholder="Harga Asli (k)" />
                        <input type="number" className="border p-2 rounded text-xs w-24 flex-1 sm:flex-none" value={dur.price} onChange={e => {
                          const nd = [...data];
                          nd[i].paths[pIdx].durations[j].price = parseInt(e.target.value) || 0;
                          setData(nd);
                        }} placeholder="Harga Final (k)" />
                        <button onClick={() => {
                          const nd = [...data];
                          nd[i].paths[pIdx].durations.splice(j, 1);
                          setData(nd);
                        }} className="text-red-500 p-2 border rounded hover:bg-red-50 bg-white"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )})}
    </div>
  );
};`;

data = data.replace(/const DestinationsAdmin = \(\{ config, updateConfig, showToast \}: any\) => \{[\s\S]*?^const LeadersAdmin =/m, replacement + '\n\nconst LeadersAdmin =');

fs.writeFileSync(appPath, data);
