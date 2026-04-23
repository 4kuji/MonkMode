import { Outlet, Link, useLocation } from "react-router";
import { Timer, BarChart3, Brain, UserPlus, LogIn, Sun, Moon, Minimize2, User } from "lucide-react";
import { useState, useEffect } from "react";

export function Root() {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  // localStorage'dan tema tercihini yükle
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      setIsDarkMode(false);
    }

    const userStr = localStorage.getItem("user");
    if (userStr) {
      setIsLoggedIn(true);
      const user = JSON.parse(userStr);
      setUserPhoto(user.profilePhoto || null);
    } else {
      setIsLoggedIn(false);
      setUserPhoto(null);
    }
  }, [location.pathname]);

  // Tema değiştiğinde localStorage'a kaydet
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const navItems = [
    { path: "/", label: "Timer", icon: Timer },
    { path: "/istatistikler", label: "İstatistikler", icon: BarChart3 },
    { path: "/yapay-zeka", label: "Yapay Zeka", icon: Brain },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? "bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" 
        : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
    }`}>
      <div className="container mx-auto px-4 py-6">
        <header className="mb-8 relative">
          {/* Dark Mode Toggle - Sol üst köşe */}
          <div className="absolute top-0 left-0">
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                isDarkMode
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-slate-800/10 text-slate-800 hover:bg-slate-800/20"
              }`}
              aria-label="Tema değiştir"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-5 h-5" />
                  <span className="text-sm">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5" />
                  <span className="text-sm">Dark</span>
                </>
              )}
            </button>
            {location.pathname === "/" && (
              <button
                onClick={() => setIsFocusMode(true)}
                className={`flex items-center justify-center p-2 rounded-xl transition-all ${
                  isDarkMode
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-slate-800/10 text-slate-800 hover:bg-slate-800/20"
                }`}
                aria-label="Odaklanma modu"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Auth butonları - Sağ üst köşe */}
          <div className="absolute top-0 right-0 flex gap-3">
            {isLoggedIn ? (
            <Link
              to="/profil"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                location.pathname === "/profil"
                  ? "bg-green-500 text-white"
                  : isDarkMode
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-slate-800/10 text-slate-800 hover:bg-slate-800/20"
              }`}
           >
            <div className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center ${
               !userPhoto && (isDarkMode ? "bg-green-500/30" : "bg-green-500/20")
            }`}>
              {userPhoto ? (
                 <img src={userPhoto} alt="Profil" className="w-full h-full object-cover" />
               ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <span>Profil</span>
          </Link>
        ) : (
          <>
            <Link
              to="/giris-yap"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                isDarkMode
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-slate-800/10 text-slate-800 hover:bg-slate-800/20"
              }`}
            >
              <LogIn className="w-4 h-4" />
              Giriş Yap
            </Link>
            <Link
              to="/kayit-ol"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Kayıt Ol
            </Link>
            </>
            )}
          </div>

          {/* Logo ve Başlık */}
          <h1 className={`text-4xl font-bold text-center mb-8 transition-colors ${
            isDarkMode ? "text-white" : "text-black"
          }`}>
            MonkMode
          </h1>
          <nav className="flex justify-center gap-4">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive =
                path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                    isActive
                      ? isDarkMode
                        ? "bg-white text-purple-900 shadow-lg"
                        : "bg-purple-600 text-white shadow-lg"
                      : isDarkMode
                      ? "bg-white/10 text-white hover:bg-white/20"
                      : "bg-slate-800/10 text-slate-800 hover:bg-slate-800/20"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </header>
        <main>
           <Outlet context={{ isDarkMode, isFocusMode, setIsFocusMode }} />
        </main>
      </div>
    </div>
  );
}