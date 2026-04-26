/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ElementType = 'fire' | 'water' | 'thunder' | 'wind' | 'nature' | 'physical' | 'light' | 'arcane' | 'void' | 'utility' | 'time' | 'music' | 'earth' | 'ice' | 'metal' | 'blood' | 'cosmos';

export type StatusType = 'burn' | 'bleed' | 'freeze' | 'paralyze' | 'weaken' | 'shield' | 'regen' | 'poison' | 'blind' | 'silence' | 'hint' | 'cleanse' | 'reduce_cd' | 'force_bonus' | 'damage_buff';

export interface StatusEffect {
  type: StatusType;
  duration: number;
}

export interface Spell {
  pt: string;
  romaji: string;
  kana: string;
  kanji: string;
  power: number;
  type: 'attack' | 'heal' | 'status' | 'utility';
  element: ElementType;
  unlockLevel: number;
  cooldown: number;
  currentCooldown: number;
  effect?: StatusType;
  effectChance?: number;
  effectDuration?: number;
  effectTarget?: 'enemy' | 'self';
  scaling?: 'low' | 'high';
}

export interface MonsterTemplate {
  name: string;
  romaji: string;
  kana: string;
  kanji: string;
  emoji: string;
  hp: number;
  attack: number;
  color: string;
  skills: string[];
  xpReward: number;
  isBoss?: boolean;
}

export interface Monster extends MonsterTemplate {
  maxHp: number;
  currentHp: number;
  statuses: StatusEffect[];
  bonusActive: boolean;
  isRare?: boolean;
  isShiny?: boolean;
  variationName?: string;
  variationTranslation?: string;
}

export interface Player {
  maxHp: number;
  hp: number;
  level: number;
  xp: number;
  maxXp: number;
  monstersDefeated: number;
  statuses: StatusEffect[];
  achievements: string[];
  discoveredCombos: string[];
}

export interface LogEntry {
  id: string;
  message: string;
  colorClass: string;
}
