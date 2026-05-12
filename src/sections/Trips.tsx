import React from 'react';
import { OpenTripCard } from '../components/OpenTripCard';
import { Calendar, ChevronRight } from 'lucide-react';

export const TripSection = ({ openTrips, onJoin, getSisaKuota, visibilities, tripLeaders, config }: any) => {
  if (openTrips.length === 0) return null;

  return (
    <section id="trip" className="py-24 bg-art-bg/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-art-text text-white flex items-center justify-center">
                <Calendar size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-art-text/40">Open Trip</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-art-text uppercase leading-none tracking-tighter">
              <span className="text-art-orange">Trip</span> Terbuka.
            </h2>
            <p className="mt-4 text-[10px] sm:text-xs font-bold text-art-text/60 uppercase tracking-widest max-w-sm">
              Bergabung dengan trip terbuka bersama yang lain.
            </p>
          </div>
          <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-art-text hover:text-art-orange transition-colors">
            Lihat Semua Jadwal <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {openTrips.map((ot: any) => (
            <OpenTripCard 
              key={ot.id} 
              ot={ot} 
              onJoin={onJoin} 
              getSisaKuota={getSisaKuota} 
              visibilities={visibilities} 
              allLeaders={tripLeaders} 
              config={config}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
