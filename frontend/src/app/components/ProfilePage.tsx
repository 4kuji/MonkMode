import { useOutletContext, useNavigate } from "react-router";
import { User, Mail, LogOut, Calendar, Award, Camera } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useEffect, useState, useRef } from "react";

interface UserData {
  name: string;
  email: string;
  joinDate: string;
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
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/giris-yap");
      return;
    }
    setUser(JSON.parse(userData));

    const saved = localStorage.getItem("pomodoroSessions");
    if (saved) {
      setSessions(JSON.parse(saved));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
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

  const totalPomodoros = sessions.length;
  const totalMinutes = Math.floor(
    sessions.reduce((acc, s) => acc + s.duration, 0) / 60
  );

  return (
    <div className="max-w-4xl mx-auto">
      <h2
        className={`text-3xl font-bold mb-8 ${
          isDarkMode ? "text-white" : "text-black"
        }`}
      >
        Profil
      </h2>

      {/* Kullanıcı Bilgileri */}
      <Card
        className={`p-8 mb-6 ${
          isDarkMode
            ? "bg-white/10 border-white/20"
            : "bg-white border-slate-200"
        }`}
      >
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden ${
                isDarkMode ? "bg-green-500/20" : "bg-green-500/10"
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
                  className={`w-12 h-12 ${
                    isDarkMode ? "text-green-400" : "text-green-600"
                  }`}
                />
              )}
            </div>
            <button
              onClick={triggerFileInput}
              className={`absolute bottom-0 right-0 p-2 rounded-full transition-all ${
                isDarkMode
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
              className={`text-2xl font-bold mb-1 ${
                isDarkMode ? "text-white" : "text-black"
              }`}
            >
              {user.name}
            </h3>
            <div
              className={`flex items-center gap-2 text-sm ${
                isDarkMode ? "text-white/60" : "text-black/60"
              }`}
            >
              <Mail className="w-4 h-4" />
              {user.email}
            </div>
            <div
              className={`flex items-center gap-2 text-sm mt-1 ${
                isDarkMode ? "text-white/60" : "text-black/60"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Katılma: {new Date(user.joinDate).toLocaleDateString("tr-TR")}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div
            className={`p-4 rounded-xl ${
              isDarkMode ? "bg-white/5" : "bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-6 h-6 text-purple-400" />
              <div
                className={`text-sm ${
                  isDarkMode ? "text-white/60" : "text-black/60"
                }`}
              >
                Toplam Pomodoro
              </div>
            </div>
            <div
              className={`text-3xl font-bold ${
                isDarkMode ? "text-white" : "text-black"
              }`}
            >
              {totalPomodoros}
            </div>
          </div>

          <div
            className={`p-4 rounded-xl ${
              isDarkMode ? "bg-white/5" : "bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-blue-400" />
              <div
                className={`text-sm ${
                  isDarkMode ? "text-white/60" : "text-black/60"
                }`}
              >
                Toplam Süre
              </div>
            </div>
            <div
              className={`text-3xl font-bold ${
                isDarkMode ? "text-white" : "text-black"
              }`}
            >
              {Math.floor(totalMinutes / 60)}s {totalMinutes % 60}dk
            </div>
          </div>
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          className={`w-full py-3 rounded-xl font-semibold transition-all ${
            isDarkMode
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
