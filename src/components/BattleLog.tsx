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
      className="absolute inset-0 custom-scrollbar overflow-y-auto flex flex-col relative px-2 text-ink-dark shadow-inner bg-transparent"
    >
      {logs.map((log) => (
        <div key={log.id} className={`log-entry ${log.colorClass}`}>
          {log.message}
        </div>
      ))}
    </div>
  );
}
