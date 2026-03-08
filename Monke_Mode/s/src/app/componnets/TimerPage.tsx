import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";

const POMODORO_TIME = 25 * 60; // 25 dakika
const SHORT_BREAK = 5 * 60; // 5 dakika
const LONG_BREAK = 15 * 60; // 15 dakika

type TimerMode = "pomodoro" | "short" | "long";

export function TimerPage() {
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [subject, setSubject] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalTime =
    mode === "pomodoro"
      ? POMODORO_TIME
      : mode === "short"
      ? SHORT_BREAK
      : LONG_BREAK;

  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
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

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleComplete = () => {
    if (mode === "pomodoro") {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);
      
      // localStorage'a kaydet
      const sessions = JSON.parse(localStorage.getItem("pomodoroSessions") || "[]");
      sessions.push({
        date: new Date().toISOString(),
        duration: POMODORO_TIME,
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
        ? POMODORO_TIME
        : newMode === "short"
        ? SHORT_BREAK
        : LONG_BREAK;
    setTimeLeft(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      {/* Mod Seçimi */}
      <div className="flex gap-3 mb-12">
        <button
          onClick={() => changeMode("pomodoro")}
          className={`px-6 py-2 rounded-full transition-all ${
            mode === "pomodoro"
              ? "bg-red-500 text-white shadow-lg"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          Pomodoro
        </button>
        <button
          onClick={() => changeMode("short")}
          className={`px-6 py-2 rounded-full transition-all ${
            mode === "short"
              ? "bg-green-500 text-white shadow-lg"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          Kısa Mola
        </button>
        <button
          onClick={() => changeMode("long")}
          className={`px-6 py-2 rounded-full transition-all ${
            mode === "long"
              ? "bg-blue-500 text-white shadow-lg"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          Uzun Mola
        </button>
      </div>

      {/* Ders Seçimi */}
      {mode === "pomodoro" && (
        <div className="mb-6 w-full max-w-md">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ders adı girin (örn: Matematik, İngilizce...)"
            className="w-full bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
            disabled={isRunning}
          />
        </div>
      )}

      {/* Dairesel Timer */}
      <div className="relative mb-12">
        <svg width="300" height="300" className="transform -rotate-90">
          {/* Arka plan çemberi */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
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
          <div className="text-6xl font-bold text-white mb-2">
            {formatTime(timeLeft)}
          </div>
          <div className="text-white/60 text-sm">
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
          className="px-8 py-6 text-lg rounded-2xl bg-white/10 text-white border-white/20 hover:bg-white/20"
        >
          <RotateCcw className="w-6 h-6 mr-2" />
          Sıfırla
        </Button>
      </div>
    </div>
  );
}