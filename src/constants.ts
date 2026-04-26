import { ElementType, StatusType } from './types';

export const ELEMENTS_INFO: Record<ElementType, { name: string; icon: string; color: string; bg: string; description: string }> = {
  fire: { name: 'Fogo', icon: '🔥', color: '#8b0000', bg: '#f9f3e5', description: 'Causa dano adicional ao longo do tempo (queimadura).' },
  water: { name: 'Água', icon: '🌊', color: '#1e3a8a', bg: '#f9f3e5', description: 'Fluxo contínuo, magias de ataque focadas.' },
  thunder: { name: 'Trovão', icon: '⚡', color: '#854d0e', bg: '#f9f3e5', description: 'Pode paralisar o inimigo, impedindo suas ações.' },
  wind: { name: 'Vento', icon: '🌪️', color: '#134e4a', bg: '#f9f3e5', description: 'Ataques rápidos e consistentes.' },
  nature: { name: 'Natureza', icon: '🌿', color: '#14532d', bg: '#f9f3e5', description: 'Ataques que podem usar veneno ou curar.' },
  physical: { name: 'Físico', icon: '⚔️', color: '#334155', bg: '#f9f3e5', description: 'Golpes marciais e poder cru. Pode causar sangramento.' },
  light: { name: 'Luz & Cura', icon: '✨', color: '#b45309', bg: '#f9f3e5', description: 'Magias focadas em cura, escudo e aumento de atributos.' },
  arcane: { name: 'Arcano', icon: '🔮', color: '#4c1d95', bg: '#f9f3e5', description: 'Magia pura, altera a realidade e causa alto dano.' },
  void: { name: 'Vazio & Tempo', icon: '🌌', color: '#312e81', bg: '#f9f3e5', description: 'Manipula o espaço-tempo para debuffs.' },
  utility: { name: 'Suporte', icon: '🌟', color: '#713f12', bg: '#f9f3e5', description: 'Magias focadas em purificar debuffs ou bônus.' },
  time: { name: 'Tempo', icon: '⏳', color: '#312e81', bg: '#f9f3e5', description: 'Altera o fluxo e as recargas das magias.' },
  music: { name: 'Música', icon: '🎵', color: '#4c1d95', bg: '#f9f3e5', description: 'Feitiços que causam status negativos e dano.' },
  earth: { name: 'Terra', icon: '🪨', color: '#57534e', bg: '#f9f3e5', description: 'Magias pesadas, de resistência, causar lentidão ou fraqueza.' },
  ice: { name: 'Gelo', icon: '❄️', color: '#0ea5e9', bg: '#f9f3e5', description: 'Pode congelar o alvo, impedindo a ação no turno.' },
  metal: { name: 'Metal', icon: '⚙️', color: '#71717a', bg: '#f9f3e5', description: 'Armas conjuradas, dano físico intenso.' },
  blood: { name: 'Sangue', icon: '🩸', color: '#991b1b', bg: '#f9f3e5', description: 'Sacrifícios ou feitiços necromânticos que sugam vida.' },
  cosmos: { name: 'Cosmos', icon: '🌌', color: '#1e1b4b', bg: '#f9f3e5', description: 'Feitiços de destruição massiva de alto nível.' }
};

export const STATUS_ICONS: Record<StatusType, string> = {
  burn: '🔥', bleed: '🩸', freeze: '❄️', paralyze: '⚡', weaken: '💧', shield: '🛡️', regen: '✨', poison: '🤢', blind: '👁️', silence: '🤐',
  hint: '💡', cleanse: '✨', reduce_cd: '⏳', force_bonus: '🎯', damage_buff: '💪'
};

