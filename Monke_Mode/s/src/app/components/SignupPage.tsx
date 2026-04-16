import { useState } from "react";
import { useOutletContext, Link, useNavigate } from "react-router";
import { UserPlus, Mail, Lock, User } from "lucide-react";
import { Button } from "./ui/button";

export function SignupPage() {
  const { isDarkMode } = useOutletContext<{ isDarkMode: boolean }>();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Şifre kontrolü
    if (password !== confirmPassword) {
      alert("Şifreler eşleşmiyor!");
      return;
    }

    // TODO: Gerçek authentication mantığı eklenecek
    console.log("Signup attempt:", { name, email, password });
    // Başarılı kayıt sonrası ana sayfaya yönlendir
    navigate("/");
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div
        className={`w-full max-w-md rounded-2xl p-8 shadow-xl ${
          isDarkMode
            ? "bg-white/10 backdrop-blur-lg border border-white/20"
            : "bg-white border border-slate-200"
        }`}
      >
        {/* Başlık */}
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              isDarkMode ? "bg-green-500/20" : "bg-green-500/10"
            }`}
          >
            <UserPlus
              className={`w-8 h-8 ${
                isDarkMode ? "text-green-400" : "text-green-600"
              }`}
            />
          </div>
          <h2
            className={`text-3xl font-bold mb-2 ${
              isDarkMode ? "text-white" : "text-black"
            }`}
          >
            Kayıt Ol
          </h2>
          <p
            className={`text-sm ${
              isDarkMode ? "text-white/60" : "text-black/60"
            }`}
          >
            MonkMode'a katılın ve odaklanmaya başlayın
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Input */}
          <div>
            <label
              htmlFor="name"
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? "text-white/80" : "text-slate-700"
              }`}
            >
              Ad Soyad
            </label>
            <div className="relative">
              <User
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? "text-white/40" : "text-slate-400"
                }`}
              />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Adınız Soyadınız"
                required
                className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                  isDarkMode
                    ? "bg-white/10 text-white placeholder-white/40 border-white/20"
                    : "bg-white text-slate-900 placeholder-slate-400 border-slate-300"
                }`}
              />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? "text-white/80" : "text-slate-700"
              }`}
            >
              E-posta
            </label>
            <div className="relative">
              <Mail
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? "text-white/40" : "text-slate-400"
                }`}
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                required
                className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                  isDarkMode
                    ? "bg-white/10 text-white placeholder-white/40 border-white/20"
                    : "bg-white text-slate-900 placeholder-slate-400 border-slate-300"
                }`}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? "text-white/80" : "text-slate-700"
              }`}
            >
              Şifre
            </label>
            <div className="relative">
              <Lock
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? "text-white/40" : "text-slate-400"
                }`}
              />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                  isDarkMode
                    ? "bg-white/10 text-white placeholder-white/40 border-white/20"
                    : "bg-white text-slate-900 placeholder-slate-400 border-slate-300"
                }`}
              />
            </div>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label
              htmlFor="confirmPassword"
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? "text-white/80" : "text-slate-700"
              }`}
            >
              Şifre Tekrar
            </label>
            <div className="relative">
              <Lock
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? "text-white/40" : "text-slate-400"
                }`}
              />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                  isDarkMode
                    ? "bg-white/10 text-white placeholder-white/40 border-white/20"
                    : "bg-white text-slate-900 placeholder-slate-400 border-slate-300"
                }`}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-lg transition-all shadow-lg"
          >
            Kayıt Ol
          </Button>
        </form>

        {/* Giriş Yap Link */}
        <div className="mt-6 text-center">
          <p
            className={`text-sm ${
              isDarkMode ? "text-white/60" : "text-slate-600"
            }`}
          >
            Zaten hesabınız var mı?{" "}
            <Link
              to="/giris-yap"
              className={`font-semibold hover:underline ${
                isDarkMode ? "text-green-400" : "text-green-600"
              }`}
            >
              Giriş yapın
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}