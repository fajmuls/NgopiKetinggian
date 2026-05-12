import React from 'react';
import { motion } from 'motion/react';
import { Coffee, ChevronRight, Tent, Mountain, TrendingUp } from 'lucide-react';
import { Button } from '../components/Button';

export const Hero = ({ onExplore }: any) => {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0 bg-art-bg flex items-center justify-center opacity-30 select-none pointer-events-none">
        <h1 className="text-[25vw] font-black uppercase text-art-text/5 leading-none tracking-tighter">NGOPI</h1>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-8">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 bg-white border-2 border-art-text px-4 py-2 rounded-2xl mb-8 transform -rotate-1 shadow-[4px_4px_0px_0px_#ff6b00]">
                <Coffee size={18} className="text-art-orange animate-bounce" />
                <span className="text-xs font-black uppercase tracking-widest text-art-text">Adventure & Brew Experts</span>
              </div>
              
              <h1 className="text-5xl md:text-8xl font-black text-art-text leading-[0.9] tracking-tighter uppercase mb-8">
                Nikmati Kopi di <span className="text-art-orange">Puncak Tertinggi.</span>
              </h1>
              
              <p className="text-lg md:text-xl font-bold text-art-text/60 leading-relaxed max-w-2xl mb-12 uppercase italic">
                Pendakian premium dengan standar keamanan tinggi dan kenikmatan seduhan kopi original di setiap jengkal perjalanan Anda.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <Button 
                  onClick={onExplore}
                  variant="primary" 
                  className="px-10 py-5 text-xs font-black uppercase tracking-[0.2em] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
                >
                  Explore Trips <ChevronRight size={18} />
                </Button>
                
                <div className="flex items-center gap-6">
                  <div className="flex -space-x-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-art-bg overflow-hidden shadow-sm">
                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-art-text">500+ Happy Hikers</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp size={10} className="text-art-green" />
                      <p className="text-[10px] font-bold text-art-green uppercase">98% Satisfaction Rate</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="lg:col-span-4 hidden lg:block relative">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 1 }} className="relative">
              <div className="bg-white border-[3px] border-art-text p-6 rounded-[3rem] shadow-[20px_20px_0px_0px_#1a1a1a] rotate-2 overflow-hidden aspect-[4/5] relative group">
                <img 
                  src="https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=1974&auto=format&fit=crop" 
                  alt="Mountain" 
                  className="w-full h-full object-cover rounded-[2rem] grayscale group-hover:grayscale-0 transition-all duration-700" 
                />
                <div className="absolute inset-0 bg-art-orange/10 mix-blend-multiply pointer-events-none" />
                <div className="absolute bottom-10 left-10 right-10 bg-white border-2 border-art-text p-6 rounded-3xl -rotate-6 transform translate-y-4 group-hover:translate-y-0 shadow-lg transition-transform">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-art-text rounded-2xl flex items-center justify-center text-white shrink-0">
                      <Tent size={24} />
                    </div>
                    <div>
                      <p className="text-lg font-black uppercase text-art-text mb-0.5 leading-none">Gunung Gede</p>
                      <p className="text-[10px] font-bold uppercase text-art-text/40 tracking-widest leading-none">Via Cibodas • 2H 1M</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-art-green rounded-full border-4 border-art-text flex flex-col items-center justify-center -rotate-12 shadow-xl z-20 animate-pulse">
                <Mountain size={32} className="text-white mb-1" />
                <p className="text-[10px] font-black text-white uppercase tracking-tighter">Premium</p>
                <p className="text-[10px] font-black text-white uppercase tracking-tighter">Experience</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
