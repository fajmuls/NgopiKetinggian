const fs = require('fs');
let code = fs.readFileSync('src/admin/WebSettingsAdmin.tsx', 'utf8');

const replacement = `export const PromoCodesAdmin = ({ config, updateConfig, showToast }: any) => {
  const [data, setData] = useState(config.promoCodes || []);
  useEffect(() => {
    setData(config.promoCodes || []);
  }, [config.promoCodes]);
  const handleSave = () => { updateConfig({ promoCodes: data }); showToast('Tersimpan!'); };
  return (
    <div className="space-y-6 text-left">
      <div className="bg-gradient-to-br from-orange-50 to-white border-2 border-art-text rounded-3xl p-6 shadow-[8px_8px_0px_0px_#1a1a1a]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-art-orange text-white rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#1a1a1a]">
               <CreditCard size={20} className="drop-shadow-sm" />
             </div>
             <div>
               <h3 className="text-lg font-black uppercase text-art-text tracking-tight leading-tight">Manajemen Kode Promo</h3>
               <p className="text-[10px] font-bold text-art-text/40 uppercase">Atur kode promo untuk diskon booking</p>
             </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <button type="button" onClick={(e) => {
               e.preventDefault();
               const nd = [{ code: "BARU", discount: 10 }, ...data];
               setData(nd);
             }} className="flex-1 sm:flex-none bg-art-text text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all">+ Kode Promo</button>
             <button onClick={handleSave} className="flex-1 sm:flex-none bg-art-orange text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all">Simpan</button>
          </div>
        </div>
      
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((promo: any, i: number) => (
            <div key={i} className="bg-white p-4 rounded-xl border-2 border-art-text/20 flex flex-col gap-3 relative shadow-sm hover:border-art-orange/30 transition-all">
              <button onClick={() => {
                const nd = [...data]; nd.splice(i, 1); setData(nd);
              }} className="absolute top-3 right-3 text-red-400 p-1 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
              
              <div className="pr-8 space-y-1">
                 <label className="text-[9px] font-black uppercase text-art-text/40">Kode Promo</label>
                 <input className="w-full border-b-2 border-art-text/10 p-1 text-sm font-black text-art-orange outline-none focus:border-art-orange uppercase tracking-widest bg-transparent" value={promo.code} onChange={e => {
                    const nd = [...data]; nd[i].code = e.target.value; setData(nd);
                 }} placeholder="KODEPROMO" />
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-art-text/40">Diskon (%)</label>
                 <div className="flex items-center gap-2">
                   <input type="number" min="0" max="100" className="w-full border-b-2 border-art-text/10 p-1 text-xs font-bold outline-none focus:border-art-orange font-mono bg-transparent" value={promo.discount} onChange={e => {
                      const nd = [...data]; nd[i].discount = parseInt(e.target.value) || 0; setData(nd);
                   }} placeholder="Cth: 10" />
                   <span className="font-black text-sm text-art-text/50">%</span>
                 </div>
              </div>
            </div>
          ))}
          {data.length === 0 && (
             <div className="col-span-full py-12 text-center border-2 border-dashed border-art-text/10 rounded-2xl bg-gray-50/50">
                <p className="text-[10px] font-bold text-art-text/20 uppercase tracking-widest">Belum ada kode promo aktif</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};`;

const targetStart = "export const PromoCodesAdmin = ({ config, updateConfig, showToast }: any) => {";
const startIndex = code.indexOf(targetStart);

if (startIndex > -1) {
    code = code.substring(0, startIndex) + replacement;
    fs.writeFileSync('src/admin/WebSettingsAdmin.tsx', code);
    console.log("Replaced successfully");
} else {
    console.log("Could not find start index");
}
