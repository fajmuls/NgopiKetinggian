import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee, Map, Search, Mic, MapPin, X, Menu, LogIn, LogOut, History, User } from 'lucide-react';

export const Header = ({ 
  user, 
  onLogin, 
  onLogout, 
  onOpenSettings, 
  onOpenHistory,
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
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center -rotate-6 shadow-[4px_4px_0px_0px_#ff6b00] border-2 border-art-text overflow-hidden">
              <img src="https://files.catbox.moe/lubzno.png" alt="Logo" className="w-full h-full object-contain p-1" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm sm:text-lg font-black leading-none tracking-tighter uppercase text-art-text">Ngopi Di<br/><span className="text-art-orange">Ketinggian</span></h1>
            </div>
          </div>

          <div className="hidden md:flex items-center flex-1 max-w-md mx-8 relative">
            <div className="w-full relative">
              <input 
                type="text" 
                placeholder="Cari gunung atau paket trip..."
                className="w-full bg-art-bg/50 border-2 border-art-text/10 py-2 pl-4 pr-10 rounded-xl text-xs font-bold outline-none focus:border-art-orange transition-all"
                value={searchQuery}
                onChange={onSearchChange}
                onFocus={() => searchQuery && setShowSearchDropdown(true)}
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-art-text/40" size={16} />
            </div>
            
            <AnimatePresence>
              {showSearchDropdown && searchResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-art-text rounded-2xl shadow-2xl overflow-hidden"
                >
                  {searchResults.map((item: any, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => onExecuteSearch(item)}
                      className="w-full p-4 flex items-center gap-3 hover:bg-art-bg transition-colors border-b border-art-text/5 last:border-0"
                    >
                      <div className={`p-2 rounded-lg ${item.type === 'section' ? 'bg-art-orange text-white' : 'bg-art-text text-white'}`}>
                        {item.type === 'section' ? <Search size={14} /> : <MapPin size={14} />}
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black uppercase text-art-text tracking-widest">{item.name}</p>
                        <p className="text-[8px] font-bold text-art-text/40 uppercase">{item.type === 'section' ? 'Area Cepat' : 'Destinasi'}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden md:flex items-center gap-4">
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
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden bg-white border-t-2 border-art-text overflow-hidden">
             <div className="p-4 space-y-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Cari gunung..."
                    className="w-full bg-art-bg/50 border-2 border-art-text/10 py-3 pl-4 pr-10 rounded-xl text-xs font-bold outline-none focus:border-art-orange transition-all"
                    value={searchQuery}
                    onChange={onSearchChange}
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-art-text/40" size={18} />
                </div>

                <div className="flex flex-col gap-2">
                  {user ? (
                    <>
                      <button onClick={() => { onOpenHistory(); setIsMenuOpen(false); }} className="w-full py-4 text-xs font-black uppercase tracking-widest text-art-text flex items-center justify-center gap-2 border-2 border-art-text rounded-2xl">
                        <History size={16} /> History Booking
                      </button>
                      <button onClick={() => { onOpenSettings(); setIsMenuOpen(false); }} className="w-full py-4 text-xs font-black uppercase tracking-widest bg-art-text text-white rounded-2xl flex items-center justify-center gap-2">
                        <User size={16} /> Dashboard
                      </button>
                      <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="w-full py-4 text-xs font-black uppercase tracking-widest text-red-500 flex items-center justify-center gap-2">
                        <LogOut size={16} /> Logout
                      </button>
                    </>
                  ) : (
                    <button onClick={() => { onLogin(); setIsMenuOpen(false); }} className="w-full py-4 text-xs font-black uppercase tracking-widest bg-art-text text-white rounded-2xl flex items-center justify-center gap-2">
                      <LogIn size={16} /> Login with Google
                    </button>
                  )}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
