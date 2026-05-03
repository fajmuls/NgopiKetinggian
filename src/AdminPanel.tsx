import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Trash2, Plus, GripVertical } from 'lucide-react';
import { AppConfig } from './useAppConfig';

export const AdminPanelModal = ({ 
  isOpen, 
  onClose, 
  config, 
  updateConfig,
  revertToDefault,
  defaultLists
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  config: AppConfig,
  updateConfig: (c: Partial<AppConfig>) => void,
  revertToDefault: () => void,
  defaultLists: any
}) => {
  const [activeTab, setActiveTab] = useState<'destinations' | 'leaders' | 'gallery' | 'cerita'>('destinations');
  const showToast = (msg: string) => {
    alert(msg);
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 text-left text-art-text">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-art-section w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border-2 border-art-text relative shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-art-text bg-white">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black uppercase tracking-tight text-art-text">Admin Dashboard</h2>
            <button 
              onClick={() => {
                if (window.confirm("Beneran mau reset semua ke default global?")) {
                  revertToDefault();
                  showToast("Berhasil direset global!");
                }
              }} 
              className="text-[10px] bg-red-100 text-red-600 px-3 py-1.5 font-bold uppercase rounded-md tracking-widest hover:bg-red-200 transition-colors"
            >
              Reset ke Default
            </button>
          </div>
          <button onClick={onClose} className="p-2 hover:text-art-orange transition-colors"><X size={24} /></button>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="flex sm:flex-col gap-2 p-4 border-b sm:border-b-0 sm:border-r border-art-text bg-white overflow-x-auto sm:overflow-x-visible w-full sm:w-48 shrink-0">
            <button onClick={() => setActiveTab('destinations')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'destinations' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Destinasi & Durasi</button>
            <button onClick={() => setActiveTab('leaders')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'leaders' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Trip Leaders</button>
            <button onClick={() => setActiveTab('gallery')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'gallery' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Gallery</button>
            <button onClick={() => setActiveTab('cerita')} className={`text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-widest ${activeTab === 'cerita' ? 'bg-art-orange text-white' : 'hover:bg-art-text/10'}`}>Secangkir Cerita</button>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-art-bg/50">
            {activeTab === 'destinations' && <DestinationsAdmin config={config} updateConfig={updateConfig} showToast={showToast} defaultList={defaultLists.destinations} />}
            {activeTab === 'leaders' && <LeadersAdmin config={config} updateConfig={updateConfig} showToast={showToast} defaultList={defaultLists.leaders} />}
            {activeTab === 'gallery' && <GalleryAdmin config={config} updateConfig={updateConfig} showToast={showToast} defaultList={defaultLists.gallery} />}
            {activeTab === 'cerita' && <CeritaAdmin config={config} updateConfig={updateConfig} showToast={showToast} defaultVideo={defaultLists.cerita} />}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Sub-components for Admin
const DestinationsAdmin = ({ config, updateConfig, showToast, defaultList }: any) => {
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
          <button onClick={() => {
            if (window.confirm("Beneran mau reset destinasi ke default?")) {
              const defaultData = JSON.parse(JSON.stringify(defaultList));
              setData(defaultData);
              updateConfig({ destinationsData: defaultData });
              showToast('Direset ke Default!');
            }
          }} className="bg-red-100 text-red-600 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hidden sm:block">Reset Default</button>
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
        <div key={i} className={`bg-white p-4 rounded-lg border-2 ${dest.isActive !== false ? 'border-art-text' : 'border-gray-300 opacity-70'} space-y-4 relative w-full overflow-hidden`}>
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center gap-2 z-10 bg-white/80 backdrop-blur-sm p-1 rounded-md">
            <span className="text-[10px] uppercase font-bold tracking-widest text-art-text/60 hidden sm:inline">Aktif di Homepage?</span>
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
            <button onClick={() => {
               const nd = [...data]; nd.splice(i, 1); setData(nd);
            }} className="text-red-500 hover:text-red-600 sm:hidden"><Trash2 size={16}/></button>
          </div>
          <div className="flex items-center gap-4 pr-16 sm:pr-32">
            <input 
              className="font-bold text-lg border-b border-dashed border-art-text/30 outline-none focus:border-art-orange w-full bg-transparent max-w-[calc(100%-2rem)]" 
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
            <button onClick={() => {
               const nd = [...data]; nd.splice(i, 1); setData(nd);
            }} className="text-red-500 hover:text-red-600 hidden sm:block"><Trash2 size={16}/></button>
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

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center mb-2">
              <span className="text-xs font-bold w-16">Mepo:</span>
              <input className="border p-2 rounded text-xs w-full sm:flex-1" value={dest.mepo || ''} onChange={e => {
                const nd = [...data];
                nd[i].mepo = e.target.value;
                setData(nd);
              }} placeholder="Meeting Point (Contoh: Basecamp)" />
              
              <span className="text-xs font-bold w-12 sm:ml-4">Beans:</span>
              <input className="border p-2 rounded text-xs w-full sm:flex-1" value={dest.beans || ''} onChange={e => {
                const nd = [...data];
                nd[i].beans = e.target.value;
                setData(nd);
              }} placeholder="Biji Kopi (Contoh: Arabica Blend)" />
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
};

const LeadersAdmin = ({ config, updateConfig, showToast, defaultList }: any) => {
  const [data, setData] = useState([...config.tripLeaders]);

  const handleSave = () => {
    updateConfig({ tripLeaders: data });
    showToast('Disimpan!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-art-text/20">
        <p className="text-xs font-bold text-art-text/60 uppercase">Daftar Trip Leader</p>
        <div className="flex gap-2">
          <button onClick={() => {
            if (window.confirm("Beneran mau reset leaders ke default?")) {
              const defaultData = JSON.parse(JSON.stringify(defaultList));
              setData(defaultData);
              updateConfig({ tripLeaders: defaultData });
              showToast('Direset ke Default!');
            }
          }} className="bg-red-100 text-red-600 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">Reset</button>
          <button onClick={() => {
            setData([...data, { name: "Nama Baru", age: "20 th", description: "Deskripsi", avatar: "https://via.placeholder.com/150", voiceLine: "" }]);
          }} className="bg-art-text text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">+ Leader</button>
          <button onClick={handleSave} className="bg-art-orange text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">Simpan</button>
        </div>
      </div>
      <div className="space-y-4">
        {data.map((leader, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border-2 border-art-text relative">
            <button onClick={() => {
              const nd = [...data];
              nd.splice(i, 1);
              setData(nd);
            }} className="absolute top-4 right-4 text-red-500"><Trash2 size={16}/></button>
            <input className="border p-2 rounded text-sm font-bold w-1/2 mb-2 block" value={leader.name} onChange={e => {
                  setData(prev => prev.map((item, idx) => idx === i ? { ...item, name: e.target.value } : item));
            }} placeholder="Nama" />
            <input className="border p-2 rounded text-xs w-full mb-2 block" value={leader.description} onChange={e => {
                  setData(prev => prev.map((item, idx) => idx === i ? { ...item, description: e.target.value } : item));
            }} placeholder="Deskripsi" />
            <input className="border p-2 rounded text-xs w-full mb-2 block" value={leader.avatar} onChange={e => {
                  setData(prev => prev.map((item, idx) => idx === i ? { ...item, avatar: e.target.value } : item));
            }} placeholder="URL Foto URL" />
            <input className="border p-2 rounded text-xs w-full mb-2 block border-blue-300 bg-blue-50" value={leader.voiceLine || ''} onChange={e => {
                  setData(prev => prev.map((item, idx) => idx === i ? { ...item, voiceLine: e.target.value } : item));
            }} placeholder="URL Voice Audio (Dari Firebase Storage / URL)" />
          </div>
        ))}
        <p className="text-[10px] text-art-text/50">Kosongkan URL Voice Line agar admin bisa mengisi audionya secara manual dari luar jika dibutuhkan, atau isikan URL Firebase/Public HTTPS yang sudah dihosting. Karena Firestore hanya menampung teks url.</p>
      </div>
    </div>
  );
};

const GalleryAdmin = ({ config, updateConfig, showToast, defaultList }: any) => {
  const [data, setData] = useState([...config.galleryPhotos]);
  
  const handleSave = () => {
    updateConfig({ galleryPhotos: data });
    showToast('Disimpan!');
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-art-text/20">
        <p className="text-xs font-bold text-art-text/60 uppercase">Gallery Foto</p>
        <div className="flex gap-2">
          <button onClick={() => {
            if (window.confirm("Beneran mau reset gallery ke default?")) {
              const defaultData = JSON.parse(JSON.stringify(defaultList));
              setData(defaultData);
              updateConfig({ galleryPhotos: defaultData });
              showToast('Direset ke Default!');
            }
          }} className="bg-red-100 text-red-600 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hidden sm:block">Reset Default</button>
          <button onClick={() => {
            setData([...data, { src: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=2070", desc: "Foto Baru" }]);
          }} className="bg-art-text text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">+ Foto</button>
          <button onClick={handleSave} className="bg-art-orange text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">Simpan</button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.map((photo, i) => (
          <div key={i} className="bg-white p-3 rounded border border-art-text relative space-y-2 flex flex-col">
            <button onClick={() => {
              const nd = [...data]; nd.splice(i, 1); setData(nd);
            }} className="absolute top-2 right-2 text-red-500 bg-white p-1 rounded"><Trash2 size={16}/></button>
            <img src={photo.src} className="w-full h-32 object-cover rounded" />
            <input className="border p-1 text-xs w-full rounded" value={photo.src} onChange={e => {
                  const nd = [...data]; nd[i].src = e.target.value; setData(nd);
            }} placeholder="URL Image" />
            <input className="border p-1 text-xs w-full rounded" value={photo.desc} onChange={e => {
                  const nd = [...data]; nd[i].desc = e.target.value; setData(nd);
            }} placeholder="Caption" />
          </div>
        ))}
      </div>
    </div>
  );
};

const CeritaAdmin = ({ config, updateConfig, showToast, defaultVideo }: any) => {
  const [url, setUrl] = useState(config.ceritaVideoUrl);

  const handleSave = () => {
    updateConfig({ ceritaVideoUrl: url });
    showToast('Disimpan!');
  };

  return (
     <div className="space-y-6">
       <div className="flex flex-col gap-4 bg-white p-6 rounded-lg border-2 border-art-text">
        <p className="font-bold">URL Video Secangkir Cerita</p>
        <input className="border-2 border-art-text p-3 rounded" value={url} onChange={e => setUrl(e.target.value)} placeholder="Misal: https://www.youtube.com/embed/..." />
        <p className="text-xs text-art-text/60">Gunakan link embed YouTube atau file MP4 yang didukung.</p>
        <button onClick={handleSave} className="bg-art-orange text-white px-4 py-3 rounded text-xs font-bold uppercase tracking-widest w-fit">Simpan Perubahan</button>
       </div>
    </div>
  )
};
