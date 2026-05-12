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
                  {config?.homepage?.heroSub || "Open Trip Eksklusif"}
                </span>
              </div>
              
              <h1 className="text-5xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter uppercase mb-8 drop-shadow-2xl">
                {config?.homepage?.heroFeatures && (
                  <motion.span 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="block text-art-orange text-xs md:text-sm font-black uppercase tracking-[0.5em] mb-6 drop-shadow-none bg-white/10 backdrop-blur-sm w-fit px-4 py-1.5 rounded-full border border-white/20"
                  >
                    {config.homepage.heroFeatures}
                  </motion.span>
                )}
                {config?.homepage?.heroTitlePrefix && <span className="block text-art-orange text-3xl md:text-5xl mb-3">{config.homepage.heroTitlePrefix}</span>}
                {config?.homepage?.heroTitle || "Ngopi Di Puncak Tertinggi."}
              </h1>
              
              <p className="text-lg md:text-xl font-bold text-white/70 leading-relaxed max-w-2xl mb-10 uppercase italic">
                {config?.homepage?.heroDescription || "Pendakian premium dengan standar keamanan tinggi dan kenikmatan seduhan kopi original di setiap jengkal perjalanan Anda."}
              </p>

              <div className="flex flex-col sm:flex-row gap-6 items-center lg:items-start mt-6">
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <Button 
                    onClick={onExplore}
                    className="px-10 py-5 text-[11px] font-black uppercase tracking-[0.2em] bg-white text-art-text border-2 border-white shadow-[6px_6px_0px_0px_rgba(255,107,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
                  >
                    View Destinations <ChevronRight size={18} />
                  </Button>
                  <Button 
                    onClick={onBooking}
                    className="px-10 py-5 text-[11px] font-black uppercase tracking-[0.2em] bg-art-green text-white border-2 border-art-green shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
                  >
                    Explore Trips <Calendar size={18} />
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
              <div className="border border-white/50 p-2 rounded-[3.5rem] shadow-[20px_20px_0px_0px_#ff6b00] rotate-3 overflow-hidden aspect-[4/5] relative group scale-110">
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
                
                {/* Mountain Name - Transparent Background */}
                <div className="absolute bottom-10 left-8 right-8 pointer-events-none drop-shadow-2xl text-center">
                  <p className="text-3xl font-black uppercase text-white leading-none tracking-tighter drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)]">{slides[currentSlide]?.name}</p>
                </div>
              </div>
              
              {/* Enlarged MDPL Circle */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-art-text rounded-full border-4 border-white flex flex-col items-center justify-center -rotate-12 shadow-2xl z-20">
                <p className="text-5xl font-black text-white leading-none tracking-tighter">{slides[currentSlide]?.height}</p>
                <p className="text-xl font-black text-white/80 uppercase tracking-[0.3em] mt-2">MDPL</p>
                <div className="w-16 h-2 bg-art-orange mt-4 rounded-full"></div>
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
