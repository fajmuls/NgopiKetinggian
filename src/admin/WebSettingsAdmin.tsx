import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadFile } from '../lib/storage-utils';
import { X, Trash2, Plus, GripVertical, Users, Calendar, MapPin, Coffee, Mountain, Info, AlertCircle, FileText, Download, CheckCircle, Send, Globe, Map, Edit2, ChevronDown, Clock, TrendingUp, CreditCard, User, Clipboard, ChevronRight, ShoppingBag, MessageCircle, Eye } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { generateRundownPdf } from '../lib/pdf-utils';
import { customConfirm, customAlert } from '../GlobalDialog';
import { AppConfig, FacilityOption, DIFFICULTY_LEVELS as difficultyLevels, DURATION_LEVELS as durationLevels, OpenTrip, WEBSITE_VERSION } from '../useAppConfig';

export const InputWithPaste = ({ value, onChange, placeholder, className, ...props }: any) => {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange({ target: { value: text } } as any);
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  return (
    <div className="relative w-full flex items-center">
      <input 
        type="text" 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder} 
        className={`${className} pr-8`}
        {...props}
      />
      <button 
        type="button"
        onClick={handlePaste}
        className="absolute right-1 p-1.5 text-art-text/40 hover:text-art-orange transition-colors"
        title="Paste"
      >
        <Clipboard size={12} />
      </button>
    </div>
  );
};


export const ImageUploader = ({ value, onChange, placeholder = "URL Gambar" }: { value: string, onChange: (url: string) => void, placeholder?: string }) => {
  return (
    <div className="space-y-1 p-2 rounded-lg bg-art-bg/30 border border-art-text/10">
      <div className="flex items-center gap-2">
      	<InputWithPaste 
          className="border border-art-text/20 p-2 rounded text-[10px] w-full text-art-text bg-white outline-none focus:border-art-orange transition-colors" 
          value={value || ''} 
          onChange={(e: any) => onChange(e.target.value)} 
          placeholder={placeholder || "Masukkan Link URL Foto"} 
        />
      </div>
      {value ? (
        <div className="mt-2">
           <img src={value} className="w-full h-20 object-cover rounded border border-art-text/10" alt="Preview" onError={(e) => (e.currentTarget.style.display = 'none')} />
           <p className="text-[8px] text-art-green font-bold uppercase truncate mt-1">Preview Tersedia</p>
        </div>
      ) : (
        <p className="text-[8px] text-art-text/30 font-bold uppercase truncate">Belum ada gambar</p>
      )}
    </div>
  );
};



