import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, MapPin, GripVertical, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RundownItem {
  id: string;
  time: string;
  activity: string;
  day: number;
}

interface RundownEditorProps {
  value: string;
  onChange: (value: string) => void;
  title?: string;
}

export const RundownEditor = ({ value, onChange, title = "Editor Rundown" }: RundownEditorProps) => {
  const [items, setItems] = useState<RundownItem[]>([]);

  // Parse string to items
  useEffect(() => {
    if (!value) {
      setItems([{ id: '1', time: '08:00', activity: 'Tiba di Meeting Point', day: 1 }]);
      return;
    }

    // Attempt to parse if it's structured, or just convert text lines to items
    const lines = value.split('\n');
    const newItems: RundownItem[] = [];
    let currentDay = 1;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.toLowerCase().startsWith('hari') || trimmed.toLowerCase().startsWith('day')) {
        const dayMatch = trimmed.match(/\d+/);
        if (dayMatch) currentDay = parseInt(dayMatch[0]);
        return;
      }

      // Check if it has time format like "08:00 - activity" or "08:00 : activity" or "08:00 activity"
      const timeMatch = trimmed.match(/^(\d{1,2}[:.]\d{2})\s*[-:]?\s*(.*)/);
      if (timeMatch) {
        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          time: timeMatch[1].replace('.', ':'),
          activity: timeMatch[2],
          day: currentDay
        });
      } else {
        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          time: '',
          activity: trimmed,
          day: currentDay
        });
      }
    });

    if (newItems.length === 0) {
      setItems([{ id: '1', time: '08:00', activity: 'Tiba di Meeting Point', day: 1 }]);
    } else {
      setItems(newItems);
    }
  }, []);

  const save = (updatedItems: RundownItem[]) => {
    setItems(updatedItems);
    
    // Convert items back to string
    let result = '';
    let lastDay = 0;
    
    updatedItems.sort((a, b) => a.day - b.day).forEach(item => {
      if (item.day !== lastDay) {
        if (lastDay !== 0) result += '\n';
        result += `HARI ${item.day}\n`;
        lastDay = item.day;
      }
      result += `${item.time} - ${item.activity}\n`;
    });
    
    onChange(result.trim());
  };

  const addItem = (day: number) => {
    const newItems = [...items, { id: Math.random().toString(36).substr(2, 9), time: '00:00', activity: '', day }];
    save(newItems);
  };

  const removeItem = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    save(newItems);
  };

  const updateItem = (id: string, field: keyof RundownItem, val: any) => {
    const newItems = items.map(item => item.id === id ? { ...item, [field]: val } : item);
    save(newItems);
  };

  const days = Array.from(new Set(items.map(i => i.day))).sort((a, b) => a - b);
  if (days.length === 0) days.push(1);

  return (
    <div className="space-y-4 bg-white border-2 border-art-text rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-art-text text-white p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Clock size={16} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</span>
        </div>
        <button 
          type="button"
          onClick={() => {
            const nextDay = Math.max(...items.map(i => i.day), 0) + 1;
            addItem(nextDay);
          }}
          className="bg-art-orange text-white px-3 py-1 rounded text-[8px] font-black uppercase hover:bg-white hover:text-art-orange transition-all border border-transparent hover:border-art-orange shadow-sm"
        >
          + Tambah Hari
        </button>
      </div>

      <div className="p-4 space-y-6 max-h-[400px] overflow-y-auto no-scrollbar">
        {days.map(day => (
          <div key={day} className="space-y-3 relative pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-art-bg text-art-text px-3 py-1 rounded-full text-[10px] font-black border-2 border-art-text shadow-[2px_2px_0px_0px_#1a1a1a]">
                HARI {day}
              </div>
              <div className="h-[2px] flex-1 bg-art-text/5"></div>
              <button 
                type="button"
                onClick={() => addItem(day)}
                className="text-art-orange hover:text-orange-600 p-1 transition-colors"
                title="Tambah Kegiatan"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="space-y-2 pl-2">
              {items.filter(i => i.day === day).map((item) => (
                <div key={item.id} className="flex gap-2 items-center group">
                  <div className="w-16 shrink-0 relative">
                    <input 
                      type="text"
                      className="w-full border-2 border-art-text/10 p-1.5 rounded-lg text-[10px] font-bold outline-none focus:border-art-orange bg-art-bg/20 font-mono"
                      value={item.time}
                      placeholder="00:00"
                      onChange={(e) => updateItem(item.id, 'time', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="text"
                      className="w-full border-2 border-art-text/10 p-1.5 rounded-lg text-[10px] font-medium outline-none focus:border-art-orange"
                      value={item.activity}
                      placeholder="Contoh: Briefing & Start Trekking"
                      onChange={(e) => updateItem(item.id, 'activity', e.target.value)}
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-8 text-art-text/20 uppercase font-black text-[10px] tracking-widest">
            Belum ada jadwal. Klik tombol di atas untuk menambah.
          </div>
        )}
      </div>

      <div className="bg-art-bg/30 p-2 border-t border-art-text/5">
        <p className="text-[8px] text-art-text/30 font-bold uppercase italic text-center">
          Format otomatis: Waktu - Kegiatan • Dipisahkan per Hari
        </p>
      </div>
    </div>
  );
};
