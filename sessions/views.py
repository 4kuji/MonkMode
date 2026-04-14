import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import CustomUser, Category, FocusSession
from django.db.models import Sum
import os.path
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

@csrf_exempt
def register_user(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')

            if not email or not password:
                return JsonResponse({'error': 'Email ve şifre zorunludur!'}, status=400)

            if CustomUser.objects.filter(email=email).exists():
                return JsonResponse({'error': 'Bu e-posta adresi zaten kayıtlı!'}, status=400)

            user = CustomUser.objects.create_user(email=email, password=password)
            
            return JsonResponse({
                'message': 'Harika! Kullanıcı başarıyla oluşturuldu.', 
                'user_id': user.id
            }, status=201)

        except Exception as e:
            return JsonResponse({'error': f'Bir hata oluştu: {str(e)}'}, status=500)
    
    return JsonResponse({'error': 'Sadece POST istekleri kabul edilir!'}, status=405)


@csrf_exempt
def save_session(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            user_id = data.get('user_id')
            category_id = data.get('category_id') 
            duration_minutes = data.get('duration_minutes')
            start_time = data.get('start_time')
            end_time = data.get('end_time')
            notes = data.get('notes', '') 

            user = CustomUser.objects.get(id=user_id)
            category = Category.objects.get(id=category_id)

            new_session = FocusSession.objects.create(
                user=user,
                category=category,
                duration_minutes=duration_minutes,
                start_time=start_time,
                end_time=end_time,
                notes=notes
            )

            return JsonResponse({
                'message': 'Seans başarıyla kaydedildi, Maymun Modu tamamlandı! 🐒', 
                'session_id': new_session.id
            }, status=201)

        except CustomUser.DoesNotExist:
            return JsonResponse({'error': 'Böyle bir kullanıcı bulunamadı!'}, status=404)
        except Category.DoesNotExist:
            return JsonResponse({'error': 'Böyle bir kategori bulunamadı!'}, status=404)
        except Exception as e:
            return JsonResponse({'error': f'Beklenmedik bir hata: {str(e)}'}, status=500)
            
    return JsonResponse({'error': 'Sadece POST istekleri kabul edilir!'}, status=405)

def get_user_stats(request, user_id):
    if request.method == 'GET':
        try:
            # 1. Kullanıcının tüm çalışma seanslarını veritabanından bul
            sessions = FocusSession.objects.filter(user_id=user_id)
            
            # Eğer daha önce hiç çalışmamışsa:
            if not sessions.exists():
                return JsonResponse({
                    'total_focus_minutes': 0,
                    'total_sessions': 0,
                    'ai_insight': 'Henüz hiç odaklanma seansın yok. Maymun modunu açma vakti geldi! 🐒'
                }, status=200)

            # 2. Toplam çalışma süresini hesapla
            total_time = sessions.aggregate(Sum('duration_minutes'))['duration_minutes__sum'] or 0

            # 3. Frontend'e gidecek veri paketini (JSON) hazırla
            # Not: Pandas ve Ollama kodları ileride buraya entegre edilecek!
            response_data = {
                'total_focus_minutes': total_time,
                'total_sessions': sessions.count(),
                'ai_insight': f"Harika gidiyorsun! Toplam {total_time} dakika odaklandın. Bu tempoyu bozma! 🚀"
            }

            return JsonResponse(response_data, status=200)

        except Exception as e:
            return JsonResponse({'error': f'Beklenmedik bir hata: {str(e)}'}, status=500)
    
    return JsonResponse({'error': 'Sadece GET istekleri kabul edilir!'}, status=405)


# Frontend'den gelen POST isteklerini engellememesi için CSRF korumasını esnetiyoruz:
@csrf_exempt 
def chat_with_ai(request):
    if request.method == 'POST':
        try:
            # frontendden gelen veri paketini (JSON) açıyoruz
            body_unicode = request.body.decode('utf-8')
            body_data = json.loads(body_unicode)
            
            # İçindeki "message" kutusunu alıyoruz (Eğer boşsa '' dönecek)
            user_message = body_data.get('message', '')

            if not user_message:
                return JsonResponse({"error": "Mesaj kısmı boş olamaz!"}, status=400)

            
            
            
            # Şimdilik Frontend'in (Sırdaş'ın) ekranı test edebilmesi için sahte (mock) bir AI cevabı dönüyoruz:
            ai_reply = f"Ben MonkMode Yapay Zekasıyım! Bana '{user_message}' dedin. Şimdi bahaneleri bırak ve hemen o kronometreyi başlat! 🚀"
            

            # Yapay zekanın cevabını Sırdaş'a (Frontend) JSON paketi olarak geri fırlatıyoruz
            return JsonResponse({
                "status": "success", 
                "reply": ai_reply
            }, status=200)

        except json.JSONDecodeError:
            # Eğer backend JSON formatını bozup gönderirse sistemi çökertmeden uyarı veriyoruz
            return JsonResponse({"error": "Gönderilen veri geçersiz, lütfen geçerli bir JSON formatı kullanın."}, status=400)

    # Biri bu kapıya POST yerine GET (veri çekme) isteğiyle gelirse kapıdan çevir
    return JsonResponse({"error": "Hatalı giriş! Bu kapıdan sadece POST metodu ile mesaj gönderilebilir."}, status=405)

# Google'dan sadece takvime etkinlik ekleme izni istiyoruz
SCOPES = ['https://www.googleapis.com/auth/calendar.events']

@csrf_exempt
def sync_calendar(request):
    """
    Yapay zekanın ürettiği çalışma planını GERÇEK Google Takvim'e aktaran ana köprü.
    """
    if request.method == 'POST':
        try:
            body_unicode = request.body.decode('utf-8')
            body_data = json.loads(body_unicode)
            plan_data = body_data.get('plan', [])

            if not plan_data:
                return JsonResponse({"error": "Plan verisi boş olamaz!"}, status=400)

            # --- 1. GOOGLE KİMLİK DOĞRULAMA (OAUTH) ---
            creds = None
            
            # Daha önce yetki verdiysek, o bileti (token) kullan
            if os.path.exists('token.json'):
                creds = Credentials.from_authorized_user_file('token.json', SCOPES)
            
            # Eğer geçerli bir bilet yoksa, İZİN EKRANINI AÇ!
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                else:
                    # İşte o meşhur izin ekranını bilgisayarında açacak olan satır:
                    flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
                    creds = flow.run_local_server(port=0)
                
                # Gelecek sefer sormaması için bileti kaydet
                with open('token.json', 'w') as token:
                    token.write(creds.to_json())

            # --- 2. TAKVİME GERÇEK VERİ YAZMA İŞLEMİ ---
            service = build('calendar', 'v3', credentials=creds)
            basarili_kayit = 0

            for task in plan_data:
                event = {
                  'summary': task.get('title', 'MonkMode Odak Seansı'),
                  'description': 'MonkMode AI Koçu tarafından planlandı. 🚀',
                  'start': {
                    'dateTime': task.get('start_time'), 
                    'timeZone': 'Europe/Istanbul',
                  },
                  'end': {
                    'dateTime': task.get('end_time'),
                    'timeZone': 'Europe/Istanbul',
                  },
                }
                # Google Takvime fırlat!
                service.events().insert(calendarId='primary', body=event).execute()
                basarili_kayit += 1

            return JsonResponse({
                "status": "success", 
                "message": f"Muazzam! {basarili_kayit} adet çalışma seansı GERÇEK Google Takviminize eklendi. ✅"
            }, status=200)

        except Exception as e:
            return JsonResponse({"error": f"Google ile bağlantı kurulamadı: {str(e)}"}, status=500)

    return JsonResponse({"error": "Sadece POST istekleri kabul edilir."}, status=405)

#dashborad api
@csrf_exempt
def get_dashboard_data(request):
    """
    HAFTA 7: Ana Ekran (Dashboard) Veri Paketi
    Veritabanındaki gerçek odaklanma sürelerini hesaplar ve Frontend'e fırlatır.
    """
    if request.method == 'GET':
        try:
            # 1. Veritabanındaki tüm seansların dakikalarını topla
            toplam_sure_sozlugu = FocusSession.objects.aggregate(Sum('duration_minutes'))
            toplam_dakika = toplam_sure_sozlugu['duration_minutes__sum']
            
            # Eğer veritabanı boşsa (henüz seans yoksa) hata vermesin, 0 dönsün
            if toplam_dakika is None:
                toplam_dakika = 0

            # 2. Şura'nın (AI) günün sözü için dinamik bir yapı
            if toplam_dakika == 0:
                ai_mesaji = "Daha hiç çalışmamışsın liderim! Başlamak için harika bir gün. 🚀"
            elif toplam_dakika > 100:
                ai_mesaji = "100 dakikayı devirdin! Muazzam bir odaklanma, böyle devam et! 🔥"
            else:
                ai_mesaji = f"Şu ana kadar {toplam_dakika} dakika odaklandın. Temponu bozma! 🧠"

            # 3. Paketi topla ve Sırdaş'a (Frontend) fırlat!
            dashboard_data = {
                "total_focus_minutes": toplam_dakika,
                "most_productive_category": "Backend Geliştirme",
                "active_streak_days": 1,
                "daily_ai_quote": ai_mesaji
            }
            
            return JsonResponse({"status": "success", "data": dashboard_data}, status=200)

        except Exception as e:
            return JsonResponse({"error": f"Veritabanı hatası: {str(e)}"}, status=500)
    
    return JsonResponse({"error": "Sadece GET istekleri kabul edilir."}, status=405)