export const CeritaAdmin = ({ config, updateConfig, showToast, defaultVideo }: any) => {
  const [url, setUrl] = useState(config.ceritaVideoUrl);
  const [ceritaTitle, setCeritaTitle] = useState(config.homepage?.ceritaTitle || '');
  const [ceritaSub, setCeritaSub] = useState(config.homepage?.ceritaSub || '');
  const [ceritaParagraph1, setCeritaParagraph1] = useState(config.homepage?.ceritaParagraph1 || '');
  const [ceritaParagraph2, setCeritaParagraph2] = useState(config.homepage?.ceritaParagraph2 || '');
  const [ceritaFeatures, setCeritaFeatures] = useState(config.homepage?.ceritaFeatures || []);

  const handleSave = () => {
    updateConfig({ 
       ceritaVideoUrl: url, 
       homepage: { 
         ...config.homepage, 
         ceritaTitle, 
         ceritaSub, 
         ceritaParagraph1, 
         ceritaParagraph2,
         ceritaFeatures
       } 
    });
    showToast('Cerita Berhasil Disimpan!');
  };

  return (
     <div className="space-y-6">
       <div className="flex flex-col gap-4 bg-white p-6 rounded-lg border-2 border-art-text">
        <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
           <Edit2 size={16} className="text-art-orange" /> Edit Konten Cerita (Homepage)
        </h3>
        
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="w-full border p-2 rounded text-xs" value={ceritaTitle} onChange={e => setCeritaTitle(e.target.value)} placeholder="Judul Cerita (Secangkir Cerita)" />
            <input className="w-full border p-2 rounded text-xs" value={ceritaSub} onChange={e => setCeritaSub(e.target.value)} placeholder="Sub-judul (di Atas Awan)" />
          </div>
          <textarea className="w-full border p-2 rounded text-xs h-24" value={ceritaParagraph1} onChange={e => setCeritaParagraph1(e.target.value)} placeholder="Paragraf 1"></textarea>
          <textarea className="w-full border p-2 rounded text-xs h-24" value={ceritaParagraph2} onChange={e => setCeritaParagraph2(e.target.value)} placeholder="Paragraf 2"></textarea>
        
          <div className="pt-4 space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
              <h4 className="font-bold text-xs uppercase">Edit Fitur Cerita</h4>
              <button type="button" onClick={() => setCeritaFeatures([...ceritaFeatures, { title: '', desc: '' }])} className="text-xs bg-art-text text-white px-2 py-1 rounded">+ Fitur</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(ceritaFeatures || []).map((feat: any, idx: number) => (
                <div key={idx} className="border border-art-text/20 p-4 rounded-lg space-y-2 relative bg-art-bg/20">
                  <button type="button" onClick={() => {
                    const nf = [...ceritaFeatures]; nf.splice(idx, 1); setCeritaFeatures(nf);
                  }} className="absolute top-2 right-2 text-red-500"><Trash2 size={16}/></button>
                  <input className="w-full border p-2 rounded text-xs" value={feat.title} onChange={e => {
                    const nf = [...ceritaFeatures]; nf[idx].title = e.target.value; setCeritaFeatures(nf);
                  }} placeholder="Judul Fitur" />
                  <textarea className="w-full border p-2 rounded text-xs h-16" value={feat.desc} onChange={e => {
                    const nf = [...ceritaFeatures]; nf[idx].desc = e.target.value; setCeritaFeatures(nf);
                  }} placeholder="Deskripsi Fitur"></textarea>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-art-text/10">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase text-art-text/40 tracking-widest">URL Video (YouTube Embed/MP4)</p>
            <InputWithPaste className="border-2 border-art-text p-3 rounded-xl w-full text-xs font-mono" value={url} onChange={(e: any) => setUrl(e.target.value)} placeholder="https://www.youtube.com/embed/..." />
            <p className="text-[9px] text-art-text/30 italic">Penting: Untuk YouTube, gunakan format <b>/embed/VIDEO_ID</b> agar bisa diputar di web.</p>
          </div>
          <div className="space-y-1.5">
             <p className="text-[10px] font-black uppercase text-art-text/40 tracking-widest">Rasio Video</p>
             <select 
                className="border-2 border-art-text p-3 rounded-xl w-full text-xs font-mono" 
                value={config.ceritaVideoRatio || 'auto'}
                onChange={e => updateConfig({ ceritaVideoRatio: e.target.value })}
             >
                <option value="auto">Auto (Sesuai Video)</option>
                <option value="16/9">Landscape (16:9)</option>
                <option value="9/16">Portrait / Shorts (9:16)</option>
                <option value="3/4">Standard Portrait (3:4)</option>
                <option value="1/1">Square (1:1)</option>
             </select>
             <p className="text-[9px] text-art-text/30 italic">Atur rasio untuk menyesuaikan iframe YouTube.</p>
          </div>
        </div>

        <div className="flex gap-2 w-fit mt-6">
          <button onClick={() => {
            customConfirm("Beneran mau reset cerita ke default?", () => {
              setUrl(defaultVideo);
              updateConfig({ ceritaVideoUrl: defaultVideo });
              showToast('Direset ke Default!');
            });
          }} className="bg-red-100 text-red-600 px-4 py-3 rounded text-xs font-bold uppercase tracking-widest hidden sm:block">Reset Default</button>
          <button onClick={handleSave} className="bg-art-orange text-white px-4 py-3 rounded text-xs font-bold uppercase tracking-widest">Simpan Perubahan</button>
        </div>
        
        {/* Video Preview */}
        {url && (
          <div className="mt-4 border-2 border-art-text/20 p-4 rounded-lg bg-gray-50 flex flex-col max-w-sm">
            <p className="text-xs font-bold mb-2 uppercase">Preview Video</p>
            {url.includes('youtube.com') || url.includes('youtu.be') ? (
              <iframe 
                src={url}
                style={config.ceritaVideoRatio && config.ceritaVideoRatio !== 'auto' ? { aspectRatio: config.ceritaVideoRatio } : {}}
                className={`w-full ${!config.ceritaVideoRatio || config.ceritaVideoRatio === 'auto' ? 'aspect-[4/5]' : ''} object-cover rounded shadow`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video 
                autoPlay loop muted playsInline controls
                style={config.ceritaVideoRatio && config.ceritaVideoRatio !== 'auto' ? { aspectRatio: config.ceritaVideoRatio } : {}}
                src={url} 
                className={`w-full ${!config.ceritaVideoRatio || config.ceritaVideoRatio === 'auto' ? 'aspect-[4/5]' : ''} object-cover rounded shadow bg-black`}
              />
            )}
          </div>
        )}
       </div>
    </div>
  )
};


export const GalleryAdmin = ({ config, updateConfig, showToast, defaultList }: any) => {
  const [data, setData] = useState([...(config.galleryPhotos || [])]);
  
  const movePhoto = (index: number, direction: 'up' | 'down') => {
    const list = [...data];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;
    [list[index], list[newIndex]] = [list[newIndex], list[index]];
    setData(list);
  };

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
            customConfirm("Beneran mau reset gallery ke default?", () => {
              const defaultData = JSON.parse(JSON.stringify(defaultList));
              setData(defaultData);
              updateConfig({ galleryPhotos: defaultData });
              showToast('Direset ke Default!');
            });
          }} className="bg-red-100 text-red-600 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hidden sm:block">Reset Default</button>
          <button onClick={() => {
             setData(JSON.parse(JSON.stringify(config.galleryPhotos || [])));
             showToast('Di-reset ke data tersimpan terakhir!');
          }} className="bg-gray-100 text-gray-600 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hidden sm:block">Batal</button>
          <button onClick={() => {
            const bulkText = prompt("Masukkan URL foto (pisahkan dengan koma atau baris baru):");
            if (bulkText) {
              const urls = bulkText.split(/[\n,]/).map(u => u.trim()).filter(u => u);
              const newPhotos = urls.map(u => ({ src: u, desc: "Gallery Photo" }));
              setData([...data, ...newPhotos]);
            }
          }} className="bg-blue-100 text-blue-600 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hidden sm:block">Bulk Add</button>
          <button onClick={() => {
            setData([...data, { src: "", desc: "" }]);
          }} className="bg-art-text text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">+ Foto</button>
          <button onClick={handleSave} className="bg-art-orange text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">Simpan</button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.map((photo, i) => (
          <div key={i} className="bg-white p-3 rounded border border-art-text relative space-y-2 flex flex-col">
            <div className="absolute top-2 right-2 flex gap-1 z-10">
                <div className="flex bg-white rounded border border-art-text/10 overflow-hidden shadow-sm">
                    <button type="button" onClick={() => movePhoto(i, 'up')} className="p-1 hover:bg-gray-100 border-r border-art-text/10" disabled={i === 0}><ChevronDown size={14} className="rotate-180"/></button>
                    <button type="button" onClick={() => movePhoto(i, 'down')} className="p-1 hover:bg-gray-100" disabled={i === data.length - 1}><ChevronDown size={14}/></button>
                </div>
                <button onClick={() => {
                  const nd = [...data]; nd.splice(i, 1); setData(nd);
                }} className="bg-white border border-art-text/10 text-red-500 rounded p-1 hover:bg-red-50 shadow-sm"><Trash2 size={14}/></button>
            </div>
            {photo.src && <img src={photo.src} className="w-full h-32 object-cover rounded" />}
            <InputWithPaste className="border p-1 text-xs w-full rounded" value={photo.src} onChange={(e: any) => {
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


export const HomepageAdmin = ({ config, updateConfig, showToast }: any) => {
  const [data, setData] = useState({ ...config.homepage, heroSlides: config.homepage.heroSlides || [] });

  const handleSave = () => {
    updateConfig({ homepage: data });
    showToast('Hero & Slide Tersimpan!');
  };

  return (
    <div className="bg-white p-6 rounded-2xl border-2 border-art-text space-y-8">
      <div className="space-y-4">
        <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
           <Edit2 size={16} className="text-art-orange" /> Edit Teks Hero Utama
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
              <label className="text-[10px] font-black uppercase text-art-text/40 mb-1 ml-1">Slogan Atas</label>
              <input className="w-full border-2 border-art-text/10 p-2 rounded-xl text-xs font-bold" value={data.heroSub || ''} onChange={e => setData({...data, heroSub: e.target.value})} placeholder="Open Trip Eksklusif" />
           </div>
           <div>
              <label className="text-[10px] font-black uppercase text-art-text/40 mb-1 ml-1">Floating Features</label>
              <input className="w-full border-2 border-art-text/10 p-2 rounded-xl text-xs font-bold" value={data.heroFeatures || ''} onChange={e => setData({...data, heroFeatures: e.target.value})} placeholder="Fasilitas premium • Pemandu ahli • Keamanan terjamin" />
           </div>
           <div>
              <label className="text-[10px] font-black uppercase text-art-text/40 mb-1 ml-1">Prefix Judul</label>
              <input className="w-full border-2 border-art-text/10 p-2 rounded-xl text-xs font-black uppercase" value={data.heroTitlePrefix || ''} onChange={e => setData({...data, heroTitlePrefix: e.target.value})} placeholder="TRIP" />
           </div>
           <div>
              <label className="text-[10px] font-black uppercase text-art-text/40 mb-1 ml-1">Judul Utama</label>
              <textarea className="w-full border-2 border-art-text/10 p-2 rounded-xl text-xs font-black h-20 resize-none" value={data.heroTitle || ''} onChange={e => setData({...data, heroTitle: e.target.value})} placeholder="Ngopi Di Ketinggian"></textarea>
           </div>
           <div>
              <label className="text-[10px] font-black uppercase text-art-text/40 mb-1 ml-1">Deskripsi Hero</label>
              <textarea className="w-full border-2 border-art-text/10 p-2 rounded-xl text-xs font-medium h-20 resize-none" value={data.heroDescription || ''} onChange={e => setData({...data, heroDescription: e.target.value})} placeholder="Nikmati pengalaman trip tak terlupakan..."></textarea>
           </div>
           <div>
              <label className="text-[10px] font-black uppercase text-art-text/40 mb-1 ml-1">Tagline Bawah</label>
              <input className="w-full border-2 border-art-text/10 p-2 rounded-xl text-xs font-bold" value={data.heroTagline || ''} onChange={e => setData({...data, heroTagline: e.target.value})} placeholder="JAYA / JAYA / JAYA" />
           </div>
        </div>
      </div>

      <div className="pt-6 border-t-2 border-dashed border-art-text/20 space-y-4">
        <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
          <h3 className="font-bold text-sm uppercase">Edit Slide Gunung (Ketinggian MDPL)</h3>
          <button type="button" onClick={(e) => { e.preventDefault(); setData({ ...data, heroSlides: [...data.heroSlides, { name: "Gunung Contoh", height: "0.000", image: "" }] })}} className="text-xs bg-art-text text-white px-2 py-1 rounded">+ Slide</button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           {data.heroSlides.map((slide: any, i: number) => (
             <div key={i} className="border border-art-text/20 p-4 rounded-lg space-y-2 relative bg-art-bg/20">
                <button onClick={() => {
                   const ns = [...data.heroSlides]; ns.splice(i, 1); setData({...data, heroSlides: ns});
                }} className="absolute top-2 right-2 text-red-500"><Trash2 size={16}/></button>

                <div>
                   <label className="text-[10px] font-bold uppercase block mb-1">Pilih dari Destinasi (Opsional)</label>
                   <select 
                     className="w-full border p-2 rounded text-xs mb-2 bg-white outline-none focus:border-art-orange"
                     onChange={(e) => {
                       const destName = e.target.value;
                       if (!destName) return;
                       const dest = config.destinationsData?.find((d: any) => d.name === destName);
                       if (dest) {
                         const ns = [...data.heroSlides];
                         ns[i] = {
                           ...ns[i],
                           name: dest.name,
                           height: dest.height?.replace(' mdpl', '') || "",
                           image: dest.image || ns[i].image
                         };
                         setData({...data, heroSlides: ns});
                       }
                     }}
                     value=""
                   >
                     <option value="">-- Pilih Gunung --</option>
                     {config.destinationsData?.map((d: any) => (
                       <option key={d.id} value={d.name}>{d.name}</option>
                     ))}
                   </select>
                   <label className="text-[10px] font-bold uppercase block mb-1">Nama Gunung</label>
                   <input className="w-full border p-2 rounded text-xs" value={slide.name} onChange={e => {
                      const ns = [...data.heroSlides]; ns[i].name = e.target.value; setData({...data, heroSlides: ns});
                   }} placeholder="Nama Gunung" />
                </div>
                <div>
                   <label className="text-[10px] font-bold uppercase block mb-1">Ketinggian (Cth: 3.676)</label>
                   <input className="w-full border p-2 rounded text-xs" value={slide.height} onChange={e => {
                      const ns = [...data.heroSlides]; ns[i].height = e.target.value; setData({...data, heroSlides: ns});
                   }} placeholder="Ketinggian MDPL" />
                </div>
                <div>
                   <label className="text-[10px] font-bold uppercase block mb-1">Foto Background</label>
                   <ImageUploader value={slide.image} onChange={(url) => {
                      const ns = [...data.heroSlides]; ns[i].image = url; setData({...data, heroSlides: ns});
                   }} placeholder="URL Foto Gunung" />
                </div>
             </div>
           ))}
        </div>
      </div>

      <div className="pt-6 border-t-2 border-dashed border-art-text/20 space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-art-text/40 tracking-widest block">Foto Background Hero</label>
          <ImageUploader value={data.heroPhotoUrl || ''} onChange={(url) => setData({...data, heroPhotoUrl: url})} placeholder="URL Foto Utama Hero" />
        </div>
      </div>

      <button onClick={handleSave} className="bg-art-orange text-white px-4 py-2 rounded text-xs font-bold uppercase w-full">Simpan Homepage</button>
    </div>
  );
};


export const CleanupPhotosAdmin = ({ config, updateConfig, showToast }: any) => {
  const handleCleanup = () => {
    customConfirm("Beneran mau hapus semua URL foto? Tindakan ini tidak bisa dibatalkan!", () => {
      const newConfig = {
        ...config,
        destinationsData: config.destinationsData.map((d: any) => ({ ...d, image: "" })),
        tripLeaders: config.tripLeaders.map((l: any) => ({ ...l, avatar: "" })),
        homepage: { ...config.homepage, heroPhotoUrl: "" },
        galleryPhotos: []
      };
      updateConfig(newConfig);
      showToast('Foto dibersihkan!');
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg border-2 border-red-500 space-y-4">
      <h3 className="font-bold text-sm uppercase text-red-600">Cleanup Database</h3>
      <p className="text-xs">Hapus semua referensi foto dari database untuk memperbarui secara manual.</p>
      <button onClick={handleCleanup} className="bg-red-600 text-white px-4 py-2 rounded text-xs font-bold uppercase">Hapus Semua Foto</button>
    </div>
  );
};



export const FacilitiesAdmin = ({ config, updateConfig, showToast, defaultList }: any) => {
  const [data, setData] = useState(config.facilities || { include: [], exclude: [], opsi: [] });

  const moveItem = (key: 'include' | 'exclude' | 'opsi', index: number, direction: 'up' | 'down') => {
    const newData = { ...data };
    const list = [...newData[key]];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;
    [list[index], list[newIndex]] = [list[newIndex], list[index]];
    newData[key] = list;
    setData(newData);
  };

  useEffect(() => {
    if (config.facilities) {
      setData(config.facilities);
    }
  }, [config.facilities]);

  const handleSave = () => { 
    updateConfig({ facilities: data }); 
    showToast('Tersimpan!'); 
  };

  const addOption = () => {
    const nd = { ...data };
    if (!nd.opsi) nd.opsi = [];
    nd.opsi = [...nd.opsi, { name: "Opsi Baru", priceInfo: "", subItems: [] }];
    setData(nd);
  };

  const addSubItem = (optIdx: number) => {
    const nd = { ...data };
    const targetOpsi = { ...nd.opsi[optIdx] };
    if (!targetOpsi.subItems) targetOpsi.subItems = [];
    targetOpsi.subItems = [...targetOpsi.subItems, { name: "Sub Item Baru", priceInfo: "Rp 50rb" }];
    nd.opsi[optIdx] = targetOpsi;
    setData(nd);
  };

  const updateSubItem = (optIdx: number, subIdx: number, field: string, value: string) => {
    const nd = { ...data };
    nd.opsi[optIdx].subItems[subIdx][field] = value;
    setData(nd);
  };

  const removeSubItem = (optIdx: number, subIdx: number) => {
    const nd = { ...data };
    nd.opsi[optIdx].subItems.splice(subIdx, 1);
    setData(nd);
  };

  const renderSimpleList = (key: 'include' | 'exclude', label: string) => (
    <div className="bg-white p-4 rounded-lg border-2 border-art-text space-y-3">
      <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
        <h3 className="font-bold text-sm uppercase">{label}</h3>
          <button type="button" onClick={(e) => {
            e.preventDefault();
            setData({ ...data, [key]: [...data[key], "Item Baru"] });
          }} className="text-xs bg-art-text text-white px-2 py-1 rounded">+ Tambah</button>
      </div>
      {data[key].map((item: string, i: number) => (
        <div key={i} className="flex gap-2">
          <div className="flex flex-col gap-1">
             <button type="button" onClick={() => moveItem(key, i, 'up')} className="p-1 hover:bg-gray-100 rounded" disabled={i === 0}><ChevronDown size={14} className="rotate-180"/></button>
             <button type="button" onClick={() => moveItem(key, i, 'down')} className="p-1 hover:bg-gray-100 rounded" disabled={i === data[key].length - 1}><ChevronDown size={14}/></button>
          </div>
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
        <div className="flex gap-2">
          <button onClick={() => {
            customConfirm("Beneran mau reset fasilitas ke default?", () => {
              const defaultData = JSON.parse(JSON.stringify(defaultList || { include: [], exclude: [], opsi: [] }));
              setData(defaultData);
              updateConfig({ facilities: defaultData });
              showToast('Direset ke Default!');
            });
          }} className="bg-red-100 text-red-600 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hidden sm:block">Reset Default</button>
          <button onClick={handleSave} className="bg-art-orange text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">Simpan</button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderSimpleList('include', 'Termasuk (Include)')}
        {renderSimpleList('exclude', 'Tidak Termasuk (Exclude)')}
      </div>

      <div className="bg-white p-4 rounded-lg border-2 border-art-text space-y-4">
        <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
          <h3 className="font-bold text-sm uppercase">Opsi Tambahan (Bisa Sub-Item)</h3>
          <button onClick={(e) => { e.preventDefault(); addOption(); }} className="text-xs bg-art-text text-white px-2 py-1 rounded">+ Tambah Opsi Utama</button>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {data.opsi.map((opt: FacilityOption, i: number) => (
            <div key={i} className="border-2 border-art-text/10 p-4 rounded-xl space-y-3 relative bg-art-bg/20">
               <div className="absolute top-4 right-4 flex gap-2 z-20">
                  <div className="flex bg-white rounded border border-art-text/10 overflow-hidden">
                    <button type="button" onClick={() => moveItem('opsi', i, 'up')} className="p-1.5 hover:bg-gray-100 border-r border-art-text/10" disabled={i === 0}><ChevronDown size={16} className="rotate-180"/></button>
                    <button type="button" onClick={() => moveItem('opsi', i, 'down')} className="p-1.5 hover:bg-gray-100" disabled={i === data.opsi.length - 1}><ChevronDown size={16}/></button>
                  </div>
                  <button onClick={() => {
                 const nd = { ...data }; nd.opsi.splice(i, 1); setData(nd);
               }} className="bg-white border border-art-text/10 text-red-500 rounded p-1.5 shadow-sm hover:bg-red-50"><Trash2 size={18} /></button>
                </div>
               
               <div className="mb-4 w-full sm:w-72">
                  <label className="text-[10px] font-black uppercase text-art-orange block mb-1 font-mono tracking-tighter">Format Penghargaan (Sistem)</label>
                  <select 
                    className="w-full border p-2 rounded text-xs font-bold bg-white uppercase tracking-tight shadow-sm cursor-pointer border-art-text/20"
                    value={opt.pricingFormat || 'manual'}
                    onChange={e => {
                      const nd = { ...data };
                      nd.opsi[i].pricingFormat = e.target.value as any;
                      setData(nd);
                    }}
                  >
                    <option value="manual">Disesuaikan Admin (Manual)</option>
                    <option value="calculated">Kalkulasi Item (Hari x Qty x Harga)</option>
                  </select>
               </div>
               <div className="flex flex-col sm:flex-row gap-3 pr-10">
                 <div className="flex-1">
                   <label className="text-[10px] font-black uppercase text-art-text/40 block mb-1">Nama Opsi</label>
                   <input className="w-full border p-2 rounded text-xs font-bold" value={opt.name} onChange={e => {
                      const nd = { ...data }; nd.opsi[i].name = e.target.value; setData(nd);
                   }} />
                 </div>
                 <div className="w-full sm:w-48">
                   <label className="text-[10px] font-black uppercase text-art-text/40 block mb-1">Info Harga (Slip Desc)</label>
                   <input className="w-full border p-2 rounded text-xs" value={opt.priceInfo || ''} onChange={e => {
                      const nd = { ...data }; nd.opsi[i].priceInfo = e.target.value; setData(nd);
                   }} placeholder="Cth: Rp 10rb/pax" />
                 </div>
               </div>

               <div className="pl-6 border-l-2 border-art-orange/20 space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-art-orange">Sub-Items (Spesifik)</span>
          <button type="button" onClick={(e) => { e.preventDefault(); addSubItem(i); }} className="text-[9px] bg-art-orange text-white px-2 py-1 rounded uppercase font-bold">+ Tambah Sub</button>
                  </div>
                  
                  {opt.subItems?.map((sub, sIdx) => (
                    <div key={sIdx} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <input className="w-full border-b p-1 text-[11px] outline-none focus:border-art-orange bg-transparent" value={sub.name} onChange={e => updateSubItem(i, sIdx, 'name', e.target.value)} placeholder="Nama Item" />
                      </div>
                      <div className="w-32 relative">
                        <span className="absolute left-0 bottom-1.5 text-[9px] font-black text-art-text/40 uppercase">Rp</span>
                        <input 
                          className="w-full border-b pl-6 p-1 text-[11px] outline-none focus:border-art-orange bg-transparent font-mono" 
                          value={sub.priceInfo || ''} 
                          onChange={e => {
                            const raw = e.target.value.replace(/[^0-9]/g, '');
                            const num = parseInt(raw);
                            updateSubItem(i, sIdx, 'priceInfo', raw ? Number(raw).toLocaleString('id-ID') : '');
                            const nd = { ...data };
                            nd.opsi[i].subItems[sIdx].price = isNaN(num) ? 0 : num / 1000;
                            setData(nd);
                          }} 
                          placeholder="50.000" 
                        />
                      </div>
                      <button onClick={() => removeSubItem(i, sIdx)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                    </div>
                  ))}
                  {(!opt.subItems || opt.subItems.length === 0) && <p className="text-[10px] text-art-text/30 italic">Belum ada sub-item.</p>}
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


export const PromoCodesAdmin = ({ config, updateConfig, showToast }: any) => {
  const [data, setData] = useState(config.promoCodes || []);

  useEffect(() => {
    setData(config.promoCodes || []);
  }, [config.promoCodes]);

  const handleSave = () => { updateConfig({ promoCodes: data }); showToast('Tersimpan!'); };

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between bg-white p-4 rounded-lg border border-art-text/20">
        <p className="text-xs font-bold uppercase text-art-text/60 font-black">Manajemen Kode Promo</p>
        <div className="flex gap-2">
           <button type="button" onClick={(e) => {
             e.preventDefault();
             const nd = [{ code: "BARU", discount: 10 }, ...data];
             setData(nd);
           }} className="bg-art-text text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest font-black">+ Kode Promo</button>
           <button onClick={handleSave} className="bg-art-orange text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest font-black">Simpan</button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((promo: any, i: number) => (
          <div key={i} className="bg-white p-4 rounded-xl border-2 border-art-text flex flex-col gap-3 relative">
            <button onClick={() => {
              const nd = [...data]; nd.splice(i, 1); setData(nd);
            }} className="absolute top-2 right-2 text-red-500 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
            
            <div>
              <label className="text-[10px] font-black uppercase text-art-text/40 block mb-1">Kode Promo</label>
              <input 
                className="w-full border-2 border-art-text p-2 rounded-lg font-black uppercase text-sm" 
                value={promo.code} 
                onChange={e => {
                  const nd = [...data]; nd[i].code = e.target.value; setData(nd);
                }} 
                placeholder="PROMOCODE"
              />
            </div>
            
            <div>
              <label className="text-[10px] font-black uppercase text-art-text/40 block mb-1">Diskon (%)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="number"
                  className="w-full border-2 border-art-text p-2 rounded-lg font-black text-sm" 
                  value={promo.discount} 
                  onChange={e => {
                    const nd = [...data]; nd[i].discount = parseInt(e.target.value) || 0; setData(nd);
                  }} 
                  min="0"
                  max="100"
                />
                <span className="font-black text-xl text-art-text">%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


