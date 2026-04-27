import React from 'react';
import { motion } from 'framer-motion';
import { Player, Monster } from '../types';
import { VOCABULARY } from '../vocabulary';
import { SEQUENCE_BONUSES } from '../constants';

interface DevPanelProps {
  player: Player;
  monster: Monster | null;
  setPlayer: React.Dispatch<React.SetStateAction<Player>>;
  setMonster: React.Dispatch<React.SetStateAction<Monster | null>>;
  setSpellCooldowns: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setComboCooldowns: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setStats: React.Dispatch<React.SetStateAction<any>>;
  addLog: (msg: string, color?: string) => void;
  resetGame: () => void;
  onClose: () => void;
}

export const DevPanel: React.FC<DevPanelProps> = ({ 
  player, monster, setPlayer, setMonster, setSpellCooldowns, setComboCooldowns, setStats, addLog, resetGame, onClose 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed top-0 right-0 h-full w-80 bg-stone-900 text-stone-100 z-[100] shadow-2xl border-l-4 border-amber-600 p-6 overflow-y-auto font-mono text-sm"
    >
      <div className="flex justify-between items-center mb-6 border-b border-stone-700 pb-2">
        <h2 className="text-xl font-bold text-amber-500 uppercase tracking-tighter">Grimório do Criador</h2>
        <button onClick={onClose} className="p-1 hover:bg-stone-800 rounded">✖</button>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-stone-400 uppercase text-xs font-bold mb-3">Manipulação do Mágico</h3>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => {
                setPlayer(p => ({ ...p, hp: p.maxHp }));
                addLog('DEV: Vida restaurada!', 'text-green-500');
              }}
              className="bg-stone-800 hover:bg-stone-700 p-2 rounded text-xs"
            >
              Cura Total
            </button>
            <button 
              onClick={() => {
                setPlayer(p => {
                  const nextLevel = p.level + 1;
                  const nextMaxXp = Math.floor(p.maxXp * 1.5) + 50;
                  const hpGain = 50 + (nextLevel * 20);
                  return { ...p, level: nextLevel, xp: 0, maxXp: nextMaxXp, maxHp: p.maxHp + hpGain, hp: p.hp + hpGain };
                });
                addLog('DEV: Nível aumentado!', 'text-amber-500');
              }}
              className="bg-stone-800 hover:bg-stone-700 p-2 rounded text-xs"
            >
              Level Up
            </button>
            <button 
              onClick={() => {
                setPlayer(p => ({ ...p, xp: p.xp + 1000 }));
                addLog('DEV: +1000 XP injetado! (Ative uma magia para recalcular o nível)', 'text-amber-500');
              }}
              className="bg-stone-800 hover:bg-stone-700 p-2 rounded text-xs"
            >
              +1000 XP
            </button>
            <button 
              onClick={() => {
                setSpellCooldowns({});
                setComboCooldowns({});
                addLog('DEV: Cooldowns zerados (Magias e Combos)!', 'text-purple-500');
              }}
              className="bg-stone-800 hover:bg-stone-700 p-2 rounded text-xs"
            >
              0 Recargas
            </button>
            <button 
              onClick={() => {
                setPlayer(p => ({ ...p, maxHp: p.maxHp + 500, hp: p.hp + 500 }));
                addLog('DEV: HP Máximo aumentado!', 'text-green-500');
              }}
              className="bg-stone-800 hover:bg-stone-700 p-2 rounded text-xs"
            >
              +500 Max HP
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-stone-400 uppercase text-xs font-bold mb-3">Conhecimento Proibido</h3>
          <div className="space-y-2">
            <button 
              onClick={() => {
                const allIds = SEQUENCE_BONUSES.map(b => b.id);
                setPlayer(p => ({ ...p, discoveredCombos: allIds }));
                addLog('DEV: Todos os combos revelados!', 'text-purple-500');
              }}
              className="w-full bg-stone-800 hover:bg-stone-700 p-2 rounded text-xs text-left"
            >
              Revelar Todos os Combos
            </button>
            <button 
              onClick={() => {
                setPlayer(p => ({ ...p, discoveredCombos: [] }));
                addLog('DEV: Conhecimento de combos apagado!', 'text-red-500');
              }}
              className="w-full bg-stone-800 hover:bg-stone-700 p-2 rounded text-xs text-left"
            >
              Limpar Combos Descobertos
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-stone-400 uppercase text-xs font-bold mb-3">Controle da Entidade</h3>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => {
                if (monster) {
                  setMonster(m => m ? ({ ...m, currentHp: 1 }) : null);
                  addLog('DEV: Monstro está nas últimas!', 'text-red-500');
                }
              }}
              className="bg-stone-800 hover:bg-stone-700 p-2 rounded text-xs"
            >
              Insta-Kill
            </button>
            <button 
              onClick={() => {
                if (monster) {
                  setMonster(m => m ? ({ ...m, isShiny: true, maxHp: m.maxHp * 2, currentHp: m.maxHp * 2 }) : null);
                  addLog('DEV: Monstro se tornou Brilhante!', 'text-yellow-500');
                }
              }}
              className="bg-stone-800 hover:bg-stone-700 p-2 rounded text-xs"
            >
              Set Shiny
            </button>
            <button 
              onClick={() => {
                setStats(s => ({ ...s, bossesDefeated: s.bossesDefeated + 1 }));
                addLog('DEV: Boss Defeated count + 1!', 'text-yellow-500');
              }}
              className="bg-stone-800 hover:bg-stone-700 p-2 rounded text-xs"
            >
              +1 Boss Kill
            </button>
            <button 
              onClick={() => {
                setStats(s => ({ ...s, shiniesDefeated: s.shiniesDefeated + 1 }));
                addLog('DEV: Shiny Defeated count + 1!', 'text-yellow-500');
              }}
              className="bg-stone-800 hover:bg-stone-700 p-2 rounded text-xs"
            >
              +1 Shiny Kill
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-stone-400 uppercase text-xs font-bold mb-3">Utilidades de Sistema</h3>
          <div className="space-y-2">
            <button 
              onClick={() => {
                resetGame();
                addLog('DEV: Jogo resetado!', 'text-blue-500');
              }}
              className="w-full bg-red-900/40 hover:bg-red-900/60 p-2 rounded text-xs text-left border border-red-900"
            >
              Hard Reset (Limpar Tudo)
            </button>
            <button 
              onClick={() => {
                 setPlayer(p => ({
                   ...p,
                   statuses: [
                     ...p.statuses,
                     { type: 'echo_next', duration: 1 },
                     { type: 'autocomplete_next', duration: 1 },
                     { type: 'ignore_typo_next', duration: 1 },
                     { type: 'combo_window_up', duration: 1 }
                   ]
                 }));
                 addLog('DEV: Ativado todos os Buffs Utilitários!', 'text-cyan-400');
              }}
              className="w-full bg-stone-800 hover:bg-stone-700 p-2 rounded text-xs text-left"
            >
              Super Buff (Utilities)
            </button>
          </div>
        </section>

        <div className="pt-4 border-t border-stone-700 text-[10px] text-stone-500 italic">
          Grimório do Criador - Use com moderação. O equilíbrio do cosmos está em suas mãos.
        </div>
      </div>
    </motion.div>
  );
};
