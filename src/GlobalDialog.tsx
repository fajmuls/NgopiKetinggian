import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type DialogOptions = {
  title?: string;
  message: string;
  type?: 'alert' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

let showDialogCb: (options: DialogOptions) => void;

export const customAlert = (message: string, title?: string) => {
  if (showDialogCb) {
    showDialogCb({ message, title, type: 'alert', confirmText: 'OK' });
  } else {
    window.alert(message);
  }
};

export const customConfirm = (message: string, onConfirm: () => void, title?: string) => {
  if (showDialogCb) {
    showDialogCb({ message, title, type: 'confirm', confirmText: 'Ya', cancelText: 'Batal', onConfirm });
  } else {
    if (window.confirm(message)) onConfirm();
  }
};

export const GlobalDialogProvider = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions | null>(null);

  useEffect(() => {
    showDialogCb = (opts: DialogOptions) => {
      setOptions(opts);
      setIsOpen(true);
    };
  }, []);

  if (!isOpen || !options) return null;

  const handleConfirm = () => {
    if (options.onConfirm) options.onConfirm();
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (options.onCancel) options.onCancel();
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white max-w-sm w-full rounded-2xl border-2 border-art-text p-6 shadow-2xl flex flex-col gap-4 text-art-text"
      >
        {options.title && <h3 className="font-bold text-lg uppercase tracking-tight">{options.title}</h3>}
        <p className="text-sm">{options.message}</p>
        <div className="flex gap-2 justify-end mt-2">
          {options.type === 'confirm' && (
            <button 
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded hover:bg-gray-200 transition-colors"
            >
              {options.cancelText || 'Batal'}
            </button>
          )}
          <button 
            onClick={handleConfirm}
            className="px-4 py-2 bg-art-text text-white text-xs font-bold uppercase rounded hover:bg-art-orange transition-colors"
          >
            {options.confirmText || 'OK'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
