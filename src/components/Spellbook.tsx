import { useState } from 'react';
import { Spell, ElementType } from '../types';
import { ELEMENTS_INFO, STATUS_NAMES_PT } from '../constants';
import { VOCABULARY } from '../vocabulary';

interface SpellbookProps {
  level: number;
  unlockedCount: number;
  spellCooldowns: Record<string, number>;
  onClose: () => void;
}

export default function Spellbook({ level, unlockedCount, spellCooldowns, onClose }: SpellbookProps) {
  const [expandedSealed, setExpandedSealed] = useState<Record<string, boolean>>({});

  const grouped: Record<string, Spell[]> = {};
  VOCABULARY.forEach(v => {
    if (!grouped[v.element]) grouped[v.element] = [];
    grouped[v.element].push(v);
  });

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

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]/90 flex items-center justify-center z-[100] p-2 md:p-6 backdrop-blur-md">
      <div className="grimoire-page !h-[95vh] md:!h-[90vh] flex flex-col !p-6 md:!p-12 relative">
        <div className="grimoire-spine hidden md:block" />
        
        {/* Navigation / Header */}
        <div className="flex justify-between items-end mb-8 border-b-2 border-ink-dark/30 pb-4 shrink-0 z-20">
          <div className="flex flex-col">
             <span className="title-text text-3xl md:text-4xl font-bold tracking-widest text-[#2c1b18] uppercase">Anotações</span>
             <div className="flex gap-4 text-xs md:text-lg font-bold text-ink-dark/60 uppercase tracking-widest mt-2 handwriting">
                <span>Nível {level}</span>
                <span>• {unlockedCount}/{VOCABULARY.length} Feitiços</span>
              </div>
          </div>
          <button onClick={onClose} className="grimoire-btn border-b border-ink-dark/30 pb-1 rounded-none hover:bg-transparent !p-0">SAIR</button>
        </div>

        {/* 2-page CSS Columns layout */}
        <div className="overflow-y-auto flex-1 z-20 custom-scrollbar pb-8">
          <div className="columns-1 md:columns-2 gap-x-24 space-y-12">
            {Object.entries(ELEMENTS_INFO).map(([key, info]) => {
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
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
