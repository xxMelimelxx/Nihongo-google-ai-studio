import { useState, useMemo, useEffect } from 'react';
import { Spell, ElementType } from '../types';
import { ELEMENTS_INFO } from '../constants';
import { VOCABULARY } from '../vocabulary';
import { motion, AnimatePresence } from 'motion/react';

interface SpellbookProps {
  level: number;
  unlockedCount: number;
  spellCooldowns: Record<string, number>;
  onClose: () => void;
}

export default function Spellbook({ level, unlockedCount, spellCooldowns, onClose }: SpellbookProps) {
  const [expandedSealed, setExpandedSealed] = useState<Record<string, boolean>>({});
  const [hideUnknown, setHideUnknown] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'd') handleNextPage();
      if (e.key === 'ArrowLeft' || e.key === 'a') handlePrevPage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, currentPage]); // Added dependencies to hook up correctly

  const grouped = useMemo(() => {
    const g: Record<string, Spell[]> = {};
    VOCABULARY.forEach(v => {
      if (!g[v.element]) g[v.element] = [];
      g[v.element].push(v);
    });
    return g;
  }, []);

  const elementKeys = Object.keys(ELEMENTS_INFO);
  const totalSpreads = Math.ceil(elementKeys.length / 2);

  const handleNextPage = () => {
    if (currentPage < totalSpreads) {
      setCurrentPage(p => p + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
    }
  };

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
      <div className="text-xs md:text-[13px] mt-2 text-ink-dark/90 font-black italic border-t border-ink-dark/10 pt-1.5 flex justify-between">
        <span>✧ {chanceStr}{mapDesc[vocab.effect] || vocab.effect}{durationStr}</span>
      </div>
    );
  };

  const getSpellTypeTag = (vocab: Spell) => {
    switch(vocab.type) {
      case 'attack': return <span className="text-[10px] md:text-xs font-bold text-red-800/80 bg-red-900/10 px-2 py-0.5 rounded-sm">⚔ DANO: {vocab.power}</span>;
      case 'heal': return <span className="text-[10px] md:text-xs font-bold text-green-800/80 bg-green-900/10 px-2 py-0.5 rounded-sm">♥ CURA: {vocab.power}</span>;
      case 'status': return <span className="text-[10px] md:text-xs font-bold text-indigo-800/80 bg-indigo-900/10 px-2 py-0.5 rounded-sm">⚚ STATUS</span>;
      case 'utility': return <span className="text-[10px] md:text-xs font-bold text-amber-800/80 bg-amber-900/10 px-2 py-0.5 rounded-sm">✦ UTILIDADE</span>;
      default: return null;
    }
  }

  const toggleSealed = (category: string) => {
    setExpandedSealed(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const renderCategory = (key: string | undefined) => {
    if (!key) return <div className="flex-1 opacity-0 pointer-events-none" />; // Empty slot
    const info = ELEMENTS_INFO[key as ElementType];
    const spells = grouped[key];
    if (!spells) return <div className="flex-1 text-center py-10 opacity-50 title-text">Página rasgada ou sem conhecimento...</div>;

    const unlockedSpells = spells.filter(s => level >= s.unlockLevel);
    const sealedSpells = spells.filter(s => level < s.unlockLevel);

    if (unlockedSpells.length === 0 && hideUnknown) {
      return (
        <div key={key} className="break-inside-avoid flex flex-col mb-12 flex-1 items-center justify-center min-h-[300px]">
          <span className="text-6xl grayscale opacity-20 mb-4">{info.icon}</span>
          <span className="title-text text-xl uppercase font-bold text-[#3b2a21]/40">Desconhecido</span>
          <span className="title-text text-sm text-[#3b2a21]/30 mt-2">Nenhum feitiço desta categoria foi dominado.</span>
        </div>
      );
    }

    return (
      <div key={key} className="break-inside-avoid flex flex-col mb-12 flex-1">
         <div className="flex items-center gap-3 border-b-2 border-ink-dark/40 pb-2 mb-4">
           <span className="text-2xl grayscale opacity-80">{info.icon}</span>
           <span className="title-text text-xl tracking-[4px] uppercase font-bold text-[#3b2a21]/90">{info.name}</span>
         </div>
         
         <div className="flex flex-col gap-6">
           {unlockedSpells.map((vocab) => {
             const currentCooldown = spellCooldowns[vocab.pt] || 0;
             const maxCooldown = vocab.cooldown > 0 ? vocab.cooldown + Math.max(0, Math.floor((level - vocab.unlockLevel) / 2)) : 0;
             
             return (
               <div key={vocab.pt} className="flex flex-col border-b border-[#3b2a21]/15 pb-3">
                 <div className="flex justify-between items-center mb-1">
                   <div className="flex gap-2 items-center flex-wrap">
                     <span className="title-text text-lg font-bold uppercase text-[#2c1b18]">{vocab.pt}</span>
                     {getSpellTypeTag(vocab)}
                     {maxCooldown > 0 && <span className="text-[10px] title-text opacity-50 bg-black/5 px-1 py-0.5 rounded">CD: {maxCooldown}T</span>}
                   </div>
                   {currentCooldown > 0 && <span className="text-xs font-bold border border-red-900/30 px-2 py-0.5 text-red-900/80 bg-red-900/5 animate-pulse rounded-sm">Recarga: {currentCooldown}t</span>}
                 </div>
                 <div className="flex flex-col gap-0.5 mt-1">
                   <div className="flex gap-3 items-baseline">
                     <span className="jp-text text-2xl font-bold text-[#1a110b]">{vocab.kana}</span>
                     <span className="jp-text text-sm text-[#3b2a21]/50">{vocab.kanji}</span>
                   </div>
                   <span className="title-text text-[11px] tracking-widest opacity-60 text-right">{vocab.romaji}</span>
                 </div>
                 {getEffectDesc(vocab)}
               </div>
             );
           })}

           {!hideUnknown && sealedSpells.length > 0 && (
             <div className="mt-2 flex flex-col gap-2">
               <button 
                 onClick={() => toggleSealed(key)}
                 className="w-full text-center py-2 border border-[#3b2a21]/10 text-[#3b2a21]/60 text-xs font-bold uppercase tracking-widest hover:bg-[#3b2a21]/5 transition-colors title-text rounded-sm"
               >
                 {expandedSealed[key] ? 'Ocultar feitiços selados' : `Mostrar feitiços selados (${sealedSpells.length} restantes)`}
               </button>
               
               <AnimatePresence>
                 {expandedSealed[key] && (
                   <motion.div 
                     initial={{ height: 0, opacity: 0 }}
                     animate={{ height: "auto", opacity: 0.6 }}
                     exit={{ height: 0, opacity: 0 }}
                     className="flex flex-col overflow-hidden"
                   >
                     <div className="flex flex-col gap-2 mt-2">
                       {sealedSpells.map(vocab => (
                         <div key={vocab.pt} className="flex justify-between items-center py-2 border-b border-[#3b2a21]/5">
                           <span className="title-text font-bold text-base md:text-lg">??? (Selado)</span>
                           <span className="text-[10px] bg-[#3b2a21]/10 px-2 py-1 rounded-sm uppercase title-text">Nv {vocab.unlockLevel}</span>
                         </div>
                       ))}
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
           )}
         </div>
      </div>
    );
  };

  const leftKey = elementKeys[currentPage * 2];
  const rightKey = elementKeys[currentPage * 2 + 1];

  const LeftPageContent = ({ spreadIndex }: { spreadIndex: number }) => {
    const isEnd = spreadIndex >= totalSpreads;
    const key = !isEnd ? elementKeys[spreadIndex * 2] : undefined;
    
    return (
      <div className="flex flex-col h-full z-10 relative">
        <div className={`shrink-0 mb-6 border-b-2 border-[#432d22]/20 pb-4 ${isEnd ? 'opacity-0' : ''}`}>
          <span className="title-text text-3xl md:text-5xl font-bold tracking-widest text-[#2c1b18] uppercase drop-shadow-[1px_1px_0px_rgba(255,255,255,0.3)]">
            Grimório
          </span>
          <div className="flex gap-4 text-xs md:text-[13px] font-bold text-[#3b2a21]/80 uppercase tracking-widest mt-2 handwriting">
            <span>Nível {level}</span>
            <span>• Dominados: {unlockedCount}/{VOCABULARY.length}</span>
          </div>
        </div>

        <div className="flex-1 custom-scrollbar overflow-y-auto pr-2 pb-4 flex flex-col">
          {isEnd ? (
             <div className="h-full flex flex-col items-center justify-center opacity-70 title-text">
               <span className="text-3xl mb-4 grayscale">📖</span>
               <span className="text-xl uppercase font-bold text-[#3b2a21]/70">Fim do Grimório</span>
             </div>
          ) : (
            renderCategory(key)
          )}
        </div>
        <div className="shrink-0 pt-4 flex justify-between items-center text-[#3b2a21] border-t border-[#432d22]/10 mt-2">
          <button 
            disabled={spreadIndex === 0}
            onClick={handlePrevPage}
            className="title-text font-bold uppercase tracking-widest text-[10px] md:text-xs hover:text-black hover:bg-[#3b2a21]/5 px-2 py-1 rounded transition-all disabled:opacity-0"
          >
            ← Voltar Página
          </button>
          <span className="title-text text-xs font-bold opacity-60">
            {isEnd ? "Epílogo" : `Página ${spreadIndex * 2 + 1}`}
          </span>
        </div>
      </div>
    );
  };

  const RightPageContent = ({ spreadIndex }: { spreadIndex: number }) => {
    const isEnd = spreadIndex >= totalSpreads;
    const key = !isEnd ? elementKeys[spreadIndex * 2 + 1] : undefined;
    
    return (
      <div className="flex flex-col h-full z-10 relative">
        <div className={`shrink-0 mb-6 flex flex-col items-end border-b-2 border-[#432d22]/20 pb-4 gap-3 ${isEnd ? 'border-b-0 justify-end flex-1 mb-0 pb-0' : ''}`}>
          {!isEnd && (
            <label className="flex items-center gap-3 cursor-pointer group mt-2">
               <span className="title-text text-[10px] md:text-[11px] tracking-widest uppercase font-bold text-[#3b2a21]/80 opacity-70 group-hover:opacity-100 transition-opacity">
                 Ocultar Seladas
               </span>
               <div className={`w-3.5 h-3.5 border-2 rounded-sm flex items-center justify-center transition-colors ${hideUnknown ? 'bg-[#3b2a21] border-[#3b2a21]' : 'border-[#3b2a21]/40'}`}>
                 {hideUnknown && <span className="text-[#e2dac6] text-[10px]">✓</span>}
               </div>
               <input type="checkbox" className="hidden" checked={hideUnknown} onChange={(e) => setHideUnknown(e.target.checked)} />
            </label>
          )}
          <button onClick={onClose} className="grimoire-btn border-2 border-[#3b2a21]/30 bg-transparent hover:bg-[#3b2a21]/10 px-4 py-1.5 rounded-sm title-text font-bold text-[10px] md:text-xs transition-all shadow-sm text-[#3b2a21] uppercase tracking-widest border-b-[3px] active:border-b-[2px] active:translate-y-[1px]">
            FECHAR (ESC)
          </button>
        </div>

        {!isEnd && (
          <div className="flex-1 custom-scrollbar overflow-y-auto pr-2 pb-4 flex flex-col">
            {renderCategory(key)}
          </div>
        )}

        <div className={`shrink-0 pt-4 flex justify-between items-center text-[#3b2a21] border-t border-[#432d22]/10 mt-2 ${isEnd ? 'mt-auto' : ''}`}>
          <span className="title-text text-xs font-bold opacity-60">
            {isEnd ? "Capa Traseira" : `Página ${spreadIndex * 2 + 2}`}
          </span>
          <button 
            disabled={isEnd}
            onClick={handleNextPage}
            className="title-text font-bold uppercase tracking-widest text-[10px] md:text-xs hover:text-black hover:bg-[#3b2a21]/5 px-2 py-1 rounded transition-all disabled:opacity-0"
          >
            Avançar Página →
          </button>
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#06040a]/80 flex flex-col items-center justify-center z-[100] p-2 md:p-6 backdrop-blur-md overflow-hidden" 
      style={{ perspective: '2000px' }}
    >
      
      {/* Floating Magic Sparks */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={`spark-${i}`}
          className="absolute rounded-full pointer-events-none z-0"
          style={{
            width: Math.random() * 4 + 2 + 'px',
            height: Math.random() * 4 + 2 + 'px',
            backgroundColor: ['#fef08a', '#e9d5ff', '#a78bfa', '#60a5fa'][Math.floor(Math.random() * 4)],
            left: Math.random() * 100 + 'vw',
            top: Math.random() * 100 + 'vh',
            boxShadow: '0 0 12px currentColor',
          }}
          initial={{ opacity: 0, y: 0, scale: 0 }}
          animate={{ 
            opacity: [0, Math.random() * 0.8 + 0.2, 0], 
            y: [-Math.random() * 50, -Math.random() * 200 - 50],
            x: Math.random() * 100 - 50,
            scale: [0, 1, 0]
          }}
          transition={{
            duration: Math.random() * 5 + 3,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeOut"
          }}
        />
      ))}

      {/* Book Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, rotateX: 25, y: 50 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
        transition={{ 
          duration: 0.8, 
          type: "spring", 
          bounce: 0.3,
          delay: 0.1
        }}
        className="!h-[95vh] md:!h-[90vh] w-full max-w-6xl flex relative z-10 shadow-[0_30px_100px_rgba(76,29,149,0.5)] ring-1 ring-[#e0c9a3]/30 rounded-sm book-container"
      >
        {/* Base Fixed Left Page (Always spread 0 left) */}
        <div className="absolute top-0 left-0 w-[50%] h-full page-back !transform-none !rotate-y-0 z-0">
          <div className="p-4 md:p-8 md:pl-12 h-full">
            <LeftPageContent spreadIndex={0} />
          </div>
        </div>
        
        {/* Base Fixed Right Page (Just paper base plus final closure page) */}
        <div className="absolute top-0 right-0 w-[50%] h-full page-front z-0">
          <div className="p-4 md:p-8 md:pr-12 h-full">
            <RightPageContent spreadIndex={totalSpreads} />
          </div>
        </div>

        {/* Flippable Sheets */}
        {Array.from({ length: totalSpreads }).map((_, sheetIndex) => {
           const isFlipped = sheetIndex < currentPage;
           const zIndex = isFlipped ? sheetIndex + 1 : totalSpreads - sheetIndex;
           
           return (
             <div 
               key={sheetIndex}
               className={`book-page ${isFlipped ? 'flipped' : ''}`}
               style={{ zIndex }}
             >
               {/* FRONT FACE -> RIGHT PAGE */}
               <div className="page-front">
                 <div className="p-4 md:p-8 md:pr-12 h-full">
                   <RightPageContent spreadIndex={sheetIndex} />
                 </div>
               </div>
               
               {/* BACK FACE -> LEFT PAGE (shows spreadIndex + 1) */}
               <div className="page-back">
                  <div className="p-4 md:p-8 md:pl-12 h-full">
                     <LeftPageContent spreadIndex={sheetIndex + 1} />
                  </div>
               </div>
             </div>
           );
        })}

      </motion.div>
    </motion.div>
  );
}


