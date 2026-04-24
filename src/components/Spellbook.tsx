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
      <div className="text-[10px] md:text-[11px] mt-2 text-ink-dark/70 font-bold italic leading-tight">
        ✧ {chanceStr}{mapDesc[vocab.effect] || vocab.effect}{durationStr}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 md:p-6 backdrop-blur-sm">
      <div className="grimoire-page !h-[95vh] md:!h-[90vh] flex flex-col !p-4 md:!p-8 !max-w-5xl !w-full relative shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden">
        
        <div className="flex justify-between items-start mb-6 border-b-2 border-ink-dark pb-4 pr-2 shrink-0">
          <div>
            <h2 className="title-text text-3xl md:text-4xl text-ink-dark font-black mb-2 tracking-wide">As Minhas Anotações</h2>
            <div className="flex gap-4 text-xs md:text-sm font-bold text-ink-dark/70 uppercase tracking-widest">
              <span className="bg-black/5 px-3 py-1.5 rounded border border-ink-dark/30">Nível: <span className="text-ink-red text-base">{level}</span></span>
              <span className="bg-black/5 px-3 py-1.5 rounded border border-ink-dark/30">Feitiços: <span className="text-ink-red text-base">{unlockedCount}/{VOCABULARY.length}</span></span>
            </div>
          </div>
          <button onClick={onClose} className="grimoire-btn btn-crimson text-sm px-4 py-2 mt-2">X Fechar</button>
        </div>
        
        <div className="overflow-y-auto flex-1 pr-4 pb-4 flex flex-col gap-6 pt-2">
          {Object.entries(ELEMENTS_INFO).map(([key, info]) => {
            const spells = grouped[key];
            if (!spells) return null;

            return (
              <div key={key} className="grimoire-box mb-4 p-0 overflow-hidden shadow-md">
                <div className="px-4 py-2 border-b-2 border-ink-dark" style={{ backgroundColor: info.bg }}>
                  <span className="text-xl md:text-2xl drop-shadow-md mr-2">{info.icon}</span> 
                  <span className="font-bold tracking-widest title-text" style={{ color: info.color }}>{info.name}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-parchment">
                  {spells.map((vocab) => {
                    const isUnlocked = level >= vocab.unlockLevel;
                    
                    if (isUnlocked) {
                      const currentCooldown = spellCooldowns[vocab.pt] || 0;
                      const isReady = currentCooldown <= 0;
                      return (
                        <div key={vocab.pt} className="bg-white/40 p-4 border border-ink-dark/20 rounded shadow-sm hover:bg-white/60 transition-colors">
                          <div className="flex justify-between items-start mb-2 border-b border-dashed border-ink-dark/30 pb-1">
                            <div className={`font-bold text-base md:text-lg ${vocab.type === 'heal' ? 'text-[#166534]' : vocab.type === 'status' ? 'text-[#1e40af]' : vocab.type === 'utility' ? 'text-[#6b21a8]' : 'text-ink-dark'}`}>
                              {vocab.pt}
                            </div>
                            <div>
                              {isReady ? (
                                <span className="text-green-800 text-[10px] border border-green-800 px-1.5 py-0.5 rounded font-bold bg-green-100 uppercase">PRONTO</span>
                              ) : (
                                <span className="text-ink-red text-[10px] border border-ink-red px-1.5 py-0.5 rounded font-bold bg-red-100 animate-pulse uppercase">⏳ {currentCooldown} T</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="text-xs md:text-sm text-ink-dark/60 tracking-widest font-mono uppercase font-bold">{vocab.romaji}</div>
                            <div className="text-right">
                              <div className="text-lg md:text-xl text-ink-dark jp-text font-black leading-none">{vocab.kana}</div>
                              <div className="text-[10px] text-ink-dark/60 mt-1 jp-text font-bold">{vocab.kanji}</div>
                            </div>
                          </div>
                          {getEffectDesc(vocab)}
                        </div>
                      );
                    } else {
                      return (
                        <div key={vocab.pt} className="bg-black/5 flex items-center justify-center min-h-[100px] flex-col text-center rounded border border-dashed border-ink-dark/20 opacity-60">
                          <div className="text-ink-dark font-bold mb-1 text-base tracking-widest uppercase">🔒 Selado</div>
                          <div className="text-ink-dark/60 font-bold text-xs italic">Nível {vocab.unlockLevel}</div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
