import { motion, AnimatePresence } from 'motion/react';
import { Achievement } from '../achievements';

interface AchievementPopupProps {
  achievement: Achievement | null;
}

export function AchievementPopup({ achievement }: AchievementPopupProps) {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed top-4 right-4 z-[100] bg-white/90 border-2 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)] p-4 rounded-xl flex items-center gap-4 max-w-sm"
        >
          <div className="text-4xl">🏆</div>
          <div>
            <div className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-1">Conquista Desbloqueada!</div>
            <div className="font-bold text-gray-900 title-text text-sm">{achievement.name}</div>
            <div className="text-xs text-gray-600 mt-1 leading-snug">{achievement.description}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
