import React from 'react';
import { Coffee, MapPin, MessageCircle, Instagram, Send, Globe, ChevronRight, Phone, Mail, Youtube, Facebook, Map } from 'lucide-react';

export const Footer = ({ config }: any) => {
  const hp = config?.homepage;
  const socialLinks = hp?.socialLinks || [
    { icon: 'instagram', url: '#' },
    { icon: 'whatsapp', url: '#' },
    { icon: 'telegram', url: '#' }
  ];

  const whatsappContacts = hp?.whatsappContacts || [{name: 'Admin', phone: hp?.officePhone || "628123456789"}];
  const uniqueWhatsapp = whatsappContacts.filter((wa: any, index: number, self: any[]) =>
    index === self.findIndex((t) => (t.phone || '').replace(/\D/g, '') === (wa.phone || '').replace(/\D/g, ''))
  );

  const igLink = socialLinks.find((s: any) => s.icon === 'instagram');

  return (
    <footer id="tentang-kami" className="bg-art-text text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-12 mb-20 text-left">
          
          {/* 1. Tentang Kami */}
          <div className="col-span-1 lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center -rotate-6 shadow-[4px_4px_0px_0px_#ff6b00] border-2 border-art-text overflow-hidden">
                <img src={hp?.logo || "https://files.catbox.moe/lubzno.png"} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-lg font-black leading-none tracking-tighter uppercase">Ngopi Di<br/><span className="text-art-orange">Ketinggian</span></h2>
            </div>
            <p className="text-sm text-white/60 leading-relaxed font-medium mb-8">
              {hp?.footerDesc || "Penyedia layanan pendakian premium yang mengutamakan kenyamanan, keamanan, dan pengalaman seduhan kopi original di puncak gunung."}
            </p>
          </div>

          {/* 2. Menu Utama */}
          <div className="col-span-1 lg:col-span-1">
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

          {/* 3. Lokasi */}
          <div className="col-span-1 lg:col-span-1">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-art-orange">Lokasi</h4>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-art-orange shrink-0 border border-white/5">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-white/40 mb-1">Office</p>
                <a href={hp?.officeMaps || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hp?.officeAddress || "Gunung Gede Pangrango, Jawa Barat, Indonesia")}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold leading-tight hover:text-art-orange transition-colors block">
                  {hp?.officeAddress || "Gunung Gede Pangrango, Jawa Barat, Indonesia"}
                </a>
                <div className="mt-4">
                  <a href={hp?.officeMaps || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hp?.officeAddress || "Gunung Gede Pangrango, Jawa Barat, Indonesia")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-art-orange hover:text-white transition-colors bg-art-orange/10 px-3 py-2 rounded-lg">
                     <Map size={14} /> Lihat Peta
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Kontak & Sosial Media */}
          <div className="col-span-1 lg:col-span-1">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-art-orange">Kontak & Sosial</h4>
            <ul className="space-y-4">
              {/* Email */}
              <li className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-art-orange shrink-0 border border-white/5">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-white/40 mb-0.5">Email Support</p>
                  <a href={`mailto:${hp?.officeEmail || 'hello@ngopidiketinggian.com'}`} className="text-sm font-bold hover:text-art-orange transition-colors break-all">
                    {hp?.officeEmail || "hello@ngopidiketinggian.com"}
                  </a>
                </div>
              </li>
              
              {/* Instagram */}
              {igLink && (
              <li className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-art-orange shrink-0 border border-white/5">
                  <Instagram size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-white/40 mb-0.5">Instagram</p>
                  <a href={igLink.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold hover:text-art-orange transition-colors">
                    @ngopidiketinggian
                  </a>
                </div>
              </li>
              )}

              {/* WhatsApp (Consolidated) */}
              <li className="flex gap-4 items-start pt-2">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-art-orange shrink-0 border border-white/5">
                  <Phone size={18} />
                </div>
                <div className="w-full">
                  <p className="text-[10px] font-black uppercase text-white/40 mb-2">Telepon / WhatsApp</p>
                  <div className="flex flex-col gap-2">
                    {uniqueWhatsapp.map((wa: any, i: number) => (
                      <a key={i} href={`https://wa.me/${wa.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between text-sm font-bold bg-white/5 p-2 px-3 rounded-lg hover:bg-art-orange/10 hover:border-art-orange/50 border border-transparent transition-all w-full">
                        <span className="group-hover:text-art-orange transition-colors">{wa.name || 'Admin'}</span>
                        <ChevronRight size={14} className="text-white/20 group-hover:text-art-orange transform group-hover:translate-x-1 transition-all" />
                      </a>
                    ))}
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* 5. Metode Pembayaran */}
          <div className="col-span-1 lg:col-span-1">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-art-orange">Pembayaran</h4>
            <div className="p-5 bg-white/5 border border-white/10 rounded-3xl">
              <p className="text-[10px] font-medium text-white/40 leading-relaxed italic mb-4">
                Kami mendukung berbagai metode pembayaran otomatis demi kemudahan transaksi Anda.
              </p>
              <div className="flex gap-2 flex-wrap opacity-60">
                {(hp?.paymentMethods || [
                  { name: 'BCA', active: true },
                  { name: 'BNI', active: true },
                  { name: 'MANDIRI', active: true },
                  { name: 'GOPAY', active: true },
                  { name: 'DANA', active: true },
                  { name: 'QRIS', active: true }
                ]).filter((p: any) => p.active).map((p: any) => (
                  <div key={p.name} className="px-3 py-1 bg-white rounded-lg font-black text-art-text text-[9px] uppercase tracking-tighter">{p.name}</div>
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
