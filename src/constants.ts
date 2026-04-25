import { ElementType, StatusType } from './types';

export const ELEMENTS_INFO: Record<ElementType, { name: string; icon: string; color: string; bg: string }> = {
  fire: { name: 'Fogo', icon: '🔥', color: '#8b0000', bg: '#f9f3e5' },
  water: { name: 'Água & Gelo', icon: '❄️', color: '#1e3a8a', bg: '#f9f3e5' },
  thunder: { name: 'Trovão', icon: '⚡', color: '#854d0e', bg: '#f9f3e5' },
  wind: { name: 'Vento', icon: '🌪️', color: '#134e4a', bg: '#f9f3e5' },
  nature: { name: 'Natureza', icon: '🌿', color: '#14532d', bg: '#f9f3e5' },
  physical: { name: 'Físico', icon: '⚔️', color: '#334155', bg: '#f9f3e5' },
  light: { name: 'Luz & Cura', icon: '✨', color: '#b45309', bg: '#f9f3e5' },
  arcane: { name: 'Arcano', icon: '🔮', color: '#4c1d95', bg: '#f9f3e5' },
  void: { name: 'Vazio & Tempo', icon: '🌌', color: '#312e81', bg: '#f9f3e5' },
  utility: { name: 'Suporte', icon: '🌟', color: '#713f12', bg: '#f9f3e5' },
  time: { name: 'Tempo', icon: '⏳', color: '#312e81', bg: '#f9f3e5' },
  music: { name: 'Música', icon: '🎵', color: '#4c1d95', bg: '#f9f3e5' },
  earth: { name: 'Terra', icon: '🪨', color: '#57534e', bg: '#f9f3e5' },
  ice: { name: 'Gelo', icon: '❄️', color: '#0ea5e9', bg: '#f9f3e5' },
  metal: { name: 'Metal', icon: '⚙️', color: '#71717a', bg: '#f9f3e5' },
  blood: { name: 'Sangue', icon: '🩸', color: '#991b1b', bg: '#f9f3e5' },
  cosmos: { name: 'Cosmos', icon: '🌌', color: '#1e1b4b', bg: '#f9f3e5' }
};

export const STATUS_ICONS: Record<StatusType, string> = {
  burn: '🔥', bleed: '🩸', freeze: '❄️', paralyze: '⚡', weaken: '💧', shield: '🛡️', regen: '✨', poison: '🤢', blind: '👁️', silence: '🤐',
  hint: '💡', cleanse: '✨', reduce_cd: '⏳', force_bonus: '🎯'
};

export const STATUS_NAMES_PT: Record<StatusType, string> = {
  burn: 'Queimadura', bleed: 'Sangramento', freeze: 'Congelamento', paralyze: 'Paralisia', weaken: 'Fraqueza', shield: 'Escudo', regen: 'Regeneração', poison: 'Veneno', blind: 'Cegueira', silence: 'Selado',
  hint: 'Dica', cleanse: 'Purificação', reduce_cd: 'Recarga', force_bonus: 'Ponto Fraco'
};

export const FLAVOR_WORDS: Record<string, { t: string; r: string }> = {
  'baka': { t: 'Idiota', r: 'Quem você está chamando de idiota?! 💢' },
  'aho': { t: 'Estúpido', r: 'Olhe para você antes de falar! 🙄' },
  'shine': { t: 'Morra', r: 'Vem tentar a sorte! 🔪' },
  'kuso': { t: 'Droga', r: 'Frustrado? Que pena... 😈' },
  'nani': { t: 'O quê?', r: 'Isso mesmo que você ouviu! 🗣️' },
  'yamete': { t: 'Pare', r: 'Eu nunca vou parar! ⚔️' },
  'tasukete': { t: 'Socorro', r: 'Ninguém virá te salvar! 🕸️' },
  'kawaii': { t: 'Fofo', r: 'N-Não me chame de fofo! 😳' },
  'gomen': { t: 'Desculpa', r: 'É tarde demais para perdão! 🗡️' },
  'omae': { t: 'Você', r: 'Eu?! O que tem eu?! 🤨' },
  'dorobou': { t: 'Ladrão', r: 'Achado não é roubado! 🏃‍♂️💨' },
  'yowai': { t: 'Fraco', r: 'Vou te mostrar quem é o fraco! 💥' },
  'konnichiwa': { t: 'Olá', r: 'Não temos tempo para cumprimentos! ⚔️' },
  'arigatou': { t: 'Obrigado', r: 'Não agradeça por sua ruína! 💀' },
  'sayounara': { t: 'Adeus', r: 'Adeus para sempre, herói tolo! 👋' },
  'kakkoii': { t: 'Legal', r: 'Humph, eu sei que sou estiloso! 😎' },
  'sugoi': { t: 'Incrível', r: 'Impressionado com o meu poder?! 🌠' },
  'yabai': { t: 'Perigoso', r: 'Você que corre perigo real! ⚠️' },
  'kimoi': { t: 'Nojento', r: 'Olha para a sua cara! 🤮' },
  'uzai': { t: 'Irritante', r: 'Vou ser ainda mais irritante! 🦟' },
  'urusai': { t: 'Barulhento', r: 'VOU GRITAR MAIS ALTO! 📢' },
  'damare': { t: 'Cale-se', r: 'Me obrigue a calar a boca! 🤐' },
  'chotto': { t: 'Um pouco', r: 'Nem um segundo de pausa! ⏱️' },
  'matte': { t: 'Espere', r: 'Monstros não esperam! 🏃‍♂️' },
  'hayaku': { t: 'Rápido', r: 'Estou indo te destruir! 🌪️' },
  'nigero': { t: 'Fuja', r: 'Não há para onde fugir! 🚪🔒' },
  'kowai': { t: 'Assustador', r: 'Sinta o terror! 👻' },
  'itai': { t: 'Dói', r: 'Vai doer muito mais! 🩸' },
  'kurushii': { t: 'Doloroso', r: 'Sofra sob o meu poder! 😈' },
  'sumimasen': { t: 'Com licença', r: 'Sem licença para fracos! 🛑' },
  'muda': { t: 'Inútil', r: 'MUDA MUDA MUDA! 👊' },
  'zako': { t: 'Lixo', r: 'Eu sou a elite das trevas! 👑' }
};

export const ENEMY_SKILLS_POOL: Record<string, any> = {
  'heal': { name: 'Cura Regenerativa', type: 'heal', mult: 0.2 }, 
  'burn': { name: 'Sopro de Fogo', type: 'status', effect: 'burn', duration: 3 },
  'poison': { name: 'Névoa Venenosa', type: 'status', effect: 'poison', duration: 4 },
  'paralyze': { name: 'Olhar Eletrizante', type: 'status', effect: 'paralyze', duration: 1 },
  'weaken': { name: 'Fraqueza', type: 'status', effect: 'weaken', duration: 3 },
  'shield': { name: 'Pele de Ferro', type: 'status', effect: 'shield', duration: 3 },
  'lifesteal': { name: 'Drenar Vida', type: 'lifesteal', mult: 1.0 }, 
  'critical': { name: 'Ataque Brutal', type: 'attack', mult: 2.0 }, 
  'summon': { name: 'Lacaio', type: 'summon', mult: 0.3 }, 
  'blind': { name: 'Cegueira', type: 'status', effect: 'blind', duration: 2 },
  'seal': { name: 'Selo do Conhecimento', type: 'status', effect: 'silence', duration: 4 }
};
