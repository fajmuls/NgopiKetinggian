import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee, Map, Search, Mic, MapPin, X, Menu, LogIn, LogOut, History, User, ChevronRight, ShoppingBag, Mountain } from 'lucide-react';

export const Header = ({ 
  config,
  user, 
  onLogin, 
  onLogout, 
  onOpenSettings, 
  onOpenHistory,
  onOpenBooking,
  searchQuery,
  onSearchChange,
  searchResults,
  onExecuteSearch,
  showSearchDropdown,
  setShowSearchDropdown
}: any) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-md border-b-2 border-art-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center -rotate-6 shadow-[4px_4px_0px_0px_#ff6b00] border-2 border-art-text overflow-hidden">
              <img src={config?.homepage?.logo || "https://files.catbox.moe/lubzno.png"} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm sm:text-lg font-black leading-none tracking-tighter uppercase text-art-text">Ngopi Di<br/><span className="text-art-orange">Ketinggian</span></h1>
            </div>
          </div>

          <div className="hidden md:flex items-center flex-1 max-w-lg mx-8 relative">
            <div className="w-full relative group">
              <input 
                type="text" 
                placeholder="Cari gunung impianmu..."
                className="w-full bg-art-bg/30 border border-art-text/10 py-2.5 pl-4 pr-10 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest outline-none focus:border-art-orange focus:bg-white transition-all shadow-inner"
                value={searchQuery}
                onChange={onSearchChange}
                onFocus={() => searchQuery && setShowSearchDropdown(true)}
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-art-text/20 group-focus-within:text-art-orange transition-colors" size={14} />
            </div>
            
            <AnimatePresence>
              {showSearchDropdown && searchResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-art-text rounded-2xl shadow-[8px_8px_0px_0px_rgba(26,26,26,0.05)] overflow-hidden z-[110]"
                >
                  <div className="p-2 border-b border-art-text/5 bg-art-bg/30">
                    <p className="text-[8px] font-black uppercase text-art-text/40 tracking-[0.2em]">Hasil Pencarian Teratas</p>
                  </div>
                  {searchResults.map((item: any, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => onExecuteSearch(item)}
                      className="w-full p-3 px-4 flex items-center justify-between hover:bg-art-bg transition-colors group/item"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-art-text/10 overflow-hidden ${item.type === 'section' ? 'bg-art-orange/10 text-art-orange' : 'bg-art-text/10 text-art-text'}`}>
                          {item.image ? (
                            <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                          ) : (
                            item.type === 'section' ? <Search size={14} /> : <Mountain size={14} />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] font-black uppercase text-art-text tracking-widest group-hover/item:text-art-orange transition-colors">{item.name}</p>
                          <p className="text-[8px] font-bold text-art-text/40 uppercase tracking-tighter">{item.type === 'section' ? 'Navigasi Cepat' : 'Gunung'}</p>
                        </div>
                      </div>
                      <ChevronRight size={10} className="text-art-text/20 group-hover/item:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-3">
                <button onClick={onOpenHistory} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-art-text/60 hover:text-art-text transition-colors">
                  <History size={16} /> History
                </button>
                <div className="w-[1px] h-6 bg-art-text/10 mx-1"></div>
                <button onClick={onOpenSettings} className="flex items-center gap-2 px-4 py-2 bg-art-text text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(255,107,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                  <User size={16} /> Profile
                </button>
              </div>
            ) : (
              <button onClick={onLogin} className="flex items-center gap-2 px-6 py-2.5 bg-art-text text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(255,107,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                <LogIn size={16} /> Login Google
              </button>
            )}
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2">
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            className="md:hidden bg-white border-t-2 border-art-text overflow-visible shadow-2xl"
          >
             <div className="p-3 space-y-3 bg-art-bg/20 border-b border-art-text/10 overflow-visible">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Cari Gunung..."
                    className="w-full bg-white border-2 border-art-text py-3 pl-4 pr-10 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-art-orange transition-all shadow-sm"
                    value={searchQuery}
                    onChange={(e) => {
                      onSearchChange(e);
                      if (e.target.value.length > 0) setShowSearchDropdown(true);
                    }}
                    onFocus={() => searchQuery && setShowSearchDropdown(true)}
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-art-text/40" size={14} />
                  
                  <AnimatePresence>
                    {showSearchDropdown && searchResults.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute left-0 right-0 mt-3 bg-white border-2 border-art-text rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden z-[1001]"
                      >
                        {searchResults.slice(0, 6).map((item: any, idx: number) => (
                          <button 
                            key={idx}
                            onClick={() => { onExecuteSearch(item); setIsMenuOpen(false); }}
                            className="w-full p-4 px-5 flex items-center justify-between border-b border-art-text/5 last:border-0 hover:bg-art-bg active:bg-art-orange/10 transition-colors"
                          >
                             <div className="flex items-center gap-4">
                                {item.image ? (
                                  <img src={item.image} className="w-10 h-10 rounded-lg object-cover border border-art-text/10" alt={item.name} />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-art-bg flex items-center justify-center border border-art-text/10"><Mountain size={16} /></div>
                                )}
                                <div className="text-left">
                                   <p className="text-[10px] font-black uppercase text-art-text tracking-widest">{item.name}</p>
                                   <p className="text-[8px] font-bold text-art-text/40 uppercase tracking-tighter">{item.type === 'section' ? 'Menu' : 'Gunung'}</p>
                                </div>
                             </div>
                             <ChevronRight size={12} className="text-art-orange" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    {user ? (
                      <>
                        <button onClick={() => { onOpenHistory(); setIsMenuOpen(false); }} className="py-2.5 text-[9px] font-black uppercase tracking-widest text-art-text flex items-center justify-center gap-2 border-2 border-art-text rounded-xl bg-white hover:bg-art-bg transition-colors">
                          <History size={12} className="text-art-orange" /> History
                        </button>
                        <button onClick={() => { onOpenSettings(); setIsMenuOpen(false); }} className="py-2.5 text-[9px] font-black uppercase tracking-widest bg-art-text text-white rounded-xl flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(255,107,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
                          <User size={12} /> Profile
                        </button>
                      </>
                    ) : (
                      <button onClick={() => { onLogin(); setIsMenuOpen(false); }} className="col-span-2 py-3 text-[10px] font-black uppercase tracking-widest bg-art-text text-white rounded-xl flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(255,107,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
                        <LogIn size={14} /> Login
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-center gap-4 py-2 opacity-30">
                  <Coffee size={12} />
                  <Mountain size={12} />
                  <MapPin size={12} />
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
