/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import * as wanakana from 'wanakana';
import { Player, Monster, Spell, LogEntry, StatusType } from './types';
import { 
  STATUS_ICONS, 
  STATUS_NAMES_PT, 
  FLAVOR_WORDS, 
  ENEMY_SKILLS_POOL 
} from './constants';
import { VOCABULARY } from './vocabulary';
import { MONSTERS_LIST } from './monsters';
import BattleLog from './components/BattleLog';
import Spellbook from './components/Spellbook';
import Overlay from './components/Overlay';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_PLAYER: Player = {
  maxHp: 150,
  hp: 150,
  level: 1,
  xp: 0,
  maxXp: 100,
  monstersDefeated: 0,
  statuses: [],
};

export default function App() {
  const [player, setPlayer] = useState<Player>(INITIAL_PLAYER);
  const [monsterIndex, setMonsterIndex] = useState(0);
  const [monster, setMonster] = useState<Monster | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSpellbook, setShowSpellbook] = useState(false);
  const [overlayData, setOverlayData] = useState({ show: false, title: '', desc: '' });
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [monsterSpeech, setMonsterSpeech] = useState<string | null>(null);
  const [showJpName, setShowJpName] = useState(false);
  const [spellCooldowns, setSpellCooldowns] = useState<Record<string, number>>({});
  
  const inputRef = useRef<HTMLInputElement>(null);
  const sparkContainerRef = useRef<HTMLDivElement>(null);

  // Initialize first monster
  useEffect(() => {
    spawnMonster(0);
    addLog('Um Slime materializou-se!', 'text-ink-green');
    addLog('Prepare o seu encantamento...', 'text-ink-dark/60 italic');
  }, []);

  const addLog = useCallback((message: string, colorClass: string = 'text-ink-dark') => {
    setLogs(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), message, colorClass }]);
  }, []);

  const spawnMonster = (index: number) => {
    if (index >= MONSTERS_LIST.length) {
      setOverlayData({
        show: true,
        title: 'VITÓRIA ÉPICA!',
        desc: 'Derrotou o Deus da Destruição e masterizou a língua Japonesa com graciosidade!'
      });
      return;
    }

    const template = MONSTERS_LIST[index];
    const newMonster: Monster = {
      ...template,
      maxHp: template.hp,
      currentHp: template.hp,
      statuses: [],
      bonusActive: false,
    };
    setMonster(newMonster);
    setMonsterIndex(index);
    setShowJpName(false);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const applyStatus = (targetType: 'player' | 'monster', type: StatusType, duration: number) => {
    if (targetType === 'player') {
      setPlayer(prev => {
        const existing = prev.statuses.find(s => s.type === type);
        let newStatuses;
        if (existing) {
          newStatuses = prev.statuses.map(s => s.type === type ? { ...s, duration: Math.max(s.duration, duration) } : s);
        } else {
          newStatuses = [...prev.statuses, { type, duration }];
        }
        return { ...prev, statuses: newStatuses };
      });
    } else {
      setMonster(prev => {
        if (!prev) return prev;
        const existing = prev.statuses.find(s => s.type === type);
        let newStatuses;
        if (existing) {
          newStatuses = prev.statuses.map(s => s.type === type ? { ...s, duration: Math.max(s.duration, duration) } : s);
        } else {
          newStatuses = [...prev.statuses, { type, duration }];
        }
        return { ...prev, statuses: newStatuses };
      });
    }
  };

  const processStatuses = async (isPlayer: boolean) => {
    let canAct = true;
    const entity = isPlayer ? player : monster;
    if (!entity || entity.statuses.length === 0) return canAct;

    const statusesToProcess = [...entity.statuses];
    for (const status of statusesToProcess) {
      const name = isPlayer ? 'Você' : entity.name;
      let statusMsg = '';
      let damageValue = 0;
      let healValue = 0;

      if (status.type === 'burn') {
        damageValue = Math.floor(15 + (player.level * 18));
        statusMsg = `${name} sofreu ${damageValue} dano por Fogo! 🔥`;
      } else if (status.type === 'bleed') {
        damageValue = Math.floor(10 + (player.level * 15));
        statusMsg = `${name} sangrou por ${damageValue} dano! 🩸`;
      } else if (status.type === 'poison') {
        damageValue = Math.floor(20 + (player.level * 22));
        statusMsg = `${name} sofreu ${damageValue} dano tóxico! 🤢`;
      } else if (status.type === 'freeze') {
        canAct = false;
        statusMsg = `${name} está congelado! Turno perdido! ❄️`;
      } else if (status.type === 'paralyze') {
        canAct = false;
        statusMsg = `${name} está paralisado! Turno perdido! ⚡`;
      } else if (status.type === 'regen') {
        healValue = Math.floor(30 + (player.level * 25));
        statusMsg = `${name} regenerou ${healValue} HP! ✨`;
      } else if (status.type === 'blind') {
        statusMsg = `${name} tem a visão ofuscada (Chance de erro)! 👁️`;
      } else if (status.type === 'silence') {
        statusMsg = `${name} não pode abrir o Grimório (Selado)! 🤐`;
      }

      if (statusMsg) {
        addLog(statusMsg, isPlayer ? 'text-ink-green font-bold' : 'text-ink-red font-bold');
        if (damageValue > 0) {
          if (isPlayer) setPlayer(p => ({ ...p, hp: Math.max(0, p.hp - damageValue) }));
          else setMonster(m => m ? ({ ...m, currentHp: Math.max(0, m.currentHp - damageValue) }) : null);
        }
        if (healValue > 0) {
          if (isPlayer) setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + healValue) }));
          else setMonster(m => m ? ({ ...m, currentHp: Math.min(m.maxHp, m.currentHp + healValue) }) : null);
        }
        await delay(500);
      }
    }

    // Tick down and remove statuses
    if (isPlayer) {
      setPlayer(p => ({
        ...p,
        statuses: p.statuses.map(s => ({ ...s, duration: s.duration - 1 })).filter(s => s.duration > 0)
      }));
    } else {
      setMonster(m => m ? ({
        ...m,
        statuses: m.statuses.map(s => ({ ...s, duration: s.duration - 1 })).filter(s => s.duration > 0)
      }) : null);
    }

    return canAct;
  };

  const monsterTurnLogic = async (currentM: Monster, currentP: Player) => {
    if (currentM.currentHp <= 0 || currentP.hp <= 0) return;

    const canAct = await processStatuses(false);
    if (!canAct) return;

    let usedSkill = null;
    if (currentM.skills && currentM.skills.length > 0 && Math.random() < 0.3) {
      const skillKey = currentM.skills[Math.floor(Math.random() * currentM.skills.length)];
      usedSkill = ENEMY_SKILLS_POOL[skillKey];
    }

    if (usedSkill) {
      addLog(`O ${currentM.name} invocou 【${usedSkill.name}】!`, 'text-red-600 font-bold');
    } else {
      addLog(`O ${currentM.name} ataca furiosamente!`, 'text-ink-dark/60 font-bold');
    }

    // Animation visual triggers handled by state later or direct DOM if needed
    // But for React, we'll use state-based class names
    setIsAnimating(true);
    await delay(600);

    let isShielded = currentM.statuses.some(s => s.type === 'shield');
    let isPShielded = currentP.statuses.some(s => s.type === 'shield');

    if (usedSkill?.type === 'heal') {
      const heal = Math.floor(currentM.maxHp * usedSkill.mult);
      setMonster(m => m ? ({ ...m, currentHp: Math.min(m.maxHp, m.currentHp + heal) }) : null);
      addLog(`${currentM.name} curou ${heal} de HP!`, 'text-ink-green font-bold');
    } else if (usedSkill?.type === 'summon') {
      applyStatus('monster', 'shield', 3);
      const bonusHp = Math.floor(currentM.maxHp * usedSkill.mult);
      setMonster(m => m ? ({ ...m, currentHp: m.currentHp + bonusHp }) : null);
      addLog(`Barreira protetora invocada! (+${bonusHp} HP Extra)`, 'font-bold text-gold');
    } else {
      // Normal attack
      let atkPower = currentM.attack + (currentP.level * currentP.level * 3);
      if (currentM.statuses.some(s => s.type === 'weaken')) atkPower *= 0.5;
      if (isPShielded) atkPower *= 0.5;
      if (usedSkill?.type === 'attack') atkPower *= usedSkill.mult;

      const damage = Math.max(1, Math.floor(atkPower + (Math.random() * 10 - 5)));
      setPlayer(p => ({ ...p, hp: Math.max(0, p.hp - damage) }));
      addLog(`Golpe recebido! Perdeu ${damage} de vida!`, 'text-ink-red font-bold');

      if (usedSkill?.type === 'lifesteal') {
        setMonster(m => m ? ({ ...m, currentHp: Math.min(m.maxHp, m.currentHp + damage) }) : null);
        addLog(`${currentM.name} sugou a sua vitalidade!`, 'text-ink-green font-bold');
      }

      if (usedSkill?.type === 'status' && usedSkill.effect !== 'shield') {
        applyStatus('player', usedSkill.effect, usedSkill.duration);
      }
    }

    await delay(300);
    setIsAnimating(false);
  };

  const handleLevelUp = (currentP: Player) => {
    const nextLevel = currentP.level + 1;
    const nextMaxXp = Math.floor(currentP.maxXp * 1.5) + 50;
    const hpGain = 50 + (nextLevel * 20);
    
    addLog(`🌟 LEVEL UP! Alcançou o Nível ${nextLevel}!`, 'text-ink-red font-bold text-xl py-2');
    addLog(`A sua vida expandiu-se em +${hpGain}.`, 'text-ink-green font-bold');

    return {
      ...currentP,
      level: nextLevel,
      maxXp: nextMaxXp,
      maxHp: currentP.maxHp + hpGain,
      hp: currentP.hp + hpGain,
      xp: currentP.xp - currentP.maxXp
    };
  };

  const executePlayerAction = async (spell: Spell, isBonus: boolean) => {
    if (!monster) return;

    if (spell.type === 'heal') {
      const heal = Math.floor((spell.power + (player.level * 40)) * (isBonus ? 2 : 1));
      setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + heal) }));
      addLog(`Recuperou ${heal} de vitalidade!`, 'text-ink-green font-bold');
    } else if (spell.type === 'attack') {
      let dmg = spell.power + (spell.scaling === 'low' ? player.level * 5 : player.level * player.level * 6);
      if (player.statuses.some(s => s.type === 'weaken')) dmg *= 0.5;
      if (monster.statuses.some(s => s.type === 'shield')) dmg *= 0.5;
      if (isBonus) dmg *= 2;
      dmg = Math.floor(dmg);

      setMonster(m => m ? ({ ...m, currentHp: Math.max(0, m.currentHp - dmg) }) : null);
      addLog(`Impacto brutal de ${dmg} dano!`, 'font-bold');
    } else if (spell.type === 'utility') {
      if (spell.effect === 'hint') {
        const available = VOCABULARY.filter(v => 
          player.level >= v.unlockLevel && 
          (spellCooldowns[v.pt] || 0) === 0 && 
          v.type === 'attack'
        );
        if (available.length > 0) {
          const hint = available[Math.floor(Math.random() * available.length)];
          addLog(`💡 Revelação: Tente escrever 【${hint.pt}】 com: ${hint.romaji}`, 'font-bold text-gold');
        }
      } else if (spell.effect === 'cleanse') {
        setPlayer(p => ({
          ...p,
          statuses: p.statuses.filter(s => !['burn', 'bleed', 'poison', 'weaken', 'blind', 'paralyze', 'silence'].includes(s.type))
        }));
        addLog(`✨ Brilho Purificador! As páginas estão limpas de maldições!`, 'text-ink-green font-bold');
      } else if (spell.effect === 'reduce_cd') {
        setSpellCooldowns(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(key => {
            next[key] = Math.max(0, next[key] - 2);
          });
          return next;
        });
        addLog(`⏳ Controle do Tempo! Todas as recargas foram reduzidas!`, 'text-purple-700 font-bold');
      } else if (spell.effect === 'force_bonus') {
        setMonster(m => m ? ({ ...m, bonusActive: true }) : null);
        addLog(`🎯 Ponto Fraco Identificado! Próxima palavra combinada dará dano massivo!`, 'text-gold font-bold');
      }
    }

    if (spell.effect && spell.type !== 'utility') {
      if (Math.random() < (spell.effectChance || 1)) {
        if (spell.effectTarget === 'self') applyStatus('player', spell.effect, spell.effectDuration || 2);
        else applyStatus('monster', spell.effect, spell.effectDuration || 2);
      }
    }

    await delay(1000);

    // Check if monster dies
    setMonster(m => {
       if (m && m.currentHp <= 0) {
           const reward = m.xpReward;
           addLog(`Riscou o inimigo! Derrotou o ${m.name}!`, 'text-ink-blue font-bold text-lg');
           addLog(`Absorveu +${reward} XP!`, 'text-ink-dark/60 font-bold');
           
           setPlayer(p => {
             let newP = { ...p, xp: p.xp + reward, monstersDefeated: p.monstersDefeated + 1 };
             while (newP.xp >= newP.maxXp && newP.level < 40) {
                newP = handleLevelUp(newP);
             }
             return newP;
           });

            setTimeout(() => {
              setMonsterIndex(idx => {
                const nextIdx = idx + 1;
                spawnMonster(nextIdx);
                return nextIdx;
              });
            }, 1000);
            return null;
       }
       return m;
    });
  };

  const submitAnswer = async () => {
    if (isAnimating || !monster) return;
    
    const rawVal = inputVal.trim().toLowerCase();
    const val = rawVal.replace(/\s+/g, '');
    if (!val) return;

    if (FLAVOR_WORDS[val]) {
      setMonsterSpeech(FLAVOR_WORDS[val].r);
      setTimeout(() => setMonsterSpeech(null), 3000);
      setInputVal('');
      return;
    }

    setIsAnimating(true);
    setInputVal('');

    const spell = VOCABULARY.find(v => {
      if (player.level < v.unlockLevel) return false;
      const r = v.romaji.replace(/\s+/g, '');
      return val === r || val === v.kana || val === v.kanji || val === v.pt.toLowerCase().replace(/\s+/g, '') || wanakana.toHiragana(val) === v.kana;
    });

    let isBonus = false;
    let finalSpell = spell;

    if (!finalSpell && monster.bonusActive) {
      const monsterRomaji = monster.romaji.replace(/\s+/g, '');
      const spellWithBonus = VOCABULARY.find(v => {
        if (player.level < v.unlockLevel) return false;
        const r = v.romaji.replace(/\s+/g, '') + monsterRomaji;
        return val === r || val === v.kana + monster.kana || wanakana.toHiragana(val) === v.kana + monster.kana;
      });
      if (spellWithBonus) {
        finalSpell = spellWithBonus;
        isBonus = true;
      }
    }

    if (!finalSpell) {
      addLog(`Palavras incompreensíveis. O feitiço não se formou!`, 'text-ink-dark/60 italic font-bold');
      await delay(800);
      await monsterTurnLogic(monster, player);
      setIsAnimating(false);
      return;
    }

    const currentCooldown = spellCooldowns[finalSpell.pt] || 0;
    if (currentCooldown > 0) {
      addLog(`A magia ${finalSpell.pt} ainda precisa de ${currentCooldown} turnos!`, 'text-ink-red font-bold');
      setIsAnimating(false);
      return;
    }

    // Success
    addLog(`Escreveu o feitiço de ${finalSpell.pt}!`, 'font-bold text-ink-blue');
    
    // Cooldown logic
    setSpellCooldowns(prev => {
      const next = { ...prev };
      // Reduce all existing cooldowns
      Object.keys(next).forEach(key => {
        if (next[key] > 0) next[key]--;
      });
      // Set new cooldown for used spell
      if (finalSpell && finalSpell.cooldown > 0) {
        next[finalSpell.pt] = finalSpell.cooldown;
      }
      return next;
    });

    await processStatuses(true);
    
    if (player.hp > 0) {
      let missChance = player.statuses.some(s => s.type === 'blind') ? 0.5 : 0.1;
      if (Math.random() < missChance) {
        addLog(`O feitiço dissipou-se no ar e falhou!`, 'text-ink-dark/60 font-bold');
      } else {
        await executePlayerAction(finalSpell, isBonus);
      }
    }

    if (monster && monster.currentHp > 0) {
      await monsterTurnLogic(monster, player);
    }

    setIsAnimating(false);
  };

  const createSparkle = (e: FormEvent) => {
    if (!sparkContainerRef.current) return;
    const sparkle = document.createElement('div');
    sparkle.innerHTML = ['✨', '⭐', '🪄', '💠', '✦'][Math.floor(Math.random() * 5)];
    sparkle.className = 'absolute pointer-events-none z-50 text-[10px] md:text-sm anim-sparkle';
    sparkle.style.color = '#fde047';
    sparkle.style.textShadow = '0 0 5px white';
    
    const tx = (Math.random() - 0.5) * 80;
    const ty = -Math.random() * 60 - 20;
    sparkle.style.setProperty('--tx', `${tx}px`);
    sparkle.style.setProperty('--ty', `${ty}px`);
    
    const rect = (e.target as HTMLInputElement).getBoundingClientRect();
    const containerRect = sparkContainerRef.current.getBoundingClientRect();
    
    sparkle.style.left = `${Math.random() * rect.width + (rect.left - containerRect.left)}px`;
    sparkle.style.top = `${Math.random() * rect.height + (rect.top - containerRect.top)}px`;
    
    sparkContainerRef.current.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 800);
  };

  const resetGame = () => {
    setPlayer(INITIAL_PLAYER);
    setMonsterIndex(0);
    setLogs([]);
    setOverlayData({ show: false, title: '', desc: '' });
    setSpellCooldowns({});
    spawnMonster(0);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-2 md:p-8 overflow-y-auto">
      <div className="grimoire-page flex flex-col md:flex-row !p-0 max-w-6xl w-full relative">
        <div className="grimoire-spine hidden md:block" />
        
        {/* LEFT PAGE - Battle Context */}
        <div className="flex-1 p-6 md:p-12 flex flex-col relative z-20 w-full md:w-1/2">
           {/* Header */}
           <div className="mb-6 border-b-2 border-ink-dark/30 pb-2 flex justify-between items-end">
             <div className="flex flex-col">
               <h1 className="title-text text-3xl font-bold tracking-widest text-ink-dark">DIÁRIO DE B.</h1>
               <span className="jp-text text-sm font-bold text-ink-red tracking-widest italic opacity-80">戦いの記録</span>
             </div>
             <button 
                onClick={() => setIsAdminOpen(!isAdminOpen)} 
                className="text-[12px] opacity-20 hover:opacity-100 uppercase title-text transition-opacity"
             >
                ⚙
             </button>
           </div>
           
           {/* Admin Console */}
           {isAdminOpen && (
             <div className="mb-4 z-50 bg-[#e0c9a3] p-4 border border-ink-dark/30 shadow-inner">
               <div className="text-sm font-bold border-b border-ink-dark pb-2 flex justify-between mb-3 text-ink-red">
                   <span className="title-text uppercase tracking-widest">Ferramentas Sombrias</span>
                   <button onClick={() => setIsAdminOpen(false)} className="hover:text-red-900 text-lg leading-none">X</button>
               </div>
               <div className="flex flex-wrap gap-3 text-xs font-bold uppercase title-text">
                   <button onClick={() => setPlayer(p => ({ ...p, level: Math.min(40, p.level + 1) }))} className="hover:text-ink-red underline">+1 Nível</button>
                   <button onClick={() => setPlayer(p => ({ ...p, xp: p.xp + 1000 }))} className="hover:text-ink-red underline">+1000 XP</button>
                   <button onClick={() => setPlayer(p => ({ ...p, hp: p.maxHp }))} className="hover:text-green-700 underline">Curar HP</button>
                   <button onClick={() => setSpellCooldowns({})} className="hover:text-purple-700 underline">0 Recargas</button>
                   <button onClick={() => setMonster(m => m ? ({ ...m, currentHp: 0 }) : null)} className="hover:text-red-700 underline">Kill Monster</button>
               </div>
             </div>
           )}

           {/* Player Details */}
           <div className="mb-6 flex flex-col">
             <div className="flex justify-between items-end mb-1">
               <span className="font-bold uppercase tracking-widest handwriting text-2xl text-ink-dark/80">O Estudante (Nv.{player.level})</span>
               <span className="font-bold text-sm tracking-widest handwriting text-2xl text-ink-dark/80">{player.hp}/{player.maxHp} HP</span>
             </div>
             <div className="hp-track mb-2">
               <div className="hp-fill hp-player" style={{ width: `${(player.hp / player.maxHp) * 100}%` }}></div>
             </div>
             <div className="hp-track h-1 opacity-50">
               <div className="hp-fill xp-player-bar" style={{ width: `${(player.xp / player.maxXp) * 100}%` }}></div>
             </div>
             
             {player.statuses.length > 0 && (
               <div className="flex gap-2 mt-3 flex-wrap">
                 {player.statuses.map(s => (
                   <span key={s.type} className="text-xl relative" title={STATUS_NAMES_PT[s.type]}>
                     {STATUS_ICONS[s.type]}
                     <span className="absolute -bottom-2 -right-2 text-[10px] font-bold bg-[#c1af95] border border-ink-dark/30 rounded-full w-4 h-4 flex items-center justify-center">{s.duration}</span>
                   </span>
                 ))}
               </div>
             )}
           </div>

           {/* Monster Details */}
           <div className="flex-1 flex flex-col items-center justify-center mt-4 pt-12 relative min-h-[250px]">
             {monsterSpeech && (
                <div className="speech-bubble speech-show">
                  <span className="relative z-10">{monsterSpeech}</span>
                </div>
             )}
             
             {monster?.bonusActive && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-5xl text-ink-dark animate-bounce title-text opacity-50">!</div>
             )}
             
             <div className={cn("idle-float text-[100px] transition-transform drop-shadow-xl saturate-50", isAnimating && "anim-attack-m")}>
                {monster?.emoji || '❔'}
             </div>
             
             <div className="w-full mt-8 flex flex-col">
               <div className="flex justify-between items-end mb-1">
                 <div className="relative group inline-block text-left z-40">
                    <span 
                      onClick={() => setShowJpName(!showJpName)}
                      className={cn("handwriting text-3xl font-black cursor-pointer border-b border-dashed border-ink-dark/30 tracking-wide uppercase", monster?.color || "text-ink-dark")}
                    >
                      {monster?.name || '---'}
                    </span>
                    {showJpName && monster && (
                      <div className="jp-text absolute bottom-full left-0 text-sm mb-2 bg-[#d3c4ad] border border-ink-dark/30 px-3 py-1 shadow-md whitespace-nowrap z-50 font-bold opacity-80">
                        {monster.romaji} / {monster.kanji !== monster.kana ? monster.kanji : monster.kana}
                      </div>
                    )}
                 </div>
                 <span className="font-bold text-sm tracking-widest handwriting text-2xl text-ink-dark/80">
                   {monster ? `${monster.currentHp}/${monster.maxHp}` : '0/0'} HP
                 </span>
               </div>
               <div className="hp-track mb-2">
                 <div className="hp-fill hp-monster" style={{ width: monster ? `${(monster.currentHp / monster.maxHp) * 100}%` : '0%' }}></div>
               </div>
               
               {monster?.statuses && monster.statuses.length > 0 && (
                 <div className="flex gap-2 mt-2 flex-wrap">
                   {monster.statuses.map(s => (
                     <span key={s.type} className="text-xl relative" title={STATUS_NAMES_PT[s.type]}>
                       {STATUS_ICONS[s.type]}
                       <span className="absolute -bottom-2 -right-2 text-[10px] font-bold bg-[#c1af95] border border-ink-dark/30 rounded-full w-4 h-4 flex items-center justify-center">{s.duration}</span>
                     </span>
                   ))}
                 </div>
               )}
             </div>
           </div>
        </div>

        {/* RIGHT PAGE - Action Context */}
        <div className="flex-1 p-6 md:p-12 flex flex-col relative z-20 w-full md:w-1/2 border-t-2 border-ink-dark/30 md:border-t-0 md:border-l-2">
            {/* Input Form */}
            <div className="flex flex-col gap-6" ref={sparkContainerRef}>
               <div className="flex flex-col relative">
                  <label htmlFor="answer-input" className="text-sm font-bold mb-2 uppercase tracking-widest title-text opacity-70">Escrever Encantamento</label>
                  <input 
                    ref={inputRef}
                    type="text" 
                    id="answer-input" 
                    autoComplete="off" 
                    placeholder="..." 
                    className="grimoire-input"
                    value={inputVal}
                    onChange={(e) => {
                      setInputVal(e.target.value);
                      createSparkle(e);
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && submitAnswer()}
                    disabled={isAnimating}
                  />
               </div>
               
               <div className="flex gap-4">
                  <button 
                    onClick={submitAnswer}
                    disabled={isAnimating || !inputVal}
                    className="grimoire-btn btn-crimson text-sm md:text-base py-3 flex-1 disabled:opacity-50 tracking-[4px]"
                  >
                    CONJURAR
                  </button>
                  <button 
                    onClick={() => setShowSpellbook(true)}
                    className="grimoire-btn text-sm py-3 px-6 md:px-8 tracking-[4px]"
                  >
                    ANOTAÇÕES
                  </button>
               </div>
               
               {/* Cooldowns summary */}
               <div className="flex flex-wrap gap-2 items-center">
                  {VOCABULARY.filter(v => player.level >= v.unlockLevel && (spellCooldowns[v.pt] || 0) > 0).length === 0 ? (
                    <span className="text-ink-dark/50 italic text-sm title-text">A mente está limpa. (S/ Recargas)</span>
                  ) : (
                    VOCABULARY.filter(v => player.level >= v.unlockLevel && (spellCooldowns[v.pt] || 0) > 0).map(v => (
                       <span key={v.pt} className="border border-ink-dark/30 text-ink-dark px-2 py-1 text-xs font-bold title-text uppercase shadow-sm">
                         {v.pt} <span className="opacity-70 ml-1">({spellCooldowns[v.pt]}t)</span>
                       </span>
                    ))
                  )}
               </div>
            </div>
            
            {/* Logs Area */}
            <div className="flex-1 mt-8 pt-4 border-t-2 border-ink-dark/20 flex flex-col h-[200px] md:h-auto">
               <h3 className="title-text text-sm font-bold uppercase tracking-widest opacity-60 mb-2">Acontecimentos</h3>
               <div className="flex-1 min-h-[150px] relative">
                 <BattleLog logs={logs} />
               </div>
            </div>
        </div>

        {/* Global Overlays */}
        {showSpellbook && (
          <Spellbook 
            level={player.level} 
            unlockedCount={VOCABULARY.filter(v => player.level >= v.unlockLevel).length}
            spellCooldowns={spellCooldowns}
            onClose={() => setShowSpellbook(false)}
          />
        )}

        <Overlay 
          show={overlayData.show || player.hp <= 0}
          title={player.hp <= 0 ? 'FIM DA HISTÓRIA' : overlayData.title}
          desc={player.hp <= 0 ? 'As suas páginas fecharam-se...' : overlayData.desc}
          score={player.monstersDefeated}
          level={player.level}
          onRestart={resetGame}
        />

      </div>
    </div>
  );
}
