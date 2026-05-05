import { useCallback, useEffect, useState } from 'react';

// Help prevent double-triggering within a very short timeframe
let lastPlayTime = 0;
const debouncePlay = (fn: () => void) => {
  const now = Date.now();
  if (now - lastPlayTime < 50) return; // ignore if played within 50ms
  lastPlayTime = now;
  fn();
};

export const useSound = () => {
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('appVolume');
    return saved ? parseFloat(saved) : 1.0;
  });

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('appVolume');
      if (saved) setVolume(parseFloat(saved));
    };
    window.addEventListener('volumeChange', handleStorage);
    return () => window.removeEventListener('volumeChange', handleStorage);
  }, []);

  const initCtx = () => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return null;
    return new AudioContext();
  };

  const playClick = useCallback(() => debouncePlay(() => {
    try {
      const ctx = initCtx();
      if (!ctx || volume <= 0) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(3.0 * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  }), [volume]);

  const playPop = useCallback(() => debouncePlay(() => {
    try {
      const ctx = initCtx();
      if (!ctx || volume <= 0) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(2.0 * volume, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  }), [volume]);

  const playBack = useCallback(() => debouncePlay(() => {
    try {
      const ctx = initCtx();
      if (!ctx || volume <= 0) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(1.5 * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  }), [volume]);

  const playHover = useCallback(() => {
    try {
      const ctx = initCtx();
      if (!ctx || volume <= 0) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(350, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3 * volume, ctx.currentTime + 0.04);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }, [volume]);

  const playSuccess = useCallback(() => debouncePlay(() => {
    try {
      const ctx = initCtx();
      if (!ctx || volume <= 0) return;
      
      // First note
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      gain1.gain.setValueAtTime(0.0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(1.5 * volume, ctx.currentTime + 0.05);
      gain1.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.15);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);

      // Second note
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      gain2.gain.setValueAtTime(0.0, ctx.currentTime + 0.1);
      gain2.gain.linearRampToValueAtTime(1.5 * volume, ctx.currentTime + 0.15);
      gain2.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.5);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.5);
      
    } catch (e) {}
  }), [volume]);

  return { playClick, playHover, playSuccess, playPop, playBack };
};

