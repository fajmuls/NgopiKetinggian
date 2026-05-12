import React from 'react';
import { Coffee, MapPin, MessageCircle, Instagram, Send, Globe, ChevronRight } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-art-text text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center -rotate-6 shadow-[4px_4px_0px_0px_#ff6b00]">
                <Coffee className="text-art-text" size={24} />
              </div>
              <h2 className="text-lg font-black leading-none tracking-tighter uppercase">Ngopi Di<br/><span className="text-art-orange">Ketinggian</span></h2>
            </div>
            <p className="text-sm text-white/60 leading-relaxed font-medium mb-8 pr-4">
              Penyedia layanan pendakian premium yang mengutamakan kenyamanan, keamanan, dan pengalaman seduhan kopi original di puncak gunung.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-art-orange hover:border-art-orange transition-all">
                <Instagram size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-art-orange hover:border-art-orange transition-all">
                <MessageCircle size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-art-orange hover:border-art-orange transition-all">
                <Send size={20} />
              </a>
            </div>
          </div>

          <div className="col-span-1">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-art-orange">Menu Utama</h4>
            <ul className="space-y-4">
              {['Home', 'Semua Gunung', 'Open Trip', 'Fasilitas Layanan', 'Syarat & Ketentuan', 'Tentang Kami'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm font-bold text-white/50 hover:text-white transition-colors flex items-center gap-2 group">
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-art-orange">Informasi Kontak</h4>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-art-orange shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-white/40 mb-1">Office</p>
                  <p className="text-sm font-bold">Gunung Gede Pangrango, Jawa Barat, Indonesia</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-art-orange shrink-0">
                  <Globe size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-white/40 mb-1">Email Support</p>
                  <p className="text-sm font-bold">hello@ngopidiketinggian.com</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-art-orange">Metode Pembayaran</h4>
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <p className="text-[10px] font-medium text-white/40 leading-relaxed italic mb-4">
                Kami mendukung berbagai metode pembayaran otomatis demi kemudahan transaksi Anda.
              </p>
              <div className="flex gap-2 flex-wrap opacity-50">
                <div className="px-3 py-1 bg-white rounded font-black text-art-text text-[8px] uppercase">BCA</div>
                <div className="px-3 py-1 bg-white rounded font-black text-art-text text-[8px] uppercase">GOPAY</div>
                <div className="px-3 py-1 bg-white rounded font-black text-art-text text-[8px] uppercase">DANA</div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">
            © 2026 NGOPI DI KETINGGIAN. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white">Privacy Policy</a>
            <a href="#" className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
