import React from "react";
import { Play, Pause, RotateCcw, Maximize2 } from "lucide-react";

interface MiniTimerWidgetProps {
  timeLeft: number;
  isRunning: boolean;
  isDarkMode: boolean;
  mode: string;
  onToggle: () => void;
  onReset: () => void;
  onExpand: () => void;
}

export function MiniTimerWidget({
  timeLeft,
  isRunning,
  isDarkMode,
  mode,
  onToggle,
  onReset,
  onExpand,
}: MiniTimerWidgetProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const modeLabel =
    mode === "pomodoro"
      ? "Pomodoro"
      : mode === "stopwatch"
      ? "Kronometre"
      : mode === "short"
      ? "Kısa Mola"
      : "Uzun Mola";

  const accentColor =
    mode === "pomodoro"
      ? "#ef4444"
      : mode === "stopwatch"
      ? "#a855f7"
      : mode === "short"
      ? "#22c55e"
      : "#3b82f6";

  return (
    <div
      id="mini-timer-widget"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
        width: "260px",
      }}
      className={`rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 ${
        isDarkMode
          ? "bg-slate-900/90 border-white/10 text-white"
          : "bg-white/90 border-slate-200 text-slate-900"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: isRunning ? "#22c55e" : accentColor }}
          />
          <span
            className={`text-xs font-medium uppercase tracking-wider ${
              isDarkMode ? "text-white/50" : "text-slate-400"
            }`}
          >
            {modeLabel}
          </span>
        </div>
        <button
          onClick={onExpand}
          className={`p-1.5 rounded-lg transition-all ${
            isDarkMode
              ? "hover:bg-white/10 text-white/60 hover:text-white"
              : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"
          }`}
          aria-label="Genişlet"
          title="Tam ekrana dön"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Timer Display */}
      <div className="px-4 py-3 text-center">
        <div
          className="text-4xl font-bold tracking-tight tabular-nums"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${
              isDarkMode ? "#ffffff" : "#1e293b"
            })`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Mini progress bar */}
      <div className="px-4 pb-2">
        <div
          className={`h-1 rounded-full overflow-hidden ${
            isDarkMode ? "bg-white/10" : "bg-slate-100"
          }`}
        >
          {isRunning && (
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{
                backgroundColor: accentColor,
                width: isRunning ? "100%" : "0%",
                animation: "widget-pulse 2s ease-in-out infinite",
              }}
            />
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 px-4 pb-4 pt-1">
        <button
          onClick={onToggle}
          className={`flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
            isRunning
              ? "bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/25"
              : "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25"
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              Durdur
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              Başlat
            </>
          )}
        </button>
        <button
          onClick={onReset}
          className={`flex items-center justify-center p-2 rounded-xl transition-all ${
            isDarkMode
              ? "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
              : "bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700"
          }`}
          aria-label="Sıfırla"
          title="Sıfırla"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Inline keyframes for pulse animation */}
      <style>{`
        @keyframes widget-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
