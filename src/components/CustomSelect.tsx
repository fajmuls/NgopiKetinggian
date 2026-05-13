import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export const CustomSelect = ({ value, onChange, options, placeholder, disabled, required, className, name }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Hidden select for actual form submission and validation if part of a form */}
      <select 
        name={name} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        required={required} 
        className="hidden"
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <div 
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full border-2 border-art-text bg-white px-3 py-3 rounded-xl text-[10px] font-black uppercase text-art-text flex items-center justify-between cursor-pointer transition-colors shadow-sm ${disabled ? 'bg-gray-200/50 cursor-not-allowed opacity-60' : 'hover:border-art-orange'} ${isOpen ? 'border-art-orange text-art-orange' : ''}`}
      >
        <span className={!value ? 'text-art-text/40' : ''}>
          {value ? options.find((o: any) => o.value === value)?.label || value : placeholder}
        </span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-art-text rounded-xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
          {options.map((opt: any) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`px-3 py-3 text-[10px] font-black uppercase cursor-pointer hover:bg-art-bg transition-colors ${value === opt.value ? 'bg-art-orange/10 text-art-orange' : 'text-art-text'}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
