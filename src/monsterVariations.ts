export function getMonsterVariation(baseName: string): { name: string; translation?: string } {
  const variations: Record<string, { name: string; translation?: string }[]> = {
    "Slime": [
      { name: "Slime, o grudento" },
      { name: "Jorge, o Slime" },
      { name: "Slime de Água Doce" },
      { name: "Pudim Mutante" },
      { name: "Slime Azedo" },
      { name: "Gota Colossal" },
      { name: "ベトベト (Betobeto)", translation: "O Pegajoso" },
      { name: "スライム太郎 (Slime Tarou)", translation: "Tarou, o Slime" },
      { name: "Slime Ancestral" },
      { name: "Geleia Amaldiçoada" }
    ],
    "Morcego": [
      { name: "Morcego da Noite Escura" },
      { name: "Vlad, o Morceguinho" },
      { name: "Morcego Míope" },
      { name: "Sugador de Tintas" },
      { name: "Aspirador Alado" },
      { name: "Morcego das Cavernas Uivantes" },
      { name: "ブラッドサッカー (Buraddosakkaa)", translation: "Sugador de Sangue" },
      { name: "夜の影 (Yoru no Kage)", translation: "Sombra da Noite" },
      { name: "Morcego Cego" },
      { name: "Asa da Perdição" }
    ],
    "Aranha": [
      { name: "Aranha Pernilonga" },
      { name: "Maria, a Aranha" },
      { name: "Tecedora de Pesadelos" },
      { name: "Aranha Saltadora" },
      { name: "Viúva Desolada" },
      { name: "Aranha Caçadora" },
      { name: "八本足 (Happon-ashi)", translation: "Oito Pernas" },
      { name: "毒蜘蛛 (Dokugumo)", translation: "Aranha Venenosa" },
      { name: "Aranha de Pelúcia Esquisita" },
      { name: "Senhora das Teias" }
    ],
    "Goblin": [
      { name: "Goblin Risonho" },
      { name: "Bob, o Saqueador" },
      { name: "Goblin da Faca Cega" },
      { name: "Guarda-Costas Goblin" },
      { name: "Goblin Mesquinho" },
      { name: "Atirador Cego" },
      { name: "緑の悪魔 (Midori no Akuma)", translation: "Demônio Verde" },
      { name: "ゴブリン王 (Goburin-ou)", translation: "Rei Goblin" },
      { name: "Goblin Sedento" },
      { name: "Ladrão de Ouro" }
    ]
  };

  const genericVariations = [
    { prefix: "", suffix: ", o Implacável" },
    { prefix: "Grande ", suffix: "" },
    { prefix: "", suffix: " Esfomeado" },
    { prefix: "Filhote de ", suffix: "" },
    { prefix: "Velho ", suffix: "" },
    { prefix: "", suffix: " de Sangue Mágico" },
    { prefix: "暗黒の (Ankoku no) ", suffix: "", translation: "Líder das Trevas {name}" },
    { prefix: "伝説の (Densetsu no) ", suffix: "", translation: "{name} Lendário" },
    { prefix: "", suffix: " Assustado" },
    { prefix: "Rei ", suffix: "" }
  ];

  if (variations[baseName]) {
    const list = variations[baseName];
    return list[Math.floor(Math.random() * list.length)];
  }

  // Fallback para outros monstros (10 combinações processadas)
  const genericList = genericVariations.map(gen => {
    let resultName = `${gen.prefix}${baseName}${gen.suffix}`;
    let resultTrans = gen.translation ? gen.translation.replace("{name}", baseName) : undefined;
    return { name: resultName, translation: resultTrans };
  });

  return genericList[Math.floor(Math.random() * genericList.length)];
}
