"""
AI Planner views - Ollama-based chat endpoint with analytics-aware fallback.
"""
import json
import requests
import re
import time
from datetime import datetime
from django.conf import settings
from django.utils import timezone
from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.urls import reverse

from sessions.models import StudySession
from ai_planner.models import GoogleCredentials
from analytics.services import get_user_study_profile

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google_auth_oauthlib.flow import Flow
import os

# In-memory store for PKCE code verifiers (keyed by state/user_id)
_oauth_code_verifiers = {}


class ChatView(APIView):
    """
    POST /api/chat/
    Sends user message to Ollama and returns AI response.
    Requires JWT authentication.
    """
    permission_classes = [IsAuthenticated]

    def get_user_stats(self, user):
        """
        Gathers analytics from StudySession to feed into AI or fallback.
        """
        today = timezone.now().date()
        
        # Today's sessions
        today_sessions = StudySession.objects.filter(
            user=user, 
            ended_at__date=today,
            completed=True
        )
        
        pomodoros_today = today_sessions.filter(session_type='pomodoro').count()
        
        # Total study time today in minutes
        total_seconds = today_sessions.aggregate(total=Sum('actual_duration_seconds'))['total'] or 0
        minutes_today = total_seconds // 60

        return pomodoros_today, minutes_today

    def get_dynamic_fallback(self, pomodoros_today, minutes_today, message):
        """
        Rule-based response system if external AI is down.
        """
        message_lower = message.lower()
        
        if "ne kadar çalıştım" in message_lower or "bugün" in message_lower or "istatistik" in message_lower:
            return f"Bugün toplam {pomodoros_today} Pomodoro tamamladın ve {minutes_today} dakika odaklandın. Harika gidiyorsun!"
        
        if pomodoros_today == 0:
            return "Yapay zeka sunucusuna bağlanılamıyor ancak kayıtlarına baktığımda henüz hiç Pomodoro tamamlamadığını görüyorum. Hadi Timer sayfasına gidip ilk 25 dakikalık oturumunu başlatalım! Başlamak başarmanın yarısıdır."
        elif pomodoros_today < 4:
            return f"Yapay zeka sunucusu şu an meşgul ama istatistiklerini kontrol ettim: Bugün {pomodoros_today} Pomodoro yapmışsın ({minutes_today} dakika). Gayet iyi bir başlangıç! Birkaç tane daha yaparak hedeflerine yaklaşabilirsin."
        else:
            return f"Muazzam! AI sunucusuna şu an ulaşamıyorum ama bugün tam {pomodoros_today} Pomodoro ({minutes_today} dakika) tamamladığını görebiliyorum. Odaklanma seviyen çok iyi, böyle devam et!"

    def post(self, request):
        message = request.data.get('message', '').strip()

        if not message:
            return Response(
                {'error': 'Mesaj boş olamaz.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pomodoros_today, minutes_today = self.get_user_stats(request.user)

        dynamic_prompt = (
            "Sen MonkMode yapay zeka asistanısın. "
            "Kullanıcılara odaklanma teknikleri, Pomodoro yöntemi, verimlilik ve motivasyon konularında yardımcı oluyorsun. "
            "Yanıtlarını Türkçe ver, kısa ve pratik tavsiyeler sun. "
            f"BİLGİ: Kullanıcı bugün {pomodoros_today} Pomodoro ({minutes_today} dakika) tamamladı. Bu bilgiyi yeri geldiğinde motive etmek için kullan."
        )

        fallback_response = self.get_dynamic_fallback(pomodoros_today, minutes_today, message)

        try:
            ollama_url = "http://localhost:11434/api/generate"
            payload = {
                'model': "llama3.1:8b",
                'prompt': f"{dynamic_prompt}\n\nKullanıcı: {message}\n\nAsistan:",
                'stream': False,
            }

            response = requests.post(
                ollama_url,
                json=payload,
                timeout=60, # Increased timeout since local models might take time to load into RAM
            )

            if response.status_code == 200:
                data = response.json()
                if 'response' in data:
                    return Response({'response': data['response']})
                
            # If we reach here, response was not 200 or no 'response' in data
            return Response({
                'error': 'AI servisi geçici olarak kullanılamıyor.',
                'fallback_message': fallback_response
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout, Exception):
            return Response({
                'error': 'AI servisi geçici olarak kullanılamıyor.',
                'fallback_message': fallback_response
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class StudyPlanView(APIView):
    """
    POST /api/ai/study-plan/
    Generates a personalized study plan in JSON format based on the user's past study analytics.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get('message', '').strip()

        if not message:
            return Response(
                {'error': 'Mesaj boş olamaz.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get analytics profile
        profile = get_user_study_profile(request.user)
        
        # Today's date to give context to the LLM
        today_str = datetime.now().isoformat()

        prompt = f"""
Sen uzman bir eğitim ve zaman yönetimi koçusun. Görevin öğrenciye kişiselleştirilmiş bir çalışma planı oluşturmaktır.
Aşağıda kullanıcının çalışma analitiği profilini bulacaksın:
- Günlük Ortalama Çalışma: {profile.get('daily_average_minutes')} dakika
- En Verimli Saatleri: {', '.join(profile.get('best_focus_hours', []))}
- Ders Dağılımı (Yüzdelik): {json.dumps(profile.get('course_distribution', {}), ensure_ascii=False)}
- Tamamlanan Pomodoro Sayısı: {profile.get('completed_pomodoros')}
- Mola Oranı: {profile.get('break_ratio')}

Bugünün tarihi/saati (referans için): {today_str}

Kullanıcı İsteği: "{message}"

LÜTFEN DİKKAT: YANITINI **SADECE** AŞAĞIDAKİ JSON FORMATINDA VER. HİÇBİR EK METİN, AÇIKLAMA VEYA MARKDOWN KOD BLOĞU İŞARETİ KULLANMA. JSON DIŞINDA BİR ŞEY YAZMA.
{{
  "summary": "Planın kısa bir özeti ve motivasyon mesajı",
  "sessions": [
    {{
      "title": "Çalışma Başlığı",
      "description": "Seans açıklaması",
      "start_time": "2026-04-25T10:00:00",
      "end_time": "2026-04-25T11:30:00",
      "session_type": "study",
      "course_name": "Ders Adı"
    }}
  ]
}}
"""

        try:
            ollama_url = "http://localhost:11434/api/generate"
            payload = {
                'model': "llama3.1:8b",
                'prompt': prompt,
                'stream': False,
                'format': 'json', # Instructs Ollama to return JSON if supported
            }

            response = requests.post(ollama_url, json=payload, timeout=90)

            if response.status_code == 200:
                data = response.json()
                ai_response_text = data.get('response', '')
                
                # Attempt to parse JSON
                try:
                    # Sometimes LLMs wrap json in markdown block, extract it if so
                    if '```json' in ai_response_text:
                        match = re.search(r'```json\s*(.*?)\s*```', ai_response_text, re.DOTALL)
                        if match:
                            ai_response_text = match.group(1)
                    elif '```' in ai_response_text:
                        match = re.search(r'```\s*(.*?)\s*```', ai_response_text, re.DOTALL)
                        if match:
                            ai_response_text = match.group(1)

                    plan_json = json.loads(ai_response_text.strip())
                    
                    # Validate basic structure
                    if 'summary' not in plan_json or 'sessions' not in plan_json:
                        raise ValueError("Eksik JSON yapısı")

                    return Response({'plan': plan_json})
                except (json.JSONDecodeError, ValueError) as e:
                    return Response({
                        'error': 'Yapay zeka planı oluştururken hata oluştu. Lütfen tekrar deneyin.',
                        'raw_response': ai_response_text
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                return Response({
                    'error': 'Yapay zeka servisi şu an meşgul.'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            return Response({
                'error': 'AI servisine (Ollama) bağlanılamadı veya zaman aşımına uğradı.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class ConfirmStudyPlanView(APIView):
    """
    POST /api/calendar/confirm-study-plan/
    Receives an array of sessions and creates Google Calendar events.
    Returns error if Google OAuth is not configured/connected.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        sessions = request.data.get('sessions', [])
        
        if not sessions or not isinstance(sessions, list):
            return Response({'error': 'Geçerli bir session listesi gönderilmedi.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate data
        for s in sessions:
            if 'title' not in s or 'start_time' not in s or 'end_time' not in s:
                return Response({'error': 'Eksik session parametreleri.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check for user credentials
        try:
            creds_model = GoogleCredentials.objects.get(user=request.user)
        except GoogleCredentials.DoesNotExist:
            try:
                client_config = get_google_client_config()
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            redirect_uri = request.build_absolute_uri(reverse('calendar_callback'))
            os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

            flow = Flow.from_client_config(
                client_config,
                scopes=['https://www.googleapis.com/auth/calendar.events']
            )
            flow.redirect_uri = redirect_uri
            state = f"{request.user.id}"

            auth_url, _ = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true',
                state=state,
                prompt='consent'
            )

            # Store PKCE code_verifier for use in callback
            _oauth_code_verifiers[state] = flow.code_verifier

            return Response({
                'error': 'Google Calendar hesabınızı bağlamanız gerekiyor.',
                'needs_oauth': True,
                'auth_url': auth_url
            }, status=status.HTTP_403_FORBIDDEN)
            
        credentials = Credentials(
            token=creds_model.token,
            refresh_token=creds_model.refresh_token,
            token_uri=creds_model.token_uri,
            client_id=creds_model.client_id,
            client_secret=creds_model.client_secret,
            scopes=creds_model.scopes.split(',')
        )

        service = build('calendar', 'v3', credentials=credentials)
        created_events = []

        try:
            for s in sessions:
                event_body = {
                    'summary': f"{s['title']} ({s.get('course_name', '')})",
                    'description': s.get('description', ''),
                    'start': {
                        'dateTime': s['start_time'],
                        'timeZone': 'Europe/Istanbul',
                    },
                    'end': {
                        'dateTime': s['end_time'],
                        'timeZone': 'Europe/Istanbul',
                    },
                }
                
                # Retry mechanism for Rate Limits
                retry_count = 0
                max_retries = 3
                event = None
                
                while retry_count <= max_retries:
                    try:
                        event = service.events().insert(calendarId='primary', body=event_body).execute()
                        break
                    except HttpError as error:
                        if error.resp.status == 403 and "rateLimitExceeded" in str(error):
                            wait_time = (2 ** retry_count) + 1
                            time.sleep(wait_time)
                            retry_count += 1
                        else:
                            raise error

                if event:
                    created_events.append({
                        'title': s['title'],
                        'html_link': event.get('htmlLink'),
                    })
                
                # Small gap between successful requests
                time.sleep(0.5)

            return Response({'success': True, 'created_events': created_events})
        except Exception as e:
            return Response({'error': f"Takvime eklerken hata oluştu: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def get_google_client_config():
    client_id = getattr(settings, 'GOOGLE_OAUTH2_CLIENT_ID', os.environ.get('GOOGLE_OAUTH2_CLIENT_ID'))
    client_secret = getattr(settings, 'GOOGLE_OAUTH2_CLIENT_SECRET', os.environ.get('GOOGLE_OAUTH2_CLIENT_SECRET'))
    
    if not client_id or not client_secret:
        raise ValueError("Google OAuth ayarları (.env üzerinde) eksik!")

    return {
        "web": {
            "client_id": client_id,
            "project_id": "monkmode-dev",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": client_secret
        }
    }

class GoogleCalendarAuthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            client_config = get_google_client_config()
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        redirect_uri = request.build_absolute_uri(reverse('calendar_callback'))
        # Needs HTTPs but localhost works
        os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

        flow = Flow.from_client_config(
            client_config,
            scopes=['https://www.googleapis.com/auth/calendar.events']
        )
        flow.redirect_uri = redirect_uri
        
        # Save state in session or DB to pass the frontend URL back?
        # A simple state parameter can hold user ID, but we have a Bearer token?
        # For callback, the user's JWT isn't in headers. 
        # So we pass the user ID inside the state.
        state = f"{request.user.id}"

        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=state,
            prompt='consent'
        )

        # Store PKCE code_verifier for use in callback
        _oauth_code_verifiers[state] = flow.code_verifier

        return Response({'auth_url': auth_url})


class GoogleCalendarCallbackView(APIView):
    permission_classes = [AllowAny] # Because Google hits this without Bearer token

    def get(self, request):
        state = request.GET.get('state')
        code = request.GET.get('code')
        
        if not state or not code:
            return Response({'error': 'Geçersiz callback.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            client_config = get_google_client_config()
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        redirect_uri = request.build_absolute_uri(reverse('calendar_callback'))
        os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

        flow = Flow.from_client_config(
            client_config,
            scopes=['https://www.googleapis.com/auth/calendar.events'],
            state=state
        )
        flow.redirect_uri = redirect_uri

        # Restore PKCE code_verifier from the authorization step
        code_verifier = _oauth_code_verifiers.pop(state, None)
        if code_verifier:
            flow.code_verifier = code_verifier

        # fetch token
        try:
            flow.fetch_token(authorization_response=request.build_absolute_uri())
        except Exception as e:
            return Response({'error': f"Token alınamadı: {e}"}, status=status.HTTP_400_BAD_REQUEST)

        credentials = flow.credentials
        
        from django.contrib.auth.models import User
        try:
            user = User.objects.get(id=int(state))
        except (ValueError, User.DoesNotExist):
            return Response({'error': 'Kullanıcı bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)

        GoogleCredentials.objects.update_or_create(
            user=user,
            defaults={
                'token': credentials.token,
                'refresh_token': credentials.refresh_token,
                'token_uri': credentials.token_uri,
                'client_id': credentials.client_id,
                'client_secret': credentials.client_secret,
                'scopes': ','.join(credentials.scopes),
            }
        )

        # Redirect back to frontend
        frontend_url = "http://localhost:5173/yapay-zeka?oauth_success=true"
        from django.shortcuts import redirect
        return redirect(frontend_url)

from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .ollama_client import get_focus_advice

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "llama3.1:8b"


@csrf_exempt
def extract_profile(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=405)

    try:
        body = json.loads(request.body)
        user_text = body.get("text", "")
    except json.JSONDecodeError:
        return JsonResponse({"error":"Invalid JSON"}, status=400)
        

    schema = {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "name": {"type": "string"},
            "title": {"type": "string"},
            "years_experience": {"type": "integer"},
            "skills": {"type": "array", "items": {"type": "string"}},
            "summary": {"type": "string"}
        },
        "required": ["name", "title", "years_experience", "skills", "summary"]
    }

    prompt = (
        "Return ONLY valid JSON.\n"
        f"JSON_SCHEMA: {json.dumps(schema)}\n"
        f"TEXT: {user_text}"
    )

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": "Return ONLY valid JSON."},
            {"role": "user", "content": prompt}
        ],
        "format": "json",
        "stream": False
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=120)
        response.raise_for_status()
        content = response.json()["message"]["content"]
        data = json.loads(content)
        return JsonResponse(data)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def generate_advice(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        body = json.loads(request.body)

        kategori = body.get("kategori")
        sure = body.get("sure")
        verimlilik_notu = body.get("verimlilik_notu")

        if kategori is None or sure is None or verimlilik_notu is None:
            return JsonResponse(
                {"error": "kategori, sure ve verimlilik_notu gerekli"},
                status=400
            )

        result = get_focus_advice(kategori, sure, verimlilik_notu)
        return JsonResponse(result, status=200)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Geçersiz JSON"}, status=400)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


class RegisterView(APIView):
    """
    POST /api/register/
    Creates a new user and returns JWT tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        name = request.data.get('name')
        email = request.data.get('email')
        password = request.data.get('password')

        if not name or not email or not password:
            return Response(
                {'error': 'İsim, e-posta ve şifre gereklidir.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=email).exists():
            return Response(
                {'error': 'Bu e-posta adresi zaten kayıtlı.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Create user
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=name
            )
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'name': user.first_name,
                    'email': user.email
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Kayıt sırasında bir hata oluştu: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
