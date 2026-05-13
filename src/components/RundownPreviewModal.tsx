import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Coffee, Mountain, Users, MessageCircle, AlertCircle, ShoppingBag, Eye, Download, FileText, Globe, CheckCircle, Smartphone, LogOut, Clock } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { generateRundownPdf, generateInvoice } from '../lib/pdf-utils';
import { customConfirm, customAlert } from '../GlobalDialog';
import { useSound } from '../hooks/useSound';
import { Button } from './Button';


export const RundownPreviewModal = ({ isOpen, onClose, rundownText, title }: { isOpen: boolean, onClose: () => void, rundownText: string, title: string }) => {
  const parsedItems = useMemo(() => {
    if (!rundownText || rundownText === "Tanpa Rundown" || rundownText === "Itinerary belum tersedia.") return [];
    
    const lines = rundownText.split('\n');
    const days: { day: number, items: { time: string, activity: string }[] }[] = [];
    let currentDay: { day: number, items: { time: string, activity: string }[] } | null = null;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      const dayMatch = trimmed.match(/HARI\s+(\d+)/i) || trimmed.match(/DAY\s+(\d+)/i);
      if (dayMatch) {
        currentDay = { day: parseInt(dayMatch[1]), items: [] };
        days.push(currentDay);
      } else if (currentDay) {
        const timeMatch = trimmed.match(/^(\d{1,2}[:.]\d{2})\s*[-:]?\s*(.*)/);
        if (timeMatch) {
          currentDay.items.push({ time: timeMatch[1].replace('.', ':'), activity: timeMatch[2] });
        } else {
          currentDay.items.push({ time: '', activity: trimmed });
        }
      } else {
        // If no day header yet, create Day 1
        currentDay = { day: 1, items: [] };
        days.push(currentDay);
        const timeMatch = trimmed.match(/^(\d{1,2}[:.]\d{2})\s*[-:]?\s*(.*)/);
        if (timeMatch) {
          currentDay.items.push({ time: timeMatch[1].replace('.', ':'), activity: timeMatch[2] });
        } else {
          currentDay.items.push({ time: '', activity: trimmed });
        }
      }
    });
    return days;
  }, [rundownText]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-left">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-xl rounded-3xl border-4 border-art-text overflow-hidden flex flex-col max-h-[85vh] shadow-[16px_16px_0px_0px_rgba(26,26,26,1)]">
        <div className="p-6 bg-art-text text-white flex justify-between items-center">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Clock size={18} className="text-art-orange" /> Itinerary: {title}</h3>
            <button onClick={onClose} className="p-2 hover:text-art-orange transition-colors"><X size={20} /></button>
        </div>
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-[#FAFAFA] no-scrollbar">
            {parsedItems.length > 0 ? (
              <div className="space-y-8">
                {parsedItems.map((day) => (
                  <div key={day.day} className="relative">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] bg-art-orange text-white px-3 py-1 rounded-full w-fit mb-6 border-2 border-art-text shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]">HARI {day.day}</h4>
                    <div className="space-y-4 pl-4 border-l-2 border-dashed border-art-text/10">
                      {day.items.map((item, idx) => (
                        <div key={idx} className="relative flex items-start gap-4">
                          <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-art-text ring-4 ring-white" />
                          <div className="w-14 sm:w-16 shrink-0 text-[10px] font-mono font-black text-art-orange">{item.time || '--:--'}</div>
                          <div className="flex-1 text-[11px] font-bold text-art-text leading-relaxed">{item.activity}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-[11px] font-medium text-art-text/80 leading-relaxed font-mono bg-white p-6 rounded-2xl border-2 border-art-text/5 shadow-inner">
                 {rundownText || "Itinerary belum tersedia."}
              </div>
            )}
            
            <div className="mt-8 pt-8 border-t border-dashed border-art-text/10 text-center">
               <p className="text-[10px] font-black uppercase text-art-text/20 tracking-[0.3em]">Ngopi Di Ketinggian • Adventure & Brew</p>
            </div>
        </div>
      </motion.div>
    </div>
  );
};
