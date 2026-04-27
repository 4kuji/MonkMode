import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, AlertCircle, Calendar, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useOutletContext, useNavigate } from "react-router";
import { sendChatMessage, isAuthenticated, generateStudyPlan, confirmStudyPlan, StudyPlanSession, StudyPlanResponse } from "../../services/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  planData?: StudyPlanResponse["plan"];
}

export function AIPage() {
  const { isDarkMode } = useOutletContext<{ isDarkMode: boolean }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Merhaba! Ben MonkMode yapay zeka asistanınızım. Odaklanma teknikleri, verimlilik, zaman yönetimi ve motivasyon konularında size yardımcı olabilirim. Size nasıl yardımcı olabilirim?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/giris-yap");
    }
  }, [navigate]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError("");

    try {
      const data = await sendChatMessage(input);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
        },
      ]);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : "AI yanıtı alınamadı.";
      if (message === "UNAUTHORIZED") {
        navigate("/giris-yap");
        return;
      }
      
      setError(message);
      
      if (err.fallback_message) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: err.fallback_message,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.",
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: `[Çalışma Planı İsteği]: ${input}`,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError("");

    try {
      const data = await generateStudyPlan(input);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.plan.summary,
          planData: data.plan,
        },
      ]);
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        navigate("/giris-yap");
        return;
      }
      setError(err.message || "Plan oluşturulamadı.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPlan = async (sessions: StudyPlanSession[]) => {
    try {
      await confirmStudyPlan(sessions);
      alert("Çalışma planı Google Calendar'a eklendi.");
    } catch (err: any) {
      if (err.message === "NEEDS_OAUTH") {
        if (err.auth_url) {
           window.location.href = err.auth_url;
        } else {
           alert("Google Calendar hesabınızı bağlamanız gerekiyor.");
        }
      } else {
        alert(err.message || "Takvime eklenirken bir hata oluştu.");
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className={`text-3xl font-bold mb-8 ${
        isDarkMode ? "text-white" : "text-black"
      }`}>Yapay Zeka Asistanı</h2>

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <Card className={`flex flex-col h-[calc(100vh-300px)] ${
        isDarkMode 
          ? "bg-white/10 border-white/20" 
          : "bg-white border-slate-200"
      }`}>
        {/* Mesajlar */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-purple-500 text-white"
                    : isDarkMode
                    ? "bg-white/10 text-white"
                    : "bg-slate-100 text-black"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.planData && (
                  <div className={`mt-4 p-4 rounded-xl flex flex-col gap-3 ${isDarkMode ? "bg-white/5" : "bg-white border"}`}>
                    <h4 className={`font-bold border-b pb-2 ${isDarkMode ? "border-white/10" : "border-slate-200"}`}>
                      Önerilen Çalışma Planı
                    </h4>
                    {message.planData.sessions.map((s, i) => (
                      <div key={i} className={`p-3 rounded-lg text-sm ${isDarkMode ? "bg-white/10" : "bg-slate-50 border"}`}>
                        <div className="font-semibold text-purple-500 dark:text-purple-400">{s.title} ({s.course_name})</div>
                        <div className={`mt-1 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{s.description}</div>
                        <div className={`text-xs mt-2 flex items-center gap-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                           <Clock className="w-3 h-3" />
                           {new Date(s.start_time).toLocaleString("tr-TR")} - {new Date(s.end_time).toLocaleTimeString("tr-TR")}
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                       <Button 
                         onClick={() => handleConfirmPlan(message.planData!.sessions)}
                         className="bg-green-600 hover:bg-green-700 text-white text-xs py-1 h-8 px-4"
                       >
                         Takvime Ekle
                       </Button>
                    </div>
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className={`rounded-2xl px-4 py-3 ${
                isDarkMode ? "bg-white/10" : "bg-slate-100"
              }`}>
                <div className="flex gap-1">
                  <div className={`w-2 h-2 rounded-full animate-bounce ${
                    isDarkMode ? "bg-white/60" : "bg-black/60"
                  }`} />
                  <div
                    className={`w-2 h-2 rounded-full animate-bounce ${
                      isDarkMode ? "bg-white/60" : "bg-black/60"
                    }`}
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className={`w-2 h-2 rounded-full animate-bounce ${
                      isDarkMode ? "bg-white/60" : "bg-black/60"
                    }`}
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-4 border-t ${
          isDarkMode ? "border-white/10" : "border-slate-200"
        }`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Mesajınızı yazın..."
              className={`flex-1 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                isDarkMode
                  ? "bg-white/5 text-white placeholder-white/40 border-white/10"
                  : "bg-white text-black placeholder-slate-400 border-slate-300"
              }`}
            />
            <Button
              onClick={handleGeneratePlan}
              disabled={!input.trim() || isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4"
              title="Yapay Zekadan Çalışma Planı Oluşturmasını İste"
            >
              <Calendar className="w-5 h-5" />
            </Button>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}