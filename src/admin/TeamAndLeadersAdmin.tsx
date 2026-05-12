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



export const TeamPhotosAdmin = ({ config, updateConfig, showToast }: any) => {
  const [photos, setPhotos] = useState(config.teamPhotos || []);

  const handleSave = () => {
    updateConfig({ teamPhotos: photos });
    showToast('Foto Tim Tersimpan!');
  };

  return (
    <div className="bg-white p-4 rounded-lg border-2 border-art-text space-y-4">
      <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
        <h3 className="font-bold text-sm uppercase">Foto Tim Lapangan (Maks 4)</h3>
        <div className="flex gap-2">
          <button onClick={() => setPhotos([...photos, ""])} className="text-xs bg-art-text text-white px-2 py-1 rounded">+ Foto</button>
          <button onClick={handleSave} className="text-xs bg-art-orange text-white px-2 py-1 rounded">Simpan</button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {photos.map((url: string, i: number) => (
          <div key={i} className="space-y-2 relative">
            <button onClick={() => {
              const np = [...photos]; np.splice(i, 1); setPhotos(np);
            }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md z-10"><Trash2 size={12}/></button>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-art-text/10">
              {url && <img src={url} className="w-full h-full object-cover" />}
            </div>
            <InputWithPaste className="w-full border p-1 text-[10px] rounded" value={url} onChange={(e: any) => {
              const np = [...photos]; np[i] = e.target.value; setPhotos(np);
            }} placeholder="URL Image" />
          </div>
        ))}
      </div>
    </div>
  );
};


export const LeadersAdmin = ({ config, updateConfig, showToast, defaultList }: any) => {
  const [data, setData] = useState([...(config.tripLeaders || [])]);
  const [leaderTitle, setLeaderTitle] = useState(config.homepage?.leaderTitle || '');
  const [leaderSub, setLeaderSub] = useState(config.homepage?.leaderSub || '');
  const [leaderParagraph, setLeaderParagraph] = useState(config.homepage?.leaderParagraph || '');

  const moveLeader = (index: number, direction: 'up' | 'down') => {
    const list = [...data];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;
    [list[index], list[newIndex]] = [list[newIndex], list[index]];
    setData(list);
  };

  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(config.tripLeaders || [])) {
      setData(JSON.parse(JSON.stringify(config.tripLeaders || [])));
    }
  }, [config.tripLeaders]);

  const handleSave = () => {
    updateConfig({ tripLeaders: data, homepage: { ...config.homepage, leaderTitle, leaderSub, leaderParagraph } });
    showToast('Leaders & Teks Homepage Tersimpan!');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border-2 border-art-text space-y-4">
        <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
           <Edit2 size={16} className="text-art-orange" /> Edit Teks Trip Leader (Homepage)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <input className="w-full border p-2 rounded text-xs" value={leaderTitle} onChange={e => setLeaderTitle(e.target.value)} placeholder="Judul Bagian Leader (Kenalan dengan)" />
           <input className="w-full border p-2 rounded text-xs" value={leaderSub} onChange={e => setLeaderSub(e.target.value)} placeholder="Sub-judul Bagian Leader (Trip Leader Kami)" />
        </div>
        <textarea className="w-full border p-2 rounded text-xs h-16" value={leaderParagraph} onChange={e => setLeaderParagraph(e.target.value)} placeholder="Paragraf Trip Leader"></textarea>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-art-text/20">
        <p className="text-xs font-bold text-art-text/60 uppercase">Daftar Trip Leader</p>
        <div className="flex gap-2">
          <button onClick={() => {
            customConfirm("Beneran mau reset leaders ke default?", () => {
              const defaultData = JSON.parse(JSON.stringify(defaultList));
              setData(defaultData);
              updateConfig({ tripLeaders: defaultData });
              showToast('Direset ke Default!');
            });
          }} className="bg-red-100 text-red-600 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">Reset Default</button>
          <button onClick={() => {
             setData(JSON.parse(JSON.stringify(config.tripLeaders || [])));
             showToast('Di-reset ke data tersimpan terakhir!');
          }} className="bg-gray-100 text-gray-600 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hidden sm:block">Batal</button>
          <button onClick={() => {
            setData([...data, { name: "Nama Baru", age: "20 th", description: "Deskripsi", avatar: "https://via.placeholder.com/150", voiceLine: "" }]);
          }} className="bg-art-text text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">+ Leader</button>
          <button onClick={handleSave} className="bg-art-orange text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">Simpan</button>
        </div>
      </div>
      <div className="space-y-4">
        {data.map((leader, i) => (
          <div key={i} className="bg-white rounded-2xl border-2 border-art-text relative hover:border-art-orange transition-all group shadow-sm overflow-hidden">
            {/* Header Bar for Controls - Prevents image obstruction */}
            <div className="bg-gray-50 border-b-2 border-art-text px-6 py-3 flex justify-between items-center">
               <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-art-text text-white rounded-lg flex items-center justify-center text-[10px] font-black">#{i + 1}</span>
                  <span className="text-[10px] font-black uppercase text-art-text/60 tracking-wider font-mono truncate max-w-[150px]">{leader.name || 'BARU'}</span>
               </div>
               <div className="flex bg-white rounded-lg border-2 border-art-text overflow-hidden shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                   <button type="button" onClick={(e) => { e.stopPropagation(); moveLeader(i, 'up'); }} className="p-2 hover:bg-art-bg border-r-2 border-art-text disabled:opacity-30" disabled={i === 0} title="Pindah Atas"><ChevronDown size={18} className="rotate-180"/></button>
                   <button type="button" onClick={(e) => { e.stopPropagation(); moveLeader(i, 'down'); }} className="p-2 hover:bg-art-bg border-r-2 border-art-text disabled:opacity-30" disabled={i === data.length - 1} title="Pindah Bawah"><ChevronDown size={18}/></button>
                   <button onClick={(e) => {
                     e.stopPropagation();
                     customConfirm("Hapus leader ini?", () => {
                       const nd = [...data]; nd.splice(i, 1); setData(nd);
                     });
                   }} className="p-2 text-red-500 hover:bg-red-50 transition-all font-black" title="Hapus"><Trash2 size={18}/></button>
               </div>
            </div>
            
            <div className="p-6 flex flex-col gap-6">
              {/* Leader Image Preview */}
              <div className="w-full h-48 sm:h-64 rounded-xl border-2 border-dashed border-art-text/10 overflow-hidden bg-art-bg flex items-center justify-center p-2 relative">
                {leader.avatar ? (
                  <img src={leader.avatar} className="w-full h-full object-cover rounded-lg" alt="Preview" onError={(e) => (e.currentTarget.style.display = 'none')} />
                ) : (
                  <div className="text-art-text/30 flex flex-col items-center">
                    <User size={32} />
                    <span className="text-[10px] font-bold uppercase mt-2">Belum Ada Foto</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-art-text/40">Status Leader</label>
                  <button 
                    onClick={() => setData(prev => prev.map((item, idx) => idx === i ? { ...item, isPrimary: !item.isPrimary } : item))}
                    className={`w-full p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${leader.isPrimary ? 'bg-art-green text-white border-art-green' : 'bg-white text-art-text border-art-text/10'}`}
                  >
                    {leader.isPrimary ? 'Leader Utama' : 'Set Sebagai Utama'}
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-art-text/40">Link Gambar (Eksplisit)</label>
                  <InputWithPaste 
                    className="w-full border-2 border-art-text/10 p-3 rounded-xl text-xs font-mono bg-gray-50 text-art-text/60" 
                    value={leader.avatar} 
                    onChange={(e: any) => setData(prev => prev.map((item, idx) => idx === i ? { ...item, avatar: e.target.value } : item))} 
                    placeholder="URL Image (Auto-update if uploaded above)" 
                  />
                </div>
              </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-art-text/40">Nama Lengkap</label>
                    <input 
                      className="w-full border-2 border-art-text/10 p-3 rounded-xl text-sm font-black outline-none focus:border-art-orange" 
                      value={leader.name} 
                      onChange={e => setData(prev => prev.map((item, idx) => idx === i ? { ...item, name: e.target.value } : item))} 
                      placeholder="Contoh: Alex Honnold" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-art-text/40">Pengalaman / Usia</label>
                    <input 
                      className="w-full border-2 border-art-text/10 p-3 rounded-xl text-sm font-bold outline-none focus:border-art-orange" 
                      value={leader.age || ''} 
                      onChange={e => setData(prev => prev.map((item, idx) => idx === i ? { ...item, age: e.target.value } : item))} 
                      placeholder="Contoh: 10 Tahun / 28 Th" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-art-text/40">Deskripsi / Bio</label>
                  <textarea 
                    rows={4}
                    className="w-full border-2 border-art-text/10 p-3 rounded-xl text-xs font-medium outline-none focus:border-art-orange resize-none" 
                    value={leader.description} 
                    onChange={e => setData(prev => prev.map((item, idx) => idx === i ? { ...item, description: e.target.value } : item))} 
                    placeholder="Tuliskan pengalaman atau moto hidup..." 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-art-text/60">Voice Audio URL</label>
                  <InputWithPaste 
                    className="w-full border-2 border-blue-100 p-3 rounded-xl text-[11px] font-medium outline-none focus:border-blue-400 bg-blue-50/20" 
                    value={leader.voiceLine || ''} 
                    onChange={(e: any) => setData(prev => prev.map((item, idx) => idx === i ? { ...item, voiceLine: e.target.value } : item))} 
                    placeholder="https://firebasestorage... (URL Audio)" 
                  />
                </div>
              </div>
            </div>
          ))}
        <p className="text-[10px] text-art-text/50">Kosongkan URL Voice Line agar admin bisa mengisi audionya secara manual dari luar jika dibutuhkan, atau isikan URL Firebase/Public HTTPS yang sudah dihosting. Karena Firestore hanya menampung teks url.</p>
      </div>

      <div className="mt-8 border-t-2 border-dashed border-art-text/20 pt-8">
        <TeamPhotosAdmin config={config} updateConfig={updateConfig} showToast={showToast} />
      </div>
    </div>
  );
};


