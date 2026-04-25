import { useState, useMemo } from 'react';
import { Spell, ElementType } from '../types';
import { ELEMENTS_INFO, STATUS_NAMES_PT } from '../constants';
import { VOCABULARY } from '../vocabulary';
import { motion } from 'motion/react';

interface SpellbookProps {
  level: number;
  unlockedCount: number;
  spellCooldowns: Record<string, number>;
  onClose: () => void;
}

export default function Spellbook({ level, unlockedCount, spellCooldowns, onClose }: SpellbookProps) {
  const [expandedSealed, setExpandedSealed] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    const g: Record<string, Spell[]> = {};
    VOCABULARY.forEach(v => {
      if (!g[v.element]) g[v.element] = [];
      g[v.element].push(v);
    });
    return g;
  }, []);

  // Balance columns based on spell counts to avoid extreme visual unevenness
  const { leftKeys, rightKeys } = useMemo(() => {
    const keys = Object.keys(ELEMENTS_INFO);
    const left: string[] = [];
    const right: string[] = [];
    let leftCount = 0;
    let rightCount = 0;

    keys.forEach(key => {
      const count = grouped[key]?.length || 0;
      if (leftCount <= rightCount) {
        left.push(key);
        leftCount += count;
      } else {
        right.push(key);
        rightCount += count;
      }
    });

    return { leftKeys: left, rightKeys: right };
  }, [grouped]);


  const getEffectDesc = (vocab: Spell) => {
    if (!vocab.effect) return null;
    
    let chanceStr = vocab.effectChance && vocab.effectChance < 1.0 ? `${Math.round(vocab.effectChance * 100)}% de chance: ` : 'Efeito garantido: ';
    if (vocab.type === 'utility') chanceStr = 'Efeito: ';

    const mapDesc: Record<string, string> = {
      'burn': 'Queimar (Dano Contínuo)', 'bleed': 'Sangrar (Dano Contínuo)', 'freeze': 'Congelar (Perde o turno)',
      'paralyze': 'Paralisar (Perde o turno)', 'weaken': 'Enfraquecer (-Ataque)',
      'shield': 'Proteger (Dano recebido -50%)', 'regen': 'Regenerar (Cura por turno)', 'blind': 'Cegar (Erra ataques)',
      'poison': 'Envenenar (Dano Contínuo)', 'hint': 'Sugere um feitiço pronto', 'cleanse': 'Remove maldições',
      'reduce_cd': 'Reduz todos Cooldowns em -2', 'force_bonus': 'Revela Ponto Fraco (!)'
    };
    const durationStr = vocab.effectDuration ? ` (${vocab.effectDuration}t)` : '';
    return (
      <div className="text-xs md:text-sm mt-3 text-ink-dark font-black italic leading-tight border-t border-ink-dark/10 pt-2">
        ✧ {chanceStr}{mapDesc[vocab.effect] || vocab.effect}{durationStr}
      </div>
    );
  };

  const toggleSealed = (category: string) => {
    setExpandedSealed(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const renderCategory = (key: string) => {
    const info = ELEMENTS_INFO[key as ElementType];
    const spells = grouped[key];
    if (!spells) return null;

    const unlockedSpells = spells.filter(s => level >= s.unlockLevel);
    const sealedSpells = spells.filter(s => level < s.unlockLevel);

    return (
      <div key={key} className="break-inside-avoid flex flex-col mb-12">
         <div className="flex items-center gap-3 border-b-2 border-ink-dark/40 pb-2 mb-4">
           <span className="text-2xl grayscale">{info.icon}</span>
           <span className="title-text text-xl tracking-[4px] uppercase font-bold text-ink-dark/80">{info.name}</span>
         </div>
         
         <div className="flex flex-col gap-6">
           {unlockedSpells.map((vocab) => {
             const currentCooldown = spellCooldowns[vocab.pt] || 0;
             
             return (
               <div key={vocab.pt} className="flex flex-col border-b border-ink-dark/10 pb-3">
                 <div className="flex justify-between items-end mb-1">
                   <span className="title-text text-lg font-bold uppercase">{vocab.pt}</span>
                   {currentCooldown > 0 && <span className="text-xs border border-ink-dark/30 px-2 py-0.5 text-ink-dark/80">Recarga: {currentCooldown}t</span>}
                 </div>
                 <div className="flex justify-between items-baseline mt-1">
                   <div className="flex gap-3 items-baseline">
                     <span className="jp-text text-2xl font-bold">{vocab.kana}</span>
                     <span className="jp-text text-sm text-ink-dark/60">{vocab.kanji}</span>
                   </div>
                   <span className="title-text text-sm tracking-widest opacity-70">{vocab.romaji}</span>
                 </div>
                 {getEffectDesc(vocab)}
               </div>
             );
           })}

           {sealedSpells.length > 0 && (
             <div className="mt-2 flex flex-col gap-2">
               <button 
                 onClick={() => toggleSealed(key)}
                 className="w-full text-center py-2 border border-ink-dark/20 text-ink-dark/60 text-xs font-bold uppercase tracking-widest hover:bg-ink-dark/5 transition-colors title-text"
               >
                 {expandedSealed[key] ? 'Ocultar feitiços selados' : `Mostrar feitiços selados (${sealedSpells.length} restantes)`}
               </button>
               
               {expandedSealed[key] && (
                 <div className="flex flex-col gap-2 opacity-50 mt-2">
                   {sealedSpells.map(vocab => (
                     <div key={vocab.pt} className="flex justify-between items-center py-2 border-b border-ink-dark/5">
                       <span className="title-text font-bold text-base md:text-lg">??? (Selado)</span>
                       <span className="text-xs uppercase title-text">Nv {vocab.unlockLevel}</span>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           )}
         </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]/95 flex flex-col items-center justify-center z-[100] p-2 md:p-6 backdrop-blur-lg overflow-hidden" style={{ perspective: '2000px' }}>
      
      {/* Background Magic Particles */}
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={`spark-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: Math.random() * 4 + 1 + 'px',
            height: Math.random() * 4 + 1 + 'px',
            backgroundColor: ['#fef08a', '#e9d5ff', '#a78bfa', '#60a5fa'][Math.floor(Math.random() * 4)],
            left: Math.random() * 100 + 'vw',
            top: Math.random() * 100 + 'vh',
            boxShadow: '0 0 10px currentColor',
          }}
          initial={{ opacity: 0, y: 0, scale: 0 }}
          animate={{ 
            opacity: [0, Math.random() * 0.8 + 0.2, 0], 
            y: -Math.random() * 150 - 50,
            x: Math.random() * 100 - 50,
            scale: [0, 1, 0]
          }}
          transition={{
            duration: Math.random() * 4 + 3,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "linear"
          }}
        />
      ))}

      {/* Glowing Arcane Circle behind the book */}
      <motion.div
        className="absolute w-[80vw] h-[80vw] md:w-[60vw] md:h-[60vw] rounded-full border border-purple-500/20 pointer-events-none"
        style={{ borderStyle: 'dashed' }}
        animate={{ rotate: 360, scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute w-[60vw] h-[60vw] md:w-[40vw] md:h-[40vw] rounded-full border border-indigo-400/10 pointer-events-none border-dashed"
        animate={{ rotate: -360, scale: [1, 0.9, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      <motion.div 
        initial={{ opacity: 0, rotateX: 15, rotateY: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, rotateX: 0, rotateY: 0, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="grimoire-page !h-[95vh] md:!h-[90vh] w-full max-w-7xl flex flex-col !p-6 md:!p-12 relative shadow-[0_0_100px_rgba(76,29,149,0.4)] ring-1 ring-[#e0c9a3]/10"
      >
        <div className="grimoire-spine hidden md:block" />
        
        {/* Navigation / Header */}
        <div className="flex justify-between items-end mb-8 border-b-2 border-black/20 pb-4 shrink-0 z-20 relative">
          <div className="flex flex-col">
             <motion.span 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.3, duration: 0.8 }}
               className="title-text text-3xl md:text-5xl font-bold tracking-widest text-[#2c1b18] uppercase drop-shadow-[2px_2px_4px_rgba(0,0,0,0.1)]"
             >
               Grimório de Magia
             </motion.span>
             <div className="flex gap-4 text-xs md:text-lg font-bold text-black/60 uppercase tracking-widest mt-2 handwriting">
                <span>Nível Mágico {level}</span>
                <span>• Feitiços Dominados: {unlockedCount}/{VOCABULARY.length}</span>
              </div>
          </div>
          <button onClick={onClose} className="grimoire-btn border-b-2 border-black/20 pb-1 rounded-none hover:bg-transparent !p-0 title-text">FECHAR LIVRO</button>
        </div>

        {/* 2-page Flex layout */}
        <div className="overflow-y-auto flex-1 z-20 custom-scrollbar pb-8 relative">
          <div className="flex flex-col md:flex-row gap-12 md:gap-24 w-full">
            {/* Esquerda */}
            <div className="flex-1 flex flex-col space-y-12">
              {leftKeys.map(key => renderCategory(key))}
            </div>
            {/* Direita */}
            <div className="flex-1 flex flex-col space-y-12">
              {rightKeys.map(key => renderCategory(key))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
