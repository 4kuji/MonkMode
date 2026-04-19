import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useOutletContext } from "react-router";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AIPage() {
  const { isDarkMode } = useOutletContext<{ isDarkMode: boolean }>();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Merhaba! Ben MonkMode yapay zeka asistanınızım. Odaklanma teknikleri, verimlilik, zaman yönetimi ve motivasyon konularında size yardımcı olabilirim. Size nasıl yardımcı olabilirim?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simüle edilmiş AI yanıtı
    setTimeout(() => {
      const aiResponse = generateResponse(input);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: aiResponse,
        },
      ]);
      setIsLoading(false);
    }, 1000);
  };

  const generateResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (input.includes("pomodoro") || input.includes("teknik")) {
      return "Pomodoro Tekniği, 25 dakikalık odaklanma süreleri ve kısa molalarla verimliliği artırmak için harika bir yöntemdir. İşte bazı ipuçları:\n\n1. Her pomodoro süresinde tek bir göreve odaklanın\n2. Molalarda ekrandan uzaklaşın ve hareket edin\n3. 4 pomodoro'dan sonra 15-30 dakika uzun mola verin\n4. İlerlemenizi takip edin ve kendinizi ödüllendirin";
    }

    if (input.includes("odaklan") || input.includes("dikkat")) {
      return "Odaklanmayı artırmak için şu yöntemleri deneyebilirsiniz:\n\n• Çalışma ortamınızı düzenleyin ve dikkat dağıtıcıları ortadan kaldırın\n• Telefonunuzu sessiz moda alın veya başka bir odaya koyun\n• Çalışmadan önce net hedefler belirleyin\n• Düzenli molalar verin ve su için\n• Dinlendirici müzik veya beyaz gürültü kullanın";
    }

    if (input.includes("motivasyon") || input.includes("başlangıç")) {
      return "Motivasyon bulmak zor olabilir, ancak şu stratejiler yardımcı olabilir:\n\n• Büyük görevleri küçük parçalara bölün\n• İlk 5 dakika için kendinizi zorlayın - çoğu zaman bu momentum yaratır\n• Gelecekteki kendinize bir iyilik yapıyor olduğunuzu düşünün\n• Küçük başarılarınızı kutlayın\n• Neden bu işi yaptığınızı hatırlayın";
    }

    if (input.includes("mola") || input.includes("dinlen")) {
      return "Molalar verimlilik için çok önemlidir! Etkili molalar için:\n\n• Ekrandan uzaklaşın ve gözlerinizi dinlendirin\n• Biraz yürüyün veya hafif egzersiz yapın\n• Su için ve hafif atıştırmalıklar tüketin\n• Sosyal medyadan kaçının - bu beyninizi dinlendirmez\n• Derin nefes alın veya meditasyon yapın";
    }

    if (input.includes("teşekkür") || input.includes("sağol")) {
      return "Rica ederim! Size yardımcı olabildiğim için mutluyum. Başka bir sorunuz olursa her zaman buradayım. 💜";
    }

    // Varsayılan yanıt
    return "İlginç bir soru! Pomodoro tekniği, odaklanma, motivasyon, verimlilik ve zaman yönetimi konularında size daha iyi yardımcı olabilirim. Bu konular hakkında spesifik bir sorunuz var mı?";
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