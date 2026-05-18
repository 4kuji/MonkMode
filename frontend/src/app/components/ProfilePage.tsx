import { useOutletContext, useNavigate } from "react-router";
import { User, Mail, LogOut, Calendar, Award, Camera, Timer } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useEffect, useState, useRef } from "react";
import { isAuthenticated, logoutUser, API_URL, getUserSessions, StudySessionRecord } from "../../services/api";

interface UserData {
  name: string;
  email: string;
  joinDate?: string;
  profilePhoto?: string;
}

interface PomodoroSession {
  date: string;
  duration: number;
  subject?: string;
}

export function ProfilePage() {
  const { isDarkMode } = useOutletContext<{ isDarkMode: boolean }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [sessions, setSessions] = useState<StudySessionRecord[]>([]);
  const [stats, setStats] = useState<{
    total_days: number;
    total_hours: number;
    completed_pomodoros: number;
    daily_average_minutes: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Debug logs to trace redirection issues
    const token = localStorage.getItem("access_token");
    const userStr = localStorage.getItem("user");
    console.log("Profile Auth Check:", { hasToken: !!token, hasUser: !!userStr });

    if (!isAuthenticated()) {
      console.warn("User not authenticated, redirecting to login.");
      navigate("/giris-yap");
      return;
    }

    if (!userStr) {
      console.warn("User data missing from localStorage, using defaults.");
      setUser({
        name: "Kullanıcı",
        email: "",
        joinDate: new Date().toISOString(),
      });
    } else {
      try {
        const parsed = JSON.parse(userStr);
        setUser({
          name: parsed.name || parsed.first_name || "Kullanıcı", // Handle different backend naming
          email: parsed.email || "",
          joinDate: parsed.joinDate || new Date().toISOString(),
          profilePhoto: parsed.profilePhoto,
        });
      } catch (err) {
        console.error("Failed to parse user data:", err);
        setUser({
          name: "Kullanıcı",
          email: "",
          joinDate: new Date().toISOString(),
        });
      }
    }

    const saved = localStorage.getItem("pomodoroSessions");
    if (saved) {
      setSessions(JSON.parse(saved));
    }

    // Fetch stats and sessions from backend
    const fetchData = async () => {
      if (!isAuthenticated()) return;

      try {
        // 1. Fetch Stats
        const statsRes = await fetch(`${API_URL}/user/stats/`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`
          }
        });
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }

        // 2. Fetch Recent Sessions
        const sessionData = await getUserSessions({ limit: 10 });
        setSessions(sessionData);

      } catch (err) {
        console.error("Data fetching failed", err);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    logoutUser();
    navigate("/");
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoUrl = reader.result as string;
        const updatedUser = { ...user!, profilePhoto: photoUrl };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (!user) return null;

  const totalPomodoros = stats?.completed_pomodoros || 0;
  const totalHours = stats?.total_hours || 0;
  const totalMinutes = Math.floor(
    sessions.reduce((acc: number, s: StudySessionRecord) => acc + (s.actual_duration_seconds || 0), 0) / 60
  );

  return (
    <div className="max-w-4xl mx-auto">
      <h2
        className={`text-3xl font-bold mb-8 ${isDarkMode ? "text-white" : "text-black"
          }`}
      >
        Profil
      </h2>

      {/* Kullanıcı Bilgileri */}
      <Card
        className={`p-8 mb-6 ${isDarkMode
          ? "bg-white/10 border-white/20"
          : "bg-white border-slate-200"
          }`}
      >
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden ${isDarkMode ? "bg-green-500/20" : "bg-green-500/10"
                }`}
            >
              {user.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User
                  className={`w-12 h-12 ${isDarkMode ? "text-green-400" : "text-green-600"
                    }`}
                />
              )}
            </div>
            <button
              onClick={triggerFileInput}
              className={`absolute bottom-0 right-0 p-2 rounded-full transition-all ${isDarkMode
                ? "bg-green-500 hover:bg-green-600"
                : "bg-green-600 hover:bg-green-700"
                } text-white shadow-lg`}
              aria-label="Fotoğraf değiştir"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
          <div>
            <h3
              className={`text-2xl font-bold mb-1 ${isDarkMode ? "text-white" : "text-black"
                }`}
            >
              {user.name}
            </h3>
            <div
              className={`flex items-center gap-2 text-sm ${isDarkMode ? "text-white/60" : "text-black/60"
                }`}
            >
              <Mail className="w-4 h-4" />
              {user.email}
            </div>
            {user.joinDate && (
              <div
                className={`flex items-center gap-2 text-sm mt-1 ${isDarkMode ? "text-white/60" : "text-black/60"
                  }`}
              >
                <Calendar className="w-4 h-4" />
                Katılma: {new Date(user.joinDate).toLocaleDateString("tr-TR")}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div
            className={`p-4 rounded-xl ${isDarkMode ? "bg-white/5" : "bg-slate-50"
              }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-6 h-6 text-purple-400" />
              <div
                className={`text-sm ${isDarkMode ? "text-white/60" : "text-black/60"
                  }`}
              >
                Toplam Pomodoro
              </div>
            </div>
            <div
              className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-black"
                }`}
            >
              {totalPomodoros}
            </div>
          </div>

          <div
            className={`p-4 rounded-xl ${isDarkMode ? "bg-white/5" : "bg-slate-50"
              }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-blue-400" />
              <div
                className={`text-sm ${isDarkMode ? "text-white/60" : "text-black/60"
                  }`}
              >
                Toplam Gün
              </div>
            </div>
            <div
              className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-black"
                }`}
            >
              {stats?.total_days || 0}
            </div>
          </div>

          <div
            className={`p-4 rounded-xl ${isDarkMode ? "bg-white/5" : "bg-slate-50"
              }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Timer className="w-6 h-6 text-green-400" />
              <div
                className={`text-sm ${isDarkMode ? "text-white/60" : "text-black/60"
                  }`}
              >
                Toplam Çalışma
              </div>
            </div>
            <div
              className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-black"
                }`}
            >
              {stats?.total_hours || 0}s
            </div>
          </div>

          <div
            className={`p-4 rounded-xl ${isDarkMode ? "bg-white/5" : "bg-slate-50"
              }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-6 h-6 text-orange-400" />
              <div
                className={`text-sm ${isDarkMode ? "text-white/60" : "text-black/60"
                  }`}
              >
                Toplam Süre (Dk)
              </div>
            </div>
            <div
              className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-black"
                }`}
            >
              {totalMinutes}dk
            </div>
          </div>
        </div>

        {/* Son Oturumlar Listesi */}
        <div className={`rounded-2xl p-6 ${isDarkMode ? "bg-white/5 border border-white/10" : "bg-white border border-slate-200"
          }`}>
          <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-black"}`}>
            Son Çalışma Oturumları
          </h3>
          <div className="space-y-3">
            {sessions.length > 0 ? (
              sessions.map((session: StudySessionRecord) => (
                <div
                  key={session.id}
                  className={`flex items-center justify-between p-4 rounded-xl ${isDarkMode ? "bg-white/5" : "bg-slate-50"
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${session.session_type.includes('break') ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"
                      }`}>
                      <Timer className="w-5 h-5" />
                    </div>
                    <div>
                      <div className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                        {session.title}
                      </div>
                      <div className={`text-xs ${isDarkMode ? "text-white/40" : "text-slate-500"}`}>
                        {new Date(session.started_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold ${isDarkMode ? "text-white/80" : "text-slate-700"}`}>
                    {Math.floor(session.actual_duration_seconds / 60)} dk
                  </div>
                </div>
              ))
            ) : (
              <div className={`text-center py-8 ${isDarkMode ? "text-white/40" : "text-slate-500"}`}>
                Henüz kayıtlı bir oturum bulunmuyor.
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          className={`w-full py-3 rounded-xl font-semibold transition-all ${isDarkMode
            ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
            : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
            }`}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Çıkış Yap
        </Button>
      </Card>
    </div>
  );
}
