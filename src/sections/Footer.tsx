import React from 'react';
import { Coffee, MapPin, MessageCircle, Instagram, Send, Globe, ChevronRight, Phone, Mail, Youtube, Facebook } from 'lucide-react';

export const Footer = ({ config }: any) => {
  const hp = config?.homepage;
  const socialLinks = hp?.socialLinks || [
    { icon: 'instagram', url: '#' },
    { icon: 'whatsapp', url: '#' },
    { icon: 'telegram', url: '#' }
  ];

  return (
    <footer id="tentang-kami" className="bg-art-text text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20 text-left">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center -rotate-6 shadow-[4px_4px_0px_0px_#ff6b00] border-2 border-art-text overflow-hidden">
                <img src={hp?.logo || "https://files.catbox.moe/lubzno.png"} alt="Logo" className="w-full h-full object-contain p-1" />
              </div>
              <h2 className="text-lg font-black leading-none tracking-tighter uppercase">Ngopi Di<br/><span className="text-art-orange">Ketinggian</span></h2>
            </div>
            <p className="text-sm text-white/60 leading-relaxed font-medium mb-8 pr-4">
              {hp?.footerDesc || "Penyedia layanan pendakian premium yang mengutamakan kenyamanan, keamanan, dan pengalaman seduhan kopi original di puncak gunung."}
            </p>
            <div className="flex gap-3 flex-wrap">
              {socialLinks.map((social: any, idx: number) => (
                <a key={idx} href={social.url} target={social.url !== '#' ? '_blank' : '_self'} rel="noopener noreferrer" className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-art-orange hover:border-art-orange transition-all shadow-sm">
                  {social.icon === 'instagram' && <Instagram size={18} />}
                  {social.icon === 'whatsapp' && <MessageCircle size={18} />}
                  {social.icon === 'telegram' && <Send size={18} />}
                  {social.icon === 'facebook' && <Facebook size={18} />}
                  {social.icon === 'youtube' && <Youtube size={18} />}
                  {!['instagram', 'whatsapp', 'telegram', 'facebook', 'youtube'].includes(social.icon) && <Globe size={18} />}
                </a>
              ))}
            </div>
          </div>

          <div className="col-span-1">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-art-orange">Menu Utama</h4>
            <ul className="space-y-4">
              {[
                { name: 'Home', link: '#' },
                { name: 'Story', link: '#cerita' },
                { name: 'Fasilitas Trip', link: '#trip' },
                { name: 'Open Trip', link: '#trips' },
                { name: 'Private Trip', link: '#destinasi-private' },
                { name: 'About Us', link: '#tentang-kami' }
              ].map((item) => (
                <li key={item.name}>
                  <a href={item.link} className="text-sm font-bold text-white/50 hover:text-white transition-colors flex items-center gap-2 group">
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-art-orange">Informasi Kontak</h4>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-art-orange shrink-0 border border-white/5">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-white/40 mb-1">Office</p>
                  <a href={hp?.officeMaps || "#"} target="_blank" rel="noopener noreferrer" className="text-sm font-bold hover:text-art-orange transition-colors">
                    {hp?.officeAddress || "Gunung Gede Pangrango, Jawa Barat, Indonesia"}
                  </a>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-art-orange shrink-0 border border-white/5">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-white/40 mb-1">Email Support</p>
                  <a href={`mailto:${hp?.officeEmail || 'hello@ngopidiketinggian.com'}`} className="text-sm font-bold hover:text-art-orange transition-colors">
                    {hp?.officeEmail || "hello@ngopidiketinggian.com"}
                  </a>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-art-orange shrink-0 border border-white/5">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-white/40 mb-1">WhatsApp</p>
                  <a href={`https://wa.me/${hp?.officePhone || ''}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold hover:text-art-orange transition-colors">
                    +{hp?.officePhone || "628123456789"}
                  </a>
                </div>
              </li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-art-orange">Metode Pembayaran</h4>
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
              <p className="text-[10px] font-medium text-white/40 leading-relaxed italic mb-4">
                Kami mendukung berbagai metode pembayaran otomatis demi kemudahan transaksi Anda.
              </p>
              <div className="flex gap-2 flex-wrap opacity-50">
                {(hp?.paymentMethods || [
                  { name: 'BCA', active: true },
                  { name: 'BNI', active: true },
                  { name: 'MANDIRI', active: true },
                  { name: 'GOPAY', active: true },
                  { name: 'DANA', active: true },
                  { name: 'QRIS', active: true }
                ]).filter((p: any) => p.active).map((p: any) => (
                  <div key={p.name} className="px-3 py-1 bg-white rounded-lg font-black text-art-text text-[8px] uppercase tracking-tighter">{p.name}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">
            © {new Date().getFullYear()} NGOPI DI KETINGGIAN. ALL RIGHTS RESERVED.
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
