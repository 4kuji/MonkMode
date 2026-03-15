import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import CustomUser

@csrf_exempt  # Şimdilik Postman gibi programlarla kolay test edelim diye güvenlik duvarını esnetiyoruz.
def register_user(request):
    # Sadece veri gönderme (POST) işlemlerini kabul et
    if request.method == 'POST':
        try:
            # Frontend'den gelen paketi (JSON) açıyoruz
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')

            # Kurallar: Email ve şifre boş olamaz!
            if not email or not password:
                return JsonResponse({'error': 'Email ve şifre zorunludur!'}, status=400)

            # Kurallar: Bu email daha önce alınmış mı?
            if CustomUser.objects.filter(email=email).exists():
                return JsonResponse({'error': 'Bu e-posta adresi zaten kayıtlı!'}, status=400)

            # Her şey yolundaysa kullanıcıyı veritabanına kaydet!
            # (create_user kullanıyoruz ki Django şifreyi gizli/kriptolu kaydetsin)
            user = CustomUser.objects.create_user(email=email, password=password)
            
            return JsonResponse({
                'message': 'Harika! Kullanıcı başarıyla oluşturuldu.', 
                'user_id': user.id
            }, status=201)

        except Exception as e:
            # Beklenmedik bir kaza olursa hatayı ekrana bas
            return JsonResponse({'error': f'Bir hata oluştu: {str(e)}'}, status=500)
    
    # Eğer birisi POST yerine GET atarsa (tarayıcıdan girmeye çalışırsa) kışkışla
    return JsonResponse({'error': 'Sadece POST istekleri kabul edilir!'}, status=405)

from .models import CustomUser, Category, FocusSession # Eğer Category ve FocusSession yukarıda ekli değilse, o satırı bununla güncelle.

@csrf_exempt
def save_session(request):
    if request.method == 'POST':
        try:
            # Frontend'den gelen kargoyu açıyoruz
            data = json.loads(request.body)
            
            # İçindeki bilgileri tek tek masaya diziyoruz
            user_id = data.get('user_id')
            category_id = data.get('category_id') # Hangi ders/konu?
            duration_minutes = data.get('duration_minutes')
            start_time = data.get('start_time')
            end_time = data.get('end_time')
            notes = data.get('notes', '') # Eğer not yazmamışsa boş string ('') kabul et

            # Güvenlik Kontrolü: Bu ID'lere sahip kullanıcı veya kategori gerçekten var mı?
            user = CustomUser.objects.get(id=user_id)
            category = Category.objects.get(id=category_id)

            # Her şey tamamsa veritabanına (FocusSession tablosuna) yapıştır!
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