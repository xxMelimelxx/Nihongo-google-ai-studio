import { motion, AnimatePresence } from 'motion/react';
import { Achievement } from '../achievements';

interface AchievementPopupProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export function AchievementPopup({ achievement, onClose }: AchievementPopupProps) {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
           layout
          initial={{ opacity: 0, x: 50, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          className="fixed top-4 right-4 z-[1000] bg-white/95 border-2 border-yellow-500 shadow-[0_10px_30px_rgba(234,179,8,0.4)] p-4 rounded-xl flex items-center gap-4 max-w-sm pointer-events-auto"
        >
          <div className="text-4xl shrink-0">🏆</div>
          <div className="flex-1 min-w-0 pr-6">
            <div className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest mb-0.5">Nova Conquista!</div>
            <div className="font-bold text-gray-900 title-text text-sm truncate">{achievement.name}</div>
            <div className="text-xs text-gray-500 mt-0.5 leading-tight line-clamp-2">{achievement.description}</div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors text-gray-400 hover:text-black"
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
