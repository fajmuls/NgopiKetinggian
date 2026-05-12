import React from 'react';
import { DestinationCard } from '../components/DestinationCard';
import { Mountain, Search, ChevronDown } from 'lucide-react';

export const DestinationSection = ({ 
  destinations, 
  onBook, 
  visibilities, 
  filterDifficulty, 
  setFilterDifficulty,
  difficultyOptions,
  filterRegion,
  setFilterRegion,
  regionOptions = ["Semua", "Jawa", "Sumatera", "Lombok", "Bali", "Papua"]
}: any) => {
  const [isRegionOpen, setIsRegionOpen] = React.useState(false);
  const [isDiffOpen, setIsDiffOpen] = React.useState(false);

  const regions = React.useMemo(() => {
    const list = destinations.map((d: any) => d.region).filter(Boolean);
    return ["Semua", ...Array.from(new Set(list))];
  }, [destinations]);

  const difficulties = React.useMemo(() => {
    const list = destinations.map((d: any) => d.difficulty).filter(Boolean);
    return ["Semua", ...Array.from(new Set(list))];
  }, [destinations]);

  return (
    <section id="destinasi-private" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-art-text text-white flex items-center justify-center">
                  <Mountain size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-art-text/40">Private Trip</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-art-text uppercase leading-none tracking-tighter">
                 <span className="text-art-orange">Private</span> Trip.
              </h2>
              <p className="mt-4 text-[10px] sm:text-xs font-bold text-art-text/60 uppercase tracking-widest max-w-sm">
                Book your trip and mountain and schedule as you wish.
              </p>
            </div>

            <div className="flex flex-col gap-6 w-full lg:w-auto">
               <div className="flex flex-col gap-3">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-art-text/40">Filter by Difficulty</p>
                 <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {difficulties.map((opt: any) => (
                      <button 
                        key={opt as string}
                        onClick={() => setFilterDifficulty(opt)}
                        className={`whitespace-nowrap px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border-2 transition-all ${filterDifficulty === opt ? 'bg-art-text text-white border-art-text' : 'bg-white text-art-text border-art-text/10'}`}
                      >
                        {opt as string}
                      </button>
                    ))}
                 </div>
               </div>

               <div className="flex flex-col gap-3">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-art-text/40">Filter by Region</p>
                 <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {regions.map((opt: any) => (
                      <button 
                        key={opt as string}
                        onClick={() => typeof setFilterRegion === 'function' && setFilterRegion(opt)}
                        className={`whitespace-nowrap px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border-2 transition-all ${filterRegion === opt ? 'bg-art-orange text-white border-art-orange font-black' : 'bg-white text-art-text border-art-text/10'}`}
                      >
                        {opt as string}
                      </button>
                    ))}
                 </div>
               </div>
            </div>
          </div>

          {destinations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {destinations.map((dest: any) => (
                <DestinationCard 
                  key={dest.id} 
                  dest={dest} 
                  onBook={onBook} 
                  visibilities={visibilities} 
                />
              ))}
            </div>
          ) : (
            <div className="bg-art-bg/30 border-2 border-dashed border-art-text/10 rounded-[2rem] py-20 text-center">
               <div className="w-16 h-16 bg-white border-2 border-art-text rounded-2xl flex items-center justify-center mx-auto mb-6 text-art-text/20">
                  <Search size={32} />
               </div>
               <h3 className="text-xl font-black uppercase text-art-text mb-2">Destinasi Belum Ditemukan</h3>
               <p className="text-xs font-bold text-art-text/40 uppercase tracking-widest">Coba ubah filter atau kata kunci pencarian Anda.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
