import { useEffect, useState } from "react";
import { Calendar, Clock, TrendingUp, Award } from "lucide-react";
import { Card } from "./ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useOutletContext } from "react-router";
import { getUserSessions, isAuthenticated } from "../../services/api";

interface PomodoroSession {
  date: string;
  duration: number;
  subject?: string;
  type: string;
  completed: boolean;
}

export function StatsPage() {
  const { isDarkMode } = useOutletContext<{ isDarkMode: boolean }>();
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);

  useEffect(() => {
    async function fetchSessions() {
      if (isAuthenticated()) {
        try {
          const apiSessions = await getUserSessions();
          const formatted = apiSessions.map((s: any) => ({
            date: s.ended_at || s.started_at,
            duration: s.actual_duration_seconds,
            subject: s.title,
            type: s.session_type,
            completed: s.completed
          }));
          setSessions(formatted);
          return;
        } catch (error) {
          console.error("Failed to fetch sessions from API, falling back to local storage", error);
        }
      }

      const saved = localStorage.getItem("pomodoroSessions");
      if (saved) {
        const local = JSON.parse(saved).map((s: any) => ({
          date: s.date,
          duration: s.duration,
          subject: s.subject,
          type: 'pomodoro',
          completed: true
        }));
        setSessions(local);
      }
    }

    fetchSessions();
  }, []);

  const today = new Date().toDateString();
  const todaySessions = sessions.filter(
    (s) => new Date(s.date).toDateString() === today
  );

  const thisWeek = sessions.filter((s) => {
    const sessionDate = new Date(s.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate >= weekAgo;
  });

  const totalMinutes = Math.floor(
    sessions.reduce((acc, s) => acc + s.duration, 0) / 60
  );
  const totalHours = Math.floor(totalMinutes / 60);

  const streak = calculateStreak(sessions);

  function calculateStreak(sessions: PomodoroSession[]): number {
    if (sessions.length === 0) return 0;

    const dates = sessions.map((s) => new Date(s.date).toDateString());
    const uniqueDates = [...new Set(dates)].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (uniqueDates[i] === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toDateString();
    const count = sessions.filter(
      (s) => new Date(s.date).toDateString() === dateStr
    ).length;

    return {
      day: date.toLocaleDateString("tr-TR", { weekday: "short" }),
      count,
    };
  });

  // Ders bazlı dağılım
  const subjectData = sessions.reduce((acc, session) => {
    const subject = session.subject || "Diğer";
    if (!acc[subject]) {
      acc[subject] = 0;
    }
    acc[subject] += session.duration / 60; // dakikaya çevir
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(subjectData).map(([name, value]) => ({
    name,
    value: Math.round(value),
  }));

  const COLORS = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#22c55e", // green
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#14b8a6", // teal
    "#f97316", // orange
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className={`text-3xl font-bold mb-8 ${isDarkMode ? "text-white" : "text-black"
        }`}>İstatistikler</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className={`p-6 ${isDarkMode
            ? "bg-white/10 border-white/20"
            : "bg-white border-slate-200"
          }`}>
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-blue-400" />
            <div className={`text-sm ${isDarkMode ? "text-white/60" : "text-black/60"
              }`}>Bugün</div>
          </div>
          <div className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-black"
            }`}>
            {todaySessions.length}
          </div>
          <div className={`text-xs ${isDarkMode ? "text-white/40" : "text-black/40"
            }`}>pomodoro</div>
        </Card>

        <Card className={`p-6 ${isDarkMode
            ? "bg-white/10 border-white/20"
            : "bg-white border-slate-200"
          }`}>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-green-400" />
            <div className={`text-sm ${isDarkMode ? "text-white/60" : "text-black/60"
              }`}>Bu Hafta</div>
          </div>
          <div className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-black"
            }`}>
            {thisWeek.length}
          </div>
          <div className={`text-xs ${isDarkMode ? "text-white/40" : "text-black/40"
            }`}>pomodoro</div>
        </Card>

        <Card className={`p-6 ${isDarkMode
            ? "bg-white/10 border-white/20"
            : "bg-white border-slate-200"
          }`}>
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-8 h-8 text-purple-400" />
            <div className={`text-sm ${isDarkMode ? "text-white/60" : "text-black/60"
              }`}>Toplam Süre</div>
          </div>
          <div className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-black"
            }`}>{totalHours}s</div>
          <div className={`text-xs ${isDarkMode ? "text-white/40" : "text-black/40"
            }`}>{totalMinutes % 60} dakika</div>
        </Card>

        <Card className={`p-6 ${isDarkMode
            ? "bg-white/10 border-white/20"
            : "bg-white border-slate-200"
          }`}>
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-8 h-8 text-yellow-400" />
            <div className={`text-sm ${isDarkMode ? "text-white/60" : "text-black/60"
              }`}>Seri</div>
          </div>
          <div className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-black"
            }`}>{streak}</div>
          <div className={`text-xs ${isDarkMode ? "text-white/40" : "text-black/40"
            }`}>gün</div>
        </Card>
      </div>

      {/* Son 7 Gün Grafiği */}
      <Card className={`p-6 ${isDarkMode
          ? "bg-white/10 border-white/20"
          : "bg-white border-slate-200"
        }`}>
        <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? "text-white" : "text-black"
          }`}>Son 7 Gün</h3>
        <div className="flex items-end justify-between gap-2 h-48">
          {last7Days.map((day, index) => {
            const maxCount = Math.max(...last7Days.map((d) => d.count), 1);
            const height = (day.count / maxCount) * 100;

            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className={`w-full rounded-t-lg relative h-full flex items-end ${isDarkMode ? "bg-white/5" : "bg-slate-100"
                  }`}>
                  <div
                    className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-lg transition-all duration-500"
                    style={{ height: `${height}%` }}
                  >
                    {day.count > 0 && (
                      <div className="text-white text-xs text-center pt-2">
                        {day.count}
                      </div>
                    )}
                  </div>
                </div>
                <div className={`text-xs mt-2 ${isDarkMode ? "text-white/60" : "text-black/60"
                  }`}>{day.day}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Ders Dağılımı */}
      {pieData.length > 0 && (
        <Card className={`p-6 mt-8 ${isDarkMode
            ? "bg-white/10 border-white/20"
            : "bg-white border-slate-200"
          }`}>
          <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? "text-white" : "text-black"
            }`}>Ders Bazlı Çalışma Dağılımı</h3>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.95)",
                      border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"}`,
                      borderRadius: "8px",
                      color: isDarkMode ? "white" : "black",
                    }}
                    formatter={(value: number) => [`${value} dakika`, "Süre"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-3">
              {pieData.sort((a, b) => b.value - a.value).map((item, index) => (
                <div key={item.name} className={`flex items-center justify-between p-3 rounded-lg ${isDarkMode ? "bg-white/5" : "bg-slate-50"
                  }`}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className={`font-medium ${isDarkMode ? "text-white" : "text-black"
                      }`}>{item.name}</span>
                  </div>
                  <div className={isDarkMode ? "text-white/80" : "text-black/80"}>
                    {item.value} dk ({Math.round((item.value / totalMinutes) * 100)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Tüm Oturumlar */}
      {sessions.length > 0 && (
        <Card className={`p-6 mt-8 ${isDarkMode
            ? "bg-white/10 border-white/20"
            : "bg-white border-slate-200"
          }`}>
          <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-black"
            }`}>Son Oturumlar</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sessions
              .slice()
              .reverse()
              .slice(0, 10)
              .map((session, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center p-3 rounded-lg ${isDarkMode ? "bg-white/5" : "bg-slate-50"
                    }`}
                >
                  <div className={isDarkMode ? "text-white" : "text-black"}>
                    {new Date(session.date).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className={isDarkMode ? "text-white/60" : "text-black/60"}>
                    {session.duration / 60} dakika
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {sessions.length === 0 && (
        <Card className={`p-12 text-center mt-8 ${isDarkMode
            ? "bg-white/10 border-white/20"
            : "bg-white border-slate-200"
          }`}>
          <div className={`text-lg ${isDarkMode ? "text-white/60" : "text-black/60"
            }`}>
            Henüz hiç pomodoro tamamlamadınız.
          </div>
          <div className={`text-sm mt-2 ${isDarkMode ? "text-white/40" : "text-black/40"
            }`}>
            İlk pomodoro'nuzu başlatmak için Timer sayfasına gidin!
          </div>
        </Card>
      )}
    </div>
  );
}