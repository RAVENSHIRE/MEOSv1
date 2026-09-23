import { useEffect, useRef } from "react";
import type { LogEntry } from "../types";

interface TerminalProps {
  logs: LogEntry[];
  onClear: () => void;
}

const LEVEL_COLORS: Record<LogEntry["level"], string> = {
  INFO: "text-terminal-blue",
  SUCCESS: "text-terminal-green glow-green",
  WARN: "text-terminal-yellow glow-yellow",
  ERROR: "text-terminal-red glow-red",
  TRADE: "text-terminal-green",
  SCAN: "text-terminal-gray-light",
  SYSTEM: "text-terminal-blue glow-blue",
};

const LEVEL_TAGS: Record<LogEntry["level"], string> = {
  INFO: "INFO",
  SUCCESS: " OK ",
  WARN: "WARN",
  ERROR: "FAIL",
  TRADE: "TRDE",
  SCAN: "SCAN",
  SYSTEM: "SYS ",
};

export function Terminal({ logs, onClear }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="border border-terminal-border bg-terminal-bg/80 rounded-lg flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-terminal-border bg-terminal-panel/50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-terminal-red/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-terminal-yellow/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-terminal-green/60" />
          </div>
          <span className="text-xs text-terminal-gray-light ml-2">bot@meos:~$ live_terminal</span>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-terminal-gray-light hover:text-terminal-red transition-colors"
        >
          [ CLEAR ]
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 text-xs font-mono leading-relaxed"
      >
        {logs.length === 0 ? (
          <div className="text-terminal-gray-light animate-blink">_</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-2 animate-fade-in">
              <span className="text-terminal-gray flex-shrink-0">{log.timestamp}</span>
              <span className={`flex-shrink-0 font-bold ${LEVEL_COLORS[log.level]}`}>
                [{LEVEL_TAGS[log.level]}]
              </span>
              {log.strategy && (
                <span className="flex-shrink-0 text-terminal-gray-light">
                  {log.strategy === "rent" ? "RENT" : "RVSL"}
                </span>
              )}
              <span className={`${LEVEL_COLORS[log.level]} terminal-text break-all`}>
                {log.message}
              </span>
            </div>
          ))
        )}
        <div className="text-terminal-green animate-blink">_</div>
      </div>
    </div>
  );
}
