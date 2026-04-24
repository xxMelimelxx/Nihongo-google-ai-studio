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
import { motion, AnimatePresence } from 'motion/react';
import { Player, Monster, Spell, LogEntry, StatusType, ElementType } from './types';
import { 
  STATUS_ICONS, 
  STATUS_NAMES_PT, 
  FLAVOR_WORDS, 
  ENEMY_SKILLS_POOL 
} from './constants';
import { VOCABULARY } from './vocabulary';
import { MONSTERS_LIST } from './monsters';
import { getMonsterVariation } from './monsterVariations';
import BattleLog from './components/BattleLog';
import Spellbook from './components/Spellbook';
import Overlay from './components/Overlay';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const HPBar = ({ current, max, colorClass, isMonster = false }: { current: number, max: number, colorClass?: string, isMonster?: boolean }) => {
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
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        {/* Main bar */}
        <motion.div 
          className={cn("absolute inset-0", colorClass || "bg-ink-dark")}
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4, ease: "circOut" }}
        />
      </div>
    </div>
  );
};

const SpellEffectOverlay = ({ element }: { element: ElementType | null }) => {
  if (!element) return null;
  
  const colors: Partial<Record<ElementType, string>> = {
    fire: 'bg-red-500/20',
    water: 'bg-blue-500/20',
    thunder: 'bg-yellow-400/30',
    wind: 'bg-emerald-300/20',
    nature: 'bg-green-600/20',
    physical: 'bg-stone-500/20',
    light: 'bg-white/40',
    arcane: 'bg-purple-600/30',
    void: 'bg-black/50',
    utility: 'bg-gray-400/10'
  };

  const icons: Partial<Record<ElementType, string>> = {
    fire: '🔥',
    water: '🌊',
    thunder: '⚡',
    wind: '🌪️',
    nature: '🌿',
    physical: '💥',
    light: '✨',
    arcane: '🔮',
    void: '🌌',
    utility: '🪄'
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn("absolute inset-0 z-40 flex items-center justify-center pointer-events-none", colors[element] || "bg-white/10")}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [1.5, 1], opacity: [1, 0.8] }}
        exit={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="text-[120px] filter drop-shadow-[0_0_20px_white]"
      >
        {icons[element] || '✨'}
      </motion.div>
    </motion.div>
  );
};

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
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [player, setPlayer] = useState<Player>(INITIAL_PLAYER);
  const [playerShake, setPlayerShake] = useState(false);
  const [monsterShake, setMonsterShake] = useState(false);
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
  const [activeEffect, setActiveEffect] = useState<ElementType | null>(null);
  
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
    // Variações agora são raras (apenas 20% de chance)
    const shouldHaveVariation = Math.random() < 0.2;
    const variation = shouldHaveVariation ? getMonsterVariation(template.name) : { name: template.name, translation: undefined };
    
    let newMonster: Monster = {
      ...template,
      name: variation.name,
      variationName: variation.name,
      variationTranslation: variation.translation,
      maxHp: template.hp,
      currentHp: template.hp,
      statuses: [],
      bonusActive: false,
    };

    // Aplicar buffs baseados na variação
    if (shouldHaveVariation) {
      const lowerName = variation.name.toLowerCase();
      if (lowerName.includes('rei') || lowerName.includes('ou') || lowerName.includes('grande') || lowerName.includes('colossal')) {
        newMonster.maxHp = Math.floor(newMonster.maxHp * 1.5);
        newMonster.currentHp = newMonster.maxHp;
        newMonster.attack = Math.floor(newMonster.attack * 1.2) + 1;
      } else if (lowerName.includes('grudento') || lowerName.includes('gosmento') || lowerName.includes('pedra') || lowerName.includes('couraçada')) {
        newMonster.maxHp = Math.floor(newMonster.maxHp * 1.3);
        newMonster.currentHp = newMonster.maxHp;
      } else if (lowerName.includes('暗黒') || lowerName.includes('sombrio') || lowerName.includes('trevas') || lowerName.includes('furioso') || lowerName.includes('assassino')) {
        newMonster.attack = Math.floor(newMonster.attack * 1.4) + 1;
      } else if (lowerName.includes('rápido') || lowerName.includes('saltador') || lowerName.includes('voador') || lowerName.includes('espectral')) {
        newMonster.attack = Math.floor(newMonster.attack * 1.2) + 1;
      } else if (lowerName.includes('venenoso') || lowerName.includes('tóxico') || lowerName.includes('peçonha')) {
        // Just thematic, maybe slight attack buff
        newMonster.attack = Math.floor(newMonster.attack * 1.1) + 1;
      }
    }

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
          if (isPlayer) {
            setPlayer(p => ({ ...p, hp: Math.max(0, p.hp - damageValue) }));
            setPlayerShake(true);
            setTimeout(() => setPlayerShake(false), 400);
          }
          else {
            setMonster(m => m ? ({ ...m, currentHp: Math.max(0, m.currentHp - damageValue) }) : null);
            setMonsterShake(true);
            setTimeout(() => setMonsterShake(false), 400);
          }
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
      setPlayerShake(true);
      setTimeout(() => setPlayerShake(false), 400);
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
      setMonsterShake(true);
      setTimeout(() => setMonsterShake(false), 400);
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
        setActiveEffect(finalSpell.element);
        setTimeout(() => setActiveEffect(null), 1000);
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
    const inputE = e.target as HTMLInputElement;
    const rect = inputE.getBoundingClientRect();
    const containerRect = sparkContainerRef.current.getBoundingClientRect();
    
    // Create 2-3 particles per keystroke for a richer effect
    const numParticles = Math.floor(Math.random() * 2) + 2;
    const colors = ['#fde047', '#60a5fa', '#f472b6', '#34d399', '#c084fc', '#ffffff'];

    for (let i = 0; i < numParticles; i++) {
       const sparkle = document.createElement('div');
       sparkle.innerHTML = ['✨', '⭐', '🪄', '✦', '✧', '✦'][Math.floor(Math.random() * 6)];
       sparkle.className = 'absolute pointer-events-none z-50 text-[10px] md:text-sm anim-sparkle';
       
       const color = colors[Math.floor(Math.random() * colors.length)];
       sparkle.style.color = color;
       sparkle.style.textShadow = `0 0 8px ${color}, 0 0 12px white`;
       
       const tx = (Math.random() - 0.5) * 120;
       const ty = -Math.random() * 80 - 10;
       
       // Add slight rotation
       const rot = (Math.random() - 0.5) * 180;
       sparkle.style.transform = `rotate(${rot}deg)`;
       
       sparkle.style.setProperty('--tx', `${tx}px`);
       sparkle.style.setProperty('--ty', `${ty}px`);
       
       // Position near the typing cursor (heuristically at the end or random)
       const isAtEnd = true; // simplifying
       const horizontalOffset = isAtEnd ? inputE.value.length * 8 : Math.random() * rect.width;
       const clampedOffset = Math.min(horizontalOffset, rect.width - 20) + 10;
       
       sparkle.style.left = `${clampedOffset + (rect.left - containerRect.left)}px`;
       sparkle.style.top = `${Math.random() * rect.height * 0.5 + (rect.top - containerRect.top)}px`;
       
       sparkContainerRef.current.appendChild(sparkle);
       setTimeout(() => sparkle.remove(), 800);
    }
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
    <div className="min-h-screen flex flex-col items-center p-2 md:py-12 md:px-8">
      {!gameStarted ? (
        <div className="grimoire-page my-auto shrink-0 flex flex-col items-center justify-center !p-12 max-w-xl w-full relative text-center">
            <h1 className="title-text text-4xl md:text-5xl font-bold tracking-widest text-ink-dark mb-8">COMO VOCÊ SE CHAMA?</h1>
            <input 
              type="text" 
              className="grimoire-input mb-8 !text-4xl"
              placeholder="Digite seu nome..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && playerName.trim()) {
                  setGameStarted(true);
                }
              }}
              autoFocus
            />
            <button 
              onClick={() => {
                if (playerName.trim()) setGameStarted(true);
              }}
              disabled={!playerName.trim()}
              className="grimoire-btn btn-crimson text-xl py-4 px-12 disabled:opacity-50"
            >
              INICIAR JORNADA
            </button>
        </div>
      ) : (
      <div className="grimoire-page my-auto shrink-0 flex flex-col md:flex-row !p-0 max-w-6xl w-full relative h-auto md:h-[700px] max-h-[95vh] md:max-h-[85vh]">
        <div className="grimoire-spine hidden md:block" />
        
        {/* LEFT PAGE - Battle Context */}
        <div className="flex-1 p-6 md:p-12 flex flex-col relative z-20 w-full md:w-1/2 overflow-y-auto md:overflow-hidden custom-scrollbar">
           {/* Header */}
           <div className="mb-6 border-b-2 border-ink-dark/30 pb-2 flex justify-between items-end">
             <div className="flex flex-col">
               <h1 className="title-text text-xl md:text-2xl font-bold tracking-widest text-ink-dark uppercase">AVENTURAS DE {playerName || 'O ESTUDANTE'}</h1>
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

           {/* Monster Area */}
           <div className="flex-1 flex flex-col items-center justify-center relative min-h-[160px] md:min-h-[200px]">
             <AnimatePresence>
               {activeEffect && (
                 <div key={activeEffect}>
                   <SpellEffectOverlay element={activeEffect} />
                 </div>
               )}
             </AnimatePresence>

             {monsterSpeech && (
                <div className="speech-bubble speech-show">
                  <span className="relative z-10">{monsterSpeech}</span>
                </div>
             )}
             
             {monster?.bonusActive && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-5xl text-ink-dark animate-bounce title-text opacity-50">!</div>
             )}
             
             <div className={cn("idle-float text-[100px] md:text-[120px] transition-transform drop-shadow-xl saturate-50", isAnimating && "anim-attack-m", monsterShake && "anim-damage")}>
                {monster?.emoji || '❔'}
             </div>
             
             <div className="w-full mt-6 flex flex-col">
                <div className="flex justify-between items-end mb-2">
                  <div className="relative group inline-block text-left z-40">
                     <span 
                       onClick={() => setShowJpName(!showJpName)}
                       className={cn("handwriting text-2xl md:text-3xl font-black cursor-pointer border-b border-dashed border-ink-dark/30 tracking-wide uppercase", monster?.color || "text-ink-dark")}
                     >
                       {monster?.variationName || monster?.name || '---'}
                     </span>
                     {showJpName && monster && (
                       <div className="jp-text absolute bottom-[120%] left-0 text-sm mb-2 bg-[#d3c4ad] border border-ink-dark/30 px-3 py-2 shadow-md whitespace-nowrap z-50 font-bold opacity-90 flex flex-col gap-1">
                         <span>{monster.romaji} / {monster.kanji !== monster.kana ? monster.kanji : monster.kana}</span>
                         {monster.variationTranslation && (
                           <span className="text-xs uppercase title-text border-t border-ink-dark/20 pt-1 mt-1">
                             {monster.variationTranslation}
                           </span>
                         )}
                       </div>
                     )}
                  </div>
                </div>
                
                <div className="mt-4 w-full">
                  <HPBar 
                    current={monster?.currentHp || 0} 
                    max={monster?.maxHp || 1} 
                    isMonster 
                    colorClass={monster?.color ? monster.color.replace('text-', 'bg-') : undefined} 
                  />
                </div>

                {monster?.statuses && monster.statuses.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
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
        <div className="flex-1 p-4 md:p-12 flex flex-col w-full md:w-1/2 border-t-2 border-ink-dark/30 md:border-t-0 md:border-l-2 h-full min-h-0">
            {/* Player Info Area */}
            <div className={cn("mb-6 pb-4 border-b-2 border-ink-dark/20 flex flex-col w-full transition-all flex-shrink-0", playerShake && "anim-damage")}>
              <div className="flex justify-between items-end w-full mb-4">
                <div className="flex flex-col">
                  <span className="font-bold uppercase tracking-widest title-text text-base text-ink-dark/90 leading-tight">
                    LV.{player.level} {playerName || 'O ESTUDANTE'}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-bold title-text text-[10px] text-ink-dark/60 uppercase text-right">Progresso</span>
                  <div className="w-20 h-1 border border-ink-dark/30 mt-1 p-[0.5px]">
                    <div className="h-full bg-ink-dark/40" style={{ width: `${(player.xp / player.maxXp) * 100}%`, borderRadius: 0 }}></div>
                  </div>
                </div>
              </div>
              
              <div className="w-full">
                <HPBar 
                    current={player.hp} 
                    max={player.maxHp} 
                    colorClass="bg-ink-dark/90" 
                />
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

            {/* Input Form */}
            <div className="flex flex-col gap-6 flex-shrink-0" ref={sparkContainerRef}>
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
            
            {/* Logs Area (Fills the remaining space) */}
            <div className="mt-8 pt-4 border-t-2 border-ink-dark/20 flex flex-col flex-1 min-h-[160px] overflow-hidden">
               <h3 className="title-text text-xs font-bold uppercase tracking-widest opacity-50 mb-2 truncate">Registro de Batalha (戦いの記録)</h3>
               <div className="flex-1 relative bg-ink-dark/5 border border-ink-dark/10 p-2 overflow-hidden flex-shrink-0 rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
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
      )}
    </div>
  );
}
