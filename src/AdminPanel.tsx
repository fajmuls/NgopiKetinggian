import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Trash2, Plus, GripVertical } from 'lucide-react';
import { AppConfig } from './useAppConfig';

export const AdminPanelModal = ({ 
  isOpen, 
  onClose, 
  config, 
  updateConfig 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  config: AppConfig,
  updateConfig: (c: Partial<AppConfig>) => void 
}) => {
  const [activeTab, setActiveTab] = useState<'destinations' | 'leaders' | 'gallery' | 'cerita'>('destinations');
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 text-left text-art-text">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-art-section w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border-2 border-art-text relative shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-art-text bg-white">
          <h2 className="text-xl font-black uppercase tracking-tight text-art-text">Admin Dashboard</h2>
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
            {activeTab === 'destinations' && <DestinationsAdmin config={config} updateConfig={updateConfig} />}
            {activeTab === 'leaders' && <LeadersAdmin config={config} updateConfig={updateConfig} />}
            {activeTab === 'gallery' && <GalleryAdmin config={config} updateConfig={updateConfig} />}
            {activeTab === 'cerita' && <CeritaAdmin config={config} updateConfig={updateConfig} />}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Sub-components for Admin
const DestinationsAdmin = ({ config, updateConfig }: any) => {
  const [data, setData] = useState([...config.destinationsData]);

  const handleSave = () => {
    updateConfig({ destinationsData: data });
    alert('Disimpan!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-lg border border-art-text/20 gap-3">
        <p className="text-xs font-bold text-art-text/60 uppercase">Mengedit Destinasi Tektok / Camp</p>
        <div className="flex gap-2">
          <button onClick={handleSave} className="bg-art-orange text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">Simpan Perubahan</button>
        </div>
      </div>

      {data.map((dest, i) => (
        <div key={i} className="bg-white p-4 rounded-lg border-2 border-art-text space-y-4">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-lg">{dest.name}</h3>
            <button 
              onClick={() => {
                const nd = [...data];
                nd[i].durations.push({ label: "1H (Tektok)", price: 0, originalPrice: 0 });
                setData(nd);
              }}
              className="text-[10px] bg-art-text text-white px-2 py-1 rounded"
            >+ Durasi</button>
          </div>
          
          <div className="grid gap-2">
            <div className="flex gap-2 items-center mb-2">
              <span className="text-xs font-bold w-16">Kuota:</span>
              <input className="border p-2 rounded text-xs flex-1" value={dest.kuota} onChange={e => {
                const nd = [...data];
                nd[i].kuota = e.target.value;
                setData(nd);
              }} placeholder="Contoh: Min 2 - Max 12 Pax" />
            </div>
            {dest.durations.map((dur: any, j: number) => (
              <div key={j} className="flex gap-2 items-center">
                <input className="border p-2 rounded text-xs flex-1" value={dur.label} onChange={e => {
                  const nd = [...data];
                  nd[i].durations[j].label = e.target.value;
                  setData(nd);
                }} placeholder="Durasi (1H (Tektok))" />
                <input type="number" className="border p-2 rounded text-xs w-24" value={dur.price} onChange={e => {
                  const nd = [...data];
                  nd[i].durations[j].price = parseInt(e.target.value) || 0;
                  setData(nd);
                }} placeholder="Harga (k)" />
                <button onClick={() => {
                  const nd = [...data];
                  nd[i].durations.splice(j, 1);
                  setData(nd);
                }} className="text-red-500 p-2"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const LeadersAdmin = ({ config, updateConfig }: any) => {
  const [data, setData] = useState([...config.tripLeaders]);

  const handleSave = () => {
    updateConfig({ tripLeaders: data });
    alert('Disimpan!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-art-text/20">
        <p className="text-xs font-bold text-art-text/60 uppercase">Daftar Trip Leader</p>
        <div className="flex gap-2">
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
                  const nd = [...data]; nd[i].name = e.target.value; setData(nd);
            }} placeholder="Nama" />
            <input className="border p-2 rounded text-xs w-full mb-2 block" value={leader.description} onChange={e => {
                  const nd = [...data]; nd[i].description = e.target.value; setData(nd);
            }} placeholder="Deskripsi" />
            <input className="border p-2 rounded text-xs w-full mb-2 block" value={leader.avatar} onChange={e => {
                  const nd = [...data]; nd[i].avatar = e.target.value; setData(nd);
            }} placeholder="URL Foto URL" />
            <input className="border p-2 rounded text-xs w-full mb-2 block border-blue-300 bg-blue-50" value={leader.voiceLine || ''} onChange={e => {
                  const nd = [...data]; nd[i].voiceLine = e.target.value; setData(nd);
            }} placeholder="URL Voice Audio (Dari Firebase Storage / URL)" />
          </div>
        ))}
        <p className="text-[10px] text-art-text/50">Kosongkan URL Voice Line agar admin bisa mengisi audionya secara manual dari luar jika dibutuhkan, atau isikan URL Firebase/Public HTTPS yang sudah dihosting. Karena Firestore hanya menampung teks url.</p>
      </div>
    </div>
  );
};

const GalleryAdmin = ({ config, updateConfig }: any) => {
  const [data, setData] = useState([...config.galleryPhotos]);
  
  const handleSave = () => {
    updateConfig({ galleryPhotos: data });
    alert('Disimpan!');
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-art-text/20">
        <p className="text-xs font-bold text-art-text/60 uppercase">Gallery Foto</p>
        <div className="flex gap-2">
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

const CeritaAdmin = ({ config, updateConfig }: any) => {
  const [url, setUrl] = useState(config.ceritaVideoUrl);

  const handleSave = () => {
    updateConfig({ ceritaVideoUrl: url });
    alert('Disimpan!');
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
