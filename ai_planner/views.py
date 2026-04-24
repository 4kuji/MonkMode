"""
AI Planner views - Ollama-based chat endpoint.
"""
import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status


SYSTEM_PROMPT = (
    "Sen MonkMode yapay zeka asistanısın. "
    "Kullanıcılara odaklanma teknikleri, Pomodoro yöntemi, verimlilik, "
    "zaman yönetimi ve motivasyon konularında yardımcı oluyorsun. "
    "Yanıtlarını Türkçe ver, kısa ve pratik tavsiyeler sun. "
    "Kullanıcının odaklanma sürecine destek ol."
)

# Fallback response when Ollama is unavailable
FALLBACK_RESPONSE = (
    "Şu anda AI servisine bağlanılamıyor. "
    "Lütfen daha sonra tekrar deneyin. "
    "İpucu: Pomodoro tekniğini deneyin — 25 dakika odaklanın, 5 dakika mola verin!"
)


class ChatView(APIView):
    """
    POST /api/chat/
    Sends user message to Ollama and returns AI response.
    Requires JWT authentication.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get('message', '').strip()

        if not message:
            return Response(
                {'error': 'Mesaj boş olamaz.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            ollama_url = f"{settings.OLLAMA_BASE_URL}/api/generate"
            payload = {
                'model': settings.OLLAMA_MODEL,
                'prompt': f"{SYSTEM_PROMPT}\n\nKullanıcı: {message}\n\nAsistan:",
                'stream': False,
            }

            response = requests.post(
                ollama_url,
                json=payload,
                timeout=60,
            )

            if response.status_code == 200:
                data = response.json()
                ai_response = data.get('response', FALLBACK_RESPONSE)
                return Response({'response': ai_response})
            else:
                return Response({'response': FALLBACK_RESPONSE})

        except requests.exceptions.ConnectionError:
            return Response({'response': FALLBACK_RESPONSE})
        except requests.exceptions.Timeout:
            return Response({
                'response': 'AI yanıt süresi aşıldı. Lütfen tekrar deneyin.'
            })
        except Exception:
            return Response({'response': FALLBACK_RESPONSE})
