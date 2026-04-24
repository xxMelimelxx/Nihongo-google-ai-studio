interface OverlayProps {
  show: boolean;
  title: string;
  desc: string;
  score: number;
  level: number;
  onRestart: () => void;
}

export default function Overlay({ show, title, desc, score, level, onRestart }: OverlayProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="grimoire-page !p-8 md:!p-12 text-center max-w-lg w-full">
        <div className="text-7xl mb-4">🖋️</div>
        <h2 className="title-text text-4xl md:text-5xl mb-4 text-ink-red font-black border-b-2 border-dashed border-ink-red inline-block pb-2 uppercase tracking-wide">
          {title}
        </h2>
        <p className="text-lg md:text-xl text-ink-dark mb-8 font-bold mt-4">
          {desc}
        </p>
        <div className="text-left bg-black/5 p-5 rounded border border-ink-dark/20 mb-8 text-base md:text-lg">
          <div className="font-bold text-ink-blue mb-2">Inimigos Derrotados: {score}</div>
          <div className="font-bold text-ink-green">Nível Alcançado: {level}</div>
        </div>
        <button 
          onClick={onRestart}
          className="grimoire-btn btn-crimson w-full py-4 text-lg"
        >
          Escrever Nova História
        </button>
      </div>
    </div>
  );
}
