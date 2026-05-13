import React from 'react';
import { DestinationCard } from '../components/DestinationCard';
import { Mountain, Search, ChevronDown } from 'lucide-react';

import { DIFFICULTY_LEVELS } from '../useAppConfig';
import { useLanguage } from '../hooks/useLanguage';

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
  const { t } = useLanguage();
  const [isRegionOpen, setIsRegionOpen] = React.useState(false);
  const [isDiffOpen, setIsDiffOpen] = React.useState(false);

  const regions = React.useMemo(() => {
    const list = destinations.map((d: any) => d.region).filter(Boolean);
    return ["Semua", ...Array.from(new Set(list))];
  }, [destinations]);

  const difficulties = React.useMemo(() => {
    const list = destinations.map((d: any) => d.difficulty).filter(Boolean);
    const uniqueList = Array.from(new Set(list));
    return ["Semua", ...uniqueList].sort((a: any, b: any) => {
       if (a === "Semua") return -1;
       if (b === "Semua") return 1;
       const idxA = DIFFICULTY_LEVELS.indexOf(a);
       const idxB = DIFFICULTY_LEVELS.indexOf(b);
       if (idxA !== -1 && idxB !== -1) return idxA - idxB;
       if (idxA !== -1) return -1;
       if (idxB !== -1) return 1;
       return a.localeCompare(b);
    });
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
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-art-text/40">{t('nav.destinations') || 'Private Trip'}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-art-text uppercase leading-none tracking-tighter">
                 {t('dest.privateTitle')}
              </h2>
              <p className="mt-4 text-[10px] sm:text-xs font-bold text-art-text/60 uppercase tracking-widest max-w-sm">
                {t('dest.privateDesc')}
              </p>
            </div>

            <div className="flex flex-col gap-6 w-full lg:w-auto">
               <div className="flex flex-col gap-3">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-art-text/40">Filter by Difficulty</p>
                 <select 
                   value={filterDifficulty}
                   onChange={(e) => setFilterDifficulty(e.target.value)}
                   className="w-full sm:w-48 bg-white border-2 border-art-text p-2 rounded-xl text-[10px] font-black uppercase outline-none focus:border-art-orange transition-colors cursor-pointer"
                 >
                    {difficulties.map((opt: any) => (
                      <option key={opt as string} value={opt as string}>{opt as string}</option>
                    ))}
                 </select>
               </div>

               <div className="flex flex-col gap-3">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-art-text/40">Filter by Region</p>
                 <select 
                   value={filterRegion}
                   onChange={(e) => typeof setFilterRegion === 'function' && setFilterRegion(e.target.value)}
                   className="w-full sm:w-48 bg-white border-2 border-art-text p-2 rounded-xl text-[10px] font-black uppercase outline-none focus:border-art-orange transition-colors cursor-pointer"
                 >
                    {regions.map((opt: any) => (
                      <option key={opt as string} value={opt as string}>{opt as string}</option>
                    ))}
                 </select>
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
