import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadFile } from '../lib/storage-utils';
import { X, Trash2, Plus, GripVertical, Users, Calendar, MapPin, Coffee, Mountain, Info, AlertCircle, FileText, Download, CheckCircle, Send, Globe, Map, Edit2, ChevronDown, ChevronUp, Clock, TrendingUp, CreditCard, User, Clipboard, ChevronRight, ShoppingBag, MessageCircle, Eye, EyeOff, Phone } from 'lucide-react';
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
                <button type="button" onClick={() => {
                  const nd = [...data]; nd[i].isHidden = !nd[i].isHidden; setData(nd);
                }} className={`p-1 rounded shadow-sm border ${photo.isHidden ? 'bg-gray-100 text-gray-500 border-art-text/20' : 'bg-white text-art-text border-art-text/10'} hover:bg-gray-50`}>
                  {photo.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
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
  const [data, setData] = useState({ 
    ...config.homepage, 
    heroSlides: config.homepage.heroSlides || [],
    logo: config.homepage.logo || "https://files.catbox.moe/lubzno.png",
    logos: config.homepage.logos || [{ id: 'default', name: 'Logo Default', url: config.homepage.logo || "https://files.catbox.moe/lubzno.png" }]
  });

  const handleSave = () => {
    updateConfig({ homepage: data });
    showToast('Hero & Slide Tersimpan!');
  };

  const activateLogo = (url: string) => {
    setData({ ...data, logo: url });
    showToast('Logo Aktif Diperbarui!');
  };

  return (
    <div className="bg-white p-6 rounded-2xl border-2 border-art-text space-y-8 text-left">
      {/* Branding & Logo Section */}
      <div className="bg-art-bg/30 p-6 rounded-2xl border-2 border-art-text space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-art-orange rounded-xl flex items-center justify-center text-white shadow-sm rotate-3">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-widest text-art-text">Manajemen Branding</h3>
              <p className="text-[10px] font-bold text-art-text/40 uppercase">Kelola koleksi logo dan pilih yang aktif</p>
            </div>
          </div>
          <button 
            onClick={() => setData({...data, logos: [...(data.logos || []), { id: Date.now().toString(), url: "", name: "Logo Baru" }]})}
            className="bg-art-text text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
          >
            <Plus size={14} /> Tambah Logo
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
              {(data.logos || []).map((l: any, idx: number) => (
                <div key={l.id || idx} className={`bg-white p-4 rounded-2xl border-2 transition-all relative group ${data.logo === l.url ? 'border-art-orange shadow-[4px_4px_0px_0px_rgba(255,107,0,1)]' : 'border-art-text/10'}`}>
                  {data.logo === l.url && (
                    <div className="absolute -top-3 -left-3 bg-art-orange text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-sm">Aktif</div>
                  )}
                  <button 
                    onClick={() => {
                      const nl = [...data.logos];
                      nl.splice(idx, 1);
                      setData({...data, logos: nl});
                    }}
                    className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                  
                  <div className="flex gap-4 items-start">
                    <div className="w-16 h-16 rounded-xl border border-art-text/10 bg-art-bg/50 p-2 flex items-center justify-center shrink-0">
                      {l.url ? <img src={l.url} className="w-full h-full object-contain" alt="Preview"/> : <ShoppingBag size={20} className="text-art-text/10"/>}
                    </div>
                    <div className="flex-1 space-y-2">
                       <input 
                         className="w-full border-b border-art-text/10 text-[10px] font-bold outline-none focus:border-art-orange pb-1"
                         value={l.name || ''}
                         onChange={e => {
                            const nl = [...data.logos];
                            nl[idx].name = e.target.value;
                            setData({...data, logos: nl});
                         }}
                         placeholder="Nama Label"
                       />
                       <InputWithPaste 
                         className="w-full border-b border-art-text/10 text-[9px] font-mono outline-none focus:border-art-orange pb-1"
                         value={l.url || ''}
                         onChange={(e: any) => {
                            const nl = [...data.logos];
                            nl[idx].url = e.target.value;
                            setData({...data, logos: nl});
                         }}
                         placeholder="URL Image"
                       />
                       {data.logo !== l.url && l.url && (
                         <button 
                           onClick={() => activateLogo(l.url)}
                           className="w-full mt-2 bg-art-bg text-art-text py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-art-text/10 hover:bg-art-text hover:text-white transition-all"
                         >
                           Aktivasi Logo
                         </button>
                       )}
                    </div>
                  </div>
                </div>
              ))}
              {(data.logos || []).length === 0 && (
                <div className="col-span-full py-10 border-2 border-dashed border-art-text/10 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-art-text/30 uppercase tracking-widest">Koleksi logo kosong</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-art-text p-6 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden group">
             {data.logo ? (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-30"></div>
                  <img src={data.logo} className="max-w-full max-h-40 object-contain drop-shadow-2xl relative z-10 transition-transform group-hover:scale-110" alt="Active Logo" key={data.logo}/>
                  <div className="mt-8 relative z-10 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-art-orange mb-1">Logo Website Aktif</p>
                    <p className="text-[9px] font-bold text-art-text/30 uppercase italic">Tampil di Header & Footer</p>
                  </div>
                </>
             ) : (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-art-bg rounded-3xl flex items-center justify-center mx-auto border-2 border-dashed border-art-text/10">
                    <ShoppingBag size={40} className="text-art-text/10"/>
                  </div>
                  <p className="text-[10px] font-black uppercase text-art-text/20 tracking-widest">Belum ada logo aktif</p>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Sound Settings Section */}
      <div className="bg-art-bg/30 p-6 rounded-2xl border-2 border-art-text space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-art-green rounded-xl flex items-center justify-center text-white shadow-sm rotate-3">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-widest text-art-text">Pengaturan Efek Suara</h3>
            <p className="text-[10px] font-bold text-art-text/40 uppercase">Atur volume dan status suara aplikasi</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="flex items-center justify-between bg-white p-4 rounded-2xl border-2 border-art-text">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-art-text">Status Efek Suara</p>
                <p className="text-[9px] font-bold text-art-text/40 uppercase mt-1">{data.soundEnabled ? 'Suara Aktif' : 'Suara Dimatikan'}</p>
              </div>
              <button 
                onClick={() => setData({...data, soundEnabled: !data.soundEnabled})}
                className={`w-14 h-8 rounded-full p-1 transition-all ${data.soundEnabled ? 'bg-art-green' : 'bg-gray-300'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all ${data.soundEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
           </div>
           
           <div className="bg-white p-4 rounded-2xl border-2 border-art-text">
              <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-art-text">Master Volume</p>
                <span className="text-[10px] font-black text-art-orange px-2 py-1 bg-art-orange/10 rounded-lg">{Math.round((data.soundVolume || 0.8) * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01"
                className="w-full accent-art-orange h-2 bg-art-bg rounded-lg appearance-none cursor-pointer"
                value={data.soundVolume || 0.8}
                onChange={e => setData({...data, soundVolume: parseFloat(e.target.value)})}
              />
           </div>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
           <Edit2 size={16} className="text-art-orange" /> Edit Teks Hero Utama
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 p-4 bg-art-bg/50 rounded-xl border-2 border-art-text/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-art-text">Slogan Atas</p>
            </div>
            <button 
              onClick={() => setData({...data, hideHeroSlogan: !data.hideHeroSlogan})}
              className={`w-10 h-5 rounded-full p-0.5 transition-all ${!data.hideHeroSlogan ? 'bg-art-green' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all ${!data.hideHeroSlogan ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-art-text">Floating Features</p>
            </div>
            <button 
              onClick={() => setData({...data, hideHeroFeatures: !data.hideHeroFeatures})}
              className={`w-10 h-5 rounded-full p-0.5 transition-all ${!data.hideHeroFeatures ? 'bg-art-green' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all ${!data.hideHeroFeatures ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-art-text">Tagline</p>
            </div>
            <button 
              onClick={() => setData({...data, hideHeroTagline: !data.hideHeroTagline})}
              className={`w-10 h-5 rounded-full p-0.5 transition-all ${!data.hideHeroTagline ? 'bg-art-green' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all ${!data.hideHeroTagline ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
          </div>
        </div>

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
              <label className="text-[10px] font-black uppercase text-art-text/40 mb-1 ml-1">Tagline Bawah (Copy Sederhana)</label>
              <input className="w-full border-2 border-art-text/10 p-2 rounded-xl text-xs font-bold" value={data.heroTagline || ''} onChange={e => setData({...data, heroTagline: e.target.value})} placeholder="Sederhana tapi berkesan" />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
           <div>
              <label className="text-[10px] font-black uppercase text-art-text/40 mb-1 ml-1">Stat: Happy Hikers</label>
              <input className="w-full border-2 border-art-text/10 p-2 rounded-xl text-xs font-bold" value={data.statHikers || ''} onChange={e => setData({...data, statHikers: e.target.value})} placeholder="100+" />
           </div>
           <div>
              <label className="text-[10px] font-black uppercase text-art-text/40 mb-1 ml-1">Stat: Satisfaction Rate</label>
              <input className="w-full border-2 border-art-text/10 p-2 rounded-xl text-xs font-bold" value={data.statSatisfaction || ''} onChange={e => setData({...data, statSatisfaction: e.target.value})} placeholder="99%" />
           </div>
           <div>
              <label className="text-[10px] font-black uppercase text-art-text/40 mb-1 ml-1">Stat: Trips Completed</label>
              <input className="w-full border-2 border-art-text/10 p-2 rounded-xl text-xs font-bold" value={data.statTrips || ''} onChange={e => setData({...data, statTrips: e.target.value})} placeholder="50+" />
           </div>
        </div>

        <div className="mt-6 border-2 border-dashed border-art-text/20 p-4 rounded-2xl">
          <label className="text-[10px] font-black uppercase text-art-text/40 mb-3 block">Urutan Elemen Hero (Atas ke Bawah)</label>
          <div className="flex flex-col gap-2">
            {(data.heroOrder || ['slogan', 'features', 'title', 'tagline', 'description', 'buttons', 'stats', 'slider']).map((item: string, idx: number, arr: string[]) => (
              <div key={item} className="flex items-center justify-between bg-white border border-art-text/10 p-2 px-3 rounded-lg shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-art-text">{item}</span>
                <div className="flex gap-1">
                  <button 
                    type="button" 
                    className="p-1 bg-art-bg rounded hover:bg-art-text hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-art-bg disabled:hover:text-current"
                    disabled={idx === 0}
                    onClick={() => {
                      const newOrder = [...arr];
                      [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
                      setData({...data, heroOrder: newOrder});
                    }}
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button 
                    type="button" 
                    className="p-1 bg-art-bg rounded hover:bg-art-text hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-art-bg disabled:hover:text-current"
                    disabled={idx === arr.length - 1}
                    onClick={() => {
                      const newOrder = [...arr];
                      [newOrder[idx + 1], newOrder[idx]] = [newOrder[idx], newOrder[idx + 1]];
                      setData({...data, heroOrder: newOrder});
                    }}
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
              </div>
            ))}
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

      <div className="pt-6 border-t-2 border-dashed border-art-text/20 space-y-4 pb-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-art-text/40 tracking-widest block">Foto Background Hero Utama (Manual Override)</label>
          <ImageUploader value={data.heroPhotoUrl || ''} onChange={(url) => setData({...data, heroPhotoUrl: url})} placeholder="URL Foto Utama Hero" />
        </div>
      </div>

      <button onClick={handleSave} className="bg-art-orange text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] w-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">Simpan Konfigurasi Branding & Hero</button>
    </div>
  );
};


export const FooterAdmin = ({ config, updateConfig, showToast }: any) => {
  const [data, setData] = useState({ 
    ...config.homepage,
    socialLinks: config.homepage.socialLinks || [
      { icon: 'instagram', url: '#' },
      { icon: 'whatsapp', url: '#' },
      { icon: 'telegram', url: '#' }
    ],
    paymentMethods: config.homepage.paymentMethods || [
      { name: 'BCA', active: true },
      { name: 'BNI', active: true },
      { name: 'MANDIRI', active: true },
      { name: 'GOPAY', active: true },
      { name: 'DANA', active: true },
      { name: 'QRIS', active: true }
    ]
  });

  const handleSave = () => {
    updateConfig({ homepage: data });
    showToast('Tersimpan!');
  };

  return (
    <div className="bg-white p-6 rounded-2xl border-2 border-art-text space-y-8 text-left">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-art-text rounded-2xl flex items-center justify-center text-white rotate-6 shadow-lg">
          <Info size={24} />
        </div>
        <div>
          <h2 className="font-black text-lg uppercase tracking-tighter text-art-text leading-none">About Us & Footer</h2>
          <p className="text-[10px] font-bold text-art-text/30 uppercase mt-1 tracking-widest">Atur konten bagian bawah website</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-art-bg/30 p-5 rounded-2xl border-2 border-art-text space-y-4">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-art-text/60 mb-2">Informasi Perusahaan</h3>
            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-black uppercase text-art-text/40 mb-1 block ml-1">Deskripsi Footer</label>
                  <textarea 
                    className="w-full border-2 border-art-text/10 p-3 rounded-xl text-xs font-medium h-24 resize-none bg-white focus:border-art-orange outline-none transition-all" 
                    value={data.footerDesc || ''} 
                    onChange={e => setData({...data, footerDesc: e.target.value})} 
                    placeholder="Tuliskan deskripsi singkat tentang provider trip Anda..."
                  />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-art-text/40 mb-1 block ml-1">Email Support</label>
                  <input 
                    className="w-full border-2 border-art-text/10 p-3 rounded-xl text-xs font-bold bg-white focus:border-art-orange outline-none transition-all" 
                    value={data.officeEmail || ''} 
                    onChange={e => setData({...data, officeEmail: e.target.value})} 
                    placeholder="support@ngopi.com"
                  />
               </div>
               <div className="col-span-1 md:col-span-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black uppercase text-art-text/40 ml-1">Kontak WhatsApp</label>
                    <button type="button" onClick={() => {
                       const nw = [...(data.whatsappContacts || [{name: 'Admin', phone: data.officePhone || ''}])];
                       nw.push({ name: 'Admin ' + (nw.length + 1), phone: '628123456789' });
                       setData({...data, whatsappContacts: nw});
                    }} className="text-[9px] bg-art-bg px-2 py-1 flex items-center gap-1 rounded font-bold uppercase tracking-widest hover:bg-art-text hover:text-white transition-all"><Plus size={10} /> Tambah Kontak</button>
                  </div>
                  <div className="space-y-2">
                    {(data.whatsappContacts || [{name: 'Admin', phone: data.officePhone || ''}]).map((wa: any, i: number) => (
                       <div key={i} className="flex gap-2">
                          <input 
                            className="flex-1 border-2 border-art-text/10 p-2 rounded-xl text-xs font-bold bg-white focus:border-art-orange outline-none transition-all" 
                            value={wa.name || ''} 
                            onChange={e => {
                               const nw = [...(data.whatsappContacts || [{name: 'Admin', phone: data.officePhone}])];
                               nw[i] = { ...nw[i], name: e.target.value };
                               setData({...data, whatsappContacts: nw});
                            }} 
                            placeholder="Nama Kontak (mis. Admin 1)"
                          />
                          <input 
                            className="flex-1 border-2 border-art-text/10 p-2 rounded-xl text-xs font-bold bg-white focus:border-art-orange outline-none transition-all font-mono" 
                            value={wa.phone || ''} 
                            onChange={e => {
                               const nw = [...(data.whatsappContacts || [{name: 'Admin', phone: data.officePhone}])];
                               nw[i] = { ...nw[i], phone: e.target.value };
                               setData({...data, whatsappContacts: nw});
                            }} 
                            placeholder="62812xxx..."
                          />
                          <button type="button" onClick={() => {
                             const nw = [...(data.whatsappContacts || [{name: 'Admin', phone: data.officePhone}])];
                             nw.splice(i, 1);
                             setData({...data, whatsappContacts: nw});
                          }} className="p-2 text-red-500 hover:bg-red-50 border-2 border-red-100 rounded-xl"><Trash2 size={16} /></button>
                       </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-medium leading-relaxed italic text-art-text/40 mt-2 ml-1">
                    Pastikan nomor diawali kode negara (cth: 62). Nama kontak akan ditampilkan di website (Mis: "Admin 1", "Admin Reservasi"), bukan nomornya.
                  </p>
               </div>
            </div>
          </div>

          <div className="bg-art-bg/30 p-5 rounded-2xl border-2 border-art-text space-y-4">
             <h3 className="font-black text-[10px] uppercase tracking-widest text-art-text/60 mb-2">Promo Banner (Bottom)</h3>
             <div className="space-y-4">
                <div>
                   <label className="text-[10px] font-black uppercase text-art-text/40 mb-1 block ml-1">Banner Image URL</label>
                   <ImageUploader value={data.promoBannerImg || ''} onChange={(url) => setData({...data, promoBannerImg: url})} />
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase text-art-text/40 mb-1 block ml-1">Banner Link (e.g. #destinasi)</label>
                   <input 
                     className="w-full border-2 border-art-text/10 p-3 rounded-xl text-xs font-bold bg-white focus:border-art-orange outline-none transition-all" 
                     value={data.promoBannerLink || ''} 
                     onChange={e => setData({ ...data, promoBannerLink: e.target.value })}
                     placeholder="#destinasi"
                   />
                </div>
             </div>
          </div>

          <div className="bg-art-bg/30 p-5 rounded-2xl border-2 border-art-text space-y-4">
             <h3 className="font-black text-[10px] uppercase tracking-widest text-art-text/60 mb-2">Lokasi & Maps</h3>
             <div className="space-y-4">
                <div>
                   <label className="text-[10px] font-black uppercase text-art-text/40 mb-1 block ml-1">Alamat Kantor</label>
                   <textarea 
                     className="w-full border-2 border-art-text/10 p-3 rounded-xl text-xs font-medium h-20 resize-none bg-white focus:border-art-orange outline-none transition-all" 
                     value={data.officeAddress || ''} 
                     onChange={e => setData({...data, officeAddress: e.target.value})} 
                     placeholder="Jl. Raya..."
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase text-art-text/40 mb-1 block ml-1">Link Google Maps (Iframe Src / Link)</label>
                   <InputWithPaste 
                     className="w-full border-2 border-art-text/10 p-3 rounded-xl text-[10px] font-mono bg-white focus:border-art-orange outline-none transition-all" 
                     value={data.officeMaps || ''} 
                     onChange={(e: any) => setData({...data, officeMaps: e.target.value})} 
                     placeholder="https://goo.gl/maps/..." 
                   />
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-art-orange/10 p-5 rounded-2xl border-2 border-art-orange/30 space-y-4">
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-art-orange/20">
                <h3 className="font-black text-[10px] uppercase tracking-widest text-art-orange">Sosial Media & Kontak</h3>
                <button 
                  onClick={() => setData({...data, socialLinks: [...(data.socialLinks || []), { icon: 'instagram', url: '#' }]})}
                  className="bg-art-orange text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase"
                >
                  + Link
                </button>
              </div>
              <div className="space-y-3">
                 {(data.socialLinks || []).map((link: any, idx: number) => (
                   <div key={idx} className="flex gap-3 items-center bg-white p-3 rounded-xl border-2 border-art-text/5 relative">
                      <select 
                        value={link.icon} 
                        onChange={e => {
                           const nl = [...data.socialLinks];
                           nl[idx].icon = e.target.value;
                           setData({...data, socialLinks: nl});
                        }}
                        className="bg-art-bg text-[10px] font-black uppercase p-2 rounded-lg border border-art-text/10 outline-none"
                      >
                         <option value="instagram">Instagram</option>
                         <option value="whatsapp">WhatsApp</option>
                         <option value="telegram">Telegram</option>
                         <option value="facebook">Facebook</option>
                         <option value="tiktok">TikTok</option>
                         <option value="youtube">YouTube</option>
                      </select>
                      <input 
                        className="flex-1 border-b-2 border-art-text/5 p-2 text-xs font-bold focus:border-art-orange outline-none" 
                        value={link.url}
                        onChange={e => {
                           const nl = [...data.socialLinks];
                           nl[idx].url = e.target.value;
                           setData({...data, socialLinks: nl});
                        }}
                        placeholder="https://..."
                      />
                      <button 
                        onClick={() => {
                           const nl = [...data.socialLinks];
                           nl.splice(idx, 1);
                           setData({...data, socialLinks: nl});
                        }}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-art-bg/30 p-5 rounded-2xl border-2 border-art-text space-y-4">
              <h3 className="font-black text-[10px] uppercase tracking-widest text-art-text/60 mb-2">Metode Pembayaran (Footer)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                 {(data.paymentMethods || []).map((method: any, idx: number) => (
                   <button 
                     key={method.name}
                     onClick={() => {
                        const npm = [...data.paymentMethods];
                        npm[idx].active = !npm[idx].active;
                        setData({...data, paymentMethods: npm});
                     }}
                     className={`p-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-tighter transition-all flex items-center justify-between ${method.active ? 'bg-white border-art-orange text-art-orange shadow-[2px_2px_0px_0px_rgba(255,107,0,1)]' : 'bg-gray-100 border-gray-200 text-gray-400'}`}
                   >
                     {method.name}
                     {method.active ? <CheckCircle size={10} /> : <div className="w-2.5 h-2.5 rounded-full border border-gray-300"></div>}
                   </button>
                 ))}
              </div>
              <div className="flex gap-2">
                 <input 
                   id="newPaymentMethod"
                   className="flex-1 border-2 border-art-text/10 p-2 rounded-xl text-[10px] font-bold outline-none focus:border-art-orange"
                   placeholder="Tambah Metode Baru (cth: OVO)"
                 />
                 <button 
                   onClick={() => {
                      const input = document.getElementById('newPaymentMethod') as HTMLInputElement;
                      if(input.value) {
                         setData({...data, paymentMethods: [...(data.paymentMethods || []), { name: input.value.toUpperCase(), active: true }]});
                         input.value = '';
                      }
                   }}
                   className="bg-art-text text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase"
                 >
                   +
                 </button>
              </div>
           </div>

           <div className="bg-art-text text-white p-6 rounded-2xl border-2 border-art-text shadow-xl space-y-4">
              <h4 className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <CheckCircle size={14} className="text-art-orange" /> Preview Footer
              </h4>
              <div className="space-y-4 opacity-70">
                 <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Phone size={14} /></div>
                    <span className="text-[10px] font-bold">{data.officePhone || '-'}</span>
                 </div>
                 <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><MessageCircle size={14} /></div>
                    <span className="text-[10px] font-bold">{data.officeEmail || '-'}</span>
                 </div>
              </div>
              <p className="text-[10px] font-medium leading-relaxed italic text-white/40">
                "Pastikan nomor WhatsApp diawali dengan kode negara (cth: 62) agar link chat otomatis berfungsi dengan baik."
              </p>
           </div>
        </div>
      </div>

      <button onClick={handleSave} className="bg-art-text text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] w-full shadow-[4px_4px_0px_0px_rgba(255,107,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">Simpan Konten Footer</button>
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
      {data[key].map((item: any, i: number) => {
        const isHidden = typeof item === 'object' ? item.isHidden : false;
        const itemName = typeof item === 'object' ? item.name : item;
        return (
        <div key={i} className="flex gap-2">
          <div className="flex flex-col gap-1">
             <button type="button" onClick={() => moveItem(key, i, 'up')} className="p-1 hover:bg-gray-100 rounded border border-transparent" disabled={i === 0}><ChevronDown size={14} className="rotate-180"/></button>
             <button type="button" onClick={() => moveItem(key, i, 'down')} className="p-1 hover:bg-gray-100 rounded border border-transparent" disabled={i === data[key].length - 1}><ChevronDown size={14}/></button>
          </div>
          <input className="border p-2 rounded text-sm flex-1" value={itemName} onChange={e => {
            const nd = { ...data }; 
            nd[key][i] = { name: e.target.value, isHidden }; 
            setData(nd);
          }} />
          <button type="button" onClick={() => {
            const nd = { ...data };
            nd[key][i] = { name: itemName, isHidden: !isHidden };
            setData(nd);
          }} className={`p-2 border rounded shadow-sm ${isHidden ? 'bg-gray-100 text-gray-500' : 'bg-white text-art-text hover:bg-gray-50'}`}>
            {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button type="button" onClick={() => {
            const nd = { ...data }; nd[key].splice(i, 1); setData(nd);
          }} className="text-red-500 p-2 border rounded hover:bg-red-50 shadow-sm"><Trash2 size={16} /></button>
        </div>
      )})}
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
                  <button type="button" onClick={() => {
                    const nd = { ...data }; nd.opsi[i].isHidden = !nd.opsi[i].isHidden; setData(nd);
                  }} className={`p-1.5 rounded shadow-sm border ${opt.isHidden ? 'bg-gray-100 text-gray-500 border-art-text/20' : 'bg-white text-art-text border-art-text/10'} hover:bg-gray-50`}>
                    {opt.isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button type="button" onClick={() => {
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


