import { motion, AnimatePresence } from 'motion/react';
import { SEQUENCE_BONUSES, ELEMENTS_INFO } from '../constants';
import { ElementType } from '../types';

interface ComboNotesProps {
  discoveredCombos: string[];
  onClose: () => void;
}

export default function ComboNotes({ discoveredCombos, onClose }: ComboNotesProps) {
  const combos = SEQUENCE_BONUSES.filter(sb => discoveredCombos.includes(sb.id));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20, rotate: -2 }}
        animate={{ scale: 1, y: 0, rotate: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#fdf6e3] w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl relative border-[12px] border-[#3b2a21] rounded-sm p-6 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 0 0 4px #e0c9a3, 0 20px 50px rgba(0,0,0,0.5)',
          backgroundImage: 'radial-gradient(#00000010 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      >
        {/* Notebook Spiral Decoration */}
        <div className="absolute left-4 top-0 bottom-0 flex flex-col justify-around py-4 pointer-events-none">
          {[...Array(12)].map((_, i) => (
             <div key={i} className="w-6 h-3 bg-gradient-to-r from-gray-400 to-gray-200 rounded-full border border-gray-500 -ml-8 shadow-sm" />
          ))}
        </div>

        <div className="flex justify-between items-start border-b-2 border-gray-300 pb-2 mb-4 ml-4">
          <div>
            <h2 className="title-text text-2xl font-bold text-ink-dark uppercase tracking-tighter">Anotações de Alquimia</h2>
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Combinações Elementais Descobertas</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 ml-4 custom-scrollbar">
          {combos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-40 py-10">
              <span className="text-5xl mb-4">✍️</span>
              <p className="title-text font-bold italic">Nenhum combo foi registrado ainda...</p>
              <p className="text-[10px] mt-2 max-w-[200px]">Experimente usar feitiços de elementos diferentes em sequência curta para descobrir novos efeitos!</p>
            </div>
          ) : (
            <div className="space-y-6 pb-6">
              {combos.map((combo) => (
                <motion.div 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  key={combo.id}
                  className="relative group bg-white/20 p-4 border-l-4 border-purple-500 rounded-r-lg"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="title-text text-lg font-bold text-purple-900 uppercase">{combo.name}</span>
                    <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">NOVO</span>
                  </div>
                  
                  <div className="flex gap-2 mb-3">
                    {combo.sequence.map((el, i) => (
                      <div key={i} className="flex flex-col items-center justify-center w-10 h-10 bg-white/40 border border-black/5 rounded shadow-sm">
                        <span className="text-xl">{(ELEMENTS_INFO[el as ElementType] as any)?.icon || '✨'}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs italic text-gray-700 leading-relaxed font-medium">"{combo.msg}"</p>
                  
                  <div className="mt-2 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                     <span className="text-[11px] font-bold text-purple-800/80">
                        Efeito: {combo.bonus === 'damage' ? `Poder de Ataque x${combo.mult}` : combo.bonus === 'heal' ? `Eficácia de Cura x${combo.mult}` : combo.bonus}
                     </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 text-center ml-4">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Total de Descobertas: {combos.length} / {SEQUENCE_BONUSES.length}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
