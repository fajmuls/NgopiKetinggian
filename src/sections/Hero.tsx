import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee, ChevronRight, Tent, Mountain, TrendingUp, Search, Calendar, MapPin, Users, ArrowRight } from 'lucide-react';
import { Button } from '../components/Button';

export const Hero = ({ config, onExplore, onBooking }: any) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = config?.homepage?.heroSlides || [
    {
      name: "Gunung Gede Pangrango",
      height: "2.958",
      image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2671&auto=format&fit=crop"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-art-text">
      {/* Background Slider */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.4, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <img 
              src={slides[currentSlide]?.image} 
              className="w-full h-full object-cover grayscale" 
              alt="Hero background"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-art-text/80 via-transparent to-art-text/90" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 pt-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-8 flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8 }}
              className="w-full"
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-2xl mb-8 transform -rotate-1 shadow-xl">
                <Coffee size={18} className="text-art-orange animate-bounce" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                  {config?.homepage?.heroFeatures || "Adventure & Brew Experts"}
                </span>
              </div>
              
              <h1 className="text-5xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter uppercase mb-8 drop-shadow-2xl">
                {config?.homepage?.heroSlogan && (
                  <motion.span 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="block text-art-orange text-xs md:text-sm font-black uppercase tracking-[0.5em] mb-6 drop-shadow-none bg-white/10 backdrop-blur-sm w-fit px-4 py-1.5 rounded-full border border-white/20"
                  >
                    {config.homepage.heroSlogan}
                  </motion.span>
                )}
                {config?.homepage?.heroTitlePrefix && <span className="block text-art-orange text-3xl md:text-5xl mb-3">{config.homepage.heroTitlePrefix}</span>}
                {config?.homepage?.heroTitle || "Ngopi Di Puncak Tertinggi."}
              </h1>
              
              <p className="text-lg md:text-xl font-bold text-white/70 leading-relaxed max-w-2xl mb-10 uppercase italic">
                {config?.homepage?.heroDescription || "Pendakian premium dengan standar keamanan tinggi dan kenikmatan seduhan kopi original di setiap jengkal perjalanan Anda."}
              </p>

              {/* Central Search Bar */}
              <div className="w-full max-w-2xl mb-12 relative group">
                <div className="absolute inset-0 bg-art-orange blur-xl opacity-20 group-focus-within:opacity-40 transition-opacity" />
                <div className="relative bg-white border-2 border-art-text p-2 rounded-[2rem] flex items-center shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                  <div className="flex-1 flex items-center px-4 gap-3">
                    <Search className="text-art-text/30" size={20} />
                    <input 
                      type="text" 
                      placeholder="Cari gunung impianmu..."
                      className="w-full bg-transparent border-none outline-none py-3 text-sm font-black uppercase tracking-widest text-art-text placeholder:text-art-text/20"
                      onFocus={() => {
                        const el = document.getElementById('destinasi');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                    />
                  </div>
                  <button 
                    onClick={onExplore}
                    className="bg-art-text text-white px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-art-orange transition-colors flex items-center gap-2"
                  >
                    Temukan <ArrowRight size={14} />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 items-center lg:items-start">
                <div className="flex gap-4">
                  <Button 
                    onClick={onExplore}
                    variant="primary" 
                    className="px-8 py-5 text-[10px] font-black uppercase tracking-widest bg-white text-art-text border-2 border-art-text shadow-[6px_6px_0px_0px_rgba(255,107,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
                  >
                    Explore Trips <ChevronRight size={18} />
                  </Button>
                  <Button 
                    onClick={onBooking}
                    variant="primary" 
                    className="px-8 py-5 text-[10px] font-black uppercase tracking-widest bg-art-orange text-white border-2 border-art-text shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
                  >
                    Booking Trip <Calendar size={16} />
                  </Button>
                </div>
                
                <div className="flex items-center gap-6 pt-4 sm:pt-0">
                  <div className="flex -space-x-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-12 h-12 rounded-full border-2 border-white bg-art-bg overflow-hidden shadow-lg">
                        <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt="User" />
                      </div>
                    ))}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white">{config?.homepage?.statHikers || "500+"} Happy Hikers</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp size={10} className="text-art-green" />
                      <p className="text-[10px] font-bold text-art-green uppercase">{config?.homepage?.statSatisfaction || "98%"} Satisfaction</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="lg:col-span-4 hidden lg:block relative">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 1 }} className="relative">
              <div className="bg-white border-[3px] border-art-text p-6 rounded-[3.5rem] shadow-[20px_20px_0px_0px_#ff6b00] rotate-3 overflow-hidden aspect-[4/5] relative group scale-110">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={currentSlide}
                    src={slides[currentSlide]?.image} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    alt="Mountain" 
                    className="w-full h-full object-cover rounded-[2.5rem] transition-all duration-700" 
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-art-text/10 mix-blend-multiply pointer-events-none" />
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm border-2 border-art-text p-5 rounded-[2.5rem] -rotate-2 transform translate-y-2 group-hover:translate-y-0 shadow-2xl transition-transform border-b-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-art-text rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg border-2 border-white/20">
                      <img src="https://files.catbox.moe/lubzno.png" alt="Logo" className="w-8 h-8 object-contain" />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase text-art-text mb-0.5 leading-none tracking-tight">{slides[currentSlide]?.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase text-art-orange tracking-widest leading-none px-2 py-0.5 bg-art-orange/10 rounded-full">{slides[currentSlide]?.height} MDPL</span>
                        <span className="w-1 h-1 rounded-full bg-art-text/20"></span>
                        <span className="text-[8px] font-bold text-art-text/40 uppercase">Elevation</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-art-text rounded-full border-4 border-white flex flex-col items-center justify-center -rotate-12 shadow-2xl z-20">
                <p className="text-[14px] font-black text-white leading-none tracking-tighter">{slides[currentSlide]?.height}</p>
                <p className="text-[8px] font-black text-white/60 uppercase tracking-widest mt-1">MDPL</p>
                <div className="w-8 h-1 bg-art-orange mt-2 rounded-full"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }} 
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/30 flex flex-col items-center gap-2"
      >
        <span className="text-[8px] font-black uppercase tracking-[0.4em]">Scroll</span>
        <div className="w-1 h-8 bg-gradient-to-b from-white/30 to-transparent rounded-full" />
      </motion.div>
    </section>
  );
};
