import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee, ChevronRight, Tent, Mountain, TrendingUp, Search, Calendar, MapPin, Users, ArrowRight } from 'lucide-react';
import { Button } from '../components/Button';
import { useSound } from '../hooks/useSound';

const TypewriterText = ({ text }: { text: string }) => {
  return (
    <motion.span
      initial={{ width: "0%" }}
      animate={{ width: "100%" }}
      transition={{ 
        duration: 3,
        ease: "linear",
        repeat: Infinity,
        repeatType: "reverse",
        repeatDelay: 1
      }}
      className="inline-block overflow-hidden whitespace-nowrap align-bottom pr-1"
    >
      {text}
    </motion.span>
  );
};

export const Hero = ({ config, onExplore, onBooking }: any) => {
  const { playClick } = useSound();
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = config?.homepage?.heroSlides || [
    {
      name: "Gunung Gede Pangrango",
      height: "2.958",
      image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2671&auto=format&fit=crop"
    },
    {
      name: "Gunung Ciremai",
      height: "3.078",
      image: "https://images.unsplash.com/photo-1583091171810-7389ea1562b7?q=80&w=2070&auto=format&fit=crop"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative min-h-[110vh] flex items-center pt-20 bg-art-text overflow-hidden">
      {/* Background Slider */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.6, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <img 
              src={slides[currentSlide]?.image} 
              className="w-full h-full object-cover" 
              alt="Hero background"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/20 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-art-text/60 via-transparent to-art-text/90" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 pt-0 pb-16">
        
        {(() => {
          const renderBlock = (block: string) => {
            switch (block) {
              case 'slogan':
                return (config?.homepage?.hideHeroSlogan ? null :
                  <motion.div key={block} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center lg:justify-start w-full z-30">
                    <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-md border border-white/20 px-3 py-1.5 md:px-4 md:py-2 rounded-2xl transform -rotate-1 shadow-[0_10px_20px_rgba(0,0,0,0.4)] flex-nowrap">
                      <Coffee size={12} className="text-art-orange animate-bounce md:size-[16px] shrink-0" />
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] text-white whitespace-nowrap">
                        {config?.homepage?.heroSub || "Open Trip Eksklusif"}
                      </span>
                    </div>
                  </motion.div>
                );
              case 'features':
                return config?.homepage?.hideHeroFeatures ? null : (config?.homepage?.heroFeatures ? (
                  <motion.div key={block} className="flex justify-center lg:justify-start w-full z-30">
                    <span 
                      className="inline-flex text-[#fff7ed] text-[7px] md:text-[8px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] drop-shadow-none bg-art-orange/95 backdrop-blur-sm px-4 py-1.5 md:px-6 md:py-2 rounded-[2rem] border-2 border-white/20 whitespace-normal text-center lg:text-left max-w-[90vw] leading-relaxed shadow-[0_10px_30px_rgba(255,107,0,0.5)] italic"
                    >
                      {config.homepage.heroFeatures}
                    </span>
                  </motion.div>
                ) : null);
              case 'title':
                return config?.homepage?.hideHeroTitle ? null : (
                  <h1 key={block} className="text-7xl sm:text-8xl md:text-[11rem] font-black text-white leading-[0.85] tracking-tighter uppercase drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)] flex flex-col items-center lg:items-start text-center lg:text-left max-w-[95vw] mx-auto lg:mx-0 break-words z-30">
                    {config?.homepage?.heroTitlePrefix && <span className="block text-art-orange text-4xl md:text-6xl lg:text-7xl mb-3 tracking-[0.3em] drop-shadow-[0_10px_20px_rgba(255,107,0,0.6)] font-sans font-black uppercase">{config.homepage.heroTitlePrefix}</span>}
                    <span className="relative drop-shadow-[0_10px_20px_rgba(0,0,0,1)] inline-block">
                      {config?.homepage?.heroTitle || "Ngopi Di Puncak Tertinggi."}
                      <div className="absolute -bottom-2 md:-bottom-4 left-0 w-full lg:max-w-xl h-1 md:h-2 bg-art-orange shadow-[0_0_15px_#ff6b00] rounded-full"></div>
                    </span>
                  </h1>
                );
              case 'tagline':
                return config?.homepage?.hideHeroTagline ? null : (config?.homepage?.heroTagline ? (
                  <motion.div
                    key={block}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-2 px-4 md:p-3 md:px-8 bg-black/40 backdrop-blur-md border border-white/20 rounded-full rotate-1 shadow-[0_0_20px_rgba(255,107,0,0.3)] z-30 max-w-[90vw] mx-auto lg:mx-0 flex justify-center lg:justify-start text-center lg:text-left w-full sm:w-auto"
                  >
                    <p className="text-[10px] md:text-sm font-serif italic text-white tracking-[0.1em] md:tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(255,107,0,1)] flex items-center justify-center gap-2 flex-wrap sm:flex-nowrap">
                      <span className="text-art-orange shrink-0 hidden sm:inline-block">★</span> <span className="text-center lg:text-left w-full sm:w-auto relative whitespace-nowrap overflow-hidden">
                        <TypewriterText text={config.homepage.heroTagline} />
                        <motion.span
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          className="inline-block w-1.5 h-3 md:w-2 md:h-4 bg-art-orange ml-1 align-middle"
                        />
                      </span> <span className="text-art-orange shrink-0 hidden sm:inline-block">★</span>
                    </p>
                  </motion.div>
                ) : null);
              case 'description':
                return config?.homepage?.hideHeroDescription ? null : (
                  <motion.div key={block} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center lg:items-start gap-4 z-30">
                    <p className="text-[9px] md:text-[10px] font-bold text-white/70 leading-relaxed max-w-2xl uppercase mx-auto lg:mx-0 text-center lg:text-left px-4 lg:px-0">
                      {config?.homepage?.heroDescription || "Pendakian premium dengan standar keamanan tinggi dan kenikmatan seduhan kopi original di setiap jengkal perjalanan Anda."}
                    </p>
                  </motion.div>
                );
              case 'buttons':
                return config?.homepage?.hideHeroButtons ? null : (
                  <div key={block} className="flex flex-wrap lg:flex-nowrap items-center justify-center lg:justify-start gap-3 md:gap-5 w-full z-30 px-4 lg:px-0">
                    <Button 
                      onClick={() => { playClick(); onExplore(); }}
                      className="px-6 py-4 md:px-10 md:py-5 text-[9px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] bg-art-orange text-white border-2 border-white/20 shadow-[0_10px_20px_-5px_rgba(255,107,0,0.4)] hover:translate-y-[-4px] transition-all flex items-center justify-center gap-1 md:gap-2 group"
                    >
                      {config?.homepage?.heroButtonText1 || "Mulai Melihat Tur"} <ChevronRight size={14} className="md:size-[18px] group-hover:translate-x-1 transition-transform" />
                    </Button>
                    {config?.homepage?.heroIgUrl && (
                      <a href={config.homepage.heroIgUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-4 md:px-8 md:py-5 text-[9px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] bg-art-text text-white border-2 border-white/20 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.3)] hover:translate-y-[-4px] transition-all hover:border-pink-500/50 flex items-center justify-center gap-2">
                        IG <ArrowRight size={14} />
                      </a>
                    )}
                    {config?.homepage?.heroTiktokUrl && (
                      <a href={config.homepage.heroTiktokUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-4 md:px-8 md:py-5 text-[9px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] bg-art-text text-white border-2 border-white/20 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.3)] hover:translate-y-[-4px] transition-all hover:border-blue-500/50 flex items-center justify-center gap-2">
                        TikTok <ArrowRight size={14} />
                      </a>
                    )}
                    <Button 
                      onClick={() => { playClick(); onBooking(); }}
                      className="px-6 py-4 md:px-10 md:py-5 text-[9px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] bg-art-text text-white border-2 border-white/20 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.3)] hover:translate-y-[-4px] transition-all flex items-center justify-center gap-1 md:gap-2 group"
                    >
                      {config?.homepage?.heroButtonText2 || "Explore Trips"} <Calendar size={14} className="md:size-[18px] group-hover:rotate-12 transition-transform" />
                    </Button>
                  </div>
                );
              case 'stats':
                return config?.homepage?.hideHeroStats ? null : (
                  <div key={block} className="flex items-center justify-center lg:justify-start gap-4 md:gap-6 z-30 pt-4 px-4 lg:px-0">
                    <div className="flex -space-x-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white bg-art-bg overflow-hidden shadow-lg">
                          <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt="User" />
                        </div>
                      ))}
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white">{config?.homepage?.statHikers || "500+"} Happy Hikers</p>
                      <div className="flex items-center gap-1">
                        <TrendingUp size={8} className="text-art-green" />
                        <p className="text-[9px] md:text-[10px] font-bold text-art-green uppercase">{config?.homepage?.statSatisfaction || "98%"} Satisfaction</p>
                      </div>
                    </div>
                  </div>
                );
              case 'slider':
                return config?.homepage?.hideHeroSlider ? null : (
                  <div key={block} className="block relative mt-16 md:mt-24 lg:mt-8 z-30 w-full mb-8 lg:mb-0">
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 1 }} className="relative max-w-[280px] md:max-w-md mx-auto lg:ml-auto lg:mr-0">
                      <div className="border border-white/50 p-2 rounded-[2.5rem] md:rounded-[3.5rem] shadow-[10px_10px_0px_0px_#ff6b00] md:shadow-[20px_20px_0px_0px_#ff6b00] rotate-3 overflow-hidden aspect-[4/5] md:aspect-[3/4] relative group scale-105 md:scale-110 object-cover">
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
                        
                        <motion.div 
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                          className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] pointer-events-none"
                        />

                        <div className="absolute inset-0 bg-art-text/10 mix-blend-multiply pointer-events-none" />
                        
                        <div className="absolute bottom-4 md:bottom-8 left-4 md:left-6 right-4 md:right-6 pointer-events-none drop-shadow-2xl text-left flex flex-col gap-1 items-start">
                          {(() => {
                            const nameObj = slides[currentSlide]?.name || "";
                            let prefix = "";
                            let theRest = nameObj;
                            if (nameObj.toLowerCase().startsWith("gunung ")) {
                              prefix = "Gunung";
                              theRest = nameObj.substring(7);
                            } else if (nameObj.toLowerCase().startsWith("mt. ")) {
                              prefix = "Mt.";
                              theRest = nameObj.substring(4);
                            } else if (nameObj.toLowerCase().startsWith("bukit ")) {
                              prefix = "Bukit";
                              theRest = nameObj.substring(6);
                            }
                            return (
                              <>
                                {prefix && (
                                  <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={`prefix-${currentSlide}`}
                                    className="bg-black/30 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/10"
                                  >
                                    <p className="text-2xl md:text-3xl font-serif italic normal-case text-art-orange tracking-[0.2em]">{prefix}</p>
                                  </motion.div>
                                )}
                                <motion.div 
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  key={`name-${currentSlide}`}
                                  className="bg-black/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 mt-1"
                                >
                                  <p className="text-3xl md:text-5xl font-black uppercase text-white leading-tight tracking-[0.1em]">{theRest}</p>
                                </motion.div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1], rotate: [-12, -8, -12] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="absolute -top-10 -right-10 md:-top-16 md:-right-16 w-28 h-28 md:w-36 md:h-36 bg-art-text rounded-full border-4 border-art-orange/20 flex flex-col items-center justify-center -rotate-12 shadow-2xl z-20 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-tr from-art-orange/10 to-transparent"></div>
                        <p className="text-2xl md:text-5xl font-black text-white leading-none tracking-tighter relative z-10">{slides[currentSlide]?.height}</p>
                        <p className="text-[10px] md:text-[14px] font-black text-art-orange uppercase tracking-[0.4em] mt-0.5 md:mt-1 relative z-10">MDPL</p>
                        <div className="w-8 md:w-16 h-1 md:h-1.5 bg-white/20 mt-1 md:mt-2 rounded-full relative z-10"></div>
                      </motion.div>
                    </motion.div>
                  </div>
                );
              default:
                return null;
            }
          };

          const order = config?.homepage?.heroOrder || ['slogan', 'features', 'title', 'tagline', 'description', 'buttons', 'stats', 'slider'];

          return (
            <>
              {/* MOBILE VIEW */}
              <div className="flex flex-col items-center gap-6 md:gap-10 w-full z-30 relative lg:hidden">
                {order.map((block: string) => renderBlock(block))}
              </div>

              {/* DESKTOP VIEW */}
              <div className="hidden lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center w-full z-30 relative">
                <div className="flex flex-col items-start gap-8 z-30 w-full">
                  {order.filter((b: string) => b !== 'slider').map((block: string) => renderBlock(block))}
                </div>
                <div className="w-full flex justify-end">
                  {order.includes('slider') && renderBlock('slider')}
                </div>
              </div>
            </>
          );
        })()}
      </div>
      
    </section>
  );
};