export const STATUS_NAMES_PT: Record<StatusType, string> = {
  burn: 'Queimadura', bleed: 'Sangramento', freeze: 'Congelamento', paralyze: 'Paralisia', weaken: 'Fraqueza', shield: 'Escudo', regen: 'Regeneração', poison: 'Veneno', blind: 'Cegueira', silence: 'Selado',
  hint: 'Dica', cleanse: 'Purificação', reduce_cd: 'Recarga', force_bonus: 'Ponto Fraco', damage_buff: 'Aumento de Dano'
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
  'seal': { name: 'Selo do Conhecimento', type: 'status', effect: 'silence', duration: 4 },
  'silence_song': { name: 'Canção do Silêncio', type: 'status', effect: 'silence', duration: 2 },
  'heavy_strike': { name: 'Golpe Pesado', type: 'attack', mult: 1.8 },
  'void_gaze': { name: 'Olhar do Vazio', type: 'status', effect: 'weaken', duration: 4 },
  'freeze': { name: 'Nevasca', type: 'status', effect: 'freeze', duration: 2 },
  'corrupt': { name: 'Toque Corrupto', type: 'status', effect: 'poison', duration: 5 },
  'quake': { name: 'Terremoto', type: 'attack', mult: 1.5 },
  'tsunami': { name: 'Tsunami', type: 'attack', mult: 1.4 },
  'thunderstorm': { name: 'Tempestade de Raios', type: 'attack', mult: 1.6 },
  'tornado': { name: 'Tornado Destrutivo', type: 'attack', mult: 1.3 },
  'meteor': { name: 'Chuva de Meteoros', type: 'attack', mult: 2.5 },
  'light_ray': { name: 'Feixe de Luz', type: 'attack', mult: 1.2 },
  'mind_control': { name: 'Controle Mental', type: 'status', effect: 'paralyze', duration: 2 },
  'bleed_bite': { name: 'Mordida Profunda', type: 'status', effect: 'bleed', duration: 4 },
  'blood_rain': { name: 'Chuva de Sangue', type: 'lifesteal', mult: 1.5 },
  'time_stop': { name: 'Parar o Tempo', type: 'status', effect: 'freeze', duration: 3 },
  'acid_spit': { name: 'Cuspe Ácido', type: 'status', effect: 'weaken', duration: 5 },
  'inferno': { name: 'Inferno', type: 'status', effect: 'burn', duration: 6 },
  'frostbite': { name: 'Mordida Gélida', type: 'status', effect: 'freeze', duration: 1 },
  'earth_wall': { name: 'Parede de Terra', type: 'status', effect: 'shield', duration: 4 },
  'divine_shield': { name: 'Escudo Divino', type: 'status', effect: 'shield', duration: 5 },
  'dark_matter': { name: 'Matéria Escura', type: 'attack', mult: 2.2 },
  'solar_flare': { name: 'Erupção Solar', type: 'attack', mult: 1.9 },
  'lunar_eclipse': { name: 'Eclipse Lunar', type: 'status', effect: 'blind', duration: 4 },
  'venom_stinger': { name: 'Ferrão Venenoso', type: 'status', effect: 'poison', duration: 3 },
  'ghost_touch': { name: 'Toque Fantasma', type: 'status', effect: 'weaken', duration: 2 },
  'death_scythe': { name: 'Foice da Morte', type: 'attack', mult: 3.0 },
  'soul_drain': { name: 'Drenar Alma', type: 'lifesteal', mult: 2.0 },
  'illusion': { name: 'Ilusão', type: 'status', effect: 'blind', duration: 3 },
  'mirror_image': { name: 'Imagem Espelhada', type: 'status', effect: 'shield', duration: 2 },
  'roar': { name: 'Rugido Aterrorizante', type: 'status', effect: 'paralyze', duration: 1 },
  'sonic_boom': { name: 'Estrondo Sônico', type: 'attack', mult: 1.5 },
  'laser_beam': { name: 'Feixe de Laser', type: 'attack', mult: 1.7 },
  'crystal_prison': { name: 'Prisão de Cristal', type: 'status', effect: 'freeze', duration: 2 },
  'shadow_strike': { name: 'Golpe Sombrio', type: 'attack', mult: 1.4 },
  'holy_light': { name: 'Luz Sagrada', type: 'heal', mult: 0.5 },
  'demonic_aura': { name: 'Aura Demoníaca', type: 'status', effect: 'weaken', duration: 5 },
  'vampiric_bite': { name: 'Mordida Vampírica', type: 'lifesteal', mult: 1.2 },
  'toxic_spores': { name: 'Esporos Tóxicos', type: 'status', effect: 'poison', duration: 5 },
  'curse': { name: 'Maldição Profunda', type: 'status', effect: 'silence', duration: 3 },
  'nightmare': { name: 'Pesadelo', type: 'status', effect: 'weaken', duration: 4 }
};

