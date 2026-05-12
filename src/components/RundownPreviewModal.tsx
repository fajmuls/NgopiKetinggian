import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Coffee, Mountain, Users, MessageCircle, AlertCircle, ShoppingBag, Eye, Download, FileText, Globe, CheckCircle, Smartphone, LogOut } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { generateRundownPdf, generateInvoice } from '../lib/pdf-utils';
import { customConfirm, customAlert } from '../GlobalDialog';
import { useSound } from '../hooks/useSound';
import { Button } from './Button';


export const RundownPreviewModal = ({ isOpen, onClose, rundownText, title }: { isOpen: boolean, onClose: () => void, rundownText: string, title: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-left">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white w-full max-w-xl rounded-3xl border-4 border-art-text overflow-hidden flex flex-col max-h-[85vh] shadow-[16px_16px_0px_0px_rgba(26,26,26,1)]">
        <div className="p-6 bg-art-text text-white flex justify-between items-center">
            <h3 className="text-sm font-black uppercase tracking-widest">Itinerary: {title}</h3>
            <button onClick={onClose} className="p-2 hover:text-art-orange transition-colors"><X size={20} /></button>
        </div>
        <div className="p-8 overflow-y-auto flex-1 bg-[#FAFAFA]">
            <div className="whitespace-pre-wrap text-[11px] font-medium text-art-text/80 leading-relaxed font-mono bg-white p-6 rounded-2xl border-2 border-art-text/5 shadow-inner">
               {rundownText}
            </div>
            <div className="mt-8 text-center">
               <p className="text-[10px] font-black uppercase text-art-text/20 tracking-[0.3em]">Ngopi Di Ketinggian • Adventure & Brew</p>
            </div>
        </div>
      </motion.div>
    </div>
  );
};
