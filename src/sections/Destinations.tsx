import React from 'react';
import { DestinationCard } from '../components/DestinationCard';
import { Mountain, Search, ChevronDown } from 'lucide-react';

export const DestinationSection = ({ 
  destinations, 
  onBook, 
  visibilities, 
  filterDifficulty, 
  setFilterDifficulty,
  difficultyOptions 
}: any) => {
  return (
    <section id="destinasi" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-art-text text-white flex items-center justify-center">
                  <Mountain size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-art-text/40">Our Destinations</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-art-text uppercase leading-none tracking-tighter">
                Gunung & <span className="text-art-orange">Jalur Pilihan.</span>
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
               <div className="relative group">
                  <p className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-black text-art-text uppercase z-10 transition-colors group-focus-within:text-art-orange">Filter Level</p>
                  <div className="relative">
                    <select 
                      className="appearance-none bg-white border-2 border-art-text/10 px-4 py-3 pr-10 rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:border-art-orange transition-all cursor-pointer min-w-[180px]"
                      value={filterDifficulty}
                      onChange={(e) => setFilterDifficulty(e.target.value)}
                    >
                      {difficultyOptions.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-art-text/40" />
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
