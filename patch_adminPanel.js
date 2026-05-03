import fs from 'fs';
let code = fs.readFileSync('src/AdminPanel.tsx', 'utf8');

// 1. Add new tabs to AdminPanel
code = code.replace(/<button onClick=\{\(\) => setActiveTab\('destinations'\)\}/, 
  `<button onClick={() => setActiveTab('openTrips')} className={\`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest \${activeTab === 'openTrips' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}\`}>Open Trip (Bebas)</button>\n            <button onClick={() => setActiveTab('destinations')}`);

code = code.replace(/<button onClick=\{\(\) => setActiveTab\('cerita'\)\}/, 
  `<button onClick={() => setActiveTab('facilities')} className={\`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest \${activeTab === 'facilities' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}\`}>Fasilitas</button>\n            <button onClick={() => setActiveTab('cerita')}`);

// 2. Add sub-components rendering
code = code.replace(/\{activeTab === 'cerita'.*?\}/,
  `{activeTab === 'cerita' && <CeritaAdmin config={config} updateConfig={updateConfig} showToast={showToast} defaultVideo={defaultLists.cerita} />}
            {activeTab === 'openTrips' && <OpenTripsAdmin config={config} updateConfig={updateConfig} showToast={showToast} />}
            {activeTab === 'facilities' && <FacilitiesAdmin config={config} updateConfig={updateConfig} showToast={showToast} />}`);

code = code.replace(/useState<'destinations' \| 'leaders' \| 'gallery' \| 'cerita'>/, `useState<'destinations' | 'leaders' | 'gallery' | 'cerita' | 'openTrips' | 'facilities'>`);

// Add OpenTripsAdmin and FacilitiesAdmin
const extraTabs = `
const OpenTripsAdmin = ({ config, updateConfig, showToast }: any) => {
  const [data, setData] = useState(config.openTrips || []);

  const handleSave = () => { updateConfig({ openTrips: data }); showToast('Tersimpan!'); };

  return (
    <div className="space-y-6">
      <div className="flex justify-between bg-white p-4 rounded-lg border border-art-text/20">
        <p className="text-xs font-bold uppercase text-art-text/60">Pengaturan Open Trip (Custom)</p>
        <div className="flex gap-2">
           <button onClick={() => setData([...data, { id: Date.now().toString(), name: "Gunung Baru", region: "Jawa", jadwal: "Tanggal", kuota: "10 Pax", mepo: "Basecamp", difficulty: "Pemula", image: "", beans: "", path: "Jalur", duration: "2H 1M", price: 500 }])} className="bg-art-text text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">+ Open Trip</button>
           <button onClick={handleSave} className="bg-art-orange text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">Simpan</button>
        </div>
      </div>
      {data.map((ot: any, i: number) => (
        <div key={i} className="bg-white p-4 rounded-lg border-2 border-art-text space-y-3 relative">
          <button onClick={() => { const nd = [...data]; nd.splice(i, 1); setData(nd); }} className="absolute top-4 right-4 text-red-500"><Trash2 size={16}/></button>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-8">
            <input className="border p-2 rounded text-sm font-bold" value={ot.name} onChange={e => { const nd = [...data]; nd[i].name = e.target.value; setData(nd); }} placeholder="Nama Gunung" />
            <input className="border p-2 rounded text-sm" value={ot.region} onChange={e => { const nd = [...data]; nd[i].region = e.target.value; setData(nd); }} placeholder="Region" />
            <input className="border p-2 rounded text-sm" value={ot.mepo} onChange={e => { const nd = [...data]; nd[i].mepo = e.target.value; setData(nd); }} placeholder="Meeting Point" />
            <input className="border p-2 rounded text-sm" value={ot.jadwal} onChange={e => { const nd = [...data]; nd[i].jadwal = e.target.value; setData(nd); }} placeholder="Jadwal (cth: 15-16 Ags)" />
            <input className="border p-2 rounded text-sm" value={ot.kuota} onChange={e => { const nd = [...data]; nd[i].kuota = e.target.value; setData(nd); }} placeholder="Kuota" />
            <input className="border p-2 rounded text-sm" value={ot.difficulty} onChange={e => { const nd = [...data]; nd[i].difficulty = e.target.value; setData(nd); }} placeholder="Kesulitan (Pemula / Menengah)" />
            <input className="border p-2 rounded text-sm" value={ot.path} onChange={e => { const nd = [...data]; nd[i].path = e.target.value; setData(nd); }} placeholder="Jalur" />
            <input className="border p-2 rounded text-sm" value={ot.duration} onChange={e => { const nd = [...data]; nd[i].duration = e.target.value; setData(nd); }} placeholder="Durasi" />
            <input className="border p-2 rounded text-sm" type="number" value={ot.price} onChange={e => { const nd = [...data]; nd[i].price = parseInt(e.target.value) || 0; setData(nd); }} placeholder="Harga (k)" />
            <input className="border p-2 rounded text-sm" type="number" value={ot.originalPrice} onChange={e => { const nd = [...data]; nd[i].originalPrice = parseInt(e.target.value) || 0; setData(nd); }} placeholder="Harga Coret (k)" />
            <input className="border p-2 rounded text-sm sm:col-span-2" value={ot.image} onChange={e => { const nd = [...data]; nd[i].image = e.target.value; setData(nd); }} placeholder="URL Gambar" />
          </div>
        </div>
      ))}
    </div>
  )
}

const FacilitiesAdmin = ({ config, updateConfig, showToast }: any) => {
  const [data, setData] = useState(config.facilities || { include: [], exclude: [], opsi: [] });

  const handleSave = () => { updateConfig({ facilities: data }); showToast('Tersimpan!'); };

  const renderList = (key: 'include' | 'exclude' | 'opsi', label: string) => (
    <div className="bg-white p-4 rounded-lg border-2 border-art-text space-y-3">
      <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
        <h3 className="font-bold text-sm uppercase">{label}</h3>
        <button onClick={() => setData({ ...data, [key]: [...data[key], "Item Baru"] })} className="text-xs bg-art-text text-white px-2 py-1 rounded">+ Tambah</button>
      </div>
      {data[key].map((item: string, i: number) => (
        <div key={i} className="flex gap-2">
          <input className="border p-2 rounded text-sm flex-1" value={item} onChange={e => {
            const nd = { ...data }; nd[key][i] = e.target.value; setData(nd);
          }} />
          <button onClick={() => {
            const nd = { ...data }; nd[key].splice(i, 1); setData(nd);
          }} className="text-red-500 p-2 border rounded hover:bg-red-50"><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between bg-white p-4 rounded-lg border border-art-text/20">
        <p className="text-xs font-bold uppercase text-art-text/60">Fasilitas Trip</p>
        <button onClick={handleSave} className="bg-art-orange text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">Simpan</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderList('include', 'Termasuk (Include)')}
        {renderList('exclude', 'Tidak Termasuk (Exclude)')}
        {renderList('opsi', 'Opsi Tambahan')}
      </div>
    </div>
  )
}
`;

code = code + '\n' + extraTabs;
fs.writeFileSync('src/AdminPanel.tsx', code);
