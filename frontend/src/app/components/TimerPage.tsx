import React, { useState, useEffect, useRef, useCallback } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Play, Pause, RotateCcw, Minimize2, Maximize2, MonitorUp } from "lucide-react";
import { Button } from "./ui/button";
import { useOutletContext } from "react-router";
import { saveSession, isAuthenticated, SessionPayload } from "../../services/api";
import { MiniTimerPip } from "./MiniTimerPip";
import { AmbientSoundPanel } from "./AmbientSoundPanel";
import {
  readTimerState,
  writeTimerState,
  computeCurrentTime,
  subscribeTimerChanges,
  getTotalTimeForMode,
  type TimerState,
  type TimerMode,
} from "../../services/timerStore";

const SHORT_BREAK = 5 * 60; // 5 dakika
const LONG_BREAK = 15 * 60; // 15 dakika

export function TimerPage() {
  const { isDarkMode, isFocusMode, setIsFocusMode } = useOutletContext<{
    isDarkMode: boolean;
    isFocusMode: boolean;
    setIsFocusMode: (value: boolean) => void;
  }>();

  // ─── Timer state from shared store ─────────────────────────────
  const [timerState, setTimerState] = useState<TimerState>(readTimerState);
  const [displayTime, setDisplayTime] = useState(() => computeCurrentTime(readTimerState()));
  const [isPipOpen, setIsPipOpen] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pipWindowRef = useRef<Window | null>(null);
  const pipRootRef = useRef<Root | null>(null);

  // Derived values for convenience
  const mode = timerState.mode;
  const isRunning = timerState.isRunning;
  const customMinutes = timerState.customMinutes;
  const subject = timerState.subject;
  const completedPomodoros = timerState.completedPomodoros;
  const totalTime = timerState.totalTime;

  // ─── Sync from other windows ───────────────────────────────────
  useEffect(() => {
    const unsub = subscribeTimerChanges((newState) => {
      setTimerState(newState);
    });
    return unsub;
  }, []);

  // ─── Tick loop — compute display time from timestamps ──────────
  useEffect(() => {
    const tick = () => {
      const current = computeCurrentTime(timerState);
      setDisplayTime(current);

      // Auto-complete for countdown modes
      if (timerState.isRunning && timerState.mode !== "stopwatch" && current <= 0) {
        handleComplete();
      }
    };

    tick(); // immediate
    tickRef.current = setInterval(tick, 250);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [timerState]);

  // ─── State update helpers (write to shared store) ──────────────
  const updateTimerState = useCallback((updates: Partial<TimerState>) => {
    setTimerState((prev) => {
      const next = { ...prev, ...updates };
      writeTimerState(next);
      return next;
    });
  }, []);

  // ─── Timer controls ────────────────────────────────────────────
  const toggleTimer = useCallback(() => {
    const now = new Date().toISOString();
    if (timerState.isRunning) {
      // Pause — snapshot the current time
      const current = computeCurrentTime(timerState);
      updateTimerState({
        isRunning: false,
        remainingTime: current,
        lastResumedAt: null,
      });
    } else {
      // Resume
      updateTimerState({
        isRunning: true,
        lastResumedAt: now,
        sessionStartedAt: timerState.sessionStartedAt || now,
      });
    }
  }, [timerState, updateTimerState]);

  const resetTimer = useCallback(() => {
    saveCurrentSession(false);
    const tt = getTotalTimeForMode(timerState.mode, timerState.customMinutes);
    updateTimerState({
      isRunning: false,
      remainingTime: timerState.mode === "stopwatch" ? 0 : tt,
      lastResumedAt: null,
      sessionStartedAt: null,
    });
  }, [timerState, updateTimerState]);

  const changeMode = useCallback((newMode: TimerMode) => {
    saveCurrentSession(false);
    const tt = getTotalTimeForMode(newMode, customMinutes);
    updateTimerState({
      mode: newMode,
      isRunning: false,
      totalTime: tt,
      remainingTime: newMode === "stopwatch" ? 0 : tt,
      lastResumedAt: null,
      sessionStartedAt: null,
    });
  }, [customMinutes, updateTimerState]);

  const setCustomMinutesValue = useCallback((newMinutes: number) => {
    const tt = newMinutes * 60;
    const updates: Partial<TimerState> = { customMinutes: newMinutes };
    if (!timerState.isRunning) {
      updates.totalTime = tt;
      updates.remainingTime = tt;
    }
    updateTimerState(updates);
  }, [timerState.isRunning, updateTimerState]);

  const setSubjectValue = useCallback((newSubject: string) => {
    updateTimerState({ subject: newSubject });
  }, [updateTimerState]);

  // ─── Session saving (analytics) ────────────────────────────────
  const saveCurrentSession = async (isCompleted: boolean) => {
    if (!timerState.sessionStartedAt) return;

    let actualSeconds = 0;
    const current = computeCurrentTime(timerState);
    if (mode === "stopwatch") {
      actualSeconds = current;
    } else {
      actualSeconds = totalTime - current;
    }

    if (actualSeconds <= 0) return;

    let apiMode: SessionPayload["session_type"] = "pomodoro";
    if (mode === "short") apiMode = "short_break";
    else if (mode === "long") apiMode = "long_break";
    else if (mode === "stopwatch") apiMode = "stopwatch";

    const payload: SessionPayload = {
      session_type: apiMode,
      title: subject || "Diğer",
      planned_duration_minutes: mode === "stopwatch" ? 0 : Math.floor(totalTime / 60),
      actual_duration_seconds: actualSeconds,
      started_at: timerState.sessionStartedAt,
      ended_at: new Date().toISOString(),
      completed: isCompleted,
    };

    if (isAuthenticated()) {
      try {
        await saveSession(payload);
        console.log("Session synced with backend.");
      } catch (err) {
        console.error("Oturum sunucuya kaydedilirken hata oluştu:", err);
      }
    }

    if (mode === "pomodoro" && isCompleted) {
      const newCount = completedPomodoros + 1;
      const sessions = JSON.parse(localStorage.getItem("pomodoroSessions") || "[]");
      sessions.push({
        date: new Date().toISOString(),
        duration: customMinutes * 60,
        subject: subject || "Diğer",
        synced: isAuthenticated(), // Mark as synced if saved to backend
      });
      localStorage.setItem("pomodoroSessions", JSON.stringify(sessions));
      updateTimerState({ completedPomodoros: newCount });
    }

    updateTimerState({ sessionStartedAt: null });
  };

  const handleComplete = () => {
    saveCurrentSession(true);
    updateTimerState({
      isRunning: false,
      remainingTime: 0,
      lastResumedAt: null,
    });

    if (typeof Audio !== "undefined") {
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTCK0/DQfikHI3fH8NyNPAkTXbPn6qxXFApGnt/xvWwcBSyF0O/MdSgFIHfH8NmNOwgSW7Lm6qpYFApFnd7wvGsdBSuBzvDLdCkFIHjH8NmMOwgPWbDm6KxaFApFnN3xvG0dBSuAzfDLcSgFInbG8NiKOQcQWLDl56xYEwpEm9vwvG4dBSh+zfDLQhQQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
      audio.play().catch(() => { });
    }
  };

  // ─── Document Picture-in-Picture ────────────────────────────────
  const closePip = useCallback(() => {
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.close();
    }
    pipWindowRef.current = null;
    if (pipRootRef.current) {
      pipRootRef.current.unmount();
      pipRootRef.current = null;
    }
    setIsPipOpen(false);
  }, []);

  const openPipWidget = useCallback(async () => {
    // Already open? Focus it.
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.focus();
      return;
    }

    // Check API support
    if (!("documentPictureInPicture" in window)) {
      alert(
        "Bu tarayıcı ekran üstü widget modunu desteklemiyor.\nLütfen Chrome 116+ veya Edge 116+ kullanın."
      );
      return;
    }

    try {
      // Save state before opening
      writeTimerState(timerState);

      const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
        width: 280,
        height: 200,
      });

      pipWindowRef.current = pipWindow;
      setIsPipOpen(true);

      // Copy stylesheets from main page to PiP window
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules]
            .map((rule) => rule.cssText)
            .join("");
          const style = document.createElement("style");
          style.textContent = cssRules;
          pipWindow.document.head.appendChild(style);
        } catch {
          if (styleSheet.href) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = styleSheet.href;
            pipWindow.document.head.appendChild(link);
          }
        }
      });

      // Setup PiP document body
      pipWindow.document.body.style.margin = "0";
      pipWindow.document.body.style.padding = "0";
      pipWindow.document.body.style.overflow = "hidden";

      // Create React root in PiP window
      const container = pipWindow.document.createElement("div");
      container.id = "pip-root";
      container.style.width = "100%";
      container.style.height = "100%";
      pipWindow.document.body.appendChild(container);

      const root = createRoot(container);
      pipRootRef.current = root;
      root.render(<MiniTimerPip onClose={closePip} />);

      // Clean up when PiP window is closed (by user or programmatically)
      pipWindow.addEventListener("pagehide", () => {
        if (pipRootRef.current) {
          pipRootRef.current.unmount();
          pipRootRef.current = null;
        }
        pipWindowRef.current = null;
        setIsPipOpen(false);
      });
    } catch (err) {
      console.error("PiP penceresi açılamadı:", err);
      setIsPipOpen(false);
    }
  }, [timerState, closePip]);

  // Cleanup PiP on unmount
  useEffect(() => {
    return () => {
      closePip();
    };
  }, [closePip]);

  // ─── Formatting ────────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Progress calculation
  const progress = mode === "stopwatch"
    ? 0
    : totalTime > 0
      ? ((totalTime - displayTime) / totalTime) * 100
      : 0;

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // ─── Render content based on mode ──────────────────────────────
  const focusModeContent = (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-colors duration-300 ${isDarkMode
        ? "bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900"
        : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      }`}>
      <button
        onClick={() => setIsFocusMode(false)}
        className={`absolute top-8 right-8 p-3 rounded-full transition-all ${isDarkMode
            ? "bg-white/10 text-white hover:bg-white/20"
            : "bg-slate-800/10 text-slate-800 hover:bg-slate-800/20"
          }`}
        aria-label="Normal görünüme dön"
      >
        <Maximize2 className="w-6 h-6" />
      </button>
      <div className="relative mb-12">
        <svg width="400" height="400" className="transform -rotate-90">
          <circle cx="200" cy="200" r={160}
            stroke={isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
            strokeWidth="16" fill="none" />
          <circle cx="200" cy="200" r={160}
            stroke="#22c55e" strokeWidth="16" fill="none"
            strokeDasharray={2 * Math.PI * 160}
            strokeDashoffset={2 * Math.PI * 160 - (progress / 100) * 2 * Math.PI * 160}
            strokeLinecap="round" className="transition-all duration-1000 ease-linear" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-8xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
            {formatTime(displayTime)}
          </div>
        </div>
      </div>
      <div className="flex gap-6">
        <Button onClick={toggleTimer} size="lg"
          className={`px-12 py-8 text-2xl rounded-3xl shadow-2xl ${isRunning ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"
            } text-white`}>
          {isRunning ? <><Pause className="w-8 h-8 mr-3" />Durdur</> : <><Play className="w-8 h-8 mr-3" />Başlat</>}
        </Button>
      </div>
    </div>
  );

  if (isFocusMode) {
    return (
      <>
        <AmbientSoundPanel isDarkMode={isDarkMode} />
        {focusModeContent}
      </>
    );
  }

  // ─── Normal timer view ─────────────────────────────────────────
  return (
    <>
      <AmbientSoundPanel isDarkMode={isDarkMode} />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        {/* Mod Seçimi */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => changeMode("pomodoro")}
            className={`px-6 py-2 rounded-full transition-all ${mode === "pomodoro"
                ? "bg-red-500 text-white shadow-lg"
                : isDarkMode
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-slate-800/10 text-slate-800 hover:bg-slate-800/20"
              }`}
          >
            Pomodoro
          </button>
          <button
            onClick={() => changeMode("stopwatch")}
            className={`px-6 py-2 rounded-full transition-all ${mode === "stopwatch"
                ? "bg-purple-500 text-white shadow-lg"
                : isDarkMode
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-slate-800/10 text-slate-800 hover:bg-slate-800/20"
              }`}
          >
            Kronometre
          </button>
          <button
            onClick={() => changeMode("short")}
            className={`px-6 py-2 rounded-full transition-all ${mode === "short"
                ? "bg-green-500 text-white shadow-lg"
                : isDarkMode
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-slate-800/10 text-slate-800 hover:bg-slate-800/20"
              }`}
          >
            Kısa Mola
          </button>
          <button
            onClick={() => changeMode("long")}
            className={`px-6 py-2 rounded-full transition-all ${mode === "long"
                ? "bg-blue-500 text-white shadow-lg"
                : isDarkMode
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-slate-800/10 text-slate-800 hover:bg-slate-800/20"
              }`}
          >
            Uzun Mola
          </button>
        </div>

        {/* Ders Seçimi */}
        {mode === "pomodoro" && (
          <div className="mb-4 w-full max-w-2xl">
            <div className="flex gap-3 items-center justify-center">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubjectValue(e.target.value)}
                placeholder="Ders adı girin (örn: Matematik, İngilizce...)"
                className={`flex-1 max-w-md border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center ${isDarkMode
                    ? "bg-white/10 text-white placeholder-white/40 border-white/20"
                    : "bg-white text-slate-900 placeholder-slate-400 border-slate-300"
                  }`}
                disabled={isRunning}
              />
              <input
                type="number"
                min="1"
                max="120"
                value={customMinutes}
                onChange={(e) => {
                  const newMinutes = parseInt(e.target.value) || 1;
                  setCustomMinutesValue(newMinutes);
                }}
                placeholder="Süre (dakika)"
                className={`w-40 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center ${isDarkMode
                    ? "bg-white/10 text-white placeholder-white/40 border-white/20"
                    : "bg-white text-slate-900 placeholder-slate-400 border-slate-300"
                  }`}
                disabled={isRunning}
              />
            </div>
          </div>
        )}

        {/* Dairesel Timer */}
        <div className="relative mb-6">
          <svg width="300" height="300" className="transform -rotate-90">
            <circle
              cx="150" cy="150" r={radius}
              stroke={isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
              strokeWidth="12" fill="none"
            />
            <circle
              cx="150" cy="150" r={radius}
              stroke="#22c55e" strokeWidth="12" fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-6xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-black"}`}>
              {formatTime(displayTime)}
            </div>
            <div className={`text-sm ${isDarkMode ? "text-white/60" : "text-black/60"}`}>
              {completedPomodoros} pomodoro tamamlandı
            </div>
          </div>
        </div>

        {/* Kontrol Butonları */}
        <div className="flex gap-4">
          <Button
            onClick={toggleTimer}
            size="lg"
            className={`px-8 py-6 text-lg rounded-2xl ${isRunning ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"
              } text-white`}
          >
            {isRunning ? (
              <><Pause className="w-6 h-6 mr-2" />Durdur</>
            ) : (
              <><Play className="w-6 h-6 mr-2" />Başlat</>
            )}
          </Button>
          <Button
            onClick={resetTimer}
            size="lg"
            variant="outline"
            className={`px-8 py-6 text-lg rounded-2xl ${isDarkMode
                ? "bg-white/10 text-white border-white/20 hover:bg-white/20"
                : "bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200"
              }`}
          >
            <RotateCcw className="w-6 h-6 mr-2" />
            Sıfırla
          </Button>
          <Button
            onClick={openPipWidget}
            size="lg"
            variant="outline"
            className={`px-8 py-6 text-lg rounded-2xl ${isPipOpen
                ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
                : isDarkMode
                  ? "bg-white/10 text-white border-white/20 hover:bg-white/20"
                  : "bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200"
              }`}
          >
            <MonitorUp className="w-6 h-6 mr-2" />
            {isPipOpen ? "PiP Açık" : "Ekranda Sabitle"}
          </Button>
        </div>
      </div>
    </>
  );
}