import React, { useState, useMemo, useEffect, memo, useCallback } from 'react';
import { Spell, ElementType } from '../types';
import { ELEMENTS_INFO, SEQUENCE_BONUSES } from '../constants';
import { VOCABULARY } from '../vocabulary';
import { motion, AnimatePresence } from 'motion/react';

// Sub-component for individual pages to prevent unnecessary re-renders of the whole book
const PageContent = memo(({ 
  type, 
  spreadIndex, 
  content 
}: { 
  type: 'left' | 'right', 
  spreadIndex: number, 
  content: React.ReactNode 
}) => {
  return (
    <div className={`p-4 md:p-8 ${type === 'left' ? 'md:pl-12' : 'md:pr-12'} h-full relative z-10`}>
      {content}
    </div>
  );
});

interface SpellbookProps {
  level: number;
  unlockedCount: number;
  spellCooldowns: Record<string, number>;
  comboCooldowns: Record<string, number>;
  discoveredCombos: string[];
  onOpenCombos: () => void;
  onClose: () => void;
}

export default function Spellbook({ level, unlockedCount, spellCooldowns, comboCooldowns, discoveredCombos, onOpenCombos, onClose }: SpellbookProps) {
  const [expandedSealed, setExpandedSealed] = useState<Record<string, boolean>>({});
  const [hideUnknown, setHideUnknown] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelQuery, setLevelQuery] = useState('');

  const filteredVocabulary = useMemo(() => {
    let list = VOCABULARY;
    if (searchQuery.trim()) {
      const lowerQ = searchQuery.toLowerCase().trim();
      list = list.filter(v => 
        v.pt.toLowerCase().includes(lowerQ) ||
        v.kana.includes(lowerQ) ||
        v.kanji.includes(lowerQ)
      );
    }
    if (levelQuery.trim()) {
      const lv = parseInt(levelQuery);
      if (!isNaN(lv)) {
        list = list.filter(v => v.unlockLevel === lv);
      }
    }
    return list;
  }, [searchQuery, levelQuery]);

  const grouped = useMemo(() => {
    const g: Record<string, Spell[]> = {};
    filteredVocabulary.forEach(v => {
      if (!g[v.element]) g[v.element] = [];
      g[v.element].push(v);
    });
    // Sort each category by level
    Object.keys(g).forEach(key => {
      g[key].sort((a, b) => a.unlockLevel - b.unlockLevel);
    });
    return g;
  }, [filteredVocabulary]);

  const elementKeys = useMemo(() => {
    if (!searchQuery.trim() && !levelQuery.trim()) {
      return Object.keys(ELEMENTS_INFO) as ElementType[];
    }
    return Object.keys(grouped) as ElementType[];
  }, [searchQuery, levelQuery, grouped]);

  const totalSpreads = useMemo(() => Math.max(1, Math.ceil(elementKeys.length / 2)), [elementKeys.length]);

  // Jump to specific portions of the book
  const jumpToCategory = (key: string) => {
    const idx = elementKeys.indexOf(key as any);
    if (idx >= 0) {
      const spreadIdx = Math.floor(idx / 2);
      setCurrentPage(spreadIdx);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalSpreads - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, levelQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement).blur();
          setSearchQuery('');
          setLevelQuery('');
        }
        return;
      }
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'd') handleNextPage();
      if (e.key === 'ArrowLeft' || e.key === 'a') handlePrevPage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, currentPage, totalSpreads, handleNextPage, handlePrevPage]); // Added functions to dependencies


  const getEffectDesc = (vocab: Spell) => {
    if (!vocab.effect) return null;
    let chanceStr = vocab.effectChance && vocab.effectChance < 1.0 ? `${Math.round(vocab.effectChance * 100)}% de chance: ` : 'Efeito garantido: ';
    if (vocab.type === 'utility') chanceStr = 'Efeito: ';

    const mapDesc: Record<string, string> = {
      'burn': 'Queimar (Dano Contínuo)', 'bleed': 'Sangrar (Dano Contínuo)', 'freeze': 'Congelar (Perde o turno)',
      'paralyze': 'Paralisar (Perde o turno)', 'weaken': 'Enfraquecer (-Ataque)',
      'shield': 'Proteger (Dano recebido -50%)', 'regen': 'Regenerar (Cura por turno)', 'blind': 'Cegar (Erra ataques)',
      'poison': 'Envenenar (Dano Contínuo)', 'hint': 'Sugere um feitiço pronto', 'cleanse': 'Remove maldições',
      'reduce_cd': 'Reduz todos Cooldowns em -2', 'force_bonus': 'Revela Ponto Fraco (!)', 'damage_buff': 'Aumento de Dano',
      'reveal_combo': 'Revela um novo combo secreto', 'reveal_2_combos': 'Revela 2 combos secretos', 
      'predict_attack': 'Prevê o próximo golpe inimigo', 'show_weakness': 'Mostra fraquezas do alvo', 
      'boss_eye': 'Revela HP e Atributos exatos', 'echo_next': 'Magia seguinte é conjurada 2x', 
      'autocomplete_next': 'Autocompletar próxima magia', 'ignore_typo_next': 'Ignora erros de digitação', 
      'combo_window_up': 'Aumenta janela de tempo de combos'
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
    if (!spells) return <div key={key} className="flex-1 text-center py-10 opacity-50 title-text">Página rasgada ou sem conhecimento...</div>;

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
         <div className="border-b-2 border-ink-dark/40 pb-2 mb-4">
           <div className="flex items-center gap-3">
             <span className="text-2xl grayscale opacity-80">{info.icon}</span>
             <span className="title-text text-xl tracking-[4px] uppercase font-bold text-[#3b2a21]/90">{info.name}</span>
           </div>
           {info.description && (
             <p className="text-xs text-[#3b2a21]/70 italic mt-2">{info.description}</p>
           )}
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
                   <span className="title-text text-[11px] tracking-widest opacity-60 text-right font-medium">{vocab.romaji}</span>
                   <span className="text-[10px] title-text opacity-40 font-bold">NÍVEL MÍNIMO: {vocab.unlockLevel}</span>
                 </div>
                 {getEffectDesc(vocab)}
               </div>
             );
           })}

           {!hideUnknown && sealedSpells.length > 0 && (
             <div className="mt-2 flex flex-col gap-2">
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   toggleSealed(key);
                 }}
                 className="w-full text-center py-2 border border-[#3b2a21]/10 text-[#3b2a21]/60 text-xs font-bold uppercase tracking-widest hover:bg-[#3b2a21]/5 transition-colors title-text rounded-sm active:scale-[0.98]"
               >
                 {expandedSealed[key] ? 'Ocultar feitiços selados' : `Mostrar feitiços selados (${sealedSpells.length} restantes)`}
               </button>
               
               <AnimatePresence>
                 {expandedSealed[key] && (
                   <motion.div 
                     key={`sealed-${key}`}
                     initial={{ height: 0, opacity: 0 }}
                     animate={{ height: "auto", opacity: 0.6 }}
                     exit={{ height: 0, opacity: 0 }}
                     className="flex flex-col overflow-hidden"
                   >
                     <div className="flex flex-col gap-2 mt-2">
                       {sealedSpells.map(vocab => (
                         <div key={vocab.pt} className="flex justify-between items-center py-2 border-b border-[#3b2a21]/5">
                           <span className="title-text font-bold text-base md:text-lg">??? (Selado)</span>
                           <span className="text-[10px] bg-[#3b2a21]/10 px-2 py-1 rounded-sm uppercase title-text font-bold">Nv {vocab.unlockLevel}</span>
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

  const renderLeftPage = useCallback((spreadIndex: number) => {
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
               
               {discoveredCombos.length > 0 && (
                 <div className="mt-8 w-full px-4">
                   <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#3b2a21]/50 mb-4 text-center border-b border-[#3b2a21]/10 pb-1">Status de Alquimia</h4>
                   <div className="grid grid-cols-1 gap-2">
                     {SEQUENCE_BONUSES.filter(sb => discoveredCombos.includes(sb.id)).slice(0, 4).map(combo => {
                       const cd = comboCooldowns[combo.id] || 0;
                       return (
                         <div key={combo.id} className="flex justify-between items-center text-[11px] bg-white/30 p-2 rounded-sm border border-[#3b2a21]/5">
                           <span className="font-bold opacity-80 uppercase">{combo.name}</span>
                           {cd > 0 ? (
                             <span className="text-red-700 font-black animate-pulse">⏳ {cd}T</span>
                           ) : (
                             <span className="text-green-700 font-black uppercase">Pronto</span>
                           )}
                         </div>
                       );
                     })}
                     {discoveredCombos.length > 4 && (
                       <p className="text-[9px] text-center italic mt-2 opacity-50">... e outros. Veja as anotações para detalhes.</p>
                     )}
                   </div>
                 </div>
               )}
             </div>
          ) : (
            renderCategory(key)
          )}
        </div>
        <div className="shrink-0 pt-4 flex justify-end items-center text-[#3b2a21] border-t border-[#432d22]/10 mt-2">
          <span className="title-text text-xs font-bold opacity-60">
            {isEnd ? "Epílogo" : `Página ${spreadIndex * 2 + 1}`}
          </span>
        </div>
      </div>
    );
  }, [totalSpreads, elementKeys, level, unlockedCount, grouped, hideUnknown, expandedSealed, spellCooldowns, comboCooldowns, discoveredCombos]);

  const renderRightPage = useCallback((spreadIndex: number) => {
    const isEnd = spreadIndex >= totalSpreads;
    const key = !isEnd ? elementKeys[spreadIndex * 2 + 1] : undefined;
    
    if (isEnd) {
      return (
        <div className="flex flex-col h-full z-10 relative">
          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="text-4xl mb-6 grayscale opacity-80">🗝️</span>
            <span className="title-text text-2xl font-bold uppercase tracking-[4px] text-[#2c1b18] mb-8 text-center drop-shadow-[1px_1px_0px_rgba(255,255,255,0.3)]">
              Você chegou ao fim
            </span>
            <button 
              onClick={onClose} 
              className="grimoire-btn border-2 border-[#3b2a21]/50 bg-[#3b2a21]/5 hover:bg-[#3b2a21]/10 px-8 py-3 rounded-sm title-text font-bold text-sm md:text-base transition-all shadow-md text-[#3b2a21] uppercase tracking-[4px] border-b-[4px] active:border-b-[2px] active:translate-y-[2px] mb-4"
            >
              FECHAR E VOLTAR
            </button>
            <button 
              onClick={onOpenCombos}
              className="flex items-center gap-3 text-[#3b2a21]/60 hover:text-purple-900 transition-colors title-text text-sm font-bold uppercase tracking-widest"
            >
              <span className="text-xl">📜</span> Ver Anotações de Alquimia
            </button>
          </div>
          <div className="shrink-0 pt-4 flex justify-between items-center text-[#3b2a21] border-t border-[#432d22]/10 mt-2">
            <span className="title-text text-xs font-bold opacity-60">
              Capa Traseira
            </span>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col h-full z-10 relative">
        <div className="shrink-0 mb-6 flex flex-col items-end border-b-2 border-[#432d22]/20 pb-4 gap-3 relative">
          <div className="absolute top-0 right-0 flex flex-col gap-2 scale-75 origin-top-right">
            <label className="flex items-center gap-3 cursor-pointer group">
               <span className="title-text text-[11px] tracking-widest uppercase font-bold text-[#3b2a21]/80 opacity-70 group-hover:opacity-100 transition-opacity">
                 Ocultar Seladas
               </span>
               <div className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center transition-colors ${hideUnknown ? 'bg-[#3b2a21] border-[#3b2a21]' : 'border-[#3b2a21]/40'}`}>
                 {hideUnknown && <span className="text-[#e2dac6] text-[10px]">✓</span>}
               </div>
               <input type="checkbox" className="hidden" checked={hideUnknown} onChange={(e) => setHideUnknown(e.target.checked)} />
            </label>
            <button onClick={onClose} className="grimoire-btn border-2 border-[#3b2a21]/30 bg-transparent hover:bg-[#3b2a21]/10 px-3 py-1 rounded-sm title-text font-bold text-[10px] transition-all shadow-sm text-[#3b2a21] uppercase tracking-widest border-b-[3px] active:border-b-[2px] active:translate-y-[1px]">
              SAIR (ESC)
            </button>
          </div>
        </div>

        <div className="flex-1 custom-scrollbar overflow-y-auto pr-2 pb-4 flex flex-col">
          {renderCategory(key)}
        </div>

        <div className="shrink-0 pt-4 flex justify-start items-center text-[#3b2a21] border-t border-[#432d22]/10 mt-2">
          <span className="title-text text-xs font-bold opacity-60">
            Página {spreadIndex * 2 + 2}
          </span>
        </div>
      </div>
    );
  }, [totalSpreads, elementKeys, grouped, hideUnknown, level, unlockedCount, expandedSealed, spellCooldowns, onClose]);

  const sparks = useMemo(() => {
    return Array.from({ length: 10 }).map((_, i) => (
      <motion.div
        key={`spark-${i}`}
        className="absolute rounded-full pointer-events-none z-0"
        style={{
          width: Math.random() * 3 + 2 + 'px',
          height: Math.random() * 3 + 2 + 'px',
          backgroundColor: ['#fef08a', '#e9d5ff', '#a78bfa', '#60a5fa'][Math.floor(Math.random() * 4)],
          left: Math.random() * 100 + 'vw',
          top: Math.random() * 100 + 'vh',
          opacity: 0.4,
        }}
        initial={{ opacity: 0, y: 0, scale: 0 }}
        animate={{ 
          opacity: [0, 0.4, 0], 
          y: [-50, -150],
          scale: [0, 1, 0]
        }}
        transition={{
          duration: 4 + Math.random() * 4,
          repeat: Infinity,
          delay: Math.random() * 5,
          ease: "linear"
        }}
      />
    ));
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-[#06040a]/80 flex flex-col items-center justify-center z-[100] p-2 md:p-6 backdrop-blur-md overflow-hidden cursor-zoom-out" 
    >
      
      {/* Floating Magic Sparks */}
      {sparks}

      {/* Search Bar */}
      <div className="absolute top-2 md:top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] md:w-[600px] flex gap-2">
        <input 
          type="text" 
          placeholder="Buscar magia por nome ou kana..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-[#110515]/90 text-[#e0c9a3] placeholder:text-[#e0c9a3]/50 px-4 py-2 md:py-3 border-2 border-[#e0c9a3]/30 rounded-md shadow-[0_0_15px_rgba(167,139,250,0.3)] outline-none focus:border-[#a78bfa] focus:shadow-[0_0_25px_rgba(167,139,250,0.6)] tracking-widest uppercase title-text text-xs md:text-sm transition-all text-center"
        />
        <input 
          type="number" 
          placeholder="Nv" 
          value={levelQuery}
          onChange={(e) => setLevelQuery(e.target.value)}
          className="w-16 md:w-20 bg-[#110515]/90 text-[#e0c9a3] placeholder:text-[#e0c9a3]/50 px-2 py-2 md:py-3 border-2 border-[#e0c9a3]/30 rounded-md shadow-[0_0_15px_rgba(167,139,250,0.3)] outline-none focus:border-[#a78bfa] focus:shadow-[0_0_25px_rgba(167,139,250,0.6)] tracking-widest uppercase title-text text-xs md:text-sm transition-all text-center"
        />
        <button 
          onClick={onOpenCombos}
          className="bg-[#3b2a21]/90 text-[#e0c9a3] px-3 md:px-4 rounded-md border-2 border-[#e0c9a3]/30 hover:border-[#a78bfa] transition-all flex items-center justify-center shadow-lg"
          title="Ver Alquimia"
        >
          <span className="text-xl">📜</span>
        </button>
      </div>

      {/* Book Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, rotateX: 25, y: 50 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
        className="!h-[90vh] w-full max-w-6xl flex relative z-10 book-container"
      >
        {/* Left Side Bookmarks (for even spread indices) */}
        <div className="absolute top-12 -left-6 md:-left-8 flex flex-col gap-2 z-0 items-end">
          {Object.entries(ELEMENTS_INFO).map(([key, info], i) => {
            const indexInKeys = elementKeys.indexOf(key as any);
            if (indexInKeys < 0 || indexInKeys % 2 !== 0) return null;
            const spreadIdx = Math.floor(indexInKeys / 2);
            const isActive = currentPage === spreadIdx;
            return (
              <button 
                key={key}
                onClick={() => setCurrentPage(spreadIdx)}
                className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-l-md border-r-0 border-2 transition-all hover:-translate-x-1 shadow-lg
                  ${isActive 
                    ? 'bg-[#3b2a21] text-white border-[#e0c9a3] -translate-x-2 z-10' 
                    : 'bg-[#1a110b] text-[#e0c9a3]/50 border-[#e0c9a3]/20 hover:text-[#e0c9a3]'}`}
                title={info.name}
              >
                <span className="text-lg md:text-xl drop-shadow-md">{info.icon}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side Bookmarks (for odd spread indices) */}
        <div className="absolute top-12 -right-6 md:-right-8 flex flex-col gap-2 z-0 items-start">
          {Object.entries(ELEMENTS_INFO).map(([key, info], i) => {
            const indexInKeys = elementKeys.indexOf(key as any);
            if (indexInKeys < 0 || indexInKeys % 2 === 0) return null;
            const spreadIdx = Math.floor(indexInKeys / 2);
            const isActive = currentPage === spreadIdx;
            return (
              <button 
                key={key}
                onClick={() => setCurrentPage(spreadIdx)}
                className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-r-md border-l-0 border-2 transition-all hover:translate-x-1 shadow-lg
                  ${isActive 
                    ? 'bg-[#3b2a21] text-white border-[#e0c9a3] translate-x-2 z-10' 
                    : 'bg-[#1a110b] text-[#e0c9a3]/50 border-[#e0c9a3]/20 hover:text-[#e0c9a3]'}`}
                title={info.name}
              >
                <span className="text-lg md:text-xl drop-shadow-md">{info.icon}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic mystical border glow */}
        <div className="absolute inset-0 rounded-sm pointer-events-none shadow-[inset_0_0_50px_rgba(167,139,250,0.15)] animate-pulse z-[105]" />

        {/* Global Navigation Overlay - Bypasses 3D transform pointer-event bugs */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none z-[110] flex justify-between items-end p-4 md:p-8 md:px-12">
          <div className="w-[50%] flex justify-start pl-2">
             <button 
               onClick={handlePrevPage}
               className={`pointer-events-auto title-text font-bold uppercase tracking-widest text-[10px] md:text-xs text-[#3b2a21] hover:text-black hover:bg-[#3b2a21]/10 px-4 py-2 rounded-md transition-all shadow-sm border border-[#3b2a21]/20 bg-[#e8dcc4]/80 backdrop-blur-md active:scale-95 z-50 ${currentPage === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:scale-105'}`}
             >
               ← Voltar Página
             </button>
          </div>
          <div className="w-[50%] flex justify-end pr-2">
             <button 
               onClick={handleNextPage}
               className={`pointer-events-auto title-text font-bold uppercase tracking-widest text-[10px] md:text-xs text-[#3b2a21] hover:text-black hover:bg-[#3b2a21]/10 px-4 py-2 rounded-md transition-all shadow-sm border border-[#3b2a21]/20 bg-[#e8dcc4]/80 backdrop-blur-md active:scale-95 z-50 ${currentPage >= totalSpreads - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:scale-105'}`}
             >
               Avançar Página →
             </button>
          </div>
        </div>

        {/* Base Fixed Left Page (Page 0 Left) */}
        <div className="absolute top-0 left-0 w-[50%] h-full z-[5]">
          <div className="absolute inset-0 page-back base-left-shadow !transform-none !rotate-y-0" style={{ zIndex: 0 }}>
            <PageContent type="left" spreadIndex={0} content={renderLeftPage(0)} />
          </div>
        </div>
        
        {/* Base Fixed Right Page (Final spread base) */}
        <div className="absolute top-0 right-0 w-[50%] h-full z-[5]">
          <div className="absolute inset-0 page-front !transform-none !rotate-y-0" style={{ zIndex: 0 }}>
            <PageContent type="right" spreadIndex={totalSpreads} content={renderRightPage(totalSpreads)} />
          </div>
        </div>

        {/* Flippable Sheets */}
        {Array.from({ length: totalSpreads }).map((_, sheetIndex) => {
           const isFlipped = sheetIndex < currentPage;
           const zIndex = isFlipped ? sheetIndex + 10 : (totalSpreads - sheetIndex) + 10;
           
           return (
             <div 
               key={sheetIndex}
               className={`book-page pointer-events-none ${isFlipped ? 'flipped' : ''}`}
               style={{ zIndex }}
             >
               {/* FRONT FACE -> RIGHT PAGE */}
               <div className="page-front pointer-events-auto">
                 <PageContent type="right" spreadIndex={sheetIndex} content={renderRightPage(sheetIndex)} />
               </div>
               
               {/* BACK FACE -> LEFT PAGE (shows NEXT spread's left page) */}
               <div className="page-back pointer-events-auto">
                 <PageContent type="left" spreadIndex={sheetIndex + 1} content={renderLeftPage(sheetIndex + 1)} />
               </div>
             </div>
           );
        })}

        {/* Book spine crease shadow - Moved to a very high level and removed translateZ to avoid 3D clipping */}
        <div 
          className="absolute top-0 bottom-0 left-[50%] w-12 md:w-24 pointer-events-none z-[500]" 
          style={{
            transform: 'translateX(-50%)',
            background: 'linear-gradient(to right, transparent, rgba(10, 5, 0, 0.4) 30%, rgba(0, 0, 0, 0.7) 50%, rgba(10, 5, 0, 0.4) 70%, transparent)',
            mixBlendMode: 'multiply'
          }} 
        />
      </motion.div>
    </motion.div>
  );
}


