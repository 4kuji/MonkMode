import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import CustomUser, Category, FocusSession

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