import { Achievement, ACHIEVEMENTS_LIST } from '../achievements';

interface AchievementsModalProps {
  show: boolean;
  onClose: () => void;
  unlockedList?: string[];
}

export default function AchievementsModal({ show, onClose, unlockedList = [] }: AchievementsModalProps) {
  if (!show) return null;

  const totalUnlocked = unlockedList.length;
  const totalAchievements = ACHIEVEMENTS_LIST.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm shadow-inner transition-opacity">
      <div className="bg-[#f0e6d2] max-w-2xl w-full max-h-[80vh] flex flex-col rounded-xl overflow-hidden shadow-2xl border-[4px] border-[#8a7353] pixelated-border transform transition-transform">
        {/* Header */}
        <div className="bg-[#5c4a3d] text-[#f4eedc] p-4 flex justify-between items-center border-b-[4px] border-[#3b2f27]">
          <div>
            <h2 className="title-text text-xl uppercase tracking-widest font-black text-shadow-sm">Conquistas (実績)</h2>
            <p className="text-sm opacity-80 mt-1 font-bold">Desbloqueadas: {totalUnlocked} / {totalAchievements}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-[#f4eedc] hover:text-red-400 text-3xl leading-none font-bold p-2 transition-colors"
          >
            ×
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 bg-[#3b2f27] w-full">
          <div 
            className="h-full bg-gold transition-all duration-1000 ease-out"
            style={{ width: `${(totalUnlocked / totalAchievements) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto custom-scrollbar flex-1 bg-texture relative">
          <div className="absolute inset-0 bg-white/20 pointer-events-none"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            {ACHIEVEMENTS_LIST.map((ach) => {
              const isUnlocked = unlockedList.includes(ach.id);
              
              return (
                <div 
                  key={ach.id} 
                  className={`border-2 p-3 rounded flex gap-3 transition-colors ${
                    isUnlocked 
                      ? 'border-gold bg-[#e3cdb2] shadow-sm' 
                      : 'border-[#b8a691] bg-[#d9cdb8] opacity-60 grayscale'
                  }`}
                >
                  <div className="text-3xl flex-shrink-0 flex items-center">
                    {isUnlocked ? '🏆' : '🔒'}
                  </div>
                  <div>
                    <h4 className={`font-black title-text leading-tight ${isUnlocked ? 'text-[#5c4a3d]' : 'text-[#8a7353]'}`}>
                      {ach.name}
                    </h4>
                    <p className="text-xs text-[#5c4a3d] mt-1 leading-snug">
                      {ach.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
