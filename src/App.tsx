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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="grimoire-page flex flex-col gap-2 max-w-4xl w-full">
        
        {/* Header */}
        <div className="relative flex justify-between items-end border-b-2 border-ink-dark pb-3 mb-4">
          <div>
            <h1 className="title-text text-3xl md:text-5xl text-ink-dark font-black leading-none tracking-wide">Nihongo Quest</h1>
            <span className="jp-text text-sm md:text-base font-bold text-ink-red tracking-widest mt-1 block">日本語クエスト</span>
          </div>
          <button 
            onClick={() => setIsAdminOpen(!isAdminOpen)} 
            className="grimoire-btn text-[10px] py-1 px-3 absolute top-0 right-0 h-auto"
          >
            Admin
          </button>
        </div>

        {/* Admin Console */}
        {isAdminOpen && (
          <div className="grimoire-box mb-4 z-50 bg-[#e0c9a3]">
            <div className="text-sm font-bold border-b border-ink-dark pb-2 flex justify-between mb-3 text-ink-red">
                <span className="title-text uppercase tracking-widest">Ferramentas de Criação</span>
                <button onClick={() => setIsAdminOpen(false)} className="hover:text-red-900 text-lg leading-none">✖</button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
                <button onClick={() => setPlayer(p => ({ ...p, level: Math.min(40, p.level + 1) }))} className="hover:text-ink-red underline">+1 Nível</button> |
                <button onClick={() => setPlayer(p => ({ ...p, xp: p.xp + 1000 }))} className="hover:text-ink-red underline">+1000 XP</button> |
                <button onClick={() => setPlayer(p => ({ ...p, hp: p.maxHp }))} className="hover:text-green-700 underline">Curar HP</button> |
                <button onClick={() => setSpellCooldowns({})} className="hover:text-purple-700 underline">Zerar Recargas</button> |
                <button onClick={() => setMonster(m => m ? ({ ...m, currentHp: 0 }) : null)} className="hover:text-red-700 underline">Kill Monster</button>
            </div>
          </div>
        )}

        {/* Battle Scene */}
        <div className="magic-frame p-6 md:p-8 flex justify-between items-end min-h-[260px]">
          {/* Player */}
          <div className="flex flex-col items-center z-10 w-2/5">
            <div className="w-full mb-3">
              <div className="flex justify-between items-end mb-1 leading-none text-white drop-shadow-md">
                <span className="text-xs md:text-sm font-bold title-text tracking-wider">Herói <span className="text-[10px]">(Nv.{player.level})</span></span>
                <span className="text-[10px] md:text-xs font-bold">{player.hp}/{player.maxHp}</span>
              </div>
              <div className="hp-track mb-1.5">
                <div className="hp-fill hp-player" style={{ width: `${(player.hp / player.maxHp) * 100}%` }}></div>
              </div>
              <div className="hp-track h-2">
                <div className="hp-fill xp-player-bar" style={{ width: `${(player.xp / player.maxXp) * 100}%` }}></div>
              </div>
              <div id="player-status" className="flex gap-1 justify-center mt-2 h-6">
                {player.statuses.map(s => (
                  <span key={s.type} className="relative inline-block mx-1 text-lg" title={STATUS_NAMES_PT[s.type]}>
                    {STATUS_ICONS[s.type]}
                    <span className="absolute -bottom-1 -right-1 text-[8px] font-sans font-bold bg-parchment rounded-full w-4 h-4 flex items-center justify-center text-ink-dark border border-ink-dark shadow-sm">{s.duration}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className={cn("idle-float text-7xl md:text-8xl transition-transform grayscale-[0.2] drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]", isAnimating && "anim-attack-p")}>🧙‍♂️</div>
          </div>

          <div className="title-text text-3xl md:text-5xl text-white font-black z-0 pb-12 opacity-30 italic drop-shadow-lg">VS</div>

          {/* Monster */}
          <div className="flex flex-col items-center z-10 w-2/5 relative">
            {monsterSpeech && (
              <div className="speech-bubble speech-show">
                <span>{monsterSpeech}</span>
              </div>
            )}

            <div className="w-full mb-3 text-center relative">
              {monster?.bonusActive && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-5xl text-yellow-400 animate-bounce z-30 font-black drop-shadow-md">!</div>
              )}
              
              <div className="flex justify-between items-end mb-1 leading-none text-white drop-shadow-md mt-6">
                <div className="relative group inline-block text-left z-40">
                  <span 
                    onClick={() => setShowJpName(!showJpName)}
                    className={cn("text-xs md:text-sm font-bold cursor-pointer border-b border-dashed title-text tracking-wider", monster?.color || "text-red-300")}
                  >
                    {monster?.name || '---'}
                  </span>
                  {showJpName && monster && (
                    <div className="jp-text absolute bottom-full left-1/2 -translate-x-1/2 text-[11px] mb-2 bg-black border border-gray-500 px-3 py-1.5 rounded shadow-lg whitespace-nowrap z-50 font-bold text-yellow-300 tracking-widest">
                      {monster.romaji} / {monster.kanji !== monster.kana ? monster.kanji : monster.kana}
                    </div>
                  )}
                </div>
                <span className="text-[10px] md:text-xs font-bold">
                  {monster ? `${monster.currentHp}/${monster.maxHp}` : '0/0'}
                </span>
              </div>
              <div className="hp-track mb-1.5">
                <div className="hp-fill hp-monster" style={{ width: monster ? `${(monster.currentHp / monster.maxHp) * 100}%` : '0%' }}></div>
              </div>
              <div id="monster-status" className="flex gap-1 justify-center mt-2 h-6">
                {monster?.statuses.map(s => (
                  <span key={s.type} className="relative inline-block mx-1 text-lg" title={STATUS_NAMES_PT[s.type]}>
                    {STATUS_ICONS[s.type]}
                    <span className="absolute -bottom-1 -right-1 text-[8px] font-sans font-bold bg-parchment rounded-full w-4 h-4 flex items-center justify-center text-ink-dark border border-ink-dark shadow-sm">{s.duration}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className={cn("idle-float text-7xl md:text-8xl transition-transform mt-1 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]", isAnimating && "anim-attack-m")}>
              {monster?.emoji || '❔'}
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="flex flex-col gap-4 relative z-20" ref={sparkContainerRef}>
          <div className="flex flex-col md:flex-row gap-5 items-center w-full">
            <div className="flex-1 w-full bg-white/40 p-3 rounded border border-ink-dark/10">
              <label htmlFor="answer-input" className="text-xs text-ink-red font-bold mb-1 block uppercase tracking-widest title-text">Ação (Romaji ou Kana):</label>
              <input 
                ref={inputRef}
                type="text" 
                id="answer-input" 
                autoComplete="off" 
                placeholder="Escreva o feitiço..." 
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
            
            <div className="flex gap-3 w-full md:w-auto justify-center">
              <button 
                onClick={submitAnswer}
                disabled={isAnimating || !inputVal}
                className="grimoire-btn btn-crimson text-sm md:text-base py-4 flex-1 md:flex-none disabled:opacity-50"
              >
                Conjurar
              </button>
              <button 
                onClick={() => setShowSpellbook(true)}
                className="grimoire-btn text-sm md:text-base py-4 flex items-center justify-center gap-2 flex-1 md:flex-none"
              >
                <span>📖</span> <span className="hidden sm:inline">Grimório</span>
              </button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mt-2">
            <div className="flex-1 p-3 bg-black/5 border border-black/10 rounded min-h-[50px] flex flex-wrap gap-2 items-center shadow-inner">
              {VOCABULARY.filter(v => player.level >= v.unlockLevel && (spellCooldowns[v.pt] || 0) > 0).length === 0 ? (
                <span className="text-ink-dark/60 italic text-xs font-bold">As energias estão serenas. Sem recargas.</span>
              ) : (
                VOCABULARY.filter(v => player.level >= v.unlockLevel && (spellCooldowns[v.pt] || 0) > 0).map(v => (
                  <span key={v.pt} className="bg-parchment border border-ink-dark/20 text-ink-dark px-2 py-1 rounded shadow-md text-[9px] md:text-[10px] font-bold">
                    {v.pt} <span className="text-ink-red ml-1">⏳{spellCooldowns[v.pt]}</span>
                  </span>
                ))
              )}
            </div>
            <BattleLog logs={logs} />
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
          title={player.hp <= 0 ? 'A Tinta Secou' : overlayData.title}
          desc={player.hp <= 0 ? 'As páginas da sua história fecharam-sem. Estude as suas anotações e reescreva o seu destino!' : overlayData.desc}
          score={player.monstersDefeated}
          level={player.level}
          onRestart={resetGame}
        />

      </div>
    </div>
  );
}
