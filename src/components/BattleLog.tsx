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
      className="absolute inset-0 custom-scrollbar overflow-y-auto flex flex-col pl-2 pr-1 py-1 text-ink-dark bg-transparent scroll-smooth rounded"
    >
      {logs.length === 0 && (
        <div className="my-auto text-center opacity-50 italic text-sm">O silêncio ecoa nas páginas...</div>
      )}
      {logs.map((log) => (
        <div key={log.id} className={`log-entry ${log.colorClass} ${log.id === logs[logs.length-1]?.id ? 'border-b-0' : ''}`}>
          <span className="opacity-50 mr-2 text-xs">»</span>
          {log.message}
        </div>
      ))}
    </div>
  );
}
