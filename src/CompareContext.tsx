import React, { createContext, useContext, useState, ReactNode } from 'react';
import { customAlert } from './GlobalDialog';

interface CompareItem {
  id: string;
  name: string;
  image: string;
  price: number;
  difficulty: string;
  region: string;
  duration?: string;
  type: 'open' | 'private';
}

interface CompareContextType {
  selectedItems: CompareItem[];
  toggleItem: (item: CompareItem) => void;
  clearItems: () => void;
  isComparing: boolean;
  setIsComparing: (val: boolean) => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [selectedItems, setSelectedItems] = useState<CompareItem[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  const toggleItem = (item: CompareItem) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      }
      if (prev.length >= 3) {
        customAlert("Maksimal bandingkan 3 trip sekaligus.");
        return prev;
      }
      return [...prev, item];
    });
  };

  const clearItems = () => setSelectedItems([]);

  return (
    <CompareContext.Provider value={{ selectedItems, toggleItem, clearItems, isComparing, setIsComparing }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) throw new Error("useCompare must be used within a CompareProvider");
  return context;
};
