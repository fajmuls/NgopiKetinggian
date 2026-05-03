import fs from 'fs';

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

const renderTrips = `{tripTab === 'private' ? (
            filteredDestinations.length > 0 ? (
              filteredDestinations.map((dest) => (
                <DestinationCard key={dest.id} dest={dest} visibilities={config.visibilities} onBook={(destinasi, jalur, durasi) => handleOpenBooking(destinasi, jalur, durasi)} />
              ))
            ) : (
              <div className="text-center py-20 border-2 border-art-text/20 rounded-2xl bg-white flex flex-col items-center justify-center">
                <Mountain size={48} className="text-art-text/20 mb-4" />
                <h3 className="text-xl font-bold uppercase tracking-widest text-art-text">Destinasi Tidak Ditemukan</h3>
                <p className="text-sm font-medium text-art-text/60 mt-2">Coba filter atau kata kunci lain.</p>
              </div>
            )
          ) : (
             filteredOpenTrips.length > 0 ? (
               filteredOpenTrips.map((ot: any, i: number) => (
                 <div key={i} className="mb-20">
                   <div className="bg-white rounded-3xl border-4 flex flex-col md:flex-row overflow-hidden border-art-text relative shadow-sm hover:shadow-2xl transition-all duration-300">
                     <div className="md:w-5/12 h-64 md:h-auto overflow-hidden border-b-4 md:border-b-0 md:border-r-4 border-art-text relative group">
                        <img src={ot.image || 'https://images.unsplash.com/photo-1549887552-cb1071d3e5ca'} alt={ot.name} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105" />
                        <div className="absolute top-4 left-4 flex gap-2">
                          <span className="bg-art-orange text-white px-3 py-1 font-bold text-[10px] uppercase tracking-widest rounded-md border border-white/20 shadow-lg">{ot.difficulty}</span>
                          <span className="bg-white text-art-text px-3 py-1 font-bold text-[10px] uppercase tracking-widest rounded-md shadow-lg">{ot.region}</span>
                        </div>
                     </div>
                     <div className="md:w-7/12 p-6 md:p-8 flex flex-col justify-between">
                       <div>
                         <div className="flex justify-between items-start mb-4">
                           <div>
                             <h3 className="font-black text-2xl md:text-3xl uppercase tracking-tighter text-art-text">{ot.name}</h3>
                             <p className="font-bold text-art-orange text-xs uppercase tracking-widest flex items-center gap-2 mt-1">OPEN TRIP</p>
                           </div>
                           <div className="bg-art-bg border border-art-text text-art-text font-black px-4 py-2 text-sm uppercase tracking-widest rounded-xl text-center">
                             IDR {ot.price}K<span className="text-[10px] font-bold block opacity-50 line-through">IDR {ot.originalPrice}K</span>
                           </div>
                         </div>
                         
                         <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4 mb-6">
                           <div className="flex items-center gap-2">
                             <div className="w-10 h-10 border border-art-text rounded-full flex items-center justify-center"><Calendar size={14} /></div>
                             <div><p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Jadwal</p><p className="font-bold text-xs">{ot.jadwal}</p></div>
                           </div>
                           <div className="flex items-center gap-2">
                             <div className="w-10 h-10 border border-art-text rounded-full flex items-center justify-center"><Users size={14} /></div>
                             <div><p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Kuota</p><p className="font-bold text-xs">{ot.kuota}</p></div>
                           </div>
                           <div className="flex items-center gap-2">
                             <div className="w-10 h-10 border border-art-text rounded-full flex items-center justify-center"><Map size={14} /></div>
                             <div><p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Mepo</p><p className="font-bold text-xs">{ot.mepo}</p></div>
                           </div>
                           <div className="flex items-center gap-2">
                             <div className="w-10 h-10 border border-art-text rounded-full flex items-center justify-center"><Tent size={14} /></div>
                             <div><p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Jalur</p><p className="font-bold text-xs">{ot.path}</p></div>
                           </div>
                         </div>
                       </div>
                       <button onClick={() => handleOpenBooking(ot.name, ot.path, ot.duration)} className="w-full sm:w-auto text-[10px] uppercase tracking-widest px-10 py-4 rounded-lg bg-art-orange hover:bg-art-text text-white font-bold transition-colors shadow-lg">Booking Trip</button>
                     </div>
                   </div>
                 </div>
               ))
             ) : (
                <div className="text-center py-20 border-2 border-art-text/20 rounded-2xl bg-white flex flex-col items-center justify-center">
                  <Mountain size={48} className="text-art-text/20 mb-4" />
                  <h3 className="text-xl font-bold uppercase tracking-widest text-art-text">Belum Ada Open Trip</h3>
                  <p className="text-sm font-medium text-art-text/60 mt-2">Nantikan jadwal open trip kami selanjutnya.</p>
                </div>
             )
          )}`;

appCode = appCode.replace(/\{filteredDestinations\.length > 0 \? \([\s\S]*?\([\s\S]*?\}\)/, renderTrips);

fs.writeFileSync('src/App.tsx', appCode);