export const SEQUENCE_BONUSES = [
  { id: 'fire_3', sequence: ['fire', 'fire', 'fire'], name: 'Erupção Carmesim', bonus: 'damage', mult: 1.5, msg: 'A chama se intensifica!' },
  { id: 'water_3', sequence: ['water', 'water', 'water'], name: 'Fluxo Eterno', bonus: 'heal', mult: 1.5, msg: 'As águas te purificam!' },
  { id: 'thunder_3', sequence: ['thunder', 'thunder', 'thunder'], name: 'Juízo do Relâmpago', bonus: 'paralyze', duration: 2, msg: 'O trovão ruge!' },
  { id: 'light_3', sequence: ['light', 'light', 'light'], name: 'Aura do Redentor', bonus: 'shield', duration: 5, msg: 'Uma luz divina te protege!' },
  { id: 'physical_3', sequence: ['physical', 'physical', 'physical'], name: 'Combo Devastador', bonus: 'damage', mult: 1.8, msg: 'Uma sequência de golpes perfeitos!' },
  { id: 'trinity', sequence: ['fire', 'water', 'thunder'], name: 'Trindade Elemental', bonus: 'damage', mult: 2.2, msg: 'O poder dos elementos converge!' },
  { id: 'nature_3', sequence: ['nature', 'nature', 'nature'], name: 'Dom da Floresta', bonus: 'regen', duration: 5, msg: 'A natureza pulsa em você!' },
  { id: 'fire_wind', sequence: ['fire', 'wind'], name: 'Tempestade de Chamas', bonus: 'damage', mult: 1.6, msg: 'O vento alimenta o incêndio!' },
  { id: 'water_ice', sequence: ['water', 'ice'], name: 'Nevasca Prateada', bonus: 'paralyze', duration: 1, msg: 'A água congela instantaneamente!' },
  { id: 'earth_physical', sequence: ['earth', 'physical'], name: 'Impacto Vulcânico', bonus: 'damage', mult: 1.7, msg: 'A terra treme sob seus pés!' },
  { id: 'light_arcane', sequence: ['light', 'arcane'], name: 'Iluminação Arcana', bonus: 'reduce_cd', msg: 'Conhecimento puro flui em sua mente!' },
];

export const MONSTER_REACTION_TRIGGERS = {
  elements: {
    fire: ['Que calor! Pare com isso!', 'Isso arde! 🔥', 'Vai me cozinhar?'],
    water: ['Estou ficando ensopado...', 'Onde está minha toalha?', 'Glub glub... para com a água!'],
    thunder: ['ZAP! Isso doeu!', 'Meus pelos estão arrepiados!', 'Ei! Cuidado com essa voltagem!'],
    void: ['Sinto... o nada...', 'Para onde foi minha sanidade?', 'Isso é... assustador.'],
  },
  statuses: {
    burn: ['Estou em chamas! Alguém me ajude!', 'Fogo! Fogo! 🔥'],
    poison: ['Sinto-me... enjoado...', 'O que tinha nessa poção? 🤢'],
    freeze: ['T-tão... f-frio...', 'Não consigo... me m-mexer...'],
  },
  hp: {
    lethal: ['Este é o meu fim...', 'Você... é forte demais...', 'Não me esqueça!'],
    half: ['Ainda não acabou!', 'Estou só começando!', 'Você luta bem...'],
  }
};
