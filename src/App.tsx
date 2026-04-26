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
  ENEMY_SKILLS_POOL,
  SEQUENCE_BONUSES,
  MONSTER_REACTION_TRIGGERS,
  ELEMENTS_INFO
} from './constants';
import { getGenericFlavor, getMonsterFlavor } from './flavor';
import { VOCABULARY } from './vocabulary';
import { MONSTERS_LIST } from './monsters';
import { getMonsterVariation } from './monsterVariations';
import BattleLog from './components/BattleLog';
import Spellbook from './components/Spellbook';
import ComboNotes from './components/ComboNotes';
import { ACHIEVEMENTS_LIST, Achievement } from './achievements';
import { AchievementPopup } from './components/AchievementPopup';
import AchievementsModal from './components/AchievementsModal';
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
    fire: 'text-red-500',
    water: 'text-blue-500',
    thunder: 'text-yellow-400',
    wind: 'text-emerald-300',
    nature: 'text-green-600',
    physical: 'text-stone-500',
    light: 'text-amber-200',
    arcane: 'text-purple-600',
    void: 'text-indigo-900',
    utility: 'text-gray-400',
    earth: 'text-amber-900',
    ice: 'text-sky-300',
    metal: 'text-slate-400',
    blood: 'text-red-800',
    cosmos: 'text-violet-950',
    music: 'text-pink-500',
    time: 'text-cyan-600'
  };

  const icons: Partial<Record<ElementType, string>> = {
    fire: '🔥', water: '🌊', thunder: '⚡', wind: '🌪️', nature: '🌿', physical: '💥',
    light: '✨', arcane: '🔮', void: '🌌', utility: '🪄', earth: '🪨', ice: '❄️',
    metal: '⚙️', blood: '🩸', cosmos: '🪐', music: '🎶', time: '⏳'
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
    >
      <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />
      
      {/* Background radial glow */}
      <motion.div 
        className={cn("absolute w-64 h-64 rounded-full blur-3xl opacity-20", colors[element]?.replace('text', 'bg'))}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1.5, opacity: [0, 0.4, 0] }}
        transition={{ duration: 0.8 }}
      />

      <motion.div
        initial={{ scale: 0.8, y: 20, opacity: 0 }}
        animate={{ 
          scale: [1, 1.4, 1.2], 
          y: [20, -40, -60], 
          opacity: [0, 1, 1, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ duration: 1.2, times: [0, 0.2, 0.8, 1] }}
        className={cn("text-[100px] filter drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]", colors[element])}
      >
        {icons[element] || '✨'}
      </motion.div>

      {/* Decorative particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{ 
            x: (Math.random() - 0.5) * 300, 
            y: (Math.random() - 0.5) * 300, 
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0]
          }}
          transition={{ duration: 0.8, delay: i * 0.05 }}
          className={cn("absolute w-2 h-2 rounded-full", colors[element]?.replace('text', 'bg'))}
        />
      ))}
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
  achievements: [],
  discoveredCombos: [],
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
  const [showComboNotes, setShowComboNotes] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [overlayData, setOverlayData] = useState({ show: false, title: '', desc: '' });
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [monsterSpeech, setMonsterSpeech] = useState<string | null>(null);
  const [flavorUsage, setFlavorUsage] = useState<Record<string, number>>({});
  const [monsterInteractions, setMonsterInteractions] = useState<number>(0);
  const [showJpName, setShowJpName] = useState(false);
  const [spellCooldowns, setSpellCooldowns] = useState<Record<string, number>>({});
  const [comboCooldowns, setComboCooldowns] = useState<Record<string, number>>({});
  const [activeEffect, setActiveEffect] = useState<ElementType | null>(null);
  const [recentElements, setRecentElements] = useState<ElementType[]>([]);
  const recentElementsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearRecentElementsDelayed = useCallback(() => {
    if (recentElementsTimeoutRef.current) {
      clearTimeout(recentElementsTimeoutRef.current);
    }
    recentElementsTimeoutRef.current = setTimeout(() => {
      setRecentElements([]);
    }, 4000);
  }, []);

  useEffect(() => {
    if (recentElements.length > 0) {
      clearRecentElementsDelayed();
    }
    return () => {
      if (recentElementsTimeoutRef.current) clearTimeout(recentElementsTimeoutRef.current);
    };
  }, [recentElements, clearRecentElementsDelayed]);
  
  const [stats, setStats] = useState<any>({
    bossesDefeated: 0,
    spellsCast: { fire: 0, water: 0, thunder: 0, wind: 0, nature: 0, physical: 0, light: 0, arcane: 0, void: 0, earth: 0, ice: 0, metal: 0, blood: 0, cosmos: 0, music: 0, time: 0, utility: 0 },
    totalHeals: 0,
    shiniesDefeated: 0,
    deaths: 0,
    totalSpellsCast: 0,
    totalDamageDealt: 0,
    flawlessVictories: 0,
    totalBonusHits: 0,
    totalShields: 0,
    statusApplied: 0,
    statusCleansed: 0,
    oneShots: 0,
    consecutiveHits: 0,
    godDefeated: 0,
  });
  const [achievementQueue, setAchievementQueue] = useState<any[]>([]);

  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const showMonsterSpeech = (text: string, duration: number = 8000) => {
    setMonsterSpeech(text);
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }
    speechTimeoutRef.current = setTimeout(() => {
      setMonsterSpeech(null);
    }, duration);
  };
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  const enforceFocus = useCallback(() => {
    if (!showSpellbook && gameStarted) {
      // Small delays help ensure DOM is ready and previous events finished
      setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
    }
  }, [showSpellbook, gameStarted]);

  useEffect(() => {
    enforceFocus();
  }, [enforceFocus, monster, isAnimating]);

  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    if (achievementQueue.length > 0 && !currentAchievement) {
      const next = achievementQueue[0];
      setCurrentAchievement(next);
      setAchievementQueue(prev => prev.slice(1));
    }
  }, [achievementQueue, currentAchievement]);

  const achievementTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentAchievement) {
      if (achievementTimeoutRef.current) clearTimeout(achievementTimeoutRef.current);
      achievementTimeoutRef.current = setTimeout(() => {
        setCurrentAchievement(null);
      }, 5000); // 5 seconds
    }
    return () => {
      if (achievementTimeoutRef.current) clearTimeout(achievementTimeoutRef.current);
    };
  }, [currentAchievement]);

  const closeAchievement = useCallback(() => {
    if (achievementTimeoutRef.current) clearTimeout(achievementTimeoutRef.current);
    setCurrentAchievement(null);
  }, []);

  const checkAchievements = useCallback((p: Player, m?: Monster | null, s?: any) => {
    const newlyUnlocked: Achievement[] = [];
    ACHIEVEMENTS_LIST.forEach(ach => {
      if (!p.achievements.includes(ach.id)) {
        try {
          if (ach.condition(p, m, s)) {
            newlyUnlocked.push(ach);
          }
        } catch (e) {
          // ignore error if condition fails safely
        }
      }
    });

    if (newlyUnlocked.length > 0) {
      setPlayer(prev => ({ ...prev, achievements: [...prev.achievements, ...newlyUnlocked.map(a => a.id)] }));
      setAchievementQueue(prev => [...prev, ...newlyUnlocked]);
    }
  }, []);

  const sparkContainerRef = useRef<HTMLDivElement>(null);
  const battleIdRef = useRef(0);

  const loadAutoSave = () => {
    try {
      const data = localStorage.getItem('typspell_save_auto');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.player) {
          battleIdRef.current += 1;
          setIsAnimating(false);
          setPlayer({ ...INITIAL_PLAYER, ...parsed.player });
          setPlayerName(parsed.playerName || '');
          setMonsterIndex(parsed.monsterIndex || 0);
          spawnMonster(parsed.monsterIndex || 0);
          setGameStarted(true);
        }
      }
    } catch(e) {
      console.error(e);
    }
  };

  // Initialize first monster
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const data = localStorage.getItem('typspell_save_auto');
      if (data) {
         // show load modal or directly load? Auto-load might be jarring if they want new game.
         // For now, load auto save automatically if exists and has progress.
         loadAutoSave();
      } else {
         spawnMonster(0);
         inputRef.current?.focus();
         addLog('Um Slime materializou-se!', 'text-ink-green');
         addLog('Prepare o seu encantamento...', 'text-ink-dark/60 italic');
      }
    }
  }, []);
  
  useEffect(() => {
    inputRef.current?.focus();
  }, [monster]);

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
    // Variações agora são raras (apenas 5% de chance)
    const shouldHaveVariation = Math.random() < 0.05;
    const variation = shouldHaveVariation ? getMonsterVariation(template.name) : { name: template.name, translation: undefined };
    
    // Shiny chance (10%)
    const isShiny = Math.random() < 0.1;

    setMonsterInteractions(0);

    let newMonster: Monster = {
      ...template,
      name: variation.name,
      variationName: variation.name,
      variationTranslation: variation.translation,
      maxHp: template.hp,
      currentHp: template.hp,
      statuses: [],
      bonusActive: false,
      isShiny: isShiny
    };

    if (isShiny) {
      newMonster.maxHp = Math.floor(newMonster.maxHp * 1.5);
      newMonster.currentHp = newMonster.maxHp;
    }

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
    
    if (newMonster.isShiny) {
      addLog(`✨ Um ${newMonster.name} cintilante apareceu!`, 'text-yellow-600 font-bold');
    }
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
    const startBattleId = battleIdRef.current;
    const entity = isPlayer ? player : monster;
    if (!entity || entity.statuses.length === 0) return canAct;

    const statusesToProcess = [...entity.statuses];
    for (const status of statusesToProcess) {
      if (startBattleId !== battleIdRef.current) return canAct;
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
    const startBattleId = battleIdRef.current;
    if (currentM.currentHp <= 0 || currentP.hp <= 0) return;

    const canAct = await processStatuses(false);
    if (!canAct || startBattleId !== battleIdRef.current) return;

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
    if (startBattleId !== battleIdRef.current) return;

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
      setPlayer(p => {
        const nextHp = Math.max(0, p.hp - damage);
        if (nextHp <= 0 && p.hp > 0) {
           setStats(s => {
             const nextStats = { ...s, deaths: s.deaths + 1 };
             setTimeout(() => {
               setPlayer(updatedP => {
                 setStats(updatedS => {
                   checkAchievements(updatedP, currentM, updatedS);
                   return updatedS;
                 });
                 return updatedP;
               });
             }, 500);
             return nextStats;
           });
           localStorage.removeItem('typspell_save_auto'); // Optional: reset save or not? Actually no need to clear save, they can reload.
        }
        return { ...p, hp: nextHp };
      });
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

  const executePlayerAction = async (spell: Spell, isBonus: boolean, startBattleId?: number, elementsOverwrite?: ElementType[]) => {
    if (!monster) return;
    
    // Process recent elements for sequence bonuses
    const baseElements = elementsOverwrite || recentElements;
    const newRecentElements = [...baseElements, spell.element].slice(-3);
    
    // If it was a forced overwrite or a full combo was found, we might want to clear or update
    setRecentElements(elementsOverwrite ? [] : newRecentElements);

    let currentDmgDealt = 0;
    let currentHealDone = 0;
    let didOneShot = false;
    let sequenceBonus = null;

    // Check for sequence bonus (from longest possible to shortest)
    const maxComboLen = 3;
    for (let len = maxComboLen; len >= 2; len--) {
      if (newRecentElements.length >= len) {
        const currentSlice = newRecentElements.slice(-len);
        sequenceBonus = SEQUENCE_BONUSES.find(sb => {
          if (sb.sequence.length !== len) return false;
          
          // Check combo cooldown
          if ((comboCooldowns[sb.id] || 0) > 0) return false;

          // Special case for Trinity (unordered)
          if (sb.id === 'trinity') {
            return ['fire', 'water', 'thunder'].every(needed => currentSlice.includes(needed as ElementType));
          }
          
          // Ordered match
          return sb.sequence.every((el, i) => el === currentSlice[i]);
        });
        
        if (sequenceBonus) break;
      }
    }

    if (sequenceBonus) {
      addLog(`✨ COMBO: 【${sequenceBonus.name}】! ${sequenceBonus.msg}`, 'text-purple-600 font-bold text-lg animate-pulse');
      
      // COMBO DELAY for impact
      await delay(600);

      // Set combo cooldown (increased as requested)
      const baseCd = sequenceBonus.sequence.length === 2 ? 8 : 15;
      setComboCooldowns(prev => ({ ...prev, [sequenceBonus.id]: baseCd }));

      if (sequenceBonus.bonus === 'damage') { /* handled via mult below */ }
      if (sequenceBonus.bonus === 'heal') { /* handled via mult below */ }
      if (sequenceBonus.bonus === 'paralyze') applyStatus('monster', 'paralyze', sequenceBonus.duration || 1);
      if (sequenceBonus.bonus === 'shield') applyStatus('player', 'shield', sequenceBonus.duration || 3);
      if (sequenceBonus.bonus === 'regen') applyStatus('player', 'regen', sequenceBonus.duration || 3);
      if (sequenceBonus.bonus === 'reduce_cd') {
        setSpellCooldowns({}); // Correctly resets cooldowns in state
        addLog(`As recargas de todas as magias foram zeradas!`, 'text-blue-500 font-bold');
      }

      // Record Discovery
      if (!player.discoveredCombos.includes(sequenceBonus.id)) {
        setPlayer(p => ({ ...p, discoveredCombos: [...p.discoveredCombos, sequenceBonus.id] }));
      }

      // Clear energy after a combo is triggered normally
      setRecentElements([]);
    }

    setStats(prev => {
      const nextStats = { ...prev };
      nextStats.totalSpellsCast += 1;
      nextStats.spellsCast[spell.element] = (nextStats.spellsCast[spell.element] || 0) + 1;
      if (isBonus) nextStats.totalBonusHits += 1;
      return nextStats;
    });

    if (spell.type === 'heal') {
      let healMult = (isBonus ? 2 : 1);
      if (sequenceBonus?.bonus === 'heal') healMult *= sequenceBonus.mult || 1.5;
      const heal = Math.floor((spell.power + (player.level * 40)) * healMult);
      currentHealDone = heal;
      setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + heal) }));
      addLog(`Recuperou ${heal} de vitalidade!`, 'text-ink-green font-bold');
      
      setStats(prev => ({ ...prev, totalHeals: prev.totalHeals + 1 }));
    } else if (spell.type === 'attack') {
      let dmg = spell.power + (spell.scaling === 'low' ? player.level * 5 : player.level * player.level * 6);
      if (player.statuses.some(s => s.type === 'weaken')) dmg *= 0.5;
      if (player.statuses.some(s => s.type === 'damage_buff')) dmg *= 1.5;
      if (monster.statuses.some(s => s.type === 'shield')) dmg *= 0.5;
      
      let dmgMult = (isBonus ? 2 : 1);
      if (sequenceBonus?.bonus === 'damage') dmgMult *= sequenceBonus.mult || 1.5;
      dmg *= dmgMult;
      
      dmg = Math.floor(dmg);
      currentDmgDealt = dmg;
      if (dmg >= monster.maxHp && monster.currentHp === monster.maxHp) {
        didOneShot = true;
      }

      setMonster(m => m ? ({ ...m, currentHp: Math.max(0, m.currentHp - dmg) }) : null);
      setMonsterShake(true);
      setTimeout(() => setMonsterShake(false), 400);
      addLog(`Impacto brutal de ${dmg} dano!`, 'font-bold');
      
      // HP Reactions
      if (monster.currentHp > monster.maxHp * 0.5 && (monster.currentHp - dmg) <= monster.maxHp * 0.5) {
        showMonsterSpeech(MONSTER_REACTION_TRIGGERS.hp.half[Math.floor(Math.random() * MONSTER_REACTION_TRIGGERS.hp.half.length)]);
      } else if ((monster.currentHp - dmg) <= 0) {
        showMonsterSpeech(MONSTER_REACTION_TRIGGERS.hp.lethal[Math.floor(Math.random() * MONSTER_REACTION_TRIGGERS.hp.lethal.length)]);
      }
      
      // Monster Reaction to Element
      const elementReactions = (MONSTER_REACTION_TRIGGERS.elements as any)[spell.element];
      if (elementReactions && Math.random() < 0.5) {
        showMonsterSpeech(elementReactions[Math.floor(Math.random() * elementReactions.length)]);
      }

      setStats(prev => ({ ...prev, totalDamageDealt: prev.totalDamageDealt + dmg }));
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
        setStats(prev => ({ ...prev, statusCleansed: prev.statusCleansed + 1 }));
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
      if (spell.effect === 'shield') {
         setStats(prev => ({ ...prev, totalShields: prev.totalShields + 1 }));
      }
      if (Math.random() < (spell.effectChance || 1)) {
        if (spell.effectTarget === 'self') {
          applyStatus('player', spell.effect, spell.effectDuration || 2);
        } else {
          applyStatus('monster', spell.effect, spell.effectDuration || 2);
          setStats(prev => ({ ...prev, statusApplied: prev.statusApplied + 1 }));
          
          // Reaction to Status
          const statusReactions = (MONSTER_REACTION_TRIGGERS.statuses as any)[spell.effect];
          if (statusReactions && Math.random() < 0.7) {
            showMonsterSpeech(statusReactions[Math.floor(Math.random() * statusReactions.length)]);
          }
        }
      }
    }

    // Call achievements async after state updates
    setTimeout(() => {
      setPlayer(updatedP => {
        setStats(updatedS => {
           checkAchievements(updatedP, monster, updatedS);
           return updatedS;
        });
        return updatedP;
      });
    }, 100);

    await delay(1000);
    if (startBattleId !== undefined && startBattleId !== battleIdRef.current) return;

    // Check if monster dies
    setMonster(m => {
       if (m && m.currentHp <= 0) {
           const reward = m.xpReward;
           addLog(`Riscou o inimigo! Derrotou o ${m.name}!`, 'text-ink-blue font-bold text-lg');
           addLog(`Absorveu +${reward} XP!`, 'text-ink-dark/60 font-bold');
           
           if (didOneShot) {
             setStats(prev => ({ ...prev, oneShots: prev.oneShots + 1 }));
           }

           setPlayer(p => {
             let newP = { ...p, xp: p.xp + reward, monstersDefeated: p.monstersDefeated + 1 };
             while (newP.xp >= newP.maxXp && newP.level < 40) {
                newP = handleLevelUp(newP);
             }
             return newP;
           });

           setStats(prev => {
             const nextStats = { ...prev };
             if (m.isBoss) nextStats.bossesDefeated += 1;
             if (m.isShiny) nextStats.shiniesDefeated += 1;
             if (m.index >= MONSTERS_LIST.length - 1) nextStats.godDefeated += 1;
             if (player.hp === player.maxHp) nextStats.flawlessVictories += 1;
             return nextStats;
           });

           // Final achievement check for monster death
           setTimeout(() => {
             setPlayer(updatedP => {
               setStats(updatedS => {
                 checkAchievements(updatedP, m, updatedS);
                 return updatedS;
               });
               return updatedP;
             });
           }, 500);

            setTimeout(() => {
              setPlayer(latestP => {
                  setMonsterIndex(idx => {
                    const nextIdx = idx + 1;
                    spawnMonster(nextIdx);
                    // AUTO SAVE AT THE EXACT MOMENT OF NEXT MONSTER
                    localStorage.setItem('typspell_save_auto', JSON.stringify({
                       player: latestP,
                       playerName,
                       monsterIndex: nextIdx,
                    }));
                    return nextIdx;
                  });
                  return latestP;
              });
            }, 1000);
            return null;
       }
       return m;
    });
  };

  const submitAnswer = async () => {
    if (isAnimating || !monster) return;
    
    const currentBattleId = battleIdRef.current;

    const rawVal = inputVal.trim().toLowerCase();
    const val = rawVal.replace(/\s+/g, '');
    if (!val) return;

    const genericResponse = getGenericFlavor(val, flavorUsage[val] || 0);

    if (genericResponse) {
      setFlavorUsage(prev => ({ ...prev, [val]: (prev[val] || 0) + 1 }));
      showMonsterSpeech(genericResponse);
      setInputVal('');
      return;
    }

    setIsAnimating(true);
    setInputVal('');

    const isPortugueseAttempt = VOCABULARY.find(v => {
      if (player.level < v.unlockLevel) return false;
      return val === v.pt.toLowerCase().replace(/\s+/g, '');
    });

    if (isPortugueseAttempt) {
      addLog(`A magia só responde ao idioma divino (Japonês)! O feitiço falhou!`, 'text-ink-red font-bold');
      
      let customSpeech = "Língua errada!";
      const mName = monster.name.toLowerCase();
      if (mName.includes('slime')) customSpeech = "Puu? Não entendo! Só sei pular!";
      else if (mName.includes('goblin')) customSpeech = "Hahaha! O mago não sabe enrolar a língua!";
      else if (mName.includes('lobo')) customSpeech = "Grrr... Suas palavras soam como miados!";
      else if (mName.includes('esqueleto')) customSpeech = "*sons de ossos batendo* Idioma fútil!";
      else if (mName.includes('fogo') || mName.includes('chama')) customSpeech = "Seu sotaque não queima nada!";
      else if (mName.includes('gélido') || mName.includes('gelo')) customSpeech = "Muito simples... Suas palavras congelam antes de agir.";
      else if (mName.includes('golem') || mName.includes('pedra')) customSpeech = "Sons... macios... não quebram pedra.";
      else if (mName.includes('cultista') || mName.includes('sombra')) customSpeech = "Tolo! O abismo ignora a língua dos vermes!";
      else if (mName.includes('demônio') || mName.includes('lorde')) customSpeech = "Patético! Esperava me desafiar com esse vocabulário raso?";
      else customSpeech = "Hahaha! Tente falar o idioma da magia, mortal!";

      showMonsterSpeech(customSpeech);
      setStats(s => ({ ...s, consecutiveHits: 0 }));
      await delay(1200);
      await monsterTurnLogic(monster, player);
      setIsAnimating(false);
      return;
    }

    const spell = VOCABULARY.find(v => {
      if (player.level < v.unlockLevel) return false;
      const r = v.romaji.replace(/\s+/g, '');
      return val === r || val === v.kana || val === v.kanji || wanakana.toHiragana(val) === v.kana;
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
      // Check if it was a multi-word sequence (potential combo)
      const parts = rawVal.split(/\s+/).filter(p => p.length > 0);
      if (parts.length > 1) {
        const potentialSpells = parts.map(p => {
          return VOCABULARY.find(v => {
            if (player.level < v.unlockLevel) return false;
            const r = v.romaji.replace(/\s+/g, '');
            return p === r || p === v.kana || p === v.kanji || wanakana.toHiragana(p) === v.kana;
          });
        }).filter(s => s !== undefined) as Spell[];

        if (potentialSpells.length >= 2) {
          const elementsSequence = potentialSpells.map(s => s.element);
          const combo = SEQUENCE_BONUSES.find(sb => {
             if (sb.sequence.length !== elementsSequence.length) return false;
             if (sb.id === 'trinity' && elementsSequence.length === 3) {
               return ['fire', 'water', 'thunder'].every(needed => elementsSequence.includes(needed as any));
             }
             return sb.sequence.every((el, i) => el === elementsSequence[i]);
          });

          if (combo) {
            // SUCCESSFUL INSTANT COMBO!
            addLog(`VOCÊ DESPERTOU UM COMBO INSTANTÂNEO!`, 'text-purple-600 font-bold text-lg');
            
            // Artificial delay to build tension
            setIsAnimating(true);
            await delay(800);

            // Prepare elements for executePlayerAction
            const allButLast = potentialSpells.slice(0, -1).map(s => s.element);
            const lastSpell = potentialSpells[potentialSpells.length - 1];
            
            setActiveEffect(lastSpell.element);
            setTimeout(() => setActiveEffect(null), 1000);
            
            // Cast the last spell but with the specific element sequence
            await executePlayerAction(lastSpell, isBonus, currentBattleId, allButLast);
            
            if (monster && monster.currentHp > 0) {
              await monsterTurnLogic(monster, player);
            }
            
            setIsAnimating(false);
            setRecentElements([]); // Reset energy after big combo
            inputRef.current?.focus();
            return;
          } else {
            // FAILED COMBO - Monster laughs, no turn loss
            addLog(`A combinação de magias não ressoou...`, 'text-ink-dark/60 italic font-bold');
            
            const laughs = [
              "Hahaha! O que foi isso? Uma dança?",
              "Você tropeçou nas próprias palavras! 😂",
              "Mestre das trapalhadas! Os elementos te ignoram.",
              "Pfff... achei que veria algo real agora.",
              "Giro, giro... e nada! Hahaha!",
              "Suas palavras tropeçam uma na outra! Patético!",
              "Tentar dois ao mesmo tempo? Que ganância! Hahaha!",
              "Isso foi um combo ou um espirro? 😂",
              "Os deuses da magia estão rindo de você agora!",
              "Que bagunça! Organize seus pensamentos, mortal!"
            ];
            showMonsterSpeech(laughs[Math.floor(Math.random() * laughs.length)]);
            
            setInputVal('');
            setIsAnimating(false);
            setRecentElements([]); // Reset energy on failed attempt
            return; // Turn preserved!
          }
        }
      }
    }

    if (!finalSpell) {
      setStats(s => ({ ...s, consecutiveHits: 0 }));
      addLog(`Palavras incompreensíveis. O feitiço não se formou!`, 'text-ink-dark/60 italic font-bold');
      
      const mFlavor = getMonsterFlavor(monster.name, monsterInteractions);
      if (mFlavor && Math.random() < 0.6) {
        setMonsterInteractions(prev => prev + 1);
        showMonsterSpeech(mFlavor);
      }
      
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
        const extraTurns = Math.max(0, Math.floor((player.level - finalSpell.unlockLevel) / 2));
        next[finalSpell.pt] = finalSpell.cooldown + extraTurns;
      }
      return next;
    });

    setComboCooldowns(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        if (next[key] > 0) next[key]--;
      });
      return next;
    });

    await processStatuses(true);
    
    if (player.hp > 0) {
      let missChance = player.statuses.some(s => s.type === 'blind') ? 0.5 : 0.1;
      if (Math.random() < missChance) {
        addLog(`O feitiço dissipou-se no ar e falhou!`, 'text-ink-dark/60 font-bold');
        setStats(s => ({ ...s, consecutiveHits: 0 }));
      } else {
        setActiveEffect(finalSpell.element);
        setStats(s => ({ ...s, consecutiveHits: s.consecutiveHits + 1 }));
        setTimeout(() => setActiveEffect(null), 1000);
        await executePlayerAction(finalSpell, isBonus, currentBattleId);
      }
    }

    if (monster && monster.currentHp > 0) {
      await monsterTurnLogic(monster, player);
    }

    setIsAnimating(false);
    inputRef.current?.focus();
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
       
       // Position around the input box randomly
       sparkle.style.left = `${Math.random() * rect.width + (rect.left - containerRect.left)}px`;
       sparkle.style.top = `${Math.random() * rect.height + (rect.top - containerRect.top)}px`;
       
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
      <div 
        className="grimoire-page my-auto shrink-0 flex flex-col md:flex-row !p-0 max-w-6xl w-full relative h-auto md:h-[700px] max-h-[95vh] md:max-h-[85vh]"
        onClick={() => { if(!isAnimating && !showSpellbook) inputRef.current?.focus(); }}
      >
        <div className="grimoire-spine hidden md:block" />
        
        {/* LEFT PAGE - Battle Context */}
        <div className="flex-1 p-6 md:p-12 flex flex-col relative z-20 w-full md:w-1/2 overflow-y-auto md:overflow-hidden custom-scrollbar">
           {/* Header */}
           <div className="mb-6 border-b-2 border-ink-dark/30 pb-2 flex justify-between items-end">
             <div className="flex flex-col">
               <h1 className="title-text text-xl md:text-2xl font-bold tracking-widest text-ink-dark uppercase">AVENTURAS DE {playerName || 'O ESTUDANTE'}</h1>
               <span className="jp-text text-sm font-bold text-ink-red tracking-widest italic opacity-80">戦いの記録</span>
             </div>
             <div className="flex gap-2">
               <button 
                  disabled={isAnimating || player.hp <= 0}
                  onClick={() => setShowAchievements(true)} 
                  title="Conquistas"
                  className="text-xs md:text-sm font-bold opacity-80 hover:opacity-100 title-text transition-opacity flex items-center border border-yellow-700/50 px-3 py-1 rounded bg-yellow-100/50 hover:bg-yellow-200/50 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed text-yellow-900"
               >
                 <span className="text-lg">🏆</span>
               </button>
               <button 
                  disabled={isAnimating || player.hp <= 0}
                  onClick={() => { if (!isAnimating && player.hp > 0) setIsAdminOpen(!isAdminOpen) }} 
                  className="text-xs md:text-sm font-bold opacity-70 hover:opacity-100 uppercase title-text transition-opacity flex items-center gap-2 border border-ink-dark/30 px-3 py-1 rounded bg-[#ebd5b3] hover:bg-[#d8b88d] shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
               >
                  <span className="text-lg">⚙</span> SISTEMA
               </button>
             </div>
           </div>
           
           {/* Sistema / Menu */}
           {isAdminOpen && (
             <div className="absolute inset-0 z-50 bg-[#0a0a0a]/80 flex justify-center items-center backdrop-blur-sm p-4">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="bg-[#e0c9a3] w-full max-w-sm border-2 border-ink-dark shadow-[0_0_40px_rgba(44,27,24,0.6)] p-6 relative rounded-sm"
                 style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/aged-paper.png")' }}
               >
                 <div className="text-xl font-bold border-b-2 border-ink-dark/30 pb-3 flex justify-between mb-6 text-[#2c1b18]">
                     <span className="title-text justify-center uppercase tracking-widest text-center w-full">Configurações Base</span>
                     <button onClick={() => setIsAdminOpen(false)} className="absolute right-6 hover:text-red-900 text-2xl leading-none">×</button>
                 </div>
                 
                 <div className="mb-6">
                   <span className="text-sm uppercase font-bold title-text mb-3 block text-center border-b border-ink-dark/10 pb-1">Salvar Livro Mágico</span>
                   <div className="flex flex-col gap-2">
                     {[1, 2, 3].map(slot => {
                        const hasSave = localStorage.getItem(`typspell_save_${slot}`);
                        return (
                          <button key={slot} onClick={() => {
                            localStorage.setItem(`typspell_save_${slot}`, JSON.stringify({ player, playerName, monsterIndex }));
                            addLog(`Jogo salvo magicamente no slot ${slot}!`, 'text-blue-700');
                            setIsAdminOpen(false);
                          }} className="bg-ink-dark/5 hover:bg-ink-dark/20 text-sm title-text border border-ink-dark/30 px-3 py-2 text-left flex justify-between items-center group transition-colors">
                            <span>Espaço Mágico {slot}</span>
                            <span className="text-xs opacity-50 group-hover:opacity-100">{hasSave ? '(Substituir)' : '(Vazio)'}</span>
                          </button>
                        )
                     })}
                   </div>
                 </div>

                 <div className="mb-8">
                   <span className="text-sm uppercase font-bold title-text mb-3 block text-center border-b border-ink-dark/10 pb-1">Despertar Memória</span>
                   <div className="flex flex-col gap-2">
                     {[1, 2, 3].map(slot => {
                        const hasSave = localStorage.getItem(`typspell_save_${slot}`);
                        return (
                          <button key={slot} disabled={!hasSave} onClick={() => {
                            const data = localStorage.getItem(`typspell_save_${slot}`);
                            if (data) {
                              const parsed = JSON.parse(data);
                              if (parsed.player) {
                                battleIdRef.current += 1;
                                setIsAnimating(false);
                                setPlayer(parsed.player);
                                setPlayerName(parsed.playerName || '');
                                setMonsterIndex(parsed.monsterIndex || 0);
                                spawnMonster(parsed.monsterIndex || 0);
                                addLog(`Memória carregada do espaço ${slot}!`, 'text-blue-700');
                                setIsAdminOpen(false);
                              }
                            }
                          }} className={cn("text-sm title-text border px-3 py-2 text-left flex justify-between items-center transition-colors", hasSave ? "bg-ink-dark/5 hover:bg-ink-dark/20 border-ink-dark/30" : "opacity-30 border-ink-dark/10 cursor-not-allowed")}>
                            <span>Espaço Mágico {slot}</span>
                            <span className="text-xs opacity-50">{hasSave ? 'Carregar' : 'Vazio'}</span>
                          </button>
                        )
                     })}
                   </div>
                 </div>

                 {/* Secrets */}
                 <div className="text-[10px] font-bold uppercase title-text border-t border-ink-dark/20 pt-2 flex flex-wrap gap-2 justify-center opacity-30 hover:opacity-100 transition-opacity">
                     <span className="w-full text-center mb-1">Poderes Sombrios</span>
                     <button onClick={() => setPlayer(p => ({ ...p, level: Math.min(40, p.level + 1) }))} className="hover:text-ink-red">+1 Nível</button>
                     <button onClick={() => setPlayer(p => ({ ...p, xp: p.xp + 1000 }))} className="hover:text-ink-red">+1000 XP</button>
                     <button onClick={() => setPlayer(p => ({ ...p, hp: p.maxHp }))} className="hover:text-green-700">Curar</button>
                     <button onClick={() => setSpellCooldowns({})} className="hover:text-purple-700">0 Recargas</button>
                     <button onClick={() => setMonster(m => m ? ({ ...m, currentHp: 0 }) : null)} className="hover:text-red-700">Kill</button>
                 </div>
               </motion.div>
             </div>
           )}

           {/* Monster Area */}
           <div className={cn("flex-1 flex flex-col items-center justify-center relative min-h-[160px] md:min-h-[200px] rounded-lg transition-all", monster?.statuses.map(s => `status-${s.type}`).join(" "))}>
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
            <div className={cn("mb-2 pb-2 border-b-2 border-ink-dark/20 flex flex-col w-full transition-all flex-shrink-0 rounded-lg px-2", playerShake && "anim-damage", player.statuses.map(s => `status-${s.type}`).join(" "))}>
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
            <div className="flex flex-col gap-6 flex-shrink-0 relative" ref={sparkContainerRef}>
               {/* Spell Chain Indicator */}
                {recentElements.length > 0 && (
                <div className="absolute -top-20 left-0 right-0 flex flex-col items-center gap-1 pointer-events-none">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ink-dark/40 title-text">Fluxo Elemental</span>
                  <div className="flex justify-center gap-3">
                    <AnimatePresence mode="popLayout">
                      {recentElements.map((el, i) => (
                        <motion.div
                          key={`${i}-${el}`}
                          initial={{ scale: 0, y: 10, rotate: i % 2 === 0 ? -10 : 10 }}
                          animate={{ scale: 1, y: 0, rotate: 0 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className={cn(
                            "w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center text-lg md:text-2xl shadow-xl border-2 border-ink-dark/10 bg-white/80 backdrop-blur-md",
                            el === 'fire' ? 'text-red-600 shadow-red-500/20' : 
                            el === 'water' ? 'text-blue-600 shadow-blue-500/20' :
                            el === 'thunder' ? 'text-yellow-600 shadow-yellow-500/20' :
                            el === 'nature' ? 'text-green-600 shadow-green-500/20' :
                            el === 'light' ? 'text-amber-500 shadow-amber-500/20' :
                            el === 'void' ? 'text-indigo-900 shadow-indigo-900/20' : 'text-stone-600'
                          )}
                        >
                          {(ELEMENTS_INFO[el] as any)?.icon || '✨'}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

               <div className="flex flex-col">
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
                    className="grimoire-btn text-xs py-3 px-4 md:px-6 tracking-[2px] transition-all flex items-center gap-2"
                  >
                    📖 Grimório
                  </button>
                  <button 
                    onClick={() => setShowComboNotes(true)}
                    className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-[#e0c9a3] text-[#3b2a21] rounded shadow-[0_4px_10px_rgba(0,0,0,0.3)] border-2 border-[#3b2a21]/30 hover:scale-110 active:scale-95 transition-all outline-none group relative"
                    title="Anotações de Alquimia"
                  >
                    <span className="text-xl md:text-2xl">📜</span>
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 rounded-full border border-white flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                      {player.discoveredCombos.length}
                    </span>
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
            discoveredCombos={player.discoveredCombos}
            onOpenCombos={() => setShowComboNotes(true)}
            onClose={() => setShowSpellbook(false)}
          />
        )}

        <AnimatePresence>
          {showComboNotes && (
            <ComboNotes 
              discoveredCombos={player.discoveredCombos}
              onClose={() => setShowComboNotes(false)}
            />
          )}
        </AnimatePresence>

        <AchievementsModal 
          show={showAchievements}
          onClose={() => setShowAchievements(false)}
          unlockedList={player.achievements}
        />

        <Overlay 
          show={overlayData.show || player.hp <= 0}
          title={player.hp <= 0 ? 'FIM DA HISTÓRIA' : overlayData.title}
          desc={player.hp <= 0 ? 'As suas páginas fecharam-se...' : overlayData.desc}
          score={player.monstersDefeated}
          level={player.level}
          onRestart={resetGame}
        />
        
        <AchievementPopup 
          achievement={currentAchievement} 
          onClose={closeAchievement}
        />

      </div>
      )}
    </div>
  );
}
