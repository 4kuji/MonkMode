/**
 * MiniTimerPip — React component rendered inside the Document PiP window.
 * Reads/writes shared timer state via timerStore.
 * Self-contained: has its own tick loop and controls.
 */
import { useState, useEffect, useRef } from "react";
import {
  readTimerState,
  writeTimerState,
  computeCurrentTime,
  subscribeTimerChanges,
  getTotalTimeForMode,
  type TimerState,
  type TimerMode,
} from "../../services/timerStore";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function getModeLabel(mode: TimerMode): string {
  switch (mode) {
    case "pomodoro": return "Pomodoro";
    case "stopwatch": return "Kronometre";
    case "short": return "Kısa Mola";
    case "long": return "Uzun Mola";
  }
}

function getAccentColor(mode: TimerMode): string {
  switch (mode) {
    case "pomodoro": return "#ef4444";
    case "stopwatch": return "#a855f7";
    case "short": return "#22c55e";
    case "long": return "#3b82f6";
  }
}

interface MiniTimerPipProps {
  onClose: () => void;
}

export function MiniTimerPip({ onClose }: MiniTimerPipProps) {
  const [timerState, setTimerState] = useState<TimerState>(readTimerState);
  const [displayTime, setDisplayTime] = useState(() => computeCurrentTime(readTimerState()));
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync from main window via BroadcastChannel
  useEffect(() => {
    const unsub = subscribeTimerChanges((newState) => {
      setTimerState(newState);
    });
    return unsub;
  }, []);

  // Tick loop — compute display time from timestamps
  useEffect(() => {
    const tick = () => {
      const current = computeCurrentTime(timerState);
      setDisplayTime(current);

      // Auto-complete for countdown modes
      if (timerState.isRunning && timerState.mode !== "stopwatch" && current <= 0) {
        const updated: TimerState = {
          ...timerState,
          isRunning: false,
          remainingTime: 0,
          lastResumedAt: null,
        };
        setTimerState(updated);
        writeTimerState(updated);
      }
    };

    tick();
    tickRef.current = setInterval(tick, 250);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [timerState]);

  const toggleTimer = () => {
    const now = new Date().toISOString();
    let updated: TimerState;

    if (timerState.isRunning) {
      const current = computeCurrentTime(timerState);
      updated = {
        ...timerState,
        isRunning: false,
        remainingTime: current,
        lastResumedAt: null,
      };
    } else {
      updated = {
        ...timerState,
        isRunning: true,
        lastResumedAt: now,
        sessionStartedAt: timerState.sessionStartedAt || now,
      };
    }
    setTimerState(updated);
    writeTimerState(updated);
  };

  const resetTimer = () => {
    const totalTime = getTotalTimeForMode(timerState.mode, timerState.customMinutes);
    const updated: TimerState = {
      ...timerState,
      isRunning: false,
      remainingTime: timerState.mode === "stopwatch" ? 0 : totalTime,
      lastResumedAt: null,
      sessionStartedAt: null,
    };
    setTimerState(updated);
    writeTimerState(updated);
  };

  const accent = getAccentColor(timerState.mode);
  const isDarkMode = localStorage.getItem("theme") !== "light";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
        background: isDarkMode
          ? "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)"
          : "linear-gradient(135deg, #eff6ff 0%, #e0e7ff 50%, #f5f3ff 100%)",
        color: isDarkMode ? "#ffffff" : "#1e293b",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px 2px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: timerState.isRunning ? "#22c55e" : accent,
              boxShadow: timerState.isRunning ? "0 0 6px #22c55e" : "none",
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              opacity: 0.5,
            }}
          >
            {getModeLabel(timerState.mode)}
          </span>
        </div>
        <button
          onClick={onClose}
          title="Kapat"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: 4,
            fontSize: 14,
            lineHeight: 1,
            color: "inherit",
            opacity: 0.4,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.4")}
        >
          ✕
        </button>
      </div>

      {/* Timer display */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 12px",
        }}
      >
        <div
          style={{
            fontSize: 46,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            fontVariantNumeric: "tabular-nums",
            background: `linear-gradient(135deg, ${accent}, ${isDarkMode ? "#fff" : "#1e293b"})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1,
          }}
        >
          {formatTime(displayTime)}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: "0 12px 4px" }}>
        <div
          style={{
            height: 3,
            borderRadius: 3,
            overflow: "hidden",
            background: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
          }}
        >
          {timerState.isRunning && (
            <div
              style={{
                height: "100%",
                borderRadius: 3,
                width: "100%",
                backgroundColor: accent,
                animation: "pip-pulse 2s ease-in-out infinite",
              }}
            />
          )}
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "6px 12px 12px",
        }}
      >
        <button
          onClick={toggleTimer}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "7px 18px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            color: "#fff",
            backgroundColor: timerState.isRunning ? "#eab308" : "#22c55e",
            boxShadow: timerState.isRunning
              ? "0 2px 10px rgba(234,179,8,0.3)"
              : "0 2px 10px rgba(34,197,94,0.3)",
            transition: "transform 0.1s, box-shadow 0.15s",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {timerState.isRunning ? "⏸ Durdur" : "▶ Başlat"}
        </button>
        <button
          onClick={resetTimer}
          title="Sıfırla"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 7,
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
            color: "inherit",
            opacity: 0.6,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
        >
          ↻
        </button>
      </div>

      <style>{`
        @keyframes pip-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
