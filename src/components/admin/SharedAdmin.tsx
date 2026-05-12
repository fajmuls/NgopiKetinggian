import React from 'react';
import { Clipboard } from 'lucide-react';

export const InputWithPaste = ({ value, onChange, placeholder, className, ...props }: any) => {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange({ target: { value: text } } as any);
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  return (
    <div className="relative w-full flex items-center">
      <input 
        type="text" 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder} 
        className={`${className} pr-8`}
        {...props}
      />
      <button 
        type="button"
        onClick={handlePaste}
        className="absolute right-1 p-1.5 text-art-text/40 hover:text-art-orange transition-colors"
        title="Paste"
      >
        <Clipboard size={12} />
      </button>
    </div>
  );
};

export const ImageUploader = ({ value, onChange, placeholder = "URL Gambar" }: { value: string, onChange: (url: string) => void, placeholder?: string }) => {
  return (
    <div className="space-y-1 p-2 rounded-lg bg-art-bg/30 border border-art-text/10">
      <div className="flex items-center gap-2">
      	<InputWithPaste 
          className="border border-art-text/20 p-2 rounded text-[10px] w-full text-art-text bg-white outline-none focus:border-art-orange transition-colors" 
          value={value || ''} 
          onChange={(e: any) => onChange(e.target.value)} 
          placeholder={placeholder || "Masukkan Link URL Foto"} 
        />
      </div>
      {value ? (
        <div className="mt-2">
           <img src={value} className="w-full h-20 object-cover rounded border border-art-text/10" alt="Preview" onError={(e) => (e.currentTarget.style.display = 'none')} />
           <p className="text-[8px] text-art-green font-bold uppercase truncate mt-1">Preview Tersedia</p>
        </div>
      ) : (
        <p className="text-[8px] text-art-text/30 font-bold uppercase truncate">Belum ada gambar</p>
      )}
    </div>
  );
};
