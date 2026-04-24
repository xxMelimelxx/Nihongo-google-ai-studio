import { LogEntry } from '../types';
import { useRef, useEffect } from 'react';

interface BattleLogProps {
  logs: LogEntry[];
}

export default function BattleLog({ logs }: BattleLogProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div 
      ref={logRef}
      className="flex-1 bg-black/5 border-l-4 border-ink-red p-3 h-32 overflow-y-auto flex flex-col gap-2 relative text-ink-dark font-bold text-sm leading-relaxed"
    >
      {logs.map((log) => (
        <div key={log.id} className={log.colorClass}>
          {`> ${log.message}`}
        </div>
      ))}
    </div>
  );
}
