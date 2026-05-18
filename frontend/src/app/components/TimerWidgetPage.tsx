/**
 * TimerWidgetPage — Standalone mini timer page for pop-out window.
 * Reads/writes shared timer state via localStorage + BroadcastChannel.
 * Rendered at /timer-widget route.
 */
import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Maximize2, X } from "lucide-react";
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

export function TimerWidgetPage() {
  const [timerState, setTimerState] = useState<TimerState>(readTimerState);
  const [displayTime, setDisplayTime] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync from other windows
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

    tick(); // immediate
    tickRef.current = setInterval(tick, 250); // 4Hz for smooth updates

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [timerState]);

  const toggleTimer = () => {
    const now = new Date().toISOString();
    if (timerState.isRunning) {
      // Pause
      const current = computeCurrentTime(timerState);
      const updated: TimerState = {
        ...timerState,
        isRunning: false,
        remainingTime: current,
        lastResumedAt: null,
      };
      setTimerState(updated);
      writeTimerState(updated);
    } else {
      // Resume
      const updated: TimerState = {
        ...timerState,
        isRunning: true,
        lastResumedAt: now,
        sessionStartedAt: timerState.sessionStartedAt || now,
      };
      setTimerState(updated);
      writeTimerState(updated);
    }
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

  const goToMain = () => {
    if (window.opener) {
      window.opener.focus();
    }
    window.close();
  };

  const accentColor = getAccentColor(timerState.mode);
  const isDarkMode = localStorage.getItem("theme") !== "light";

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
      className={isDarkMode
        ? "bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white"
        : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-slate-900"
      }
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: 8, height: 8, borderRadius: "50%",
              backgroundColor: timerState.isRunning ? "#22c55e" : accentColor,
              animation: timerState.isRunning ? "pulse 2s infinite" : "none",
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.5 }}>
            {getModeLabel(timerState.mode)}
          </span>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            onClick={goToMain}
            title="Ana sayfaya dön"
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6,
              color: "inherit", opacity: 0.5,
            }}
          >
            <Maximize2 size={14} />
          </button>
          <button
            onClick={() => window.close()}
            title="Kapat"
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6,
              color: "inherit", opacity: 0.5,
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Time Display */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
            background: `linear-gradient(135deg, ${accentColor}, ${isDarkMode ? "#ffffff" : "#1e293b"})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {formatTime(displayTime)}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: "0 14px 6px" }}>
        <div style={{
          height: 3, borderRadius: 3, overflow: "hidden",
          background: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
        }}>
          {timerState.isRunning && (
            <div style={{
              height: "100%", borderRadius: 3, width: "100%",
              backgroundColor: accentColor,
              animation: "pulse 2s ease-in-out infinite",
            }} />
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "6px 14px 14px" }}>
        <button
          onClick={toggleTimer}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 20px", borderRadius: 10,
            fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
            color: "#fff",
            backgroundColor: timerState.isRunning ? "#eab308" : "#22c55e",
            boxShadow: timerState.isRunning
              ? "0 4px 14px rgba(234,179,8,0.3)"
              : "0 4px 14px rgba(34,197,94,0.3)",
          }}
        >
          {timerState.isRunning ? <Pause size={14} /> : <Play size={14} />}
          {timerState.isRunning ? "Durdur" : "Başlat"}
        </button>
        <button
          onClick={resetTimer}
          title="Sıfırla"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 8, borderRadius: 10, border: "none", cursor: "pointer",
            backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
            color: "inherit", opacity: 0.7,
          }}
        >
          <RotateCcw size={16} />
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
