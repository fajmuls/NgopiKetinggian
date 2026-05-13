import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadFile } from '../lib/storage-utils';
import { X, Trash2, Plus, GripVertical, Users, Calendar, MapPin, Coffee, Mountain, Info, AlertCircle, FileText, Download, CheckCircle, Send, Globe, Map, Edit2, ChevronDown, Clock, TrendingUp, CreditCard, User, Clipboard, ChevronRight, ShoppingBag, MessageCircle, Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { generateRundownPdf } from '../lib/pdf-utils';
import { customConfirm, customAlert } from '../GlobalDialog';
import { InputWithPaste, ImageUploader } from '../components/admin/SharedAdmin';
import { RundownEditor } from '../components/admin/RundownEditor';
import { AppConfig, FacilityOption, DIFFICULTY_LEVELS as difficultyLevels, DURATION_LEVELS as durationLevels, OpenTrip, WEBSITE_VERSION } from '../useAppConfig';

export const DestinationsAdmin = ({ config, updateConfig, showToast, defaultList }: any) => {
  const [data, setData] = useState(JSON.parse(JSON.stringify(config.destinationsData || [])));
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("Semua");
  const [expandedIndexes, setExpandedIndexes] = useState<number[]>([]);

  const [visibilities, setVisibilities] = useState(config.visibilities || { map: true, quota: true, beans: true, routes: true });

  const moveDestination = (index: number, direction: 'up' | 'down') => {
    const list = [...data];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;
    [list[index], list[newIndex]] = [list[newIndex], list[index]];
    setData(list);
  };

  const movePath = (destIdx: number, pathIdx: number, direction: 'up' | 'down') => {
    const nd = [...data];
    const paths = [...nd[destIdx].paths];
    const newIndex = direction === 'up' ? pathIdx - 1 : pathIdx + 1;
    if (newIndex < 0 || newIndex >= paths.length) return;
    [paths[pathIdx], paths[newIndex]] = [paths[newIndex], paths[pathIdx]];
    nd[destIdx].paths = paths;
    setData(nd);
  };

  const moveDuration = (destIdx: number, pathIdx: number, durIdx: number, direction: 'up' | 'down') => {
    const nd = [...data];
    const durations = [...nd[destIdx].paths[pathIdx].durations];
    const newIndex = direction === 'up' ? durIdx - 1 : durIdx + 1;
    if (newIndex < 0 || newIndex >= durations.length) return;
    [durations[durIdx], durations[newIndex]] = [durations[newIndex], durations[durIdx]];
    nd[destIdx].paths[pathIdx].durations = durations;
    setData(nd);
  };

  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(config.destinationsData || [])) {
      setData(JSON.parse(JSON.stringify(config.destinationsData || [])));
    }
  }, [config.destinationsData]);
  
  useEffect(() => {
    if (config.visibilities) setVisibilities(config.visibilities);
  }, [config.visibilities]);

  const handleSave = () => {
    updateConfig({ destinationsData: data, visibilities });
    showToast('Tersimpan!');
  };


  const regions = ["Semua", ...Array.from(new Set(data.map((d: any) => d.region || "Jawa")))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-lg border border-art-text/20 gap-3">
        <p className="text-xs font-bold text-art-text/60 uppercase">Mengedit Destinasi & Jalur</p>
        <div className="flex gap-2">
          <button onClick={() => {
            customConfirm("Beneran mau reset destinasi ke default?", () => {
              const defaultData = JSON.parse(JSON.stringify(defaultList));
              setData(defaultData);
              updateConfig({ destinationsData: defaultData });
              showToast('Direset ke Default!');
            });
          }} className="bg-red-100 text-red-600 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hidden sm:block">Reset Default</button>
          <button onClick={() => {
             setData(JSON.parse(JSON.stringify(config.destinationsData || [])));
             if (config.visibilities) setVisibilities(config.visibilities);
             setExpandedIndexes([]);
             showToast('Di-reset ke data tersimpan terakhir!');
          }} className="bg-gray-100 text-gray-600 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hidden sm:block">Batal</button>
          
          <button 
            type="button"
            onClick={() => {
              const nd = data.map((d: any) => {
                const newD = { ...d, isActive: true };
                if (newD.paths) {
                  newD.paths = newD.paths.map((p: any) => ({ ...p, isActive: true }));
                }
                return newD;
              });
              setData(nd);
              showToast('Semua Destinasi Diaktifkan!');
            }} 
            className="bg-art-green/10 text-art-green border border-art-green/30 px-2 py-2 rounded text-[9px] font-black uppercase tracking-tight flex items-center gap-1 active:bg-art-green/20"
          >
            <Eye size={14} /> <span className="hidden sm:inline">Aktif Semua</span>
          </button>
          
          <button 
            type="button"
            onClick={() => {
              const nd = data.map((d: any) => ({ ...d, enablePrivateTrip: true }));
              setData(nd);
              showToast('Semua Private Trip Diaktifkan!');
            }} 
            className="bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-2 rounded text-[9px] font-black uppercase tracking-tight flex items-center gap-1 active:bg-indigo-100"
          >
            <Lock size={14} /> <span className="hidden sm:inline">Privat Semua</span>
          </button>

          <button type="button" onClick={(e) => {
             e.preventDefault();
             const nd = [...data];
             nd.unshift({ 
               id: Date.now().toString(), 
               name: "Gunung Baru", 
               desc: "Deskripsi", 
               region: "Jawa", 
               difficulty: "Pemula", 
               image: "https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?w=500", 
               paths: [],
               enablePrivateTrip: true,
               privateTripContent: ""
             });
             setData(nd);
             setExpandedIndexes([0]);
          }} className="bg-art-text text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">+ Destinasi</button>
          <button onClick={handleSave} className="bg-art-orange text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">Simpan Perubahan</button>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg border border-art-text/20 grid grid-cols-2 md:grid-cols-4 gap-4">
        {['map', 'quota', 'beans', 'routes'].map(key => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-art-orange w-4 h-4" checked={(visibilities as any)[key]} onChange={e => setVisibilities({...visibilities, [key]: e.target.checked})} />
            <span className="text-xs font-bold uppercase tracking-tight text-art-text">Tampilkan {key}</span>
          </label>
        ))}
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
         <div key={i} className={`bg-white p-4 rounded-xl border-2 transition-all ${dest.isActive !== false ? 'border-art-text shadow-[4px_4px_0px_0px_#1a1a1a]' : 'border-gray-200 opacity-70'} relative w-full overflow-hidden`}>
          {/* Action Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 bg-gray-50/50 p-2 rounded-lg border border-dashed border-art-text/10">
            <div className="flex items-center gap-2">
               <div className="flex bg-white rounded-lg border border-art-text/20 overflow-hidden shadow-sm">
                   <button type="button" onClick={() => moveDestination(i, 'up')} className="p-2 hover:bg-gray-100 border-r border-art-text/10 disabled:opacity-30" disabled={i === 0} title="Pindah Atas"><ChevronDown size={14} className="rotate-180"/></button>
                   <button type="button" onClick={() => moveDestination(i, 'down')} className="p-2 hover:bg-gray-100 border-r border-art-text/10 disabled:opacity-30" disabled={i === data.length - 1} title="Pindah Bawah"><ChevronDown size={14}/></button>
                   <button onClick={() => {
                      customConfirm(`Hapus ${dest.name}?`, () => {
                        const nd = [...data]; nd.splice(i, 1); setData(nd);
                      });
                   }} className="p-2 text-red-500 hover:bg-red-50" title="Hapus"><Trash2 size={16}/></button>
               </div>
            </div>
            
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button 
                type="button"
                onClick={() => {
                  const nd = [...data];
                  nd[i].enablePrivateTrip = !(dest.enablePrivateTrip !== false);
                  setData(nd);
                }}
                className={`p-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all border-2 ${dest.enablePrivateTrip !== false ? 'bg-indigo-600 border-indigo-700 text-white shadow-[2px_2px_0px_0px_#1a1a1a]' : 'bg-gray-100 border-gray-200 text-gray-400'}`}
              >
                {dest.enablePrivateTrip !== false ? <Lock size={12} fill="white" /> : <Unlock size={12} />}
                <span className="text-[8px] font-black uppercase">Privat</span>
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  const nd = [...data];
                  nd[i].isActive = !(dest.isActive !== false);
                  setData(nd);
                }}
                className={`p-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all border-2 ${dest.isActive !== false ? 'bg-art-green border-art-green text-white shadow-[2px_2px_0px_0px_#1a1a1a]' : 'bg-gray-100 border-gray-200 text-gray-400'}`}
              >
                {dest.isActive !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                <span className="text-[8px] font-black uppercase">Status</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
               onClick={() => {
                 setExpandedIndexes(prev => prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i])
               }}
               className="w-10 h-10 flex items-center justify-center shrink-0 bg-art-bg rounded-xl border-2 border-art-text shadow-[2px_2px_0px_0px_#1a1a1a] active:shadow-none"
            >
               <span className="font-black text-xl">{expandedIndexes.includes(i) ? '-' : '+'}</span>
            </button>
            <div className="flex-1">
              <input 
                className="font-black text-lg md:text-xl border-b-2 border-dashed border-art-text/20 outline-none focus:border-art-orange w-full bg-transparent pr-4" 
                value={dest.name}
                onChange={e => {
                  const nd = [...data];
                  nd[i].name = e.target.value;
                  setData(nd);
                }}
                placeholder="Nama Gunung"
              />
              <p className="text-[10px] font-bold text-art-text/40 uppercase mt-1 italic">{dest.region || 'Region Belum Set'} • {dest.difficulty || 'Level Belum Set'}</p>
            </div>
          <button type="button" onClick={(e) => {
             e.preventDefault();
             const nd = [...data];
             if (!nd[i].paths) nd[i].paths = [];
             nd[i].paths.push({ name: "Jalur Baru", durations: [{ label: "1H (Tektok)", price: 0, originalPrice: 0 }] });
             setData(nd);
             if (!expandedIndexes.includes(i)) setExpandedIndexes([...expandedIndexes, i]);
          }} className="text-[9px] font-black uppercase bg-art-text text-white px-3 py-2 rounded-xl border-2 border-art-text shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none transition-all hidden sm:block">+ Jalur</button>
          </div>

          {expandedIndexes.includes(i) && (
          <div className="grid gap-4 mt-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center mb-2">
              <span className="text-xs font-bold w-16">Foto:</span>
              <div className="w-full sm:flex-1">
                <ImageUploader value={dest.image} onChange={url => {
                  const nd = [...data];
                  nd[i].image = url;
                  setData(nd);
                }} placeholder="URL Gambar / Unggah File" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center mb-2">
              <span className="text-xs font-bold w-16">Logo:</span>
              <div className="w-full sm:flex-1">
                <ImageUploader value={dest.logo || ''} onChange={url => {
                  const nd = [...data];
                  nd[i].logo = url;
                  setData(nd);
                }} placeholder="URL Logo (Transparan disarankan)" />
              </div>
            </div>

            <div className="flex flex-col mb-2">
              <span className="text-xs font-bold mb-1">Deskripsi & Info:</span>
              <textarea 
                className="w-full border-2 border-art-text/10 p-3 rounded-xl text-xs font-medium focus:border-art-orange outline-none transition-all resize-none"
                rows={3}
                value={dest.desc || ''}
                onChange={e => {
                  const nd = [...data];
                  nd[i].desc = e.target.value;
                  setData(nd);
                }}
                placeholder="Tuliskan deskripsi singkat gunung ini..."
              />
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-2">
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-bold uppercase mb-1">Region:</span>
                <input className="border p-2 rounded text-xs w-full" value={dest.region || 'Jawa'} onChange={e => {
                  const nd = [...data];
                  nd[i].region = e.target.value;
                  setData(nd);
                }} placeholder="Cth: Jawa Tengah" />
              </div>
              
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-bold uppercase mb-1">Kuota:</span>
                <input className="border p-2 rounded text-xs w-full" value={dest.kuota} onChange={e => {
                  const nd = [...data];
                  nd[i].kuota = e.target.value;
                  setData(nd);
                }} placeholder="Cth: 2-12 Pax" />
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-bold uppercase mb-1">Mepo:</span>
                <input className="border p-2 rounded text-xs w-full" value={dest.mepo || ''} onChange={e => {
                  const nd = [...data];
                  nd[i].mepo = e.target.value;
                  setData(nd);
                }} placeholder="Basecamp" />
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-bold uppercase">G-Maps:</span>
                  <button 
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        const nd = [...data];
                        nd[i].mepoLink = text;
                        setData(nd);
                        showToast("Link ditempel!");
                      } catch (err) {
                        showToast("Gagal menempel link", "error");
                      }
                    }}
                    className="p-1 rounded text-art-text/60 hover:bg-art-text/5 hover:text-art-text active:scale-95 transition-all outline-none"
                    title="Paste Link"
                  >
                    <Clipboard size={14} />
                  </button>
                </div>
                <div className="flex gap-1 overflow-hidden">
                  <input className="border p-2 rounded text-[10px] w-full min-w-0" value={dest.mepoLink || ''} onChange={e => {
                    const nd = [...data];
                    nd[i].mepoLink = (e.target as HTMLInputElement).value;
                    setData(nd);
                  }} placeholder="Maps Link" />
                  <button 
                    onClick={() => {
                      const query = `Basecamp ${dest.name} ${dest.region || ''} ${dest.mepo || ''}`;
                      window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, '_blank');
                    }}
                    className="p-2 bg-art-orange text-white rounded hover:bg-orange-600 transition-colors shrink-0"
                    title="Cari di Google Maps"
                  >
                    <Map size={14} />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-bold uppercase mb-1">Level:</span>
                <select className="border p-2 rounded text-[11px] w-full" value={dest.difficulty || ''} onChange={e => {
                  const nd = [...data];
                  nd[i].difficulty = e.target.value;
                  setData(nd);
                }}>
                  <option value="">Status</option>
                  {difficultyLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                </select>
              </div>
            </div>
            
            <button type="button" 
              onClick={(e) => {
                e.preventDefault();
                const nd = [...data];
                if (!nd[i].paths) nd[i].paths = [];
                nd[i].paths.push({ name: "Jalur Baru", durations: [{ label: "1H (Tektok)", price: 0, originalPrice: 0 }] });
                setData(nd);
              }}
              className="text-[10px] bg-art-text text-white px-3 py-1.5 rounded w-full sm:hidden"
            >+ Jalur</button>

            {dest.paths?.map((path: any, pIdx: number) => (
              <div key={pIdx} className="border border-art-text/20 p-3 rounded-lg bg-gray-50 space-y-3 relative">
                <div className="absolute top-2 right-2 flex gap-1 z-10">
                   <div className="flex bg-white rounded border border-art-text/10 overflow-hidden shadow-sm">
                        <button type="button" onClick={() => movePath(i, pIdx, 'up')} className="p-1 hover:bg-gray-100 border-r border-art-text/10" disabled={pIdx === 0}><ChevronDown size={14} className="rotate-180"/></button>
                        <button type="button" onClick={() => movePath(i, pIdx, 'down')} className="p-1 hover:bg-gray-100" disabled={pIdx === dest.paths.length - 1}><ChevronDown size={14}/></button>
                    </div>
                    <button onClick={() => {
                       const nd = [...data];
                       nd[i].paths.splice(pIdx, 1);
                       setData(nd);
                    }} className="bg-white border border-art-text/10 text-red-500 rounded p-1 hover:bg-red-50 shadow-sm"><Trash2 size={14}/></button>
                </div>
                <div className="flex items-center gap-2 pr-20">
                  <span className="text-[10px] font-bold uppercase w-12">Jalur:</span>
                  <input className="border p-1.5 rounded text-xs flex-1" value={path.name} onChange={e => {
                    const nd = [...data];
                    nd[i].paths[pIdx].name = e.target.value;
                    setData(nd);
                  }} placeholder="Nama Jalur" />
                  <button type="button" onClick={(e) => {
                    e.preventDefault();
                    const nd = [...data];
                    nd[i].paths[pIdx].durations.push({ label: "1H (Tektok)", price: 0, originalPrice: 0 });
                    setData(nd);
                  }} className="text-[10px] bg-blue-500 text-white px-2 py-1.5 rounded whitespace-nowrap">+ Durasi</button>
                </div>
                
                <div className="pl-0 sm:pl-14 space-y-2">
                  {path.durations.map((dur: any, j: number) => (
                    <React.Fragment key={j}>
                    <div className="flex gap-2 items-center min-w-full flex-wrap xl:flex-nowrap bg-white/50 p-2 rounded-lg border border-art-text/5">
                      <select className="border-2 border-art-text/10 p-2 rounded-lg text-[10px] font-black uppercase tracking-tight flex-1 outline-none focus:border-art-orange bg-white" value={dur.label} onChange={e => {
                        const nd = [...data];
                        nd[i].paths[pIdx].durations[j].label = e.target.value;
                        setData(nd);
                      }}>
                        {durationLevels.map((lvl: string) => <option key={lvl} value={lvl}>{lvl}</option>)}
                      </select>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-bold text-art-text/30">Coret:</span>
                        <input 
                          type="text"
                          inputMode="numeric"
                          className="border-2 border-art-text/10 p-2 rounded-lg text-xs w-20 font-mono focus:border-art-orange outline-none bg-white" 
                          value={dur.originalPrice ?? 0} 
                          onChange={e => {
                            let valStr = e.target.value.replace(/^0+/, '');
                            if (valStr === '') valStr = '0';
                            const val = parseInt(valStr) || 0;
                            const nd = [...data];
                            nd[i].paths[pIdx].durations[j].originalPrice = val;
                            setData(nd);
                          }} 
                          placeholder="Coret" 
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-bold text-art-orange">Final:</span>
                        <input 
                          type="text"
                          inputMode="numeric"
                          className="border-2 border-art-orange/30 p-2 rounded-lg text-xs w-20 font-mono focus:border-art-orange outline-none bg-white" 
                          value={dur.price ?? 0} 
                          onChange={e => {
                            let valStr = e.target.value.replace(/^0+/, '');
                            if (valStr === '') valStr = '0';
                            const val = parseInt(valStr) || 0;
                            const nd = [...data];
                            nd[i].paths[pIdx].durations[j].price = val;
                            setData(nd);
                          }} 
                          placeholder="Final" 
                        />
                      </div>

                      <div className="flex items-center gap-1 h-full pl-2 border-l border-art-text/10 ml-auto">
                        <button type="button" onClick={(e) => {
                          e.preventDefault();
                          const nd = [...data];
                          nd[i].paths[pIdx].durations[j].showTripContent = !nd[i].paths[pIdx].durations[j].showTripContent;
                          setData(nd);
                        }} className={`p-2 rounded-lg flex items-center justify-center transition-all ${dur.showTripContent ? 'bg-art-text text-white' : 'bg-gray-100 text-art-text hover:bg-gray-200'}`} title="Konten Tambahan">
                          <Plus size={14} />
                        </button>

                        <button onClick={(e) => {
                          e.preventDefault();
                          const nd = [...data];
                          nd[i].paths[pIdx].durations[j].showRundown = !nd[i].paths[pIdx].durations[j].showRundown;
                          setData(nd);
                        }} className={`p-2 rounded-lg flex items-center justify-center transition-all ${dur.showRundown ? 'bg-art-orange text-white text-white' : 'bg-gray-100 text-art-text hover:bg-gray-200'}`} title="Edit Rundown">
                          <FileText size={14} />
                        </button>

                        <div className="flex bg-white rounded-lg border border-art-text/10 overflow-hidden shrink-0 mx-1">
                            <button type="button" onClick={() => moveDuration(i, pIdx, j, 'up')} className="p-2 hover:bg-gray-100 border-r border-art-text/10 disabled:opacity-30" disabled={j === 0}><ChevronDown size={12} className="rotate-180"/></button>
                            <button type="button" onClick={() => moveDuration(i, pIdx, j, 'down')} className="p-2 hover:bg-gray-100 disabled:opacity-30" disabled={j === path.durations.length - 1}><ChevronDown size={12}/></button>
                        </div>

                        <button 
                          onClick={() => {
                            customConfirm(`Hapus durasi ${dur.label}?`, () => {
                              const nd = [...data];
                              nd[i].paths[pIdx].durations.splice(j, 1);
                              setData(nd);
                            });
                          }} 
                          className="text-red-500 p-2 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {dur.showTripContent && (
                      <div className="bg-white border-2 border-art-text p-3 rounded-lg mt-2 mb-4 space-y-3">
                         <div className="flex justify-between items-center bg-art-bg p-2 rounded-t-lg -mx-3 -mt-3 mb-3 border-b-2 border-art-text">
                            <span className="text-[10px] font-black uppercase tracking-widest text-art-text/60">Konten Tambahan Trip (Khusus Private)</span>
                         </div>
                         <textarea 
                            className="w-full border-2 border-art-text/10 p-3 rounded-xl text-xs font-medium focus:border-art-orange outline-none transition-all resize-none"
                            rows={4}
                            value={dur.tripContent || ''}
                            onChange={e => {
                              const nd = [...data];
                              nd[i].paths[pIdx].durations[j].tripContent = e.target.value;
                              setData(nd);
                            }}
                            placeholder="Tuliskan info tambahan khusus untuk durasi ini (misal: Minimal order, upgrade layanan, dll)..."
                          />
                      </div>
                    )}
                    {dur.showRundown && (
                      <div className="bg-white border-2 border-art-text p-3 rounded-lg mt-2 mb-4 space-y-3 relative before:content-[''] before:absolute before:-top-2 before:left-6 before:w-3 before:h-3 before:bg-white before:border-l-2 before:border-t-2 before:border-art-text before:rotate-45">
                         <div className="flex justify-between items-center bg-art-bg p-2 rounded-t-lg -mx-3 -mt-3 mb-3 border-b-2 border-art-text">
                            <span className="text-[10px] font-black uppercase tracking-widest text-art-text/60">Pengaturan Rundown / Itinerary</span>
                            <button 
                              type="button" 
                              onClick={() => generateRundownPdf(dur, dest.name, path.name, dur.label)}
                              className="bg-art-text text-white px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest hover:bg-art-orange transition-colors flex items-center gap-1"
                            >
                              <FileText size={10} /> Preview PDF
                            </button>
                         </div>
                         <div className="space-y-1">
                            <label className="text-[9px] font-bold text-art-text/40 uppercase">Rundown PDF (URL Link)</label>
                            <ImageUploader 
                               value={dur.rundownPdf || ''} 
                               onChange={(url) => { const nd = [...data]; nd[i].paths[pIdx].durations[j].rundownPdf = url; setData(nd); }}
                               placeholder="URL PDF / File PDF"
                            />
                            <p className="text-[8px] text-art-text/30 italic">Pioritas Utama: Jika ini diisi, user akan mengunduh PDF.</p>
                         </div>
                         <div className="space-y-1">
                            <label className="text-[9px] font-bold text-art-text/40 uppercase">Atau, Ketik Manual (Rundown Detail)</label>
                            <RundownEditor 
                               value={dur.rundownHtml || ''}
                               onChange={(val) => { const nd = [...data]; nd[i].paths[pIdx].durations[j].rundownHtml = val; setData(nd); }}
                               title={`Rundown ${dest.name} - ${path.name}`}
                            />
                         </div>
                      </div>
                    )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  })}
</div>
    );
  };

// Sub-components for Admin

