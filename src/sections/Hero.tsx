import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee, ChevronRight, Tent, Mountain, TrendingUp, Search, Calendar, MapPin, Users, ArrowRight } from 'lucide-react';
import { Button } from '../components/Button';
import { useSound } from '../hooks/useSound';

export const Hero = ({ config, onExplore, onBooking }: any) => {
  const { playClick } = useSound();
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
    <section className="relative min-h-screen flex items-center pt-20 bg-art-text">
      {/* Background Slider */}
      <div className="absolute inset-0 z-0 overflow-hidden">
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
          <div className="lg:col-span-8 flex flex-col items-center text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8 }}
              className="w-full flex flex-col items-center"
            >
              <div className="flex justify-center w-full">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 md:px-4 md:py-2 rounded-2xl mb-6 md:mb-8 transform -rotate-1 shadow-[0_10px_20px_rgba(0,0,0,0.4)] mx-auto flex-nowrap">
                  <Coffee size={12} className="text-art-orange animate-bounce md:size-[16px] shrink-0" />
                  <span className="text-[7px] md:text-[9px] font-black uppercase tracking-[0.2em] text-white whitespace-nowrap">
                    {config?.homepage?.heroSub || "Open Trip Eksklusif"}
                  </span>
                </div>
              </div>
              
              <h1 className="text-7xl md:text-9xl font-black text-white leading-[0.8] tracking-tighter uppercase mb-4 drop-shadow-[0_20px_50px_rgba(0,0,0,1)] flex flex-col items-center">
                {config?.homepage?.heroFeatures && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="block text-[#fff7ed] text-[7px] md:text-[9px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] mb-4 drop-shadow-none bg-art-orange/90 backdrop-blur-sm w-fit px-3 py-1 md:px-4 md:py-1.5 rounded-full border border-art-orange/20 whitespace-nowrap shadow-[0_5px_15px_rgba(255,107,0,0.4)]"
                  >
                    {config.homepage.heroFeatures}
                  </motion.span>
                )}
                {config?.homepage?.heroTitlePrefix && <span className="block text-art-orange text-5xl md:text-6xl mb-2 tracking-[0.2em] drop-shadow-[0_10px_20px_rgba(255,107,0,0.6)]">{config.homepage.heroTitlePrefix}</span>}
                {config?.homepage?.heroTitle || "Ngopi Di Puncak Tertinggi."}
              </h1>

               {config?.homepage?.heroTagline && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 p-2 px-6 md:p-3 md:px-8 bg-white/5 backdrop-blur-md border border-white/20 rounded-full rotate-1 shadow-[0_0_20px_rgba(255,107,0,0.3)]"
                >
                  <p className="text-[9px] md:text-sm font-serif italic text-white tracking-[0.2em] md:tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(255,107,0,1)] flex items-center gap-2">
                    <span className="text-art-orange">★</span> {config.homepage.heroTagline} <span className="text-art-orange">★</span>
                  </p>
                </motion.div>
              )}

              <div className="flex flex-col items-center gap-4 mt-6 mb-6">
                <p className="text-[9px] md:text-[12px] font-bold text-white/70 leading-relaxed max-w-2xl uppercase italic mx-auto">
                  {config?.homepage?.heroDescription || "Pendakian premium dengan standar keamanan tinggi dan kenikmatan seduhan kopi original di setiap jengkal perjalanan Anda."}
                </p>
              </div>

              <div className="flex flex-col items-center gap-4 mt-8 mb-8 w-full">
                <div className="grid grid-cols-2 gap-3 md:gap-5 w-full max-w-md mx-auto">
                  <Button 
                    onClick={() => { playClick(); onExplore(); }}
                    className="px-2 py-4 md:px-10 md:py-5 text-[9px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] bg-art-orange text-white border-2 border-white/20 shadow-[0_10px_20px_-5px_rgba(255,107,0,0.4)] hover:translate-y-[-4px] transition-all flex items-center justify-center gap-1 md:gap-2 group"
                  >
                    Destinations <ChevronRight size={14} className="md:size-[18px] group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button 
                    onClick={() => { playClick(); onBooking(); }}
                    className="px-2 py-4 md:px-10 md:py-5 text-[9px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] bg-art-text text-white border-2 border-white/20 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.3)] hover:translate-y-[-4px] transition-all flex items-center justify-center gap-1 md:gap-2 group"
                  >
                    Explore Trips <Calendar size={14} className="md:size-[18px] group-hover:rotate-12 transition-transform" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 md:gap-6 pt-2">
                  <div className="flex -space-x-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white bg-art-bg overflow-hidden shadow-lg">
                        <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt="User" />
                      </div>
                    ))}
                  </div>
                  <div className="text-left">
                    <p className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-white">{config?.homepage?.statHikers || "500+"} Happy Hikers</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp size={8} className="text-art-green" />
                      <p className="text-[7px] md:text-[9px] font-bold text-art-green uppercase">{config?.homepage?.statSatisfaction || "98%"} Satisfaction</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="lg:col-span-4 block relative mt-4 lg:mt-0 z-20">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 1 }} className="relative max-w-[280px] md:max-w-none mx-auto lg:mx-0">
              <div className="border border-white/50 p-2 rounded-[2.5rem] md:rounded-[3.5rem] shadow-[10px_10px_0px_0px_#ff6b00] md:shadow-[20px_20px_0px_0px_#ff6b00] rotate-3 overflow-hidden aspect-[4/5] relative group scale-100 md:scale-110">
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
                <div className="absolute bottom-6 md:bottom-10 left-4 md:left-8 right-4 md:right-8 pointer-events-none drop-shadow-2xl text-center">
                  <p className="text-xl md:text-3xl font-black uppercase text-white leading-none tracking-tighter drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)]">{slides[currentSlide]?.name}</p>
                </div>
              </div>
              
              {/* Larger MDPL Circle */}
              <div className="absolute -top-6 -right-6 md:-top-12 md:-right-12 w-24 h-24 md:w-40 md:h-40 bg-art-text rounded-full border-4 border-art-orange/20 flex flex-col items-center justify-center -rotate-12 shadow-2xl z-20">
                <p className="text-2xl md:text-5xl font-black text-white leading-none tracking-tighter">{slides[currentSlide]?.height}</p>
                <p className="text-[10px] md:text-[16px] font-black text-art-orange uppercase tracking-[0.4em] mt-1.5 md:mt-3">MDPL</p>
                <div className="w-10 md:w-20 h-1 md:h-2 bg-white/20 mt-3 md:mt-6 rounded-full"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <motion.div 
        animate={{ y: [0, 8, 0] }} 
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 text-white/40 flex flex-col items-center gap-2 z-[60]"
      >
        <span className="text-[9px] font-black uppercase tracking-[0.5em] text-art-orange drop-shadow-sm">Scroll</span>
        <div className="w-[2px] h-6 md:h-10 bg-gradient-to-b from-art-orange to-transparent rounded-full shadow-[0_0_10px_rgba(255,107,0,0.5)]" />
      </motion.div>
    </section>
  );
};
