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

