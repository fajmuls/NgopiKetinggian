import React from 'react';
import { useSound } from '../hooks/useSound';

export function Button({ children, className = '', variant = 'primary', onClick, ...props }: any) {
  const { playClick, playHover } = useSound();
  
  const baseStyle = "px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-2 transform active:scale-95";
  const variants = {
    primary: "bg-art-text hover:bg-art-green text-white shadow-sm border border-transparent",
    secondary: "bg-white hover:bg-art-section text-art-text border border-art-text/20",
    glass: "bg-white/90 hover:bg-white text-art-text border border-transparent"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}
      onClick={(e) => {
        playClick();
        if(onClick) onClick(e);
      }}
      onMouseEnter={playHover}
      {...props}
    >
      {children}
    </button>
  );
}

