import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "./ui/button";
import { useOutletContext } from "react-router";

const SHORT_BREAK = 5 * 60; // 5 dakika
const LONG_BREAK = 15 * 60; // 15 dakika

type TimerMode = "pomodoro" | "short" | "long" | "stopwatch";

export function TimerPage() {
  const { isDarkMode, isFocusMode, setIsFocusMode } = useOutletContext<{
    isDarkMode: boolean;
    isFocusMode: boolean;
    setIsFocusMode: (value: boolean) => void;
  }>();
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [customMinutes, setCustomMinutes] = useState(25); // Kullanıcının girdiği süre
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [subject, setSubject] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalTime =
    mode === "pomodoro"
      ? customMinutes * 60
      : mode === "short"
      ? SHORT_BREAK
      : mode === "long"
      ? LONG_BREAK
      : 0; // Kronometre için total time yok

  // Kronometre modunda progress hesaplama
  const progress = mode === "stopwatch" 
    ? 0 
    : totalTime > 0 
    ? ((totalTime - timeLeft) / totalTime) * 100 
    : 0;
    
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    if (isRunning) {
      if (mode === "stopwatch") {
        // Kronometre modu - yukarı say
        intervalRef.current = setInterval(() => {
          setTimeLeft((prev) => prev + 1);
        }, 1000);
      } else if (timeLeft > 0) {
        // Normal timer - aşağı say
        intervalRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              setIsRunning(false);
              handleComplete();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, mode]);

  const handleComplete = () => {
    if (mode === "pomodoro") {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);
      
      // localStorage'a kaydet
      const sessions = JSON.parse(localStorage.getItem("pomodoroSessions") || "[]");
      sessions.push({
        date: new Date().toISOString(),
        duration: customMinutes * 60,
        subject: subject || "Diğer",
      });
      localStorage.setItem("pomodoroSessions", JSON.stringify(sessions));

      // Bildirim sesi (opsiyonel)
      if (typeof Audio !== "undefined") {
        const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTCK0/DQfikHI3fH8NyNPAkTXbPn6qxXFApGnt/xvWwcBSyF0O/MdSgFIHfH8NmNOwgSW7Lm6qpYFApFnd7wvGsdBSuBzvDLdCkFIHjH8NmMOwgPWbDm6KxaFApFnN3xvG0dBSuAzfDLcSgFInbG8NiKOQcQWLDl56xYEwpEm9vwvG4dBSh+zfDLQhQQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
        audio.play().catch(() => {});
      }
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(totalTime);
  };

  const changeMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    const newTime =
      newMode === "pomodoro"
        ? customMinutes * 60
        : newMode === "short"
        ? SHORT_BREAK
        : newMode === "long"
        ? LONG_BREAK
        : 0; // Kronometre için total time yok
    setTimeLeft(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Focus mode ise minimal görünüm
  if (isFocusMode) {
    return (
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-colors duration-300 ${
        isDarkMode 
          ? "bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" 
          : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      }`}>
        {/* Çıkış butonu */}
        <button
          onClick={() => setIsFocusMode(false)}
          className={`absolute top-8 right-8 p-3 rounded-full transition-all ${
            isDarkMode
              ? "bg-white/10 text-white hover:bg-white/20"
              : "bg-slate-800/10 text-slate-800 hover:bg-slate-800/20"
          }`}
          aria-label="Normal görünüme dön"
        >
          <Maximize2 className="w-6 h-6" />
        </button>

        {/* Dairesel Timer */}
        <div className="relative mb-12">
          <svg width="400" height="400" className="transform -rotate-90">
            {/* Arka plan çemberi */}
            <circle
              cx="200"
              cy="200"
              r={160}
              stroke={isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
              strokeWidth="16"
              fill="none"
            />
            {/* İlerleme çemberi */}
            <circle
              cx="200"
              cy="200"
              r={160}
              stroke="#22c55e"
              strokeWidth="16"
              fill="none"
              strokeDasharray={2 * Math.PI * 160}
              strokeDashoffset={2 * Math.PI * 160 - (progress / 100) * 2 * Math.PI * 160}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          {/* Süre göstergesi */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-8xl font-bold ${
              isDarkMode ? "text-white" : "text-black"
            }`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Kontrol Butonları */}
        <div className="flex gap-6">
          <Button
            onClick={toggleTimer}
            size="lg"
            className={`px-12 py-8 text-2xl rounded-3xl shadow-2xl ${
              isRunning
                ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-green-500 hover:bg-green-600"
            } text-white`}
          >
            {isRunning ? (
              <>
                <Pause className="w-8 h-8 mr-3" />
                Durdur
              </>
            ) : (
              <>
                <Play className="w-8 h-8 mr-3" />
                Başlat
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      {/* Mod Seçimi */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => changeMode("pomodoro")}
          className={`px-6 py-2 rounded-full transition-all ${
            mode === "pomodoro"
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
          className={`px-6 py-2 rounded-full transition-all ${
            mode === "stopwatch"
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
          className={`px-6 py-2 rounded-full transition-all ${
            mode === "short"
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
          className={`px-6 py-2 rounded-full transition-all ${
            mode === "long"
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
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ders adı girin (örn: Matematik, İngilizce...)"
              className={`flex-1 max-w-md border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center ${
                isDarkMode
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
                setCustomMinutes(newMinutes);
                if (!isRunning) {
                  setTimeLeft(newMinutes * 60);
                }
              }}
              placeholder="Süre (dakika)"
              className={`w-40 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center ${
                isDarkMode
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
          {/* Arka plan çemberi */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            stroke={isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
            strokeWidth="12"
            fill="none"
          />
          {/* İlerleme çemberi */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            stroke="#22c55e"
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        {/* Süre göstergesi */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-6xl font-bold mb-2 ${
            isDarkMode ? "text-white" : "text-black"
          }`}>
            {formatTime(timeLeft)}
          </div>
          <div className={`text-sm ${
            isDarkMode ? "text-white/60" : "text-black/60"
          }`}>
            {completedPomodoros} pomodoro tamamlandı
          </div>
        </div>
      </div>

      {/* Kontrol Butonları */}
      <div className="flex gap-4">
        <Button
          onClick={toggleTimer}
          size="lg"
          className={`px-8 py-6 text-lg rounded-2xl ${
            isRunning
              ? "bg-yellow-500 hover:bg-yellow-600"
              : "bg-green-500 hover:bg-green-600"
          } text-white`}
        >
          {isRunning ? (
            <>
              <Pause className="w-6 h-6 mr-2" />
              Durdur
            </>
          ) : (
            <>
              <Play className="w-6 h-6 mr-2" />
              Başlat
            </>
          )}
        </Button>
        <Button
          onClick={resetTimer}
          size="lg"
          variant="outline"
          className={`px-8 py-6 text-lg rounded-2xl ${
            isDarkMode
              ? "bg-white/10 text-white border-white/20 hover:bg-white/20"
              : "bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200"
          }`}
        >
          <RotateCcw className="w-6 h-6 mr-2" />
          Sıfırla
        </Button>
      </div>
    </div>
  );
}