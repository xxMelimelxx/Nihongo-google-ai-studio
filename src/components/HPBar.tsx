import React from 'react';
import { motion } from 'framer-motion';

interface HPBarProps {
  current: number;
  max: number;
  colorClass?: string;
  isMonster?: boolean;
}

export const HPBar: React.FC<HPBarProps> = ({ current, max, colorClass, isMonster = false }) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-1">
        <span className="font-bold text-[10px] uppercase tracking-widest title-text opacity-70">
          HP {isMonster ? 'DO MONSTRO' : 'ATUAL'}
        </span>
        <span className="font-mono text-sm font-bold">
          {Math.ceil(current)} / {max}
        </span>
      </div>
      <div className="relative h-4 bg-ink-dark/10 border-2 border-ink-dark/40 overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
        {/* Ghost bar lagging behind */}
        <motion.div 
          className="absolute inset-0 bg-ink-red/30"
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        {/* Main HP bar */}
        <motion.div 
          className={`absolute inset-0 h-full transition-colors duration-500 shadow-[0_0_10px_rgba(0,0,0,0.2)] ${colorClass || (percentage < 30 ? 'bg-ink-red' : 'bg-ink-dark')}`}
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        {/* Sheen detail */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

export default HPBar;
